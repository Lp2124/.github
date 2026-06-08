import type { CardBrand } from './card-brand';

export type SupportedCardBrand = Exclude<CardBrand, 'unknown'>;

export interface IinRangeDefinition {
  readonly brand: SupportedCardBrand;
  readonly label: string;
  readonly prefixLength: number;
  readonly minimum: number;
  readonly maximum: number;
}

export type IinClassification =
  | { readonly status: 'empty'; readonly normalized: '' }
  | { readonly status: 'invalid'; readonly normalized: string; readonly message: string }
  | { readonly status: 'unknown'; readonly normalized: string }
  | {
      readonly status: 'matched';
      readonly normalized: string;
      readonly brand: SupportedCardBrand;
      readonly range: string;
      readonly matchedPrefixLength: number;
    };

const IIN_RANGES: readonly IinRangeDefinition[] = [
  { brand: 'discover', label: '622126–622925', prefixLength: 6, minimum: 622126, maximum: 622925 },
  { brand: 'mastercard', label: '2221–2720', prefixLength: 4, minimum: 2221, maximum: 2720 },
  { brand: 'discover', label: '6011', prefixLength: 4, minimum: 6011, maximum: 6011 },
  { brand: 'discover', label: '644–649', prefixLength: 3, minimum: 644, maximum: 649 },
  { brand: 'amex', label: '34', prefixLength: 2, minimum: 34, maximum: 34 },
  { brand: 'amex', label: '37', prefixLength: 2, minimum: 37, maximum: 37 },
  { brand: 'mastercard', label: '51–55', prefixLength: 2, minimum: 51, maximum: 55 },
  { brand: 'discover', label: '65', prefixLength: 2, minimum: 65, maximum: 65 },
  { brand: 'visa', label: '4', prefixLength: 1, minimum: 4, maximum: 4 }
];

export function normalizeIin(input: string): string {
  return input.replace(/[\s-]/g, '');
}

export function classifyIin(input: string): IinClassification {
  const normalized = normalizeIin(input);

  if (normalized.length === 0) return { status: 'empty', normalized: '' };
  if (!/^\d+$/.test(normalized)) {
    return { status: 'invalid', normalized, message: 'Usa únicamente dígitos, espacios o guiones.' };
  }
  if (normalized.length > 8) {
    return { status: 'invalid', normalized, message: 'Introduce solo los primeros 6 a 8 dígitos, nunca el PAN completo.' };
  }

  for (const range of IIN_RANGES) {
    if (normalized.length < range.prefixLength) continue;
    const prefix = Number(normalized.slice(0, range.prefixLength));
    if (prefix >= range.minimum && prefix <= range.maximum) {
      return {
        status: 'matched',
        normalized,
        brand: range.brand,
        range: range.label,
        matchedPrefixLength: range.prefixLength
      };
    }
  }

  return { status: 'unknown', normalized };
}
