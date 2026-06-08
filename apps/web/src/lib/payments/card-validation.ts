import { detectCardBrand, getCardBrandDefinition, type CardBrand } from './card-brand';

export type CardValidationError =
  | { readonly code: 'EMPTY'; readonly message: string }
  | { readonly code: 'INVALID_CHARACTERS'; readonly message: string }
  | { readonly code: 'UNSUPPORTED_BRAND'; readonly message: string }
  | { readonly code: 'INVALID_LENGTH'; readonly message: string; readonly expected: readonly number[] }
  | { readonly code: 'INVALID_CHECKSUM'; readonly message: string };

export type ValidationResult =
  | { readonly valid: true; readonly normalized: string; readonly brand: Exclude<CardBrand, 'unknown'>; readonly error: null }
  | { readonly valid: false; readonly normalized: string; readonly brand: CardBrand; readonly error: CardValidationError };

export function normalizeCardNumber(input: string): string {
  return input.replace(/[\s-]/g, '');
}

export function validateLuhn(cardNumber: string): boolean {
  const normalized = normalizeCardNumber(cardNumber);
  if (!/^\d+$/.test(normalized)) return false;

  let sum = 0;
  let doubleDigit = false;
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    let digit = Number(normalized[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return normalized.length > 0 && sum % 10 === 0;
}

export function validateCardInput(input: string): ValidationResult {
  const normalized = normalizeCardNumber(input);
  if (normalized.length === 0) {
    return { valid: false, normalized, brand: 'unknown', error: { code: 'EMPTY', message: 'Ingresa un número de tarjeta.' } };
  }
  if (!/^\d+$/.test(normalized)) {
    return { valid: false, normalized, brand: 'unknown', error: { code: 'INVALID_CHARACTERS', message: 'Solo se permiten números, espacios y guiones.' } };
  }

  const brand = detectCardBrand(normalized);
  const definition = getCardBrandDefinition(brand);
  if (!definition) {
    return { valid: false, normalized, brand, error: { code: 'UNSUPPORTED_BRAND', message: 'La marca de tarjeta no es compatible.' } };
  }
  if (!definition.lengths.includes(normalized.length)) {
    return {
      valid: false,
      normalized,
      brand,
      error: { code: 'INVALID_LENGTH', message: `Longitud inválida para ${brand}.`, expected: definition.lengths }
    };
  }
  if (!validateLuhn(normalized)) {
    return { valid: false, normalized, brand, error: { code: 'INVALID_CHECKSUM', message: 'El número no supera la validación de formato.' } };
  }

  return { valid: true, normalized, brand: definition.brand, error: null };
}
