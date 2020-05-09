<script>
  export let id
  export let editing
  export let field
  export let value
  let fieldvalue

  import { updateMeta } from './orthanc.js'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  let input
  $: if (input && field.first) input.focus()

  function saveField() {
    let savevalue = value
    updateMeta(id, { name: field.name, value: savevalue }).then(d => {
      dispatch('updated')
      fieldvalue = savevalue
    })
  }

</script>

{#if editing && field.editable}
  <div class:saved={fieldvalue == value}>
    <input type="text" bind:value={value} placeholder={field.title} bind:this={input} on:change={saveField}>
  </div>
{:else}
  <div>{value}</div>
{/if}
