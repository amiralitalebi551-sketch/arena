# VLESS + WS + TLS — همیشه‌روشن، IP ثابت، ۰ دلار

کانفیگ اول، توضیح بعد. همه‌ی دارایی‌های §3 تو **دست‌نخورده** نگه داشته شدن:

```
UUID:      bac2db35-df5b-47e1-a8e1-19ecd81c1ed5
WS PATH:   /cf5d72f32b82
PROTOCOL:  VLESS + WebSocket + TLS (پشت Cloudflare)
ALPN:      http/1.1        FP: chrome
CLEAN IPs: 104.17.147.22 · 162.159.36.1 · 172.67.74.1 · 104.18.0.1
```

---

## اول از همه: دو تا جواب قطعی

**۱) سن اکانت GitHub تو:** ساخته‌شده `2025-12-08` → **۲۷۸ روز** → از شرط ۱۸۰ روزِ ClawCloud
رد شده ✅ → کردیت ۵ دلار **هر ماه** می‌گیری، نه فقط ماه اول. کارت بانکی لازم نیست.
(این رو با `gh api users/amiralitalebi551-sketch` گرفتم، حدس نیست.)

**۲) `clawcloudrun.com` پشت Cloudflare است** — DNS می‌ده `104.21.86.207` / `172.67.136.208`.
یعنی همون IPهای تمیزی که داری روش کار می‌کنن، SNI/Host همون hostname واقعی می‌مونه،
و TLS هم واقعیه (نه self-signed). دقیقاً همون معمیتی که §3 توصیف کرده.

## کاری که باید تو بکنی: ۶ کلیک → `DEPLOY-CLAWCLOUD.md`

خلاصه‌ش:

| مرحله | چی‌کار |
|---|---|
| 1 | <https://console.run.claw.cloud> → Sign in with GitHub → ریجن **آلمان** |
| 2 | Plan → ببین `Monthly Gift Credits: $5` |
| 3 | App Launchpad → Create App |
| 4 | Image: `node:22-alpine` · CPU `0.5` · Mem `512M` · Port `80` · **Public Access روشن** · Mount `/data` |
| 5 | Command: `node` (فقط همین یک کلمه) · Args: خالی · دو تا Environment Variable: `BOOT_URL` و `NODE_OPTIONS` |
| 6 | Deploy → بعد `https://<آدرس>/__panel?t=<PANEL_TOKEN>` |

اون صفحه‌ی `/__panel` همه‌چی رو می‌ده: لینک‌های `vless://`، سابسکریپشن base64، وضعیت IP
خروجی، و نتیجه‌ی خود-آزمایی §5. **بدون ترمینال، بدون CI، بدون رجیستری.**

`bash scripts/bootstrap-cmd.sh` رشته‌ی دقیقِ هر دو متغیر رو برات چاپ می‌کنه (مقادیر آماده‌ی کپی
هم پایین‌تر در `DEPLOY-CLAWCLOUD.md` هست). هیچ اسکریپتی توی کادر Command نمی‌ریزی، پس هیچ
مشکل quoting/splitting‌ای هم پیش نمیاد.

### لینک (فقط `<HOST>` عوض می‌شه)

```
vless://bac2db35-df5b-47e1-a8e1-19ecd81c1ed5@<HOST>:443?encryption=none&security=tls&sni=<HOST>&alpn=http%2F1.1&fp=chrome&type=ws&host=<HOST>&path=%2Fcf5d72f32b82#claw-direct
```

با IP تمیز (وقتی hostname خودش فیلتره) — فقط `@` عوض می‌شه، `sni`/`host` همون `<HOST>` می‌مونن:

```
vless://bac2db35-df5b-47e1-a8e1-19ecd81c1ed5@104.17.147.22:443?encryption=none&security=tls&sni=<HOST>&alpn=http%2F1.1&fp=chrome&type=ws&host=<HOST>&path=%2Fcf5d72f32b82#claw-cf1
```

همه‌شون یکجا، به‌صورت سابسکریپشن (بده به Hiddify/v2rayNG):

```
https://<HOST>/__sub?t=<PANEL_TOKEN>
```

### جدول تنظیمات دستی

| فیلد | مقدار |
|---|---|
| Protocol | VLESS · Encryption `none` |
| Address | `<HOST>` یا `104.17.147.22` `162.159.36.1` `172.67.74.1` `104.18.0.1` |
| Port | `443` |
| UUID | `bac2db35-df5b-47e1-a8e1-19ecd81c1ed5` |
| Network | `ws` · Path `/cf5d72f32b82` |
| Host (WS header) | `<HOST>` |
| SNI | `<HOST>` |
| Security | TLS · ALPN `http/1.1` · FP `chrome` · AllowInsecure **خاموش** |

