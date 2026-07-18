import { Response, NextFunction } from 'express';
import { recommendAppointmentDetails, ocrPrescriptionImage, chatHealthAssistant } from '../services/aiService';
import Prescription from '../models/Prescription';
import { AuthRequest } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

// @desc    Triage symptoms to get department & priority recommendations
// @route   POST /api/ai/triage
// @access  Private
export const triageSymptoms = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { symptoms } = req.body;
  const recommendation = await recommendAppointmentDetails(symptoms);
  res.status(200).json({ success: true, data: recommendation });
});

// @desc    Analyze prescription image using OCR & extract medicines
// @route   POST /api/ai/ocr
// @access  Private
export const analyzePrescription = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { image } = req.body; // Base64 image string

  const medicines = await ocrPrescriptionImage(image);

  // Automatically save to database for the logged-in patient
  const prescription = await Prescription.create({
    patient: req.user?._id,
    medicines,
    instructions: 'Extracted automatically via HospitalAI OCR Engine.',
  });

  res.status(201).json({
    success: true,
    message: 'Prescription extracted & saved successfully.',
    data: prescription,
  });
});

// @desc    Chat with Gemini Health Assistant
// @route   POST /api/ai/chat
// @access  Public
export const chatAssistant = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { message, history } = req.body;
  const reply = await chatHealthAssistant(message, history || []);
  res.status(200).json({ success: true, data: reply });
});
