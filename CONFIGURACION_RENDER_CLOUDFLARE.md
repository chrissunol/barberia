# Configuracion de despliegue: Render + Cloudflare Pages

Esta guia deja el frontend en Cloudflare Pages y el backend FastAPI en Render.
El acceso se permite unicamente desde la red de la barberia.

```text
Dispositivo conectado a la WiFi de la barberia
              |
              v
Cloudflare Pages: frontend
              |
              v
Cloudflare WAF / proxy
              |
              v
Render: API FastAPI
              |
              v
Supabase: base de datos
```

> Importante: sustituye todos los valores de ejemplo por los valores reales. No
> subas claves privadas a GitHub ni las pongas en Angular.

## 1. Datos que debes obtener primero

### 1.1 IP publica de la barberia

Desde un dispositivo conectado a la WiFi de la barberia, visita uno de estos sitios:

- `https://ifconfig.me`
- `https://whatismyipaddress.com`

Anota la IPv4 publica. No uses una IP local como `192.168.1.20` o `10.0.0.5`.

Ejemplo ficticio:

```text
203.0.113.25
```

Comprueba tambien si tu proveedor ofrece una IP fija. Si la IP cambia, tendras que
actualizar las reglas de Cloudflare y la variable de Render.

### 1.2 URL de Supabase y clave privada

En Supabase:

1. Abre el proyecto.
2. Entra en **Project Settings**.
3. Abre **API**.
4. Copia **Project URL**.
5. Usa una clave privada de servidor para `SUPABASE_KEY`.

La clave privada solo se guarda en Render. Si la clave anterior estuvo expuesta,
revocala y genera una nueva antes de desplegar.

## 2. Preparar el repositorio

Verifica que existan estos archivos:

- `Back-end/requirements.txt`
- `Back-end/app/main.py`
- `Front-end/package.json`
- `Front-end/angular.json`
- `Front-end/src/environments/environment.prod.ts`
- `.gitignore`

En `Front-end/src/environments/environment.prod.ts`, reemplaza la URL de ejemplo:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://NOMBRE-REAL-DE-TU-API.onrender.com'
};
```

El valor debe ser la URL real del servicio de Render, sin añadir `/api/check-in`.

## 3. Crear el servicio en Render

1. Entra en `https://dashboard.render.com`.
2. Pulsa **New**.
3. Selecciona **Web Service**.
4. Conecta el repositorio donde esta el proyecto.
5. Selecciona la rama que vas a desplegar.
6. Configura los valores siguientes:

| Campo de Render | Valor |
|---|---|
| **Name** | Un nombre unico, por ejemplo `barberia-api` |
| **Root Directory** | `Back-end` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/health` |
| **Plan** | Free para pruebas o MVP |

Si Render pregunta por la version de Python, usa una version compatible con las
dependencias del proyecto, preferiblemente Python 3.12.

## 4. Variables de entorno en Render

En el servicio de Render:

1. Abre **Environment**.
2. Entra en **Environment Variables**.
3. Pulsa **Add Environment Variable**.
4. Crea estas variables:

```env
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_KEY=CLAVE_PRIVADA_DEL_SERVIDOR
FRONTEND_ORIGIN=https://NOMBRE-REAL.pages.dev
ALLOWED_CLIENT_IPS=IP_PUBLICA_DE_LA_BARBERIA
TRUSTED_PROXY_CIDRS=RANGOS_OFICIALES_DE_CLOUDFLARE
RATE_LIMIT=5/minute
RATE_LIMIT_STORAGE_URI=memory://
```

### Significado de cada variable

| Variable | Que debe contener |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_KEY` | Clave privada del backend; nunca la del frontend |
| `FRONTEND_ORIGIN` | URL exacta de Cloudflare Pages, incluyendo `https://` |
| `ALLOWED_CLIENT_IPS` | IPv4 publica de la barberia; varias se separan con comas |
| `TRUSTED_PROXY_CIDRS` | Rangos oficiales IPv4/IPv6 de Cloudflare usados como proxy |
| `RATE_LIMIT` | Limite por IP, inicialmente `5/minute` |
| `RATE_LIMIT_STORAGE_URI` | `memory://` para una instancia; Redis para varias instancias |

Para obtener los rangos oficiales actuales de Cloudflare, consulta:

`https://www.cloudflare.com/ips/`

Copia los rangos IPv4 e IPv6 en `TRUSTED_PROXY_CIDRS`, separados por comas. No
pongas `0.0.0.0/0`, porque eso haria que cualquier cliente pudiera falsificar la
cabecera de Cloudflare.

Ejemplo de formato, con valores ficticios:

```env
ALLOWED_CLIENT_IPS=203.0.113.25
TRUSTED_PROXY_CIDRS=192.0.2.0/24,2001:db8::/32
```

> Si `ALLOWED_CLIENT_IPS` esta vacia, FastAPI rechaza el acceso con `503`. Esto es
> intencional: evita desplegar la API abierta por accidente.

Pulsa **Save Changes** y despues **Manual Deploy > Deploy latest commit**.

## 5. Comprobar Render antes de Cloudflare

En Render, abre **Logs** y confirma que el servicio arranca sin errores.

Abre:

```text
https://NOMBRE-REAL-DE-TU-API.onrender.com/health
```

Debe responder:

```json
{"status":"ok"}
```

El endpoint de check-in debe rechazar peticiones directas si la IP no esta en
`ALLOWED_CLIENT_IPS`. No pruebes enviando datos reales mientras falte la regla de
Cloudflare.

## 6. Crear el proyecto en Cloudflare Pages