---

## استراتژی: چرا هر دو Plan

هیچ سرویس رایگانی «IP ثابت اختصاصی» نمی‌ده — این رو صاف می‌گم. چیزی که می‌شه گرفت:

| | همیشه‌روشن | IP خروجی | حجم | hostname پایدار |
|---|---|---|---|---|
| **A — ClawCloud Run** | ✅ کانتینر نمی‌خوابه | 🟡 NAT اشتراکی کلاستر — **باید ثابت بشه** | ❌ **۱۰ گیگ/ماه** | ✅ `*.clawcloudrun.com` |
| **B — Cloudflare Worker** | ✅ هرگز نمی‌خوابه | ❌ رنج کلودفلر | ✅ عملاً نامحدود (۱۰۰k ریکوئست/روز) | ✅ `*.workers.dev` |
| **B + Chain به A** | ✅ | ✅ همون IP ثابت A | ❌ از ۱۰ گیگ A کم می‌شه | ✅ |

**پیشنهاد: هر دو رو بالا بیار.** B وقتی سهمیه‌ی ۱۰ گیگی A تموم شد نجاتت می‌ده،
و پنل BPB می‌تونه هر دو کانفیگ (مستقیم و زنجیره‌شده) رو کنار هم بده → خودت انتخاب می‌کنی.
این دقیقاً همون trade-off‌ای است که §8 گفت باید بهت بگم نه اینکه خودم انتخاب کنم:

> **همیشه‌روشنِ بی‌سقف (B) ↔ IP ثابت (A).** با هر دو، مجبور نیستی انتخاب کنی.

Plan B → `worker/README.md`

---

## اثبات IP ثابت — سه لایه، بدون ادعا

1. **watchdog داخل کانتینر**: هر ۱۵ دقیقه از `api.ipify.org` + ۴ سرویس دیگه می‌پرسه
   «چه IP‌ای ازم می‌بینی؟». اگه عوض بشه توی لاگ `!!! EGRESS IP CHANGED` می‌زنه و
   شمارنده‌ی `changes` توی `/__ip` بالا می‌ره. تاریخچه روی `/data` می‌مونه →
   **ریستارت کانتینر پاکش نمی‌کنه**، پس شرط §5.3 (IP بعد از ریستارت) خودکار پوشش داده می‌شه.
2. **`/__verify`** = پروتکل §5 از سمت خروجی، بدون نیاز به CI:
   ۵ نمونه IP، ۵ بار `generate_204`، ۶ سایت فیلترشده، تست سرعت ۱۰ مگابایتی از
   `speed.cloudflare.com`، و org/country خروجی. خودش هر ۶ ساعت اجرا می‌شه.
   ```
   https://<HOST>/__verify?t=<PANEL_TOKEN>&fresh=1
   ```
3. **`ip-monitor.yml`** (اگه اکشن‌ها فعال بشن): هر ۳ ساعت هندشیک WS می‌زنه + IP رو
   می‌خونه و یک ردیف به `IP-LOG.md` اضافه می‌کنه. IP عوض بشه یا تونل بمیره → ران **قرمز**.
   بعد از چند روز، `IP-LOG.md` خودش سندِ «همیشه‌روشن + IP ثابت» است.

از بیرون هم:

```bash
bash scripts/check-endpoint.sh <HOST>          # 404 / 400 / 101 / IPهای تمیز
HOST=<HOST> bash scripts/test-remote.sh        # کل §5 + کراس‌چک IP کانتینر با IP اینترنت
bash scripts/make-link.sh <HOST>               # لینک‌ها + سابسکریپشن
```

---

## چی واقعاً تست شد

**۱۰۸ تست، همه سبز** — جزئیات کامل و لاگ‌ها در `TESTS.md`.

| تست | نتیجه |
|---|---|
| `node scripts/lint-config.js` (۲۶ بررسی، شامل تله‌های §6) | **26/26** |
| `node scripts/test-front.js` (روتر، ۴۰۴/۴۰۰/۱۰۱، payload بایت‌دقیق، TLS) | **34/34** |
| `bash scripts/test-bootstrap.sh` (زنجیره‌ی deploy، فرم shell) | **21/21** |
| `bash scripts/test-bootstrap-mjs.sh` (فرم اصلی: NODE_OPTIONS + بوت **آفلاین** از کش) | **27/27** |

