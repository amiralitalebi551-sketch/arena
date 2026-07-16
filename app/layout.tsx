import type { Metadata, Viewport } from "next";
import { display, body, farsi } from "@/lib/fonts";
import "./globals.css";

// متادیتای پایه؛ متادیتای دقیق و وابسته به زبان در app/[locale]/layout.tsx است.
export const metadata: Metadata = {
  metadataBase: new URL("https://farboo.ai"),
  title: "FarBoo",
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0D0C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CSP فقط در production فعال می‌شود. در حالت dev، Next.js برای hot-reload به
  // 'unsafe-eval' نیاز دارد؛ اگر CSP آن را ببندد، جاوااسکریپت اجرا نمی‌شود و
  // صفحه سفید می‌ماند. هدرهای امنیتی واقعی (شامل frame-ancestors و HSTS) از
  // طریق public/_headers و vercel.json روی هاست اعمال می‌شوند.
  const isProd = process.env.NODE_ENV === "production";

  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${display.variable} ${body.variable} ${farsi.variable}`}
      suppressHydrationWarning
    >
      <head>
        {isProd && (
          <meta
            httpEquiv="Content-Security-Policy"
            content={[
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; ")}
          />
        )}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>{children}</body>
    </html>
  );
}
