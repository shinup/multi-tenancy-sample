const Tenant = require("../models/Tenant");

// Get all tenants (admin only)
const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    res.status(200).json(tenants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get tenant by ID (admin only)
const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.status(200).json(tenant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Create new tenant (admin only)
const createTenant = async (req, res) => {
  try {
    const newTenant = new Tenant(req.body);
    await newTenant.save();
    res.status(201).json(newTenant);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      // Duplicate key error
      return res
        .status(400)
        .json({ error: "Tenant with that name or domain already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Update tenant (admin only)
const updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.status(200).json(tenant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get current tenant configuration
const getTenantConfig = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Return only the configuration part
    res.status(200).json({
      tenantId: tenant._id,
      name: tenant.name,
      configuration: tenant.configuration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  getTenantConfig,
};
