import { detectCardBrand, getAllowedLengths } from "./card-brand.js";
import { maskCardNumber } from "./card-mask.js";
import type { CardValidationError, ValidationResult } from "./types.js";

const SEPARATOR_PATTERN = /[\s-]/gu;
const ASCII_DIGITS_PATTERN = /^\d+$/u;

export function normalizeCardNumber(input: string): string {
  return input.replace(SEPARATOR_PATTERN, "");
}

export function validateLuhn(cardNumber: string): boolean {
  if (!ASCII_DIGITS_PATTERN.test(cardNumber)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
    const character = cardNumber[index];
    if (character === undefined) {
      return false;
    }

    let digit = Number(character);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function validateCardInput(input: string): ValidationResult {
  const normalized = normalizeCardNumber(input);
  const brand = detectCardBrand(normalized);
  const errors: CardValidationError[] = [];

  if (normalized.length === 0) {
    errors.push({ code: "empty", message: "Introduce un número de prueba." });
  } else if (!ASCII_DIGITS_PATTERN.test(normalized)) {
    errors.push({
      code: "invalid_characters",
      message: "Solo se permiten dígitos, espacios y guiones.",
    });
  } else {
    if (brand === "unknown") {
      errors.push({
        code: "unknown_brand",
        message: "El prefijo no coincide con una marca compatible.",
      });
    } else if (!getAllowedLengths(brand).includes(normalized.length)) {
      errors.push({
        code: "invalid_length",
        message: `La longitud no es válida para ${brand}.`,
      });
    }

    if (!validateLuhn(normalized)) {
      errors.push({
        code: "luhn_failed",
        message: "El dígito de control no supera el algoritmo de Luhn.",
      });
    }
  }

  return {
    valid: errors.length === 0,
    brand,
    normalized,
    masked: maskCardNumber(normalized, brand),
    errors,
  };
}
