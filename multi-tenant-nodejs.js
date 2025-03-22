

// multi-tenant-nodejs/.env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/multi-tenant-demo
JWT_SECRET=your_jwt_secret

// multi-tenant-nodejs/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const tenantRoutes = require('./routes/tenantRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());

// Tenant identification middleware
app.use((req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }
  req.tenantId = tenantId;
  next();
});

// Routes
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// multi-tenant-nodejs/models/Tenant.js
const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  domain: {
    type: String,
    required: true,
    unique: true
  },
  configuration: {
    theme: {
      primaryColor: { type: String, default: '#007bff' },
      secondaryColor: { type: String, default: '#6c757d' },
      logo: { type: String, default: 'default-logo.png' }
    },
    features: {
      analytics: { type: Boolean, default: true },
      socialLogin: { type: Boolean, default: false },
      advancedSearch: { type: Boolean, default: false }
    },
    limits: {
      maxUsers: { type: Number, default: 10 },
      maxProducts: { type: Number, default: 100 },
      storageLimit: { type: Number, default: 1024 * 1024 * 50 } // 50MB
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tenant', tenantSchema);

// multi-tenant-nodejs/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index for email + tenantId to ensure emails are unique per tenant
userSchema.index({ email: 1, tenantId: 1 }, { unique: true });

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

// multi-tenant-nodejs/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster querying by tenant
productSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Product', productSchema);

// multi-tenant-nodejs/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and belongs to the correct tenant
    const user = await User.findOne({
      _id: decoded.userId,
      tenantId: req.tenantId
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Check if user has admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
};

module.exports = { authenticateUser, isAdmin };

// multi-tenant-nodejs/controllers/tenantController.js
const Tenant = require('../models/Tenant');

// Get all tenants (admin only)
const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    res.status(200).json(tenants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get tenant by ID (admin only)
const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.status(200).json(tenant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
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
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ error: 'Tenant with that name or domain already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// Update tenant (admin only)
const updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.status(200).json(tenant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current tenant configuration
const getTenantConfig = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Return only the configuration part
    res.status(200).json({
      tenantId: tenant._id,
      name: tenant.name,
      configuration: tenant.configuration
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  getTenantConfig
};

// multi-tenant-nodejs/controllers/userController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// User login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email and tenant
    const user = await User.findOne({ 
      email, 
      tenantId: req.tenantId, 
      status: 'active' 
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, tenantId: user.tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all users for tenant
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.tenantId })
      .select('-password');
    
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Register new user
const registerUser = async (req, res) => {
  const { email, password, name, role } = req.body;
  
  try {
    // Check if user already exists in this tenant
    const existingUser = await User.findOne({ email, tenantId: req.tenantId });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      name,
      role: role || 'user',
      tenantId: req.tenantId
    });
    
    await user.save();
    
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ 
      _id: req.user._id, 
      tenantId: req.tenantId 
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  loginUser,
  getAllUsers,
  registerUser,
  getCurrentUser
};

// multi-tenant-nodejs/controllers/productController.js
const Product = require('../models/Product');

// Get all products for tenant
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ tenantId: req.tenantId });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      tenantId: req.tenantId 
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      tenantId: req.tenantId
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id, 
      tenantId: req.tenantId 
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

// multi-tenant-nodejs/routes/tenantRoutes.js
const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticateUser, isAdmin } = require('../middleware/authMiddleware');

// Admin routes
router.get('/', authenticateUser, isAdmin, tenantController.getAllTenants);
router.get('/:id', authenticateUser, isAdmin, tenantController.getTenantById);
router.post('/', authenticateUser, isAdmin, tenantController.createTenant);
router.put('/:id', authenticateUser, isAdmin, tenantController.updateTenant);

// Tenant-specific route
router.get('/config/current', tenantController.getTenantConfig);

module.exports = router;

// multi-tenant-nodejs/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', userController.loginUser);
router.post('/register', userController.registerUser);

// Protected routes
router.get('/me', authenticateUser, userController.getCurrentUser);
router.get('/', authenticateUser, isAdmin, userController.getAllUsers);

module.exports = router;

// multi-tenant-nodejs/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateUser, isAdmin } = require('../middleware/authMiddleware');

// Get all products - accessible to all authenticated users
router.get('/', authenticateUser, productController.getAllProducts);
router.get('/:id', authenticateUser, productController.getProductById);

// Admin only routes
router.post('/', authenticateUser, isAdmin, productController.createProduct);
router.put('/:id', authenticateUser, isAdmin, productController.updateProduct);
router.delete('/:id', authenticateUser, isAdmin, productController.deleteProduct);

module.exports = router;

// multi-tenant-nodejs/utils/tenantUtils.js
/**
 * Utility functions for tenant operations
 */

// Get tenant connection string based on isolation strategy
const getTenantConnectionString = (tenantId, strategy = 'database') => {
  const baseConnectionString = process.env.MONGODB_URI;
  
  switch (strategy) {
    case 'database':
      // Separate database per tenant
      return `${baseConnectionString}-${tenantId}`;
    
    case 'schema':
      // Using schema prefix in same database
      return baseConnectionString;
    
    case 'shared':
      // Shared database with tenant ID field
      return baseConnectionString;
    
    default:
      return baseConnectionString;
  }
};

// Check tenant limits
const checkTenantLimits = async (tenantId, resourceType, currentCount) => {
  const Tenant = require('../models/Tenant');
  
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    switch (resourceType) {
      case 'users':
        return currentCount < tenant.configuration.limits.maxUsers;
      
      case 'products':
        return currentCount < tenant.configuration.limits.maxProducts;
      
      case 'storage':
        return currentCount < tenant.configuration.limits.storageLimit;
      
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking tenant limits:', error);
    return false;
  }
};

module.exports = {
  getTenantConnectionString,
  checkTenantLimits
};
