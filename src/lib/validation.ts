/**
 * اعتبارسنجی ورودی سبک و بدون وابستگی برای فرم‌های سمت کلاینت.
 * چون سایت استاتیک است و بک‌اندی وجود ندارد، این لایه فقط برای UX و
 * دفاع عمقی است؛ هنگام اتصال به API واقعی، اعتبارسنجی سمت سرور نیز الزامی
 * است (هرگز فقط به اعتبارسنجی کلاینت اعتماد نکنید).
 */

// حداکثر طول ایمیل طبق RFC 5321 (۲۵۴ کاراکتر). محدودیت طول از ورودی‌های
// بدخواهانه‌ی غول‌آسا و هر ریسک ReDoS احتمالی جلوگیری می‌کند.
const MAX_EMAIL_LENGTH = 254;

// الگوی محافظه‌کارانه و بدون backtracking فاجعه‌بار.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export interface ValidationResult {
  valid: boolean;
  value: string;
  error?: string;
}

export function validateEmail(raw: string): ValidationResult {
  const value = raw.trim();
  if (value.length === 0) {
    return { valid: false, value, error: "لطفاً ایمیل خود را وارد کنید." };
  }
  if (value.length > MAX_EMAIL_LENGTH) {
    return { valid: false, value, error: "ایمیل بیش از حد طولانی است." };
  }
  if (!EMAIL_RE.test(value)) {
    return { valid: false, value, error: "لطفاً یک ایمیل معتبر وارد کنید." };
  }
  return { valid: true, value };
}
