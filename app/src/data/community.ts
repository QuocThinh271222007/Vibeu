export interface CommunityPost {
  id: string
  templateId: string
  userName: string
  handle: string
  avatarInitial: string
  avatarColor: string
  timeAgo: string
  caption: string
  hashtags: string[]
  likes: number
  comments: number
}

const AVATAR_COLORS = ['#90B8EB', '#FF92F9', '#FFD879', '#8CCABD', '#B6A6E5', '#F4B094']

function av(i: number) {
  return AVATAR_COLORS[i % AVATAR_COLORS.length]
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  { id: 'p1', templateId: 'gemini-sparkle', userName: 'Minh Thư', handle: '@minhthu.vibe', avatarInitial: 'M', avatarColor: av(0), timeAgo: '2 giờ trước', caption: 'Bộ nail đi tiệc cuối tuần, làm theo mẫu Gemini Sparkle luôn nha mọi người 💜', hashtags: ['#GeminiSparkle', '#CatEye', '#VIBEU'], likes: 214, comments: 18 },
  { id: 'p2', templateId: 'y2k-candy-pop', userName: 'Bảo Ngọc', handle: '@ngoc.nails', avatarInitial: 'B', avatarColor: av(1), timeAgo: '4 giờ trước', caption: 'Tone kẹo ngọt cho mùa hè, custom thêm charm lollipop cực cưng 🍭', hashtags: ['#Y2K', '#CandyPop'], likes: 356, comments: 27 },
  { id: 'p3', templateId: 'virgo-sage-minimal', userName: 'Anh Thy', handle: '@thy.simple', avatarInitial: 'A', avatarColor: av(2), timeAgo: '6 giờ trước', caption: 'Đi làm nên chọn tone nude tối giản, vẫn xinh mà không lo quá lố.', hashtags: ['#Minimalist', '#Nude'], likes: 128, comments: 6 },
  { id: 'p4', templateId: 'pisces-ocean-dream', userName: 'Diệu Linh', handle: '@linhdieu', avatarInitial: 'D', avatarColor: av(3), timeAgo: '8 giờ trước', caption: 'Ocean dream cho chuyến biển sắp tới, thiết kế xong thấy iu bản thân quá 🌊', hashtags: ['#Ocean', '#Jelly'], likes: 402, comments: 41 },
  { id: 'p5', templateId: 'capricorn-chrome', userName: 'Gia Hân', handle: '@han.chrome', avatarInitial: 'G', avatarColor: av(4), timeAgo: '10 giờ trước', caption: 'Chrome + charm vương miện = auto sang chảnh. Quét QR mang ra tiệm xong 15 phút có bộ móng như ý!', hashtags: ['#Chrome', '#Y2K'], likes: 289, comments: 22 },
  { id: 'p6', templateId: 'xuan-cherry-blossom', userName: 'Thảo Vy', handle: '@vy.blossom', avatarInitial: 'T', avatarColor: av(5), timeAgo: '12 giờ trước', caption: 'Mùa hoa anh đào phải có bộ nail xịn xò tương xứng chứ 🌸', hashtags: ['#Xuân', '#HoaAnhĐào'], likes: 178, comments: 14 },
  { id: 'p7', templateId: 'scorpio-midnight', userName: 'Kim Chi', handle: '@chi.midnight', avatarInitial: 'K', avatarColor: av(0), timeAgo: '14 giờ trước', caption: 'Midnight galaxy huyền bí đúng chất Bọ Cạp, ai cùng cung hú tui 🖤', hashtags: ['#Zodiac', '#Chrome'], likes: 231, comments: 19 },
  { id: 'p8', templateId: 'ha-ocean-breeze', userName: 'Ngọc Anh', handle: '@ngocanh.tropical', avatarInitial: 'N', avatarColor: av(1), timeAgo: '1 ngày trước', caption: 'Set nail đi Đà Nẵng, charm cây dừa + cá nhiệt đới auto vibe biển!', hashtags: ['#Hạ', '#Tropical'], likes: 315, comments: 33 },
  { id: 'p9', templateId: 'leo-golden-glow', userName: 'Hà My', handle: '@my.golden', avatarInitial: 'H', avatarColor: av(2), timeAgo: '1 ngày trước', caption: 'Golden glow cho tiệc sinh nhật, tự thiết kế trên web xong xuất file cho thợ làm y chang 🎉', hashtags: ['#Leo', '#Gold'], likes: 267, comments: 20 },
  { id: 'p10', templateId: 'libra-rose-quartz', userName: 'Phương Thảo', handle: '@thao.rose', avatarInitial: 'P', avatarColor: av(3), timeAgo: '1 ngày trước', caption: 'Rose Quartz nhẹ nhàng nữ tính, charm nơ xíu xiu dễ thương lắm nè 🎀', hashtags: ['#Rose', '#Bow'], likes: 199, comments: 11 },
  { id: 'p11', templateId: 'dong-winter-frost', userName: 'Yến Nhi', handle: '@nhi.frost', avatarInitial: 'Y', avatarColor: av(4), timeAgo: '2 ngày trước', caption: 'Chuẩn bị đón đông với bộ nail bông tuyết lấp lánh ❄️', hashtags: ['#Đông', '#Snowflake'], likes: 244, comments: 15 },
  { id: 'p12', templateId: 'taurus-matcha-latte', userName: 'Bích Trâm', handle: '@tram.matcha', avatarInitial: 'B', avatarColor: av(5), timeAgo: '2 ngày trước', caption: 'Matcha latte tone lúc nào cũng là gu của tui, cực dễ phối đồ.', hashtags: ['#Matcha', '#Taurus'], likes: 156, comments: 9 },
  { id: 'p13', templateId: 'y2k-butterfly-chrome', userName: 'Quỳnh Anh', handle: '@quynh.y2k', avatarInitial: 'Q', avatarColor: av(0), timeAgo: '3 ngày trước', caption: 'Đu trend Y2K với bướm chrome, đăng lên diễn đàn xin mọi người nhận xét 🦋', hashtags: ['#Y2K', '#Butterfly'], likes: 388, comments: 46 },
  { id: 'p14', templateId: 'aries-cherry-flame', userName: 'Diễm My', handle: '@my.cherry', avatarInitial: 'D', avatarColor: av(1), timeAgo: '3 ngày trước', caption: 'Cá tính rực lửa như đúng chất Bạch Dương, charm tim lửa nổi bần bật 🔥', hashtags: ['#Aries', '#Bold'], likes: 209, comments: 17 },
  { id: 'p15', templateId: 'aquarius-aurora', userName: 'Tuệ Lâm', handle: '@lam.aurora', avatarInitial: 'T', avatarColor: av(2), timeAgo: '4 ngày trước', caption: 'Aurora lấp lánh cực kỳ hợp mấy bạn mê sự khác biệt như Bảo Bình tụi mình ✨', hashtags: ['#Aquarius', '#Sparkle'], likes: 267, comments: 23 },
]
