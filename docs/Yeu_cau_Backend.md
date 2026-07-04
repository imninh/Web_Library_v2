# Bản Yêu Cầu Backend — Librumi (Build lại từ đầu)

> **Phiên bản:** 1.0 · **Ngày:** 2026-07-02
> **Phạm vi:** Đặc tả yêu cầu cho **backend** hệ thống thư viện số Librumi khi viết lại từ đầu.
> **Công nghệ chốt:** Node.js + Express (thiết kế API lại sạch, không bắt buộc tương thích ngược).
> **Mục tiêu:** Đáp ứng đầy đủ tiêu chí chấm điểm Bài Tập Lớn (`docs/Yeu_cau_BTL.md`), phục vụ chung cho **website** và **mobile app**.

---

## 1. Tổng quan & nguyên tắc

### 1.1. Bối cảnh
Backend là một REST API server duy nhất, phục vụ đồng thời:
- **Website** (HTML/CSS/JS thuần trong `frontend-web/public`) — vừa host tĩnh, vừa gọi API.
- **Mobile app** (React Native / Expo) — chỉ gọi API.

Nghiệp vụ cốt lõi: quản lý **sách → bản sao sách → phiếu mượn**, hồ sơ bạn đọc, bình luận/đánh giá, liên hệ, thống kê truy cập, trang quản trị.

### 1.2. Nguyên tắc thiết kế (bám BTL)
| Nguyên tắc | Diễn giải |
|---|---|
| **Thư viện tối thiểu** | Chỉ dùng Express + vài middleware nền tảng. Logic nghiệp vụ (xác thực, băm mật khẩu, rate-limit, validate) **tự viết**, không kéo framework nặng — tránh bị trừ điểm "dùng thư viện dựng sẵn". |
| **Một nguồn sự thật** | Toàn bộ dữ liệu (kể cả liên hệ) lưu trong **database**, không rải ra file JSON. |
| **API dùng chung** | Web và mobile gọi **cùng một bộ endpoint**. Không tạo API riêng cho mobile. |
| **Tồn kho suy diễn** | `total_stock` / `stock` của sách luôn **tính lại từ bảng `book_copies`**, không sửa tay rời rạc. |
| **Mượn theo bản sao** | Người dùng gửi yêu cầu theo đầu sách; admin duyệt và cấp **một bản sao cụ thể** (`book_copy_id`). |
| **Trạng thái tường minh** | Mọi vòng đời (phiếu mượn, bản sao, tài khoản) dùng enum rõ ràng, chuyển trạng thái có kiểm soát. |

### 1.3. Ngoài phạm vi backend
- Giao diện, CSS responsive, popup quảng cáo + cookie "không hiện lại": **do frontend đảm nhiệm**. Backend chỉ cấp dữ liệu sản phẩm được quảng cáo và bộ đếm view.
- Thanh toán, giỏ hàng thương mại (đây là thư viện, không bán sách).

---

## 2. Kiến trúc & công nghệ

### 2.1. Stack
- **Runtime:** Node.js ≥ 18
- **Framework:** Express 4
- **Ngôn ngữ:** JavaScript (CommonJS) — hoặc TypeScript nếu muốn nâng cấp (khuyến nghị nhưng không bắt buộc cho BTL).
- **Database:** chọn **một** adapter, cấu hình qua biến môi trường:
  - **Dev / chấm bài local:** SQLite (khởi tạo tự động, không cần cài server DB).
  - **Production (tuỳ chọn):** PostgreSQL.
  - Cả hai adapter phải cùng schema và cùng interface truy vấn (`query`, `run`, `getLastId`).

