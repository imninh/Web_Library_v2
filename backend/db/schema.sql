-- Librumi schema — PostgreSQL (Supabase). Idempotent.
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  username   TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_profiles (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name       TEXT,
  library_card_id TEXT UNIQUE,
  email           TEXT,
  account_status  TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS books (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  author       TEXT NOT NULL,
  category     TEXT NOT NULL,
  description  TEXT,
  image        TEXT,
  isbn         TEXT,
  publisher    TEXT,
  year         INTEGER,
  total_stock  INTEGER NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0,
  borrow_count INTEGER NOT NULL DEFAULT 0,
  featured     SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS book_copies (
  id         SERIAL PRIMARY KEY,
  book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  copy_code  TEXT UNIQUE,
  status     TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS loans (
  id               SERIAL PRIMARY KEY,
  book_id          INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_copy_id     INTEGER REFERENCES book_copies(id) ON DELETE SET NULL,
  user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  borrower_name    TEXT NOT NULL,
  library_card_id  TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  due_date         TEXT,
  approved_at      TIMESTAMPTZ,
  borrowed_at      TIMESTAMPTZ,
  returned_at      TIMESTAMPTZ,
  overdue_at       TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  content    TEXT NOT NULL,
  rating     INTEGER NOT NULL,
  hidden     SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS contacts (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT DEFAULT 'general',
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_stats (
  id         INTEGER PRIMARY KEY,
  view_count INTEGER NOT NULL DEFAULT 0
);
INSERT INTO site_stats (id, view_count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_featured ON books(featured);
CREATE INDEX IF NOT EXISTS idx_copies_book   ON book_copies(book_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_user    ON loans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_book    ON loans(book_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_book ON comments(book_id, hidden);
CREATE INDEX IF NOT EXISTS idx_profiles_card ON user_profiles(library_card_id);
