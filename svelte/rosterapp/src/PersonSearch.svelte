<script>
  export let characters
  export let visible = false

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  let searchkey = ''

  function checkSelectVisible() {
    visible = !!window.location.hash.match(/:search/)
  }
  checkSelectVisible()
  $: if (window.location.hash.match(/:search/)) {
    if (!visible) window.history.back()
  } else if (visible) {
      searchkey = ''
      window.location.hash += ':search'
  }

  $: showchars = characters.filter(c => c.accountID > 0 && c.sheet_status == 'active' && c.character_name && c.character_name.toLowerCase().indexOf(searchkey.toLowerCase()) >= 0)

  const mugserver = 'https://www.eosfrontier.space/eos_douane/images/mugs/'

  function selectPerson(id) {
    dispatch('select', { id: id })
    visible = false
  }

</script>

<svelte:window on:hashchange={checkSelectVisible} on:click={() => { if(visible) { visible = false }}}/>

{#if visible}
<div id="add-person-popup" class="add-popup" class:visible on:click|stopPropagation>
  <div class="popup-header">
    <div>Select a new <span class="roster-type">person</span>
      <input type="text" placeholder="Search" id="search-input" bind:value={searchkey} autofocus>
    </div>
  </div>
  <div class="popup-person-list">
    <div id="search-person-list" class:few-items={showchars.length <= 5}>
      {#each showchars as character (character.characterID)}
        <div class="selected search-person" on:click={() => selectPerson(character.characterID)}>
          <div class="search-person-character_image">
            {#if showchars.length <= 5}
              <img alt="mug" src="{mugserver}{character.characterID}.jpg">
            {/if}
          </div>
          <div class="search-person-character_name">{character.character_name}</div>
          <div class="search-person-faction">{character.faction}</div>
          <div class="search-person-rank">{character.rank}</div>
        </div>
      {/each}
    </div>
  </div>
</div>
{/if}
