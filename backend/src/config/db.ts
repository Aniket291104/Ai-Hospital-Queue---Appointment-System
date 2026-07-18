import mongoose from 'mongoose';
import { env } from './env';
import logger from '../utils/logger';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error('MongoDB Connection Error', error);
    process.exit(1);
  }
};

export default connectDB;
