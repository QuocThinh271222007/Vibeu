-- One-time content restructuring: the 7 pre-existing blog posts (all written before
-- content_blocks existed) get real H2/H3 sections + primary/secondary keyword + meta
-- description, per Template bai SEO.docx. Every paragraph of text below is the post's own
-- original content, only reorganized into headed sections (verified against the live
-- database before writing this) - nothing invented. Idempotent: safe to re-run.

update public.blog_posts set
  content_blocks = '[{"type":"heading2","text":"Sự giao thoa giữa tối giản và siêu thực"},{"type":"paragraph","text":"Năm 2026 mở ra một chương mới cho nghệ thuật làm móng khi ranh giới giữa nét tối giản thanh lịch (Clean Girl Aesthetic) và cảm hứng vị lai (Futuristic) hoàn toàn bị xóa nhòa. Không còn những bộ móng đính đá cầu kỳ hay họa tiết rườm rà, tâm điểm của sàn diễn thời trang lẫn đường phố năm nay chính là sự kết hợp ăn ý giữa Sơn thạch Jelly và Hiệu ứng tráng gương Chrome Powder."},{"type":"paragraph","text":"Sơn thạch mang lại hiệu ứng trong trẻo, mọng nước như một lớp thạch thủy tinh ôm lấy móng tự nhiên. Khi được phủ lên trên một lớp bột chrome siêu mịn, bộ móng lập tức phản chiếu ánh sáng đa chiều, tạo cảm giác bóng bẩy, ảo diệu nhưng không hề nặng nề."},{"type":"heading2","text":"Top 3 bảng màu thống trị mọi khung hình năm 2026"},{"type":"heading3","text":"Liquid Silver Chrome (Bạc kim loại lỏng)"},{"type":"paragraph","text":"Lựa chọn hàng đầu cho những cô nàng cá tính. Bề mặt sáng bóng tựa kim loại nóng chảy mang lại diện mạo sắc sảo, hiện đại và cực kỳ \"high-fashion\"."},{"type":"heading3","text":"Hồng Thạch Glazed Donut"},{"type":"paragraph","text":"Phiên bản nâng cấp của trào lưu Hailey Bieber. Lớp nền hồng thạch nude kết hợp cùng ánh nhũ ngọc trai tạo hiệu ứng đôi tay căng bóng, sạch sẽ, phù hợp hoàn hảo với môi trường công sở lẫn các buổi tiệc tối sang trọng."},{"type":"heading3","text":"Icy Blue & Mint Jelly (Xanh băng & Bạc hà mát lạnh)"},{"type":"paragraph","text":"Gam màu giải nhiệt đầy tươi mới. Chất sơn thạch xanh pastel phủ bột chrome ánh tím nhẹ giúp tôn da rõ rệt, đặc biệt là với những nàng sở hữu tông da sáng hoặc trung tính."},{"type":"heading2","text":"Mẹo diện nail chrome & jelly đẹp chuẩn salon"},{"type":"paragraph","text":"Ưu tiên form móng ngắn hoặc quả hạnh (Almond): Hiệu ứng tráng gương phát huy tối đa vẻ sang trọng khi đi cùng phom móng gọn gàng, chiều dài vừa phải."},{"type":"paragraph","text":"Khóa viền kỹ bằng Top Coat bóng: Bột chrome rất dễ mòn ở đầu móng, vì vậy một lớp top bóng dày dặn, không lem sẽ giữ hiệu ứng gương sáng suốt 3–4 tuần."},{"type":"paragraph","text":"Dưỡng ẩm viền móng hàng ngày: Độ bóng siêu thực của chrome sẽ càng nổi bật khi đi kèm một nền da tay mềm mại, không bị khô ráp hay xước măng rô."}]'::jsonb,
  meta_description = 'Khám phá xu hướng nail chrome thạch jelly 2026 cùng top 3 bảng màu được yêu thích nhất và mẹo lên màu chuẩn salon bền đẹp từ VIBEU.',
  primary_keyword = 'nail chrome thạch jelly',
  secondary_keyword = 'bảng màu nail 2026'
where slug = 'xu-huong-chrome-thach-jelly-bang-mau-nail-thong-tri-nam-2026';

