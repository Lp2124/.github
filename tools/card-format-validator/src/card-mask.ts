import type { CardBrand } from "./types.js";

const groupDigits = (value: string, sizes: readonly number[]): string => {
  const groups: string[] = [];
  let offset = 0;

  for (const size of sizes) {
    if (offset >= value.length) {
      break;
    }
    groups.push(value.slice(offset, offset + size));
    offset += size;
  }

  if (offset < value.length) {
    groups.push(value.slice(offset));
  }

  return groups.join(" ");
};

export function formatCardNumber(cardNumber: string, brand: CardBrand): string {
  return groupDigits(cardNumber, brand === "amex" ? [4, 6, 5] : [4, 4, 4, 4, 3]);
}

export function maskCardNumber(cardNumber: string, brand: CardBrand = "unknown"): string {
  if (cardNumber.length === 0) {
    return "";
  }

  const visibleDigits = Math.min(4, cardNumber.length);
  const masked = `${"•".repeat(cardNumber.length - visibleDigits)}${cardNumber.slice(-visibleDigits)}`;
  return formatCardNumber(masked, brand);
}
