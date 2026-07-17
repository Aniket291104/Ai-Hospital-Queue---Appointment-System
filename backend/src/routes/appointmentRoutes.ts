import express from 'express';
import {
  bookAppointment,
  getAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router
  .route('/')
  .post(protect, authorize(UserRole.PATIENT), bookAppointment)
  .get(protect, getAppointments);

router
  .route('/:id/status')
  .put(protect, authorize(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN), updateAppointmentStatus);

export default router;
