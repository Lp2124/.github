import assert from "node:assert/strict";
import test from "node:test";

import {
  detectCardBrand,
  maskCardNumber,
  normalizeCardNumber,
  validateCardInput,
  validateLuhn,
} from "../dist/index.js";

const OFFICIAL_TEST_NUMBERS = [
  ["4242 4242 4242 4242", "visa"],
  ["5555-5555-5555-4444", "mastercard"],
  ["378282246310005", "amex"],
  ["6011111111111117", "discover"],
];

test("normalizes supported visual separators", () => {
  assert.equal(normalizeCardNumber("4242 4242-4242 4242"), "4242424242424242");
});

test("validates official synthetic test numbers and detects their brands", () => {
  for (const [number, expectedBrand] of OFFICIAL_TEST_NUMBERS) {
    const result = validateCardInput(number);
    assert.equal(result.valid, true);
    assert.equal(result.brand, expectedBrand);
    assert.deepEqual(result.errors, []);
  }
});

test("rejects a failed Luhn check", () => {
  assert.equal(validateLuhn("4242424242424241"), false);
  assert.deepEqual(
    validateCardInput("4242424242424241").errors.map(({ code }) => code),
    ["luhn_failed"],
  );
});

test("rejects invalid characters instead of silently deleting them", () => {
  const result = validateCardInput("4242x4242");
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors.map(({ code }) => code), ["invalid_characters"]);
});

test("rejects Unicode lookalike digits", () => {
  assert.equal(validateCardInput("４２４２４２４２４２４２４２４２").valid, false);
});

test("reports empty, unknown-brand, and invalid-length inputs", () => {
  assert.deepEqual(validateCardInput("  ").errors.map(({ code }) => code), ["empty"]);
  assert.ok(validateCardInput("9999999999999995").errors.some(({ code }) => code === "unknown_brand"));
  assert.ok(validateCardInput("424242424242").errors.some(({ code }) => code === "invalid_length"));
});

test("detects Mastercard's two supported public prefix ranges", () => {
  assert.equal(detectCardBrand("5555555555554444"), "mastercard");
  assert.equal(detectCardBrand("2221000000000000"), "mastercard");
  assert.equal(detectCardBrand("2720990000000000"), "mastercard");
  assert.equal(detectCardBrand("2721000000000000"), "unknown");
});

test("masks every digit except the final four", () => {
  const masked = maskCardNumber("4242424242424242", "visa");
  assert.equal(masked, "•••• •••• •••• 4242");
  assert.equal(masked.includes("424242"), false);
});
