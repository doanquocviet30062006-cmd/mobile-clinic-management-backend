# 🏥 Mobile Clinic Management System

Dự án Hệ thống Quản lý Phòng khám Di động tích hợp Trợ lý Y tế AI (AI Medical Assistant).

## 🌟 Giới thiệu chung
Dự án được phát triển nhằm giải quyết bài toán khó khăn của bệnh nhân trong việc chẩn đoán sơ bộ triệu chứng và đặt lịch đúng chuyên khoa. Bằng cách tích hợp AI (Google Gemini), ứng dụng giúp tự động hóa quá trình tư vấn và quản lý hồ sơ bệnh án điện tử an toàn.

## 🚀 Tính năng chính
- **Trợ lý AI (Symptom Checker):** Tự động hỏi đáp và chẩn đoán triệu chứng.
- **Đặt lịch thông minh:** Cơ chế chống trùng lịch (Pessimistic Locking).
- **Hồ sơ bệnh án (EMR):** Lưu trữ an toàn, bảo mật dữ liệu PII.
- **Thanh toán & Đánh giá:** Quản lý hóa đơn và đánh giá bác sĩ sau khám.
- **Push Notification:** Nhận thông báo lịch khám (FCM).

## 📐 Kiến trúc Hệ thống
Hệ thống sử dụng mô hình Client-Server:
- **Mobile App:** Android Native (Kotlin, MVVM).
- **Backend API:** Node.js, Express, Modular Monolith.
- **Cơ sở dữ liệu:** PostgreSQL (Dữ liệu chính), Redis (Cache & Queue).
- **AI Layer:** Google Gemini API.

## 🛠 Cách cài đặt và chạy dự án

### 1. Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

### 2. Mobile (Android)
- Mở thư mục `mobile/` bằng Android Studio.
- Sync Gradle và chạy trên Emulator.

## 🔑 Cấu hình API và Môi trường
Tạo file `.env` ở thư mục gốc Backend với các biến:
```
PORT=3000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=clinic_db
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_api_key_here
```

## 📱 Tài khoản Demo
- **Bệnh nhân:** `patient@demo.com` / `123456`
- **Bác sĩ:** `doctor@demo.com` / `123456`

---
*Dự án Bài tập lớn - Nhóm [Tên Nhóm của bạn]*