1. Entra en `https://dash.cloudflare.com`.
2. Selecciona tu cuenta.
3. Abre **Workers & Pages**.
4. Pulsa **Create application**.
5. Selecciona **Pages**.
6. Elige **Connect to Git**.
7. Selecciona el repositorio.
8. Configura el build:

| Campo de Cloudflare Pages | Valor |
|---|---|
| **Project name** | Un nombre unico, por ejemplo `barberia-checkin` |
| **Production branch** | La rama estable, por ejemplo `main` |
| **Root directory** | `Front-end` |
| **Framework preset** | Angular, si aparece disponible |
| **Build command** | `npm ci && npm run build` |
| **Build output directory** | `dist/barber-checkin-frontend/browser` |

Si el preset Angular usa una ruta distinta, confirma la carpeta creada dentro de
`Front-end/dist` despues del primer build. La carpeta debe contener `index.html`.

Pulsa **Save and Deploy**. Cloudflare asignara una URL parecida a:

```text
https://barberia-checkin.pages.dev
```

## 7. Actualizar Render con la URL de Pages

Vuelve a Render:

1. Abre **Environment**.
2. Cambia `FRONTEND_ORIGIN` a la URL exacta de Pages.
3. Guarda los cambios.
4. Espera a que Render redespliegue.

No añadas una barra final si la URL configurada en el navegador no la tiene.

## 8. Bloquear Cloudflare Pages fuera de la barberia

La forma mas directa es crear una regla de acceso por IP en Cloudflare:

1. En Cloudflare, abre **Security**.
2. Entra en **WAF** o **Custom rules**.
3. Pulsa **Create rule**.
4. Aplica la regla al hostname de Pages.
5. Usa una expresion equivalente a:

```text
(http.host eq "NOMBRE-REAL.pages.dev" and ip.src ne IP_PUBLICA_DE_LA_BARBERIA)
```

6. Accion: **Block**.
7. Guarda y despliega la regla.

Si el panel ofrece **Cloudflare Access**:

1. Abre **Zero Trust**.
2. Entra en **Access > Applications**.
3. Crea una aplicacion self-hosted para el hostname de Pages.
4. Crea una policy **Allow** para la IP publica de la barberia.
5. Crea una policy **Block** para el resto.

Usa una sola estrategia y comprueba que el dominio `pages.dev` tambien esta
protegido. Revisa las URLs de preview y decide si deben deshabilitarse o protegerse.
Una preview publica puede saltarse la regla del dominio de produccion.

## 9. Proteger tambien la API en Cloudflare

La API necesita su propia regla. Si usas el dominio directo `onrender.com`, no
siempre podras aplicar la misma politica de Cloudflare al hostname de Render.

### Opcion recomendada: hostname propio proxificado

Con un dominio propio:

1. En Cloudflare, abre **DNS**.
2. Crea un registro `CNAME`, por ejemplo `api`, apuntando al hostname de Render.
3. Activa el proxy naranja de Cloudflare.
4. Usa `https://api.tudominio.com` en `environment.prod.ts`.
5. En **Security > WAF > Custom rules**, bloquea toda IP excepto la de la barberia.
6. Actualiza `FRONTEND_ORIGIN` y vuelve a desplegar Render y Pages.

### Sin dominio propio

Puedes seguir usando `NOMBRE-REAL-DE-TU-API.onrender.com`, pero la barrera
principal sera la validacion de IP de FastAPI. La regla de Pages no protege
automaticamente el hostname directo de Render.

## 10. Rate limiting y escalabilidad

La configuracion inicial es:

```env
RATE_LIMIT=5/minute
RATE_LIMIT_STORAGE_URI=memory://
```

`memory://` sirve para una unica instancia y pruebas. Si Render usa varias
instancias, cada proceso tendra su propio contador. Para escalar, crea Redis y
cambia la variable:

```env
RATE_LIMIT_STORAGE_URI=redis://USUARIO:CLAVE@HOST:6379/0
```

No pongas la contraseña de Redis en el repositorio. Guardala como variable secreta
en Render.

## 11. Pruebas finales obligatorias

### Desde la WiFi de la barberia

- Abrir la URL de Pages.
- Confirmar que el formulario carga.
- Crear un check-in de prueba.
- Confirmar que la API responde correctamente.
- Revisar los logs de Render.

### Desde una red externa

Usa datos falsos o simplemente abre la web:

- La web debe quedar bloqueada por Cloudflare.
- Una llamada directa a Render debe devolver `403` o `503`, nunca crear datos.
- Repite la prueba con la URL directa de Render, no solo con Pages.

### Comprobar el limite

Desde la red permitida, realiza mas de cinco peticiones en un minuto al endpoint.
La siguiente debe devolver `429 Too Many Requests`.

## 12. Checklist de seguridad antes de usar datos reales

- [ ] La clave `service_role` anterior fue revocada y rotada.
- [ ] `Back-end/.env` no esta en Git.
- [ ] `SUPABASE_KEY` solo existe en los secretos de Render.
- [ ] `ALLOWED_CLIENT_IPS` contiene la IP publica real.
- [ ] `TRUSTED_PROXY_CIDRS` contiene solo rangos oficiales de Cloudflare.
- [ ] Cloudflare bloquea el frontend fuera de la WiFi.
- [ ] La API tambien queda bloqueada fuera de la WiFi.
- [ ] `FRONTEND_ORIGIN` coincide exactamente con Pages.
- [ ] Pages usa HTTPS y la API usa HTTPS.
- [ ] El limite devuelve `429` al superarse.
- [ ] Las URLs de preview de Pages no permiten saltarse la proteccion.
- [ ] Supabase tiene RLS y politicas revisadas antes de exponer mas modulos.
- [ ] Se ha probado el flujo desde una red externa.
