import express from 'express';
import {
  getDoctors,
  getDoctorById,
  createDoctorProfile,
  updateDoctorProfile,
} from '../controllers/doctorController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router
  .route('/')
  .get(getDoctors)
  .post(protect, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), createDoctorProfile);

router
  .route('/:id')
  .get(getDoctorById)
  .put(protect, updateDoctorProfile);

export default router;
