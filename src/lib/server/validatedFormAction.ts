import { _update, type AssignableErrors } from '@felte/core';
import { type Action, fail, type RequestEvent } from '@sveltejs/kit';
import { z, type ZodError, type ZodTypeAny } from 'zod';
import { preprocessFormData } from 'zod-form-data';

import { FELTE_FORM_ID, type ValidatedActionData, type ValidatorFailArgs } from '../types';

// Old function used for filtering raw FormData entries. No longer used now that
// we have nested values.
// function filterFormDataValues<T extends ZodTypeAny>(
// formData: FormData, valueExcludeFields: Set<keyof z.infer<T>>
// ) {
//  return Object.fromEntries( Array.from(formData).filter(([key]) =>
//    !valueExcludeFields.has(key as keyof T))
//  );
// }

function filterDataValues<T extends ZodTypeAny>(
  data: Partial<z.infer<T>>,
  valueExcludeFields: Set<keyof z.infer<T>>
) {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !valueExcludeFields.has(key as keyof T))
  );
}

// This function is taken from @felte/validator-zod
function shapeErrors<T extends ZodTypeAny>(errors: ZodError): AssignableErrors<z.infer<T>> {
  return errors.issues.reduce((err, value) => {
    /* istanbul ignore next */
    if (!value.path) return err;
    return _update(err, value.path.join('.'), (currentValue: undefined | string[]) => {
      if (!currentValue || !Array.isArray(currentValue)) return [value.message];
      return [...currentValue, value.message];
    });
  }, {} as AssignableErrors<T>);
}

export async function validateFormDataAsync<T extends ZodTypeAny>(
  schema: T,
  formData: FormData,
  options: ValidateOptions<T> = {}
) {
  const { valueExcludeFields = new Set() } = options;
  try {
    const data = await schema.parseAsync(formData);

    return {
      data,
      values: filterDataValues(
        preprocessFormData(formData) as Partial<z.infer<T>>,
        valueExcludeFields
      ),
      errors: undefined
    };
  } catch (err) {
    if (!(err instanceof z.ZodError)) throw err;
    return {
      data: undefined,
      values: filterDataValues(
        preprocessFormData(formData) as Partial<z.infer<T>>,
        valueExcludeFields
      ),
      errors: shapeErrors(err)
    };
  }
}

export interface ValidateOptions<T extends ZodTypeAny> {
  valueExcludeFields?: Set<keyof z.infer<T>>;
}

export function validatedAction<T extends ZodTypeAny>(
  schema: T,
  action: (
    args: {
      data: z.infer<T>;
      wrapResult: (args: ValidatorFailArgs<T>) => ValidatedActionData<T>;
    },
    event: RequestEvent
  ) => ReturnType<Action>,
  options: ValidateOptions<T> = {}
) {
  const { valueExcludeFields = new Set() } = options;
  return async (event: RequestEvent) => {
    const formData = await event.request.formData();
    const formId = formData.get(FELTE_FORM_ID);
    if (formId == null || typeof formId !== 'string') {
      throw new Error('Form ID not provided or was not a string.');
    }

    const { data, errors, values } = await validateFormDataAsync(schema, formData, options);

    if (errors) return fail(400, { values, fieldErrors: errors, formId });

    const actionResult = await action(
      {
        data,
        wrapResult: (args) => ({
          values: filterDataValues(
            preprocessFormData(formData) as Partial<z.infer<T>>,
            valueExcludeFields
          ),
          ...args,
          formId
        })
      },
      event
    );

    if (actionResult) {
      if (!('formId' in actionResult) && !('formId' in actionResult.data)) {
        throw new Error('Missing formId in action result');
      }
      return actionResult;
    }
  };
}
