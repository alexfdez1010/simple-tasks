import type { AutomationRepository } from '@/lib/automations/repository';
import type {
  AutomationDefinition,
  CreateAutomationInput,
  UpdateAutomationInput,
} from '@/lib/automations/types';
import { idSchema } from '@/lib/validation/common';
import { automationSchema } from '@/lib/automations/validation';
import { normalizeAutomationInput } from '@/lib/automations/normalization';

/** Application service for status-transition and scheduled automation rules. */
export class AutomationService {
  /** Injects the persistence abstraction. */
  constructor(private readonly repository: AutomationRepository) {}

  /** Returns all configured rules. */
  list(): Promise<AutomationDefinition[]> {
    return this.repository.list();
  }

  /** Validates and creates one automation. */
  create(input: CreateAutomationInput): Promise<AutomationDefinition> {
    const parsed = automationSchema.parse(input);
    return this.repository.create(
      normalizeAutomationInput(parsed as CreateAutomationInput),
    );
  }

  /** Validates and updates one automation. */
  update(input: UpdateAutomationInput): Promise<AutomationDefinition> {
    const parsed = automationSchema.parse(input);
    return this.repository.update(
      normalizeAutomationInput(parsed as UpdateAutomationInput),
    );
  }

  /** Deletes one validated automation. */
  delete(id: string): Promise<void> {
    return this.repository.delete(idSchema.parse(id));
  }

  /** Runs due one-shot rules before a board read. */
  runDue(now?: Date): Promise<number> {
    return this.repository.runDue(now);
  }
}
