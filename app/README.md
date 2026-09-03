# VIBEU — Demo Web App

Dựng theo mô tả trong `Ý tưởng.docx`. Thư viện mẫu nail (20 mẫu, form/màu/hiệu ứng) vẫn là dữ liệu tĩnh trong `src/data/`. Đăng nhập, đăng bài Cộng đồng, và Blog do admin quản lý nay chạy trên **Supabase** (Postgres + Auth + Storage) — xem phần "Cấu hình Supabase" bên dưới. Không cấu hình thì app tự chạy ở "chế độ demo": vẫn xem được toàn bộ nội dung mẫu, nhưng đăng nhập/đăng bài/`/admin` sẽ hiện thông báo yêu cầu kết nối thay vì báo lỗi.

## Chạy thử

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build production vào dist/
```

## Cấu hình Supabase

1. Tạo project miễn phí tại [supabase.com](https://supabase.com).
2. Vào **SQL Editor**, dán toàn bộ nội dung `supabase/schema.sql` và chạy — tạo bảng `profiles`, `community_posts`, `community_likes`, `blog_posts`, RLS policies, và bucket Storage `community-media`.
3. Copy `.env.example` thành `.env.local`, điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
4. Đăng ký một tài khoản qua `/auth`, sau đó trong SQL Editor chạy:
   ```sql
   update public.profiles set role = 'admin' where email = 'ban@example.com';
   ```
   để mở khoá `/admin`.
5. `npm run dev` lại — Header sẽ hiện avatar thật, Cộng đồng cho đăng bài, `/admin` dùng được.

**Những gì đã nối Supabase:** đăng ký/đăng nhập (email+mật khẩu), đăng bài + thích bài trên Cộng đồng (kèm upload ảnh thật), trang `/admin` (Blog CRUD, kiểm duyệt bài Cộng đồng, cấp quyền admin cho user, xem công thức đã xuất qua QR). **Chưa đụng tới** (theo yêu cầu): form móng và độ dài móng trong Studio vẫn dùng dữ liệu tĩnh như cũ.

## Hệ thống Mã QR / Công thức

Bấm "Xuất công thức & Mã QR" trong Studio tạo ra một link `/r/<id>` **tự chứa toàn bộ thiết kế** (form, màu, hiệu ứng, charm, nét vẽ tay, tông da) — nén gzip + mã hoá base64url ngay trong phần `#d=...` của URL (xem `src/lib/designCodec.ts`). Vì dữ liệu nằm ngay trong mã QR, việc quét luôn mở lại **đúng y hệt** bản thiết kế đó, kể cả khi không kết nối Supabase. Khi có kết nối Supabase, mỗi lần xuất còn được lưu thêm vào bảng `shared_designs` — dùng làm phương án dự phòng cho thiết kế quá chi tiết (nhiều charm/nét vẽ khiến URL vượt ngưỡng quét được) và để `/admin/recipes` liệt kê/kiểm duyệt. Trang `/r/:id` có nút "Mở trong Studio để chỉnh sửa" để tiếp tục chỉnh từ đúng bản đã quét.

## Cấu trúc

```
src/
  components/
    home/       Hero, Why-us, How-it-works, Suggested designs, CTA (trang chủ)
    layout/     Header (nav + trạng thái đăng nhập thật), Footer
    community/  NewPostComposer (đăng bài Cộng đồng, chỉ hiện khi đã đăng nhập)
    studio/     HandCanvas (engine vẽ nail + kéo/xoay/scale charm), các tab công cụ, Result/QR
    ui/         Button, Chip, Logo dùng chung
  data/         color/sticker manifest loader, 20 mẫu thiết kế, bài cộng đồng/blog "biên tập sẵn"
  hooks/        useBlogPosts (gộp bài blog tĩnh + bài đăng từ /admin)
  lib/          toán học UV/hình học móng, gradient theo hiệu ứng sơn, QR, recipe,
                supabaseClient/communityApi/blogApi/adminApi (lớp gọi Supabase)
  store/        zustand: studioStore (thiết kế trong Studio), authStore (phiên đăng nhập)
  pages/        Home, Studio, Library, Community, Blog, BlogPost, About, Auth
  pages/admin/  AdminLayout (bảo vệ route theo role) + Home/BlogList/BlogEditor/Community/Users
supabase/       schema.sql — chạy 1 lần trong SQL Editor của project Supabase
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
- **Mã QR**: sinh bằng thư viện `qrcode` phía client; link trỏ tới origin thật của app (không còn hardcode `vibeu.app`) và tự chứa dữ liệu thiết kế — xem mục "Hệ thống Mã QR / Công thức" ở trên.
