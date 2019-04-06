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

$qryselect = "select c.characterID, c.character_name, concat('https://www.eosfrontier.space/eos_douane/images/mugs/',c.characterID,'.jpg') as character_image";
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
            select fv.fieldvalue
            from med_fieldvalues fv
            join med_fieldtypes ft on fv.fieldtypeID = ft.fieldtypeID
            where fv.characterID = c.characterID
            and ft.fieldname='$field'
            and fv.close_timestamp is NULL
            order by fv.mod_timestamp DESC
            limit 1
        ) as `$field`";
    }
}
$qryselect  .= "
from ecc_characters c
where not exists (select 1 from med_fieldtypes ft join med_fieldvalues fv on ft.fieldtypeID = fv.fieldvalueID
        where ft.fieldname='exclude' and fv.characterID = c.characterID)
having 1=1";
foreach (explode(",", "${fields}") as $field) {
    $field = trim($field);
    if ($field) {
        $qryselect .= " and `${field}` is not null";
    }
}

$fieldlist = rtrim($fieldlist,",");
$result = $conn->query("select fieldname, fieldlabel, fielddescription from med_fieldtypes where fieldname in (${fieldlist})");
$fieldnames = "";
if ($result) {
    $comma = "";
    while ($row = $result->fetch_assoc()) {
        $fieldnames .= $comma.json_encode($row);
        $comma = ",\n";
    }
} else {
    die("SQL failure".$conn->error);
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
    echo ']}';
} else {
    echo "SQL: ${qryselect}";
    die("SQL failure".$conn->error);
}

$conn->close();

?> 
