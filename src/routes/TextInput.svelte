<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { fly } from 'svelte/transition';

  interface $$Props extends HTMLInputAttributes {
    name: string;
    className?: string | undefined;
    error?: string | string[] | null | undefined;
    'data-cy'?: string;
  }

  export let name: string;
  export let error: string | string[] | null | undefined = undefined;
</script>

<div class="form-control">
  {#if $$slots.label}
    <label class="label" for={name}><slot name="label" /></label>
  {/if}
  <input
    id={name}
    {name}
    type="text"
    aria-describedby={`${name}_err`}
    {...$$restProps}
    on:change
    on:input
  />
  <div class="mt-1 min-h-[1.5em]">
    {#if error}
      <p class="text-sm text-error-500" transition:fly|local={{ y: 5 }}>
        {error}
      </p>
    {/if}
  </div>
  <slot name="content" />
</div>
