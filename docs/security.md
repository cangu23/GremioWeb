# Seguridad — Notas de producción

## Fail-fast en producción

El backend **se niega a arrancar** en `NODE_ENV=production` cuando:

1. `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` faltan, tienen < 32 caracteres o usan
   los valores de desarrollo/plantilla (ver `backend/src/config/env.ts`).
   > Genera secretos con:
   > `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
2. `DATABASE_URL` falta (evita el fallback silencioso a SQLite, que causaría
   pérdida de datos) — ver `backend/src/database/prisma.ts`.
3. `start.sh` no logra sincronizar la base de datos tras 5 intentos — sale con
   error en lugar de arrancar contra un esquema roto.

## Media Engine (servicio Python)

- Los endpoints `/internal/*` exigen el header `X-Internal-Token` con el valor de
  `MEDIA_ENGINE_TOKEN` (si el token está configurado). El backend lo envía
  automáticamente desde `backend/src/lib/media-engine.ts`.
- `R2_PUBLIC_URL` es obligatoria para subir imágenes; si falta, el engine responde
  error claro en lugar de generar URLs rotas.

## Trust proxy y rate limiting

- `app.set('trust proxy', 1)` solo se activa en producción (o si `TRUST_PROXY=1`).
- ⚠️ Si el puerto de la API está expuesto **directamente** a internet (sin
  Cloudflare/Render delante), pon `TRUST_PROXY=0`: de lo contrario un atacante
  puede falsificar `X-Forwarded-For` y saltarse los rate limiters por IP.

## Credenciales de seed

- `backend/src/scripts/seed-admin.ts` ya no usa la contraseña por defecto
  `Admin123!`. Usa `SEED_ADMIN_PASSWORD`; si no se define, genera una aleatoria
  (se imprime una sola vez). Ejecútalo solo en entornos de bootstrap, nunca en
  producción.

## Webhook de PayPal

- La entrega de beneficios (planes, Stardust, donaciones) se confirma por dos
  vías: la captura vía callback del navegador (`POST /api/payments/paypal/capture-order`)
  y el webhook `POST /api/payments/paypal/webhook` (evento `PAYMENT.CAPTURE.COMPLETED`).
- El webhook es **público** pero verifica la firma de PayPal (cabeceras de
transmisión + certificado) y correlaciona el evento con la intención de pago
guardada mediante `resource.custom_id`. Sin `PAYPAL_WEBHOOK_ID` configurado
devuelve 503 (PayPal reintenta) — no procesa nada en modo fail-closed.
- Idempotencia: la intención de pago (`PAYPAL_PENDING:...`) se marca como
  `PAYPAL_COMPLETED:...` atómicamente antes de entregar beneficios; un
  reintento (captura duplicada o webhook repetido) se rechaza con 409 y nunca
  entrega beneficios dos veces.
- Configura la URL del webhook en el panel de PayPal:
  `https://TU_DOMINIO/api/payments/paypal/webhook`

## Uploads locales

- Si Cloudinary y el Media Engine fallan, las imágenes se guardan en disco local
  (`backend/uploads`). En Docker ese directorio se persiste con el volumen
  `web_uploads` (ver `docker-compose.yml`).

## Checklist de variables (producción)

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — aleatorios, ≥ 32 chars.
- `FRONTEND_URL` — tu dominio público.
- `DATABASE_URL` — PostgreSQL (obligatorio en producción).
- `MEDIA_ENGINE_TOKEN` — mismo valor en backend y media-engine.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — como build arg en el Dockerfile.
- Credenciales Cloudinary / R2.
