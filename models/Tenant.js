const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  domain: {
    type: String,
    required: true,
    unique: true,
  },
  configuration: {
    theme: {
      primaryColor: { type: String, default: "#007bff" },
      secondaryColor: { type: String, default: "#6c757d" },
      logo: { type: String, default: "default-logo.png" },
    },
    features: {
      analytics: { type: Boolean, default: true },
      socialLogin: { type: Boolean, default: false },
      advancedSearch: { type: Boolean, default: false },
    },
    limits: {
      maxUsers: { type: Number, default: 10 },
      maxProducts: { type: Number, default: 100 },
      storageLimit: { type: Number, default: 1024 * 1024 * 50 }, // 50MB
    },
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Tenant", tenantSchema);
