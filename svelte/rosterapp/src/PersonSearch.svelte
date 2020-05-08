<script>
  export let characters
  export let visible = false
  function checkSelectVisible() {
    visible = !!window.location.hash.match(/:search/)
  }
  checkSelectVisible()
  $: if (visible) {
    if (!window.location.hash.match(/:search/)) {
      searchkey = ''
      window.location.hash += ':search'
    }
  } else if (window.location.hash.match(/:search/)) {
    window.history.back()
  }
  let searchkey = ''

  $: showchars = characters.filter(c => c.accountID > 0 && c.sheet_status == 'active' && c.character_name && c.character_name.toLowerCase().indexOf(searchkey.toLowerCase()) >= 0)

  const mugserver = 'https://www.eosfrontier.space/eos_douane/images/mugs/'

  function selectPerson(id) {
  }
</script>
<svelte:window on:hashchange={checkSelectVisible} on:click={() => { if(visible) { visible = false }}}/>

{#if visible}
<div id="add-person-popup" class="add-popup" class:visible on:click|stopPropagation>
  <div class="popup-header">
    <div>Select a new <span class="roster-type">person</span>
      <input type="text" placeholder="Search" id="search-input" bind:value={searchkey}>
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
