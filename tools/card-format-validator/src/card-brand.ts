import type { CardBrand } from "./types.js";

const isInRange = (value: number, minimum: number, maximum: number): boolean =>
  value >= minimum && value <= maximum;

export function detectCardBrand(cardNumber: string): CardBrand {
  if (cardNumber.startsWith("4")) {
    return "visa";
  }

  const firstTwo = Number(cardNumber.slice(0, 2));
  const firstFour = Number(cardNumber.slice(0, 4));
  if (isInRange(firstTwo, 51, 55) || isInRange(firstFour, 2221, 2720)) {
    return "mastercard";
  }

  if (cardNumber.startsWith("34") || cardNumber.startsWith("37")) {
    return "amex";
  }

  const firstThree = Number(cardNumber.slice(0, 3));
  const firstSix = Number(cardNumber.slice(0, 6));
  if (
    cardNumber.startsWith("6011") ||
    cardNumber.startsWith("65") ||
    isInRange(firstThree, 644, 649) ||
    isInRange(firstSix, 622126, 622925)
  ) {
    return "discover";
  }

  return "unknown";
}

export function getAllowedLengths(brand: CardBrand): readonly number[] {
  switch (brand) {
    case "visa":
      return [13, 16, 19];
    case "mastercard":
      return [16];
    case "amex":
      return [15];
    case "discover":
      return [16, 17, 18, 19];
    case "unknown":
      return [];
  }
}
