import type { CoordinationRepository } from '@/lib/coordination/repository';
import {
  assigneeFields,
  deleteAssigneeSchema,
  deleteProjectSchema,
  projectFields,
  readyQuery,
  startTaskSchema,
  updateAssigneeSchema,
  updateProjectSchema,
} from '@/lib/coordination/schemas';
import type { z } from 'zod';

/** Shared application operations for dynamic ownership, projects and available agent work. */
export class CoordinationService {
  /** Injects the narrow persistence contract shared by all transports. */
  constructor(private readonly repository: CoordinationRepository) {}
  /** Returns configured humans and agents. */
  listAssignees() {
    return this.repository.listAssignees();
  }
  /** Validates and creates a responsible party. */
  createAssignee(input: z.input<typeof assigneeFields>) {
    return this.repository.createAssignee(assigneeFields.parse(input));
  }
  /** Validates partial changes to one responsible party. */
  updateAssignee(input: z.input<typeof updateAssigneeSchema>) {
    return this.repository.updateAssignee(updateAssigneeSchema.parse(input));
  }
  /** Validates an owner ID and deletes it only when no tasks or reviews refer to it. */
  deleteAssignee(input: z.input<typeof deleteAssigneeSchema>) {
    return this.repository.deleteAssignee(deleteAssigneeSchema.parse(input).id);
  }
  /** Returns all persisted project definitions. */
  listProjects() {
    return this.repository.listProjects();
  }
  /** Validates and creates a project. */
  createProject(input: z.input<typeof projectFields>) {
    return this.repository.createProject(projectFields.parse(input));
  }
  /** Validates a partial project edit. */
  updateProject(input: z.input<typeof updateProjectSchema>) {
    return this.repository.updateProject(updateProjectSchema.parse(input));
  }
  /** Validates project deletion and its optional transfer destination before persistence. */
  deleteProject(input: z.input<typeof deleteProjectSchema>) {
    return this.repository.deleteProject(deleteProjectSchema.parse(input));
  }
  /** Returns the consistent graph snapshot and its metadata. */
  snapshot() {
    return this.repository.snapshot();
  }
  /** Returns bounded work ready for an explicitly chosen responsible party. */
  ready(input: z.input<typeof readyQuery>) {
    return this.repository.ready(readyQuery.parse(input));
  }
  /** Revalidates and starts one task atomically for the requested responsible party. */
  start(input: z.input<typeof startTaskSchema>) {
    const parsed = startTaskSchema.parse(input);
    return this.repository.start(parsed.id, parsed.assigneeId);
  }
}
