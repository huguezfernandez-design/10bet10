# TOTI 24 — THE ROAD TO MADRID

Un pequeño videojuego web, hecho a medida como regalo de 24 cumpleaños.
La protagonista viaja de **Gijón a Madrid** por un mapa ilustrado de España (León → Valladolid → Segovia → Madrid).
En cada parada resuelve una adivinanza, fotografía el objeto (verificado por **Claude Vision**) y responde una pregunta.
Sus respuestas deciden **en secreto, en el servidor**, cuál de los cuatro regalos se revela al final.

---

## 1. Puesta en marcha (local)

Requisitos: Node.js 20+.

```bash
cd project24
npm install
cp .env.example .env.local      # y rellena los valores (ver §3)
npm run dev                     # http://localhost:3000
```

1. Abre `http://localhost:3000/admin` e inicia sesión con `ADMIN_PASSWORD`.
2. Pulsa **Crear enlace**: obtendrás algo como `http://localhost:3000/play/Xk3…` (192 bits aleatorios).
3. Abre ese enlace (idealmente en el móvil) y juega.

Sin `DATABASE_URL`, en local el progreso se guarda en `.data/db.json`.
Sin `ANTHROPIC_API_KEY`, en local el juego funciona en **MODO DEMO** (las fotos se aceptan **sin analizarlas** y la interfaz lo dice claramente en cada misión).

También se puede crear un enlace desde la terminal con el servidor en marcha:

```bash
ADMIN_PASSWORD=… node scripts/create-game.mjs "La buena" http://localhost:3000
```

## 2. Despliegue en Vercel (producción)

1. **Base de datos** (Supabase, gratis):
   - Crea un proyecto en supabase.com → *Project Settings → Database → Connection string*.
   - Copia la cadena **Transaction pooler** (puerto 6543) y sustituye la contraseña. Esa es tu `DATABASE_URL`.
   - No hace falta crear tablas: la app crea `p24_games`, `p24_settings` y `p24_events` la primera vez.
   - (Funciona igual con Neon, Railway o cualquier PostgreSQL.)
2. **Clave de Anthropic**: crea una API key en console.anthropic.com → *API Keys*.
3. **Vercel**: *Add New Project* → importa este repositorio → en **Root Directory** elige `project24`.
4. En *Settings → Environment Variables* añade:

   | Variable | Valor |
   |---|---|
   | `ANTHROPIC_API_KEY` | tu clave (`sk-ant-…`) |
   | `ANTHROPIC_MODEL` | opcional, por defecto `claude-opus-5-5` |
   | `DATABASE_URL` | la cadena de Supabase |
   | `ADMIN_PASSWORD` | una contraseña larga |
   | `ADMIN_SESSION_SECRET` | cadena aleatoria larga (p. ej. `openssl rand -hex 32`) |

5. *Deploy*. Entra en `https://tu-proyecto.vercel.app/admin`, crea el enlace y envíaselo.

> **Importante:** en Vercel el sistema de archivos es efímero. Sin `DATABASE_URL` el progreso no persistiría, por eso en producción es obligatoria.
> En producción, sin `ANTHROPIC_API_KEY` la verificación queda **desactivada** (no hay modo demo salvo que pongas `ALLOW_DEMO_MODE=true`).

Antes de enviarle el enlace: juega una partida de prueba con otro enlace, y después bórrala o reiníciala desde `/admin`.

## 3. Variables de entorno

Ver `.env.example`. Ninguna clave llega nunca al navegador: la verificación de fotos y la puntuación se ejecutan solo en el servidor.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | En producción | Verificación de fotos con Claude Vision |
| `ANTHROPIC_MODEL` | No | Modelo de visión (por defecto `claude-opus-5-5`) |
| `DATABASE_URL` | En producción | PostgreSQL (Supabase/Neon/…) |
| `ADMIN_PASSWORD` | Para usar `/admin` | Acceso al panel |
| `ADMIN_SESSION_SECRET` | Recomendado | Firma de la cookie de admin |
| `ALLOW_DEMO_MODE` | No | `true` permite el modo demo en producción; `false` lo prohíbe también en local |

## 4. Cómo personalizarlo

**Todo el contenido está en un único archivo:** [`src/content/default-config.ts`](src/content/default-config.ts)
— textos, ciudades y su orden, coordenadas, adivinanzas, objetos esperados y alternativas, preguntas, respuestas, puntuaciones, textos del encuentro y de la revelación, regalos, colores e imágenes.

Además, **/admin → Contenido** permite editar cualquier campo sin tocar código (formulario o JSON). Esos cambios se guardan en la base de datos y tienen prioridad sobre el archivo; *Restaurar por defecto* vuelve al archivo.

- **Regalos** (`gifts`): titular, texto, cierre, paleta, composición (`split`, `poster`, `frame`, `stack`), ilustración (`table`, `stage`, `glass`, `mountain` o `none`) y una `image` opcional (URL o subida desde el admin) que sustituye a la ilustración.
- **Puntuación**: cada respuesta tiene `points`, p. ej. `{ "DINNER": 2, "GETAWAY": 1 }`. Las categorías son las claves de `gifts`.
- **Avatares definitivos**: en `avatars.her.images` / `avatars.him.images` puedes poner una imagen por pose (`idle`, `walking`, `celebrating`, `surprised`, `happy`, `greeting`). Si no hay imagen, se usa el personaje SVG incluido.
- **Ciudades**: `scene` elige el diorama (`coast`, `cathedral`, `plaza`, `aqueduct`, `capital`, `village`); `lon`/`lat` la posición real. La primera parada es el origen; la última incluye el encuentro.

