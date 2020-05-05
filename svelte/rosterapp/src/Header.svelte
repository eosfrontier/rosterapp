<script>
  export let rostername = 'people roster'
  export let menuvisible

  import Menu from './Menu.svelte'
</script>

<div id="headerframe">
  <div id="header" class="aquilafont">
    <div class="header-text">{rostername}</div>
    <Menu visible={menuvisible}/>
  </div>
</div>

