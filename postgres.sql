-- Create database
CREATE DATABASE booktracker;

-- Connect to the database
\c booktracker;

-- Create books table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    date_read DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX idx_books_rating ON books(rating DESC);
CREATE INDEX idx_books_date_read ON books(date_read DESC);
CREATE INDEX idx_books_title ON books(title);

-- Insert sample data
INSERT INTO books (title, author, isbn, rating, notes, date_read) VALUES
('The Lean Startup', 'Eric Ries', '9780307887894', 5, 'Great insights on building startups with validated learning approach.', '2024-01-15'),
('Atomic Habits', 'James Clear', '9780735211292', 5, 'Excellent framework for building good habits and breaking bad ones.', '2024-02-20'),
('The Psychology of Money', 'Morgan Housel', '9780857197689', 4, 'Fascinating look at how psychology affects financial decisions.', '2024-03-10');