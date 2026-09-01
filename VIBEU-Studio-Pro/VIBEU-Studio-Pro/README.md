# VIBEU Nail Studio Pro

Mở `index.html` bằng trình duyệt trên máy tính. Toàn bộ mã, ảnh nền và ảnh tham khảo đã nhúng trong HTML; không cần máy chủ, tài khoản hay kết nối mạng để chỉnh móng.

## Dùng nhanh

1. Chọn nền bàn tay Cozy hoặc Matcha. Màu mặc định giữ theo ảnh nền đã làm sạch.
2. Chọn ngón bằng cách bấm vào móng hoặc nút tên ngón bên dưới. Phóng to để chỉnh chi tiết.
3. Chọn mẫu ở cột trái để phối cả bàn tay; ảnh thumbnail là ảnh tham khảo, bản phối được dựng bằng renderer của Studio.
4. Tab **Màu & gradient**: màu đơn, ombre, tỏa tròn hoặc aurora. Gradient có 2–5 điểm màu; kéo điểm trên thanh hoặc bật kéo hai đầu gradient trên móng. Thêm French tip, marble, chấm bi hoặc sọc.
5. Tab **Chất liệu**: gel, jelly, mắt mèo, kim tuyến, chrome, holographic hoặc lì. Chỉnh độ bóng, độ nhám và hướng/cường độ đèn. Đèn tác động tới các móng, không đổi ánh sáng da/nền ảnh.
6. Kéo màu, sticker hoặc ảnh vào móng. Trên thiết bị không hỗ trợ kéo thả thư viện, bấm màu/sticker/ảnh sau khi chọn ngón. Tab **Lớp** có xoay, kích thước, độ hiện, ẩn/hiện, hòa trộn, thứ tự và nhân đôi. Ảnh tải lên có tùy chọn bám ánh sáng móng. PNG trong suốt phù hợp cho decal.
7. **Áp dụng sơn cho 5 ngón** sao chép màu, gradient, họa tiết nền và chất liệu; các lớp trang trí vẫn riêng cho từng móng.
8. **Lưu** tải tệp JSON; **Mở thiết kế** nhập lại để chỉnh tiếp. **Xuất ảnh** tải bàn tay hoàn chỉnh, móng riêng hoặc 5 móng nền trong suốt. Đường viền chọn không đi vào ảnh xuất.

Phím mũi tên dịch lớp đang chọn khi canvas có tiêu điểm; Shift dịch nhanh hơn. Delete xóa lớp. Ctrl/Cmd+Z hoàn tác; Ctrl/Cmd+Shift+Z làm lại. Ảnh GIF được lấy khung hình tĩnh; ảnh lớn được giảm tối đa 2048 px ở cạnh dài. Mỗi móng hỗ trợ tối đa 40 lớp.

## Căn chỉnh và bộ map

Ảnh, mask, sơn và thao tác trỏ dùng cùng tọa độ ảnh gốc trong một Canvas. Tọa độ chuột được tính từ `getBoundingClientRect()` của chính canvas nên thay đổi kích thước hiển thị và thu phóng không tạo một hệ tọa độ overlay riêng. Renderer mới không dùng các ID SVG trùng giữa canvas và thumbnail như bản trước. Mask ngón cái Matcha đã được tinh chỉnh; tab **Căn chỉnh** có đường viền kiểm tra và điều chỉnh vị trí, xoay, tỉ lệ riêng từng ngón.

- `maps/cozy`, `maps/matcha`: mỗi móng có mask, normal, diffuse và specular PNG nền trong suốt, tổng cộng 40 map.
- `coordinates.json` trong mỗi thư mục map: kích thước ảnh, `bbox` `[x,y,width,height]`, path và trục UV từng móng. Các PNG được cắt theo bbox; đặt lại tại `(x,y)` ở tỉ lệ 1:1.
- `assets`: ảnh nền đúng kích thước và các móng tách riêng. Các map bám theo **ảnh nền đã làm sạch trong gói này**; ảnh gốc có sticker hoặc ảnh tạo lại khác cần bộ mask riêng.
- Normal RGB mã hóa `(nx*.5+.5, ny*.5+.5, nz*.5+.5)`; X hướng sang phải, Y hướng xuống trong hệ ảnh. Đây là normal theo hệ ảnh dùng bởi renderer này, không phải normal tiếp tuyến tiêu chuẩn của một mesh 3D. Diffuse là ánh sáng nền suy ra từ ảnh và độ cong; specular là mặt nạ phản sáng ảnh gốc.

Độ cong và pháp tuyến là mô phỏng 2.5D từ silhouette, không phải dữ liệu quét 3D. Màu gel, nhũ, chrome và sticker nổi được mô phỏng bằng Canvas; kết quả chưa đạt độ chân thực của ảnh render 3D. Bản này không tự đổi dáng móng, không tạo mẫu bằng AI trong trình duyệt và không tự đồng bộ sang Figma.

## Mã nguồn và kiểm tra

`src/engine.js` là renderer dùng chung cho ứng dụng và ảnh xem trước; `app.js` quản lý thao tác; `presets.js` chứa 6 công thức mẫu. Chạy `python3 build.py` để tạo lại HTML từ dữ liệu nhúng trong `src`. Nếu cần chạy kiểm tra, cài `@napi-rs/canvas` rồi chạy `node verify-renderer.cjs` và `node verify-project.cjs`.

Đã đạt 20 kiểm tra renderer và 11 kiểm tra lưu/mở thiết kế, gồm ánh xạ tọa độ ở 12 tổ hợp kích thước/vị trí cho mỗi bàn tay, biến đổi căn chỉnh nghịch đảo, sơn chỉ ảnh hưởng móng chọn, ảnh tải lên bị giới hạn bởi mask và vòng lưu/mở 6 preset. Các ảnh trong `previews` là đầu ra thực tế của cùng renderer. Đây không phải kiểm thử thao tác giao diện đầy đủ: trình duyệt của phiên làm việc đã từ chối mở tệp HTML cục bộ, nên chưa kiểm chứng bấm/kéo trực tiếp trên trình duyệt thật. Trang tham khảo AZSkin cũng không truy cập được trong phiên này.
