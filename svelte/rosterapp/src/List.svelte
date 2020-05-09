<script>
  export let rosterId = 0

  let fields = []
  let characterMeta = {}
  let primary = ''
  let searchVisible = false
  let characterEditing = {}

  import Entry from './Entry.svelte'
  import PersonSearch from './PersonSearch.svelte'
  import { fetchCharacters, fetchMeta, updateMeta, deleteMeta, accountId } from './orthanc.js'
  import { onMount } from 'svelte'

  $: rosterId && fetchMeta({id:rosterId}).then(loadFields)

  let metafields = []

  function loadFields(data) {
    metafields = ['roster:admin:'+rosterId]
    fields = data.map(meta => {
      if (meta.name != 'roster:type') {
        let [order, flags, title] = meta.value.split(':')
        let name = meta.name
        let metaset = name.split(':')
        let editable = false
        if (metaset.length > 2) {
          external = true
          if (metaset[1] == 'character') {
            name = metaset.slice(2).join(':')
          } else {
            name = metaset.slice(1).join(':')
            metafields.push(name)
          }
        } else {
          editable = true
          metafields.push(name)
        }
        if (flags.indexOf('P') >= 0) {
          primary = name
        }
        return { name:name, order:order, flags:flags,title:title, editable:editable}
      }
    }).filter(e=>e).sort((a,b) => a.order-b.order)
    fields.find(f => f.editable).first = true
    getMeta()
  }

  function getMeta() {
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

  onMount(() => {
    fetchCharacters().then(data => characters =
      data.filter(c => c.character_name).sort(
        (a,b) => a.character_name.localeCompare(b.character_name)))
  })

  $: editor = isEditor(characters.find(c => c.accountID == accountId), characterMeta, rosterId) 

  function isEditor(mycharacter, meta=characterMeta, rosterid=rosterId) {
    if (!mycharacter) return ''
    if (!meta[mycharacter.characterID]) return ''
    return meta[mycharacter.characterID]['roster:admin:'+rosterid] || ''
  }

  function isMember(character) {
    return characterMeta[character.characterID] && (characterMeta[character.characterID][primary] != null)
  }

  function addPerson(event) {
    updateMeta(event.detail.id, { name: primary, value: '' }).then(getMeta)
    characterEditing[event.detail.id] = "initial"
  }

  function deleteEntry(event) {
    deleteMeta(event.detail.id, primary).then(getMeta)
    delete characterEditing[event.detail.id]
  }

</script>

<div id="main-body">
  <div id="roster-list">
    {#each characters.filter(isMember) as values (values.characterID)}
      <Entry fields={fields} values={values} meta={characterMeta[values.characterID]} editable={editor} bind:editing={characterEditing[values.characterID]} on:delete={deleteEntry}/>
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
<PersonSearch characters={characters.filter(c => !isMember(c))} bind:visible={searchVisible} on:select={addPerson}/>
