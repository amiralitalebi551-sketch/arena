export const stats = [
  { value: "12", suffix: "+", label: "Specialized agents" },
  { value: "3.4", suffix: "x", label: "Faster to first draft" },
  { value: "98", suffix: "%", label: "On-brand consistency" },
  { value: "40", suffix: "hrs", label: "Saved per campaign" },
];

export const clients = [
  "NOVENA",
  "Halcyon",
  "Vireo",
  "Northbound",
  "Cadence",
  "Aпертура",
].map((n) => n.normalize());

export const problem = {
  eyebrow: "The bottleneck",
  title: "Great brands stall between the idea and the execution.",
  body: "Generic AI gives you fast, forgettable output. Human studios give you craft — at studio timelines and studio prices. Media and branding teams are stuck choosing between speed and soul.",
  points: [
    "One general-purpose model can't hold voice, strategy, and craft at once.",
    "Hand-offs between freelancers leak context and burn weeks.",
    "Every new campaign restarts brand knowledge from zero.",
  ],
};

export const solution = {
  eyebrow: "The FarBoo way",
  title: "A team of specialists, not a single generalist.",
  body: "FarBoo orchestrates a roster of focused agents — each fine-tuned for one discipline and grounded in your brand memory. They plan, critique, and hand off to one another like a real studio, so you get depth and speed at the same time.",
  points: [
    "Persistent brand memory keeps voice and rules consistent across every deliverable.",
    "A conductor agent routes work to the right specialist and reviews the result.",
    "You stay in the loop with clear checkpoints, never a black box.",
  ],
};

export const features = [
  {
    title: "Strategy Agent",
    desc: "Positioning, audience maps, and messaging pillars grounded in real market signal — not guesses.",
    icon: "compass",
  },
  {
    title: "Voice & Copy Agent",
    desc: "Long-form and micro-copy that holds your tone across channels, from manifestos to CTAs.",
    icon: "type",
  },
  {
    title: "Art Direction Agent",
    desc: "Moodboards, palettes, and layout systems that translate strategy into a coherent visual language.",
    icon: "palette",
  },
  {
    title: "Motion & 3D Agent",
    desc: "Storyboards, easing, and shader-driven concepts for launch films and immersive web moments.",
    icon: "motion",
  },
  {
    title: "Research Agent",
    desc: "Continuous competitive and cultural scanning so your brand reacts before the trend, not after.",
    icon: "search",
  },
  {
    title: "Conductor",
    desc: "The orchestrator that assigns tasks, resolves conflicts, and ships work that feels made by one mind.",
    icon: "network",
  },
];

export const steps = [
  {
    n: "01",
    title: "Load your brand",
    desc: "Drop in guidelines, past work, and tone. FarBoo builds a living brand memory the whole team shares.",
  },
  {
    n: "02",
    title: "Brief the team",
    desc: "Describe the outcome in plain language. The Conductor breaks it into tasks and assigns specialists.",
  },
  {
    n: "03",
    title: "Review in the loop",
    desc: "Agents draft, critique, and refine each other. You approve at clear checkpoints and steer direction.",
  },
  {
    n: "04",
    title: "Ship on brand",
    desc: "Export production-ready strategy, copy, and visual systems — consistent from the first pixel to the last.",
  },
];

export const testimonials = [
  {
    quote:
      "It felt like hiring a senior studio overnight. The agents actually disagreed with each other and the final work was sharper for it.",
    name: "Lena Marchetti",
    role: "Brand Director, Novena",
  },
  {
    quote:
      "We cut our campaign turnaround from six weeks to nine days without losing the craft. Our clients can't tell where the studio ends and FarBoo begins.",
    name: "Darius Okonkwo",
    role: "Founder, Halcyon Media",
  },
  {
    quote:
      "The brand memory is the killer feature. Nothing drifts. Every asset sounds like us.",
    name: "Priya Raman",
    role: "Head of Content, Vireo",
  },
];

export const pricing = [
  {
    name: "Solo",
    price: "$49",
    period: "/mo",
    tagline: "For independent specialists and freelancers.",
    features: [
      "3 core agents",
      "1 brand memory",
      "Up to 40 tasks / month",
      "Standard exports",
    ],
    cta: "Start solo",
    highlight: false,
  },
  {
    name: "Studio",
    price: "$199",
    period: "/mo",
    tagline: "For teams shipping brand work every week.",
    features: [
      "Full 12-agent roster + Conductor",
      "5 brand memories",
      "Unlimited tasks",
      "Priority rendering & 3D concepts",
      "Shared review workspace",
    ],
    cta: "Deploy the studio",
    highlight: true,
  },
  {
    name: "Agency",
    price: "Custom",
    period: "",
    tagline: "For agencies managing many client brands.",
    features: [
      "Unlimited brand memories",
      "Custom-trained agents",
      "SSO & role controls",
      "Dedicated success partner",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

export const faqs = [
  {
    q: "How is FarBoo different from a single AI chatbot?",
    a: "A chatbot is one generalist. FarBoo is a coordinated team of specialists, each tuned for a single craft and grounded in your brand memory, with a Conductor that routes work and reviews quality — the way a real studio operates.",
  },
  {
    q: "Will the output actually stay on brand?",
    a: "Yes. Every agent reads from the same persistent brand memory — your voice, palette, rules, and past work — so deliverables stay consistent across campaigns instead of drifting each time.",
  },
  {
    q: "Do I lose creative control?",
    a: "Never. You brief in plain language and approve at clear checkpoints. You can steer, reject, or refine any step; the agents adapt rather than run off on their own.",
  },
  {
    q: "Who is FarBoo for?",
    a: "Specialists who own real outcomes — brand directors, founders, content and design leads — who want studio-grade craft without studio timelines.",
  },
  {
    q: "Can I try it before committing?",
    a: "The Solo plan is designed as a low-risk entry point, and Agency trials are available on request. No long-term lock-in.",
  },
];
