import { Request, Response, NextFunction } from 'express';
import Doctor from '../models/Doctor';
import User, { UserRole } from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Get all doctors with filters
// @route   GET /api/doctors
// @access  Public
export const getDoctors = async (req: Request, res: Response, next: NextFunction) => {
  const { search, specialization, hospital, department } = req.query;

  try {
    const query: any = {};

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    if (hospital) {
      query.hospital = hospital;
    }

    if (department) {
      query.department = department;
    }

    let doctors = await Doctor.find(query)
      .populate({
        path: 'user',
        select: 'firstName lastName email phone avatar role',
      })
      .populate('hospital', 'name address city')
      .populate('department', 'name');

    // Handle search query across doctor user names
    if (search) {
      const searchStr = String(search).toLowerCase();
      doctors = doctors.filter((doc: any) => {
        if (!doc.user) return false;
        const fullName = `${doc.user.firstName} ${doc.user.lastName}`.toLowerCase();
        return fullName.includes(searchStr) || doc.specialization.toLowerCase().includes(searchStr);
      });
    }

    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor profile
// @route   GET /api/doctors/:id
// @access  Public
export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'firstName lastName email phone avatar role',
      })
      .populate('hospital', 'name address city')
      .populate('department', 'name');

    if (!doctor) {
      res.status(404);
      return next(new Error('Doctor not found'));
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

// @desc    Create doctor profile
// @route   POST /api/doctors
// @access  Private/Admin
export const createDoctorProfile = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, hospital, department, specialization, experience, bio, fees, availability } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (user.role !== UserRole.DOCTOR) {
      user.role = UserRole.DOCTOR;
      await user.save();
    }

    const doctorExists = await Doctor.findOne({ user: userId });
    if (doctorExists) {
      res.status(400);
      return next(new Error('Doctor profile already exists for this user'));
    }

    const doctor = await Doctor.create({
      user: userId,
      hospital,
      department,
      specialization,
      experience,
      bio,
      fees,
      availability: availability || [],
    });

    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/:id
// @access  Private/Doctor/Admin
export const updateDoctorProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      res.status(404);
      return next(new Error('Doctor profile not found'));
    }

    // Check permissions (Only the doctor themselves or Admin can update)
    if (req.user?.role !== UserRole.ADMIN && doctor.user.toString() !== req.user?._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to update this profile'));
    }

    doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('user', 'firstName lastName email avatar');

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};
