/** Documentation labels describe the same contract in English and Spanish. */
export const webhookDocsCopy = {
  en: {
    title: 'Task webhooks',
    back: 'Back to Connections',
    intro:
      'One destination, all task events. Configure the public HTTPS URL in Connections and save it before sending a test.',
    setup: 'Set up your receiver',
    steps: [
      'Accept POST requests with a JSON body and return any 2xx response within five seconds.',
      'Copy the signing secret from Connections and verify the raw request body before processing it.',
      'Send a test, inspect its result and then create, edit, move or delete a task.',
    ],
    events: 'Events',
    event: 'Event',
    meaning: 'When it is sent',
    meanings: [
      'A task is created, including directly in a terminal state.',
      'A task is edited, reordered or its custom property value changes.',
      'A task changes workflow state; includes previousStatusId.',
      'A task is deleted; includes its last complete snapshot.',
      'You request a test; data.task is null and no task is changed.',
    ],
    payload: 'Example payload',
    payloadHelp:
      'Example values. schemaVersion is 1. id stays the same across retries; occurredAt is the event time. data.task contains the committed task snapshot, its status and named property values. On deletion, it contains the pre-deletion snapshot. previousStatusId is null except for a state change.',
    signatures: 'Verify the signature',
    signatureHelp:
      'Read X-Simple-Tasks-Timestamp, X-Simple-Tasks-Signature, X-Simple-Tasks-Id and X-Simple-Tasks-Event. The signature is v1= followed by the HMAC-SHA256 hex digest of timestamp + "." + the exact raw UTF-8 body, using your signing secret. Verify before JSON parsing; do not reserialize the body. The example below also rejects timestamps older or newer than five minutes.',
    delivery: 'Delivery and retries',
    deliveryHelp:
      'Events are queued in the same database transaction as task changes from the web, API or MCP. Sending happens after the response. Delivery is at least once, and events can arrive out of order: deduplicate by id and use task.updatedAt where applicable. Return 2xx after accepting the event durably; response bodies are ignored. Redirects are failures.',
    retryHelp:
      'There are five automatic attempts in total, with delays of 1 minute, 5 minutes, 30 minutes and 2 hours after failures. These are earliest eligibility times, not guaranteed delivery times. App activity drains up to five ready events after each response. During idle periods, call the dispatch endpoint periodically from your scheduler. Concurrent workers use expiring leases; interrupted sends may be repeated.',
    schedule: 'Process retries without app activity',
    scheduleHelp:
      'Call GET or POST /api/webhooks/dispatch with an existing read/write API token. Read-only tokens receive 403, missing/revoked tokens 401, and rate limits return 429. Each call processes at most five ready events. No new token storage or additional environment variable is required. Response: { data: { processed: number } }.',
    controls: 'Pause, change and inspect',
    controlsHelp:
      'Changing the URL or enabled state cancels queued events from the previous configuration; an already-sending request may still reach the old destination. Paused webhooks do not record new events. The signing secret stays the same. Test and Retry use saved settings; Retry retains the event id and payload and restarts the attempt budget. Delivery history shows the latest ten entries and retains terminal results for 14 days, cleaned during delivery processing.',
    limits: 'Destination and deployment requirements',
    limitsHelp:
      'Only public HTTPS on port 443, without URL credentials or fragments. All DNS answers must be public. Private, loopback, link-local and reserved destinations are blocked; validated addresses are pinned for sending and redirects are not followed. Task snapshots include descriptions and all populated custom properties: choose a trusted receiver. Keep AUTH_SECRET stable; it encrypts the database-backed signing secret. After-response delivery requires a host that supports Next.js after; the authenticated dispatch endpoint can also drain queued work.',
    scope: 'Scope',
    scopeHelp:
      'Events describe task mutations, including individual property-value changes. Configuring workflow states, property definitions or statistics does not itself emit a task event. No task history is replayed when enabling the webhook.',
  },
  es: {
    title: 'Webhooks de tareas',
    back: 'Volver a Conexiones',
    intro:
      'Un destino para todos los eventos de tareas. Configura la URL HTTPS pública en Conexiones y guárdala antes de enviar una prueba.',
    setup: 'Prepara el receptor',
    steps: [
      'Acepta peticiones POST con un cuerpo JSON y devuelve cualquier respuesta 2xx antes de cinco segundos.',
      'Copia el secreto de firma desde Conexiones y verifica el cuerpo original antes de procesarlo.',
      'Envía una prueba, consulta el resultado y después crea, edita, mueve o elimina una tarea.',
    ],
    events: 'Eventos',
    event: 'Evento',
    meaning: 'Cuándo se envía',
    meanings: [
      'Se crea una tarea, incluso directamente en un estado terminal.',
      'Se edita o reordena una tarea, o cambia uno de sus valores de propiedades.',
      'Una tarea cambia de estado; incluye previousStatusId.',
      'Se elimina una tarea; incluye su último estado completo.',
      'Solicitas una prueba; data.task es null y no se modifica ninguna tarea.',
    ],
    payload: 'Ejemplo de payload',
    payloadHelp:
      'Los valores son de ejemplo. schemaVersion es 1. id se mantiene entre reintentos; occurredAt indica cuándo ocurrió el evento. data.task contiene la tarea guardada, su estado y los valores de propiedades con nombre. Al eliminarla, incluye su estado anterior a la eliminación. previousStatusId es null salvo al cambiar de estado.',
    signatures: 'Verifica la firma',
    signatureHelp:
      'Lee X-Simple-Tasks-Timestamp, X-Simple-Tasks-Signature, X-Simple-Tasks-Id y X-Simple-Tasks-Event. La firma es v1= seguido del resumen hexadecimal HMAC-SHA256 de timestamp + "." + el cuerpo UTF-8 original, usando tu secreto de firma. Verifica antes de interpretar el JSON; no vuelvas a serializarlo. El ejemplo también rechaza marcas temporales con más de cinco minutos de diferencia.',
    delivery: 'Entrega y reintentos',
    deliveryHelp:
      'Los eventos se guardan en la misma transacción de base de datos que los cambios hechos desde la web, API o MCP. Se envían después de responder. La entrega es al menos una vez y los eventos pueden llegar desordenados: evita duplicados usando id y utiliza task.updatedAt cuando corresponda. Devuelve 2xx tras aceptar el evento de forma duradera; se ignora el cuerpo de la respuesta. Las redirecciones cuentan como fallos.',
    retryHelp:
      'Hay cinco intentos automáticos en total, con esperas de 1 minuto, 5 minutos, 30 minutos y 2 horas tras los fallos. Son tiempos mínimos, no horas de entrega garantizadas. La actividad de la app procesa hasta cinco eventos pendientes tras cada respuesta. Sin actividad, llama periódicamente al endpoint de envíos desde tu planificador. Los procesos concurrentes reservan cada envío temporalmente; un envío interrumpido puede repetirse.',
    schedule: 'Procesa reintentos sin actividad',
    scheduleHelp:
      'Llama a GET o POST /api/webhooks/dispatch con un token de API existente de lectura y escritura. Los tokens de solo lectura reciben 403; los ausentes o revocados, 401; y los límites de uso, 429. Cada llamada procesa como máximo cinco eventos listos. No hace falta otro almacenamiento de tokens ni una variable de entorno adicional. Respuesta: { data: { processed: number } }.',
    controls: 'Pausa, cambia y consulta',
    controlsHelp:
      'Cambiar la URL o la activación cancela los eventos en cola de la configuración anterior; un envío ya en curso aún puede llegar al destino anterior. En pausa no se registran eventos nuevos. El secreto de firma se mantiene. Prueba y Reintentar usan la configuración guardada; Reintentar conserva el id y el payload y reinicia el número de intentos. El historial muestra los diez envíos más recientes y conserva los resultados finales durante 14 días; se limpian al procesar envíos.',
    limits: 'Requisitos del destino y del despliegue',
    limitsHelp:
      'Solo HTTPS público en el puerto 443, sin credenciales ni fragmentos en la URL. Todas las respuestas DNS deben ser públicas. Se bloquean destinos privados, locales, reservados y de enlace local; el envío usa la dirección validada y no sigue redirecciones. Los eventos incluyen descripciones y propiedades: elige un receptor de confianza. Mantén AUTH_SECRET estable: cifra el secreto de firma almacenado en la base de datos. El envío tras responder requiere un host compatible con after de Next.js; el endpoint autenticado también permite procesar la cola.',
    scope: 'Alcance',
    scopeHelp:
      'Los eventos describen cambios en tareas, incluidos valores individuales de propiedades. Configurar estados, definiciones de propiedades o estadísticas no emite por sí mismo eventos de tareas. Activar el webhook no reenvía el historial anterior.',
  },
};
