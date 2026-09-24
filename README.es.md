# Add-on de WhatsApp para Home Assistant

[English](README.md)

Envía y recibe mensajes de WhatsApp desde Home Assistant. Vinculá tu teléfono
desde un panel en la barra lateral y usá `whatsapp.send_message` en cualquier
automatización.

## Qué hace

- Envía texto, imágenes, audio, video, documentos, ubicaciones y reacciones a
  contactos y grupos.
- Dispara un evento de Home Assistant por cada mensaje entrante, cambio de
  presencia y acuse de entrega, para que las automatizaciones reaccionen.
- Permite varias cuentas de WhatsApp en paralelo, cada una vinculada por
  separado.
- Se vincula desde un panel en la barra lateral, con código QR o con un código
  de 8 dígitos.

## Novedades de la v3

Si venís de la v2.x, esto es lo que antes no podías hacer.

### Vinculación y visibilidad

- **Vincular con un código de 8 dígitos.** Escribí tu número en el panel de la
  barra lateral e ingresá el código en **WhatsApp → Dispositivos vinculados →
  Vincular con número de teléfono**, sin depender de escanear un QR.
- **Ver qué está pasando.** El panel lista cada cliente con su estado en vivo,
  el número vinculado y desde cuándo está conectado. Antes la única señal era
  una imagen de QR dentro de una notificación.
- **Reiniciar o cerrar la sesión** de un cliente desde el panel, sin reiniciar
  el add-on.

### Automatizaciones que ahora podés armar

- **Reaccionar a acuses de entrega y lectura.** El evento nuevo
  `whatsapp_message_ack` trae el id del mensaje y su estado:

  ```yaml
  automation:
    - alias: Avisarme si la alerta nunca se entregó
      triggers:
        - trigger: event
          event_type: whatsapp_message_ack
      conditions:
        - condition: template
          value_template: "{{ trigger.event.data.status == 'ERROR' }}"
      actions:
        - action: persistent_notification.create
          data:
            message: "Falló el mensaje {{ trigger.event.data.messageId }}"
  ```

- **Avisar cuando WhatsApp se desconecta.** `/health` ahora informa el estado
  real de la conexión, así que podés vigilarlo con un sensor REST y enterarte
  de que se cayó la sesión, en vez de descubrirlo porque un mensaje nunca
  llegó:

  ```yaml
  binary_sensor:
    - platform: rest
      name: WhatsApp conectado
      resource: http://<hostname-del-addon>:3000/health
      value_template: "{{ value_json.clients.default.connected }}"
      device_class: connectivity
  ```

- **Comprobar un número antes de escribirle**, para que la automatización use
  otro canal si el contacto no está en WhatsApp:

  ```bash
  curl -H "Authorization: Bearer <token>" \
    http://<addon>:3000/api/v1/clients/default/check/34600000000
  # {"jid":"34600000000@s.whatsapp.net","exists":true}
  ```

- **Seguir un mensaje puntual.** Enviar por `/api/v1` devuelve el id del
  mensaje, que combinado con el evento de acuse te deja rastrearlo de punta a
  punta.

### Fiabilidad y seguridad

- **Los fallos se ven.** Un servicio que falla ahora lanza un error en la
  interfaz de Home Assistant. En la v2.x la respuesta se descartaba, así que un
  mensaje que nunca se envió se veía igual que uno entregado.
- **No se pierden mensajes entrantes.** Antes sólo el primer mensaje de cada
  lote disparaba un evento; ahora lo hacen todos.
- **La API exige token.** Antes cualquiera en tu red podía enviar mensajes
  desde tu cuenta haciendo un POST al puerto 3000.
- **Las reconexiones usan backoff** en vez de reintentar cada segundo para
  siempre, y el add-on se reinicia solo si queda en mal estado.

### Opciones nuevas

`log_level` para subir el detalle mientras diagnosticás, `mark_online` para
decidir si la cuenta aparece en línea, `refresh_hours` para una reconexión
periódica y `api_token` para fijar vos mismo el token de la API.

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

   El panel muestra _Connected_ cuando la vinculación termina.

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

## El panel de WhatsApp

El panel de la barra lateral tiene tres pestañas:

- **Status** — cada cliente con su estado de conexión en vivo, el número
  vinculado, y la vinculación por QR o por código de 8 dígitos. Desde acá
  también podés reiniciar o cerrar la sesión.
- **Groups & contacts** — tus chats con foto de perfil y buscador. Copiás el ID
  de un grupo directo al campo `to` del servicio; el JID de un grupo no se puede
  deducir de un número, así que esta es la forma práctica de conseguirlo.
