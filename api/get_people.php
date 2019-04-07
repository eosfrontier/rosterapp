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
SELECT c.characterID, c.character_name, faction, rank
FROM ecc_characters c
WHERE NOT EXISTS (SELECT 1 FROM med_fieldtypes ft JOIN med_fieldvalues fv ON ft.fieldtypeID = fv.fieldvalueID
        WHERE ft.fieldname='exclude' AND fv.characterID = c.characterID)
AND c.character_name IS NOT NULL
ORDER BY character_name
");

if ($result) {
    header('Content-Type: text/html');
    while ($row = $result->fetch_assoc()) {
        echo '<div class="selected search-person search-faction-'.$row['faction'].
            '" data-character-id="'.$row['characterID'].'" data-search-key="'.strtolower($row['character_name']).'">';
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
