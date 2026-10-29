import type { CoordinatedTask } from '@/lib/coordination/read-model';

/** Keeps periodic agent discovery compact; start_task/get_task return complete instructions and results. */
export function summarizeAgentWork(task: CoordinatedTask) {
  return {
    id: task.id,
    title: task.title,
    assigneeId: task.assigneeId,
    reviewerId: task.reviewerId,
    projectId: task.projectId,
    statusId: task.statusId,
    dueDate: task.dueDate,
    reviewState: task.reviewState,
  };
}
