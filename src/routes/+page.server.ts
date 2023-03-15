import { validatedAction } from '$lib/server/validatedFormAction';
import { userSchema } from './schema';
import { fail } from '@sveltejs/kit';

export const actions = {
  default: validatedAction(
    'demoForm',
    userSchema,
    ({
      data: {
        name,
        email,
        other: { age }
      },
      wrapResult
    }) => {
      if (email.includes('spam')) {
        // You can manually assign to fieldErrors to indicate to the user that
        // there is a problem with a specific field that cannot be detected in
        // validation; e.g. username in use
        return fail(400, wrapResult({ fieldErrors: { email: ['Email cannot contain spam.'] } }));
      }

      // Return data to the client, with additional data for server rendering.
      // `data` can be any type, and `formMessage` is a structured type for
      // displaying form-level errors and other similar messages.
      return wrapResult({
        result: { status: 'created' },
        formMessage: { message: `User ${name} created with age ${age}`, type: 'success' }
      });
    },
    // Exclude email from returned values
    { valueExcludeFields: new Set(['email']) }
  )
};
