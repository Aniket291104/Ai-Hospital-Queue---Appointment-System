import express from 'express';
import {
  getPrescriptions,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescriptionController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router
  .route('/')
  .get(protect, getPrescriptions)
  .post(protect, createPrescription);

router
  .route('/:id')
  .put(protect, updatePrescription)
  .delete(protect, deletePrescription);

export default router;
