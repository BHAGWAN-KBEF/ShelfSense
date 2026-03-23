# ReadShelf

A full-stack web app to track books you've read — with personal notes, star ratings, automatic cover images via ISBN, and a reading stats dashboard.

🔗 **Live Demo:** [readshelf.onrender.com](https://readshelf.onrender.com) ← update after deployment

---

## Features

- User authentication — sign up, log in, log out (bcrypt + sessions)
- Each user sees only their own books
- Add, edit, and delete books
- Rate books 1–5 stars
- Write personal notes with Read More / Read Less toggle
- Automatic book covers fetched from Open Library API via ISBN
- Search by title or author
- Sort by most recent, highest rated, or alphabetical
- Stats dashboard — total books, average rating, 5-star count
- Fully responsive — mobile, tablet, and desktop

---

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Backend    | Node.js + Express.js        |
| Database   | PostgreSQL                  |
| Templating | EJS                         |
| Styling    | Vanilla CSS                 |
| Auth       | bcrypt + express-session    |
| API        | Open Library Covers API     |
| Deployment | Render + Supabase           |

---

## Project Structure

```
readshelf/
├── views/
│   ├── index.ejs        # Home — book grid, search, sort, stats
│   ├── add.ejs          # Add book form with live cover preview
│   ├── edit.ejs         # Edit book form with live cover preview
│   ├── login.ejs        # Login page
│   └── signup.ejs       # Signup page
├── public/
│   ├── styles.css       # All styles
│   └── placeholder.jpg  # Fallback cover image
├── index.js             # Express server — all routes and DB logic
├── postgres.sql         # Database schema + sample data
├── .env.example         # Environment variable template
└── package.json
```

---

## Local Setup

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/readshelf.git
cd readshelf
npm install
```

### 2. Set up the database
```bash
psql -U postgres
\i postgres.sql
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Fill in your PostgreSQL credentials in `.env`:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=booktracker
DB_PASSWORD=your_password
DB_PORT=5432
PORT=3000
SESSION_SECRET=your_secret_key
```

### 4. Run the app
```bash
npm run dev     # development (nodemon)
npm start       # production
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## Database Schema

```sql
CREATE TABLE users (
  id       SERIAL PRIMARY KEY,
  email    VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE books (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  author     VARCHAR(255) NOT NULL,
  isbn       VARCHAR(20),
  rating     INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes      TEXT,
  date_read  DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Integration

Book covers are fetched from the [Open Library Covers API](https://openlibrary.org/dev/docs/api#anchor_covers):
```
https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg
```
No API key required. Falls back to a placeholder image if no cover is found.

---

## Deployment

Deployed on **Render** (Node.js web service) with **Supabase** (PostgreSQL).

Set the following environment variables on Render:
```
DATABASE_URL=your_supabase_connection_string
SESSION_SECRET=your_secret_key
PORT=3000
```

---

## License

MIT
