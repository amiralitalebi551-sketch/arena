import type { Metadata } from "next";
import { defaultLocale } from "@/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: `/${defaultLocale}` },
};

// صفحه‌ی root فقط کاربر را به زبان پیش‌فرض می‌برد.
// سه لایه‌ی هدایت تا در هر شرایطی (dev, static, بدون JS) کار کند:
// ۱) اسکریپت inline با location.replace (فوری، در dev و prod)
// ۲) meta refresh (fallback بدون JS)
// ۳) لینک قابل‌کلیک (fallback نهایی)
export default function RootRedirect() {
  const target = `/${defaultLocale}`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <script
        dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(target)})` }}
      />
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0C0D0C",
          color: "#EDE6D6",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <a href={target} style={{ color: "#3FCF8E", textDecoration: "none" }}>
          FarBoo →
        </a>
      </div>
    </>
  );
}
