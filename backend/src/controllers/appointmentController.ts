import { Response, NextFunction } from 'express';
import Appointment, { AppointmentStatus, AppointmentPriority } from '../models/Appointment';
import Doctor from '../models/Doctor';
import { UserRole } from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError, NotFoundError } from '../utils/errors';

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private/Patient
export const bookAppointment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { doctorId, hospitalId, departmentId, date, timeSlot, symptoms, priority, aiRecommendation } = req.body;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  // Check if slot already booked
  const slotBooked = await Appointment.findOne({
    doctor: doctorId,
    date: new Date(date),
    timeSlot,
    status: { $ne: AppointmentStatus.CANCELLED },
  });

  if (slotBooked) {
    throw new BadRequestError('This time slot is already booked');
  }

  const appointment = await Appointment.create({
    patient: req.user?._id,
    doctor: doctorId,
    hospital: hospitalId,
    department: departmentId,
    date: new Date(date),
    timeSlot,
    symptoms,
    priority: priority || AppointmentPriority.REGULAR,
    aiRecommendation,
  });

  res.status(201).json({ success: true, data: appointment });
});

// @desc    Get all appointments (Filtered by role)
// @route   GET /api/appointments
// @access  Private
export const getAppointments = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let query: any = {};

  if (req.user?.role === UserRole.PATIENT) {
    query.patient = req.user._id;
  } else if (req.user?.role === UserRole.DOCTOR) {
    // Find doctor profile first
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (doctor) {
      query.doctor = doctor._id;
    }
  }

  const appointments = await Appointment.find(query)
    .populate('patient', 'firstName lastName email phone')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName avatar' },
    })
    .populate('hospital', 'name')
    .populate('department', 'name')
    .sort({ date: 1, timeSlot: 1 });

  res.status(200).json({ success: true, count: appointments.length, data: appointments });
});

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private/Staff
export const updateAppointmentStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status, paymentStatus } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  if (status) appointment.status = status;
  if (paymentStatus) appointment.paymentStatus = paymentStatus;
  
  await appointment.save();

  res.status(200).json({ success: true, data: appointment });
});
