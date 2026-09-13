# VLESS + WS + TLS — همیشه‌روشن، IP ثابت، ۰ دلار

> همه‌چی آماده‌ست. تو فقط **۶ تا کلیک** روی ClawCloud باید انجام بدی.
> بقیه‌اش (بیلد ایمیج، تست واقعی، مانیتور IP) رو GitHub Actions انجام می‌ده.

## ۰) جواب سوالی که پرسیدی

| سوال | جواب |
|---|---|
| سن اکانت GitHub | ساخته‌شده `2025-12-08` → **۲۷۸ روز** ✅ |
| شرط ۱۸۰ روز ClawCloud | **ردیفه** — کردیت ۵ دلار **هر ماه** می‌گیری، نه فقط ماه اول |
| کارت بانکی | لازم نیست. فقط لاگین با GitHub |

## ۱) استراتژی (صادقانه)

هیچ سرویس رایگانی «IP ثابت اختصاصی» نمی‌ده. چیزی که می‌شه گرفت اینه:

| | همیشه‌روشن | IP خروجی | حجم | اسم پایدار |
|---|---|---|---|---|
| **A — ClawCloud Run** | ✅ کانتینر نمی‌خوابه | 🟡 NAT مشترک کلاستر (احتمالاً ثابت — باید ثابت بشه) | ❌ **۱۰ گیگ/ماه** | ✅ `*.clawcloudrun.com` |
| **B — Cloudflare Worker** | ✅ هیچ‌وقت نمی‌خوابه | ❌ رنج IP کلودفلر | ✅ عملاً نامحدود (۱۰۰ هزار ریکوئست/روز) | ✅ `*.workers.dev` |
| **A+B — Worker روی ClawCloud زنجیره بشه** | ✅ | ✅ IP همون NAT ثابت ClawCloud | ✅ حجم از Worker رد می‌شه | ✅ |

**پیشنهاد من: هر دو رو بالا بیار.** B همیشه کار می‌کنه (حتی وقتی سهمیه ۱۰ گیگ A تموم شد)،
و توی پنل BPB گزینه **Chain Proxy** رو روشن می‌کنی و A رو به‌عنوان بالادست می‌دی → اون‌وقت
IP خروجی همون IP ثابت A می‌شه. این تنها ترکیب رایگانیه که هر دو شرط §2 رو می‌ده.

⚠️ **تنها چیزی که من نمی‌تونم خودم انجام بدم:** لاگین کردن توی اکانت ClawCloud / Cloudflare تو
(نیاز به مرورگر و OAuth داره و این سندباکس به اون سایت‌ها راه نداره). به‌جاش ایمیج رو
**ساخته و هل‌داده‌شده** تحویل می‌دم که تو فقط اسمش رو Paste کنی.

## ۲) PLAN A — ClawCloud Run (۶ کلیک)

ایمیج از قبل روی ghcr ساخته شده (اکشن `build-image`):

```
ghcr.io/amiralitalebi551-sketch/arena/xray-vless:latest
```

1. برو <https://console.run.claw.cloud> → **Sign in with GitHub** → Authorize.
   ریجن: **آلمان (`eu-central`)** یا **آمریکا** (سبک‌ترن؛ ژاپن/سنگاپور شلوغه).
2. منوی بالا راست → **Plan** → باید ببینی `Monthly Gift Credits: $5`. اگه ندیدی،
   توی Account Settings چک کن GitHub وصل باشه.
3. **App Launchpad** → **Create App**:
   | فیلد | مقدار |
   |---|---|
   | Application Name | `vless` |
   | Image Name | `ghcr.io/amiralitalebi551-sketch/arena/xray-vless:latest` |
   | CPU / Memory | **0.5 / 512M** (= حدود ۳ دلار از ۵ دلار؛ ۱ vCPU رو نذار، می‌شه ۵ دلار و صفر حاشیه) |
   | Network → Container Port | `80` |
   | Network → **Public Access** | ✅ روشن |
   | Local Storage → Mount Path | `/data` (تاریخچه IP بعد از ریستارت نمی‌پره) |
