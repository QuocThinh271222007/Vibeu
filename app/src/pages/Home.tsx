import { Hero } from '@/components/home/Hero'
import { WhyUs } from '@/components/home/WhyUs'
import { HowItWorks } from '@/components/home/HowItWorks'
import { SuggestedDesigns } from '@/components/home/SuggestedDesigns'
import { CtaBanner } from '@/components/home/CtaBanner'
import { PageMeta } from '@/components/seo/PageMeta'

export default function Home() {
  return (
    <>
      <PageMeta
        title="Studio thiết kế nail 3D miễn phí"
        description="Tự thiết kế bộ nail của riêng bạn: chọn form móng, phối màu gel thạch, đính charm 3D, xuất công thức & mã QR mang ra tiệm — hoàn toàn miễn phí."
        canonicalPath="/"
      />
      <Hero />
      <WhyUs />
      <HowItWorks />
      <SuggestedDesigns />
      <CtaBanner />
    </>
  )
}