### 2.2. Cấu trúc thư mục đề xuất (tách lớp rõ ràng)
```text
backend/
├── server.js              # Khởi tạo app, middleware, mount routes, listen
├── config/
│   └── env.js             # Đọc & validate biến môi trường
├── db/
│   ├── index.js           # Chọn adapter theo env
│   ├── sqlite.js          # Adapter SQLite
│   ├── postgres.js        # Adapter PostgreSQL
│   ├── schema.sql         # DDL tạo bảng
│   └── seed.js            # Dữ liệu mẫu (admin/user + vài sách)
├── middleware/
│   ├── auth.js            # requireAuth, requireAdmin
│   ├── rateLimit.js       # rate limit tự viết
│   └── error.js           # global error handler
├── modules/               # Tách theo domain
│   ├── auth/              # register, login, logout, me
│   ├── profile/
│   ├── books/            # + book_copies (inventory)
│   ├── loans/
│   ├── comments/
│   ├── contact/
│   ├── stats/            # views + admin summary
│   └── uploads/
├── services/
│   └── overdueAudit.js    # tác vụ nền quét quá hạn
└── utils/
    ├── password.js        # hash / verify (PBKDF2)
    ├── token.js           # tạo / xác thực token
    └── validate.js        # cleanText, isEmail, sanitize ảnh...
```

### 2.3. Biến môi trường (`.env`)
| Biến | Bắt buộc | Mặc định | Ý nghĩa |
|---|:---:|---|---|
| `PORT` | không | `4000` | Cổng server |
| `NODE_ENV` | không | `development` | `production` bật cookie `secure`, `trust proxy` |
| `AUTH_TOKEN_SECRET` | **có (prod)** | — | Khoá HMAC ký token. **Không** để giá trị mặc định ở production |
| `DB_ADAPTER` | không | `sqlite` | `sqlite` \| `postgres` |
| `DATABASE_URL` | khi dùng postgres | — | Chuỗi kết nối PostgreSQL |
| `LIBRUMI_DATA_DIR` | không | thư mục backend | Nơi lưu file SQLite + uploads (disk bền vững khi deploy) |
| `CORS_ORIGINS` | không | `*` (dev) | Danh sách origin cho phép, phân tách bằng dấu phẩy |
| `MAX_ACTIVE_LOANS` | không | `5` | Số phiếu đang mượn tối đa/người (0 = không giới hạn) |

---

## 3. Mô hình dữ liệu

### 3.1. Sơ đồ quan hệ
```text
users (1) ──< (1) user_profiles
users (1) ──< (n) loans
users (1) ──< (n) comments        (tuỳ chọn: comment gắn user_id nếu đã đăng nhập)
books (1) ──< (n) book_copies
books (1) ──< (n) loans
book_copies (1) ──< (0..1) loans  (một bản sao chỉ gắn 1 phiếu đang hiệu lực)
books (1) ──< (n) comments
contacts (độc lập)
site_stats (1 dòng: bộ đếm view)
```

### 3.2. Bảng `users`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | INTEGER/SERIAL | PK, auto | |
| `username` | TEXT | UNIQUE, NOT NULL | |
| `password` | TEXT | NOT NULL | Băm PBKDF2 (`pbkdf2_sha256$salt$hash`) |
| `role` | TEXT | NOT NULL, default `user` | `admin` \| `user` |
| `created_at` | DATETIME | default now | |

### 3.3. Bảng `user_profiles` (hồ sơ bạn đọc = thẻ thư viện)
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | PK | | |
| `user_id` | INTEGER | UNIQUE, FK→users, NOT NULL | |
| `full_name` | TEXT | | Bắt buộc để "hồ sơ hoàn tất" |
| `library_card_id` | TEXT | UNIQUE | Mã thẻ thư viện, không trùng |
| `email` | TEXT | | |
| `account_status` | TEXT | default `active` | `active` \| `blocked` |
| `created_at` / `updated_at` | DATETIME | | |

> **Hồ sơ hoàn tất** khi có đủ `full_name` + `library_card_id` + `email`. Điều kiện tiên quyết để gửi yêu cầu mượn.