4. **Deploy Application** → صبر کن `Creating` بشه `Running` (~۱ دقیقه).
5. آدرس عمومی رو کپی کن، شکلش این‌طوریه:
   `https://vless-xxxxxxxx.eu-central.clawcloudrun.com`
6. باز کن توی مرورگر:
   ```
   https://<همون‌آدرس>/__panel?t=cf5d72f32b82
   ```
   ← صفحه‌ای که **لینک‌های vless:// + لینک سابسکریپشن + وضعیت IP** رو نشونت می‌ده. تمام.

**یک بار، دستی:** پکیج ghcr باید Public باشه تا ClawCloud بتونه بکشه‌ش. اکشن سعی می‌کنه خودش
انجامش بده؛ اگه نشد: <https://github.com/amiralitalebi551-sketch?tab=packages> → `xray-vless`
→ **Package settings** → **Change visibility** → **Public**. (اگه ایمیج کش نشد، ارورش همینه.)

### لینک‌ها (فقط `<HOST>` رو عوض کن)

```
vless://bac2db35-df5b-47e1-a8e1-19ecd81c1ed5@<HOST>:443?encryption=none&security=tls&sni=<HOST>&alpn=http%2F1.1&fp=chrome&type=ws&host=<HOST>&path=%2Fcf5d72f32b82#claw-vless-direct
```

با IP تمیز کلودفلر (وقتی خودِ hostname فیلتره) — فقط `@...` عوض می‌شه، `sni` و `host` همون `<HOST>` می‌مونن:

```
vless://bac2db35-df5b-47e1-a8e1-19ecd81c1ed5@104.17.147.22:443?encryption=none&security=tls&sni=<HOST>&alpn=http%2F1.1&fp=chrome&type=ws&host=<HOST>&path=%2Fcf5d72f32b82#claw-vless-cf1
```

یا همه‌شون یکجا به‌صورت سابسکریپشن:

```
https://<HOST>/__sub?t=cf5d72f32b82
```

این URL رو مستقیم بده به Hiddify / v2rayNG به‌عنوان Subscription.

### تنظیمات دستی (اگه خواستی دستی تایپ کنی)

| فیلد | مقدار |
|---|---|
| Protocol | VLESS |
| Address | `<HOST>` یا یکی از `104.17.147.22` `162.159.36.1` `172.67.74.1` `104.18.0.1` |
| Port | `443` |
| UUID | `bac2db35-df5b-47e1-a8e1-19ecd81c1ed5` |
| Encryption | none |
| Network / Transport | `ws` |
| WS Path | `/cf5d72f32b82` |
| Host (WS header) | `<HOST>` |
| SNI | `<HOST>` |
| Security | TLS · ALPN `http/1.1` · FP `chrome` · AllowInsecure **خاموش** |

> خبر خوب: `clawcloudrun.com` خودش پشت کلودفلره (DNS می‌ده `104.21.86.207` / `172.67.136.208`)،
> پس همون IPهای تمیزی که داری روش کار می‌کنن و TLS هم واقعی‌ه (نه self-signed).

## ۳) PLAN B — Cloudflare Worker (همیشه‌روشن، بدون سقف ۱۰ گیگ)

دو راه، هر دو رایگان:

**راه دستی (۳ دقیقه):** اکشن `sync-worker` رو بزن → `worker/worker.js` میاد توی ریپو →
داشبورد کلودفلر → Workers & Pages → Create → **Upload** → فایل `worker.js` → Deploy.
بعد `https://<name>.workers.dev/panel` (پسورد پیش‌فرض `admin` — **عوضش کن**).
توی پنل: UUID و مسیر رو بذار همون‌های بالا، و **Chain Proxy** رو روشن کن و کانفیگ ClawCloud
رو به‌عنوان بالادست بده ← این‌جوری IP ثابت می‌شه.

**راه خودکار:** فقط یک secret بذار:
`CLOUDFLARE_API_TOKEN` (با دسترسی *Workers Scripts: Edit*) → بعد اکشن `deploy-worker` رو بزن.
خودش KV می‌سازه، deploy می‌کنه، و لینک پنل رو توی Summary می‌نویسه.

