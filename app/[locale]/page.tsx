import { Navigation } from "@/components/sections/Navigation";
import { Hero } from "@/components/sections/Hero";
import { TrustBar } from "@/components/sections/TrustBar";
import { ProblemSolution } from "@/components/sections/ProblemSolution";
import { Features } from "@/components/sections/Features";
import { ScrollStory } from "@/components/sections/ScrollStory";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { WorkGallery } from "@/components/sections/WorkGallery";
import { SocialProof } from "@/components/sections/SocialProof";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { ScrollVelocityProvider } from "@/components/ui/ScrollVelocityProvider";
import { SectionTransition } from "@/components/ui/SectionTransition";
import { locales } from "@/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <ScrollVelocityProvider />
      <Navigation />
      <main id="main" className="relative z-10">
        <Hero />
        <TrustBar />
        <SectionTransition>
          <ProblemSolution />
        </SectionTransition>
        <SectionTransition>
          <Features />
        </SectionTransition>
        <ScrollStory />
        <SectionTransition>
          <HowItWorks />
        </SectionTransition>
        <SectionTransition>
          <WorkGallery />
        </SectionTransition>
        <SectionTransition>
          <SocialProof />
        </SectionTransition>
        <SectionTransition>
          <Pricing />
        </SectionTransition>
        <SectionTransition>
          <FAQ />
        </SectionTransition>
        <SectionTransition>
          <FinalCTA />
        </SectionTransition>
      </main>
      <Footer />
    </>
  );
}