### 3.4. Bảng `books`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | PK | | |
| `title` | TEXT | NOT NULL | |
| `author` | TEXT | NOT NULL | |
| `category` | TEXT | NOT NULL | Dùng cho lọc & danh mục |
| `description` | TEXT | | |
| `image` | TEXT | | URL, đường dẫn `/uploads/...` hoặc data-URI |
| `isbn` | TEXT | | tuỳ chọn |
| `publisher` | TEXT | | tuỳ chọn |
| `year` | INTEGER | | tuỳ chọn |
| `total_stock` | INTEGER | default 0 | **Suy diễn** = số bản sao |
| `stock` | INTEGER | default 0 | **Suy diễn** = số bản sao `available` |
| `borrow_count` | INTEGER | default 0 | Số lượt đã cho mượn thành công (thay cho `sold` cũ) |
| `featured` | INTEGER(bool) | default 0 | Sách nổi bật / sách quảng cáo popup |
| `created_at` | DATETIME | | |

> **Bỏ** `price` / `original_price` của bản cũ (là tàn dư thương mại). Nếu cần "phí phạt trễ hạn" thì mô hình hoá riêng, không tái dùng cột giá.

### 3.5. Bảng `book_copies`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | PK | | |
| `book_id` | INTEGER | FK→books, NOT NULL | |
| `copy_code` | TEXT | UNIQUE | Mã bản sao, sinh tự động |
| `status` | TEXT | default `available` | `available` \| `borrowing` \| `overdue` |
| `created_at` | DATETIME | | |

### 3.6. Bảng `loans` (phiếu mượn)
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | PK | | |
| `book_id` | INTEGER | FK→books, NOT NULL | Đầu sách được yêu cầu |
| `book_copy_id` | INTEGER | FK→book_copies, NULL | Gán khi admin duyệt |
| `user_id` | INTEGER | FK→users | |
| `borrower_name` | TEXT | NOT NULL | Chụp lại từ hồ sơ lúc mượn |
| `library_card_id` | TEXT | | Chụp lại từ hồ sơ |
| `status` | TEXT | default `pending` | Xem §7.1 |
| `due_date` | DATE | | Ngày hẹn trả |
| `approved_at` | DATETIME | | |
| `borrowed_at` | DATETIME | | |
| `returned_at` | DATETIME | | |
| `overdue_at` | DATETIME | | |
| `rejection_reason` | TEXT | | |
| `created_at` | DATETIME | | |

### 3.7. Bảng `comments` (bình luận & đánh giá)
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | PK | | |
| `book_id` | INTEGER | FK→books, NOT NULL | |
| `name` | TEXT | NOT NULL | Tên người bình luận |
| `email` | TEXT | NOT NULL | |
| `content` | TEXT | NOT NULL | **≥ 100 ký tự** |
| `rating` | INTEGER | NOT NULL, 1–5 | |
| `hidden` | INTEGER(bool) | default 0 | Admin ẩn/hiện |
| `created_at` | DATETIME | | |

### 3.8. Bảng `contacts` (chuyển từ file JSON vào DB)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | PK | |
| `name` | TEXT NOT NULL | |
| `email` | TEXT NOT NULL | |
| `subject` | TEXT | default `general` |
| `message` | TEXT NOT NULL | |
| `created_at` | DATETIME | |

### 3.9. Bảng `site_stats` (bộ đếm view toàn site)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | PK CHECK(id=1) | Chỉ 1 dòng |
| `view_count` | INTEGER default 0 | |

### 3.10. Bảng enum tham chiếu
- `loans.status`: `pending`, `borrowing`, `returned`, `overdue`, `rejected`
- `book_copies.status`: `available`, `borrowing`, `overdue`
- `user_profiles.account_status`: `active`, `blocked`
- `users.role`: `admin`, `user`

### 3.11. Chỉ mục khuyến nghị
`books(category)`, `books(featured)`, `book_copies(book_id, status)`, `loans(user_id, status)`, `loans(book_id, status)`, `comments(book_id, hidden)`, `user_profiles(library_card_id)`.

---

## 4. Vai trò & phân quyền

| Vai trò | Quyền |
|---|---|
| **Khách (chưa đăng nhập)** | Xem sách, danh mục, bình luận công khai; gửi bình luận; gửi liên hệ; xem/tăng view |
| **user** | Toàn bộ quyền khách + quản lý hồ sơ + gửi/huỷ yêu cầu mượn + xem phiếu mượn của mình |
| **admin** | Toàn bộ + CRUD sách/bản sao + duyệt/từ chối/trả/xoá phiếu mượn + quản lý bình luận + xem liên hệ + dashboard + upload ảnh |

