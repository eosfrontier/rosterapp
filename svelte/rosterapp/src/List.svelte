<script>
  export let rosterId = 0
  export let accountId = 818

  let fields = []
  let characterMeta = {}
  let primary = ''
  let searchVisible = false

  import Entry from './Entry.svelte'
  import PersonSearch from './PersonSearch.svelte'
  import { fetchCharacters, fetchMeta } from './Orthanc.svelte'

  $: rosterId && fetchMeta({id:rosterId}).then(loadFields)

  function loadFields(data) {
    let metafields = ['roster:admin:'+rosterId]
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
  }

  let characters = []
  fetchCharacters().then(data => characters = data.filter(c => c.character_name).sort((a,b) => a.character_name.localeCompare(b.character_name)))
  $: editor = isEditor(characters.find(c => c.accountID == accountId), characterMeta, rosterId) 

  function isEditor(mycharacter, meta=characterMeta, rosterid=rosterId) {
    if (!mycharacter) return ''
    if (!meta[mycharacter.characterID]) return ''
    return meta[mycharacter.characterID]['roster:admin:'+rosterid] || ''
  }

  function isMember(character) {
    return characterMeta[character.characterID] && characterMeta[character.characterID][primary]
  }


</script>

<div id="main-body">
  <div id="roster-list">
    {#each characters.filter(isMember) as values}
      <Entry fields={fields} values={values} meta={characterMeta[values.characterID]} editable={editor}/>
    {/each}
    {#if editor}
      <div class="roster-entry add-new" on:click|stopPropagation={() => searchVisible=true}>
        <div class="roster-person-character_image">
          <div>
            <div class="image-add-new">+</div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
<PersonSearch characters={characters.filter(c => !isMember(c))} bind:visible={searchVisible}/>
