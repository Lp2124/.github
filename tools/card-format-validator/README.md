# Card Format Validator CLI

Herramienta educativa **independiente de Liora, Next.js, React, Stripe y `apps/web`** para validar localmente el formato de un único número sintético de prueba.

## Límites de seguridad

Esta utilidad:

- normaliza espacios y guiones;
- detecta aproximadamente Visa, Mastercard, American Express y Discover por prefijos públicos;
- comprueba longitud y el dígito de control Luhn;
- muestra únicamente el número enmascarado;
- funciona sin base de datos, pasarela de pago ni conexiones de red;
- no tiene modo por lotes ni automatiza intentos.

Luhn solo comprueba coherencia matemática. **No valida** CVV, fecha contra un emisor, saldo, banco, titular, existencia, actividad ni posibilidad de cobro. No se deben introducir PAN reales. Un argumento de terminal puede quedar guardado en el historial del shell o ser visible temporalmente en la lista de procesos; usa exclusivamente números oficiales/sintéticos de prueba.

## Requisitos

- Linux, macOS o Windows
- Node.js 20.9 o posterior
- npm solo para compilar y ejecutar las pruebas de desarrollo

El ejecutable compilado no utiliza dependencias de runtime.

## Instalación y compilación independiente

Desde esta carpeta, sin usar los scripts del monorepo:

```bash
cd tools/card-format-validator
npm ci
npm run build
```

## Uso desde terminal

```bash
node dist/cli.js --help
node dist/cli.js explain
node dist/cli.js validate 4242424242424242
```

También puede enlazarse como comando local:

```bash
npm link
card-format-validator validate 4242424242424242
```

El comando devuelve `0` si el formato es válido, `2` si es inválido y `1` para errores de uso. Solo acepta un número por ejecución deliberadamente.

## Desarrollo y pruebas

```bash
npm run typecheck
npm test
```

Las pruebas usan únicamente `node:test`, se ejecutan offline una vez instaladas las dependencias de desarrollo y cubren marcas, Luhn, longitudes, caracteres inválidos, dígitos Unicode similares, enmascarado y la interfaz CLI.

## Arquitectura

```text
src/
├── card-brand.ts       # clasificación aproximada y longitudes
├── card-mask.ts        # formato visual y enmascarado
├── card-validation.ts  # normalización, Luhn y resultado agregado
├── cli.ts              # interfaz de terminal de un solo valor
├── index.ts            # API pública
└── types.ts            # contratos TypeScript estrictos
tests/
├── card-validation.test.mjs
└── cli.test.mjs
```

No importa código del monorepo, no lee variables de entorno de Liora y no requiere que `apps/web` exista.