Middleware:
- `requireAuth` — chặn 401 nếu chưa đăng nhập hợp lệ; gắn `req.user` (kèm hồ sơ + thống kê mượn).
- `requireAdmin` — chạy `requireAuth` rồi chặn 403 nếu `role != admin`.

---

## 5. Xác thực (Authentication)

### 5.1. Cơ chế
- **Mật khẩu:** băm bằng **PBKDF2-SHA256** (≥120.000 vòng, salt ngẫu nhiên), lưu dạng `pbkdf2_sha256$salt$hash`. So khớp bằng `timingSafeEqual`.
- **Phiên:** token tự ký **HMAC-SHA256** dạng `base64url(payload).signature`, payload chứa `sub` (userId) + `exp`. TTL 7 ngày.
- **Hai kênh nhận token** (phục vụ cả web lẫn mobile):
  - **Cookie** `httpOnly`, `sameSite=lax`, `secure` khi production — cho web.
  - **Header** `Authorization: Bearer <token>` — cho mobile.
- **Không** dùng thư viện JWT bên ngoài — tự ký/verify bằng module `crypto` (đúng tinh thần BTL).

### 5.2. Luật
- Sai username/password → `401`, thông báo mờ (không tiết lộ cái nào sai).
- Đăng nhập thành công: chạy quét quá hạn + đồng bộ trạng thái tài khoản, trả token + cờ `needs_profile`.
- Logout: xoá cookie phía server (client tự xoá token đã lưu).
- Tài khoản `blocked` **vẫn đăng nhập được** (để xem tình trạng) nhưng **không gửi được yêu cầu mượn**.

---

## 6. Đặc tả API (REST)

Tiền tố chung: `/api`. Kiểu dữ liệu JSON. Quy ước lỗi ở §9.

### 6.1. Auth
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register` | khách | Đăng ký user mới (role=`user`) |
| POST | `/api/auth/login` | khách | Đăng nhập, trả token |
| POST | `/api/auth/logout` | any | Đăng xuất |
| GET | `/api/auth/me` | any | Thông tin phiên hiện tại (hoặc `{user:null}`) |

**POST `/api/auth/register`** — body: `{ username, password }` (tuỳ chọn kèm `full_name, library_card_id, email` để tạo hồ sơ luôn). Ràng buộc: username chưa tồn tại, password ≥ 6 ký tự. Trả `201` + token.

**POST `/api/auth/login`** — body: `{ username, password }`. Trả:
```json
{
  "success": true,
  "token": "<auth-token>",
  "user": { "id": 1, "username": "user", "role": "user" },
  "needs_profile": true,
  "account_status": "active"
}
```

**GET `/api/auth/me`** — trả `{ user: { id, username, role, profile_complete, account_status, current_borrow_count, overdue_count } }`.

### 6.2. Hồ sơ bạn đọc
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/profile` | user | Lấy hồ sơ + thống kê mượn |
| PUT | `/api/profile` | user | Tạo/cập nhật hồ sơ |

**PUT `/api/profile`** — body: `{ full_name, library_card_id, email }`. Ràng buộc: đủ 3 trường, email hợp lệ, `library_card_id` không trùng người khác → nếu trùng trả `400`. Trả hồ sơ + `profile_complete` + `account_status`.

