<script>
  let rosterId = 0
  let rostername
  import Header from './Header.svelte'
  import List from './List.svelte'
  import Footer from './Footer.svelte'
  function setRosterId() {
    rosterId = parseInt(window.location.hash.replace(/^#/,'')) || 0
  }
  setRosterId()
</script>

<svelte:head>
  <link rel="stylesheet" href="roster.css">
</svelte:head>

<svelte:window on:hashchange={setRosterId}/>

<Header rosterId={rosterId}/>
<List rosterId={rosterId}/>
<Footer/>
