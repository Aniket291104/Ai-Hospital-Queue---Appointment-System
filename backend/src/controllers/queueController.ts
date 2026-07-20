import { Request, Response, NextFunction } from 'express';
import Queue, { QueueStatus } from '../models/Queue';
import Appointment, { AppointmentStatus, AppointmentPriority } from '../models/Appointment';
import Doctor from '../models/Doctor';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { io } from '../index';

// Helper to get today's start date
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Helper to get fully populated queue state
const getFullyPopulatedQueue = async (doctorId: string, date: Date) => {
  return Queue.findOne({ doctor: doctorId, date })
    .populate('doctor')
    .populate({
      path: 'patients.user',
      select: 'firstName lastName email avatar',
    })
    .populate({
      path: 'patients.appointment',
      select: 'priority symptoms aiRecommendation',
    });
};

// @desc    Get queue state for a doctor
// @route   GET /api/queues/doctor/:doctorId
// @access  Public
export const getQueueState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = getTodayDate();
    const docId = req.params.doctorId as string;
    let queue = await getFullyPopulatedQueue(docId, today);

    if (!queue) {
      const doctorProfile = await Doctor.findById(docId);
      if (!doctorProfile) {
        res.status(404);
        return next(new Error('Doctor not found'));
      }

      queue = await Queue.create({
        doctor: docId as any,
        hospital: doctorProfile.hospital,
        date: today,
        status: QueueStatus.ACTIVE,
        patients: [],
        estimatedDelay: 0,
      });

      // Fetch again to ensure populated format
      queue = await getFullyPopulatedQueue(docId, today);
    }

    res.status(200).json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in patient to join queue
// @route   POST /api/queues/check-in
// @access  Private/Staff (Receptionist) or QR check-in (Patient)
export const checkInPatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { appointmentId } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId).populate('doctor');
    if (!appointment) {
      res.status(404);
      return next(new Error('Appointment not found'));
    }

    if (appointment.status === AppointmentStatus.CHECKED_IN) {
      res.status(400);
      return next(new Error('Patient already checked in'));
    }

    const today = getTodayDate();
    const doctorProfile: any = appointment.doctor;

    let queue = await Queue.findOne({ doctor: doctorProfile._id, date: today });
    if (!queue) {
      queue = await Queue.create({
        doctor: doctorProfile._id,
        hospital: appointment.hospital,
        date: today,
        status: QueueStatus.ACTIVE,
        patients: [],
        estimatedDelay: 0,
      });
    }

    // Generate Token (e.g., D-101, etc.)
    const tokenPrefix = doctorProfile.specialization ? doctorProfile.specialization.substring(0, 1).toUpperCase() : 'P';
    const queueNum = queue.patients.length + 1;
    const token = `${tokenPrefix}-${100 + queueNum}`;

    // Calculate position and estimated waiting time
    const waitingPatients = queue.patients.filter(p => p.status === 'Waiting').length;
    const avgConsultTime = doctorProfile.averageConsultationTime || 15;
    const estWaitingTime = (waitingPatients * avgConsultTime) + queue.estimatedDelay;

    const queuePatient = {
      appointment: appointment._id as any,
      user: appointment.patient,
      token,
      position: queue.patients.length + 1,
      status: 'Waiting' as const,
      checkedInAt: new Date(),
    };

    queue.patients.push(queuePatient);
    await queue.save();

    // Update appointment
    appointment.status = AppointmentStatus.CHECKED_IN;
    appointment.queueToken = token;
    appointment.queuePosition = queuePatient.position;
    appointment.estimatedWaitingTime = estWaitingTime;
    await appointment.save();

    // Emit socket update for real-time tracking
    io.emit(`queue-update-${doctorProfile._id}`, queue);

    res.status(200).json({
      success: true,
      message: 'Checked-in successfully',
      data: {
        token,
        position: queuePatient.position,
        estimatedWaitingTime: estWaitingTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Call next patient in queue
// @route   POST /api/queues/doctor/:doctorId/next
// @access  Private/Doctor
export const callNextPatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = getTodayDate();
    const doctorId = req.params.doctorId as string;
    const queue = await Queue.findOne({ doctor: doctorId, date: today });

    if (!queue) {
      res.status(404);
      return next(new Error('Active queue not found for today'));
    }

    // Complete the current patient in-consultation, if any
    const activePatient = queue.patients.find(p => p.status === 'In-Consultation');
    if (activePatient) {
      activePatient.status = 'Completed';
      await Appointment.findByIdAndUpdate(activePatient.appointment, { status: AppointmentStatus.COMPLETED });
    }

    // Find the next waiting patient
    const nextPatient = queue.patients.find(p => p.status === 'Waiting');
    if (!nextPatient) {
      queue.currentToken = 'None';
      await queue.save();
      const populatedQueue = await getFullyPopulatedQueue(doctorId, today);
      io.emit(`queue-update-${doctorId}`, populatedQueue);
      return res.status(200).json({ success: true, message: 'No more patients in the queue', data: populatedQueue });
    }

    nextPatient.status = 'In-Consultation';
    queue.currentToken = nextPatient.token;

    // Shift positions of other waiting patients and calculate remaining waiting times
    const doctorProfile = await Doctor.findById(doctorId);
    const avgConsultTime = doctorProfile?.averageConsultationTime || 15;

    let waitIndex = 0;
    for (const p of queue.patients) {
      if (p.status === 'Waiting') {
        const estWaitingTime = (waitIndex * avgConsultTime) + queue.estimatedDelay;
        await Appointment.findByIdAndUpdate(p.appointment, {
          queuePosition: waitIndex + 1,
          estimatedWaitingTime: estWaitingTime,
        });
        waitIndex++;
      }
    }

    await queue.save();

    const populatedQueue = await getFullyPopulatedQueue(doctorId, today);

    // Trigger real-time update
    io.emit(`queue-update-${doctorId}`, populatedQueue);

    res.status(200).json({ success: true, message: `Calling patient token ${nextPatient.token}`, data: populatedQueue });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delay or pause queue
// @route   PUT /api/queues/doctor/:doctorId/status
// @access  Private/Doctor
export const updateQueueStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status, estimatedDelay } = req.body;

  try {
    const today = getTodayDate();
    const doctorId = req.params.doctorId as string;
    const queue = await Queue.findOne({ doctor: doctorId, date: today });

    if (!queue) {
      res.status(404);
      return next(new Error('Queue not found for today'));
    }

    if (status) queue.status = status;
    if (estimatedDelay !== undefined) queue.estimatedDelay = estimatedDelay;

    await queue.save();

    // Recalculate waiting times for all waiting patients and update their appointments
    const doctorProfile = await Doctor.findById(doctorId);
    const avgConsultTime = doctorProfile?.averageConsultationTime || 15;

    let waitIndex = 0;
    for (const p of queue.patients) {
      if (p.status === 'Waiting') {
        const estWaitingTime = (waitIndex * avgConsultTime) + queue.estimatedDelay;
        await Appointment.findByIdAndUpdate(p.appointment, {
          estimatedWaitingTime: estWaitingTime,
        });
        waitIndex++;
      }
    }

    const populatedQueue = await getFullyPopulatedQueue(doctorId, today);

    // Emit event
    io.emit(`queue-update-${doctorId}`, populatedQueue);

    res.status(200).json({ success: true, data: populatedQueue });
  } catch (error) {
    next(error);
  }
};