update public.blog_posts set
  content_blocks = '[{"type":"heading2","text":"Vì sao Y2K vẫn là \"vibe\" thường trực của Gen Z"},{"type":"paragraph","text":"Y2K không còn là trào lưu nhất thời — nó đã trở thành một \"vibe\" thường trực trong tủ đồ của Gen Z, và bộ móng cũng không ngoại lệ."},{"type":"heading2","text":"Cách phối charm chrome không bị sến"},{"type":"paragraph","text":"Bí quyết để chrome không bị sến là giới hạn hiệu ứng gương ở 1-2 ngón điểm nhấn (thường là ngón áp út), các ngón còn lại nên dùng tone trung tính như silver-chrome hoặc pastel nhẹ để cân bằng."},{"type":"paragraph","text":"Charm bướm, trái tim hay ngôi sao nên chọn kích thước nhỏ, đặt lệch tâm khoảng 30-40% chiều dài móng thay vì chính giữa — nhìn tự nhiên và \"Âu\" hơn hẳn."},{"type":"paragraph","text":"Trong Nail Studio của VIBEU, bạn có thể thử ngay preset \"Y2K Butterfly Chrome\" ở Thư viện mẫu, sau đó kéo-thả để chỉnh charm theo đúng gu của mình trước khi xuất công thức mang ra tiệm."}]'::jsonb,
  meta_description = '5 cách phối charm chrome phong cách Y2K sang trọng, không bị sến — mẹo chọn tone màu và vị trí đặt charm chuẩn gu Gen Z từ VIBEU.',
  primary_keyword = 'nail chrome Y2K',
  secondary_keyword = 'phối charm chrome'
where slug = 'y2k-nail-2026';

update public.blog_posts set
  content_blocks = '[{"type":"heading2","text":"Chọn form móng theo dáng tay của bạn"},{"type":"paragraph","text":"Tay ngón ngắn: ưu tiên form Oval hoặc Almond (Nhọn) — đường cong giúp ngón tay trông thon dài hơn đáng kể so với form Vuông cắt ngang."},{"type":"paragraph","text":"Tay ngón dài: gần như hợp mọi form, nhưng Coffin (Ballerina) sẽ tôn dáng tay thanh mảnh, sang trọng nhất trong các dịp dự tiệc."},{"type":"paragraph","text":"Tay bản to: tránh form Vuông góc cạnh vì dễ làm móng trông \"chắc nịch\" hơn, nên chọn Oval mềm mại hoặc Nhọn để kéo dài thị giác."},{"type":"paragraph","text":"Trong Nail Studio, bạn có thể đổi qua lại giữa 4 form ngay trên canvas để so sánh trực tiếp trên mô phỏng bàn tay trước khi quyết định — không cần tưởng tượng suông nữa."}]'::jsonb,
  meta_description = 'Cách chọn form móng hợp dáng tay chỉ trong 30 giây: tay ngón ngắn, ngón dài hay bản to nên chọn Oval, Coffin hay Nhọn cho đẹp nhất?',
  primary_keyword = 'chọn form móng tay',
  secondary_keyword = 'form móng hợp dáng tay'
where slug = 'chon-form-mong-hop-dang-tay';

update public.blog_posts set
  content_blocks = '[{"type":"heading2","text":"3 bước dưỡng phục hồi móng sau khi gỡ gel"},{"type":"paragraph","text":"Bước 1 — Ngâm & gỡ đúng cách: dùng bông tẩm acetone bọc quanh móng 10-15 phút thay vì cạy trực tiếp, tránh làm mỏng bề mặt móng thật."},{"type":"paragraph","text":"Bước 2 — Dưỡng ẩm sâu: thoa dầu dưỡng cuticle (jojoba hoặc vitamin E) mỗi tối trong ít nhất 1 tuần đầu sau khi gỡ gel."},{"type":"paragraph","text":"Bước 3 — Nghỉ móng định kỳ: nếu làm gel liên tục, nên để móng \"thở\" khoảng 1-2 tuần giữa các lần trước khi lên màu mới."},{"type":"paragraph","text":"Mẹo nhỏ: khi thiết kế mẫu tiếp theo trên VIBEU, bạn có thể chọn hiệu ứng Sơn thạch (Jelly) — chất liệu mỏng nhẹ hơn Gel truyền thống, thân thiện hơn với móng yếu."}]'::jsonb,
  meta_description = '3 bước dưỡng móng sau khi gỡ gel giúp móng chắc khoẻ, không mỏng giòn hay yếu đi — quy trình phục hồi được VIBEU khuyên dùng.',
  primary_keyword = 'dưỡng móng sau khi gỡ gel',
  secondary_keyword = 'phục hồi móng yếu'
where slug = 'duong-mong-sau-khi-go-gel';

