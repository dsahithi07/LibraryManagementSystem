const express = require('express');
const router = express.Router();
const db = require('../database');

// Search books
router.get('/books/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.json({ success: true, books: [] });
    }
    
    const [books] = await db.query(
      `SELECT * FROM books 
       WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    
    res.json({ success: true, books });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add this code to your user.js file in the backend
// Purchase book
router.post('/purchase-book', async (req, res) => {
  try {
    let { isbn, userId, userName, userEmail, paymentProcessed } = req.body;
    
    // Verify payment was processed (in a real app, this would be handled by a payment processor)
    if (!paymentProcessed) {
      return res.status(400).json({ success: false, message: 'Payment processing failed' });
    }
    
    // Get book ID from ISBN
    const [books] = await db.query('SELECT * FROM books WHERE isbn = ?', [isbn]);
    
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    const book = books[0];
    
    // Check if book is available
    if (book.available <= 0) {
      return res.status(400).json({ success: false, message: 'Book is not available' });
    }
    
    // Check if user exists, or create a new user
    if (!userId) {
      // Create new user if user ID not provided
      const [userInsert] = await db.query(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [userName, userEmail]
      );
      userId = userInsert.insertId;
    } else {
      // Update user information if needed
      await db.query(
        'UPDATE users SET name = ?, email = ? WHERE user_id = ?',
        [userName, userEmail, userId]
      );
    }
    
    // Create transaction
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days borrowing period
    
    const [transactionResult] = await db.query(
      `INSERT INTO transactions 
       (book_id, user_id, borrow_date, due_date, transaction_type) 
       VALUES (?, ?, CURDATE(), ?, 'purchase')`,
      [book.book_id, userId, dueDate.toISOString().split('T')[0]]
    );
    
    // Update book available count
    await db.query(
      'UPDATE books SET available = available - 1 WHERE book_id = ?',
      [book.book_id]
    );
    
    res.json({ 
      success: true, 
      message: 'Book purchased successfully',
      transactionId: transactionResult.insertId,
      isbn: isbn
    });
  } catch (error) {
    console.error('Purchase book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Return book
router.post('/return-book', async (req, res) => {
  try {
    const { isbn, userId } = req.body;
    
    // Get book ID from ISBN
    const [books] = await db.query('SELECT book_id FROM books WHERE isbn = ?', [isbn]);
    
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    const bookId = books[0].book_id;
    
    // Check if this book is borrowed by this user
    const [transactions] = await db.query(
      `SELECT transaction_id FROM transactions 
       WHERE book_id = ? AND user_id = ? AND return_date IS NULL`,
      [bookId, userId]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active borrowing record found for this book and user' 
      });
    }
    
    const transactionId = transactions[0].transaction_id;
    
    // Update transaction with return date
    await db.query(
      'UPDATE transactions SET return_date = CURDATE() WHERE transaction_id = ?',
      [transactionId]
    );
    
    // Update book available count
    await db.query(
      'UPDATE books SET available = available + 1 WHERE book_id = ?',
      [bookId]
    );
    
    res.json({ success: true, message: 'Book returned successfully' });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;