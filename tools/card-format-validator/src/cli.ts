#!/usr/bin/env node

import { validateCardInput } from "./card-validation.js";

const HELP = `Validador local de formato de tarjetas (educativo)

Uso:
  card-format-validator validate <numero-de-prueba>
  card-format-validator explain
  card-format-validator --help

Seguridad:
  Usa exclusivamente números sintéticos/oficiales de prueba.
  No introduzcas PAN reales. Los argumentos pueden quedar en el historial del shell.
  La herramienta no valida CVV, saldo, banco, titular, estado ni actividad.
  No realiza conexiones de red, transacciones ni intentos automatizados.`;

const EXPLANATION = `Luhn recorre los dígitos de derecha a izquierda. Duplica uno de cada dos,
resta 9 cuando el resultado supera 9 y suma todo. Si la suma es múltiplo
de 10, el dígito de control es matemáticamente coherente. Esto solo valida
formato: no demuestra que una tarjeta exista, esté activa o tenga saldo.`;

const brandLabel = (brand: string): string =>
  brand === "unknown" ? "desconocida" : brand;

export function run(args: readonly string[]): number {
  const [command, ...values] = args;

  if (command === undefined || command === "--help" || command === "-h") {
    console.log(HELP);
    return 0;
  }

  if (command === "explain") {
    if (values.length !== 0) {
      console.error("El comando explain no acepta argumentos.");
      return 1;
    }
    console.log(EXPLANATION);
    return 0;
  }

  if (command !== "validate" || values.length !== 1) {
    console.error("Uso inválido. Ejecuta --help para ver la sintaxis permitida.");
    return 1;
  }

  const result = validateCardInput(values[0] ?? "");
  console.log(`Número: ${result.masked || "(vacío)"}`);
  console.log(`Marca aproximada: ${brandLabel(result.brand)}`);
  console.log(`Formato: ${result.valid ? "válido" : "inválido"}`);

  for (const error of result.errors) {
    console.log(`- ${error.message}`);
  }

  console.log("Resultado exclusivamente sintáctico; no confirma estado, CVV ni fondos.");
  return result.valid ? 0 : 2;
}

process.exitCode = run(process.argv.slice(2));
