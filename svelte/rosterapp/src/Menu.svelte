<script>
  export let rosters = []
  export let rosterNames = {}
  export let visible

  import { fetchMeta } from './orthanc.js'
  import { onMount } from 'svelte'

  onMount(() => {
    fetchMeta({meta:'roster:type'}).then((data) => {
      let newRosterNames = {}
      rosters = data.map((el) => {
        let rv = el.value.split(':')
        let rn = rv[0]+' '+(rv[2] || 'roster')
        newRosterNames[el.character_id] = rv[3] || rn
        return {id:el.character_id, name:rn}
      })
      rosterNames = newRosterNames
    })
  })
  function setVisible(e) {
    if (e.target == this) {
      visible = !visible
    } else {
      visible = false
    }
  }
</script>

<svelte:window on:click={() => { if(visible) { visible = false }}}/>

<div id="headermenu" class="header-button menu-button" class:visible on:click|stopPropagation={setVisible}>&#61641;
  <div class="header-menu menu-content">
    <div id="headermenu-list">
      {#each rosters as roster}
        <a class="header-menu-roster_type menu-item" href="#{roster.id}">
          {roster.name}
        </a>
      {/each}
    </div>
    <a class="header-menu-admin menu-item" href="admin.html">add new</a>
  </div>
</div>
