<script context="module">

  export async function fetchCharacters()
  {
    const response = await fetch('http://test.medicorum.space/orthanc/character/',
      { method: 'POST',
        body: JSON.stringify({all_characters:true})
      })
    return await response.json()
  }

  export async function fetchMeta(meta)
  {
    const response = await fetch('http://test.medicorum.space/orthanc/character/meta/',
      { method: 'POST',
        body: JSON.stringify(meta)
      })
    return await response.json()
  }

</script>
