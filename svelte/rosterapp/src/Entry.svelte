<script>
  export let fields
  export let values
  export let meta

  export let editing=false
  export let editable=false

  const mugserver = 'https://www.eosfrontier.space/eos_douane/images/mugs/'

  let faction = values['faction'] || ''
  if (faction) faction = 'faction-'+faction

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  function deleteEntry(id) {
    dispatch('delete', { id: id })
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
      <div class="roster-button-edit button" title="Edit" on:click={() => editing = !editing}/>
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
        <input type="text" value={meta[field.name]||''} placeholder={field.title}/>
      </div>
    {:else}
      <div>{values[field.name]||meta[field.name]||''}</div>
    {/if}
  {/each}
</div>
