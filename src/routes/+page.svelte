<script lang="ts">
  import { createValidatedForm, FELTE_FORM_ID } from '$lib/client';
  import SuperDebug from '$lib/client/SuperDebug.svelte';

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

{#if $message?.title}
  <h3>{$message.title}</h3>
{/if}

{#if $message?.message}
  <p>{$message.message}</p>
{/if}

{#if $result}
  Result: <pre>{JSON.stringify($result)}</pre>
{/if}

<a href="/other">Unmount form.</a>
