<!DOCTYPE html>
<html>
<head>
	<title>Medicorum - work in progress</title>
	<meta name="robots" content="noindex, nofollow">
	<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery.perfect-scrollbar/1.4.0/css/perfect-scrollbar.min.css">
	<link rel="stylesheet" href="roster.css">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
	<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.perfect-scrollbar/1.4.0/perfect-scrollbar.min.js"></script>
	<script src="roster.js"></script>
</head>
<body>

<div id="headerframe">
    <div id="header" class="aquilafont"><span class="roster-type">person</span> roster</div>
</div>
<div id="main-body">
    <div id="roster-list">
        <h3 class="loading">Loading</h3>
    </div>
</div>
<div id="add-person-popup">
    <div class="popup-header">Select a new <span class="roster-type">person</span></div>
    <div class="popup-person-list" id="search-person-list">
    </div>
</div>
<div id="footerframe">
    <div id="footer_tagline">
        <div id= footer_logo><img src="images/logo_acme_dark_small.png" height="60px"></div>
        <div class="aquilafont">ACME-Tech, making your job as painless as possible<br></div>
    </div>
    <div id="footer_corp">ACME-Tech is part of the ACME-group<br />Astro Carrera Maxima Expertis</div>
</div>

</body>
