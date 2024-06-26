# Felte-Sveltekit: A simple validation connector for Felte + Sveltekit Form Actions (deprecated)

## DO NOT USE THIS LIBRARY - use superforms instead!

(https://superforms.rocks/)

[![npm](https://img.shields.io/npm/v/felte-sveltekit)](https://www.npmjs.com/package/felte-sveltekit)

## Feature List

- Symmetric server and client-side validation using [Zod](https://zod.dev)
- Support for error display on server-rendered pages (no JS required)
- Works with [zod-form-data](https://github.com/airjp73/remix-validated-form/tree/main/packages/zod-form-data) to coerce FormData into expected types; usable both on the client and the server
- Support for nested objects and arrays, provided by [Felte](https://felte.dev/docs/svelte/nested-forms)
- Support for dynamic forms, provided by [Felte](https://felte.dev/docs/svelte/dynamic-forms)
- Value filtering to avoid sending sensitive values such as passwords back to the client when operating without JS
- Ability to customize pre- and post-submission events using the standard `SubmitFunction` interface from `use:enhance`
- Automatic subscription cleanup on form unmounting - no need to manually pass an `unsubscribe` hook to `onDestroy`

## Installation

```
(p)npm i -D felte-sveltekit felte zod zod-form-data @felte/core @felte/validator-zod
```

## Example

Let's build a form which prompts a user for name, email, and age. As a
demonstration of nested form ability, we'll put age in a sub-object.

Start by defining a schema which can be imported in both your route and your server action:

**src/routes/schema.ts**

```ts
import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const userSchema = zfd.formData({
  name: z.string().min(2).regex(/^A.*$/, { message: 'Name must start with A' }),
  email: z
    .string()
    .email()
    .refine((email) => !email.includes('spam'), {
      message: 'Email cannot contain spam.'
    }),
  other: z.object({
    age: zfd.numeric()
  })
});
```

Then, define a server action which consumes this schema.

**src/routes/+page.server.ts**

```ts
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
```

Then, in the client, create a corresponding form. The form id (in this case
`demoForm`) is important and should be unique. It is used to make sure that
updates to `$page.form` are consumed only by the appropriate `ValidatedForm`
instance.

Please note that the form id must be provided both to `createValidatedForm`, to
allow it to load result data when running in SSR (where form binding does not
occur and we cannot read data from the hidden input) and also in a hidden input
in the `<form>` itself, to ensure that it is sent to the server even when
clients have Javascript disabled.

**src/routes/+page.svelte**

```svelte
<script lang="ts">
  import { createValidatedForm, FELTE_FORM_ID } from 'felte-sveltekit/client';
  import { SuperDebug } from 'felte-sveltekit/client/SuperDebug.svelte';

  import { page } from '$app/stores';
  import { userSchema } from './schema';

  const { form, data, errors, message, result, isSubmitting } = createValidatedForm(
    'demoForm',
    userSchema,
    undefined,
    {
      submit:
        () =>
        ({ update }) => {
          update({ reset: false });
        }
    }
  );
</script>

<SuperDebug data={{ $data, $errors, page: $page.form }} />

<form method="POST" use:form>
  <!-- Include the form id as a hidden input to ensure it's sent in the FormData
  regardless of client javascript -->
  <input name={FELTE_FORM_ID} type="hidden" value="demoForm" />
  <label for="name">Name</label>
  <input id="name" name="name" type="text" value={$data.name ?? ''} />
  {#if $errors.name}
    <p id="name-error">{$errors.name.join(', ')}</p>
  {/if}

  <label for="email">Email</label>
  <input id="email" name="email" type="email" value={$data.email ?? ''} />
  {#if $errors.email}
    <p id="email-error">{$errors.email.join(', ')}</p>
  {/if}

  <label for="age">Age</label>
  <!-- Notice the namespaced name here -->
  <input id="age" name="other.age" type="number" value={$data.other?.age ?? ''} />
  {#if $errors.other?.age}
    <p id="age-error">{$errors.other.age.join(', ')}</p>
  {/if}
  <button type="submit" disabled={$isSubmitting}>Submit</button>
</form>

{#if $message}
  <p>{$message.message}</p>
{/if}

{#if $result}
  Result: <pre>{JSON.stringify($result)}</pre>
{/if}
```

## Common use-cases

### Disabling reset after submission

To disable reset of form after submission, provide a `SubmitHandler` just like you would to `use:enhance`:

```ts
const { form, errors, message, isSubmitting, data } = createValidatedForm(
  'demoForm',
  userSchema,
  undefined,
  {
    submit:
      () =>
      ({ update }) => {
        update({ reset: false });
      }
  }
);
```

The `SubmitHandler` can also be used to insert pre- and post-submission hooks.

### Providing default data

Default data can be provided either directly in the `value` attribute of the input, or by providing values to `initialValues` in felte options.

## Important Notes

All options as outlined in the [Felte documentation](https://felte.dev/docs/svelte/getting-started) are valid, save for `onSubmit`, `onSuccess`, and `onError`. For this functionality, use the `SubmitHandler`.

## Caveats

- Value filtering only works at the top level of the schema, for now. Suggestions for an improvement to `valueExcludeFields` are welcome.

## Appreciation and Thanks

Inspired by:

- [sveltekit-superforms](https://github.com/ciscoheat/sveltekit-superforms)
- [remix-validated-form](https://www.remix-validated-form.io/)
- [svelte-form-helper](https://github.com/CaptainCodeman/svelte-form-helper)
