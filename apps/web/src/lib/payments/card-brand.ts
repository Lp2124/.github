export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

export interface CardBrandDefinition {
  readonly brand: Exclude<CardBrand, 'unknown'>;
  readonly lengths: readonly number[];
  readonly grouping: readonly number[];
}

const DEFINITIONS: readonly CardBrandDefinition[] = [
  { brand: 'amex', lengths: [15], grouping: [4, 6, 5] },
  { brand: 'mastercard', lengths: [16], grouping: [4, 4, 4, 4] },
  { brand: 'discover', lengths: [16, 19], grouping: [4, 4, 4, 4, 3] },
  { brand: 'visa', lengths: [13, 16, 19], grouping: [4, 4, 4, 4, 3] }
];

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, '');

  if (/^3[47]/.test(digits)) return 'amex';
  if (/^(5[1-5]|2(?:2(?:2[1-9]|[3-9]\d)|[3-6]\d{2}|7(?:0\d|1\d|20)))/.test(digits)) {
    return 'mastercard';
  }
  if (/^(6011|65|64[4-9]|622(?:12[6-9]|1[3-9]\d|[2-8]\d{2}|9(?:[01]\d|2[0-5])))/.test(digits)) {
    return 'discover';
  }
  if (/^4/.test(digits)) return 'visa';

  return 'unknown';
}

export function getCardBrandDefinition(brand: CardBrand): CardBrandDefinition | undefined {
  return DEFINITIONS.find((definition) => definition.brand === brand);
}
