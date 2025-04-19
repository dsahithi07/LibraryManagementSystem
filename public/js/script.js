// DOM elements
const adminBtn = document.getElementById('admin-btn');
const userBtn = document.getElementById('user-btn');
const adminLogin = document.getElementById('admin-login');
const adminDashboard = document.getElementById('admin-dashboard');
const userDashboard = document.getElementById('user-dashboard');
const loginSection = document.getElementById('login-section');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminPassword = document.getElementById('admin-password');
const backBtnAdmin = document.getElementById('back-btn-admin');
const logoutAdminBtn = document.getElementById('logout-admin-btn');
const logoutUserBtn = document.getElementById('logout-user-btn');

// Admin selection
adminBtn.addEventListener('click', () => {
    loginSection.classList.add('hidden');
    adminLogin.classList.remove('hidden');
});

// User selection
userBtn.addEventListener('click', () => {
    loginSection.classList.add('hidden');
    userDashboard.classList.remove('hidden');
});

// Admin login validation
adminLoginBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: adminPassword.value })
        });
        
        const data = await response.json();
        
        if (data.success) {
            adminLogin.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            adminPassword.value = ''; // Clear password field
        } else {
            alert('Incorrect password!');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// Back button from admin login
backBtnAdmin.addEventListener('click', () => {
    adminLogin.classList.add('hidden');
    loginSection.classList.remove('hidden');
    adminPassword.value = ''; // Clear password field
});

// Logout buttons
logoutAdminBtn.addEventListener('click', () => {
    adminDashboard.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

logoutUserBtn.addEventListener('click', () => {
    userDashboard.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

// Admin dashboard functionality
document.getElementById('add-book-btn').addEventListener('click', () => {
    document.getElementById('admin-content').innerHTML = `
        <h3>Add New Book</h3>
        <form id="add-book-form">
            <input type="text" placeholder="Book Title" id="book-title" required>
            <input type="text" placeholder="Author" id="book-author" required>
            <input type="text" placeholder="ISBN" id="book-isbn" required>
            <input type="number" placeholder="Quantity" id="book-quantity" required min="1">
            <button type="submit">Add Book</button>
        </form>
    `;
    
    document.getElementById('add-book-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/admin/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: document.getElementById('book-title').value,
                    author: document.getElementById('book-author').value,
                    isbn: document.getElementById('book-isbn').value,
                    quantity: document.getElementById('book-quantity').value
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Book added successfully!');
                this.reset();
            } else {
                alert(`Failed to add book: ${data.message}`);
            }
        } catch (error) {
            console.error('Add book error:', error);
            alert('Failed to add book. Please try again.');
        }
    });
});

document.getElementById('view-books-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/admin/books');
        const data = await response.json();
        
        let booksHtml = `
            <h3>All Books</h3>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>ISBN</th>
                        <th>Available</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        if (data.success && data.books.length > 0) {
            data.books.forEach(book => {
                booksHtml += `
                    <tr>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.isbn}</td>
                        <td>${book.available}</td>
                        <td>${book.quantity}</td>
                    </tr>
                `;
            });
        } else {
            booksHtml += `
                <tr>
                    <td colspan="5">No books found</td>
                </tr>
            `;
        }
        
        booksHtml += `
                </tbody>
            </table>
        `;
        
        document.getElementById('admin-content').innerHTML = booksHtml;
    } catch (error) {
        console.error('View books error:', error);
        alert('Failed to load books. Please try again.');
    }
});

// Check Returns Functionality
document.getElementById('check-returns-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/admin/returns');
        const data = await response.json();
        
        let returnsHtml = `
            <h3>Books Out on Loan</h3>
            <table>
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Book Title</th>
                        <th>ISBN</th>
                        <th>Borrower</th>
                        <th>Borrow Date</th>
                        <th>Due Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        if (data.success && data.transactions.length > 0) {
            data.transactions.forEach(transaction => {
                // Format dates for display
                const borrowDate = new Date(transaction.borrow_date).toLocaleDateString();
                const dueDate = new Date(transaction.due_date).toLocaleDateString();
                
                // Calculate if overdue
                const isOverdue = new Date() > new Date(transaction.due_date);
                const rowClass = isOverdue ? 'style="background-color: rgba(231, 76, 60, 0.1);"' : '';
                
                returnsHtml += `
                    <tr ${rowClass}>
                        <td>${transaction.transaction_id}</td>
                        <td>${transaction.title}</td>
                        <td>${transaction.isbn}</td>
                        <td>${transaction.user_name}</td>
                        <td>${borrowDate}</td>
                        <td>${dueDate}</td>
                        <td>
                            <button class="calculate-fine-btn" 
                                data-transaction-id="${transaction.transaction_id}">
                                Calculate Fine
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            returnsHtml += `
                <tr>
                    <td colspan="7">No books currently on loan</td>
                </tr>
            `;
        }
        
        returnsHtml += `
                </tbody>
            </table>
        `;
        
        document.getElementById('admin-content').innerHTML = returnsHtml;
        
        // Add event listeners to the Calculate Fine buttons
        document.querySelectorAll('.calculate-fine-btn').forEach(button => {
            button.addEventListener('click', function() {
                const transactionId = this.getAttribute('data-transaction-id');
                calculateFine(transactionId);
            });
        });
    } catch (error) {
        console.error('Check returns error:', error);
        document.getElementById('admin-content').innerHTML = 'Failed to load returns. Please try again.';
    }
});

// Calculate Fine Functionality
document.getElementById('calculate-fine-btn').addEventListener('click', () => {
    document.getElementById('admin-content').innerHTML = `
        <h3>Calculate Fine</h3>
        <form id="calculate-fine-form">
            <input type="number" placeholder="Transaction ID" id="transaction-id" required>
            <button type="submit">Calculate Fine</button>
        </form>
        <div id="fine-result"></div>
    `;
    
    document.getElementById('calculate-fine-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const transactionId = document.getElementById('transaction-id').value;
        calculateFine(transactionId);
    });
});

// Function to calculate fine for a transaction
async function calculateFine(transactionId) {
    try {
        const response = await fetch('/api/admin/calculate-fine', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transactionId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Format the fine as currency
            const formattedFine = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(data.fine);
            
            // Display the result
            const resultElement = document.getElementById('fine-result') || 
                                  document.createElement('div');
            
            if (!document.getElementById('fine-result')) {
                resultElement.id = 'fine-result';
                document.getElementById('admin-content').appendChild(resultElement);
            }
            
            resultElement.innerHTML = `
                <div class="fine-result-card">
                    <h3>Fine Calculation Result</h3>
                    <p><strong>Transaction ID:</strong> ${transactionId}</p>
                    <p><strong>Days Overdue:</strong> ${data.daysLate}</p>
                    <p><strong>Fine Amount:</strong> ${formattedFine}</p>
                </div>
            `;
            
            // Scroll to the result
            resultElement.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert(`Failed to calculate fine: ${data.message}`);
        }
    } catch (error) {
        console.error('Calculate fine error:', error);
        alert('Failed to calculate fine. Please try again.');
    }
}

// User dashboard functionality
document.getElementById('search-books-btn').addEventListener('click', () => {
    document.getElementById('user-content').innerHTML = `
        <h3>Search Books</h3>
        <div class="search-container">
            <input type="text" id="search-query" placeholder="Enter book title, author or ISBN">
            <button id="search-btn">Search</button>
        </div>
        <div id="search-results"></div>
    `;
    
    document.getElementById('search-btn').addEventListener('click', async function() {
        const query = document.getElementById('search-query').value;
        
        if (!query) {
            document.getElementById('search-results').innerHTML = 'Please enter a search term';
            return;
        }
        
        try {
            const response = await fetch(`/api/user/books/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            let resultsHtml = '';
            
            if (data.success && data.books.length > 0) {
                resultsHtml = `
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>ISBN</th>
                                <th>Available</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.books.forEach(book => {
                    resultsHtml += `
                        <tr>
                            <td>${book.title}</td>
                            <td>${book.author}</td>
                            <td>${book.isbn}</td>
                            <td>${book.available > 0 ? 'Yes' : 'No'}</td>
                        </tr>
                    `;
                });
                
                resultsHtml += `
                        </tbody>
                    </table>
                `;
            } else {
                resultsHtml = '<p>No books found matching your search.</p>';
            }
            
            document.getElementById('search-results').innerHTML = resultsHtml;
        } catch (error) {
            console.error('Search error:', error);
            document.getElementById('search-results').innerHTML = 'Error searching books. Please try again.';
        }
    });
});

document.getElementById('return-book-btn').addEventListener('click', () => {
    document.getElementById('user-content').innerHTML = `
        <h3>Return Book</h3>
        <form id="return-book-form">
            <input type="text" placeholder="ISBN" id="return-isbn" required>
            <input type="number" placeholder="User ID" id="user-id" required>
            <button type="submit">Return Book</button>
        </form>
    `;
    
    document.getElementById('return-book-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/user/return-book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isbn: document.getElementById('return-isbn').value,
                    userId: document.getElementById('user-id').value
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Book returned successfully!');
                this.reset();
            } else {
                alert(`Failed to return book: ${data.message}`);
            }
        } catch (error) {
            console.error('Return book error:', error);
            alert('Failed to return book. Please try again.');
        }
    });
});

// Add this event listener for the Purchase Book button to your script.js
document.getElementById('purchase-book-btn').addEventListener('click', () => {
    document.getElementById('user-content').innerHTML = `
        <h3>Purchase Book</h3>
        <div class="search-container">
            <input type="text" id="purchase-query" placeholder="Enter book title, author or ISBN">
            <button id="purchase-search-btn">Search</button>
        </div>
        <div id="purchase-results"></div>
    `;
    
    document.getElementById('purchase-search-btn').addEventListener('click', async function() {
        const query = document.getElementById('purchase-query').value;
        
        if (!query) {
            document.getElementById('purchase-results').innerHTML = 'Please enter a search term';
            return;
        }
        
        try {
            const response = await fetch(`/api/user/books/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            let resultsHtml = '';
            
            if (data.success && data.books.length > 0) {
                resultsHtml = `
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>ISBN</th>
                                <th>Available</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.books.forEach(book => {
                    const isAvailable = book.available > 0;
                    resultsHtml += `
                        <tr>
                            <td>${book.title}</td>
                            <td>${book.author}</td>
                            <td>${book.isbn}</td>
                            <td>${isAvailable ? 'Yes' : 'No'}</td>
                            <td>
                                <button class="purchase-btn" 
                                    data-isbn="${book.isbn}" 
                                    ${!isAvailable ? 'disabled' : ''}>
                                    ${isAvailable ? 'Purchase' : 'Not Available'}
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                resultsHtml += `
                        </tbody>
                    </table>
                `;
            } else {
                resultsHtml = '<p>No books found matching your search.</p>';
            }
            
            document.getElementById('purchase-results').innerHTML = resultsHtml;
            
            // Add event listeners to the Purchase buttons
            document.querySelectorAll('.purchase-btn').forEach(button => {
                if (!button.hasAttribute('disabled')) {
                    button.addEventListener('click', function() {
                        const isbn = this.getAttribute('data-isbn');
                        showPurchaseForm(isbn);
                    });
                }
            });
        } catch (error) {
            console.error('Search error:', error);
            document.getElementById('purchase-results').innerHTML = 'Error searching books. Please try again.';
        }
    });
});

