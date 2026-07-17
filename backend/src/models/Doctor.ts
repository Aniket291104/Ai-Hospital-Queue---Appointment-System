import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailabilitySlot {
  day: string; // e.g. 'Monday', 'Tuesday'
  startTime: string; // e.g. '09:00'
  endTime: string; // e.g. '17:00'
  isActive: boolean;
}

export interface IDoctor extends Document {
  user: mongoose.Types.ObjectId;
  hospital: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  specialization: string;
  experience: number; // in years
  bio: string;
  fees: number;
  averageConsultationTime: number; // in minutes (default e.g. 15)
  availability: IAvailabilitySlot[];
  isAvailableToday: boolean;
  rating: number;
  reviewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySlotSchema = new Schema<IAvailabilitySlot>({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const doctorSchema = new Schema<IDoctor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
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
    specialization: {
      type: String,
      required: [true, 'Please add specialization'],
    },
    experience: {
      type: Number,
      required: [true, 'Please add experience years'],
    },
    bio: {
      type: String,
    },
    fees: {
      type: Number,
      required: [true, 'Please add consultation fees'],
    },
    averageConsultationTime: {
      type: Number,
      default: 15, // default to 15 mins per patient
    },
    availability: [availabilitySlotSchema],
    isAvailableToday: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDoctor>('Doctor', doctorSchema);
