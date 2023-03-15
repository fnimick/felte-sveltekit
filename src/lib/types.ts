import type { AssignableErrors } from '@felte/core';
import type { z, ZodTypeAny } from 'zod';

export interface FormMessage {
  message: string;
  code?: string | null;
  type?: 'success' | 'warning' | 'error';
}

export interface ValidatorFailArgs<T extends ZodTypeAny> {
  fieldErrors?: AssignableErrors<z.infer<T>>;
  formMessage?: FormMessage;
  result?: unknown;
  values?: Record<string, FormDataEntryValue>;
}

export interface ValidatedActionData<T extends ZodTypeAny>
  extends ValidatorFailArgs<T>,
    Record<string, unknown> {
  formId: string;
}

export function isValidatedResultForForm<T extends ZodTypeAny>(
  data: unknown,
  formId: string
): data is ValidatedActionData<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'formId' in data &&
    typeof data.formId === 'string' &&
    data.formId === formId
  );
}
