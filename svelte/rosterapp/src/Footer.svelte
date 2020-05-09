<script>
  import { canAdmin, accountId } from './orthanc.js'
  export let isadmin = false

  $: console.log(canAdmin)
  $: console.log(accountId)
</script>

<footer id="footerframe">
  {#if canAdmin}
    <div id="admin_button" title="Application Admin" class:isadmin on:click={() => isadmin=!isadmin}/>
  {/if}
  <div id="footer_tagline">
    <div id="footer_logo"><img alt="ACME" src="images/logo_acme_dark_small.png" height="60px"></div>
    <div class="aquilafont">ACME-Tech, making your job as painless as possible<br></div>
  </div>
  <div id="footer_corp">ACME-Tech is part of the ACME-group<br />Astro Carrera Maxima Expertis</div>
</footer>
