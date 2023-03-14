<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { createValidatedForm } from '$lib';
	import SuperDebug from '$lib/client/SuperDebug.svelte';
	import { userSchema } from './schema';
	import TextInput from './TextInput.svelte';
	const { form, errors, isSubmitting } = createValidatedForm('demoForm', userSchema);
</script>

<SuperDebug data={{ $errors, page: $page.form }} />

<form method="POST" use:form class="flex w-full max-w-lg flex-col gap-y-5 p-2 lg:p-4">
	<TextInput
		name="name"
		error={browser ? $errors.name : $page.form?.fieldErrors?.username}
		value={browser ? undefined : $page.form?.values?.username}
	>
		<svelte:fragment slot="label">Name</svelte:fragment></TextInput
	>
	<TextInput
		name="email"
		error={browser ? $errors.email : $page.form?.fieldErrors?.password}
		value={browser ? undefined : $page.form?.values?.password}
		><svelte:fragment slot="label">Email</svelte:fragment></TextInput
	>
	<div class="flex items-center justify-between">
		<button
			type="submit"
			class="btn variant-filled-primary"
			disabled={$isSubmitting}
			data-cy="loginpage-button-submit">Submit</button
		>
	</div>
</form>