### Algoritmo del regalo (solo servidor)
1. Se suman los puntos de las cuatro respuestas por categoría.
2. Gana la categoría con más puntos.
3. Empate → decide la respuesta más reciente (la última pregunta pesa más), luego la anterior, etc.
4. Si persiste → `scoring.tieBreakOrder`, y por último orden alfabético.

Con el contenido por defecto, **las cuatro categorías pueden ganar** (lo comprueba un test).

## 5. Arquitectura

```
src/
  content/default-config.ts   ← TODO el contenido editable (solo servidor)
  game/                       ← código compartido, seguro para el navegador
    types.ts                  tipos públicos (sin secretos)
    projection.ts, geo.generated.ts, mapdata.ts, route.ts   geografía y ruta
  server/                     ← solo servidor ("server-only")
    config.ts                 config activa + toPublic() que elimina secretos
    games.ts                  máquina de estados de la partida
    scoring.ts                algoritmo del regalo
    vision.ts                 Claude Vision (salida JSON estructurada)
    db.ts                     PostgreSQL o archivo local
    admin-auth.ts             sesión de admin (cookie HMAC)
    gift-art.ts               ilustraciones de regalos (solo se envía la ganadora)
  components/
    map/        WorldMap (cámara + capas), Terrain, CityScene
    characters/ Character (rig SVG con poses)
    game/       Game (orquestador), StartScreen, Hud/Panel/Dialogue
    mission/    ArrivalCard, MissionPanel (foto + análisis), QuestionPanel
    madrid/     MadridWelcome
    reveal/     Finale (YOU MADE IT → suspense → revelación)
    admin/      AdminDashboard, ContentEditor, AdminGate
  app/
    play/[token]          el juego
    admin, admin/content  panel protegido
    api/game/[token]/…    estado, action, verify, answer, result
    api/admin/…           login, partidas, contenido
```

### El mapa (capas)
1. **Territorio** — silueta real de España (Natural Earth, proyectada en `scripts/build-geo.mjs`), relieve con grosor, costa, ríos.
2. **Escenarios** — sierras, bosques, campos de Castilla, pueblos, carreteras, barcos, nubes, pájaros y un diorama por ciudad (Elogio del Horizonte, catedral de León, Plaza Mayor, acueducto, Puerta de Alcalá + Cuatro Torres).
3. **Recorrido** — carretera entre paradas, línea de progreso animada, marcadores bloqueado/siguiente/completado.
4. **Personajes** — capa HTML posicionada con *motion values* (no re-renderiza React a cada frame).
5. **Interfaz** — nombres de ciudad, niveles, HUD de progreso, zoom.

La cámara (`cx`, `cy`, `zoom` + ancla que esquiva los paneles) sigue a la protagonista por la carretera, reencuadra cada ciudad, admite arrastrar, pellizcar y rueda, y se adapta al tamaño de pantalla.

### Seguridad y anti-trampas
- El navegador solo recibe `toPublic(config)`: sin objetos esperados, sin puntuaciones, sin regalos. Hay un test que lo comprueba, y los bundles del cliente no contienen esos textos.
- La revelación (`/result`) responde **403** hasta que la partida está terminada y solo devuelve el regalo ganador.
- La partida es una máquina de estados en el servidor: no se puede responder sin verificar la foto, ni verificar fuera de una misión, ni saltar niveles (→ 409). Escrituras con bloqueo optimista.
- Fotos: máx. 8 MB, formato comprobado por *magic bytes* (JPEG/PNG/WEBP/GIF), procesadas en memoria y **nunca guardadas**. Límite de intentos por minuto. En el móvil se reducen a 1568 px antes de subir.
- Enlaces con 192 bits aleatorios, `noindex` en meta, cabecera `X-Robots-Tag` y `robots.txt`.
- Admin con contraseña por variable de entorno, comparación en tiempo constante, cookie `httpOnly` firmada y límite de intentos.

## 6. Pruebas

```bash
npm test                 # unitarias: puntuación, máquina de estados, secretos, validación
npm run lint             # TypeScript estricto
```

Prueba de extremo a extremo del flujo de verificación contra una API de Anthropic simulada:

```bash
npm run build
ANTHROPIC_API_KEY=sk-test ANTHROPIC_BASE_URL=http://localhost:4010 ADMIN_PASSWORD=test-admin-pass \
  npx next start -p 3200 &
ADMIN_PASSWORD=test-admin-pass node tests/e2e-vision.mjs http://localhost:3200
```

En desarrollo, `/dev-preview` muestra todas las poses de los personajes y `/dev-preview/map` el mapa (ambas dan 404 en producción).

## 7. Notas

- El modelo por defecto es `claude-opus-5-5`, con esfuerzo `low` (respuesta rápida) y salida JSON estructurada. Para ese modelo se activa el *fallback* de rechazos en el servidor de Anthropic (`fallbacks: "default"`); si cambias a un modelo sin soporte, se omite automáticamente.
- Sonido: sintetizado con Web Audio, **desactivado por defecto**; se activa con el botón SOUND del HUD.
- Accesibilidad: respeta `prefers-reduced-motion` en las animaciones ambientales.
