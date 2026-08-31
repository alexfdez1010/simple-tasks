import type { AutomationRepository } from '@/lib/automations/repository';
import type {
  AutomationDefinition,
  CreateAutomationInput,
  UpdateAutomationInput,
} from '@/lib/automations/types';
import { idSchema } from '@/lib/validation/common';
import { automationSchema } from '@/lib/automations/validation';

/** Application service for status-transition automation rules. */
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
    return this.repository.create(parsed as CreateAutomationInput);
  }

  /** Validates and updates one automation. */
  update(input: UpdateAutomationInput): Promise<AutomationDefinition> {
    const parsed = automationSchema.parse(input);
    return this.repository.update(parsed as UpdateAutomationInput);
  }

  /** Deletes one validated automation. */
  delete(id: string): Promise<void> {
    return this.repository.delete(idSchema.parse(id));
  }
}
