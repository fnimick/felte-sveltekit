import { validatedAction } from '$lib/server/validatedFormAction';
import { userSchema } from './schema';
import { fail } from '@sveltejs/kit';

export const actions = {
  default: validatedAction(
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
        // validation; e.g. username in use. By default, `wrapResult` reflects
        // values back to the client, to allow form fields to be prefilled in
        // the event that only one field is in error.
        return fail(400, wrapResult({ fieldErrors: { email: ['Email cannot contain spam.'] } }));
      }

      // Return data to the client, without reflecting values since we want the
      // form to be reset. `result` can be any type, and `formMessage` is a
      // structured type for displaying form-level errors and other similar
      // messages.
      return wrapResult({
        result: { status: 'created' },
        formMessage: {
          title: 'Creation successful',
          message: `User ${name} created with age ${age}`,
          type: 'success'
        },
        values: {}
      });
    },
    // Exclude email from returned values
    { valueExcludeFields: new Set(['email']) }
  )
};
