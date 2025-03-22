const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticateUser, isAdmin } = require("../middleware/authMiddleware");

// Get all products - accessible to all authenticated users
router.get("/", authenticateUser, productController.getAllProducts);
router.get("/:id", authenticateUser, productController.getProductById);

// Admin only routes
router.post("/", authenticateUser, isAdmin, productController.createProduct);
router.put("/:id", authenticateUser, isAdmin, productController.updateProduct);
router.delete(
  "/:id",
  authenticateUser,
  isAdmin,
  productController.deleteProduct
);

module.exports = router;
