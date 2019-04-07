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

$qryselect = "SELECT c.characterID, c.character_name, CONCAT('https://www.eosfrontier.space/eos_douane/images/mugs/',c.characterID,'.jpg') AS character_image, faction, rank";
$fieldlist = "";

$fields = "";
$extrafields = "";
if (isset($_GET["fields"])) {
    $fields = $conn->real_escape_string($_GET["fields"]);
}
if (isset($_GET["extrafields"])) {
    $extrafields = $conn->real_escape_string($_GET["extrafields"]);
}
foreach (explode(",", "${fields},${extrafields}") as $field) {
    $field = trim($field);
    if ($field) {
        $fieldlist .= "'$field',";
        $qryselect .= ", (
            SELECT fv.fieldvalue
            FROM med_fieldvalues fv
            JOIN med_fieldtypes ft ON fv.fieldtypeID = ft.fieldtypeID
            WHERE fv.characterID = c.characterID
            AND ft.fieldname='$field'
            AND fv.close_timestamp IS NULL
            ORDER BY fv.mod_timestamp DESC
            LIMIT 1
        ) as `$field`";
    }
}
$qryselect  .= "
FROM ecc_characters c
WHERE NOT EXISTS (SELECT 1 FROM med_fieldtypes ft JOIN med_fieldvalues fv ON ft.fieldtypeID = fv.fieldvalueID
        WHERE ft.fieldname='exclude' AND fv.characterID = c.characterID)
AND c.character_name IS NOT NULL";
if (isset($_GET["characterID"])) {
    $characterID = $conn->real_escape_string($_GET["characterID"]);
    $qryselect .= " AND c.characterID=${characterID}";
} else {
    $qryselect .= " HAVING 1=1";
    foreach (explode(",", "${fields}") as $field) {
        $field = trim($field);
        if ($field) {
            $qryselect .= " AND `${field}` IS NOT NULL AND `${field}` <> '__deleted__'";
        }
    }
    $qryselect .= " ORDER BY character_name";
}

$fieldnames = "";
if ($fieldlist) {
    $fieldlist = rtrim($fieldlist,",");
    $result = $conn->query("SELECT fieldname, fieldlabel, fielddescription FROM med_fieldtypes WHERE fieldname IN (${fieldlist})");
    if ($result) {
        $comma = "";
        while ($row = $result->fetch_assoc()) {
            $fieldnames .= $comma.json_encode($row);
            $comma = ",\n";
        }
    } else {
        die("SQL failure".$conn->error);
    }
}

// Get all the character names, including ICC number
$result = $conn->query($qryselect);

if ($result) {
    // Build json by hand because it didn't work in one go for some reason
    header('Content-Type: application/json');
    echo "{\"fields\":[${fieldnames}],\"people\":[";
    $comma = "";
    while ($row = $result->fetch_assoc()) {
        echo $comma.json_encode($row);
        $comma = ",\n";
    }
    echo "]}";
} else {
    echo "SQL: ${qryselect}";
    die("SQL failure".$conn->error);
}

$conn->close();
?> 
