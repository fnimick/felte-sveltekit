/* eslint-disable @typescript-eslint/no-explicit-any */
import { applyAction, deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { SubmitContext } from '@felte/core';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';

export type FailResponse = Omit<Response, 'ok'> & {
	ok: false;
};

export type SuccessResponse = Omit<Response, 'ok'> & {
	ok: true;
};

export type FetchResponse = SuccessResponse | FailResponse;

// The following is adapted from @felte/core/default-submit-handler

type Obj = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function createSubmitHandler<Data extends Obj>(submit: SubmitFunction = () => {}) {
	return async function onSubmit(_data: Data, context: SubmitContext<Data>) {
		const { form } = context;
		if (!form) return;

		const fallback_callback = async ({
			action,
			result,
			reset
		}: {
			action: URL;
			result: ActionResult;
			reset?: boolean;
		}) => {
			if (result.type === 'success') {
				if (reset !== false) {
					// CHANGE: call felte reset rather than form reset
					context.reset();
				}
				await invalidateAll();
			}

			// For success/failure results, only apply action if it belongs to the
			// current page, otherwise `form` will be updated erroneously
			if (
				location.origin + location.pathname === action.origin + action.pathname ||
				result.type === 'redirect' ||
				result.type === 'error'
			) {
				applyAction(result);
			}
		};

		const data: FormData = new FormData(form);

		// TODO: update this to use `button.formaction` when
		// https://github.com/pablo-abc/felte/issues/227 is resolved
		// We do cloneNode for avoid DOM clobbering - https://github.com/sveltejs/kit/issues/7593
		const action = new URL(
			(HTMLFormElement.prototype.cloneNode.call(form) as HTMLFormElement).action
		);

		const formId: string | undefined = (
			HTMLFormElement.prototype.cloneNode.call(form) as HTMLFormElement
		).formId;
		if (formId == null) {
			throw new Error("Missing formId necessary for 'felte-sveltekit' form");
		}

		data.append('formId', formId);

		const method =
			form.method.toLowerCase() === 'get'
				? 'get'
				: action.searchParams.get('_method') || form.method;
		let enctype = form.enctype;

		if (form.querySelector('input[type="file"]')) {
			enctype = 'multipart/form-data';
		}

		let fetchOptions: RequestInit;

		if (method === 'get') {
			// convert FormData files to URLSearchParams strings per
			// https://github.com/microsoft/TypeScript/issues/30584#issuecomment-890515551
			data.forEach((value, key) => {
				action.searchParams.append(key, typeof value === 'string' ? value : value.name);
			});
			fetchOptions = { method, headers: { Accept: 'application/json' } };
		} else {
			fetchOptions = {
				method,
				body: data,
				headers: {
					// If `Content-Type` is set on multipart/form-data, boundary will be missing
					// See: https://github.com/pablo-abc/felte/issues/165
					...(enctype !== 'multipart/form-data' && {
						'Content-Type': enctype
					}),
					Accept: 'application/json',
					'x-sveltekit-action': 'true'
				}
			};
		}

		const controller = new AbortController();
		let cancelled = false;
		const cancel = () => (cancelled = true);

		const callback =
			(await submit({
				action,
				cancel,
				controller,
				data,
				form
			})) ?? fallback_callback;
		if (cancelled) return;

		let result: ActionResult;

		try {
			const response: FetchResponse = await window.fetch(action.toString(), {
				...fetchOptions,
				signal: controller.signal
			});

			result = deserialize(await response.text());
			if (result.type === 'error') result.status = response.status;
		} catch (error: any) {
			if (error?.name === 'AbortError') return;
			result = { type: 'error', error };
		}

		callback({
			action,
			form,
			update: (opts) => fallback_callback({ action, result, reset: opts?.reset }),
			result
		});
	};
}
