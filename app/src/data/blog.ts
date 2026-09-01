export type BlogCategory = 'tips' | 'trend' | 'care'

export const BLOG_CATEGORY_LABEL: Record<BlogCategory, string> = {
  tips: 'Mẹo làm đẹp',
  trend: 'Trend móng mới',
  care: 'Hướng dẫn dưỡng móng',
}

/**
 * Real editorial cover photo/illustration for a post. Optional: a post without one falls
 * back to MediaPlaceholder rather than emoji-on-gradient "cover art" — see Blog.tsx/BlogPost.tsx.
 */
export interface BlogCover {
  src: string
  alt: string
  objectPosition?: string
  credit?: string
  sourceUrl?: string
}

export interface BlogPost {
  slug: string
  title: string
  category: BlogCategory
  excerpt: string
  /** Subtle fallback background tint behind the placeholder — never primary artwork on its own. */
  accentColor: string
  cover?: BlogCover
  date: string
  readMinutes: number
  content: string[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'y2k-nail-2026',
    title: 'Y2K trở lại: 5 cách phối charm chrome không bị "sến"',
    category: 'trend',
    excerpt: 'Chrome, bướm và trái tim đang phủ sóng khắp TikTok — làm sao để phối cho sang chứ không sến? VIBEU gợi ý 5 công thức dễ áp dụng.',
    accentColor: '#B6C7EA',
    date: '2026-08-18',
    readMinutes: 4,
    content: [
      'Y2K không còn là trào lưu nhất thời — nó đã trở thành một "vibe" thường trực trong tủ đồ của Gen Z, và bộ móng cũng không ngoại lệ.',
      'Bí quyết để chrome không bị sến là giới hạn hiệu ứng gương ở 1-2 ngón điểm nhấn (thường là ngón áp út), các ngón còn lại nên dùng tone trung tính như silver-chrome hoặc pastel nhẹ để cân bằng.',
      'Charm bướm, trái tim hay ngôi sao nên chọn kích thước nhỏ, đặt lệch tâm khoảng 30-40% chiều dài móng thay vì chính giữa — nhìn tự nhiên và "Âu" hơn hẳn.',
      'Trong Nail Studio của VIBEU, bạn có thể thử ngay preset "Y2K Butterfly Chrome" ở Thư viện mẫu, sau đó kéo-thả để chỉnh charm theo đúng gu của mình trước khi xuất công thức mang ra tiệm.',
    ],
  },
  {
    slug: 'chon-form-mong-hop-dang-tay',
    title: 'Chọn form móng hợp dáng tay: Vuông, Coffin, Nhọn hay Oval?',
    category: 'tips',
    excerpt: 'Không phải form móng nào cũng hợp với mọi bàn tay. Đây là cách chọn nhanh chỉ trong 30 giây.',
    accentColor: '#FFD879',
    date: '2026-08-10',
    readMinutes: 5,
    content: [
      'Tay ngón ngắn: ưu tiên form Oval hoặc Almond (Nhọn) — đường cong giúp ngón tay trông thon dài hơn đáng kể so với form Vuông cắt ngang.',
      'Tay ngón dài: gần như hợp mọi form, nhưng Coffin (Ballerina) sẽ tôn dáng tay thanh mảnh, sang trọng nhất trong các dịp dự tiệc.',
      'Tay bản to: tránh form Vuông góc cạnh vì dễ làm móng trông "chắc nịch" hơn, nên chọn Oval mềm mại hoặc Nhọn để kéo dài thị giác.',
      'Trong Nail Studio, bạn có thể đổi qua lại giữa 4 form ngay trên canvas để so sánh trực tiếp trên mô phỏng bàn tay trước khi quyết định — không cần tưởng tượng suông nữa.',
    ],
  },
  {
    slug: 'duong-mong-sau-khi-go-gel',
    title: '3 bước dưỡng móng sau khi gỡ gel để móng không yếu đi',
    category: 'care',
    excerpt: 'Sơn gel đẹp nhưng gỡ sai cách rất dễ làm móng mỏng, giòn. Đây là quy trình dưỡng phục hồi VIBEU khuyên dùng.',
    accentColor: '#8CCABD',
    date: '2026-07-29',
    readMinutes: 4,
    content: [
      'Bước 1 — Ngâm & gỡ đúng cách: dùng bông tẩm acetone bọc quanh móng 10-15 phút thay vì cạy trực tiếp, tránh làm mỏng bề mặt móng thật.',
      'Bước 2 — Dưỡng ẩm sâu: thoa dầu dưỡng cuticle (jojoba hoặc vitamin E) mỗi tối trong ít nhất 1 tuần đầu sau khi gỡ gel.',
      'Bước 3 — Nghỉ móng định kỳ: nếu làm gel liên tục, nên để móng "thở" khoảng 1-2 tuần giữa các lần trước khi lên màu mới.',
      'Mẹo nhỏ: khi thiết kế mẫu tiếp theo trên VIBEU, bạn có thể chọn hiệu ứng Sơn thạch (Jelly) — chất liệu mỏng nhẹ hơn Gel truyền thống, thân thiện hơn với móng yếu.',
    ],
  },
  {
    slug: '12-cung-hoang-dao-nail',
    title: '12 cung hoàng đạo, 12 gu nail: bạn hợp phong cách nào?',
    category: 'trend',
    excerpt: 'Từ Bạch Dương cá tính đến Song Ngư mộng mơ — mỗi cung hoàng đạo đều có một bộ nail đại diện trong thư viện mẫu VIBEU.',
    accentColor: '#A697D5',
    date: '2026-07-15',
    readMinutes: 3,
    content: [
      'Series 12 cung hoàng đạo là một trong những bộ sưu tập được lưu nhiều nhất trong Thư viện mẫu VIBEU tháng qua.',
      'Bạch Dương rực lửa với tone cherry-cola, Cự Giải dịu dàng với cloud-candy pastel, còn Bọ Cạp lại chọn midnight-galaxy đầy bí ẩn.',
      'Bạn không cần đúng cung mới được dùng — nhiều bạn chọn mẫu theo "vibe" mong muốn trong ngày hơn là đúng ngày sinh, và đó chính xác là tinh thần tự do sáng tạo mà VIBEU hướng tới.',
      'Ghé Thư viện mẫu, lọc theo thẻ "12 Cung Hoàng Đạo" để xem trọn bộ và bấm "Dùng mẫu này" để tuỳ chỉnh riêng cho mình.',
    ],
  },
  {
    slug: 'meo-chup-anh-nail-dep',
    title: 'Mẹo chụp ảnh bộ nail lung linh để đăng cộng đồng VIBEU',
    category: 'tips',
    excerpt: 'Ánh sáng, góc chụp và phông nền — chỉ 3 yếu tố này thôi cũng đủ nâng tầm bức ảnh nail của bạn.',
    accentColor: '#F4B094',
    date: '2026-07-02',
    readMinutes: 3,
    content: [
      'Chụp gần cửa sổ vào khung giờ 9-10h sáng hoặc 4-5h chiều để có ánh sáng tự nhiên dịu, tránh đèn vàng làm sai lệch màu sơn.',
      'Đặt tay nghiêng 45 độ thay vì chụp thẳng để khoe được cả form móng lẫn charm đính nổi khối.',
      'Phông nền tối giản (bàn gỗ sáng, vải lanh trơn) sẽ tôn màu nail hơn hẳn phông nền nhiều hoạ tiết.',
      'Sau khi có ảnh ưng ý, đăng ngay lên Cộng đồng VIBEU kèm hashtag mẫu bạn dùng để mọi người dễ tìm và "xin vía" nhé!',
    ],
  },
  {
    slug: 'quy-trinh-dung-nail-studio',
    title: 'Từ ý tưởng đến tiệm nail chỉ trong 3 bước với VIBEU Studio',
    category: 'tips',
    excerpt: 'Không biết diễn tả ý tưởng cho thợ nail? Đây là cách VIBEU giúp bạn xuất công thức chuẩn xác chỉ bằng vài cú click.',
    accentColor: '#90B8EB',
    date: '2026-06-20',
    readMinutes: 4,
    content: [
      'Bước 1: Vào Nail Studio, chọn màu da mô phỏng gần với bạn nhất rồi bắt đầu phối form, màu gel/thạch và charm cho từng ngón.',
      'Bước 2: Thao tác kéo-thả trực tiếp trên canvas — phóng to, thu nhỏ, xoay charm 360° đến khi ưng ý từng chi tiết nhỏ.',
      'Bước 3: Bấm "Xuất công thức & Mã QR" để nhận ảnh preview độ nét cao, bảng thông số từng ngón và mã QR — gửi thẳng cho thợ hoặc quét trực tiếp tại tiệm.',
      'Toàn bộ quá trình không mất phí, không cần tải app, và bạn có thể quay lại chỉnh sửa bất cứ lúc nào trước khi ra tiệm.',
    ],
  },
]

export function findBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function relatedPosts(slug: string, count = 3): BlogPost[] {
  const current = findBlogPost(slug)
  if (!current) return BLOG_POSTS.slice(0, count)
  return BLOG_POSTS.filter((p) => p.slug !== slug && p.category === current.category).slice(0, count).concat(
    BLOG_POSTS.filter((p) => p.slug !== slug && p.category !== current.category),
  ).slice(0, count)
}
