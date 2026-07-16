# FarBoo — Intelligence, Orchestrated.

A production-ready, cinematic **3D landing page** for **FarBoo**, a multi-agent studio
for **media & branding**. Built as a real, deployable Next.js app — not a mockup.

The Hero features a **procedural "Neural Orchestrator Core"**: a noise-displaced
sphere surrounded by a curl-noise particle flow field that reacts to the pointer,
morphs on scroll, and gracefully degrades on weaker devices or when motion is reduced.

---

## ✨ Highlights

- **Procedural 3D core** — GLSL vertex displacement from layered simplex noise + sine
  waves + time, with a custom fresnel/rim-light gradient fragment shader.
- **Procedural particle system** — thousands of GPU points animated along a
  divergence-free **curl-noise flow field**, with soft pointer attraction.
- **Cursor attraction** — pointer position is raycast into 3D space and smoothly
  interpolated (`lerp`) into the shaders. Touch devices fall back to
  `deviceorientation` or a calm automatic orbit.
- **Scroll-driven 3D storytelling** — scroll progress drives camera-relative
  rotation, scale, morph turbulence, and parallax depth layers with eased transitions.
- **Custom shaders** — modular GLSL (`src/shaders/*`), noise injected at build time.
- **Magnetic CTAs & micro-interactions** — spring-based magnetic buttons with full
  hover / focus / press / loading states.
- **Adaptive quality algorithm** — picks an initial tier from screen width, DPR,
  CPU cores and device memory, then **auto-downgrades** (particles, mesh detail, DPR,
  AA) if the frame rate stays low.
- **Reduced motion & fallback** — respects `prefers-reduced-motion` and ships a light,
  dependency-free 2D fallback when WebGL is unavailable.
- **Performance-aware Canvas** — dynamically imported (no SSR), and the render loop
  **pauses** when the hero leaves the viewport or the tab is hidden.

---

## 🎨 Design system

| Token | Value | Rationale (color psychology) |
| --- | --- | --- |
| Base | `#0A0B14` | Deep space — trust, depth, focus |
| Primary | `#6D5EF6` | Indigo-violet — creativity + intelligence + premium |
| Accent | `#22D3EE` | Cyan — innovation, clarity, technology |
| Warm | `#F5A97F` | Human warmth & contrast for emphasis |
| Ink | `#E7E9F2` / `#9AA0B5` | Readable neutrals |

- **Display type:** Space Grotesk (futuristic, distinctive headlines)
- **Body type:** Inter (high legibility)
- Fonts are **self-hosted** (WOFF2 subset) via `next/font/local` — no runtime
  requests to Google Fonts, zero layout shift.

---

## 🧱 Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Three.js** + **@react-three/fiber** + **@react-three/drei**
- **Framer Motion** for scroll & UI motion

### Why Framer Motion instead of GSAP + ScrollTrigger?
The prompt allowed the nearest professional alternative. Framer Motion covers all the
scroll-linked and micro-interaction needs here (`useScroll`, `useTransform`,
`AnimatePresence`, springs) with first-class React ergonomics and a permissive MIT
license, avoiding the GSAP club-plugin licensing question and keeping one motion
system instead of two.

---

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

### Build & run production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## 🗂 Project structure

```
app/
  layout.tsx          # metadata, OG/Twitter, JSON-LD, fonts, skip link
  page.tsx            # section composition
  globals.css         # Tailwind layers + design tokens + reduced-motion
  robots.ts / sitemap.ts / icon.svg
src/
  components/
    sections/         # Navigation, Hero, TrustBar, ProblemSolution, Features,
                      # ScrollStory, HowItWorks, SocialProof, Pricing, FAQ,
                      # FinalCTA, Footer
    three/            # Scene, NeuralCore, ParticleField, PointerTracker,
                      # HeroCanvas (dynamic import), StaticFallback
    ui/               # MagneticButton, Reveal, Icon
  shaders/            # noise.glsl, core.vert/frag, particles.vert/frag, index.ts
  lib/                # quality.ts, useAdaptiveQuality, useReducedMotion, fonts, utils
  data/               # site.ts, content.ts  (all copy — edit here)
public/
  fonts/              # self-hosted WOFF2
  og.svg / icon.svg   # procedural social + favicon art
```

---

## 🎛 Customization

- **Copy & offer:** everything lives in `src/data/content.ts` and `src/data/site.ts`
  (nav, CTAs, stats, features, steps, testimonials, pricing, FAQ).
- **Brand colors:** `tailwind.config.ts` + the `uColor*` uniforms in
  `NeuralCore.tsx` / `ParticleField.tsx`.
- **3D feel:** tune uniforms — `uAmplitude`, `uFrequency`, `uFresnelPower`,
  particle `uSize`, orbit speeds — in the Three components.
- **Quality tiers:** edit presets & thresholds in `src/lib/quality.ts`.
- **Form:** `FinalCTA.tsx` uses a simulated submit; wire it to a Next.js route
  handler / your CRM. Add secrets to `.env.local` (see `.env.example`).

---

## ⚡ Architecture & performance decisions

- **3D is lazy.** `HeroCanvas` dynamically imports the scene with `ssr: false`, so the
  initial HTML/JS stays light and text-first — protecting LCP and avoiding CLS.
- **Render only when visible.** An `IntersectionObserver` + `visibilitychange`
  listener flip the R3F `frameloop`, stopping GPU work off-screen / in background tabs.
- **Adaptive DPR + tiers.** DPR is clamped per tier and `AdaptiveDpr` + a custom FPS
  watchdog step quality down under sustained load.
- **Bounded geometry.** The icosahedron subdivision is mapped to a safe, capped range
  regardless of tier to protect polygon/draw-call budgets.
- **Semantic, accessible HTML.** Landmarks, skip link, keyboard-operable nav / FAQ /
  form, visible focus rings, WCAG-AA contrast, `aria-*` on interactive 3D-adjacent UI,
  and `aria-hidden` on decorative canvases.
- **SEO.** Metadata, Open Graph, Twitter Card, canonical, `robots.txt`, `sitemap.xml`,
  and `SoftwareApplication` JSON-LD.

---

## ♿ Manual test checklist

- [x] Loads with WebGL (interactive core + particles, pointer attraction)
- [x] `prefers-reduced-motion: reduce` → animations calmed, scroll story flattens
- [x] WebGL disabled / unsupported → 2D CSS fallback renders
- [x] Keyboard: Tab through nav → CTAs → pricing → FAQ (Enter toggles) → form
- [x] Mobile 320px → large desktop, no horizontal scroll
- [x] Canvas pauses off-screen and on hidden tab
- [x] `npm run build`, `tsc --noEmit`, and `npm run lint` all pass

---

## 🖼 Assets & licenses

| Asset | Source | License |
| --- | --- | --- |
| Space Grotesk (WOFF2) | Google Fonts / fontsource | SIL Open Font License 1.1 |
| Inter (WOFF2) | Google Fonts / fontsource | SIL Open Font License 1.1 |
| Simplex/curl noise GLSL | Ashima Arts / Stefan Gustavson | Public domain / MIT |
| `og.svg`, `icon.svg` | Generated for this project | Procedural, free to use |
| All 3D geometry, particles, gradients | Procedural (code) | No external assets |

No stock images, models, or textures are used — every visual is procedural or code-drawn.

---

## ☁️ Deployment

Optimized for **Vercel**:

```bash
# push the repo, then "Import Project" on Vercel — zero config needed
```

Any Node host works too: `npm run build` then `npm run start`. No environment
variables are required to run the site as-is.

---

## 📄 License

Project code: MIT. Fonts under OFL as noted above.
