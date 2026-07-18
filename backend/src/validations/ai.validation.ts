import { z } from 'zod';

export const triageSymptomsSchema = {
  body: z.object({
    symptoms: z.string().min(3, 'Symptoms description must be at least 3 characters long'),
  }),
};

export const analyzePrescriptionSchema = {
  body: z.object({
    image: z.string().min(1, 'Base64 image is required'),
  }),
};

export const chatAssistantSchema = {
  body: z.object({
    message: z.string().min(1, 'Message is required'),
    history: z.array(
      z.object({
        role: z.enum(['user', 'model', 'doctor']),
        content: z.string().min(1, 'Message content cannot be empty'),
      })
    ).optional(),
  }),
};
