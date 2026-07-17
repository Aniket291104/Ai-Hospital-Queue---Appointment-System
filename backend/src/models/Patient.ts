import mongoose, { Document, Schema } from 'mongoose';

export interface IEmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface IPatient extends Document {
  user: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  weight?: number; // in kg
  height?: number; // in cm
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: IEmergencyContact;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    weight: {
      type: Number,
    },
    height: {
      type: Number,
    },
    allergies: [
      {
        type: String,
      },
    ],
    medicalHistory: [
      {
        type: String,
      },
    ],
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPatient>('Patient', patientSchema);
