<script>
  let fields = ['character_name','characterID']

  import Entry from './Entry.svelte'
  import { fetchCharacters } from './Orthanc.svelte'
</script>

<div id="main-body">
  <div id="roster-list">
    {#await fetchCharacters()}
      <p>Loading</p>
    {:then characters}
      {#each characters as values}
        <Entry fields={fields} values={values} />
      {/each}
    {:catch error}
      <pre>An error occurred</pre>
    {/await}
  </div>
</div>
