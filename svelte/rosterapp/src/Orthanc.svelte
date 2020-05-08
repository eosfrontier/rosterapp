<script context="module">

  const orthanc = 'http://test.medicorum.space/orthanc/'
  const token = 'xxx-xxx-xxx'
  async function postJson(url, data)
  {
    data.token = token
    const response = await fetch(orthanc+url, {
      method:'POST',
      body: JSON.stringify(data) })
    return await response.json()
  }
  export async function fetchCharacters()
  {
    return postJson('character/', {all_characters:true})
  }

  export async function fetchMeta(meta)
  {
    return postJson('character/meta/', meta)
  }

  export async function updateMeta(id, meta)
  {
    return postJson('character/meta/update.php', {id: id, meta: [meta]})
  }

  export async function deleteMeta(id, meta)
  {
    return postJson('character/meta/delete.php', {id: id, meta: [{name: meta}]})
  }

</script>
