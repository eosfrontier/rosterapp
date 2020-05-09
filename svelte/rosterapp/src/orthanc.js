const orthanc = 'http://test.medicorum.space/orthanc/'
let fetchtoken = null
let token = ''
export let accountId = 0

async function getToken()
{
  if (!fetchtoken) fetchtoken = fetch('http://test.medicorum.space/roster/assets/id.php').then(response => response.json())
  let data = await fetchtoken
  accountId = data.id
  return data.token
}
async function postJson(url, data)
{
  if (!token) token = await getToken()
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
