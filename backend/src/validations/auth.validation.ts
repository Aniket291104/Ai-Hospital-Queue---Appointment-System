import { z } from 'zod';

export const registerUserSchema = {
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters long'),
    role: z.enum(['Patient', 'Doctor', 'Receptionist', 'Admin', 'SuperAdmin']).optional(),
    staffAccessKey: z.string().optional(),
    specialization: z.string().optional(),
    experience: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
    fees: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
    bio: z.string().optional(),
    hospital: z.string().optional(),
    department: z.string().optional(),
  }),
};

export const loginUserSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const verifyOtpSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits long'),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits long'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
};
