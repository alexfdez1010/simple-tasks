/** A disposable task used only by the explicitly labelled interface prototypes. */
export type PreviewTask = {
  id: number;
  title: string;
  description: string;
  owner: string;
  state: 'todo' | 'working' | 'done';
  dependencies: number[];
};

export const PREVIEW_OWNERS = [
  'Alejandro',
  'Agente de desarrollo',
  'Agente de revisión',
];
export const PREVIEW_TASKS: PreviewTask[] = [
  {
    id: 101,
    title: 'Definir el acceso por invitación',
    description:
      'Concretar quién puede invitar, la caducidad del enlace y el comportamiento al aceptar. Entregar los criterios de aceptación.',
    owner: 'Alejandro',
    state: 'done',
    dependencies: [],
  },
  {
    id: 102,
    title: 'Preparar el modelo de invitaciones',
    description:
      'Implementar la persistencia y las reglas de caducidad. Conservar el acceso de las personas existentes.',
    owner: 'Agente de desarrollo',
    state: 'working',
    dependencies: [101],
  },
  {
    id: 103,
    title: 'Diseñar el correo de bienvenida',
    description:
      'Preparar el contenido y la plantilla del correo, incluyendo una alternativa de texto accesible.',
    owner: 'Alejandro',
    state: 'todo',
    dependencies: [101],
  },
  {
    id: 104,
    title: 'Implementar la aceptación',
    description:
      'Crear el recorrido desde el enlace hasta el acceso. Verificar enlaces caducados, usados e inválidos.',
    owner: 'Agente de desarrollo',
    state: 'todo',
    dependencies: [102, 103],
  },
  {
    id: 105,
    title: 'Revisar permisos y casos límite',
    description:
      'Revisar la implementación y entregar los hallazgos con evidencia reproducible.',
    owner: 'Agente de revisión',
    state: 'todo',
    dependencies: [104],
  },
  {
    id: 106,
    title: 'Validar el recorrido completo',
    description:
      'Probar la invitación y decidir si el resultado cumple los criterios acordados.',
    owner: 'Alejandro',
    state: 'todo',
    dependencies: [105],
  },
];

/** Resolves unfinished prerequisites from the current in-memory example snapshot. */
export function pendingDependencies(
  task: PreviewTask,
  tasks: PreviewTask[],
): PreviewTask[] {
  return tasks.filter(
    (candidate) =>
      task.dependencies.includes(candidate.id) && candidate.state !== 'done',
  );
}

/** Labels a task's actual state, deriving dependency blocking instead of storing it. */
export function previewState(task: PreviewTask, tasks: PreviewTask[]): string {
  if (task.state === 'done') return 'Terminada';
  if (task.state === 'working') return 'En curso';
  return pendingDependencies(task, tasks).length
    ? 'En espera'
    : 'Lista para empezar';
}
