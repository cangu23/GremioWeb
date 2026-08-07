# WebSockets (Socket.IO)

## Arquitectura

- Socket.IO corre sobre el servidor Express (backend).
- El frontend Next.js standalone **no puede reenviar upgrades WebSocket** mediante
  `rewrites()` de `next.config.mjs` (limitación conocida de Next.js). Además, en el
  monolito el rewrite `/socket.io/:path* → 127.0.0.1:4001` rompe incluso el fallback
  de long-polling con un redirect 308 de trailing-slash → el chat queda siempre en
  "desconectado".

## Configuración RECOMENDADA: backend API-only + frontend separado (Render)

Cuando el frontend se despliega como servicio independiente (ej.
`gremio-frontend.onrender.com`) y el backend como otro servicio (`gremio-web.onrender.com`):

1. **Backend en modo API-only**: define `RUN_BACKEND_ONLY=1` en el servicio backend.
   `start.sh` arranca Express + Socket.IO en el puerto público de Render, sin Next.js
   en medio. Así el cliente conecta el WebSocket directo al backend.

2. **Frontend separado**: en el build del frontend configura
   `NEXT_PUBLIC_API_BASE_URL=https://gremio-web.onrender.com/api` y
   `NEXT_PUBLIC_SOCKET_URL=https://gremio-web.onrender.com` (sin `/api`, sin barra final).
   Ambas se inlayan en el bundle, así que van como **Build Args** en Render/Docker.

3. **CORS del backend**: `FRONTEND_URL` (o `ALLOWED_ORIGINS`, separado por comas)
   debe incluir el dominio del frontend, ej. `https://gremio-frontend.onrender.com`.
   Sin esto el handshake del socket es bloqueado (y la API también).

El cliente de Socket.IO resuelve la URL en este orden:
`NEXT_PUBLIC_SOCKET_URL` → derivada de `NEXT_PUBLIC_API_BASE_URL` (quita `/api`) →
misma origin de la página (funciona en el monolito con rewrite, y en dev con el proxy).

## Monolito (sin separar servicios)

Si frontend y backend corren en el mismo contenedor (Next.js en `$PORT`, Express en 4001):
- Los **upgrades WebSocket no se proxean** por el rewrite (limitación de Next.js).
- El **polling** puede funcionar si el rewrite está bien formado, pero es frágil
  (el redirect 308 de trailing-slash lo rompe si el cliente pide `/socket.io/`).
- La opción robusta es exponer 4001 directamente (Cloudflare Tunnel / puerto)
  y apuntar el cliente ahí con `NEXT_PUBLIC_SOCKET_URL`.

## Variables relevantes

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SOCKET_URL` | Host del backend para Socket.IO (sin `/api`). Se inlaya en el build. |
| `NEXT_PUBLIC_API_BASE_URL` | Base de la API REST. También usada para derivar el socket si falta la anterior. |
| `FRONTEND_URL` | Origen permitido en CORS del socket/API (dominio del frontend). |
| `ALLOWED_ORIGINS` | Lista extra de orígenes CORS (comas). |
| `RUN_BACKEND_ONLY` | `1` → backend solo en el puerto público (API + Socket.IO directos). |
| `TRUST_PROXY` | `1` (default en producción) para leer la IP real del cliente detrás del proxy. |

## Rate limiting

El servidor limita mensajes a 10 por 5 segundos por usuario
(`createSocketRateLimiter` en `backend/src/websocket/socket.server.ts`).
