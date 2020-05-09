<script>
  export let fields
  export let values
  export let meta

  export let editing = ''
  export let editable = false

  const mugserver = 'https://www.eosfrontier.space/eos_douane/images/mugs/'

  let faction = values['faction'] || ''
  if (faction) faction = 'faction-'+faction

  import { createEventDispatcher } from 'svelte'
  import { updateMeta } from './orthanc.js'

  const dispatch = createEventDispatcher()

  function deleteEntry(id) {
    dispatch('delete', { id: id })
  }

  function saveField(id, field, value) {
    updateMeta(id, { name: field, value: value }).then((d) => console.log(d))
  }

  let firstinput
  $: if (firstinput) firstinput.focus()
</script>

<div class="roster-entry {faction}" class:editing>
  <div class="roster-person-character_image">
    <div>
      <img alt="mug" src="{mugserver}{values.characterID}.jpg">
    </div>
  </div>
  {#if editable}
    <div class="roster-buttons">
      <div class="roster-button-edit button" title="Edit" on:click={() => editing = editing ? '' : 'editing'}/>
      <div class="roster-button-delete button" title="Delete" on:click={() => deleteEntry(values.characterID)}/>
    </div>
  {:else}
    <div class="dummy"/> <!-- for the nth-child classes -->
  {/if}
  <div class="roster-person-character_name">
    {values['character_name']}
  </div>
  {#each fields as field}
    {#if editing && field.editable}
      <div>
      {#if field.first}
        <input type="text" bind:value={meta[field.name]} placeholder={field.title} bind:this={firstinput} on:change={() => saveField(values.characterID, field.name, meta[field.name])}>
      {:else}
        <input type="text" bind:value={meta[field.name]} placeholder={field.title}>
      {/if}
      </div>
    {:else}
      <div>{values[field.name]||meta[field.name]||''}</div>
    {/if}
  {/each}
</div>
