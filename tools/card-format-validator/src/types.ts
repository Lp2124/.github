export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export type CardValidationErrorCode =
  | "empty"
  | "invalid_characters"
  | "unknown_brand"
  | "invalid_length"
  | "luhn_failed";

export interface CardValidationError {
  readonly code: CardValidationErrorCode;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly brand: CardBrand;
  readonly normalized: string;
  readonly masked: string;
  readonly errors: readonly CardValidationError[];
}
