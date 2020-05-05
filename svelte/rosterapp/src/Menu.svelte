<script>
  export let rosters = []
  export let visible

  import { fetchMeta } from './Orthanc.svelte'
  fetchMeta('roster:type').then((data) => rosters = data)
</script>

<div id="headermenu" class="header-button menu-button" class:visible on:click|stopPropagation={() => visible = !visible}>&#61641;
  <div class="header-menu menu-content">
    <div id="headermenu-list">
      {#each rosters as roster}
        <a class="header-menu-roster_type menu-item" href="#{roster.character_id}">
          {roster.value.split(':')[0]} {roster.value.split(':')[2] || 'roster'}
        </a>
      {/each}
    </div>
    <a class="header-menu-admin menu-item" href="admin.html">add new</a>
  </div>
</div>
