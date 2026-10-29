export const apiCopy = {
  en: {
    title: 'API access',
    intro: 'Connect your tools to the board with a token for each integration',
    back: 'Back to board',
    docs: 'API documentation',
    create: 'Create token',
    creating: 'Creating…',
    formTitle: 'A token for each connection',
    formHelp:
      'Name it after the tool that will use it. You can revoke it at any time.',
    name: 'Token name',
    placeholder: 'For example, personal automation',
    permission: 'Permissions',
    read: 'Read only',
    write: 'Read and write',
    readHelp: 'Read tasks, workflow and properties.',
    writeHelp: 'Create, edit and delete tasks, workflow and properties.',
    lifetime: 'No expiry. Valid until you revoke it.',
    list: 'Your tokens',
    empty: 'No tokens yet. Create one above to connect your first tool.',
    secretTitle: 'Save your token now',
    secretHelp:
      'This is the only time the complete token will be shown. Store it in your password manager or your integration’s secret storage.',
    secret: 'New API token',
    copy: 'Copy token',
    copied: 'Token copied',
    dismiss: 'I have saved it',
    clipboardError: 'Could not copy. Select and copy the token manually.',
    revoke: 'Revoke',
    revokeHeading: 'Revoke this token?',
    revokeBody:
      'Any integration using this token will lose access immediately. Create a new token to reconnect it.',
    revoked: 'Revoked',
    active: 'Active',
    never: 'Not used yet',
    created: 'Created',
    lastUsed: 'Last used',
    error: 'Could not save the change. Check your session and try again.',
    limitError:
      'You already have 25 active tokens. Revoke one before creating another.',
    revokedNotice:
      'Token revoked. Its integrations can no longer access the API.',
    referenceTitle: 'Start with one request',
    referenceHelp:
      'Use the token as a Bearer credential from your server or automation. Never include it in browser code.',
    limits: 'Usage limits',
    budget: '120 requests / minute per token',
    writes: 'Up to 30 writes / minute per token',
    global: '600 requests / minute for this instance',
    limitsHelp:
      'Limits reset each UTC minute. A 429 response includes Retry-After. The API returns up to 100 tasks per page, including the full completed history.',
    contract: 'Download OpenAPI',
    documentationIntro:
      'Connect your own tools to tasks, workflow and properties',
    authentication: 'Authentication',
    authHelp:
      'Create a token in API access. Send Authorization: Bearer YOUR_TOKEN with each request. Read-only tokens reject writes with 403. Revoked tokens return 401.',
    pagination: 'Pagination and filters',
    paginationHelp:
      'GET /tasks accepts limit (1–100, default 50), cursor, statusId, scope (all, active, completed), and search (title or description). Follow pagination.nextCursor with the same filters until hasMore is false. Results use stable ascending id order and include all completed tasks. Concurrent changes are visible between pages.',
    conventions: 'Requests and errors',
    conventionsHelp:
      'Send JSON with Content-Type: application/json (maximum 64 KiB). Unknown fields, repeated query parameters and invalid dates are rejected. Dates use ISO 8601 with a timezone. Success uses { data }; pages also include pagination. Deletes and reorders return 204 without a body. Errors use { error: { code, message, requestId, details? } }. Save X-Request-Id for troubleshooting.',
    behavior: 'Workflow rules',
    behaviorHelp:
      'Moving into a terminal status records completion; leaving clears it. Updates require statusId and index together to move. propertyValues replaces all values; use the single-value endpoint for one field. Reorders require every id exactly once. Terminal columns follow completion dates. Deleting a property removes its values and dependent statistics; only empty statuses can be deleted and one must remain. Tokens cannot manage other tokens. Statistics endpoints are excluded.',
    retry: 'Retries and security',
    retryHelp:
      'On 429, wait Retry-After seconds before retrying. Avoid blindly retrying creation after a timeout: requests have no idempotency keys. Use HTTPS and server-side secret storage. Browser cross-origin access is not enabled. Token hashes and shared rate budgets are stored in PostgreSQL.',
    endpoints: 'Endpoint reference',
    request: 'Request schema',
    response: 'Response schema',
    none: 'No request body.',
  },
  es: {
    title: 'Acceso a la API',
    intro:
      'Conecta tus herramientas al tablero con un token para cada integración',
    back: 'Volver al tablero',
    docs: 'Documentación de la API',
    create: 'Crear token',
    creating: 'Creando…',
    formTitle: 'Un token para cada conexión',
    formHelp:
      'Ponle el nombre de la herramienta que lo usará. Podrás revocarlo cuando quieras.',
    name: 'Nombre del token',
    placeholder: 'Por ejemplo, automatización personal',
    permission: 'Permisos',
    read: 'Solo lectura',
    write: 'Lectura y escritura',
    readHelp: 'Consultar tareas, estados y propiedades.',
    writeHelp: 'Crear, editar y eliminar tareas, estados y propiedades.',
    lifetime: 'Sin caducidad. Válido hasta que lo revoques.',
    list: 'Tus tokens',
    empty:
      'Todavía no hay tokens. Crea uno arriba para conectar tu primera herramienta.',
    secretTitle: 'Guarda el token ahora',
    secretHelp:
      'Esta es la única vez que se mostrará el token completo. Guárdalo en tu gestor de contraseñas o en el almacén de secretos de tu integración.',
    secret: 'Nuevo token de API',
    copy: 'Copiar token',
    copied: 'Token copiado',
    dismiss: 'Ya lo he guardado',
    clipboardError:
      'No se pudo copiar. Selecciona el token y cópialo manualmente.',
    revoke: 'Revocar',
    revokeHeading: '¿Revocar este token?',
    revokeBody:
      'Las integraciones que usen este token perderán el acceso de inmediato. Para reconectarlas tendrás que crear otro.',
    revoked: 'Revocado',
    active: 'Activo',
    never: 'Todavía sin uso',
    created: 'Creado',
    lastUsed: 'Último uso',
    error:
      'No se pudo guardar el cambio. Revisa tu sesión e inténtalo de nuevo.',
    limitError: 'Ya tienes 25 tokens activos. Revoca uno antes de crear otro.',
    revokedNotice:
      'Token revocado. Sus integraciones ya no pueden acceder a la API.',
    referenceTitle: 'Empieza con una petición',
    referenceHelp:
      'Envía el token como credencial Bearer desde tu servidor o automatización. No lo incluyas en código del navegador.',
    limits: 'Límites de uso',
    budget: '120 peticiones / minuto por token',
    writes: 'Hasta 30 escrituras / minuto por token',
    global: '600 peticiones / minuto en esta instancia',
    limitsHelp:
      'Los límites se reinician cada minuto UTC. La respuesta 429 incluye Retry-After. La API devuelve hasta 100 tareas por página e incluye todo el historial de tareas terminadas.',
    contract: 'Descargar OpenAPI',
    documentationIntro:
      'Conecta tus herramientas con las tareas, estados y propiedades',
    authentication: 'Autenticación',
    authHelp:
      'Crea un token en Acceso a la API. Envía Authorization: Bearer TU_TOKEN en cada petición. Los tokens de solo lectura rechazan escrituras con 403. Los revocados devuelven 401.',
    pagination: 'Paginación y filtros',
    paginationHelp:
      'GET /tasks acepta limit (1–100, 50 por defecto), cursor, statusId, scope (all, active, completed) y search (título o descripción). Usa pagination.nextCursor con los mismos filtros hasta que hasMore sea false. Los resultados siguen el orden ascendente de id e incluyen todas las tareas terminadas. Los cambios concurrentes son visibles entre páginas.',
    conventions: 'Peticiones y errores',
    conventionsHelp:
      'Envía JSON con Content-Type: application/json (máximo 64 KiB). Se rechazan campos desconocidos, parámetros repetidos y fechas inválidas. Las fechas usan ISO 8601 con zona horaria. Las respuestas usan { data }; las páginas añaden pagination. Las eliminaciones y reordenaciones devuelven 204 sin cuerpo. Los errores usan { error: { code, message, requestId, details? } }. Guarda X-Request-Id para consultar incidencias.',
    behavior: 'Reglas del tablero',
    behaviorHelp:
      'Al entrar en un estado terminal se registra la fecha de finalización; al salir se borra. Para mover al editar, envía statusId e index juntos. propertyValues sustituye todos los valores; usa el endpoint individual para cambiar solo uno. Las reordenaciones requieren cada id exactamente una vez. Los estados terminales siguen las fechas de finalización. Eliminar una propiedad borra sus valores y estadísticas dependientes; solo se eliminan estados vacíos y debe quedar al menos uno. Los tokens no pueden gestionar otros tokens. No se incluyen endpoints de estadísticas.',
    retry: 'Reintentos y seguridad',
    retryHelp:
      'Tras un 429, espera los segundos de Retry-After antes de reintentar. Evita repetir creaciones a ciegas tras un timeout: no hay claves de idempotencia. Usa HTTPS y guarda los secretos en el servidor. No se habilita acceso desde otros orígenes del navegador. Los hashes de los tokens y los contadores compartidos se guardan en PostgreSQL.',
    endpoints: 'Referencia de endpoints',
    request: 'Esquema de petición',
    response: 'Esquema de respuesta',
    none: 'Sin cuerpo de petición.',
  },
};
export type ApiCopy = typeof apiCopy.en;
