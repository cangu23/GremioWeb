# 🌟 Gremio Estelar

La plataforma web pensada para VTubers (creadores de contenido virtual). Una comunidad digital con perfiles de VTubers, roles, eventos, gamificación y más.

---

## 🏗️ Estructura del Proyecto (Monorepo)

```
📦 gremio-estelar/
├── 📁 backend/        # API REST en Node.js + Express 5 + TypeScript
│   ├── src/           # Código fuente
│   ├── prisma/        # Schema de base de datos
│   └── dist/          # Código compilado
├── 📁 frontend/       # App web en Next.js 14 + React 18 + TailwindCSS
│   └── src/           # Código fuente
├── 📁 shared/         # Tipos, enums y contratos (Zod) compartidos
│   └── dist/          # Código compilado
├── 📁 docs/           # Documentación técnica
├── Dockerfile         # Build del backend para producción
└── docker-compose.yml # Para testing local con Docker
```

## 🛠️ Tecnologías Principales

| Tecnología | Uso |
|---|---|
| **Node.js 20** | Runtime |
| **Express 5** | API REST |
| **Next.js 14** | Frontend (App Router) |
| **React 18** | UI |
| **TypeScript** | Lenguaje |
| **Prisma** | ORM / Base de datos |
| **PostgreSQL** | Base de datos en producción (Neon) |
| **SQLite** | Base de datos en desarrollo local |
| **Socket.IO** | WebSockets / Chat en tiempo real |
| **JWT** | Autenticación (Access + Refresh Tokens) |
| **Zod** | Validación de schemas |
| **Stripe** | Pagos (opcional) |

---

## 🚀 Desarrollo Local

### Requisitos

- Node.js 20+
- npm 10+

### Instalar dependencias

```bash
# Desde la raíz del proyecto
npm install
```

### Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp backend/.env.example backend/.env

# Editar backend/.env — los valores por defecto funcionan para desarrollo local
```

### Configurar base de datos (desarrollo con SQLite)

```bash
# Generar Prisma Client con schema SQLite
npx prisma generate --schema backend/prisma/schema.sqlite.prisma

# Crear/actualizar la base de datos SQLite
npx prisma db push --schema backend/prisma/schema.sqlite.prisma
```

> **Importante:** En desarrollo local se usa SQLite (archivo `backend/prisma/dev.db`). No necesitas instalar PostgreSQL.

### Iniciar en modo desarrollo

```bash
# Desde la raíz — inicia backend + frontend simultáneamente
npm run dev
```

- **Backend:** http://localhost:4000
- **Frontend:** http://localhost:3000

### Scripts útiles

```bash
npm run dev                        # Inicia backend + frontend en paralelo
npm run build                      # Compila shared + backend + frontend
npm run dev:backend                # Solo backend
npm run dev:frontend               # Solo frontend
npm run prisma:push:sqlite         # Push schema a SQLite local
npm run prisma:generate:sqlite     # Generar Prisma client con SQLite
```

---

## 🌐 Producción — Deploy con Render + Neon

### 📋 Servicios

| Servicio | Costo aprox. | Descripción |
|---|---|---|
| **Neon** (PostgreSQL) | 💰 Gratis (0.5GB) | Base de datos serverless |
| **Render — Backend** (Docker) | ~$7/mes (gratis primeros 90 días) | API Express en puerto 4000 |
| **Render — Frontend** (Node) | ~$7/mes (gratis primeros 90 días) | Next.js en puerto 3000 |

> 💡 **Total mensual:** ~$7-14/mes con crédito gratuito incluido al registrarse.

---

### Paso 1: Crear base de datos en Neon

1. Ve a **[neon.tech](https://neon.tech)** y regístrate (gratis, sin tarjeta)
2. Crea un nuevo proyecto — selecciona la región más cercana a ti (ej: `US East`)
3. En **Connection Details**, copia la **Connection string** (con `?sslmode=require`)
   - Se ve así: `postgresql://usuario:contraseña@ep-tu-proyecto.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. **Guarda esta string** — la necesitarás para los siguientes pasos

---

### Paso 2: Crear Backend API en Render

1. Ve a **[render.com](https://render.com/register)** y regístrate (conecta GitHub)
2. Haz clic en **New +** → **Web Service**
3. Conecta tu repositorio de GitHub
4. Configura el servicio del backend:

| Campo | Valor |
|---|---|
| **Name** | `gremio-backend` |
| **Region** | La más cercana a tus usuarios |
| **Branch** | `main` (o `master`) |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `Dockerfile` |
| **Instance Type** | `Starter` (~$7/mes) |

5. En **Environment Variables**, agrega:

```
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://gremio-frontend.onrender.com
DATABASE_URL=<la string de Neon que copiaste>
JWT_ACCESS_SECRET=<genera uno seguro>
JWT_REFRESH_SECRET=<genera otro seguro>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

> 🔑 **Para generar JWT secrets seguros:** abre tu terminal y ejecuta `openssl rand -base64 32` (dos veces, una para cada secret).

6. 💡 En **Advanced** → **Build Arguments**, agrega:
```
NEXT_PUBLIC_API_BASE_URL=https://gremio-backend.onrender.com/api
```

7. Haz clic en **Create Web Service**
8. Espera a que termine el deploy (5-10 minutos la primera vez)
9. Una vez desplegado, ve a **Settings** → **Pre-Deploy Command** y agrega:
```
cd backend && npx prisma db push --schema prisma/schema.prisma
```
   Esto crea las tablas en la base de datos. Luego haz click en **Manual Deploy** → **Deploy latest commit** para ejecutarlo.

10. ✅ **Verifica que el backend funciona:** visita `https://gremio-backend.onrender.com/api/health`

---

### Paso 3: Crear Frontend en Render

1. En Render, haz clic en **New +** → **Web Service**
2. Conecta el **mismo repositorio**
3. Configura el servicio del frontend:

| Campo | Valor |
|---|---|
| **Name** | `gremio-frontend` |
| **Region** | La misma del backend |
| **Branch** | `main` (o `master`) |
| **Runtime** | `Node` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | `Starter` (~$7/mes) |

4. En **Environment Variables**, agrega:

```
NEXT_PUBLIC_API_BASE_URL=https://gremio-backend.onrender.com/api
```

5. Haz clic en **Create Web Service**

6. ✅ **¡Listo!** Tu frontend estará en `https://gremio-frontend.onrender.com`

---

### Paso 4: Configurar dominio personalizado (opcional)

1. En Render, ve a tu servicio **frontend** → **Settings** → **Custom Domain**
2. Agrega tu dominio (ej: `gremioestelar.com`)
3. Configura un registro CNAME en tu proveedor de DNS apuntando a `gremio-frontend.onrender.com`
4. Render gestiona el SSL automáticamente 🔒

Para el backend, puedes agregar un subdominio como `api.gremioestelar.com`:
1. Ve al servicio **backend** → **Settings** → **Custom Domain**
2. Agrega `api.gremioestelar.com`
3. Crea un registro CNAME en tu DNS apuntando a `gremio-backend.onrender.com`

---

## 🐳 Docker local (alternativo)

Si quieres probar el backend con Docker localmente:

```bash
# 1. Crea un .env con DATABASE_URL de Neon
# 2. Construye y ejecuta
docker compose --env-file .env up --build
```

---

## 📚 Documentación

- [API Endpoints](./docs/api.md)
- [Arquitectura](./docs/architecture.md)
- [Base de datos](./docs/database.md)
- [Módulos](./docs/modules.md)
- [Seguridad](./docs/security.md)
- [WebSockets](./docs/websocket.md)

---

## 📝 Licencia

ISC