## ۴) اثبات IP ثابت (بدون ادعا، با لاگ)

سه لایه:

1. **داخل خود کانتینر** یک watchdog هست: هر ۱۵ دقیقه از `api.ipify.org` و ۴ سرویس دیگه
   می‌پرسه «چه IP‌ای ازم می‌بینی؟» و همه‌رو ذخیره می‌کنه. اگه IP عوض بشه، توی لاگ
   `!!! EGRESS IP CHANGED` می‌زنه و توی `/__ip` شمارنده `changes` بالا می‌ره.
   تاریخچه روی `/data` می‌مونه، یعنی **ریستارت کانتینر هم پاکش نمی‌کنه**.
2. **اکشن `ip-monitor`** هر ۳ ساعت می‌پرسه + هندشیک WebSocket می‌زنه و یک ردیف به
   `IP-LOG.md` اضافه می‌کنه. اگه IP عوض بشه یا تونل مرده باشه، ران **قرمز** می‌شه.
   → بعد از چند روز، `IP-LOG.md` خودش سندِ «همیشه‌روشن + IP ثابت» هست.
   (لازمه: Settings → Secrets and variables → Actions → **Variables** → `PROXY_HOST` = هاستنت)
3. **اکشن `verify`** با ورودی `host` = هاستنت، کل پروتکل §5 رو از روی یک رانر واقعی اجرا
   می‌کنه و IP‌ای که کانتینر گزارش می‌ده رو با IP‌ای که اینترنت می‌بینه **مقایسه** می‌کنه.

```bash
# هر وقت خواستی خودت چک کنی (روی هر لینوکس/مک):
HOST=<HOST> bash scripts/test-remote.sh
```

## ۵) نقشه‌ی ریپو

```
server/Dockerfile        ایمیج (node:22-alpine + xray-core، amd64 و arm64)
server/config.json       کانفیگ Xray: VLESS+WS روی 127.0.0.1:2087، بدون geoip.dat (CIDR صریح)
server/front.js          روتر TCP + پنل + watchdog IP  (همون چیزی که /__panel رو می‌ده)
server/entrypoint.sh     رندر کانفیگ از env + سوپروایزر xray
scripts/verify.sh        پروتکل §5 (۱۰ بار کانکت، ۱۰ نمونه IP، سایت‌های فیلتر، سرعت)
scripts/check-endpoint.sh   سلامت تونل: / باید ۴۰۴، WS خراب ۴۰۰، WS سالم ۱۰۱
scripts/make-link.sh     هاست → لینک vless:// + سابسکریپشن base64
scripts/test-remote.sh   تست کامل یک اندپوینت واقعی + کراس‌چک IP
scripts/ci-local-stack.sh   کل زنجیره روی یک رانر: TLS و plain هر دو
scripts/render-client.js کانفیگ کلاینت Xray از روی env
.github/workflows/       build-image · verify · ip-monitor · sync-worker · deploy-worker
DEPLOY-CLAWCLOUD.md      نسخه‌ی موشکافانه‌ی کلیک‌ها + عیب‌یابی
worker/                  Plan B (BPB-Worker-Panel)
```

## ۶) متغیرهای env ایمیج (همه اختیاری، پیش‌فرض‌ها همون دارایی‌های تو هستن)

| env | پیش‌فرض |
|---|---|
| `UUID` | `bac2db35-df5b-47e1-a8e1-19ecd81c1ed5` |
| `WS_PATH` | `/cf5d72f32b82` |
| `PANEL_TOKEN` | `cf5d72f32b82` — **حتماً عوضش کن** (کلید `/__panel` و `/__sub` هست) |
| `PORT` / `XRAY_PORT` | `80` / `2087` |
| `IP_SAMPLE_SECONDS` | `900` |
| `CLEAN_IPS` | `104.17.147.22,162.159.36.1,172.67.74.1,104.18.0.1` |
| `EXTRA_CLIENTS` | خالی — UUID اضافه برای دستگاه دوم/دوست |
| `TLS_PORT` + `TLS_CERT` + `TLS_KEY` | خاموش — برای VPS خام (Plan C) که خودش TLS می‌خواد |
