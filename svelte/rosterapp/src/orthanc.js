const orthanc = 'http://test.medicorum.space/orthanc/'

import { writable } from 'svelte/store'

export const accountId = writable(0)
export const canAdmin = writable(false)
export const isAdmin = writable(false)

let fetchtoken = null
let token = ''
const adminusers = [818]
const admingroups = [8,30]

async function getToken()
{
  if (!fetchtoken) fetchtoken = fetch('http://test.medicorum.space/roster/assets/id.php').then(response => response.json())
  let idandtoken = await fetchtoken
  accountId.set(idandtoken.id)
  if (adminusers.indexOf(idandtoken.id) >= 0) {
    canAdmin.set(true)
  } else {
    for (var i = 0; i < admingroups.length; i++) {
      if (idandtoken.groups[admingroups[i]]) {
        canAdmin.set(true)
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
