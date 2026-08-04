# WebSockets (Socket.IO)

## Arquitectura

- Socket.IO corre sobre el servidor Express (puerto interno **4001**).
- El frontend Next.js (standalone, puerto 4000) **no puede reenviar upgrades WebSocket**
  mediante `rewrites()`. Los paquetes `/socket.io/*` se proxean por HTTP normal,
  por lo que Socket.IO **cae automáticamente a long-polling** cuando la conexión pasa
  por el rewrite de Next.js.

> Long-polling funciona de forma transparente (mismo protocolo Socket.IO), solo con
> algo más de latencia y carga por request. No es un fallo, pero sí es mejorable.

## Opción A (recomendada): WebSocket directo vía Cloudflare Tunnel

1. En `docker-compose.yml` el servicio `web` ya publica el puerto **4001:4001**
   (API + WebSockets directos).
2. En el panel de Cloudflare Zero Trust → tu túnel → Public Hostname,
   añade una regla de ingreso para `/socket.io` que apunte a
   `http://gremio-web-app:4001` (o `localhost:4001` si configuras el túnel en modo
   local con config file).
3. Con esa regla, los clientes negocian el upgrade WebSocket contra el backend
   directo y se usa transporte `websocket` real.

> ⚠️ Exponer 4001 en el host abre la API fuera del túnel. Si no quieres eso,
> elimina la línea `4001:4001` del compose (long-polling sigue funcionando).

## Opción B: dejar long-polling

Sin cambios de configuración. El cliente de Socket.IO ya incluye long-polling como
fallback nativo; la app funciona igual.

## Variables relevantes

| Variable | Descripción |
|---|---|
| `FRONTEND_URL` | Origen permitido en CORS del socket (tu dominio público). |
| `TRUST_PROXY` | `1` (default en producción) para leer la IP real del cliente detrás del túnel. |

## Rate limiting

El servidor limita mensajes a 10 por 5 segundos por usuario
(`createSocketRateLimiter` en `backend/src/websocket/socket.server.ts`).
