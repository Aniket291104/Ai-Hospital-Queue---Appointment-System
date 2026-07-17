import express from 'express';
import {
  getHospitals,
  getHospital,
  createHospital,
  updateHospital,
  deleteHospital,
  addDepartment,
  getDepartmentsByHospital,
} from '../controllers/hospitalController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router
  .route('/')
  .get(getHospitals)
  .post(protect, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), createHospital);

router
  .route('/:id')
  .get(getHospital)
  .put(protect, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), updateHospital)
  .delete(protect, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), deleteHospital);

router
  .route('/:hospitalId/departments')
  .get(getDepartmentsByHospital)
  .post(protect, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), addDepartment);

export default router;
