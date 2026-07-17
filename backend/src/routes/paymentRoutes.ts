import express from 'express';
import { createOrder, verifyPayment, downloadInvoice } from '../controllers/paymentController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/invoice/:appointmentId', protect, downloadInvoice);

export default router;
