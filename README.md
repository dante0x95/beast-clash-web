# Beast Clash — Web

Frontend de **Batalla de Monstruos**: una app para crear, editar y eliminar monstruos, enfrentarlos en batallas por turnos y ver cada pelea reproducida en una arena 2D con estética de juegos de pelea arcade de los 90.

- **App:** https://beast-clash-web.onrender.com
- **API:** https://beast-clash-api.onrender.com · [Swagger](https://beast-clash-api.onrender.com/docs) · [repo](https://github.com/dante0x95/beast-clash-API)

> La API corre en el plan gratuito de Render y se duerme tras un rato sin uso. La primera carga puede tardar entre 30 y 60 segundos; la app lo indica con un mensaje de "Waking up the server…".

---

## Funcionalidades

| Requisito | Dónde |
|---|---|
| Listar monstruos (paginado) | `/monsters` |
| Crear monstruo con nombre, vida, ataque, defensa, velocidad e imagen | `/monsters/new` (URL propia o galería de avatares) |
| Editar monstruo | `/monsters/:id/edit` |
| Eliminar monstruo (con confirmación) | `/monsters` |
| Crear batalla entre dos monstruos | `/battles/new`: selección P1/P2, vista previa del enfrentamiento y **FIGHT** |
| Ver el resultado de la batalla | `/battles/:id`: replay animado turno a turno |
| Historial con ganador y perdedor | `/battles` |
| Eliminar batalla (con confirmación) | `/battles` |

**Además del enunciado:**

- **Replay controlable:** Play/Pause, avance turno a turno, velocidad 1x/2x/4x, Skip al resultado y Restart.
- **Vista previa del enfrentamiento** antes de pelear: quién ataca primero y cuánto daño hace cada uno por golpe.
- **Overlays arcade:** `ROUND 1` → `FIGHT!`, `K.O.` y pantalla de ganador.
- **Accesibilidad:** navegación con teclado, diálogos nativos (`<dialog>`), cada turno se anuncia a lectores de pantalla y se respeta `prefers-reduced-motion`.
- **Responsive:** la arena escala en múltiplos enteros para mantener el pixel art nítido y se encoge para caber en pantallas de teléfono.

---

## Stack

| Pieza | Elección |
|---|---|
| Build | Vite 8 + `@vitejs/plugin-react` |
| UI | React 19, react-router 8 (modo data, rutas lazy) |
| Estado del servidor | TanStack Query 5 |
| Cliente HTTP | `openapi-fetch` con tipos generados por `openapi-typescript` desde el OpenAPI de la API |
| Validación de formularios | Zod 4 |
| Render de batalla | Pixi.js 8, usado de forma imperativa |
| Estilos | CSS plano con BEM y design tokens en variables CSS |
| Tipografía | Press Start 2P (`@fontsource`) |
| Lenguaje | TypeScript 6 estricto (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `erasableSyntaxOnly`…) |
| Tests | Vitest 5 (jsdom) + Testing Library |
| Calidad | ESLint (type-checked, `@stylistic`, perfectionist, unicorn, react-hooks), Husky, commitlint y GitHub Actions |

---

## Arquitectura

```
src/
├── api/            # cliente tipado, ApiError y schema.d.ts generado
├── app/            # rutas, layout y páginas de error / 404
├── shared/         # Pagination, ConfirmDialog, usePageParam
├── features/
│   ├── monsters/   # lista, formulario, galería de avatares, hooks de datos
│   └── battles/
│       ├── select/   # selección P1/P2 y vista previa del enfrentamiento
│       ├── replay/   # máquina de estados del replay (pura) y textos accesibles
│       ├── arena/    # puente React ↔ Pixi, escena, HUD, overlays y controles
│       └── history/  # historial y borrado
└── testing/        # setup de Vitest y helpers de render
```

El código está **organizado por feature**. Cada una tiene sus hooks de datos (`*.api.ts`), componentes, estilos y tests al lado.

### Contrato con la API

Los tipos de requests y respuestas se **generan del documento OpenAPI** de la API (`npm run api:types` → `src/api/schema.d.ts`, commiteado). Así, si el contrato cambia, el typecheck falla en lugar de romperse en runtime. Todos los hooks siguen el mismo patrón: si la respuesta trae `error` o viene sin `data`, lanzan un `ApiError` con el status y el mensaje de la API, y la UI decide cómo mostrarlo (por ejemplo, un 404 al borrar se trata como "ya estaba borrado").

### Replay: estado puro + escena imperativa

La batalla **no se recalcula en el cliente**. La API devuelve la batalla completa con todos sus turnos, y el front solo la reproduce.

- **`replay/replay.ts`** es un reducer puro y sin tiempo. Estados `idle | playing | paused | finished` y eventos `play`, `pause`, `step`, `skip`, `restart` y `setSpeed`. La vida de cada monstruo sale siempre de `defenderHpAfter` del API, nunca de restar `damage`. Las transiciones inválidas devuelven la misma referencia, así React no re-renderiza. Valida la batalla al crearla (turnos numerados, participantes válidos, último turno coherente con el ganador).
- **`arena/BattleScene.ts`**, **`BattleHud.ts`** y **`BattleOverlay.ts`** son clases Pixi imperativas. Dibujan en una resolución virtual de 480×270 y animan con un tween propio sobre el `Ticker` de Pixi.
- **`arena/BattleArena.tsx`** es el puente. Crea y destruye la `Application` de Pixi, carga fuentes y texturas, mantiene el reducer y orquesta la escena:
  - Las acciones que animan (`step`, `skip`, `restart`) se ejecutan **de a una**. Si se pide Skip o Restart en medio de un turno, se pausa el replay y la acción corre apenas termina la animación, sin cortar tweens a la mitad.
  - El `step` se confirma en el reducer **al terminar** la animación del turno, así React y Pixi nunca se desincronizan.
  - La velocidad usa `ticker.speed`: todas las animaciones corren sobre el mismo ticker, así que 1x/2x/4x no requiere tocar ninguna duración.

