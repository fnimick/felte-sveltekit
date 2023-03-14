import { validatedAction } from '$lib/server/validatedFormAction';
import { userSchema } from './schema';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: validatedAction('demoForm', userSchema, ({ data: { name, email }, wrapResult }) => {
		// throw redirect(302, '/');
		return fail(400, wrapResult({ fieldErrors: { email: ['Email cannot contain spam.'] } }));
	})
};
