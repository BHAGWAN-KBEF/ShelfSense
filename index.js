import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection using environment variables
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Helper function to get book cover URL
function getCoverUrl(isbn) {
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null;
}

// Routes
// Home page - display all books
app.get("/", async (req, res) => {
  try {
    const sort = req.query.sort || "date_read";
    const order = req.query.order || "DESC";
    
    let query = "SELECT * FROM books ORDER BY ";
    if (sort === "rating") {
      query += "rating DESC, date_read DESC";
    } else if (sort === "title") {
      query += "title ASC";
    } else {
      query += "date_read DESC";
    }
    
    const result = await db.query(query);
    const books = result.rows.map(book => ({
      ...book,
      cover_url: getCoverUrl(book.isbn)
    }));
    
    res.render("index.ejs", { books, currentSort: sort });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.render("index.ejs", { books: [], currentSort: "date_read" });
  }
});

// Add new book page
app.get("/add", (req, res) => {
  res.render("add.ejs");
});

// Add new book
app.post("/add", async (req, res) => {
  try {
    const { title, author, isbn, rating, notes, date_read } = req.body;
    
    await db.query(
      "INSERT INTO books (title, author, isbn, rating, notes, date_read) VALUES ($1, $2, $3, $4, $5, $6)",
      [title, author, isbn || null, parseInt(rating), notes, date_read]
    );
    
    res.redirect("/");
  } catch (err) {
    console.error("Error adding book:", err);
    res.render("add.ejs", { error: "Failed to add book. Please try again." });
  }
});

// Edit book page
app.get("/edit/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [req.params.id]);
    if (result.rows.length > 0) {
      const book = result.rows[0];
      // Format date for input field
      if (book.date_read) {
        book.date_read = book.date_read.toISOString().split('T')[0];
      }
      res.render("edit.ejs", { book });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.error("Error fetching book:", err);
    res.redirect("/");
  }
});

// Update book
app.post("/edit/:id", async (req, res) => {
  try {
    const { title, author, isbn, rating, notes, date_read } = req.body;
    
    await db.query(
      "UPDATE books SET title = $1, author = $2, isbn = $3, rating = $4, notes = $5, date_read = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7",
      [title, author, isbn || null, parseInt(rating), notes, date_read, req.params.id]
    );
    
    res.redirect("/");
  } catch (err) {
    console.error("Error updating book:", err);
    res.redirect(`/edit/${req.params.id}`);
  }
});

// Delete book
app.post("/delete/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM books WHERE id = $1", [req.params.id]);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.redirect("/");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});