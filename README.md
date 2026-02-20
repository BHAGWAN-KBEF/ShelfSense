# 📚 Book Tracker

A web application to track books you've read with ratings, notes, and covers. Inspired by Derek Sivers' book collection website.

## Features

- ✅ Add, edit, and delete books
- ⭐ Rate books from 1-5 stars
- 📝 Add personal notes and thoughts
- 📅 Track when you read each book
- 🖼️ Automatic book covers via Open Library API
- 🔄 Sort by rating, recency, or title
- 📱 Responsive design

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Frontend**: EJS templating, HTML, CSS
- **API**: Open Library Covers API
- **HTTP Client**: Axios

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd BOOKS

# Install dependencies
npm install
```

### 2. Database Setup

1. Make sure PostgreSQL is running on your system
2. Create the database and tables:

```bash
# Connect to PostgreSQL
psql -U postgres

# Run the SQL file
\i postgres.sql
```

Or manually run the commands in `postgres.sql` file.

### 3. Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and add your PostgreSQL credentials:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=booktracker
DB_PASSWORD=your_actual_password
DB_PORT=5432
PORT=3000
```

⚠️ **Important**: Never commit the `.env` file to version control!

### 4. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. **View Books**: Visit the home page to see all your books
2. **Add Book**: Click "Add New Book" to add a new entry
3. **Sort Books**: Use the sort buttons to organize by rating, recency, or title
4. **Edit/Delete**: Use the buttons on each book card to modify or remove entries
5. **Book Covers**: Add ISBN numbers to automatically fetch book covers

## API Integration

The app uses the Open Library Covers API to fetch book covers:
- Endpoint: `https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg`
- Requires valid ISBN-10 or ISBN-13
- Falls back to placeholder if no cover found

## Database Schema

```sql
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
```

## Project Structure

```
BOOKS/
├── views/
│   ├── index.ejs      # Main page template
│   ├── add.ejs        # Add book form
│   └── edit.ejs       # Edit book form
├── public/
│   ├── styles.css     # Main stylesheet
│   └── placeholder.jpg # Fallback book cover
├── index.js           # Main server file
├── package.json       # Dependencies
├── postgres.sql       # Database setup
└── README.md         # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for learning and personal use.

## Acknowledgments

- Inspired by [Derek Sivers' book collection](https://sive.rs/book)
- Book covers provided by [Open Library](https://openlibrary.org/)
- Built as part of a web development capstone project