import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicineReminder extends Document {
  patient: mongoose.Types.ObjectId;
  medicineName: string;
  dosage: string;
  time: string; // e.g. "08:00 AM", "09:00 PM"
  days: string[]; // e.g. ["Monday", "Wednesday"]
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicineReminderSchema = new Schema<IMedicineReminder>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    days: [
      {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMedicineReminder>('MedicineReminder', medicineReminderSchema);
