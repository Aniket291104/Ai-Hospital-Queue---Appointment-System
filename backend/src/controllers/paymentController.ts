import { Response, NextFunction } from 'express';




















































import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Appointment from '../models/Appointment';
import { AuthRequest } from '../middlewares/authMiddleware';
import PDFDocument from 'pdfkit';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'MOCK_KEY_ID',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'MOCK_KEY_SECRET',
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/order
// @access  Private/Patient
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { appointmentId, amount } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      res.status(404);
      return next(new Error('Appointment not found'));
    }

    if (process.env.RAZORPAY_KEY_ID === 'MOCK_KEY_ID') {
      // Mock order creation for testing without credentials
      const mockOrderId = `order_mock_${Date.now()}`;
      const payment = await Payment.create({
        appointment: appointmentId,
        patient: req.user?._id,
        amount,
        razorpayOrderId: mockOrderId,
        status: 'Pending',
      });

      return res.status(201).json({
        success: true,
        orderId: mockOrderId,
        amount: amount * 100, // in paise
        currency: 'INR',
        keyId: 'MOCK_KEY_ID',
      });
    }

    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${appointmentId}`,
    };

    const order = await razorpay.orders.create(options);

    await Payment.create({
      appointment: appointmentId,
      patient: req.user?._id,
      amount,
      razorpayOrderId: order.id,
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Signature
// @route   POST /api/payments/verify
// @access  Private/Patient
export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  try {
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      res.status(404);
      return next(new Error('Order payment record not found'));
    }

    if (process.env.RAZORPAY_KEY_ID === 'MOCK_KEY_ID') {
      payment.status = 'Success';
      payment.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
      await payment.save();

      await Appointment.findByIdAndUpdate(payment.appointment, {
        paymentStatus: 'Paid',
      });

      return res.status(200).json({ success: true, message: 'Payment verified successfully (Mock Mode)' });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === razorpaySignature) {
      payment.status = 'Success';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      await payment.save();

      // Update appointment payment status
      await Appointment.findByIdAndUpdate(payment.appointment, {
        paymentStatus: 'Paid',
      });

      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      payment.status = 'Failed';
      await payment.save();
      res.status(400);
      next(new Error('Invalid payment signature verification failed'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Download PDF Invoice
// @route   GET /api/payments/invoice/:appointmentId
// @access  Private/Patient
export const downloadInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('patient', 'firstName lastName email')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .populate('hospital', 'name address city')
      .populate('department', 'name');

    if (!appointment) {
      res.status(404);
      return next(new Error('Appointment not found'));
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${appointment._id}.pdf`);

    doc.pipe(res);

    // Design Beautiful Invoice Layout
    doc.fillColor('#0f172a').fontSize(24).text('HospitalAI Invoice', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#475569');
    doc.text(`Invoice ID: INV-${appointment._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Status: ${appointment.paymentStatus.toUpperCase()}`);
    doc.moveDown(1);

    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 150).lineTo(550, 150).stroke();
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#0f172a').text('Patient Details', { underline: true });
    doc.fontSize(11).fillColor('#475569');
    doc.text(`Name: ${(appointment.patient as any).firstName} ${(appointment.patient as any).lastName}`);
    doc.text(`Email: ${(appointment.patient as any).email}`);
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#0f172a').text('Hospital & Consultation Details', { underline: true });
    doc.fontSize(11).fillColor('#475569');
    doc.text(`Hospital: ${(appointment.hospital as any).name}`);
    doc.text(`Department: ${(appointment.department as any).name}`);
    doc.text(`Doctor: Dr. ${(appointment.doctor as any).user.firstName} ${(appointment.doctor as any).user.lastName}`);
    doc.text(`Slot: ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot}`);
    doc.moveDown(1);

    doc.strokeColor('#cbd5e1').stroke();
    doc.moveDown(1);

    const docFee = (appointment.doctor as any)?.fees || 500;
    doc.fontSize(14).fillColor('#0f172a').text('Billing Summary');
    doc.fontSize(11).text(`Consultation Fee: INR ${docFee}.00`);
    doc.fontSize(12).fillColor('#1e40af').text(`Total Amount Paid: INR ${docFee}.00`, { bold: true } as any);

    doc.end();
  } catch (error) {
    next(error);
  }
};
