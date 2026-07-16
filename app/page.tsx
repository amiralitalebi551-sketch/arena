import { Navigation } from "@/components/sections/Navigation";
import { Hero } from "@/components/sections/Hero";
import { TrustBar } from "@/components/sections/TrustBar";
import { ProblemSolution } from "@/components/sections/ProblemSolution";
import { Features } from "@/components/sections/Features";
import { ScrollStory } from "@/components/sections/ScrollStory";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { SocialProof } from "@/components/sections/SocialProof";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SectionTransition } from "@/components/ui/SectionTransition";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navigation />
      <main id="main">
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
