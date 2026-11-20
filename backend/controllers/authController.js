const User = require('../models/User');
const { sendTokenResponse } = require('../utils/tokenUtils');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const { getProgressSummary } = require('../services/progressService');

// ─── Register ────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return errorResponse(res, 'Email already registered', 409);
    }

    // Create user — password is hashed by the pre-save hook in User.js
    const user = await User.create({ name, email, password });

    sendTokenResponse(user, 201, res, await getProgressSummary(user._id));
  } catch (error) {
    next(error);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it's select: false in schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    sendTokenResponse(user, 200, res, await getProgressSummary(user._id));
  } catch (error) {
    next(error);
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
const logout = (req, res) => {
  // Clear the JWT cookie
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  return successResponse(res, null, 'Logged out successfully');
};

// ─── Get Profile ─────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const progress = await getProgressSummary(user._id);
    return successResponse(res, { ...user.toJSON(), ...progress }, 'Profile fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    let changed = false;

    ['name', 'avatar'].forEach((field) => {
      if (req.body[field] !== undefined) {
        user.set(field, req.body[field]);
        changed = true;
      }
    });

    const settingFields = ['dailyGoal', 'weeklyGoal', 'monthlyGoal'];
    for (const field of settingFields) {
      const value = req.body.settings?.[field];
      if (value === undefined) continue;

      const target = Number(value);
      if (!Number.isInteger(target) || target < 1) {
        return errorResponse(res, `${field} must be a whole number greater than zero`, 400);
      }
      user.set(`settings.${field}`, target);
      changed = true;
    }

    const profileUrls = {
      leetcode: (username) => `https://leetcode.com/${encodeURIComponent(username)}/`,
      github: (username) => `https://github.com/${encodeURIComponent(username)}`,
      codeforces: (username) => `https://codeforces.com/profile/${encodeURIComponent(username)}`,
      gfg: (username) => `https://auth.geeksforgeeks.org/user/${encodeURIComponent(username)}`,
      hackerrank: (username) => `https://www.hackerrank.com/${encodeURIComponent(username)}`,
    };
    for (const [platform, makeUrl] of Object.entries(profileUrls)) {
      const username = req.body.codingProfiles?.[platform]?.username;
      if (username === undefined) continue;
      if (typeof username !== 'string' || username.trim().length > 100) {
        return errorResponse(res, `Invalid ${platform} username`, 400);
      }

      const cleanedUsername = username.trim();
      user.set(`codingProfiles.${platform}.username`, cleanedUsername);
      user.set(`codingProfiles.${platform}.url`, cleanedUsername ? makeUrl(cleanedUsername) : '');
      changed = true;
    }

    if (!changed) {
      return errorResponse(res, 'No valid profile fields provided', 400);
    }

    await user.save();

    const progress = await getProgressSummary(user._id);
    return successResponse(res, { ...user.toJSON(), ...progress }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getProfile, updateProfile };
