import type { Language } from '@/lib/i18n/config';
import { translate, type TranslationKey } from '@/lib/i18n/translations';

const ERROR_KEYS = {
  'A property with that name already exists.': 'error.duplicateProperty',
  'Delete existing values before changing the property type.':
    'error.propertyTypeChange',
  'Each property may appear only once.': 'error.duplicatePropertyValue',
  'Move or delete the tasks before deleting the status.':
    'error.statusTasksBeforeDelete',
  'One or more properties does not exist.': 'error.propertiesNotFound',
  'Options must be unique.': 'error.optionsUnique',
  'Selected options must be unique.': 'error.selectedOptionsUnique',
  'Selection properties require options.': 'error.selectionRequiresOptions',
  'Status and position must be provided together.':
    'error.statusPositionTogether',
  'Terminal statuses are ordered by completion time.':
    'error.taskTerminalOrder',
  'The board must keep at least one status.': 'error.statusMinimum',
  'The date is invalid.': 'error.dateInvalid',
  'The new options would remove values that are in use.':
    'error.propertyOptionsInUse',
  'The operation could not be completed.': 'error.operationFailed',
  'The order must include every property exactly once.': 'error.propertyOrder',
  'The order must include every status exactly once.': 'error.statusOrder',
  'The order must include every task in the status exactly once.':
    'error.taskOrder',
  'The property does not exist.': 'error.propertyNotFound',
  'The property value does not exist.': 'error.propertyValueNotFound',
  'The session has expired.': 'error.sessionExpired',
  'The status does not exist.': 'error.statusNotFound',
  'The stored property options are invalid.': 'error.storedOptionsInvalid',
  'The stored property value is invalid.': 'error.storedValueInvalid',
  'The submitted data is invalid.': 'error.invalidSubmission',
  'The task does not exist.': 'error.taskNotFound',
  'This property type does not support options.': 'error.typeNoOptions',
  'Use a six-digit hexadecimal color.': 'error.colorFormat',
} as const satisfies Readonly<Record<string, TranslationKey>>;

const PROPERTY_LIMIT_PATTERN =
  /^The board supports at most (\d+) properties\.$/;

/**
 * Localizes a safe domain-boundary error without coupling domain services to UI copy.
 *
 * @param language - Active application language for the current request.
 * @param message - Sanitized English boundary message from the domain layer.
 * @returns A localized known message, or the original safe message when unknown.
 */
export function translateErrorMessage(
  language: Language,
  message: string,
): string {
  const key = ERROR_KEYS[message as keyof typeof ERROR_KEYS];
  if (key) return translate(language, key);

  const propertyLimit = PROPERTY_LIMIT_PATTERN.exec(message);
  if (propertyLimit?.[1]) {
    return translate(language, 'error.propertyLimit', {
      count: propertyLimit[1],
    });
  }
  return message;
}
