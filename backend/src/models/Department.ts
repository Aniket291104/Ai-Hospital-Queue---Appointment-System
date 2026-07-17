import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description: string;
  hospital: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Please add a department name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    hospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Allow duplicate department names across DIFFERENT hospitals, but unique per hospital
departmentSchema.index({ name: 1, hospital: 1 }, { unique: true });

export default mongoose.model<IDepartment>('Department', departmentSchema);
