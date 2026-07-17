import mongoose, { Document, Schema } from 'mongoose';

export enum QueueStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  ENDED = 'Ended',
}

export interface IQueuePatient {
  appointment: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  token: string; // e.g. "D05"
  position: number;
  status: 'Waiting' | 'In-Consultation' | 'Completed' | 'Skipped';
  checkedInAt: Date;
}

export interface IQueue extends Document {
  doctor: mongoose.Types.ObjectId;
  hospital: mongoose.Types.ObjectId;
  date: Date;
  status: QueueStatus;
  currentToken?: string; // Currently being treated, e.g. "D04"
  patients: IQueuePatient[];
  estimatedDelay: number; // in minutes (e.g. if doctor is late)
  createdAt: Date;
  updatedAt: Date;
}

const queuePatientSchema = new Schema<IQueuePatient>({
  appointment: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Waiting', 'In-Consultation', 'Completed', 'Skipped'],
    default: 'Waiting',
  },
  checkedInAt: {
    type: Date,
    default: Date.now,
  },
});

const queueSchema = new Schema<IQueue>(
  {
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
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(QueueStatus),
      default: QueueStatus.ACTIVE,
    },
    currentToken: {
      type: String,
    },
    patients: [queuePatientSchema],
    estimatedDelay: {
      type: Number,
      default: 0, // Delay in minutes
    },
  },
  {
    timestamps: true,
  }
);

// Ensure there is only one queue per doctor per day
queueSchema.index({ doctor: 1, date: 1 }, { unique: true });

export default mongoose.model<IQueue>('Queue', queueSchema);
