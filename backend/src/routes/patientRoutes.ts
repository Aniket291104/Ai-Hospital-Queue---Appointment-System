import express from 'express';
import {
  getPatientProfile,
  updatePatientProfile,
  getPatientById,
} from '../controllers/patientController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router
  .route('/profile')
  .get(protect, getPatientProfile)
  .put(protect, updatePatientProfile);

router
  .route('/:id')
  .get(protect, authorize(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN), getPatientById);

export default router;