تست‌ها یک **باگ واقعی** پیدا کردن: `front.js` هدر رو با `end()` می‌فرستاد و بدنه رو بعدش
با `write()` → بدنه بی‌صدا دور ریخته می‌شد و `/__sub` خالی برمی‌گشت. درست شد.

**چی تست نشد و چرا:** این سندباکس فقط به `github.com`/`api.github.com`/`npmjs`/`pypi`
راه داره؛ `objects.githubusercontent.com` بسته‌ست پس باینری واقعی xray-core اینجا قابل
دانلود نبود، و خروجی به اینترنت آزاد هم بسته‌ست (`google.com` → `000`). پس §5 روی
**اندپوینت واقعی** فقط یا روی رانر GitHub اجرا می‌شه یا توسط `/__verify` داخل کانتینر.
هیچ‌کدوم از این دو هنوز اجرا نشدن — **هیچ ادعای اثبات‌نشده‌ای درباره‌ی IP ثابت نمی‌کنم.**

---

## نقشه‌ی ریپو

```
server/Dockerfile          ایمیج (node:22-alpine + xray-core، amd64 و arm64)
server/config.json         Xray: VLESS+WS روی 127.0.0.1:2087، بدون geoip.dat (CIDR صریح)
server/front.js            روتر TCP + پنل + watchdog IP + خود-آزمایی §5
server/entrypoint.sh       رندر کانفیگ از env + سوپروایزر با backoff
scripts/bootstrap.sh       مسیر بدون CI: ایمیج خام → سرور کامل
scripts/bootstrap-cmd.sh   رشته‌ی دقیق Command برای paste کردن
scripts/lint-config.js     ۲۶ بررسی استاتیک روی کانفیگ
scripts/test-front.js      ۳۴ تست روی روتر
scripts/test-bootstrap.sh  ۲۱ تست روی زنجیره‌ی deploy
scripts/test-all.sh        هر چهار تا
scripts/test-bootstrap-mjs.sh  ۲۷ تست روی فرم اصلی deploy (NODE_OPTIONS + بوت آفلاین)
scripts/verify.sh          پروتکل §5 (روی هر ماشینی)
scripts/check-endpoint.sh  سلامت تونل: ۴۰۴/۴۰۰/۱۰۱ + IPهای تمیز
scripts/make-link.sh       هاست → vless:// + سابسکریپشن base64
scripts/test-remote.sh     تست کامل اندپوینت واقعی + کراس‌چک IP
scripts/ci-local-stack.sh  کل زنجیره روی یک رانر (TLS و plain هر دو)
scripts/render-client.js   کانفیگ کلاینت Xray از env
scripts/get-xray.sh        دانلود xray-core
ci/                        اکشن‌ها (چرا اینجا؟ → ci/README.md)
worker/                    Plan B
DEPLOY-CLAWCLOUD.md        کلیک‌به‌کلیک + هزینه + عیب‌یابی
TESTS.md                   چی تست شد، با لاگ
```

## env های کانتینر (همه اختیاری — پیش‌فرض‌ها همون دارایی‌های تو)

| env | پیش‌فرض |
|---|---|
| `UUID` | `bac2db35-df5b-47e1-a8e1-19ecd81c1ed5` |
| `WS_PATH` | `/cf5d72f32b82` |
| `PANEL_TOKEN` | `cf5d72f32b82` — **عوضش کن** |
| `PORT` / `XRAY_PORT` | `80` / `2087` |
| `IP_SAMPLE_SECONDS` | `900` |
| `VERIFY_EVERY_MINUTES` | `360` |
| `CLEAN_IPS` | `104.17.147.22,162.159.36.1,172.67.74.1,104.18.0.1` |
| `EXTRA_CLIENTS` | خالی — UUID اضافه برای دستگاه دوم |
| `TLS_PORT`+`TLS_CERT`+`TLS_KEY` | خاموش — برای VPS خام (Plan C/D) |
| `BOOT_REF` / `BOOT_REPO` | برنچ/ریپویی که bootstrap ازش می‌خونه |

## دو درخواست از تو (هر کدوم یک کلیک)

1. **اجازه‌ی `workflows`** به اپ GitHub (`ci/README.md` → راه ۱). بدون اون من نمی‌تونم
   ایمیج رو بسازم، §5 رو روی رانر اجرا کنم، یا `IP-LOG.md` رو نگه دارم.
2. **هاستنت** بعد از deploy. باهاش `check-endpoint.sh` و لینک نهایی رو دقیق می‌کنم.
