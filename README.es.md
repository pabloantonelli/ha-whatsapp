# Add-on de WhatsApp para Home Assistant

[English](README.md)

Envía y recibe mensajes de WhatsApp desde Home Assistant. Vinculá tu teléfono
desde un panel en la barra lateral y usá `whatsapp.send_message` en cualquier
automatización.

> **Basado en el trabajo de [Giuseppe Castaldo](https://github.com/giuseppecastaldo/ha-addons).**
> Este proyecto nació como un fork de su add-on de WhatsApp y no existiría sin
> él. Hoy se mantiene de forma independiente, bajo la misma licencia
> Apache-2.0. La atribución completa está en [NOTICE](NOTICE).

---

## Qué hace

- Envía texto, imágenes, audio, video, documentos, ubicaciones y reacciones a
  contactos y grupos.
- Dispara un evento de Home Assistant por cada mensaje entrante, cambio de
  presencia y acuse de entrega, para que las automatizaciones reaccionen.
- Permite varias cuentas de WhatsApp en paralelo, cada una vinculada por
  separado.
- Se vincula desde un panel en la barra lateral, con código QR o con un código
  de 8 dígitos.

## Requisitos

- Home Assistant OS o Supervised (esto es un add-on: las instalaciones
  Container y Core no pueden ejecutarlo).
- Arquitecturas: `aarch64`, `amd64`, `armhf`, `armv7`, `i386`.
- Un teléfono con WhatsApp, para vincular la cuenta.

> **Este add-on usa una API no oficial de WhatsApp.** WhatsApp no admite este
> tipo de clientes y las cuentas pueden ser bloqueadas por actividad automática
> o inusual. No lo uses para mensajería masiva ni no solicitada. Leé
> [LEGAL.md](LEGAL.md) antes de instalarlo.

## Instalación

1. **Agregá el repositorio.** En Home Assistant entrá en **Ajustes →
   Complementos → Tienda de complementos**, abrí el menú ⋮, elegí
   **Repositorios** y agregá:

   ```text
   https://github.com/pabloantonelli/ha-whatsapp
   ```

2. **Instalá.** Buscá **WhatsApp** en la tienda y tocá **Instalar**.

3. **Iniciá el add-on.** Activá **Mostrar en la barra lateral** y tocá
   **Iniciar**.

4. **Reiniciá Home Assistant Core** (**Ajustes → Sistema → Reiniciar**). Hace
   falta una sola vez, la primera, para que se cargue la integración
   `whatsapp` que instala el add-on.

5. **Vinculá tu teléfono.** Abrí **WhatsApp** en la barra lateral y elegí:
   - escanear el código QR desde **WhatsApp → Dispositivos vinculados →
     Vincular un dispositivo**, o
   - escribir tu número y tocar **Get code**, para después ingresar los 8
     dígitos en **WhatsApp → Dispositivos vinculados → Vincular con número de
     teléfono**.

   El panel muestra *Connected* cuando la vinculación termina.

6. **Probá un mensaje.** En **Herramientas para desarrolladores → Acciones**:

   ```yaml
   action: whatsapp.send_message
   data:
     clientId: default
     to: "34600000000"
     body:
       text: Hola desde Home Assistant
   ```

La referencia completa de servicios y eventos está en
[whatsapp_addon/DOCS.md](whatsapp_addon/DOCS.md).

## Configuración

```yaml
clients:
  - default        # una entrada por cada cuenta de WhatsApp
api_token: ""      # se genera solo si se deja vacío
log_level: info    # trace | debug | info | warn | error | fatal
mark_online: false # aparecer en línea mientras está conectado
refresh_hours: 0   # reconectar cada N horas (0 = desactivado)
```

Cada nombre adicional en `clients` es otra cuenta para vincular, y se
referencia con ese nombre en el campo `clientId` de cada servicio.

## Actualización desde la v2.x

**La v3.0.0 se instala como un add-on aparte.** Su slug cambió de
`whatsapp_addon` a `ha_whatsapp`, así que el supervisor lo trata como una
instalación nueva, con el almacenamiento vacío.

**Qué implica**

- ⚠️ **Tenés que volver a vincular el teléfono.** La sesión de la v2 no se
  transfiere.
- ⚠️ **Desinstalá primero el add-on viejo.** Dos add-ons con el mismo número
  compiten por la sesión y ninguno queda conectado.
- ✅ **Tus automatizaciones siguen funcionando sin cambios.** La integración
  sigue siendo `whatsapp` y los cinco servicios conservan nombres y campos.

**Pasos**

1. Detené y desinstalá el add-on **Whatsapp** anterior.
2. Instalá **WhatsApp** v3 como se indica arriba.
3. Reiniciá Home Assistant Core.
4. Vinculá el teléfono desde el panel de la barra lateral.

El detalle paso a paso, la equivalencia de endpoints y cómo volver atrás están
en [MIGRATION.md](MIGRATION.md).

## API HTTP

El add-on expone una API HTTP en el puerto 3000, que usa la integración y que
podés consumir desde cualquier cliente de tu red.

Todas las rutas `/api/v1` requieren un token: el de la opción `api_token`, o el
que se genera en el primer arranque (podés leerlo en
`/config/custom_components/whatsapp/connection.json`):

```bash
curl -X POST http://<addon>:3000/api/v1/clients/default/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"34600000000","body":{"text":"Hola"}}'
```

| Método | Ruta | Para qué sirve |
|---|---|---|
| `GET` | `/health` | Versión y estado de conexión por cliente (sin token) |
| `GET` | `/api/v1/clients` | Lista de clientes y su estado |
| `GET` | `/api/v1/clients/:id` | Estado de un cliente |
| `POST` | `/api/v1/clients/:id/messages` | Enviar un mensaje; devuelve su `messageId` |
| `GET` | `/api/v1/clients/:id/qr` | Código QR actual (`?format=png` para la imagen) |
| `POST` | `/api/v1/clients/:id/pairing-code` | Pedir un código de 8 dígitos |
| `GET` | `/api/v1/clients/:id/check/:phone` | Comprobar si un número está en WhatsApp |
| `POST` | `/api/v1/clients/:id/status` | Cambiar el texto de estado del perfil |
| `POST` | `/api/v1/clients/:id/presence` | Enviar una actualización de presencia |
| `POST` | `/api/v1/clients/:id/presence/subscribe` | Suscribirse a la presencia de un contacto |
| `POST` | `/api/v1/clients/:id/restart` | Reconectar el cliente |
| `POST` | `/api/v1/clients/:id/logout` | Cerrar la sesión y volver a vincular |

Los endpoints de la v2 (`/sendMessage`, `/setStatus`, `/presenceSubscribe`,
`/sendPresenceUpdate`, `/sendInfinityPresenceUpdate`) siguen funcionando, con
el mismo formato de petición y respuesta, así que tus scripts actuales no se
rompen.

## Eventos

| Evento | Cuándo se dispara |
|---|---|
| `new_whatsapp_message` | Llega un mensaje |
| `whatsapp_presence_update` | Un contacto suscrito cambia de presencia |
| `whatsapp_message_ack` | Un mensaje enviado se entrega o se lee |

## Solución de problemas

**El código QR no aparece.** Abrí el panel de la barra lateral: el QR se
muestra ahí directamente. Si queda en *Waiting for a QR code*, revisá el log
del add-on y verificá que el equipo llegue a `web.whatsapp.com`.

**`Client not found`.** El `clientId` del servicio tiene que coincidir con un
nombre de la opción `clients`. El valor por omisión es `default`.

**La integración no llega al add-on.** El add-on escribe su dirección en
`/config/custom_components/whatsapp/connection.json` en cada arranque, y la
integración la vuelve a leer sola. Verificá que el add-on esté corriendo y
reintentá. (La v2.x escribía una IP fija dentro del código Python, que dejaba
de servir apenas Docker la reasignaba; eso ya no pasa.)

**Faltan los servicios después de instalar.** Reiniciá Home Assistant Core una
vez para que se cargue la integración `whatsapp`.

## Desarrollo

```bash
cd whatsapp_addon
npm ci
npm test
```

El build está fijado por `package-lock.json` y corre sobre Node 20+, así que da
el mismo resultado en cualquier máquina. Las actualizaciones de dependencias
llegan como pull requests de Renovate.

## Créditos

- **[Giuseppe Castaldo](https://github.com/giuseppecastaldo/ha-addons)** — autor
  del add-on de WhatsApp original en el que se basa este proyecto.
- **[WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys)** — la
  librería de WhatsApp Web que hace el trabajo pesado.
- La comunidad de Home Assistant.

## Licencia

Apache License 2.0 — ver [LICENSE](LICENSE) y [NOTICE](NOTICE).

Este proyecto no está afiliado, avalado ni vinculado a WhatsApp LLC ni a Meta
Platforms, Inc.
