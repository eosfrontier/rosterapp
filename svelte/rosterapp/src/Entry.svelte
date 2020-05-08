<script>
  export let fields
  export let values
  export let meta

  let faction = values['faction'] || ''
  if (faction) faction = 'faction-'+faction
  export let editing=false
  export let editable=false
  const mugserver = 'https://www.eosfrontier.space/eos_douane/images/mugs/'
</script>

<div class="roster-entry {faction}" class:editing>
  <div class="roster-person-character_image">
    <div>
      <img alt="mug" src="{mugserver}{values['characterID']}.jpg">
    </div>
  </div>
  {#if editable}
    <div class="roster-buttons">
      <div class="roster-button-edit button" title="Edit"/>
      <div class="roster-button-delete button" title="Delete"/>
    </div>
  {:else}
    <div class="dummy"/> <!-- for the nth-child classes -->
  {/if}
  <div class="roster-person-character_name">
    {values['character_name']}
  </div>
  {#each fields as field}
    <div>{values[field.name]||meta[field.name]||''}</div>
  {/each}
</div>
