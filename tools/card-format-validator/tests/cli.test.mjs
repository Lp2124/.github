import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const runCli = (...args) =>
  spawnSync(process.execPath, ["dist/cli.js", ...args], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });

test("prints help without requiring Liora or Next.js", () => {
  const result = runCli("--help");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /completamente|local|offline|No realiza conexiones de red/i);
});

test("validates one synthetic number and never echoes the full input", () => {
  const testNumber = "4242424242424242";
  const result = runCli("validate", testNumber);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Formato: válido/);
  assert.match(result.stdout, /4242/);
  assert.equal(result.stdout.includes(testNumber), false);
  assert.equal(result.stderr, "");
});

test("uses a distinct exit code for invalid format", () => {
  const result = runCli("validate", "4242424242424241");
  assert.equal(result.status, 2);
  assert.match(result.stdout, /Formato: inválido/);
});

test("rejects multiple-number and unsupported command invocations", () => {
  assert.equal(runCli("validate", "4242424242424242", "5555555555554444").status, 1);
  assert.equal(runCli("batch", "4242424242424242").status, 1);
});
