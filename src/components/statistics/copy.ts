import type { Language } from '@/lib/i18n/config';

const en = {
  assigned: '{count} of {total} completed tasks have a value',
  averageDescription: 'From creation to completion, across all finished work.',
  averageResolution: 'Average resolution time',
  backToBoard: 'Back to board',
  completedDescription: 'The full history, not only the latest board cards.',
  completedTasks: 'Completed tasks',
  days: '{count} days',
  emptyDescription: 'Complete a task to start measuring delivery pace.',
  emptyTitle: 'No completed work yet',
  heading: 'Statistics',
  hours: '{count} hours',
  minutes: '{count} minutes',
  multiSelectNote: 'One task can contribute to several options.',
  noPropertiesDescription:
    'Add a select or multi-select property to compare completed work.',
  noPropertiesTitle: 'No selectable properties',
  notAvailable: 'Not available',
  propertyBreakdowns: 'Completed tasks by property',
  propertyDescription:
    'Every selectable custom property becomes a live breakdown automatically.',
  propertyTracked: 'Selectable properties',
  shareOfCompleted: '{percentage}% of completed tasks',
  skipToStatistics: 'Skip to statistics',
  subtitle:
    'A clear view of delivery pace and how finished work is distributed.',
  tasks: 'tasks',
  unassigned: 'Unassigned',
} as const;

type StatisticsCopyKey = keyof typeof en;

const es: Record<StatisticsCopyKey, string> = {
  assigned: '{count} de {total} tareas terminadas tienen valor',
  averageDescription:
    'Desde la creación hasta la finalización de todo el trabajo terminado.',
  averageResolution: 'Tiempo medio de resolución',
  backToBoard: 'Volver al tablero',
  completedDescription:
    'Todo el historial, no solo las últimas tarjetas del tablero.',
  completedTasks: 'Tareas terminadas',
  days: '{count} días',
  emptyDescription:
    'Termina una tarea para empezar a medir el ritmo de entrega.',
  emptyTitle: 'Todavía no hay trabajo terminado',
  heading: 'Estadísticas',
  hours: '{count} horas',
  minutes: '{count} minutos',
  multiSelectNote: 'Una tarea puede contribuir a varias opciones.',
  noPropertiesDescription:
    'Añade una propiedad de selección única o múltiple para comparar.',
  noPropertiesTitle: 'No hay propiedades seleccionables',
  notAvailable: 'No disponible',
  propertyBreakdowns: 'Tareas terminadas por propiedad',
  propertyDescription:
    'Cada propiedad personalizada seleccionable genera su desglose automáticamente.',
  propertyTracked: 'Propiedades seleccionables',
  shareOfCompleted: '{percentage}% de las tareas terminadas',
  skipToStatistics: 'Saltar a las estadísticas',
  subtitle:
    'Una vista clara del ritmo de entrega y del reparto del trabajo terminado.',
  tasks: 'tareas',
  unassigned: 'Sin asignar',
};

const catalogs = { en, es } as const;

/** Formats a statistics message in the active application language. */
export function getStatisticsCopy(
  language: Language,
  key: StatisticsCopyKey,
  values: Readonly<Record<string, string | number>> = {},
): string {
  return catalogs[language][key].replace(
    /\{([A-Za-z][A-Za-z0-9_]*)\}/g,
    (placeholder, name: string) =>
      Object.prototype.hasOwnProperty.call(values, name)
        ? String(values[name])
        : placeholder,
  );
}
