# ZMind 🧠✨

Ứng dụng Sơ đồ Tư duy (Mind Map), Dàn ý (Outline) và Tiến độ (Gantt Chart) tương tác hiện đại với giao diện & trải nghiệm người dùng (UX/UI) chuẩn phong cách **Mindomo**.

## 🚀 Tính năng nổi bật

### 1. Đồng bộ 3 chế độ xem (Triple-View)
- **Mind Map**: Không gian vẽ mạng lưới vô tận (Network Graph), hỗ trợ kéo thả tự do, vòng lặp đa chiều.
- **Outline**: Chế độ danh sách dàn ý phân cấp, tích hợp checkbox công việc.
- **Gantt Chart**: Biểu đồ tiến độ trực quan với dòng thời gian, theo dõi tiến độ công việc theo ngày.

### 2. Đường liên kết cong Bézier & 2 Râu điều hướng ("2 râu điều hướng")
- Đường cong Bézier với mũi tên hai chiều.
- 2 râu điều khiển (square handles) kéo thả trực tiếp trên Canvas để chỉnh hướng, độ cong, và vị trí các đầu liên kết.
- Tùy biến kiểu đường (solid, dashed, dotted, long-dash), độ dày, màu sắc, và nhãn dán (Label).

### 3. Chọn nhiều đối tượng (Multi-Selection)
- **Bôi đen (`Ctrl + rê chuột`)**: Khung chọn Marquee box chọn hàng loạt node trong vùng bao.
- **Chọn ngẫu nhiên (`Ctrl + Click`)**: Thêm hoặc bớt node vào danh sách đang chọn.
- **Chọn tất cả (`Ctrl + A`)**.
- **Kéo thả hàng loạt**: Di chuyển đồng bộ tất cả các node đang chọn.
- **Thao tác nhanh**: Nhân bản hàng loạt (`Ctrl + D`), Xóa hàng loạt (`Delete`).

### 4. Menu chuột phải trên vùng tạo Map (Canvas Context Menu)
- **Floating topic**: Mở node độc lập mới ngay tại vị trí nhấp chuột phải hoặc phím tắt `Ctrl + 2xClick`.
- **Customize Theme**: Tùy chỉnh chủ đề màu sắc.
- **Diagram Background**: Thay đổi màu nền Canvas tức thì.
- **Fit diagram (`F8`)**: Tự động căn chỉnh sơ đồ vừa vặn với kích thước màn hình.
- **Export & Print (`Ctrl + P`)**: Xuất dữ liệu JSON và in sơ đồ.

### 5. Dashboard Quản lý Dự án & Sửa mã JSON trực tiếp
- Quản lý danh sách dự án: Xem, sửa tên, nhân bản, xóa, tìm kiếm thời gian thực.
- Trình soạn thảo mã JSON trực quan: Cho phép sửa code trực tiếp hoặc tạo mới dự án hoàn toàn bằng JSON.
- Sao lưu (Backup) và Phục hồi (Restore) toàn bộ cơ sở dữ liệu.

---

## 🛠️ Cài đặt & Chạy ứng dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Khởi chạy Backend Server (REST API)
```bash
node server.js
```
Backend API sẽ chạy tại: `http://localhost:3001`

### 3. Khởi chạy Frontend Dev Server
```bash
npm run dev
```
Giao diện ứng dụng sẽ chạy tại: `http://localhost:5173`

---

## 📦 Công nghệ sử dụng
- **Vue 3** (Composition API, `<script setup>`)
- **Vite**
- **Tailwind CSS**
- **Lucide Icons**
- **Node.js / Express** (REST API)
