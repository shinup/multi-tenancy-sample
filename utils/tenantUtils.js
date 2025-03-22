/**
 * Utility functions for tenant operations
 */

// Get tenant connection string based on isolation strategy
const getTenantConnectionString = (tenantId, strategy = "database") => {
  const baseConnectionString = process.env.MONGODB_URI;

  switch (strategy) {
    case "database":
      // Separate database per tenant
      return `${baseConnectionString}-${tenantId}`;

    case "schema":
      // Using schema prefix in same database
      return baseConnectionString;

    case "shared":
      // Shared database with tenant ID field
      return baseConnectionString;

    default:
      return baseConnectionString;
  }
};

// Check tenant limits
const checkTenantLimits = async (tenantId, resourceType, currentCount) => {
  const Tenant = require("../models/Tenant");

  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    switch (resourceType) {
      case "users":
        return currentCount < tenant.configuration.limits.maxUsers;

      case "products":
        return currentCount < tenant.configuration.limits.maxProducts;

      case "storage":
        return currentCount < tenant.configuration.limits.storageLimit;

      default:
        return true;
    }
  } catch (error) {
    console.error("Error checking tenant limits:", error);
    return false;
  }
};

module.exports = {
  getTenantConnectionString,
  checkTenantLimits,
};
