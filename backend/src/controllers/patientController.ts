import { Response, NextFunction } from 'express';
import Patient from '../models/Patient';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Get patient profile (current logged in user)
// @route   GET /api/patients/profile
// @access  Private/Patient
export const getPatientProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let patient = await Patient.findOne({ user: req.user?._id }).populate('user', 'firstName lastName email phone avatar');

    if (!patient) {
      // If user is a patient but doesn't have a profile doc, create a blank one
      patient = await Patient.create({
        user: req.user?._id,
      });
      patient = await patient.populate('user', 'firstName lastName email phone avatar');
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/profile
// @access  Private/Patient
export const updatePatientProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { dateOfBirth, gender, bloodGroup, weight, height, allergies, medicalHistory, emergencyContact } = req.body;

  try {
    let patient = await Patient.findOne({ user: req.user?._id });

    if (!patient) {
      patient = new Patient({ user: req.user?._id });
    }

    patient.dateOfBirth = dateOfBirth || patient.dateOfBirth;
    patient.gender = gender || patient.gender;
    patient.bloodGroup = bloodGroup || patient.bloodGroup;
    patient.weight = weight || patient.weight;
    patient.height = height || patient.height;
    patient.allergies = allergies || patient.allergies;
    patient.medicalHistory = medicalHistory || patient.medicalHistory;
    patient.emergencyContact = emergencyContact || patient.emergencyContact;

    await patient.save();
    await patient.populate('user', 'firstName lastName email phone avatar');

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient by ID (Admin, Doctor, Receptionist)
// @route   GET /api/patients/:id
// @access  Private/Staff
export const getPatientById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('user', 'firstName lastName email phone avatar');
    if (!patient) {
      res.status(404);
      return next(new Error('Patient not found'));
    }
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};
