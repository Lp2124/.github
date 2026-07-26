# PRIVATE VEGAS CLUB

Base monorepo de Fase 1 para una plataforma privada de casino social con saldo virtual/play money sin valor real.

## Regla legal principal

Private Vegas Club opera exclusivamente con saldo virtual/play money sin valor real. No existen depósitos, retiros, premios reales, conversión a efectivo ni pasarela de pago.

Leyenda obligatoria en pantallas sensibles:

> Saldo virtual sin valor real.

## Stack de Fase 1

- Backend: Laravel API + Sanctum preparado
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Base de datos: MySQL
- Sistema objetivo: Kali Linux con bash

## Estructura

```text
backend/   Laravel API
frontend/  React + Vite + TypeScript + Tailwind
docs/      Documentación base
docker/    Carpetas base para fases futuras
```

## Backend local

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

## Frontend local

```bash
cd frontend
npm install
npm run dev
```

## Validación Fase 1

```bash
cd backend
composer validate
composer install
php artisan key:generate
php artisan config:clear
php artisan cache:clear
php artisan migrate
php artisan test

cd ../frontend
npm install
npm run build
npm run lint
npm run typecheck
```
