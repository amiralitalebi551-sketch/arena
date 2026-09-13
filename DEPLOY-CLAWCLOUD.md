# PLAN A — ClawCloud Run، کلیک‌به‌کلیک

هدف: یک کانتینر همیشه‌روشن با VLESS+WS پشت `*.clawcloudrun.com` (که خودش پشت
Cloudflare است)، بدون کارت بانکی، بدون ترمینال.

---

## ۰. پیش‌نیاز

اکانت GitHub تو **۲۷۸ روز** سن داره (ساخته‌شده `2025-12-08`) → از شرط ۱۸۰ روز رد شده →
کردیت **۵ دلار در ماه، هر ماه** می‌گیری. کارت بانکی لازم نیست.

## ۱. لاگین

1. <https://console.run.claw.cloud> → **Sign in with GitHub** → دکمه‌ی سبز **Authorize ClawCloud**.
2. انتخاب ریجن: **Germany (`eu-central-1`)** یا **US-West**.
   (ژاپن و سنگاپور معمولاً زیر بار کاربرهای رایگان سنگین‌ترن.)
3. Workspace name: هر چی دوست داری → **Start Deploying**.
4. منوی بالا-راست → **Plan** → باید ببینی `Monthly Gift Credits: $5`.
   اگه ندیدی: Account Settings → چک کن GitHub متصل باشه.

## ۲. ساخت اپ

**App Launchpad** → **Create App** → این جدول رو پر کن:

| بخش | فیلد | مقدار |
|---|---|---|
| Basic | Application Name | `vless` |
| Basic | Image Name | **مسیر A یا B پایین** |
| Usage | CPU | `0.5` |
| Usage | Memory | `512M` |
| Network | Container Port | `80` |
| Network | Public Access | **روشن** ✅ |
| Storage | Local Storage → Mount Path | `/data` |
| Advanced | Environment Variables | `PANEL_TOKEN` = یک رشته‌ی دلخواهِ خودت (نه `cf5d72f32b82`) |
| Advanced | Command / Args | فقط برای مسیر B |

بعد **Deploy Application** بالا-راست. ~۱ دقیقه صبر کن تا `Creating` بشه `Running`.

### هزینه‌ی این سایزینگ (چرا ۰.۵ و نه ۱)

| منبع | نرخ | ۰.۵ vCPU / 512M | ۱ vCPU / 512M |
|---|---|---|---|
| CPU | `$0.000092593` / vCPU / دقیقه | `$2.00` | `$4.00` |
| RAM | `$0.000046296` / GB / دقیقه | `$1.00` | `$1.00` |
| **جمع ماهانه** | | **≈ $3.00** ✅ | **≈ $5.00** ⚠️ صفر حاشیه |

xray با ~۴۰ مگابایت RAM کار می‌کنه؛ ۰.۵ vCPU هم برای یک نفر زیاده.
**۱ vCPU نذار** چون دقیقاً ۵ دلار می‌شه و با کمی ترافیک/دیسک از کردیت می‌زنه بیرون → اپ می‌خوابه.

## ۳. مسیر A — ایمیج آماده (تمیزترین، ولی需要先 اکشن‌ها فعال بشن)

```
ghcr.io/amiralitalebi551-sketch/arena/xray-vless:latest
```

- هیچ Command‌ای لازم نیست (ایمیج ENTRYPOINT داره).
- یک‌بار باید پکیج رو **Public** کنی: <https://github.com/amiralitalebi551-sketch?tab=packages>
  → `xray-vless` → **Package settings** → **Change visibility** → **Public**.
- ⚠️ **وضعیت فعلی:** این ایمیج هنوز ساخته نشده، چون اپِ GitHub اجازه‌ی `workflows` نداره
  و من نتونستم `.github/workflows/` رو push کنم. نگاه کن به `ci/README.md` → راه ۱ (یک کلیک).
  به محض اینکه اجازه بدی، می‌سازمش و تستش می‌کنم و بهت می‌گم.

## ۴. مسیر B — بدون CI، بدون رجیستری (الان، همین امروز کار می‌کنه)

Image Name:

```
node:22-alpine
```

Command / Args (دقیقاً از `bash scripts/bootstrap-cmd.sh` کپی کن):

```
Command : sh
Args    : -c
          wget -qO- https://raw.githubusercontent.com/amiralitalebi551-sketch/arena/arena/01a09a53-arena/scripts/bootstrap.sh | sh
```

> اگه فقط **یک** کادر Command داری (نه Command+Args جدا)، این رو بذار:
> ```
> sh -c wget$IFS-qO-$IFShttps://raw.githubusercontent.com/amiralitalebi551-sketch/arena/arena/01a09a53-arena/scripts/bootstrap.sh$IFS|$IFSsh
> ```
> (`$IFS` جانشین فاصله‌ست چون اون کادر روی فاصله تکه‌تکه می‌شه.)
>
> **صادقانه:** من نتونستم از این سندباکس semantics دقیق اون کادر رو تست کنم
> (راهی به `console.run.claw.cloud` ندارم). اگه اپ `CreateContainerError` یا
> `exec format error` داد، فرم دیگه رو امتحان کن؛ لاگ کانتینر دقیق می‌گه چی شده.

