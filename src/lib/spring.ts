/**
 * موتور اسپرینگ فیزیک-محور سفارشی (spring-damper) — بدون کتابخانه.
 *
 * چرا؟ CSS transition و easing از پیش‌تعریف‌شده حرکت «مکانیکی» می‌دهند: زمان
 * ثابت، شتاب ثابت. حرکت طبیعی (چیزی که مغز انسان «زنده» می‌فهمد) از فیزیک
 * فنر پیروی می‌کند: شتاب متناسب با فاصله تا هدف، میرایی متناسب با سرعت.
 *
 * معادله‌ی حرکت فنر میراشده:
 *   a = (-stiffness * (x - target) - damping * v) / mass
 * که با انتگرال‌گیری نیمه‌ضمنی (semi-implicit Euler) و گام زمانی ثابت حل
 * می‌شود تا مستقل از نرخ فریم و پایدار بماند.
 *
 * پارامترها:
 *  - stiffness: سفتی فنر. بالاتر = واکنش سریع‌تر و تندتر.
 *  - damping:   میرایی. بالاتر = نوسان کمتر، توقف نرم‌تر.
 *  - mass:      جرم. بالاتر = حرکت سنگین‌تر و کندتر.
 */

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  /** آستانه‌ی توقف: وقتی هم فاصله و هم سرعت زیر این مقدار باشند، به هدف snap می‌شود. */
  rest?: number;
}

export interface SpringState {
  value: number;
  velocity: number;
  target: number;
}

// گام زمانی ثابت شبیه‌سازی (۱۶.۶۷ms = ۶۰fps). گام ثابت پایداری عددی می‌دهد.
const FIXED_DT = 1 / 60;

export function createSpring(initial: number): SpringState {
  return { value: initial, velocity: 0, target: initial };
}

/**
 * یک اسپرینگ را به‌اندازه‌ی dt ثانیه جلو می‌برد. dt واقعی به گام‌های ثابت
 * شکسته می‌شود تا صرف‌نظر از افت فریم، رفتار فنر یکسان بماند (frame-rate independent).
 * خروجی: true اگر هنوز در حرکت است، false اگر به سکون رسیده.
 */
export function stepSpring(
  s: SpringState,
  dt: number,
  cfg: SpringConfig
): boolean {
  const rest = cfg.rest ?? 0.001;
  // محدودسازی dt تا در تب‌های پس‌زمینه پرش نکند
  let remaining = Math.min(dt, 0.064);

  while (remaining > 0) {
    const step = Math.min(remaining, FIXED_DT);
    remaining -= step;

    const displacement = s.value - s.target;
    const springForce = -cfg.stiffness * displacement;
    const dampingForce = -cfg.damping * s.velocity;
    const acceleration = (springForce + dampingForce) / cfg.mass;

    // semi-implicit Euler: اول سرعت، بعد موقعیت
    s.velocity += acceleration * step;
    s.value += s.velocity * step;
  }

  // شرط سکون: هم به هدف نزدیک، هم تقریباً بی‌حرکت
  if (Math.abs(s.value - s.target) < rest && Math.abs(s.velocity) < rest) {
    s.value = s.target;
    s.velocity = 0;
    return false;
  }
  return true;
}

/** پیش‌تنظیم‌های معنادار — نامشان کاربردشان را می‌گوید. */
export const SPRINGS = {
  // برای دنبال‌کردن اشاره‌گر: سریع ولی نرم
  pointer: { stiffness: 170, damping: 22, mass: 1 } as SpringConfig,
  // برای دکمه‌های مغناطیسی: کمی کش‌دار و بازگشتی
  magnetic: { stiffness: 260, damping: 18, mass: 1 } as SpringConfig,
  // برای ظاهرشدن عناصر: نرم و با کمی momentum
  reveal: { stiffness: 120, damping: 20, mass: 1 } as SpringConfig,
  // برای واکنش‌های ریز و تیز (press)
  snappy: { stiffness: 400, damping: 30, mass: 1 } as SpringConfig,
};
