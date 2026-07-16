/** @type {import('next').NextConfig} */
const nextConfig = {
  // خروجی استاتیک: فایل‌های HTML/CSS/JS خالص در پوشه‌ی out/
  // که می‌شود روی هر هاست استاتیک (Netlify Drop, GitHub Pages و…) آپلود کرد.
  output: "export",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};
export default nextConfig;
