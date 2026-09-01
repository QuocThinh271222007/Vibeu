# VIBEU — Demo Web App

Frontend-only demo dựng theo mô tả trong `Ý tưởng.docx`. Không có backend — mọi dữ liệu (mẫu, bài viết cộng đồng/blog) là dữ liệu tĩnh trong `src/data/`.

## Chạy thử

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build production vào dist/
```

## Cấu trúc

```
src/
  components/
    home/       Hero, Why-us, How-it-works, Suggested designs, CTA (trang chủ)
    layout/     Header, Footer, AuthModal (đăng nhập/đăng ký — chỉ UI)
    studio/     HandCanvas (engine vẽ nail + kéo/xoay/scale charm), các tab công cụ, Result/QR
    ui/         Button, Chip, Logo dùng chung
  data/         color/sticker manifest loader, 20 mẫu thiết kế, bài cộng đồng/blog demo
  lib/          toán học UV/hình học móng, gradient theo hiệu ứng sơn, QR, recipe
  store/        zustand store cho trạng thái thiết kế trong Studio
  pages/        Home, Studio, Library, Community, Blog, BlogPost, About
public/assets/  bản sao tài nguyên đã dùng từ 3 gói gốc (colors/stickers/hands)
```

## Nguồn tài nguyên

Ba gói nguồn ở thư mục gốc dự án (`VIBEU-Color-Pack-24`, `VIBEU-Sticker-Pack-144`, `VIBEU-Studio-Pro`) đã được gỡ bỏ để tinh gọn repo sau khi phần cần dùng đã được copy sang `public/assets/`:

- `VIBEU-Color-Pack-24` → `public/assets/colors/` (24 bảng phối màu, còn nguyên).
- `VIBEU-Studio-Pro` → `public/assets/hand-*` (2 ảnh tay thật, `cozy`/`matcha`) + `coordinates.json`. Phần `maps/` (normal/mask thử nghiệm) của gói này **không** được dùng — renderer hiện mô phỏng normal từ chính biên dạng mask thật (`nailLighting.ts`), không dựa trên map nào có sẵn.
- `VIBEU-Sticker-Pack-144` (Microsoft Fluent Emoji, MIT) → **không còn được dùng nữa**. Toàn bộ 144 sticker gốc trong gói này là emoji, không phải nail-art decal thật; đã bị thay hoàn toàn bằng thư viện decal SVG gốc trong `public/assets/decals/` (`scripts/generate-decals.mjs`, 125 decal, tự vẽ cho dự án — xem `source`/`license` trong `manifest.json`). Không còn nghĩa vụ giữ `LICENSE-MICROSOFT.txt` vì Fluent Emoji không còn được phân phối lại trong app.

Lịch sử git (trước commit gỡ 3 gói này) vẫn còn đầy đủ nội dung gốc nếu cần tra lại.

## Quyết định thiết kế đáng chú ý

- **Font logo/tiêu đề**: brief yêu cầu "Lucky Bones" — đây là font thương mại không có bản nhúng web miễn phí, nên đã thay bằng **Fredoka** (Google Fonts) — cùng tinh thần tròn trịa, trẻ trung. Đổi lại trong `index.html` + `index.css` nếu có file font gốc.
- **Form móng (Vuông/Nhọn/Coffin/Oval)**: vì chỉ có ảnh chụp tay thật cho 2 tông da (không có ảnh riêng từng form), form được mô phỏng bằng cách "cắt" thêm phần đầu móng trên nền mask thật (dùng `uvFrame` có sẵn trong `coordinates.json`) thay vì đổi ảnh — đủ để phân biệt trực quan và vẫn lưu đúng vào công thức xuất ra.
- **Màu da**: chỉ có 2 tông (`cozy`, `matcha`) vì đó là toàn bộ ảnh tay có sẵn trong `VIBEU-Studio-Pro`.
- **Mã QR**: sinh bằng thư viện `qrcode` phía client, trỏ tới một share-link dạng `vibeu.app/r/<id>` mang tính minh hoạ (chưa có backend để link thật sự mở lại thiết kế).
