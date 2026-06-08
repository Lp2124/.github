import { detectCardBrand, getCardBrandDefinition } from './card-brand';
import { normalizeCardNumber } from './card-validation';

export function formatCardNumber(cardNumber: string): string {
  const digits = normalizeCardNumber(cardNumber).replace(/\D/g, '').slice(0, 19);
  const definition = getCardBrandDefinition(detectCardBrand(digits));
  const grouping = definition?.grouping ?? [4, 4, 4, 4, 3];
  const groups: string[] = [];
  let offset = 0;
  for (const size of grouping) {
    if (offset >= digits.length) break;
    groups.push(digits.slice(offset, offset + size));
    offset += size;
  }
  return groups.join(' ');
}

export function maskCardNumber(cardNumber: string): string {
  const digits = normalizeCardNumber(cardNumber).replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `${'•'.repeat(digits.length - 4)}${digits.slice(-4)}`.replace(/(.{4})(?=.)/g, '$1 ').trim();
}