### 6.3. Sách (catalog)
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/books` | khách | Danh sách, lọc `category`, `search`, `featured`, phân trang `page`,`limit`, `sort` |
| GET | `/api/books/:id` | khách | Chi tiết một sách |
| GET | `/api/categories` | khách | Danh sách category duy nhất |
| POST | `/api/books` | admin | Tạo sách (kèm `total_stock` → sinh bản sao) |
| PUT | `/api/books/:id` | admin | Sửa sách; đổi `total_stock` → điều hoà bản sao |
| DELETE | `/api/books/:id` | admin | Xoá sách (chỉ khi không còn phiếu/bản sao đang hoạt động) |
| GET | `/api/books/:id/copies` | admin | Liệt kê bản sao của sách |

- Danh sách sách trả kèm `stock`, `total_stock` (suy diễn) để frontend biết còn/hết.
- **Xoá sách:** chặn nếu còn phiếu `pending`/`borrowing`/`overdue` hoặc bản sao đang được giữ. Nếu hợp lệ → xoá kèm bản sao + bình luận liên quan.

### 6.4. Bình luận & đánh giá
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/books/:id/comments` | khách | Bình luận **công khai** (hidden=0) |
| POST | `/api/books/:id/comments` | khách | Gửi bình luận |
| GET | `/api/admin/comments` | admin | Toàn bộ (lọc `book_id`, `rating`, `sort`) |
| PATCH | `/api/comments/:id/visibility` | admin | Ẩn/hiện |
| DELETE | `/api/comments/:id` | admin | Xoá |

**POST bình luận** — body: `{ name, email, content, rating }`. Ràng buộc:
- Đủ `name`, `email` (hợp lệ), `content`, `rating` 1–5.
- `content` **≥ 100 ký tự** → nếu ngắn hơn trả `400`.
- Lọc **từ cấm** (danh sách cấu hình được) → nếu chứa, trả `400`.
- Rate limit (§10).
- Sau khi gửi, bình luận **hiển thị công khai ngay** (hidden=0) — đúng yêu cầu BTL.

### 6.5. Phiếu mượn
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/loans` | user | Gửi yêu cầu mượn (một hoặc nhiều đầu sách) |
| GET | `/api/loans/me` | user | Phiếu mượn của tôi |
| GET | `/api/admin/loans` | admin | Toàn bộ phiếu (ưu tiên `pending`, `overdue`) |
| PATCH | `/api/admin/loans/:id/status` | admin | Duyệt / từ chối / trả |
| DELETE | `/api/admin/loans/:id` | admin | Xoá phiếu (không xoá phiếu đang mượn/quá hạn) |
| POST | `/api/admin/overdue-audit` | admin | Chạy quét quá hạn thủ công |

**POST `/api/loans`** — body: `{ items: [{ id }], due_date }`. Luật đầy đủ ở §7.2.

**PATCH `/api/admin/loans/:id/status`** — body: `{ status, reason? }`, với `status` ∈ `{ approved|borrowing, rejected, returned }` (`approved` ánh xạ sang `borrowing`). Luật chuyển trạng thái ở §7.1.

### 6.6. Liên hệ
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/contact` | khách | Gửi ý kiến liên hệ (lưu **DB**) |
| GET | `/api/admin/contacts` | admin | Danh sách liên hệ, mới nhất trước |

### 6.7. Thống kê & view
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/stats/views` | khách | Số view toàn site |
| POST | `/api/stats/views` | khách | Tăng view (hoặc middleware tự tăng khi tải trang HTML) |
| GET | `/api/admin/summary` | admin | Dữ liệu dashboard |

**GET `/api/admin/summary`** trả: tổng view, tổng sách, tổng category, tổng bình luận, tổng lượt mượn, khối `needs_attention` (`pending_loans`, `overdue_loans`, `out_of_stock_books`, `new_reviews`) và `top_books` (theo `borrow_count`).

### 6.8. Upload ảnh
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/admin/upload` | admin | Upload ảnh bìa sách |

- Chỉ nhận `image/jpeg|png|webp|gif`, ≤ 5MB.
- Lưu vào thư mục `uploads/` (disk cấu hình qua `LIBRUMI_DATA_DIR`), trả `{ url }`.
- Tuỳ chọn: nếu cấu hình object storage thì đẩy lên và trả URL công khai; nếu không, fallback data-URI/đường dẫn tĩnh.