// Function to show purchase form
function showPurchaseForm(isbn) {
    document.getElementById('purchase-results').innerHTML = `
        <div class="purchase-form-container">
            <h3>Complete Purchase</h3>
            <form id="purchase-form">
                <input type="hidden" id="purchase-isbn" value="${isbn}">
                <input type="number" id="user-id-purchase" placeholder="Your User ID" required>
                <input type="text" id="user-name" placeholder="Your Full Name" required>
                <input type="email" id="user-email" placeholder="Your Email" required>
                <div class="payment-section">
                    <h4>Payment Details</h4>
                    <input type="text" id="card-name" placeholder="Name on Card" required>
                    <input type="text" id="card-number" placeholder="Card Number" required pattern="[0-9]{16}" maxlength="16">
                    <div class="card-details">
                        <input type="text" id="card-expiry" placeholder="MM/YY" required pattern="[0-9]{2}/[0-9]{2}" maxlength="5">
                        <input type="text" id="card-cvv" placeholder="CVV" required pattern="[0-9]{3}" maxlength="3">
                    </div>
                </div>
                <button type="submit">Complete Purchase</button>
            </form>
        </div>
    `;
    
    document.getElementById('purchase-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/user/purchase-book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isbn: document.getElementById('purchase-isbn').value,
                    userId: document.getElementById('user-id-purchase').value,
                    userName: document.getElementById('user-name').value,
                    userEmail: document.getElementById('user-email').value,
                    // Don't send card details in a real application, use a secure payment processor
                    paymentProcessed: true
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show success message
                document.getElementById('purchase-results').innerHTML = `
                    <div class="purchase-success">
                        <h3>Purchase Successful!</h3>
                        <p>Thank you for your purchase. Your book will be available for pickup at the library desk.</p>
                        <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
                        <p><strong>ISBN:</strong> ${data.isbn}</p>
                        <button id="back-to-search">Back to Search</button>
                    </div>
                `;
                
                // Add back button functionality
                document.getElementById('back-to-search').addEventListener('click', function() {
                    document.getElementById('purchase-book-btn').click();
                });
            } else {
                alert(`Failed to purchase book: ${data.message}`);
            }
        } catch (error) {
            console.error('Purchase book error:', error);
            alert('Failed to purchase book. Please try again.');
        }
    });
}