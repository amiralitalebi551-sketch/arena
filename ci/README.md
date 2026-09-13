# ci/ — اکشن‌های GitHub (چرا اینجان و چطور فعالشون کنی)

## چرا پوشه‌ی `ci/` و نه `.github/workflows/`؟

چون من **نتونستم** push کنم اونجا:

```
remote: refusing to allow a GitHub App to create or update workflow
        `.github/workflows/build-image.yml` without `workflows` permission
```

یعنی اپِ GitHub که این جلسه باهاش وصل شدم اجازه‌ی `workflows` نداره. خودِ ریپو public است
و push به بقیه‌ی فایل‌ها کار می‌کنه — فقط `.github/workflows/` قفله.

## راه ۱ (یک کلیک — پیشنهادی)

به اپ اجازه بده، بعد به من بگو تا بقیه‌ش رو خودم انجام بدم:

1. <https://github.com/settings/installations>
2. اپ مربوط به Arena → **Configure**
3. ریپوی `amiralitalebi551-sketch/arena` → **Repository permissions**
4. **Workflows** → بذار روی **Read and write** → **Save**

بعدش من این فایل‌ها رو به `.github/workflows/` منتقل می‌کنم، ایمیج رو روی
`ghcr.io` می‌سازم و هل می‌دم، تست کامل §5 رو روی رانر اجرا می‌کنم و نتیجه‌ی واقعی
رو بهت می‌دم.

## راه ۲ (دستی، بدون دادن هیچ اجازه‌ای)

توی وب‌سایت GitHub، برای هر فایلی که لازم داری:

**Code** → **Add file** → **Create new file** → توی کادر اسم تایپ کن
`.github/workflows/build-image.yml` (خودِ GitHub پوشه رو می‌سازه) →
محتوای `ci/build-image.yml` رو Paste کن → **Commit changes**.

اولویت‌ها:

| فایل | چی‌کار می‌کنه | واجب؟ |
|---|---|---|
| `build-image.yml` | ایمیج رو می‌سازه و به `ghcr.io` هل می‌ده | **آره** اگر مسیر ایمیج رو می‌خوای |
| `verify.yml` | پروتکل §5 رو روی رانر واقعی اجرا می‌کنه + تست اندپوینت واقعی | **آره** برای اثبات |
| `ip-monitor.yml` | هر ۳ ساعت IP و زنده‌بودن تونل رو چک و در `IP-LOG.md` ثبت می‌کنه | **آره** برای اثبات «IP ثابت» |
| `sync-worker.yml` | `worker.js` پنل BPB رو می‌آره توی ریپو | فقط برای Plan B |
| `deploy-worker.yml` | Plan B رو با توکن کلودفلر خودکار deploy می‌کنه | فقط برای Plan B |

> اگر هیچ‌کدوم رو فعال نکنی هم **هیچی خراب نیست**: مسیر بدون CI
> (ایمیج `node:22-alpine` + bootstrap) کامل کار می‌کنه و خودِ کانتینر
> با `/__verify` و `/__ip` همون تست‌ها رو انجام می‌ده.
> تفاوتش فقط اینه که **بیرون** از کانتینر هم کسی چکش نمی‌کنه.

## راه ۳ (بدون اکشن، بدون اجازه) — همان چیزی که الان کار می‌کنه

`DEPLOY-CLAWCLOUD.md` → مسیر B. هیچ رجیستری، هیچ بیلدی، هیچ اکشنی.
