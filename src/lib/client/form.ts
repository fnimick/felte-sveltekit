import type {
	Form,
	FormConfigWithoutTransformFn,
	KnownHelpers,
	KnownStores,
	Obj,
	Paths
} from '@felte/core';
import { validator } from '@felte/validator-zod';
import { createForm } from 'felte';
import type { z, ZodTypeAny } from 'zod';

import { writable, type Readable } from 'svelte/store';

import type { SubmitFunction } from '$app/forms';
import { page } from '$app/stores';
import { isValidatedResultForForm, type FormMessage } from '$lib/types';
import { createSubmitHandler } from './createSubmitHandler';

export type CreateFormResult<Data extends Obj> = Form<Data> &
	KnownHelpers<Data, Paths<Data>> &
	KnownStores<Data>;

export type ValidatedForm<T extends ZodTypeAny> = CreateFormResult<z.infer<T>> & {
	message: Readable<FormMessage | undefined>;
};

export interface ValidatedFormOptions {
	submit?: SubmitFunction;
}

export function createValidatedForm<T extends ZodTypeAny>(
	formId: string,
	schema: T,
	{
		extend,
		...config
	}: Exclude<FormConfigWithoutTransformFn<z.infer<T>>, 'onSubmit' | 'onSuccess' | 'onError'> = {},
	{ submit }: ValidatedFormOptions = {}
): ValidatedForm<T> {
	const message = writable<FormMessage | undefined>();

	const { form: formInternal, ...createFormResult } = createForm<z.infer<T>>({
		onSubmit: createSubmitHandler<z.infer<T>>(submit),
		extend: [
			validator({ schema }),
			...(extend == null ? [] : Array.isArray(extend) ? extend : [extend])
		],
		...config
	});

	function form(node: HTMLFormElement) {
		const formInternalAction = formInternal(node);

		const unsubscribe = page.subscribe(({ form }) => {
			if (isValidatedResultForForm<T>(form, formId)) {
				// Typescript can't prove that empty object is assignable to the error
				// store, but it is.
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				createFormResult.setErrors(form.fieldErrors ?? ({} as any));
				message.set(form.formMessage);
			}
		});

		return {
			destroy: () => {
				formInternalAction.destroy();
				unsubscribe();
			}
		};
	}

	return { form, ...createFormResult, message };
}
