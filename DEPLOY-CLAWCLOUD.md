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

`bash scripts/bootstrap-cmd.sh` همین مقادیر رو برات چاپ می‌کنه. سه فرم داره؛ **فرم A اصلی است.**

### فرم A — Command فقط یک کلمه، بقیه‌اش دو تا Environment Variable

**Command:** `node` ← فقط همین. **Args:** خالی.

`BOOT_URL`:

```
https://raw.githubusercontent.com/amiralitalebi551-sketch/arena/arena/01a09a53-arena/scripts/bootstrap.mjs
```

`NODE_OPTIONS`:

```
--import=data:text/javascript;base64,Y29uc3QgdT1wcm9jZXNzLmVudi5CT09UX1VSTCxjPXByb2Nlc3MuZW52LkJPT1RfQ3x8KChwcm9jZXNzLmVudi5TVEFURV9ESVJ8fCIvZGF0YSIpKyIvYmMubWpzIiksZj1hd2FpdCBpbXBvcnQoIm5vZGU6ZnMiKTsgbGV0IHQsZT0iIjsgdHJ5e2NvbnN0IHI9YXdhaXQgZmV0Y2godSx7c2lnbmFsOkFib3J0U2lnbmFsLnRpbWVvdXQoMzAwMDApfSk7aWYoci5vayl0PWF3YWl0IHIudGV4dCgpfWNhdGNoKHgpe2U9eC5tZXNzYWdlfSBpZighdHx8dC5sZW5ndGg8OTkpe3RyeXt0PWYucmVhZEZpbGVTeW5jKGMsInV0ZjgiKTtjb25zb2xlLmxvZygiW2Jvb3QtbG9hZGVyXSBjYWNoZWQgYm9vdCAoIitlKyIpIil9Y2F0Y2goeCl7dGhyb3cgbmV3IEVycm9yKCJCT09UX1VSTCBmYWlsZWQ6ICIrZSl9fSB0cnl7Zi53cml0ZUZpbGVTeW5jKGMsdCl9Y2F0Y2goeCl7fSBhd2FpdCBpbXBvcnQoImRhdGE6dGV4dC9qYXZhc2NyaXB0O2Jhc2U2NCwiK0J1ZmZlci5mcm9tKHQpLnRvU3RyaW5nKCJiYXNlNjQiKSk7
```

> بعد از merge شدن PR به `main`، فقط `BOOT_URL` رو به این عوض کن (یا
> `BOOT_REF=main bash scripts/bootstrap-cmd.sh` رو بزن):
> ```
> https://raw.githubusercontent.com/amiralitalebi551-sketch/arena/main/scripts/bootstrap.mjs
> ```
> اگه فراموش کردی هم فاجعه نیست: لودر خودش رو توی `/data/bc.mjs` کش می‌کنه، پس حتی
> اگه اون برنچ پاک بشه کانتینر از روی کش بالا میاد (این با تست PHASE 2 اثبات شده).

**چرا این فرم از همه مطمئن‌تره:**

1. بیلد رسمی node فروشگاه CA خودش رو **داخل باینری** داره، پس HTTPS کار می‌کنه حتی وقتی
   `node:22-alpine` نه `curl` داره نه پکیج `ca-certificates`. (از سورس `nodejs/docker-node`
   چک کردم: `curl` فقط توی `.build-deps-yarn` نصب می‌شه که بعد از بیلد پاک می‌شه.)
2. هیچ‌جا shell-quote نمی‌شه → ابهامِ «کادر Command رو چطور تکه‌تکه می‌کنن» صفر می‌شه.
3. `Command: node` امنه چون entrypoint واقعیِ ایمیج این است:
   ```sh
   if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ] || { [ -f "${1}" ] && ! [ -x "${1}" ]; }; then
     set -- node "$@"
   fi
   exec "$@"
   ```
   `command -v node` پیدا می‌شه → هیچ بازنویسی‌ای نمی‌شه → `exec node` → `NODE_OPTIONS` اجرا می‌شه.
   (به همین دلیل `sh` هم Command امنیه.)

### فرم B — اگه نتونستی Environment Variable اضافه کنی

```
Command : sh
Args    : -c
          wget -qO- https://raw.githubusercontent.com/amiralitalebi551-sketch/arena/arena/01a09a53-arena/scripts/bootstrap.sh | sh
```

### فرم C — اگه فقط **یک** کادر Command داری (روی فاصله تکه‌تکه می‌شه)

```
sh -c wget$IFS-qO-$IFShttps://raw.githubusercontent.com/amiralitalebi551-sketch/arena/arena/01a09a53-arena/scripts/bootstrap.sh$IFS|$IFSsh
```

`$IFS` جانشین فاصله‌ست. زشت است، ولی زیر تفسیر «آرایه‌ی k8s» کار می‌کنه.

> **صادقانه:** semantics دقیق کادر Commandِ ClawCloud رو نتونستم از این سندباکس تست کنم
> (راهی به `console.run.claw.cloud` ندارم). فرم A اصلاً بهش وابسته نیست. اگه فرم B/C خطای
> `CreateContainerError` یا `exec format error` داد، لاگ کانتینر دقیق می‌گه چی شده و فرم A رو بذار.

### بعد از بالا اومدن چه اتفاقی می‌افته

1. لودر `scripts/bootstrap.mjs` رو می‌گیره و اجرا می‌کنه
2. `front.js` / `config.json` / `entrypoint.sh` از ریپو گرفته و **روی `/data` کش** می‌شن
3. `xray-core` دانلود و unzip می‌شه (یک بار؛ بعدش از `/data` → بوت ~۲ ثانیه)
4. کانفیگ از env رندر و با `xray -test` اعتبارسنجی می‌شه
5. سوپروایزر xray (با backoff) + روتر `front.js` بالا میان

لاگ کانتینر باید این خط‌ها رو نشون بده:

```
[boot] server files ready
[boot] xray vXX.X.X from Xray-linux-64.zip (NN.N MB)
[boot] supervisor started (pid N)
[entrypoint] config OK
[front] plain  listening on 0.0.0.0:80 -> ws path /cf5d72f32b82 -> xray 127.0.0.1:2087
[front] egress ip = <IP خروجی تو>
```

اون `<IP خروجی تو>` همون چیزیه که سایت‌ها می‌بینن. **هر ۱۵ دقیقه** نمونه‌برداری می‌شه و
اگه عوض بشه لاگ می‌زنه `!!! EGRESS IP CHANGED`.

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
