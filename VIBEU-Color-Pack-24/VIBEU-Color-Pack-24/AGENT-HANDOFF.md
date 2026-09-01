# Handoff — Color Pack 24

Đọc `manifest.json`; dùng `presets[].id` làm khóa ổn định. Mọi đường dẫn trong manifest tính từ gốc gói. Không cần gọi API hoặc tải ảnh ngoài khi chạy ứng dụng.

## Dữ liệu

- `palette`: 5 màu gợi ý cho 5 móng. Có thể áp dụng một màu mỗi ngón, hoặc để người dùng chọn riêng.
- `paint.color`: màu đơn gợi ý. `paint.stops`: 5 điểm màu với `at` trong [0,1].
- `paint.start`, `paint.end`: tọa độ UV chuẩn hóa của móng; U ngang, V từ chân móng tới đầu móng. Không phải tọa độ màn hình.
- `paint.mode`: `linear`, `radial`, `aurora`.
- `material`: gợi ý chất liệu tương thích với các tên dùng trong VIBEU Studio Pro. Nếu renderer khác, chuyển đổi rõ ràng thay vì bỏ qua trường.
- `pattern`: `french` ở Pink Coquette, các preset còn lại là `none`.
- `swatch.png` và `swatch.svg`: tài nguyên xem trước hoặc texture màu nền; không chứa sticker, mask hay ánh sáng 3D.

Để tái tạo màu giống PNG, nội suy các kênh sRGB giữa hai stop gần nhất. Với UV trong [0,1], `a=start`, `b=end`:

- Linear: `t = dot(uv-a,b-a)/dot(b-a,b-a)`.
- Radial: `t = length(uv-a)/length(b-a)`.
- Aurora: `t = 0.5 + 0.28*sin(u*5+v*4) + 0.22*cos(v*7-u*2)`.
- Clamp t về [0,1] trước khi nội suy.

SVG linear/radial dùng gradient vector. Hai SVG aurora là bản lấy mẫu vector 64×64; PNG 512×512 giữ chuyển màu mượt hơn. Với aurora nên dùng công thức hoặc PNG nếu không cần chỉnh các phần tử SVG.

## Khi tích hợp

Đặt ảnh nền, mask và màu trong cùng hệ tọa độ ảnh. Clip màu/họa tiết vào mask, rồi áp dụng ánh sáng/chất liệu. UI phải cho chỉnh lại HEX, stop, góc và chất liệu sau khi chọn preset. Đây là gói dữ liệu, không tự đăng ký preset vào ứng dụng và không phải tệp `.fig`.

Không tính 5 màu trong một preset là 5 preset: số preset độc lập trong gói là 24.
