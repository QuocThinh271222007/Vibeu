# VIBEU — Demo Web App

Dựng theo mô tả trong `Ý tưởng.docx`. Thư viện mẫu, bài Blog và bài Cộng đồng (kể cả bộ nội dung khởi tạo ban đầu — 21 mẫu, 6 bài blog, 15 bài cộng đồng) đều là dữ liệu thật trên **Supabase** (Postgres + Auth + Storage), sửa/xoá được từ `/admin` — xem phần "Cấu hình Supabase" bên dưới. Không cấu hình Supabase thì Thư viện mẫu/Blog/Cộng đồng sẽ trống (không còn nội dung tĩnh đóng gói sẵn trong code), còn đăng nhập/đăng bài/`/admin` hiện thông báo yêu cầu kết nối thay vì báo lỗi.

## Chạy thử

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build production vào dist/
```

## Cấu hình Supabase

1. Tạo project miễn phí tại [supabase.com](https://supabase.com).
2. Vào **SQL Editor**, dán toàn bộ nội dung `supabase/schema.sql` và chạy — tạo bảng `profiles`, `community_posts`, `community_likes`, `blog_posts`, `templates`, RLS policies, và các bucket Storage (`community-media`, `blog-covers`, `template-covers`, `avatars`).
3. Vẫn trong **SQL Editor**, chạy tiếp `supabase/migrations/20260906_seed_static_content.sql` — nạp 21 mẫu / 6 bài blog / 15 bài cộng đồng ban đầu thành các dòng thật trong Supabase (một lần, an toàn chạy lại nhiều lần).
4. Copy `.env.example` thành `.env.local`, điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
5. Đăng ký một tài khoản qua `/auth`, sau đó trong SQL Editor chạy:
   ```sql
   update public.profiles set role = 'admin' where email = 'ban@example.com';
   ```
   để mở khoá `/admin`.
6. `npm run dev` lại — Header sẽ hiện avatar thật, Cộng đồng cho đăng bài, `/admin` dùng được.

**Những gì đã nối Supabase:** đăng ký/đăng nhập (email+mật khẩu) kèm quên mật khẩu/đặt lại mật khẩu và gửi lại email xác nhận, trang `/settings` (đổi tên hiển thị/handle/ảnh đại diện/mật khẩu), đăng bài + thích bài trên Cộng đồng (kèm upload ảnh thật, có rate limit chống spam, và cần admin duyệt mới công khai), Thư viện mẫu (kể cả 21 mẫu ban đầu — sửa tên/thẻ/ảnh bìa hoặc xoá từ `/admin/templates`), trang `/admin` (Blog CRUD kể cả bài biên tập sẵn, kiểm duyệt + sửa bài Cộng đồng kể cả bài demo ban đầu, cấp quyền admin cho user, xem công thức đã xuất qua QR, công tắc cấu hình toàn site). **Chưa đụng tới** (theo yêu cầu): form móng và độ dài móng trong Studio vẫn dùng dữ liệu tĩnh như cũ.

Sau khi cập nhật `supabase/schema.sql` (thêm bảng/cột mới), **chạy lại toàn bộ file trong SQL Editor** — mọi câu lệnh đều idempotent (an toàn chạy lại nhiều lần), không cần tách riêng phần mới.

## Thư viện mẫu — mở trong Studio là bản khoá, không chỉnh sửa được

Ảnh cover của 21 mẫu trong Thư viện là ảnh AI-generated thật (không phải render lại
từ công thức) — xem `public/assets/templates/CURATED-SOURCES.md`. Vì bộ máy paint
của Studio không thể tái tạo pixel-for-pixel một tấm ảnh AI, bấm "Dùng mẫu này" sẽ
nạp đúng công thức (recipe) của mẫu vào state như trước, nhưng Studio hiển thị
**đúng tấm ảnh gốc** thay vì bản render lại, và **khoá toàn bộ tab chỉnh sửa**
(`getLockedTemplateView` trong `src/lib/templateLock.ts`, dùng ở `Studio.tsx` và
`ResultView.tsx`). Công thức/QR vẫn dùng recipe như cũ (self-contained, không cần
host ảnh) — chỉ phần xem trước và "Xuất ảnh PNG" đổi sang dùng đúng file ảnh gốc.
Bấm "Reset" ở top bar để thoát khoá và tự thiết kế từ đầu. Mở một **thiết kế đã
lưu** (Lưu/Mở) thì vẫn luôn ở chế độ chỉnh sửa tự do như trước — chỉ nạp từ Thư
viện mới bị khoá.

## Hệ thống Mã QR / Công thức

Bấm "Xuất công thức & Mã QR" trong Studio tạo ra một link `/r/<id>` **tự chứa toàn bộ thiết kế** (form, màu, hiệu ứng, charm, nét vẽ tay, tông da) — nén gzip + mã hoá base64url ngay trong phần `#d=...` của URL (xem `src/lib/designCodec.ts`). Vì dữ liệu nằm ngay trong mã QR, việc quét luôn mở lại **đúng y hệt** bản thiết kế đó, kể cả khi không kết nối Supabase. Khi có kết nối Supabase, mỗi lần xuất còn được lưu thêm vào bảng `shared_designs` — dùng làm phương án dự phòng cho thiết kế quá chi tiết (nhiều charm/nét vẽ khiến URL vượt ngưỡng quét được) và để `/admin/recipes` liệt kê/kiểm duyệt. Trang `/r/:id` có nút "Mở trong Studio để chỉnh sửa" để tiếp tục chỉnh từ đúng bản đã quét.

