const express = require('express');
const router = express.Router();
const db = require('../database');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    // This is simplified authentication for demo purposes
    // In a real app, you would use proper authentication with hashed passwords
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? AND password = ? AND is_admin = TRUE',
      ['admin', password]
    );
    
    if (users.length > 0) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add book
router.post('/books', async (req, res) => {
  try {
    const { title, author, isbn, quantity } = req.body;
    
    await db.query(
      'INSERT INTO books (title, author, isbn, quantity, available) VALUES (?, ?, ?, ?, ?)',
      [title, author, isbn, quantity, quantity]
    );
    
    res.json({ success: true, message: 'Book added successfully' });
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all books
router.get('/books', async (req, res) => {
  try {
    const [books] = await db.query('SELECT * FROM books');
    res.json({ success: true, books });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check returns
router.get('/returns', async (req, res) => {
  try {
    const [transactions] = await db.query(
      `SELECT t.*, b.title, b.isbn, u.name AS user_name
       FROM transactions t
       JOIN books b ON t.book_id = b.book_id
       JOIN users u ON t.user_id = u.user_id
       WHERE t.return_date IS NULL`
    );
    
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Calculate fine
router.post('/calculate-fine', async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    // Get transaction details
    const [transactions] = await db.query(
      'SELECT * FROM transactions WHERE transaction_id = ?',
      [transactionId]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    const transaction = transactions[0];
    
    // Calculate days overdue
    const dueDate = new Date(transaction.due_date);
    const today = new Date();
    const daysLate = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
    
    // Assume $0.50 per day fine
    const fine = daysLate * 0.5;
    
    // Update transaction
    await db.query(
      'UPDATE transactions SET fine = ? WHERE transaction_id = ?',
      [fine, transactionId]
    );
    
    res.json({ success: true, fine, daysLate });
  } catch (error) {
    console.error('Calculate fine error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;