بعد از بالا اومدن، `bootstrap.sh`:
1. `front.js` / `config.json` / `entrypoint.sh` رو از ریپو می‌گیره و **کش می‌کنه روی `/data`**
   (پس ریستارت بعدی حتی اگه GitHub down باشه بالا میاد)
2. `xray-core` رو دانلود می‌کنه (یک‌بار؛ بعدش از `/data` کش می‌شه → بوت ~۲ ثانیه)
3. کانفیگ رو از env رندر و با `xray -test` اعتبارسنجی می‌کنه
4. سوپروایزر xray + روتر `front.js` رو اجرا می‌کنه

بعد از merge شدن PR به `main` بهتره `BOOT_REF=main` رو به‌عنوان متغیر محیطی بذاری
تا به برنچ موقت این جلسه وابسته نباشی.

## ۵. گرفتن لینک‌ها

آدرس عمومی اپ چیزی شبیه اینه:

```
https://vless-xxxxxxxx.eu-central-1.clawcloudrun.com
```

توی مرورگر باز کن (توکن همون `PANEL_TOKEN`‌ای است که گذاشتی):

```
https://<آدرس>/__panel?t=<PANEL_TOKEN>
```

→ صفحه‌ای با: لینک‌های `vless://` (یکی با خود hostname، چهارتا با IPهای تمیز)،
لینک سابسکریپشن، وضعیت IP خروجی، و نتیجه‌ی خود-آزمایی §5.

لینک سابسکریپشن (مستقیم بده به Hiddify / v2rayNG):

```
https://<آدرس>/__sub?t=<PANEL_TOKEN>
```

یا روی هر ماشینی:

```bash
bash scripts/make-link.sh <آدرس-بدون-https>
HOST=<آدرس-بدون-https> bash scripts/test-remote.sh     # تست کامل
```

## ۶. چک کردن سلامت (۳۰ ثانیه)

```bash
bash scripts/check-endpoint.sh <آدرس-بدون-https>
```

انتظار:

| تست | انتظار |
|---|---|
| `GET /` | `404` |
| `GET <path>` بدون upgrade | `400` |
| هندشیک WebSocket روی `<path>` | `101` |
| `GET /__health` | `200` |
| هر ۴ IP تمیز با `--resolve` | `404 / 101 / 200` |

## ۷. عیب‌یابی

| علامت | معنی | چاره |
|---|---|---|
| `ImagePullBackOff` (مسیر A) | پکیج ghcr خصوصی‌ه | Package settings → Public |
| `CreateContainerError` / `exec format error` | Command بد تکه‌تکه شده | فرم ۲ ↔ فرم ۱ رو عوض کن |
| `Running` ولی `GET /` → `530` | ingress بالا است، کانتینر نه | لاگ‌ها: دنبال `[boot]`/`[front]` بگرد |
| `GET /` → `000` | DNS/TLS/فیلتر | با IP تمیز + `--resolve` تست کن |
| هندشیک → `404` | مسیر WS اشتباه | `WS_PATH` رو چک کن؛ پیش‌فرض `/cf5d72f32b82` |
| هندشیک → `101` ولی کلاینت وصل نمی‌شه | UUID اشتباه | `UUID` env یا `/__panel` رو چک کن |
| وصل می‌شه ولی سایت باز نمی‌شه | خروجی/DNS کلاستر | `/__verify?t=…&fresh=1` رو باز کن |
| `/__ip` → `404` | توکن اشتباه | `?t=` باید دقیقاً `PANEL_TOKEN` باشه |
| لاگ: `state save failed` | `/data` mount نشده | Local Storage → Mount Path = `/data` |
| بعد از چند روز قطع شد | کردیت/سهمیه تموم شده | Plan → مصرف رو ببین؛ CPU رو ۰.۲۵ کن |

## ۸. سقف‌هایی که باید بدونی (بدون روتوش)

- **۱۰ گیگابایت ترافیک خروجی در ماه.** این محدودیت واقعیه. مرورگری ~۲-۳ گیگ،
  ولی ویدیوی ۷۲۰p ساعتی ~۱.۵ گیگ. اگه تموم بشه اپ می‌خوابه → «همیشه‌روشن» می‌شکنه.
  **راه‌حلش Plan B هست** (Worker کلودفلر سقف حجم نداره) — به همین خاطر هر دو رو خواستم.
- **IP خروجی یک NAT اشتراکی کلاستره، نه IP اختصاصی تو.** هیچ PaaS رایگانی IP
  اختصاصی نمی‌ده. watchdog + `ip-monitor` دقیقاً برای همینه که **ثابت بشه** آیا در
  عمل ثابته یا نه، به‌جای اینکه فرض کنیم.
- **بدون UDP.** WS روی TCP است → تماس تصویری تلگرام/دیسکورد کار نمی‌کنه (چت و فایل چرا).
- free tier = یک workspace، یک seat، بدون SLA. اگه ریجن رو عوض کنی IP خروجی عوض می‌شه.
