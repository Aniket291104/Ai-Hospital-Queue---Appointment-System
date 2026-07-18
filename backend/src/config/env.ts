import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/hospitalai'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().default('your_jwt_secret_key_change_in_production'),
  JWT_REFRESH_SECRET: z.string().default('your_jwt_refresh_secret_key_change_in_production'),
  JWT_EXPIRE: z.string().default('1d'),
  JWT_REFRESH_EXPIRE: z.string().default('7d'),
  DOCTOR_ACCESS_KEY: z.string().default('doctor_secret_key'),
  RECEPTIONIST_ACCESS_KEY: z.string().default('receptionist_secret_key'),
  ADMIN_ACCESS_KEY: z.string().default('admin_secret_key'),
  SUPER_ADMIN_ACCESS_KEY: z.string().default('super_admin_secret_key'),
  CLOUDINARY_CLOUD_NAME: z.string().default('your_cloudinary_name'),
  CLOUDINARY_API_KEY: z.string().default('your_cloudinary_api_key'),
  CLOUDINARY_API_SECRET: z.string().default('your_cloudinary_api_secret'),
  GEMINI_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().default('your_twilio_sid'),
  TWILIO_AUTH_TOKEN: z.string().default('your_twilio_auth_token'),
  TWILIO_PHONE_NUMBER: z.string().default('your_twilio_phone'),
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string().default('your_email@gmail.com'),
  EMAIL_PASS: z.string().default('your_email_app_password'),
  RAZORPAY_KEY_ID: z.string().default('your_razorpay_key_id'),
  RAZORPAY_KEY_SECRET: z.string().default('your_razorpay_key_secret'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