- **Snippet builder** — elegís una acción, completás los campos y copiás la
  llamada en el formato que necesites.
- **Incoming** — qué remitentes pueden disparar tus automatizaciones.
- **Help** — los servicios, eventos y reglas de direccionamiento, a mano.

### Generador de snippets

Escribe la misma llamada de tres formas, ya con la URL y el token reales de tu
instalación:

- **Home Assistant** — YAML para pegar en una automatización o script en modo
  YAML.
- **Node-RED** — el método, la URL, las cabeceras y el payload para un nodo
  `http request`.
- **curl** — para probarlo en una terminal antes de armar la automatización.

Cubre mensajes de texto, capturas y clips de cámara, imágenes y audio desde una
URL, ubicaciones, actualizaciones de presencia y el estado del perfil, además de
listeners para los tres eventos que dispara el add-on.

## Enviar capturas y videos de las cámaras

`whatsapp.send_media` captura directamente de una entidad `camera.*` o
`image.*`, sin tener que guardar un archivo ni exponer una URL antes.

```yaml
action: whatsapp.send_media
data:
  clientId: default
  to: "34600000000"
  entity_id: camera.puerta
  caption: Hay alguien en la puerta
```

Para mandar un video, agregá `duration`. Con `lookback` el clip incluye además
los segundos grabados _antes_ de que se disparara la automatización — que suele
ser lo que realmente querés ver, porque cuando suena el timbre lo interesante
ya pasó:

```yaml
automation:
  - alias: Clip del timbre
    triggers:
      - trigger: state
        entity_id: binary_sensor.timbre
        to: "on"
    actions:
      - action: whatsapp.send_media
        data:
          clientId: default
          to: "34600000000"
          entity_id: camera.puerta
          duration: 10
          lookback: 5
          caption: Timbre
```

Grabar requiere una cámara con el componente `stream` (RTSP y similares); las
que sólo entregan imagen fija pueden mandar capturas pero no clips, y
`lookback` sólo funciona si el stream está precargado.

## Indicador de escritura

Antes de enviar, el add-on muestra el indicador de "escribiendo…" —o
"grabando…" para las notas de voz— y espera un momento que varía según el largo
del mensaje, hasta 3 segundos por omisión.

El indicador visible sirve sobre todo para que la conversación se vea natural
del lado de quien recibe. Lo que más pesa es la pausa: evita que varios mensajes
seguidos salgan como una ráfaga instantánea y con intervalos idénticos, que es
el patrón que hace que una cuenta sea marcada como automatizada. No es una
garantía contra el bloqueo: el volumen y los mensajes no solicitados pesan
mucho más.

Las fotos y los videos llevan el indicador pero sin pausa extra, porque la
subida ya toma un tiempo variable de por sí.

Se ajusta en las opciones del add-on:

```yaml
typing_indicator: true # false lo desactiva por completo
typing_max_seconds: 3 # tope de la pausa; 0 envía de inmediato
```

**Para alertas urgentes, desactivalo en esa llamada** y así un timbre o una
fuga de agua no se demoran un par de segundos:

```yaml
action: whatsapp.send_message
data:
  clientId: default
  to: "34600000000"
  body:
    text: Fuga de agua detectada
  typing: false
```

## Configuración

```yaml
clients:
  - default # una entrada por cada cuenta de WhatsApp
api_token: "" # se genera solo si se deja vacío
log_level: info # trace | debug | info | warn | error | fatal
mark_online: false # aparecer en línea mientras está conectado
refresh_hours: 0 # reconectar cada N horas (0 = desactivado)
typing_indicator: true # mostrar "escribiendo…" y pausar antes de enviar
typing_max_seconds: 3 # tope de esa pausa (0 = enviar de inmediato)
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

## Quién puede disparar tus automatizaciones

Los mensajes entrantes llegan a Home Assistant como eventos
`new_whatsapp_message`, y las automatizaciones actúan sobre ellos. **Mientras no
haya ningún remitente en la lista, cualquiera que te escriba puede
dispararlas** — algo que importa si alguna automatización tuya hace cosas según
el texto del mensaje.

Abrí la pestaña **Incoming** del panel y agregá los remitentes que aceptás. Cada
chat de la pestaña **Groups & contacts** tiene además un botón **Allow**. Si
listás un grupo, aceptás todo lo que se publique ahí; si listás a una persona,
la aceptás en cualquier lado, grupos incluidos.

Los identificadores son la parte confusa. Para enviar usás un número de
teléfono. Al recibir, WhatsApp identifica cada vez más al remitente con un
**LID**: un id tipo `173478124720340@lid` que a propósito no revela su número.

No hace falta que lo averigües: **la pestaña Incoming lista a quienes te
escribieron recientemente, con un botón Allow**. Permitir un número de teléfono
cubre también el LID de esa persona, y al revés, porque se comparan las dos
formas de la misma identidad.

También podés sembrar la lista desde las opciones del add-on, cómodo para una
instalación nueva:

```yaml
allowed_senders:
  - "34600000000"
  - 120363000000000000@g.us
