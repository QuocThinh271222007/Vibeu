# Handoff — Sticker Pack 144

Đọc `manifest.json`. Không hardcode danh sách tên hoặc suy ra đường dẫn từ tên hiển thị. `stickers[].id` là khóa; mọi `variants.*.path` tính từ gốc pack. `nameVi`, `name`, `category`, `categoryVi`, `tags` phục vụ giao diện/tìm kiếm. Mỗi sticker có 3 biến thể `3d`, `color`, `flat`.

## Tích hợp dữ liệu

- Copy tài nguyên vào thư mục public/static của ứng dụng rồi thêm base URL vào đường dẫn manifest. Không cần hotlink hoặc gọi API nguồn khi chạy.
- Ưu tiên `3d` cho cảm giác sticker nổi; `flat` cho chỉnh màu. PNG 3D không có các lớp màu tách riêng.
- PNG có `width`, `height`, `alphaBounds` và `transparent`. `alphaBounds` dùng quy ước `[left, top, right, bottom]` theo pixel, cạnh phải/dưới không bao gồm. Tâm thị giác nên tính theo alpha bounds nếu cần tránh khoảng đệm lệch.
- Bảo toàn tỉ lệ ảnh khi thay kích thước. Các tệp vẫn giữ pixel/vector gốc; không giả định tất cả SVG có cùng viewBox.
- SVG từ nguồn có thể dùng ID gradient/filter. Dùng qua `<img>`/texture riêng hoặc prefix toàn bộ ID và các tham chiếu khi inline nhiều SVG trong một DOM. Tránh ID trùng khiến màu/mask hiện sai.

## Ghép lên móng

Tạo mỗi sticker thành một layer riêng, lưu ít nhất: `stickerId`, `variant`, ngón đích, UV tâm, scale, rotation, opacity, thứ tự lớp. Không lưu tọa độ màn hình làm tọa độ ảnh.

Gợi ý tâm ban đầu `[0.5,0.5]`, chiều rộng khoảng 55% chiều rộng móng. Cho người dùng kéo, xoay, đổi kích thước, nhân đôi, xóa, ẩn/hiện. Clip sau transform để sticker không tràn ra khỏi mask. Nếu muốn sticker vươn khỏi mép móng phải là tùy chọn riêng có chủ đích.

PNG 3D đã có hướng sáng cố định: renderer có thể tạo bóng đổ hoặc nhuộm màu nhẹ, nhưng không thể suy ra chính xác pháp tuyến/chiếu sáng 3D. Các bản SVG cũng không cung cấp dữ liệu bề mặt. Không gắn nhãn các PNG này là mô hình 3D.

## Kiểm tra và giấy phép

`validation.json` xác nhận đủ 144 thiết kế PNG khác nhau, 432 file, tất cả PNG có nền trong suốt, SVG đọc được và dữ liệu tải khớp Git blob SHA của nguồn. SHA-256 và URL riêng nằm ở từng variant trong manifest. Giữ `LICENSE-MICROSOFT.txt` và thông báo bản quyền Microsoft khi phân phối lại tài nguyên.

Đây không phải plugin cài sẵn hay file Figma. Không có thay đổi mã ứng dụng trong gói này.
