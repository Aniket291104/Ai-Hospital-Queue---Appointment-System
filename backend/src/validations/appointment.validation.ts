import { z } from 'zod';
import { AppointmentStatus } from '../models/Appointment';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const bookAppointmentSchema = {
  body: z.object({
    doctorId: objectIdSchema,
    hospitalId: objectIdSchema,
    departmentId: objectIdSchema,
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
    timeSlot: z.string().min(1, 'Time slot is required'),
    symptoms: z.string().optional(),
  }),
};

export const updateAppointmentStatusSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.nativeEnum(AppointmentStatus),
  }),
};
