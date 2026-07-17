import mongoose, { Document, Schema } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  departments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const hospitalSchema = new Schema<IHospital>(
  {
    name: {
      type: String,
      required: [true, 'Please add a hospital name'],
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    city: {
      type: String,
      required: [true, 'Please add a city'],
    },
    phone: {
      type: String,
      required: [true, 'Please add a contact phone number'],
    },
    email: {
      type: String,
      required: [true, 'Please add a contact email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    departments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IHospital>('Hospital', hospitalSchema);
