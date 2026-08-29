import { z } from 'zod';

export const idSchema = z.string().trim().min(1).max(191);
export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Usa un color hexadecimal de seis dígitos.');
export const indexSchema = z.number().int().nonnegative();

/** Converts nullable date input into a valid Date or null. */
export function parseNullableDate(
  value: string | Date | null | undefined,
): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('La fecha no es válida.');
  return date;
}
