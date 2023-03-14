import { type Action, fail, type RequestEvent } from '@sveltejs/kit';
import { z, type ZodTypeAny } from 'zod';

import type { ValidatedActionData, ValidatorFailArgs } from '../types';

function filterFormDataValues<T, U extends z.ZodTypeDef>(
	formData: FormData,
	valueExcludeFields: Set<keyof z.infer<z.Schema<T, U, unknown>>>
) {
	return Object.fromEntries(
		Array.from(formData).filter(([key]) => !valueExcludeFields.has(key as keyof T))
	);
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
			values: filterFormDataValues(formData, valueExcludeFields),
			errors: undefined
		};
	} catch (err) {
		if (!(err instanceof z.ZodError)) throw err;
		return {
			data: undefined,
			values: filterFormDataValues(formData, valueExcludeFields),
			errors: Object.fromEntries(
				Object.entries(err.formErrors.fieldErrors).map(([key, value]) => [
					key,
					value ? value[0] : null
				])
			)
		};
	}
}

export interface ValidateOptions<T extends ZodTypeAny> {
	valueExcludeFields?: Set<keyof z.infer<T>>;
}

export function validatedAction<T extends ZodTypeAny>(
	formId: string,
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
		console.log(formData);

		const { data, errors, values } = await validateFormDataAsync(schema, formData, options);

		if (errors) return fail(400, { values, fieldErrors: errors });

		const actionResult = await action(
			{
				data,
				wrapResult: (args) => ({
					values: filterFormDataValues(formData, valueExcludeFields),
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
