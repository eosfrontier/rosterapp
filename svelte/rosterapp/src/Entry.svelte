<script>
  export let fields
  export let values
  export let meta

  export let editing = ''
  export let editable = false

  const mugserver = 'https://www.eosfrontier.space/eos_douane/images/mugs/'

  let faction = values['faction'] || ''
  if (faction) faction = 'faction-'+faction

  import Field from './Field.svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  function deleteEntry() {
    dispatch('delete', { id: values.characterID })
  }

  function toggleEdit() {
    if (editing) {
      editing = ''
      dispatch('updated')
    } else {
      editing = 'editing'
    }
  }

</script>

<div class="roster-entry {faction}" class:editing>
  <div class="roster-person-character_image">
    <div>
      <img alt="mug" src="{mugserver}{values.characterID}.jpg">
    </div>
  </div>
  {#if editable}
    <div class="roster-buttons">
      <div class="roster-button-edit button" title="Edit" on:click={toggleEdit}/>
      <div class="roster-button-delete button" title="Delete" on:click={deleteEntry}/>
    </div>
  {:else}
    <div class="dummy"/> <!-- for the nth-child classes -->
  {/if}
  <div class="roster-person-character_name">
    {values['character_name']}
  </div>
  {#each fields as field (field.name)}
    <Field id={values.characterID} {field} {editing} value={values[field.name]||meta[field.name]||''} on:updated/>
  {/each}
</div>
