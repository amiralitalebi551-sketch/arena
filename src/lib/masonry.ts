/**
 * الگوریتم چیدمان Masonry سفارشی (نه CSS grid/columns ساده).
 *
 * مسئله: CSS columns آیتم‌ها را ستون‌به‌ستون پر می‌کند (ترتیب عمودی غلط)، و
 * CSS grid ارتفاع‌های متفاوت را متوازن نمی‌کند → فضای خالی و ناهماهنگی بصری.
 *
 * راه‌حل (اصل Gestalt/continuity): هر آیتم را به‌ترتیب به «کوتاه‌ترین ستون
 * فعلی» تخصیص می‌دهیم (greedy shortest-column). نتیجه: ستون‌هایی با ارتفاع
 * تقریباً برابر و لبه‌ی پایینی متوازن → آرامش بصری و پیوستگی.
 *
 * خروجی: برای هر آیتم، شماره‌ی ستونش را برمی‌گرداند.
 */
export function computeMasonry(
  heights: number[],
  columnCount: number
): number[] {
  const columnHeights = new Array(columnCount).fill(0);
  const assignment: number[] = [];

  for (let i = 0; i < heights.length; i++) {
    // کوتاه‌ترین ستون فعلی را پیدا کن
    let shortest = 0;
    for (let c = 1; c < columnCount; c++) {
      if (columnHeights[c] < columnHeights[shortest]) shortest = c;
    }
    assignment[i] = shortest;
    columnHeights[shortest] += heights[i];
  }
  return assignment;
}

/** تعداد ستون مناسب بر اساس عرض (شکست‌های ریسپانسیو). */
export function columnsForWidth(width: number): number {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  return 3;
}
