# Librumi — Thư viện số

Ứng dụng thư viện số cho phép người dùng duyệt danh mục sách, đặt mượn trực tuyến và quản lý phiếu mượn của mình. Gồm phiên bản web và mobile.

**Bản deploy:** https://web-library-v2.onrender.com (Render + Supabase Postgres)

## Chức năng chính

- Duyệt sách theo danh mục, tìm kiếm theo tiêu đề hoặc tác giả
- Xem chi tiết sách, đánh giá sao và bình luận công khai
- Đặt mượn online, xem lịch sử mượn của mình
- Gợi ý sách theo sở thích (wizard 3 bước)
- Chế độ dành cho trẻ em (Kids mode) với giao diện riêng
- Trang giới thiệu, liên hệ kèm bản đồ chi nhánh
- Khu vực quản trị: quản lý sách, phiếu mượn, bình luận, liên hệ

## Chạy dự án (local)

```bash
cd backend
npm install
npm start
```

Mở trình duyệt: **http://localhost:4000**. Muốn đổi cổng: `PORT=5000 npm start`.


## Hướng dẫn sử dụng

1. Truy cập trang chủ, chọn danh mục hoặc gõ tìm sách bạn quan tâm
2. Mở trang sách, nhấn **Reserve** để đặt mượn
3. Đăng ký tài khoản nếu chưa có, sau đó xác nhận lượt mượn
4. Vào mục **Hồ sơ** để xem các lượt mượn hiện tại và lịch sử
5. Có thể để lại đánh giá và bình luận trực tiếp ở trang sách

## Cấu trúc

```
backend/           # API server
frontend-web/      # Website
frontend-mobile/   # Ứng dụng di động          
```
