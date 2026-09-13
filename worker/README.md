# PLAN B — Cloudflare Worker (BPB-Worker-Panel)

چرا این هم لازم است: Worker کلودفلر **هیچ‌وقت نمی‌خوابه** و **سقف ۱۰ گیگ ماهانه نداره**
(فقط ۱۰۰ هزار ریکوئست در روز). نقطه‌ضعفش اینه که IP خروجی‌اش رنجِ کلودفلره، یعنی ثابت نیست.
راه‌حلش **Chain Proxy** است: Worker رو به یک بالادست با IP ثابت (همون Plan A) زنجیره می‌کنی.

| حالت | IP خروجی | حجم | همیشه‌روشن | UDP |
|---|---|---|---|---|
| Worker تنها | ❌ رنج کلودفلر (ثابت نیست) | ✅ عملاً نامحدود | ✅ | ❌ |
| Worker + Chain به Plan A | ✅ همون IP ثابت ClawCloud | ❌ از ۱۰ گیگ ClawCloud کم می‌شه | ✅ | ❌ |

پنل BPB می‌تونه **هر دو** کانفیگ رو کنار هم بده، پس لازم نیست یکی رو انتخاب کنی —
توی کلاینت هر کدوم رو که اون لحظه می‌خوای بردار.

---

## راه ۱ — دستی (۳ دقیقه، بدون هیچ ابزاری)

1. `worker.js` رو بگیر:
   - اگه اکشن `sync-worker` فعال باشه، خودکار میاد توی `worker/worker.js`؛ یا
   - مستقیم از <https://github.com/bia-pain-bache/BPB-Worker-Panel/releases/latest> دانلود کن
     (فایل `worker.js`، نسخه‌ی فعلی `v5.1.1`).
2. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Worker** →
   یک اسم بده (مثلاً `bpb-vless`) → **Deploy**.
3. **Edit code** → هر چی توی ادیتور هست پاک کن → محتوای `worker.js` رو Paste کن →
   **Deploy** (یا Save).
   - اگه گزینه‌ی **Upload** دیدی، مستقیم فایل رو آپلود کن؛ ساده‌تره.
4. (اختیاری ولی توصیه‌شده) **Settings → Bindings → KV namespace** → یک KV بساز
   (`Create KV` → اسم `bpb`) و binding رو `kv` بذار. بدون KV تنظیمات پنل ممکنه پایدار نمونه.
5. برو به `https://bpb-vless.<subdomain>.workers.dev/panel`
   - پسورد پیش‌فرض **`admin`** است → **اولین کار عوضش کن**.

### توی پنل چه چیزی رو تنظیم کنی

| تنظیم | مقدار |
|---|---|
| VLESS UUID | `bac2db35-df5b-47e1-a8e1-19ecd81c1ed5` |
| WS path (اگه از chain به Plan A استفاده می‌کنی) | `/cf5d72f32b82` |
| Clean IPs | `104.17.147.22` `162.159.36.1` `172.67.74.1` `104.18.0.1` |
| Chain Proxy / Outbound Proxy | لینک `vless://` که از Plan A گرفتی |
| Remote DNS | `1.1.1.1` |

بعد از Save، از همون پنل **Subscription URL** رو کپی کن (`/sub`) و بده به
Hiddify / v2rayNG / Streisand.

---

## راه ۲ — خودکار با GitHub Actions

یک secret لازم داری (رایگان، بدون کارت):

1. <https://dash.cloudflare.com/profile/api-tokens> → **Create Token** →
   قالب **Edit Cloudflare Workers** → یک **API Token** با `Workers Scripts: Edit`
   (+ `Account Settings: Read`).
2. ریپو → **Settings → Secrets and variables → Actions → Secrets** →
   **New repository secret** → اسم `CLOUDFLARE_API_TOKEN` → مقدار توکن.
3. اکشن **`deploy-worker`** رو بزن (Run workflow). خودش:
   - اکانت و `workers.dev` subdomain رو پیدا می‌کنه
   - یک KV namespace می‌سازه و به `wrangler.toml` اضافه می‌کنه
   - با `wrangler deploy` بالا می‌بره
   - لینک پنل رو توی Summary می‌نویسه

> پیش‌نیاز: یک‌بار اکشن `sync-worker` رو بزن تا `worker/worker.js` توی ریپو باشه.
> و چون اپِ GitHub اجازه‌ی `workflows` نداره، اول `ci/README.md` → راه ۱ یا راه ۲.

---

## محدودیت‌ها (صادقانه)

- **UDP نیست** → تماس تصویری تلگرام/دیسکورد و بعضی بازی‌ها کار نمی‌کنن.
- **۱۰۰ هزار ریکوئست در روز** روی پلن رایگان. برای یک نفر با WS کافیه، ولی
  برنامه‌هایی که مدام reconnect می‌کنن زودتر می‌سوزوننش.
- IP خروجی Worker **ثابت نیست** — این ذاتِ Workers است، باگ نیست.
- `*.workers.dev` توی ایران گاهی خودش فیلتر می‌شه. در اون حالت یا دامنه‌ی خودت رو
  روی Worker بذار، یا از Plan A استفاده کن.

## جایگزین سبک‌تر

اگه پنل نمی‌خوای و فقط یک تونل VLESS خالی می‌خوای:
<https://github.com/cmliu/edgetunnel> — همون کار، بدون پنل، با `Deploy to Workers`.
