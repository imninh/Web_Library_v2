/* Seed idempotent (spec §12): 2 tài khoản demo + vài sách mẫu có bản sao.
   Chạy lại không nhân đôi dữ liệu. Async cho Postgres. */
"use strict";
const db = require("./index");
const password = require("../utils/password");
const inv = require("../services/inventory");

const DEMO_BOOKS = [
  { title: "The Quiet Library", author: "Mara Ellison", category: "Fiction", year: 2019, stock: 4, featured: 1, description: "Một tiểu thuyết dịu dàng về những buổi chiều trong thư viện và những cuộc đời giao nhau qua trang sách." },
  { title: "Roots & Recipes", author: "Đỗ Lan Hương", category: "Cooking", year: 2021, stock: 3, featured: 0, description: "Hành trình ẩm thực gia đình Việt qua ba thế hệ, kèm những công thức được gìn giữ cẩn thận." },
  { title: "Signals in the Dark", author: "R. Okonkwo", category: "Sci-Fi", year: 2020, stock: 2, featured: 1, description: "Khi một tín hiệu lạ vọng về từ vành đai Kuiper, cả nhân loại phải định nghĩa lại khái niệm 'ở nhà'." },
  { title: "Small Habits, Big Calm", author: "J. Andersen", category: "Self-help", year: 2018, stock: 5, featured: 0, description: "Cẩm nang thực tế xây dựng thói quen nhỏ để có một tâm trí bình tĩnh hơn mỗi ngày." },
  { title: "Green City", author: "Team Habitat", category: "Science", year: 2022, stock: 2, featured: 1, description: "Cái nhìn lạc quan và có căn cứ về những đô thị xanh của thập kỷ tới." },
  { title: "Letters to the Moon", author: "Ha-eun Kim", category: "Poetry", year: 2017, stock: 6, featured: 0, description: "Tuyển tập thơ hiện đại về khoảng cách, ánh sáng và sự trở về." }
];

const DEMO_REVIEWS = [
  { name: "Grace A.", email: "grace@example.com", rating: 5, daysAgo: 14, content: "So convenient. I reserved this in the evening and picked it up the next morning in under two minutes. The whole borrowing flow feels effortless and the staff were lovely." },
  { name: "Henry P.", email: "henry@example.com", rating: 5, daysAgo: 33, content: "Beautiful interface and the search is fast. My kid loves the little readers' section and we now visit every weekend to reserve a new pile of picture books together." },
  { name: "Thu H.", email: "thu@example.com", rating: 4, daysAgo: 36, content: "No more late-fee worries thanks to the clear reminders, and returning a book is genuinely easy. A small wish would be a few more copies of the most popular titles." },
  { name: "Marcus L.", email: "marcus@example.com", rating: 5, daysAgo: 9, content: "I have discovered so many titles I would never have found on my own. Reserving online and collecting at the desk saves me a huge amount of time every single week." },
  { name: "Priya S.", email: "priya@example.com", rating: 5, daysAgo: 21, content: "A wonderful community resource. The catalogue is well organised, the reservations always ready on time, and the reminders mean I never forget a return date anymore." },
  { name: "Daniel O.", email: "daniel@example.com", rating: 4, daysAgo: 47, content: "Really solid experience overall. The reading recommendations are thoughtful and the site works just as smoothly on my phone as it does on my laptop at home." }
];

async function seed() {
  await db.init();

  await ensureUser("admin", "admin123", "admin");
  await ensureUser("user", "user123", "user");

  const bookCount = (await db.get("SELECT COUNT(*) c FROM books")).c;
  if (bookCount === 0) {
    for (const b of DEMO_BOOKS) {
      await db.tx(async () => {
        const { lastId } = await db.run(
          "INSERT INTO books (title, author, category, description, year, featured) VALUES (?,?,?,?,?,?)",
          [b.title, b.author, b.category, b.description, b.year, b.featured]);
        if (b.stock > 0) await inv.addCopies(lastId, b.stock);
        await inv.syncBookAvailability(lastId);
      });
    }
    console.log("[seed] Đã tạo " + DEMO_BOOKS.length + " sách mẫu kèm bản sao.");
  }

  if ((await db.get("SELECT COUNT(*) c FROM comments")).c === 0) {
    const books = await db.query("SELECT id FROM books ORDER BY id");
    if (books.length) {
      const pick = i => books[i % books.length].id;
      for (let i = 0; i < DEMO_REVIEWS.length; i++) {
        const r = DEMO_REVIEWS[i];
        await db.run(
          "INSERT INTO comments (book_id, name, email, content, rating, hidden, created_at) VALUES (?,?,?,?,?,0, datetime('now', ?))",
          [pick(i), r.name, r.email, r.content, r.rating, "-" + r.daysAgo + " days"]
        );
      }
      console.log("[seed] Đã tạo " + DEMO_REVIEWS.length + " review mẫu.");
    }
  }

  const allBooks = await db.query("SELECT id FROM books");
  for (const r of allBooks) await inv.syncBookAvailability(r.id);
  console.log("[seed] Hoàn tất. Tài khoản demo: admin/admin123, user/user123.");
}

async function ensureUser(username, pw, role) {
  const existing = await db.get("SELECT id FROM users WHERE username = ?", [username]);
  if (existing) {
    if (role === "user" && !(await db.get("SELECT id FROM user_profiles WHERE user_id = ?", [existing.id])))
      await db.run("INSERT INTO user_profiles (user_id) VALUES (?)", [existing.id]);
    return existing.id;
  }
  const { lastId } = await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, password.hash(pw), role]);
  await db.run("INSERT INTO user_profiles (user_id, account_status) VALUES (?, 'active')", [lastId]);
  console.log("[seed] Tạo tài khoản " + username + " (" + role + ").");
  return lastId;
}

module.exports = { seed };

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
