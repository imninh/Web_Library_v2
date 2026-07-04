# Librumi Mobile — React Native + Expo

App mobile của Librumi, giao tiếp với backend đã deploy tại `https://web-library-v2.onrender.com/api`.

## Chạy trên máy thật (iOS/Android) — không cần Android Studio

1. Cài **Node.js ≥ 18** (đã có).
2. Cài dependencies:
   ```bash
   cd frontend-mobile
   npm install
   ```
3. Trên điện thoại, cài app **Expo Go** (App Store / Google Play).
4. Chạy dev server:
   ```bash
   npx expo start
   ```
   Terminal sẽ hiện 1 QR code.
5. Mở Expo Go → quét QR → app chạy trực tiếp trên điện thoại (điện thoại và máy tính phải cùng Wi‑Fi). Nếu Wi‑Fi khác nhau: chạy `npx expo start --tunnel`.

## Chạy trên web preview (kiểm tra nhanh)

```bash
npx expo start --web
```

Không cần điện thoại — mở trong trình duyệt.

## Cấu trúc

```
frontend-mobile/
├── App.tsx              # NavigationContainer + Tab/Stack + Providers
├── app.json             # Expo config
├── src/
│   ├── api.ts           # fetch wrapper (Authorization: Bearer)
│   ├── auth.tsx         # AuthProvider + useAuth (React Context)
│   ├── theme.ts         # colors + statusMeta + cover palette
│   ├── types.ts         # Book/User/Loan/...
│   ├── components/
│   │   ├── BookRow.tsx
│   │   ├── Chip.tsx
│   │   ├── Sheet.tsx    # Modal bottom-sheet dùng cho Review + Borrow
│   │   └── Toast.tsx
│   └── screens/
│       ├── HomeScreen.tsx     # greeting + featured + categories + available now
│       ├── SearchScreen.tsx   # search input + chips + result list
│       ├── BookScreen.tsx     # cover + info + reviews + Borrow bar cố định
│       ├── CardScreen.tsx     # library card + my loans
│       └── ProfileScreen.tsx  # login/register OR profile edit + admin loan mgmt
```

## Tài khoản demo (khớp backend)

- Admin: `admin` / `admin123`
- User:  `user` / `user123`

Đăng ký tài khoản mới ở tab **Profile → Register**.
