import { Hero } from '@/components/home/Hero'
import { WhyUs } from '@/components/home/WhyUs'
import { HowItWorks } from '@/components/home/HowItWorks'
import { SuggestedDesigns } from '@/components/home/SuggestedDesigns'
import { CtaBanner } from '@/components/home/CtaBanner'

export default function Home() {
  return (
    <>
      <Hero />
      <WhyUs />
      <HowItWorks />
      <SuggestedDesigns />
      <CtaBanner />
    </>
  )
}
