import { validatedAction } from '$lib/server/validatedFormAction';
import { userSchema } from './schema';
import { fail } from '@sveltejs/kit';

export const actions = {
	default: validatedAction('demoForm', userSchema, ({ data, wrapResult }) => {
		console.log(data);

		// return fail(400, wrapResult({ fieldErrors: { email: ['Email cannot contain spam.'] } }));
		return wrapResult({ actionData: 'yay' });
	})
};
