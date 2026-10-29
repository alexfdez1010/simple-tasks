/** Localized setup guidance describes existing MCP/REST contracts without claiming connection health. */
export const connectionsCopy = {
  en: {
    back: 'Back to board',
    title: 'Connections',
    intro: 'Choose how to connect your tools to the same board',
    entries: [
      {
        href: '/skill',
        title: 'Connect an agent',
        description: 'Let your AI agent manage tasks through MCP',
        action: 'Set up an agent',
        steps: [
          'Download the skill and MCP configuration.',
          'Add the configuration and token to your agent.',
          'Ask your agent to list the board.',
        ],
      },
      {
        href: '/api-access',
        title: 'Connect an application',
        description: 'Use the REST API from your own tools and automations',
        action: 'Manage API access',
        steps: [
          'Create a named token with the permissions you need.',
          'Save the token; its complete value is shown once.',
          'Follow the API guide to make your first request.',
        ],
      },
    ],
  },
  es: {
    back: 'Volver al tablero',
    title: 'Conexiones',
    intro: 'Elige cómo conectar tus herramientas al mismo tablero',
    entries: [
      {
        href: '/skill',
        title: 'Conectar un agente',
        description:
          'Permite que tu agente de IA gestione tareas a través de MCP',
        action: 'Configurar un agente',
        steps: [
          'Descarga la skill y la configuración de MCP.',
          'Añade la configuración y el token a tu agente.',
          'Pide a tu agente que consulte el tablero.',
        ],
      },
      {
        href: '/api-access',
        title: 'Conectar una aplicación',
        description:
          'Usa la API REST desde tus herramientas y automatizaciones',
        action: 'Gestionar acceso a la API',
        steps: [
          'Crea un token con nombre y los permisos necesarios.',
          'Guarda el token; su valor completo se muestra una sola vez.',
          'Sigue la guía de la API para hacer tu primera petición.',
        ],
      },
    ],
  },
};
