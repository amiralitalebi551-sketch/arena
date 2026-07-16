/** @type {import('next').NextConfig} */
const nextConfig = {
  // خروجی استاتیک: فایل‌های HTML/CSS/JS خالص در پوشه‌ی out/
  // که می‌شود روی هر هاست استاتیک (Netlify Drop, GitHub Pages و…) آپلود کرد.
  output: "export",
  reactStrictMode: true,
  transpilePackages: ["three"],
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: "asset/source",
    });
    return config;
  },
};
export default nextConfig;
