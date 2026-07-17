import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital';
import Department from '../models/Department';

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Public
export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await Hospital.find().populate('departments');
    res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hospital
// @route   GET /api/hospitals/:id
// @access  Public
export const getHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await Hospital.findById(req.params.id).populate('departments');
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a hospital
// @route   POST /api/hospitals
// @access  Private/Admin
export const createHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private/Admin
export const updateHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Admin
export const deleteHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }
    
    // Delete associated departments
    await Department.deleteMany({ hospital: hospital._id });
    await hospital.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// ================= DEPARTMENTS =================

// @desc    Add department to hospital
// @route   POST /api/hospitals/:hospitalId/departments
// @access  Private/Admin
export const addDepartment = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description } = req.body;
  const { hospitalId } = req.params;

  try {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }

    const department = await Department.create({
      name,
      description,
      hospital: hospitalId as any,
    });

    hospital.departments.push((department as any)._id);
    await hospital.save();

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

// @desc    Get departments of a hospital
// @route   GET /api/hospitals/:hospitalId/departments
// @access  Public
export const getDepartmentsByHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await Department.find({ hospital: req.params.hospitalId });
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    next(error);
  }
};
