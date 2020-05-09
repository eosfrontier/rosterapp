const orthanc = 'http://test.medicorum.space/orthanc/'

export let accountId = 0
export let canAdmin = false

let fetchtoken = null
let token = ''
const adminusers = [818]
const admingroups = [8,30]

async function getToken()
{
  if (!fetchtoken) fetchtoken = fetch('http://test.medicorum.space/roster/assets/id.php').then(response => response.json())
  let idandtoken = await fetchtoken
  accountId = idandtoken.id
  if (adminusers.indexOf(accountId) >= 0) {
    canAdmin = true
  } else {
    for (var i = 0; i < admingroups.length; i++) {
      if (idandtoken.groups[admingroups[i]]) {
        canAdmin = true
        break
      }
    }
  }
  return idandtoken.token
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
