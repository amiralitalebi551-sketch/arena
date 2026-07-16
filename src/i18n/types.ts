export const locales = ["fa", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fa";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "fa" ? "rtl" : "ltr";
}

export interface Dictionary {
  meta: {
    title: string;
    description: string;
    keywords: string[];
    ogTitle: string;
  };
  brand: {
    name: string;
    nameLatin: string;
    tagline: string;
  };
  nav: { label: string; href: string }[];
  cta: {
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
  hero: {
    eyebrow: string;
    titleLead: string[]; // کلمات خط اول برای انیمیشن
    titleAccent: string; // خط دوم برجسته
    body: string;
    scroll: string;
  };
  stats: { num: number; suffix: string; label: string }[];
  clients: string[];
  problem: Section;
  solution: Section;
  featuresHead: Head;
  features: { title: string; desc: string; icon: string }[];
  story: {
    eyebrow: string;
    title: string;
    ariaLabel: string;
    beats: { title: string; body: string }[];
  };
  stepsHead: Head;
  steps: { n: string; title: string; desc: string }[];
  socialHead: string;
  testimonials: { quote: string; name: string; role: string }[];
  pricingHead: Head;
  pricing: {
    name: string;
    price: string;
    period: string;
    tagline: string;
    features: string[];
    cta: string;
    highlight: boolean;
  }[];
  faqHead: Head;
  faqs: { q: string; a: string }[];
  finalCta: {
    title: string;
    body: string;
    placeholder: string;
    submitLabel: string;
    success: string;
    errorInvalid: string;
    errorFailed: string;
    fineprint: string;
    emailLabel: string;
  };
  footer: {
    blurb: string;
    productHead: string;
    companyHead: string;
    company: string[];
    followHead: string;
    rights: string;
    privacy: string;
    terms: string;
  };
  social: { label: string; href: string }[];
  ui: {
    skip: string;
    menuOpen: string;
    menuClose: string;
    soundOn: string;
    soundOff: string;
    switchTo: string; // نام زبان دیگر برای دکمه سوییچ
  };
}

interface Section {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
}
interface Head {
  eyebrow: string;
  title: string;
  body?: string;
}
