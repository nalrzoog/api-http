// Arabic number-to-words, for the invoice "amount in words" line.
// Handles arbitrary totals (up to billions) — nothing here is specific to
// any one invoice amount.

const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const TEENS = [
  'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر',
  'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر',
];
const TENS = ['', '', 'عشرين', 'ثلاثين', 'أربعين', 'خمسين', 'ستين', 'سبعين', 'ثمانين', 'تسعين'];
const HUNDREDS = [
  '', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة',
  'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة',
];

/** Converts 0-999 to Arabic words. */
function threeDigitsToWords(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];

  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);

  if (rest > 0) {
    if (rest < 10) {
      parts.push(ONES[rest]);
    } else if (rest < 20) {
      parts.push(TEENS[rest - 10]);
    } else {
      const tens = Math.floor(rest / 10);
      const ones = rest % 10;
      if (ones > 0) parts.push(ONES[ones]);
      parts.push(TENS[tens]);
    }
  }

  return parts.join(' و');
}

/** Picks the grammatically-appropriate scale word (ألف/ألفان/آلاف, مليون/مليونان/ملايين, ...). */
function scaleWord(count: number, forms: { one: string; two: string; few: string; many: string }): string {
  if (count === 1) return forms.one;
  if (count === 2) return forms.two;
  if (count >= 3 && count <= 10) return `${threeDigitsToWords(count)} ${forms.few}`;
  return `${threeDigitsToWords(count)} ${forms.many}`;
}

const THOUSAND = { one: 'ألف', two: 'ألفان', few: 'آلاف', many: 'ألف' };
const MILLION = { one: 'مليون', two: 'مليونان', few: 'ملايين', many: 'مليون' };
const BILLION = { one: 'مليار', two: 'ملياران', few: 'مليارات', many: 'مليار' };

/** Converts a non-negative integer to Arabic words. */
export function integerToArabicWords(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n === 0) return 'صفر';

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const ones = n % 1_000;

  const parts: string[] = [];
  if (billions > 0) parts.push(scaleWord(billions, BILLION));
  if (millions > 0) parts.push(scaleWord(millions, MILLION));
  if (thousands > 0) parts.push(scaleWord(thousands, THOUSAND));
  if (ones > 0) parts.push(threeDigitsToWords(ones));

  return parts.join(' و');
}

/** "المجموع: ستة آلاف وثلاثمائة وخمسين ريال فقط" style line for any total. */
export function amountInWordsLine(total: number, currency = 'ريال'): string {
  const rounded = Math.round(total);
  const words = integerToArabicWords(rounded);
  return `المجموع: ${words} ${currency} فقط`;
}