### 6.9. Health
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/health` | khách | `{ ok, service, bookCount, time }` — dùng cho health-check khi deploy |

> **Lưu ý sửa lỗi:** bản cũ `/api/health` gọi `require('./turso-backup')` (file không tồn tại) → endpoint sập. Bản mới **bỏ hoàn toàn** phụ thuộc này.

---

## 7. Quy tắc nghiệp vụ chi tiết

### 7.1. Vòng đời phiếu mượn (state machine)
```text
                 admin duyệt (cấp copy)         admin trả
   pending ───────────────────────────► borrowing ──────────► returned
      │                                      │
      │ admin từ chối                        │ cron quá hạn (due_date < hôm nay)
      ▼                                      ▼
   rejected                               overdue ──────────► returned (admin trả)
```
Quy tắc chuyển:
- `pending → borrowing`: chỉ khi phiếu đang `pending`, hồ sơ người mượn hoàn tất, tài khoản `active`, và **còn bản sao `available`**. Khi duyệt: gán `book_copy_id`, đặt copy = `borrowing`, set `approved_at` + `borrowed_at`, đồng bộ tồn kho.
- `pending → rejected`: chỉ từ `pending`; lưu `rejection_reason`.
- `borrowing|overdue → returned`: trả copy về `available`, set `returned_at`, `books.borrow_count += 1`, đồng bộ tồn kho + đồng bộ trạng thái tài khoản (có thể mở khoá).
- Chuyển trạng thái khác → `400`.

### 7.2. Gửi yêu cầu mượn (`POST /api/loans`)
Tuần tự kiểm tra, dừng ở lỗi đầu tiên:
1. Có `items` và `due_date` → nếu thiếu `400`.
2. Hồ sơ hoàn tất → nếu chưa `403`.
3. Đồng bộ trạng thái tài khoản; nếu `blocked` (đang có sách quá hạn) → `403`.
4. `due_date` **phải sau hôm nay** → nếu không `400`.
5. Chuẩn hoá danh sách `book_id` (loại trùng); rỗng → `400`.
6. Với mỗi sách: tồn tại; và người dùng **chưa có** phiếu `pending`/`borrowing`/`overdue` cho chính sách đó → nếu có `400`.
7. (Tuỳ chọn) Không vượt `MAX_ACTIVE_LOANS`.
8. Tạo mỗi sách một phiếu `pending`, chụp `borrower_name` + `library_card_id` từ hồ sơ.

> Người dùng **không** tự chuyển sang `borrowing` — luôn phải qua admin duyệt.

### 7.3. Đồng bộ tồn kho (`syncBookAvailability`)
Sau mọi thay đổi bản sao/phiếu mượn:
```text
books.total_stock = COUNT(book_copies WHERE book_id = ?)
books.stock       = COUNT(book_copies WHERE book_id = ? AND status = 'available')
```

### 7.4. Điều hoà bản sao khi sửa `total_stock` (`reconcileBookCopies`)
- Tăng: sinh thêm bản sao `available` (mã `copy_code` duy nhất).
- Giảm: chỉ được xoá bản sao `available`; **không** cho giảm xuống dưới số bản sao đang được giữ/mượn → `400`.

### 7.5. Quá hạn & khoá tài khoản
- Phiếu `borrowing` có `due_date < hôm nay` → chuyển `overdue`, copy → `overdue`, set `overdue_at`.
- Người dùng có ≥1 phiếu `overdue` → `account_status = blocked`; hết phiếu quá hạn → tự `active`.
- Tài khoản `blocked` không gửi yêu cầu mượn mới và không được admin duyệt phiếu.

---

## 8. Tác vụ nền (cron nội bộ)
- Khi server khởi động: chạy `overdueAudit` một lần.
- Lặp mỗi **24 giờ** bằng `setInterval` (không dùng thư viện cron ngoài).
- `overdueAudit` cũng được gọi **cơ hội** ở các điểm quan trọng: login, `GET /auth/me`, `GET /profile`, `GET /admin/loans`, `GET /loans/me`, trước khi tạo phiếu — để dữ liệu luôn tươi ngay cả khi cron chưa tới hạn.
- Có endpoint `POST /api/admin/overdue-audit` để admin kích hoạt thủ công (tiện demo/chấm bài).

---

## 9. Validation & xử lý lỗi

### 9.1. Chuẩn hoá đầu vào
- `cleanText(value, maxLen)`: bỏ ký tự điều khiển, `trim`, cắt độ dài.
- `isEmail`: regex email cơ bản.
- Ảnh: chỉ chấp nhận data-URI ảnh hợp lệ, URL `http(s)`, hoặc đường dẫn `/uploads` \| `/images`.
- Ép kiểu số an toàn cho `rating`, `total_stock`, phân trang.

### 9.2. Định dạng lỗi (thống nhất)
```json
{ "error": "Thông báo tiếng Việt dễ hiểu" }
```
| HTTP | Khi nào |
|---|---|
| 400 | Thiếu/sai dữ liệu, vi phạm nghiệp vụ (ví dụ nội dung < 100 ký tự) |
| 401 | Chưa đăng nhập / token sai/hết hạn |
| 403 | Không đủ quyền / tài khoản bị khoá / hồ sơ chưa hoàn tất |
| 404 | Không tìm thấy tài nguyên |
| 429 | Vượt rate limit |
| 500 | Lỗi máy chủ (đã log, thông báo chung) |

- Có **global error handler** cuối chuỗi middleware; lỗi Multer/định dạng file → `400`, còn lại → `500` + log server.
- Toàn bộ thông báo người dùng bằng **tiếng Việt**, encode UTF-8 chuẩn (sửa lỗi mojibake ở bản cũ).

---

## 10. Bảo mật
| Hạng mục | Yêu cầu |
|---|---|
| **Rate limit** | Tự viết middleware theo IP+path: login (20 lần/15 phút), bình luận (10/10 phút), liên hệ (5/10 phút), upload (20/10 phút) → vượt trả `429` |
| **Mật khẩu** | PBKDF2 như §5; không bao giờ trả `password` ra response |
| **Token** | HMAC-SHA256, so sánh chữ ký bằng `timingSafeEqual`; secret lấy từ env ở production |
| **CORS** | Production giới hạn theo `CORS_ORIGINS`, `credentials: true`; không phản chiếu mọi origin |
| **Cookie** | `httpOnly`, `sameSite=lax`, `secure` ở production |
| **Upload** | Whitelist MIME + giới hạn 5MB + đổi tên file ngẫu nhiên |
| **SQL** | Luôn tham số hoá (`?`/`$n`), không nối chuỗi trực tiếp |
| **Sanitize** | Làm sạch mọi text đầu vào trước khi lưu |

---

## 11. Yêu cầu phi chức năng
- **Hiệu năng:** phân trang cho `books`, `comments`, `loans` (mặc định `limit=20`), tránh trả toàn bộ bảng.
- **Khả chuyển:** chạy được ngay bằng `npm install && npm start` với SQLite, không cần dịch vụ ngoài.
- **Bền vững dữ liệu:** khi dùng SQLite, ghi file định kỳ/khi thay đổi; hỗ trợ `LIBRUMI_DATA_DIR` để trỏ sang disk bền vững khi deploy.
- **Logging:** log lỗi server ra console; log khởi động in rõ cổng + endpoint sức khoẻ.
- **Idempotent seed:** chạy lại server không nhân đôi dữ liệu mẫu.
- **Tài liệu:** README nêu cách chạy, tài khoản demo, danh sách endpoint.

---

## 12. Seed data & migration
- **Seed tối thiểu:** 2 tài khoản demo — `admin/admin123` (role admin), `user/user123` (role user) — băm mật khẩu ngay khi seed.
- Nên seed thêm vài **sách mẫu có bản sao** để chấm bài thấy ngay danh mục (bản cũ chỉ seed user, không seed sách — xem ghi chú ở §14).
- **Migration:** dùng file `schema.sql` idempotent (`CREATE TABLE IF NOT EXISTS`) + bước điều hoà (đảm bảo mỗi sách có đủ bản sao, đồng bộ tồn kho) khi khởi động.

---

## 13. Truy vết theo tiêu chí chấm BTL (Website)
| Tiêu chí BTL | Backend đáp ứng bằng |
|---|---|
| Lưu trữ dữ liệu bằng database | Toàn bộ ở DB (kể cả contacts, views) — §3 |
| Đăng nhập/đăng xuất, phân biệt admin/user | §5, §6.1, `role` |
| Trang nội dung theo mã | `GET /api/books/:id` — §6.3 |
| Form bình luận + đánh giá (tên, email, nội dung, điểm) | `POST /api/books/:id/comments` — §6.4 |
| Bình luận hiển thị công khai sau khi gửi | Mặc định `hidden=0`, `GET .../comments` trả công khai |
| Popup quảng cáo 1 sản phẩm định trước | Backend cấp sách `featured` qua `GET /api/books?featured=1` (hiển thị/cookie do frontend) |
| Trang giới thiệu + form liên hệ | `POST /api/contact` — §6.6 |
| Trang quản trị: số view toàn site | `GET /api/stats/views`, `GET /api/admin/summary` |
| Quản trị: cập nhật nội dung | CRUD sách — §6.3 |
| Quản trị: liệt kê + xoá bình luận | `GET /api/admin/comments`, `DELETE /api/comments/:id` |
| API dùng cho mobile | Cùng bộ endpoint, hỗ trợ Bearer token — §5.1 |

> Responsive 3 ngưỡng (800/1200px), popup + cookie, thiết kế giao diện: **frontend** chịu trách nhiệm; backend chỉ cung cấp dữ liệu.

---

## 14. Khác biệt & sửa lỗi so với bản cũ
Những điểm đã phát hiện trong code cũ, bản mới phải xử lý:
1. **`/api/health` sập** vì `require('./turso-backup')` không tồn tại → **loại bỏ**.
2. **Contact lưu file JSON** (`data/contact.json`) → **chuyển vào bảng `contacts`**.
3. **SQLite `sql.js` ghi cả file mỗi lần `run()`** — không an toàn đồng thời, chậm → cân nhắc dùng `better-sqlite3` hoặc gom ghi; tối thiểu đảm bảo an toàn ghi.
4. **Không có endpoint đăng ký** (chỉ seed sẵn) → bổ sung `POST /api/auth/register`.
5. **Tàn dư thương mại** (`price`, `original_price`, `sold`) → bỏ giá, đổi `sold` → `borrow_count`.
6. **Không seed sách** (theo memory: schema+users tự seed nhưng sách thì không; POST để `stock=0`, phải PUT lại `total_stock` mới sinh bản sao) → seed sẵn sách mẫu **kèm bản sao**, và `POST /api/books` sinh bản sao ngay theo `total_stock`.
7. **CORS phản chiếu mọi origin kèm credentials** → giới hạn theo `CORS_ORIGINS` ở production.
8. **`AUTH_TOKEN_SECRET` có giá trị mặc định dev** → bắt buộc đặt ở production.
9. **Endpoint trùng lặp** (`/api/books` và `/api/products` giống hệt; `/api/profile` và `/api/profile/me`) → hợp nhất còn một bộ tên nhất quán.
10. **Thiếu phân trang** → thêm cho các danh sách lớn.

---

## 15. Checklist bàn giao
- [ ] `npm install && npm start` chạy được với SQLite, không cần dịch vụ ngoài.
- [ ] Seed: admin/admin123, user/user123 + vài sách mẫu có bản sao.
- [ ] Đủ nhóm endpoint §6, phản hồi JSON đúng chuẩn lỗi §9.
- [ ] Vòng đời phiếu mượn §7.1 chạy đúng (duyệt/từ chối/trả/quá hạn).
- [ ] Quá hạn tự khoá tài khoản, trả sách tự mở khoá.
- [ ] Bình luận chặn < 100 ký tự và từ cấm; hiển thị công khai ngay.
- [ ] View counter tăng và đọc được; dashboard admin có số liệu.
- [ ] Contact lưu DB; admin xem được.
- [ ] Rate limit + CORS + cookie bảo mật hoạt động.
- [ ] Mobile gọi được bằng `Authorization: Bearer`.
- [ ] README cập nhật (cách chạy, tài khoản, danh sách API).

---
*Hết đặc tả. File này là nguồn chuẩn cho việc viết lại backend Librumi.*
