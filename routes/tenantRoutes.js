const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const { authenticateUser, isAdmin } = require("../middleware/authMiddleware");

// Admin routes
router.get("/", authenticateUser, isAdmin, tenantController.getAllTenants);
router.get("/:id", authenticateUser, isAdmin, tenantController.getTenantById);
router.post("/", authenticateUser, isAdmin, tenantController.createTenant);
router.put("/:id", authenticateUser, isAdmin, tenantController.updateTenant);

// Tenant-specific route
router.get("/config/current", tenantController.getTenantConfig);

module.exports = router;