```

La opción sólo siembra la lista en el primer arranque; después manda el panel,
así que editarla no requiere reiniciar el add-on.

## Node-RED

No hace falta la API HTTP ni un token: el add-on registra servicios y eventos
normales de Home Assistant, así que Node-RED se comunica por su conexión
websocket como con cualquier otra integración.

**Para enviar**, usá un nodo **call service** con `whatsapp` como dominio y
`send_message` o `send_media` como servicio. Si `send_media` no aparece en la
lista, reiniciá Home Assistant Core y recargá la pestaña de Node-RED: la lista
de servicios queda cacheada.

**Para recibir**, usá un nodo **events: all** con el tipo de evento
`new_whatsapp_message`, `whatsapp_message_ack` o `whatsapp_presence_update`.
Los datos del evento llegan en `msg.payload`.

La pestaña **Snippet builder** del panel genera ambos nodos en JSON: lo copiás,
apretás `Ctrl+I` en Node-RED y lo pegás para importar el nodo ya configurado.

La API HTTP sólo hace falta si llamás al add-on desde fuera de Home Assistant.

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

| Método | Ruta                                     | Para qué sirve                                       |
| ------ | ---------------------------------------- | ---------------------------------------------------- |
| `GET`  | `/health`                                | Versión y estado de conexión por cliente (sin token) |
| `GET`  | `/api/v1/clients`                        | Lista de clientes y su estado                        |
| `GET`  | `/api/v1/clients/:id`                    | Estado de un cliente                                 |
| `POST` | `/api/v1/clients/:id/messages`           | Enviar un mensaje; devuelve su `messageId`           |
| `GET`  | `/api/v1/clients/:id/chats`              | Listar grupos y contactos con sus IDs                |
| `GET`  | `/api/v1/allowlist`                      | Remitentes que pueden disparar eventos               |
| `PUT`  | `/api/v1/allowlist`                      | Reemplazar esa lista                                 |
| `GET`  | `/api/v1/clients/:id/avatar/:jid`        | Foto de perfil de un chat                            |
| `POST` | `/api/v1/clients/:id/media`              | Enviar una captura o clip de cámara                  |
| `GET`  | `/api/v1/clients/:id/qr`                 | Código QR actual (`?format=png` para la imagen)      |
| `POST` | `/api/v1/clients/:id/pairing-code`       | Pedir un código de 8 dígitos                         |
| `GET`  | `/api/v1/clients/:id/check/:phone`       | Comprobar si un número está en WhatsApp              |
| `POST` | `/api/v1/clients/:id/status`             | Cambiar el texto de estado del perfil                |
| `POST` | `/api/v1/clients/:id/presence`           | Enviar una actualización de presencia                |
| `POST` | `/api/v1/clients/:id/presence/subscribe` | Suscribirse a la presencia de un contacto            |
| `POST` | `/api/v1/clients/:id/restart`            | Reconectar el cliente                                |
| `POST` | `/api/v1/clients/:id/logout`             | Cerrar la sesión y volver a vincular                 |

Los endpoints de la v2 (`/sendMessage`, `/setStatus`, `/presenceSubscribe`,
`/sendPresenceUpdate`, `/sendInfinityPresenceUpdate`) siguen funcionando, con
el mismo formato de petición y respuesta, así que tus scripts actuales no se
rompen.

## Eventos

| Evento                     | Cuándo se dispara                        |
| -------------------------- | ---------------------------------------- |
| `new_whatsapp_message`     | Llega un mensaje                         |
| `whatsapp_presence_update` | Un contacto suscrito cambia de presencia |
| `whatsapp_message_ack`     | Un mensaje enviado se entrega o se lee   |

## Solución de problemas

**El código QR no aparece.** Abrí el panel de la barra lateral: el QR se
muestra ahí directamente. Si queda en _Waiting for a QR code_, revisá el log
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
