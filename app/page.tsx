import type { Metadata } from "next";
import Link from "next/link";
import { defaultLocale } from "@/i18n";

// در static export این صفحه /index.html می‌شود و با meta refresh به زبان
// پیش‌فرض هدایت می‌کند (بدون وابستگی به جاوااسکریپت). لینک هم fallback است.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: `/${defaultLocale}` },
};

export default function RootRedirect() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=/${defaultLocale}`} />
      <div className="flex min-h-screen items-center justify-center bg-base-900 text-ink">
        <Link href={`/${defaultLocale}`} className="text-accent hover:underline">
          FarBoo →
        </Link>
      </div>
    </>
  );
}
