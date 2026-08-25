# Barber Check-In MVP

MVP para check-in de clientes en una barbería usando Angular + FastAPI + Supabase.

## Incluye
- Nombre
- Apellidos
- Correo
- Teléfono
- Cómo se enteró de la barbería
- Validación en Angular y FastAPI
- Búsqueda de cliente por teléfono
- Creación/actualización de cliente
- Creación de check-in con estado `waiting`
- Endpoint `/health`

## 1. Supabase
Ejecuta `supabase_schema.sql` en el SQL Editor de Supabase.

Antes de desplegar, rota cualquier clave `service_role` que haya sido expuesta y
guarda la nueva clave únicamente como secreto del backend. Nunca la pongas en Angular.

## 2. Backend
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase.

Configura estas variables en Render:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-privada-del-servidor
FRONTEND_ORIGIN=https://tu-proyecto.pages.dev
ALLOWED_CLIENT_IPS=IP_PUBLICA_DE_LA_BARBERIA
TRUSTED_PROXY_CIDRS=RANGOS_IPV4_E_IPV6_DE_CLOUDFLARE
RATE_LIMIT=5/minute
RATE_LIMIT_STORAGE_URI=redis://usuario:password@host:6379/0
```

`ALLOWED_CLIENT_IPS` debe contener la IP pública del router de la barbería, no
una dirección local como `192.168.x.x`. `TRUSTED_PROXY_CIDRS` debe contener
únicamente los rangos oficiales de Cloudflare que uses delante de Render.
Mientras `ALLOWED_CLIENT_IPS` esté vacío, la API rechaza el tráfico.

Arranca FastAPI:
```bash
uvicorn app.main:app --reload --port 8000
```

API docs:
`http://localhost:8000/docs`

## 3. Frontend
```bash
cd frontend
npm install
npm start
```

Para desarrollo, edita `Front-end/src/environments/environment.ts`. Para producción,
edita `environment.prod.ts` con la URL pública de Render:

```ts
apiUrl: 'https://tu-api.onrender.com'
```

Abre:
`http://localhost:4200`

## Importante
No pongas la Service Role Key de Supabase en Angular. Solo debe vivir en el backend.

Cloudflare Pages debe tener una regla de acceso que permita únicamente la IP pública
de la barbería. Protege también la URL pública de la API con una regla WAF. La
validación de FastAPI es una segunda barrera contra accesos directos a Render.
