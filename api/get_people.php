<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); 
 
// Separate file which is not in git repo because it contains password
require_once 'db_config.php';

// Create connection
$conn = new mysqli($db_server, $db_username, $db_password, $db_database, $db_port);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8");


// Get all the character names, including ICC number
$result = $conn->query("
select c.characterID, c.character_name, faction, rank
from ecc_characters c
where not exists (select 1 from med_fieldtypes ft join med_fieldvalues fv on ft.fieldtypeID = fv.fieldvalueID
        where ft.fieldname='exclude' and fv.characterID = c.characterID)
and c.character_name is not null
order by character_name
");

if ($result) {
    // Build json by hand because it didn't work in one go for some reason
    header('Content-Type: text/html');
    while ($row = $result->fetch_assoc()) {
        echo '<div class="search-person search-faction-'.$row['faction'].'" data-character-id="'.$row['characterID'].'">';
        echo '<div class="search-person-character_image"></div>';
        echo '<div class="search-person-character_name">'.$row['character_name'].'</div>';
        echo '<div class="search-person-faction">'.$row['faction'].'</div>';
        echo '<div class="search-person-rank">'.$row['rank'].'</div>';
        echo '</div>';
    }
} else {
    echo "SQL: ${qryselect}";
    die("SQL failure".$conn->error);
}

$conn->close();

?> 
