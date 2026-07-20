import { Response, NextFunction } from 'express';
import Prescription from '../models/Prescription';
import { AuthRequest } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { UserRole } from '../models/User';

// @desc    Get all prescriptions for the logged-in patient
// @route   GET /api/prescriptions
// @access  Private
export const getPrescriptions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let query: any = {};
  
  if (req.user?.role === UserRole.PATIENT) {
    query.patient = req.user._id;
  }
  
  const prescriptions = await Prescription.find(query)
    .populate('patient', 'firstName lastName email')
    .populate({
      path: 'appointment',
      populate: { path: 'doctor', populate: { path: 'user', select: 'firstName lastName' } }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: prescriptions.length, data: prescriptions });
});

// @desc    Create a new prescription manually
// @route   POST /api/prescriptions
// @access  Private
export const createPrescription = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { appointmentId, patientId, medicines, instructions, imageUrl } = req.body;

  const targetPatient = req.user?.role === UserRole.PATIENT ? req.user._id : patientId;

  if (!targetPatient) {
    throw new ForbiddenError('Patient ID is required');
  }

  const prescription = await Prescription.create({
    appointment: appointmentId || undefined,
    patient: targetPatient,
    medicines,
    instructions,
    imageUrl,
  });

  res.status(201).json({ success: true, data: prescription });
});

// @desc    Update an existing prescription (e.g. edit OCR parsed results)
// @route   PUT /api/prescriptions/:id
// @access  Private
export const updatePrescription = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { medicines, instructions, imageUrl } = req.body;
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    throw new NotFoundError('Prescription not found');
  }

  // Check ownership unless admin/staff
  if (
    req.user?.role === UserRole.PATIENT &&
    prescription.patient.toString() !== req.user._id.toString()
  ) {
    throw new ForbiddenError('Not authorized to update this prescription');
  }

  if (medicines) prescription.medicines = medicines;
  if (instructions !== undefined) prescription.instructions = instructions;
  if (imageUrl) prescription.imageUrl = imageUrl;

  await prescription.save();

  res.status(200).json({ success: true, data: prescription });
});

// @desc    Delete a prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private
export const deletePrescription = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    throw new NotFoundError('Prescription not found');
  }

  // Check ownership
  if (
    req.user?.role === UserRole.PATIENT &&
    prescription.patient.toString() !== req.user._id.toString()
  ) {
    throw new ForbiddenError('Not authorized to delete this prescription');
  }

  await prescription.deleteOne();

  res.status(200).json({ success: true, message: 'Prescription deleted' });
});
