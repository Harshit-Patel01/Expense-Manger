require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

// Import Models
const User = require('./models/User');
const Expense = require('./models/Expense');

// Create Express App
const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(403).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Registration Route
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: newUser._id 
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Return user details with token
    res.json({ 
      token, 
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Add Expense Route
app.post('/api/expenses', verifyToken, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user.userId;

    // Find the user to get their name
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newExpense = new Expense({
      amount,
      description,
      paidBy: user.firstName, // Use first name of logged-in user
      userId: userId, // Store user ID with expense
      paidDate: new Date()
    });

    await newExpense.save();

    res.status(201).json({ 
      message: 'Expense added successfully',
      expense: newExpense 
    });
  } catch (error) {
    console.error('Add Expense Error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get Expenses Route
app.get('/api/expenses', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const expenses = await Expense.find({ userId }).sort({ paidDate: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Get Expenses Error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});
// Get All Expenses Route
app.get('/api/expenses/all', verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find()
      .sort({ paidDate: -1 })
      .populate('userId', 'firstName lastName');
    
    if (!expenses) {
      return res.status(404).json({ message: 'No expenses found' });
    }

    // Transform expenses to include full name
    const formattedExpenses = expenses.map(expense => ({
      ...expense.toObject(),
      fullName: `${expense.userId.firstName} ${expense.userId.lastName}`
    }));

    res.json(formattedExpenses);
  } catch (error) {
    console.error('Get All Expenses Error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
