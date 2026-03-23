// ============================================================
// BOOK TRACKER - Main Server File
// Tech Stack: Node.js + Express + PostgreSQL + EJS + dotenv
// Authentication: bcrypt (password hashing) + express-session
// ============================================================

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const SALT_ROUNDS = 10; // how many times bcrypt scrambles the password

// ============================================================
// DATABASE CONNECTION
// Production (Render + Supabase): uses DATABASE_URL
// Development (local): uses individual DB_* variables
// ============================================================
const db = new pg.Client(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);
db.connect();

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Session middleware — keeps user logged in between page visits
// The secret signs the session cookie so it cannot be tampered with
app.use(session({
  secret: process.env.SESSION_SECRET || "Bhagwan@SecureShelf#2024!XK92",
  resave: false,            // don't save session if nothing changed
  saveUninitialized: false, // don't create session until something is stored
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // session lasts 24 hours
}));

// ============================================================
// AUTH MIDDLEWARE
// Protects routes — if user is not logged in, redirect to login
// Used on every route that requires authentication
// ============================================================
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next(); // user is logged in, continue to the route
}

// ============================================================
// HELPER FUNCTION
// Builds the Open Library cover image URL from an ISBN number
// ============================================================
function getCoverUrl(isbn) {
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null;
}

// ============================================================
// AUTH ROUTES
// ============================================================

// GET /signup — Show signup form
app.get("/signup", (req, res) => {
  // If already logged in, go straight to home
  if (req.session.userId) return res.redirect("/");
  res.render("signup.ejs", { error: null });
});

// POST /signup — Create new user account
app.post("/signup", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Check passwords match
    if (password !== confirmPassword) {
      return res.render("signup.ejs", { error: "Passwords do not match." });
    }

    // Check if email already exists
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.render("signup.ejs", { error: "An account with that email already exists." });
    }

    // Hash the password — never store plain text passwords
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Save new user to database
    const result = await db.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );

    // Log the user in immediately after signup
    req.session.userId = result.rows[0].id;
    req.session.userEmail = email;

    res.redirect("/");
  } catch (err) {
    console.error("Signup error:", err);
    res.render("signup.ejs", { error: "Something went wrong. Please try again." });
  }
});

// GET /login — Show login form
app.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("login.ejs", { error: null });
});

// POST /login — Check credentials and log user in
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.render("login.ejs", { error: "Invalid email or password." });
    }

    const user = result.rows[0];

    // Compare entered password with hashed password in database
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.render("login.ejs", { error: "Invalid email or password." });
    }

    // Save user info in session — this is what keeps them logged in
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    res.render("login.ejs", { error: "Something went wrong. Please try again." });
  }
});

// POST /logout — Destroy session and redirect to login
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// ============================================================
// BOOK ROUTES — all protected by requireLogin middleware
// ============================================================

// GET / — Home Page (only shows logged in user's books)
app.get("/", requireLogin, async (req, res) => {
  try {
    const sort = req.query.sort || "date_read";
    const search = req.query.search || "";

    let orderClause = "date_read DESC";
    if (sort === "rating") orderClause = "rating DESC, date_read DESC";
    if (sort === "title") orderClause = "title ASC";

    let books = [];

    if (search) {
      // Filter by user_id so users only see their own books
      const result = await db.query(
        `SELECT * FROM books WHERE user_id = $1 AND (title ILIKE $2 OR author ILIKE $2) ORDER BY ${orderClause}`,
        [req.session.userId, `%${search}%`]
      );
      books = result.rows;
    } else {
      const result = await db.query(
        `SELECT * FROM books WHERE user_id = $1 ORDER BY ${orderClause}`,
        [req.session.userId]
      );
      books = result.rows;
    }

    // Add cover URL to each book
    books = books.map(book => ({
      ...book,
      cover_url: getCoverUrl(book.isbn),
    }));

    // Calculate stats
    const totalBooks = books.length;
    const avgRating = totalBooks > 0
      ? (books.reduce((sum, b) => sum + (b.rating || 0), 0) / totalBooks).toFixed(1)
      : 0;
    const topRated = books.filter(b => b.rating === 5).length;

    res.render("index.ejs", {
      books,
      currentSort: sort,
      search,
      totalBooks,
      avgRating,
      topRated,
      userEmail: req.session.userEmail, // pass email to show in header
    });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.render("index.ejs", { books: [], currentSort: "date_read", search: "", totalBooks: 0, avgRating: 0, topRated: 0, userEmail: req.session.userEmail });
  }
});

// GET /add — Show Add Book Form
app.get("/add", requireLogin, (req, res) => {
  res.render("add.ejs", { error: null });
});

// POST /add — Save New Book (linked to logged in user)
app.post("/add", requireLogin, async (req, res) => {
  try {
    const { title, author, isbn, rating, notes, date_read } = req.body;

    // user_id links this book to the logged in user
    await db.query(
      "INSERT INTO books (title, author, isbn, rating, notes, date_read, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [title, author, isbn || null, parseInt(rating), notes, date_read || null, req.session.userId]
    );

    res.redirect("/");
  } catch (err) {
    console.error("Error adding book:", err);
    res.render("add.ejs", { error: "Failed to add book. Please try again." });
  }
});

// GET /edit/:id — Show Edit Form
app.get("/edit/:id", requireLogin, async (req, res) => {
  try {
    // user_id check ensures users can only edit their own books
    const result = await db.query(
      "SELECT * FROM books WHERE id = $1 AND user_id = $2",
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) return res.redirect("/");

    const book = result.rows[0];
    if (book.date_read) {
      book.date_read = book.date_read.toISOString().split("T")[0];
    }

    res.render("edit.ejs", { book, error: null });
  } catch (err) {
    console.error("Error fetching book:", err);
    res.redirect("/");
  }
});

// POST /edit/:id — Update Book
app.post("/edit/:id", requireLogin, async (req, res) => {
  try {
    const { title, author, isbn, rating, notes, date_read } = req.body;

    // user_id check prevents users from editing someone else's book
    await db.query(
      `UPDATE books 
       SET title = $1, author = $2, isbn = $3, rating = $4, notes = $5, 
           date_read = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 AND user_id = $8`,
      [title, author, isbn || null, parseInt(rating), notes, date_read || null, req.params.id, req.session.userId]
    );

    res.redirect("/");
  } catch (err) {
    console.error("Error updating book:", err);
    res.redirect(`/edit/${req.params.id}`);
  }
});

// POST /delete/:id — Delete Book
app.post("/delete/:id", requireLogin, async (req, res) => {
  try {
    // user_id check ensures users can only delete their own books
    await db.query(
      "DELETE FROM books WHERE id = $1 AND user_id = $2",
      [req.params.id, req.session.userId]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.redirect("/");
  }
});

// ============================================================
// START SERVER
// ============================================================
app.listen(port, () => {
  console.log(`✅ Book Tracker running at http://localhost:${port}`);
});
