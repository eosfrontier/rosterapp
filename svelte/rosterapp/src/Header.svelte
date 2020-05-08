<script>
  export let rosterId = 0
  let rosterNames = {}

  import Menu from './Menu.svelte'
</script>

<header id="headerframe">
  <div id="header" class="aquilafont">
    <div class="header-text">{rosterNames[rosterId] || 'people roster'}</div>
    <Menu visible={rosterId == 0} bind:rosterNames/>
  </div>
</header>

