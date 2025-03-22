const User = require("../models/User");
const jwt = require("jsonwebtoken");

// User login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email and tenant
    const user = await User.findOne({
      email,
      tenantId: req.tenantId,
      status: "active",
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, tenantId: user.tenantId },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all users for tenant
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.tenantId }).select(
      "-password"
    );

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Register new user
const registerUser = async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    // Check if user already exists in this tenant
    const existingUser = await User.findOne({ email, tenantId: req.tenantId });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists with this email" });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      role: role || "user",
      tenantId: req.tenantId,
    });

    await user.save();

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user._id,
      tenantId: req.tenantId,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  loginUser,
  getAllUsers,
  registerUser,
  getCurrentUser,
};
