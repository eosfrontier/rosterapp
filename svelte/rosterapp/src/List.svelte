<script>
  export let rosterId = 0

  let fields = []
  let characterMeta = {}
  let primary = ''

  import Entry from './Entry.svelte'
  import { fetchCharacters, fetchMeta } from './Orthanc.svelte'

  $: rosterId && fetchMeta({id:rosterId}).then(loadFields)

  function loadFields(data) {
    let metafields = []
    fields = data.map(meta => {
      if (meta.name != 'roster:type') {
        let [order, flags, title] = meta.value.split(':')
        let name = meta.name
        let external = false
        let metaset = name.split(':')
        if (metaset.length > 2) {
          external = true
          if (metaset[1] == 'character') {
            name = metaset.slice(2).join(':')
          } else {
            name = metaset.slice(1).join(':')
            metafields.push(name)
          }
        } else {
          metafields.push(name)
        }
        if (flags.indexOf('P') >= 0) {
          primary = name
        }
        return {name:name, order:order, flags:flags,title:title,external:external}
      }
    }).filter(e=>e).sort((a,b) => a.order-b.order)
    if (metafields.length > 0) {
      fetchMeta({meta:metafields.join(',')}).then(loadMeta)
    }
  }

  function loadMeta(data) {
    let newCM = {}
    data.forEach(meta => {
      if (!newCM[meta.character_id]) newCM[meta.character_id] = {}
      newCM[meta.character_id][meta.name] = meta.value
    })
    characterMeta = newCM
    console.log(characterMeta, primary)
  }

</script>

<main id="main-body">
  <div id="roster-list">
    {#await fetchCharacters()}
      <p>Loading</p>
    {:then characters}
      {#each characters.filter(c => characterMeta[c.characterID] && characterMeta[c.characterID][primary]) as values}
        <Entry fields={fields} values={values} meta={characterMeta[values.characterID]} editable/>
      {/each}
    {:catch error}
      <pre>An error occurred</pre>
    {/await}
  </div>
</main>
