import express from 'express';
import { triageSymptoms, analyzePrescription, chatAssistant } from '../controllers/aiController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/triage', protect, triageSymptoms);
router.post('/ocr', protect, analyzePrescription);
router.post('/chat', chatAssistant);

export default router;