update public.blog_posts set
  content_blocks = '[{"type":"heading2","text":"Bộ sưu tập nail 12 cung hoàng đạo được yêu thích nhất"},{"type":"paragraph","text":"Series 12 cung hoàng đạo là một trong những bộ sưu tập được lưu nhiều nhất trong Thư viện mẫu VIBEU tháng qua."},{"type":"paragraph","text":"Bạch Dương rực lửa với tone cherry-cola, Cự Giải dịu dàng với cloud-candy pastel, còn Bọ Cạp lại chọn midnight-galaxy đầy bí ẩn."},{"type":"paragraph","text":"Bạn không cần đúng cung mới được dùng — nhiều bạn chọn mẫu theo \"vibe\" mong muốn trong ngày hơn là đúng ngày sinh, và đó chính xác là tinh thần tự do sáng tạo mà VIBEU hướng tới."},{"type":"paragraph","text":"Ghé Thư viện mẫu, lọc theo thẻ \"12 Cung Hoàng Đạo\" để xem trọn bộ và bấm \"Dùng mẫu này\" để tuỳ chỉnh riêng cho mình."}]'::jsonb,
  meta_description = 'Khám phá bộ sưu tập nail theo 12 cung hoàng đạo tại VIBEU — từ Bạch Dương cá tính đến Song Ngư mộng mơ, chọn ngay gu của bạn.',
  primary_keyword = 'nail theo cung hoàng đạo',
  secondary_keyword = 'mẫu nail 12 cung hoàng đạo'
where slug = '12-cung-hoang-dao-nail';

update public.blog_posts set
  content_blocks = '[{"type":"heading2","text":"3 yếu tố tạo nên một bức ảnh nail đẹp"},{"type":"paragraph","text":"Chụp gần cửa sổ vào khung giờ 9-10h sáng hoặc 4-5h chiều để có ánh sáng tự nhiên dịu, tránh đèn vàng làm sai lệch màu sơn."},{"type":"paragraph","text":"Đặt tay nghiêng 45 độ thay vì chụp thẳng để khoe được cả form móng lẫn charm đính nổi khối."},{"type":"paragraph","text":"Phông nền tối giản (bàn gỗ sáng, vải lanh trơn) sẽ tôn màu nail hơn hẳn phông nền nhiều hoạ tiết."},{"type":"paragraph","text":"Sau khi có ảnh ưng ý, đăng ngay lên Cộng đồng VIBEU kèm hashtag mẫu bạn dùng để mọi người dễ tìm và \"xin vía\" nhé!"}]'::jsonb,
  meta_description = 'Mẹo chụp ảnh bộ nail lung linh chỉ với ánh sáng, góc chụp và phông nền chuẩn — chia sẻ ngay lên Cộng đồng VIBEU để mọi người cùng xem.',
  primary_keyword = 'mẹo chụp ảnh nail đẹp',
  secondary_keyword = 'chụp ảnh nail đăng cộng đồng'
where slug = 'meo-chup-anh-nail-dep';

update public.blog_posts set
  content_blocks = '[{"type":"heading2","text":"3 bước biến ý tưởng thành công thức nail hoàn chỉnh"},{"type":"paragraph","text":"Bước 1: Vào Nail Studio, chọn màu da mô phỏng gần với bạn nhất rồi bắt đầu phối form, màu gel/thạch và charm cho từng ngón."},{"type":"paragraph","text":"Bước 2: Thao tác kéo-thả trực tiếp trên canvas — phóng to, thu nhỏ, xoay charm 360° đến khi ưng ý từng chi tiết nhỏ."},{"type":"paragraph","text":"Bước 3: Bấm \"Xuất công thức & Mã QR\" để nhận ảnh preview độ nét cao, bảng thông số từng ngón và mã QR — gửi thẳng cho thợ hoặc quét trực tiếp tại tiệm."},{"type":"paragraph","text":"Toàn bộ quá trình không mất phí, không cần tải app, và bạn có thể quay lại chỉnh sửa bất cứ lúc nào trước khi ra tiệm."}]'::jsonb,
  meta_description = 'Từ ý tưởng đến tiệm nail chỉ trong 3 bước với VIBEU Studio — thiết kế, chỉnh sửa trực tiếp và xuất công thức kèm mã QR hoàn toàn miễn phí.',
  primary_keyword = 'cách dùng Nail Studio VIBEU',
  secondary_keyword = 'xuất công thức nail'
where slug = 'quy-trinh-dung-nail-studio';
