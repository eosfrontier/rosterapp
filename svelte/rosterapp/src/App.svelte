<script>
  $: rosterId = parseInt(window.location.hash.replace(/^#/,''))
  import Header from './Header.svelte'
  import List from './List.svelte'
</script>

<svelte:head>
  <link rel="stylesheet" href="roster.css">
</svelte:head>

<!-- <svelte:window on:hashchange={(e)=>console.log(e)}/> -->

<main>
  <Header menuvisible={rosterId == 0}/>
  <List/>
</main>
