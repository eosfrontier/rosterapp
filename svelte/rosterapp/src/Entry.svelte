<script>
  export let fields
  export let values

  let faction = values['faction'] || ''
  if (faction) faction = 'faction-'+faction
  export let editing=false
</script>

<div class="roster-entry {faction}" class:editing>
  {#if editing}
    <div class="roster-buttons">
      <div class="roster-button-edit button" title="Edit"/>
      <div class="roster-button-delete button" title="Delete"/>
    </div>
  {:else}
    <div class="dummy"/> <!-- for the nth-child classes -->
  {/if}
  {#each fields as field}
    <div>{values[field]}</div>
  {/each}
</div>
