# finanzas — Control de Gastos Chile

App de finanzas personales conectada directamente a tu banco via Fintoc. Categorización automática con IA, presupuestos por categoría, resúmenes mensuales y proyecciones de gasto.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js v4 — credenciales + JWT |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Banco | Fintoc API — Open Banking Chile |
| Categorización IA | OpenRouter (google/gemma-3-27b-it) |
| Charts | Recharts |
| Animaciones | Framer Motion |
| Estilos | Tailwind CSS |
| Deploy | Vercel |

---

## APIs integradas

### Fintoc
Conexión directa con Santander Chile (y otros bancos compatibles). Obtiene cuentas y movimientos via REST API usando el `link_token` generado al conectar el banco.

- `GET /v1/accounts?link_token=...` — lista cuentas
- `GET /v1/accounts/{id}/movements?link_token=...` — movimientos

### OpenRouter (IA)
Enriquecimiento de transacciones: convierte descripciones crudas del banco (`COMPRA DEBITO 04/14 LIDER EXPRESS 00023`) en nombre de comercio limpio + categoría + tipo.

- Modelo: `google/gemma-3-27b-it:free`
- Batch de 20 transacciones por llamada para minimizar tokens
- Sistema híbrido: reglas locales para ~67% de transacciones chilenas conocidas, IA solo para el resto

---

## Funcionalidades

### Dashboard
- Balance, ingresos y gastos del mes actual
- Donut chart de gastos por categoría
- Line chart evolución mensual (últimos 6 meses)
- Últimas transacciones
- Proyección de gasto a fin de mes
- Alertas (día inusual, presupuesto cerca del límite, excedido)

### Transacciones
- Lista con filtros por categoría y búsqueda por texto
- Nombre limpio del comercio, monto, fecha e ícono de categoría
- Re-categorización manual

### Presupuestos
- Presupuesto mensual por categoría
- Barra de progreso con % gastado
- Alerta visual al superar el 80% o exceder el límite

### Recap mensual
- Comparativa con el mes anterior (ingresos, gastos, balance)
- Categoría con mayor gasto y su variación
- Gastos recurrentes detectados automáticamente
- Meta de ahorro mensual

### Ajustes
- Cuenta bancaria conectada
- Sincronización manual con Fintoc

---

## Estructura

```
/app
  /api
    /auth/register         — registro de usuarios
    /transactions          — CRUD transacciones + stats
    /fintoc/sync           — sincroniza movimientos desde Fintoc
    /fintoc/account        — info de cuenta bancaria
    /enrich                — enriquecimiento IA (20 txs por llamada)
    /budgets               — CRUD presupuestos
    /savings-goal          — meta de ahorro mensual
    /recap                 — resumen comparativo mensual
    /projection            — proyección de gasto
    /recurring             — gastos recurrentes
    /alerts                — alertas de gasto
  /(auth)
    /login
    /register
  /(dashboard)
    /page.tsx              — dashboard principal
    /transactions          — lista completa
    /budgets               — presupuestos
    /recap                 — resumen mensual
    /settings              — configuración

/components
  /dashboard               — StatsCard, DonutChart, LineChart, BudgetProgress, etc.
  /layout                  — TopHeader, BottomNav
  /transactions            — TransactionRow, CategoryBadge

/lib
  fintoc.ts                — cliente Fintoc API
  claude.ts                — cliente OpenRouter (enrichment)
  supabase.ts              — cliente Supabase + esquema SQL
  auth.ts                  — config NextAuth

/scripts
  enrich.mjs               — script standalone para enriquecer en batch

/types
  index.ts                 — todos los tipos TypeScript + CATEGORY_CONFIG
```

---

## Base de datos (Supabase)

```sql
users           — email, password_hash, name
accounts        — banco conectado via Fintoc
transactions    — movimientos con categoría, comercio, tipo
budgets         — presupuesto mensual por categoría
savings_goals   — meta de ahorro por mes (YYYY-MM)
```

RLS habilitado en todas las tablas. El script completo está en `lib/supabase.ts` → `SCHEMA_SQL`.

---

## Variables de entorno

```env
# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Fintoc
FINTOC_SECRET_KEY=
FINTOC_LINK_TOKEN=

# OpenRouter
OPENROUTER_API_KEY=
```

---

## Setup local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Completar valores en .env.local

# Correr en desarrollo
npm run dev
```

Luego ejecutar el SQL de `lib/supabase.ts → SCHEMA_SQL` en el SQL Editor de Supabase.

### Enriquecimiento de transacciones

Después de sincronizar el banco por primera vez:

```bash
node scripts/enrich.mjs
```

Procesa las transacciones sin categorizar usando reglas locales + IA. Requiere `OPENROUTER_API_KEY` en `.env.local`.

---

## Deploy (Vercel)

1. Conectar repo en [vercel.com](https://vercel.com)
2. Agregar todas las variables de entorno en el dashboard de Vercel
3. Deploy automático en cada push a `master`

---

## Diseño

- Tema oscuro: fondo `#0A0A0A`, cards `#1A1A1A`, acento `#00D084`
- Tipografía: Syne (UI) + DM Mono (números)
- Mobile-first con safe-area insets para iOS/Android
- Navegación inferior fija en mobile
