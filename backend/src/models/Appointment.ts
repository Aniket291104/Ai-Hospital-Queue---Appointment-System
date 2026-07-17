import mongoose, { Document, Schema } from 'mongoose';

export enum AppointmentStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  CHECKED_IN = 'CheckedIn',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum AppointmentPriority {
  REGULAR = 'Regular',
  PRIORITY = 'Priority',
  EMERGENCY = 'Emergency',
}

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  hospital: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  date: Date;
  timeSlot: string; // e.g. "09:30 AM"
  status: AppointmentStatus;
  priority: AppointmentPriority;
  symptoms?: string;
  aiRecommendation?: {
    suggestedDoctor?: string;
    priorityReasoning?: string;
  };
  queueToken?: string; // Generated upon check-in, e.g. "D05"
  queuePosition?: number;
  estimatedWaitingTime?: number; // In minutes
  paymentStatus: 'Pending' | 'Paid' | 'Refunded';
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    hospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(AppointmentPriority),
      default: AppointmentPriority.REGULAR,
    },
    symptoms: {
      type: String,
    },
    aiRecommendation: {
      suggestedDoctor: String,
      priorityReasoning: String,
    },
    queueToken: {
      type: String,
    },
    queuePosition: {
      type: Number,
    },
    estimatedWaitingTime: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending',
    },
    paymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
