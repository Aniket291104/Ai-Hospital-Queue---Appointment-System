import { Request, Response, NextFunction } from 'express';
import User, { UserRole } from '../models/User';
import Otp from '../models/Otp';
import generateToken from '../utils/generateToken';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail';

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, password, phone, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists'));
    }

    // Role-based security validation
    if (role && role !== UserRole.PATIENT) {
      const { staffAccessKey } = req.body;
      const validKey = process.env.STAFF_ACCESS_KEY || 'hospital_staff_secret_key';
      if (staffAccessKey !== validKey) {
        res.status(403);
        return next(new Error('Unauthorized role registration. Valid Staff Access Key is required.'));
      }
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: role || UserRole.PATIENT,
      isEmailVerified: false,
    });

    // Generate OTP
    const otpCode = generateOTP();
    await Otp.create({ email, otp: otpCode });

    // Send verification email via SMTP
    try {
      await sendEmail(
        email,
        'HospitalAI Verification Code',
        `Welcome to HospitalAI! Your verification OTP code is: ${otpCode}. Valid for 10 minutes.`
      );
      console.log(`[OTP] Sent verification OTP code: ${otpCode} to ${email}`);
    } catch (err: any) {
      console.error(`[SMTP Error] Failed to send email: ${err.message}`);
      // Don't fail registration process if SMTP credentials are just misconfigured, print to logs
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. OTP sent to your email.',
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      res.status(400);
      return next(new Error('Invalid OTP or expired'));
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    user.isEmailVerified = true;
    await user.save();
    await Otp.deleteMany({ email }); // Clear active OTPs

    const tokens = generateToken(res, user._id.toString());

    res.status(200).json({
      success: true,
      token: tokens.token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    if (!user.isEmailVerified) {
      // Re-send OTP
      const otpCode = generateOTP();
      await Otp.deleteMany({ email });
      await Otp.create({ email, otp: otpCode });
      
      try {
        await sendEmail(
          email,
          'HospitalAI Verification Code',
          `Your verification OTP code is: ${otpCode}. Valid for 10 minutes.`
        );
        console.log(`[OTP] Sent verification OTP code: ${otpCode} to ${email}`);
      } catch (err: any) {
        console.error(`[SMTP Error] Failed to send email: ${err.message}`);
      }

      res.status(403).json({
        success: false,
        message: 'Email not verified. Another OTP code has been sent.',
        email: user.email,
        isEmailVerified: false,
      });
      return;
    }

    const tokens = generateToken(res, user._id.toString());

    res.status(200).json({
      success: true,
      token: tokens.token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth login/register callback handler
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { googleId, email, firstName, lastName, avatar } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        googleId,
        avatar: avatar || 'default.jpg',
        isEmailVerified: true, // Google accounts are pre-verified
        role: UserRole.PATIENT,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.isEmailVerified = true;
      await user.save();
    }

    const tokens = generateToken(res, user._id.toString());

    res.status(200).json({
      success: true,
      token: tokens.token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    res.status(401);
    return next(new Error('Refresh token not provided'));
  }

  try {
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401);
      return next(new Error('Invalid refresh token'));
    }

    const tokens = generateToken(res, user._id.toString());

    res.status(200).json({
      success: true,
      token: tokens.token,
    });
  } catch (error) {
    res.status(401);
    return next(new Error('Refresh token expired or invalid'));
  }
};

// @desc    Logout user & clear cookies
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Request Password Reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      return next(new Error('User not found with this email'));
    }

    // Generate reset OTP
    const resetOtp = generateOTP();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: resetOtp });

    try {
      await sendEmail(
        email,
        'HospitalAI Password Reset Code',
        `You requested a password reset. Your OTP verification code is: ${resetOtp}. Valid for 10 minutes.`
      );
      console.log(`[Forgot Password] Sent OTP: ${resetOtp} to ${email}`);
    } catch (err: any) {
      console.error(`[SMTP Error] Forgot Password failed: ${err.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp, newPassword } = req.body;

  try {
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      res.status(400);
      return next(new Error('Invalid or expired OTP code'));
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    user.password = newPassword;
    await user.save();
    await Otp.deleteMany({ email }); // Delete active OTPs

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
