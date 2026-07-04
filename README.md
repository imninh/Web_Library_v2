# Librumi — Thư viện số (Bài tập lớn Web)

Full-stack thư viện số: **frontend HTML/CSS/JS thuần** + **backend Node/Express/SQLite**.
Toàn bộ logic (auth, băm mật khẩu, token, rate-limit, CORS, validate, animation) **tự viết** —
không dùng framework/thư viện dựng sẵn cho nghiệp vụ (tránh penalty −10 của BTL).
Chỉ 2 dependency hạ tầng: `express` (HTTP) + `better-sqlite3` (driver DB).

## Cấu trúc
```
backend/            # REST API (Node + Express + SQLite)  — spec: docs/Yeu_cau_Backend.md
  server.js         # khởi tạo, mount routes, phục vụ frontend tĩnh + /uploads
  config/ db/ middleware/ modules/ services/ utils/
frontend-web/public/  # SPA vanilla (nối API qua /api, tự phát hiện online)
  index.html  css/  js/  js/pages/
docs/               # yêu cầu đề bài + spec backend
```

## Chạy
```bash
cd backend
npm install
npm start           # http://localhost:4000  (tự seed dữ liệu mẫu lần đầu)
```
Mở trình duyệt: **http://localhost:4000** — backend phục vụ luôn frontend, tự chạy dữ liệu thật.
Đổi cổng: `PORT=5000 npm start`. Seed lại thủ công: `npm run seed`.

> Chạy riêng frontend (chế độ preview mock, không cần backend):
> `node frontend-web/dev-server.js` → http://localhost:4173

## Tài khoản demo
| Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Admin | `admin` | `admin123` |
| User  | `user`  | `user123`  |

## API chính (tiền tố `/api`)
- **Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- **Hồ sơ:** `GET/PUT /profile`
- **Sách:** `GET /books`, `GET /books/:id`, `GET /categories`, `POST/PUT/DELETE /books/:id` (admin), `GET /books/:id/copies` (admin)
- **Bình luận:** `GET/POST /books/:id/comments`, `GET /admin/comments`, `PATCH /comments/:id/visibility`, `DELETE /comments/:id` (admin)
- **Phiếu mượn:** `POST /loans`, `GET /loans/me`, `GET /admin/loans`, `PATCH /admin/loans/:id/status`, `DELETE /admin/loans/:id`, `POST /admin/overdue-audit` (admin)
- **Liên hệ:** `POST /contact`, `GET /admin/contacts` (admin)
- **Thống kê:** `GET/POST /stats/views`, `GET /admin/summary` (admin)
- **Upload:** `POST /admin/upload` (admin, base64 data-URI)
- **Health:** `GET /health`

## Bảo mật (tự viết)
PBKDF2-SHA256 (120k vòng) cho mật khẩu · token HMAC-SHA256 · so sánh chữ ký `timingSafeEqual` ·
rate-limit theo IP+path · CORS giới hạn ở production · cookie httpOnly/SameSite/Secure · SQL tham số hoá.

## Đối chiếu tiêu chí BTL (website)
DB lưu toàn bộ · đăng nhập/đăng xuất admin·user · trang nội dung theo mã (`/book/:id`) ·
form bình luận+đánh giá (≥100 ký tự, hiện công khai ngay) · popup quảng cáo sau 1 phút + cookie ·
trang giới thiệu + form liên hệ · trang quản trị (view, nội dung, bình luận) ·
responsive 3 ngưỡng (800/1200px) · API dùng chung cho mobile (Bearer token).