`@pixi/react` se descartó a propósito: la escena tiene poco estado, muchas animaciones encadenadas con `await` y un ciclo de vida que conviene controlar a mano.

### Vista previa del enfrentamiento

`select/matchup.ts` replica las reglas de la API (orden de ataque y daño) **solo para la vista previa**. La batalla real siempre la simula la API, que es la fuente de verdad.

### Imágenes

Los monstruos usan avatares de [DiceBear](https://www.dicebear.com/) (`bottts`), los mismos que los seeds de la API. Como esas URLs no terminan en `.svg`, Pixi no puede deducir el formato: `monster-texture.ts` elige el parser explícitamente y, si la imagen falla, la arena muestra un `?` en lugar de romperse.

---

## Reglas de batalla (definidas por la API)

- Ataca primero el monstruo de **mayor velocidad**; si empatan, el de **mayor ataque**; si empatan en todo, el **P1** (monstruo A).
- **Daño = ataque del atacante − defensa del defensor**, con mínimo 1.
- La batalla termina cuando la vida de uno llega a 0.

El detalle y las decisiones de interpretación están en el [README de la API](https://github.com/dante0x95/beast-clash-API).

---

## Correr en local

Requisitos: **Node 24** (ver `.node-version`) y la API corriendo en local o usando la de producción.

```bash
npm ci
cp .env.example .env.local   # VITE_API_URL=http://localhost:3001
npm run dev                  # http://localhost:5173
```

Si usas la API local, esta necesita permitir el origen del front en su `.env`:

```
CORS_ORIGINS=http://localhost:5173
```

### Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API, **sin barra final**. Se incrusta en el bundle al compilar: cambiarla exige volver a hacer el build. Si falta, la app falla al cargar con un error explícito. |

### Scripts

| Script | Qué hace |
|---|---|
| `dev` | Servidor de desarrollo de Vite |
| `build` | `tsc -b && vite build` |
| `preview` | Sirve el build local |
| `typecheck` | `tsc -b` |
| `lint` / `lint:fix` | ESLint |
| `test` / `test:watch` / `test:coverage` | Vitest |
| `api:types` | Regenera `src/api/schema.d.ts` desde el OpenAPI de producción |
| `release` | Versión, CHANGELOG y tag (commit-and-tag-version) |

---

## Tests

```bash
npm test
```

156 tests con Vitest + Testing Library:

- **Lógica pura:** reducer del replay, selección P1/P2, vista previa del enfrentamiento, textos accesibles del replay, formulario de monstruos y carga de texturas.
- **Páginas y componentes:** se renderizan con el router real (`createMemoryRouter`) y se mockea **solo el cliente HTTP**, no los hooks. Así se prueban juntos las rutas, los hooks de TanStack Query y los estados de carga, error y vacío. Se consulta por rol y nombre accesible.
- **Pixi no se testea en jsdom:** no hay WebGL. Los tests de página mockean `BattleArena`, y la lógica que sí importa (qué turno sigue, qué vida mostrar, cuándo termina) vive en el reducer puro, que tiene cobertura completa. Las animaciones se verificaron manualmente.

---

## Calidad y CI

- **Husky:** `pre-commit` (lint-staged), `commit-msg` (Conventional Commits con commitlint) y `pre-push` (typecheck + tests de lo cambiado).
- **GitHub Actions** en cada push y PR a `main`: typecheck → lint → tests → build.

---

## Deploy

**Render Static Site**, desde `main`:

| Ajuste | Valor |
|---|---|
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Variables | `VITE_API_URL=https://beast-clash-api.onrender.com`, `HUSKY=0` |
| Rewrite | `/*` → `/index.html` (necesario para que las rutas del SPA funcionen al recargar) |
| Headers | `/assets/*` → `Cache-Control: public, max-age=31536000, immutable` |

La API tiene configurado `CORS_ORIGINS=https://beast-clash-web.onrender.com`.

---

## Decisiones y límites conocidos

- **Sin CSS Modules:** sus tipos chocan con `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`. Se usa CSS plano con prefijos BEM por componente.
- **Paginación en la URL** (`?page=`), así que se puede compartir y sobrevive a recargar.
- **Selección de monstruos:** la pantalla de batalla carga hasta 100 monstruos en una sola request (el máximo de la API). Con más monstruos haría falta búsqueda o paginación en la grilla.
- **Reduced motion** se lee al montar la arena; si se cambia con una batalla abierta, aplica al recargar.
- **Por debajo de 480 px** la arena usa una escala no entera y el pixel art pierde algo de nitidez; se prefirió a obligar a hacer scroll horizontal.

### Pendientes

- Smoke test end-to-end con Playwright contra el deploy.
- Arte propio (fondos de arena, chispas de golpe, sprites) para reemplazar las formas geométricas y los avatares de DiceBear.
- Navegación con flechas en la grilla de selección (hoy funciona con Tab).