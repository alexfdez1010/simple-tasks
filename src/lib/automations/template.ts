/** Renders the date parameters supported by scheduled task templates. */
export function renderAutomationTemplate(
  template: string,
  scheduledAt: Date,
): string {
  const date = scheduledAt.toISOString().slice(0, 10);
  const datetime = scheduledAt.toISOString();
  return template
    .replaceAll('{{date}}', date)
    .replaceAll('{{datetime}}', datetime);
}

/** Calculates a generated task's due date from its scheduled date and offset. */
export function getScheduledDueDate(
  scheduledAt: Date,
  offsetDays: number | null,
): Date {
  const dueDate = new Date(scheduledAt);
  dueDate.setUTCDate(dueDate.getUTCDate() + (offsetDays ?? 0));
  return dueDate;
}
