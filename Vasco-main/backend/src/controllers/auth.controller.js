const { User, UserProfile } = require("../models");
const { Op } = require("sequelize");
const { hashPassword, comparePassword } = require("../utils/hash");
const { signToken } = require("../utils/jwt");
const { isEmail } = require("../utils/validators");
const response = require("../utils/response");

module.exports = {
  // =====================================================
  // 1. REGISTER
  // =====================================================
  register: async (req, res) => {
    try {
      const { username, full_name, display_name, email, password } = req.body;

      // For this project we expect username + email + password
      if (!email || !password || !username) {
        return response.error(res, "Missing required fields: username, email, password", 400);
      }
      console.log('Register payload:', { username, full_name, display_name, email });

      if (!isEmail(email))
        return response.error(res, "Invalid email", 400);

      const existingByEmail = await User.findOne({ where: { email } });
      if (existingByEmail) return response.error(res, "Email already exists", 409);
      const existingByUsername = await User.findOne({ where: { username } });
      if (existingByUsername) return response.error(res, "Username already exists", 409);

      const hashed = await hashPassword(password);

      let user;
      try {
        user = await User.create({
          username,
          full_name: full_name || display_name || username,
          email,
          password: hashed,
          role: "user",
          status: "active",
          last_active: new Date(),
        });
      } catch (err) {
        console.error('Error creating user', err);
        return response.error(res, 'Unable to create user', 500);
      }

      // tạo profile rỗng luôn
      try {
        await UserProfile.create({
          user_id: user.id,
          full_name: full_name || display_name || username,
          avatar_url: null,
          bio: "",
          major: null,
          class_name: null,
        });
      } catch (err) {
        console.error('User created but unable to create profile:', err);
        // Don't fail registration because of profile creation; return success anyway
      }

      const token = signToken({ id: user.id, role: user.role });

      // Ensure display_name is set for frontend
      const userResponse = {
        ...user.toJSON(),
        display_name: user.full_name || user.username
      };

      return response.success(res, "Register successful", { token, user: userResponse });
    } catch (err) {
      return response.error(res, err.message);
    }
  },

  // =====================================================
  // 2. LOGIN
  // =====================================================
  login: async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;

      if (!usernameOrEmail || !password) 
        return response.error(res, "Missing required fields", 400);

      // Find user by email or username
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { email: usernameOrEmail },
            { username: usernameOrEmail }
          ]
        }
      });

      if (!user) return response.error(res, "User not found", 404);

      const valid = await comparePassword(password, user.password);
      if (!valid) return response.error(res, "Wrong password", 401);

      if (user.status === "banned")
        return response.error(res, "Account banned by admin", 403);

      // Update last_active on login
      await user.update({ last_active: new Date() });

      const token = signToken({ id: user.id, role: user.role });

      // Ensure display_name is set for frontend
      const userResponse = {
        ...user.toJSON(),
        display_name: user.full_name || user.username,
        last_active: user.last_active
      };

      return response.success(res, "Login successful", { token, user: userResponse });
    } catch (err) {
      return response.error(res, err.message);
    }
  },

  // =====================================================
  // 3. GOOGLE LOGIN / REGISTER
  // =====================================================
  google: async (req, res) => {
    try {
      const { username, email, display_name, provider } = req.body;

      if (!email || !username) {
        return response.error(res, "Missing email or username", 400);
      }

      let user = await User.findOne({ where: { email } });

      if (!user) {
        // Create new user for first-time Google login
        try {
          user = await User.create({
            username,
            full_name: display_name || username,
            email,
            password: "google_oauth", // OAuth users don't have password
            role: "user",
            status: "active",
          });

          // Create user profile
          await UserProfile.create({
            user_id: user.id,
            display_name: display_name || username,
            avatar_url: null,
            bio: "",
            major: null,
            class_name: null,
          });
        } catch (err) {
          console.error('Error creating user from Google OAuth:', err);
          return response.error(res, 'Unable to create user', 500);
        }
      }

      if (user.status === "banned") {
        return response.error(res, "Account banned by admin", 403);
      }

      const token = signToken({ id: user.id, role: user.role });

      // Ensure display_name is set for frontend
      const userResponse = {
        ...user.toJSON(),
        display_name: user.full_name || user.username
      };

      return response.success(res, "Google login successful", { token, user: userResponse });
    } catch (err) {
      console.error('Google login error:', err);
      return response.error(res, err.message);
    }
  },

  // =====================================================
  // 4. LOGOUT (client xoá token, server chỉ trả OK)
  // =====================================================
  logout: async (req, res) => {
    return response.success(res, "Logout successful");
  },

  // =====================================================
  // 4. CHECK LOGIN (dùng middleware verifyToken)
  // =====================================================
  me: async (req, res) => {
    try {
      const user = await User.findByPk(req.userId, {
        include: [{ model: UserProfile, as: 'user_profile' }]
      });

      return response.success(res, "User info", user);
    } catch (err) {
      return response.error(res, err.message);
    }
  },

  // =====================================================
  // 5. CHANGE PASSWORD
  // =====================================================
  changePassword: async (req, res) => {
    try {
      const { old_password, new_password } = req.body;

      const user = await User.findByPk(req.userId);
      if (!user) return response.error(res, "User not found", 404);

      const valid = await comparePassword(old_password, user.password);
      if (!valid) return response.error(res, "Wrong old password", 400);

      user.password = await hashPassword(new_password);
      await user.save();

      return response.success(res, "Password changed successfully");
    } catch (err) {
      return response.error(res, err.message);
    }
  },
};