## Bảo mật & chống spam

**Rate limit (chặn spam đăng bài/thích/lưu công thức)** — chạy hoàn toàn ở tầng Postgres (bảng `rate_limit_hits` + trigger `enforce_rate_limit`, xem `supabase/schema.sql`), không cần bật gì thêm: tối đa 5 bài đăng Cộng đồng/10 phút, 40 lượt thích/phút, 20 lần lưu công thức QR/giờ cho mỗi tài khoản. Vượt hạn mức sẽ trả lỗi tiếng Việt dễ hiểu ngay trên form thay vì lỗi kỹ thuật.

**Captcha (Cloudflare Turnstile)** — miễn phí, không cần thẻ tín dụng:
1. Tạo site tại [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → **Add site** (chọn loại "Managed").
2. Copy **Site Key** vào `.env.local`: `VITE_TURNSTILE_SITE_KEY=...`. Widget sẽ tự hiện trên form Đăng nhập/Đăng ký/Quên mật khẩu — không có key thì các form vẫn hoạt động bình thường, chỉ là không có captcha.
3. Copy **Secret Key** vào Supabase Dashboard → **Authentication** → **Attack Protection** → bật **Enable CAPTCHA protection**, chọn Turnstile, dán secret key. Đây là bước bắt buộc để captcha thật sự có tác dụng chặn bot — token phía client chỉ là bước 1, Supabase Auth mới là nơi xác minh token đó ở server.
4. (Tuỳ chọn) Bật công tắc "Bắt buộc captcha khi đăng nhập/đăng ký" trong `/admin/settings` để form từ chối submit nếu chưa xác minh captcha.

Lưu ý: đăng bài Cộng đồng hiện chỉ được bảo vệ bằng rate limit ở trên, chưa có captcha riêng — vì xác minh captcha thật sự (không phải chỉ hiện widget cho có) cần một hàm phía server để gọi Cloudflare siteverify API, việc này cần triển khai Supabase Edge Function (Supabase CLI + `supabase functions deploy`) mà project hiện chưa có sẵn access token để tự làm thay bạn. Đây là hạn chế đã biết, không phải bug.

**Email xác thực & đặt lại mật khẩu ("noreply")** — mặc định Supabase tự gửi 2 email này (xác nhận đăng ký, đặt lại mật khẩu) từ địa chỉ dùng chung `noreply@mail.app.supabase.io`, đã hoạt động ngay không cần cấu hình gì (có giới hạn số email/giờ theo gói free). Để gửi từ **email riêng của bạn** (VD `noreply@vibeu.vn`) và branding đẹp hơn:
1. Tạo tài khoản ở một nhà cung cấp SMTP (khuyến nghị [Resend](https://resend.com) — free tier, dễ cấu hình), xác thực domain của bạn.
2. Supabase Dashboard → **Project Settings** → **Authentication** → **SMTP Settings** → điền host/port/user/pass + "Sender email" là `noreply@<domain của bạn>`.
3. Dán nội dung `supabase/email-templates/confirm-signup.html` và `reset-password.html` vào **Authentication** → **Email Templates** (tương ứng "Confirm signup" và "Reset Password") để email có giao diện đúng thương hiệu VIBEU thay vì mẫu mặc định của Supabase.

**Site settings** — `/admin/settings` có 3 công tắc áp dụng ngay cho toàn site: đóng/mở đăng ký tài khoản mới, chế độ bảo trì (khách thấy trang bảo trì, admin vẫn dùng được bình thường), và bắt buộc captcha. Lưu trong bảng `site_settings` (đọc được bởi ai cũng được, chỉ admin sửa được).

**Căn chỉnh geometry móng** — chạy migration `supabase/migrations/20260905_nail_geometry_variants.sql`, sau đó admin mở `/admin/geometry`. Công cụ liên kết trực tiếp với ảnh thật của 24 tổ hợp, cho chỉnh/làm mềm từng mask và publish lên bảng `nail_geometry_variants`. Studio ưu tiên bản publish và tự fallback về `public/assets/hands/**/coordinates.json` nếu backend chưa sẵn sàng. Chỉ admin được ghi; người dùng chỉ có quyền đọc geometry đã publish để render.

**Thư viện mẫu** — mọi mẫu (kể cả 21 mẫu ban đầu, sau khi chạy `20260906_seed_static_content.sql`) là các dòng trong bảng `templates` trên Supabase, quản lý (sửa tên/thẻ/ảnh bìa, xoá) tại `/admin/templates`. Trong Studio, tài khoản admin có thêm nút "Lưu làm mẫu" ở góc trên để tạo mẫu mới: thiết kế xong, đặt tên/hashtag/tag rồi lưu thẳng vào bảng, hiện công khai ở `/library` ngay lập tức. Không bắt buộc ảnh bìa — mẫu không có ảnh (`cover_src` null) tự render trực tiếp từ công thức (`HandCanvas`); admin có thể tải ảnh bìa riêng lên bucket `template-covers` từ `/admin/templates`.

**An toàn khác đã có sẵn:** không thể tự phong admin cho chính mình qua API (trigger `protect_profile_role`), không thể bỏ quyền admin của admin cuối cùng (tự khoá cả site), không thể tự sửa `likes_count`/`comments_count` để làm giả độ nổi tiếng, giới hạn loại file + dung lượng khi upload ảnh Cộng đồng (8MB) và ảnh đại diện (2MB).

## Cấu trúc

```
src/
  components/
    home/       Hero, Why-us, How-it-works, Suggested designs, CTA (trang chủ)
    layout/     Header (nav + trạng thái đăng nhập thật), Footer
    community/  NewPostComposer (đăng bài Cộng đồng, chỉ hiện khi đã đăng nhập)
    studio/     HandCanvas (engine vẽ nail + kéo/xoay/scale charm), các tab công cụ, Result/QR
    ui/         Button, Chip, Logo, Avatar, Toast, Captcha (Turnstile) dùng chung
  data/         color/sticker manifest loader; templates/blog/community giờ chỉ còn type + mảng
                rỗng ở đây (nội dung thật nằm trên Supabase, xem templatesApi/blogApi/communityApi)
  hooks/        useBlogPosts (gộp mảng rỗng ở trên + bài từ Supabase), useSiteSettings
  lib/          toán học UV/hình học móng, gradient theo hiệu ứng sơn, QR, recipe, captcha,
                supabaseClient/communityApi/blogApi/adminApi/profileApi/siteSettingsApi/shareApi
                (lớp gọi Supabase)
  store/        zustand: studioStore (thiết kế trong Studio), authStore (phiên đăng nhập)
  pages/        Home, Studio, Library, Community, Blog, BlogPost, About, Auth, ResetPassword, Settings
  pages/admin/  AdminLayout (bảo vệ route theo role) + Home/BlogList/BlogEditor/Community/Users/Recipes/Settings
supabase/       schema.sql (chạy trong SQL Editor) + email-templates/ (dán vào Auth email templates)
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
- **Form móng (Vuông/Nhọn/Coffin/Oval) & Độ dài (S/M/L)**: một ảnh chụp tay thật không thể bị "cắt/kéo dài" bằng 2D để trông giống form/độ dài khác một cách chân thực (đã thử và bỏ — xem comment ở `LENGTH_SCALE`/`shapeTrimUv` trong `src/lib/geometry.ts`) — luôn lộ mép giả. Cách làm đúng: **thêm ảnh tay thật khác** cho từng tổ hợp form+độ dài, đăng ký trong `src/data/handVariants.ts`; khi cả 5 ngón cùng một form & độ dài và ảnh tương ứng đã tồn tại, Studio tự đổi sang đúng ảnh đó (`getPreparedHand`/`handBaseUrl` trong `src/data/loaders.ts`). Hiện `HAND_VARIANTS` còn trống (chưa có ảnh nào ngoài 2 ảnh mặc định) — xem `public/assets/hands/VARIANT-ASSET-GUIDE.md` để biết brief ảnh cần gen (bằng ChatGPT Image hoặc công cụ tương tự) khớp phong cách 2 ảnh hiện có, và quy trình hiệu chỉnh toạ độ móng cho ảnh mới.
- **Màu da**: chỉ có 2 tông (`cozy`, `matcha`) vì đó là toàn bộ ảnh tay có sẵn trong `VIBEU-Studio-Pro` (gói nguồn gốc, đã gỡ khỏi repo).
- **Mã QR**: sinh bằng thư viện `qrcode` phía client; link trỏ tới origin thật của app (không còn hardcode `vibeu.app`) và tự chứa dữ liệu thiết kế — xem mục "Hệ thống Mã QR / Công thức" ở trên.
