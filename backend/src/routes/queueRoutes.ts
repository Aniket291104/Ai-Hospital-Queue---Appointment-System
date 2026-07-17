import express from 'express';
import {
  getQueueState,
  checkInPatient,
  callNextPatient,
  updateQueueStatus,
} from '../controllers/queueController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/doctor/:doctorId', getQueueState);
router.post('/check-in', protect, checkInPatient);
router.post('/doctor/:doctorId/next', protect, authorize(UserRole.DOCTOR), callNextPatient);
router.put('/doctor/:doctorId/status', protect, authorize(UserRole.DOCTOR), updateQueueStatus);

export default router;
