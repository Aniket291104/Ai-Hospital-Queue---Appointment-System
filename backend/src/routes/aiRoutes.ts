import express from 'express';
import { triageSymptoms, analyzePrescription, chatAssistant } from '../controllers/aiController';
import { protect } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import {
  triageSymptomsSchema,
  analyzePrescriptionSchema,
  chatAssistantSchema,
} from '../validations/ai.validation';

const router = express.Router();

router.post('/triage', protect, validateRequest(triageSymptomsSchema), triageSymptoms);
router.post('/ocr', protect, validateRequest(analyzePrescriptionSchema), analyzePrescription);
router.post('/chat', validateRequest(chatAssistantSchema), chatAssistant);

export default router;
