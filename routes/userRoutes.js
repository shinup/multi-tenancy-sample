const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateUser, isAdmin } = require("../middleware/authMiddleware");

// Public routes
router.post("/login", userController.loginUser);
router.post("/register", userController.registerUser);

// Protected routes
router.get("/me", authenticateUser, userController.getCurrentUser);
router.get("/", authenticateUser, isAdmin, userController.getAllUsers);

module.exports = router;
