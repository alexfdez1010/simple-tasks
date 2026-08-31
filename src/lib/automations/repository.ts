import type {
  AutomationDefinition,
  CreateAutomationInput,
  UpdateAutomationInput,
} from '@/lib/automations/types';

/** Persistence boundary for status-transition and scheduled automation rules. */
export interface AutomationRepository {
  /** Returns rules in stable creation order. */
  list(): Promise<AutomationDefinition[]>;
  /** Validates and creates a rule. */
  create(input: CreateAutomationInput): Promise<AutomationDefinition>;
  /** Validates and updates a rule. */
  update(input: UpdateAutomationInput): Promise<AutomationDefinition>;
  /** Deletes a rule by identifier. */
  delete(id: string): Promise<void>;
  /** Executes due one-shot rules and returns the number of generated tasks. */
  runDue(now?: Date): Promise<number>;
}
