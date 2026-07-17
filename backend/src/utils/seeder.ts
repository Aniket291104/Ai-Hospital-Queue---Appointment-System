import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/User';
import Hospital from '../models/Hospital';
import Department from '../models/Department';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import connectDB from '../config/db';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Hospital.deleteMany();
    await Department.deleteMany();
    await Doctor.deleteMany();
    await Patient.deleteMany();

    console.log('Data Cleared...');

    // 1. Create Hospitals
    const hospital = await Hospital.create({
      name: 'City Central Hospital',
      address: '102 Healthcare Avenue',
      city: 'Delhi',
      phone: '+919999999999',
      email: 'contact@citycentral.com',
    });

    console.log('Hospital Created...');

    // 2. Create Departments
    const deptCardio = await Department.create({
      name: 'Cardiology',
      description: 'Heart and cardiovascular care.',
      hospital: hospital._id as mongoose.Types.ObjectId,
    });

    const deptNeuro = await Department.create({
      name: 'Neurology',
      description: 'Brain, spine, and nerve disorders.',
      hospital: hospital._id as mongoose.Types.ObjectId,
    });

    const deptGeneral = await Department.create({
      name: 'General Medicine',
      description: 'Primary healthcare checkups.',
      hospital: hospital._id as mongoose.Types.ObjectId,
    });

    hospital.departments.push(
      deptCardio._id as mongoose.Types.ObjectId,
      deptNeuro._id as mongoose.Types.ObjectId,
      deptGeneral._id as mongoose.Types.ObjectId
    );
    await hospital.save();

    console.log('Departments Created...');

    // 3. Create Users
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@hospitalai.com',
      password: 'password123',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    });

    const docUser1 = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'dr.john@hospitalai.com',
      password: 'password123',
      role: UserRole.DOCTOR,
      isEmailVerified: true,
    });

    const docUser2 = await User.create({
      firstName: 'Sarah',
      lastName: 'Smith',
      email: 'dr.sarah@hospitalai.com',
      password: 'password123',
      role: UserRole.DOCTOR,
      isEmailVerified: true,
    });

    const patientUser = await User.create({
      firstName: 'Jane',
      lastName: 'Patient',
      email: 'patient@hospitalai.com',
      password: 'password123',
      role: UserRole.PATIENT,
      isEmailVerified: true,
    });

    console.log('Users Created...');

    // 4. Create Doctor Profiles
    await Doctor.create({
      user: docUser1._id as mongoose.Types.ObjectId,
      hospital: hospital._id as mongoose.Types.ObjectId,
      department: deptCardio._id as mongoose.Types.ObjectId,
      specialization: 'Cardiologist',
      experience: 12,
      bio: 'Expert in interventional cardiology and cardiovascular disease prevention.',
      fees: 800,
      averageConsultationTime: 15,
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '13:00', isActive: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '13:00', isActive: true },
      ],
    });

    await Doctor.create({
      user: docUser2._id as mongoose.Types.ObjectId,
      hospital: hospital._id as mongoose.Types.ObjectId,
      department: deptNeuro._id as mongoose.Types.ObjectId,
      specialization: 'Neurologist',
      experience: 8,
      bio: 'Specializes in headaches, neuro-immunology, and movement disorders.',
      fees: 1000,
      averageConsultationTime: 20,
      availability: [
        { day: 'Tuesday', startTime: '10:00', endTime: '16:00', isActive: true },
        { day: 'Thursday', startTime: '10:00', endTime: '16:00', isActive: true },
      ],
    });

    console.log('Doctor Profiles Created...');

    // 5. Create Patient Profile
    await Patient.create({
      user: patientUser._id as mongoose.Types.ObjectId,
      dateOfBirth: new Date('1995-05-15'),
      gender: 'Female',
      bloodGroup: 'O+',
      weight: 60,
      height: 165,
      allergies: ['Penicillin'],
      medicalHistory: ['Mild Asthma'],
      emergencyContact: {
        name: 'John Patient',
        relation: 'Spouse',
        phone: '+919876543210',
      },
    });

    console.log('Patient Profile Created...');
    console.log('Seed Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedData();
