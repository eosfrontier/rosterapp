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

$characterID = $conn->real_escape_string($_POST["characterID"]);
$fieldname = $conn->real_escape_string($_POST["fieldname"]);
$oldvalue = $conn->real_escape_string($_POST["oldvalue"]);
$newvalue = $conn->real_escape_string($_POST["newvalue"]);

$result = $conn->query("SELECT fieldtypeID FROM med_fieldtypes WHERE fieldname='${fieldname}'");
if (!$result) {
    die("SQL failure: ".$conn->error);
}
$fieldtypeID = $result->fetch_object()->fieldtypeID;

// De rare subselect is om een lege string als default waarde terug te geven als er geen rijtjes zijn
$qryinsert = "
INSERT INTO med_fieldvalues (fieldtypeID, characterID, fieldvalue)
SELECT ${fieldtypeID} as fieldtypeID, ${characterID} as characterID, '${newvalue}' as fieldvalue
FROM DUAL
WHERE '${oldvalue}' = (SELECT fv.fieldvalue FROM (
        SELECT fv1.fieldvalue, fv1.mod_timestamp FROM med_fieldvalues fv1
        WHERE close_timestamp IS NULL
        AND fv1.characterID = ${characterID}
        AND fv1.fieldtypeID = ${fieldtypeID}
        UNION
        SELECT '' as fieldvalue, NULL as mod_timestamp
     ) fv
     ORDER BY fv.mod_timestamp DESC
     LIMIT 1)
";
$result = $conn->query($qryinsert);

if (!$result) {
    echo "SQL: ${qryinsert}\n";
    die("SQL failure: ".$conn->error);
}
header('Content-Type: application/json');
echo "{\"characterID\":".$_POST["characterID"]."\n";
echo ",\"fieldname\":".json_encode($_POST["fieldname"])."\n";
if ($conn->affected_rows == 1) {
    echo ",\"fieldvalue\":".json_encode($_POST["newvalue"])."\n";
    echo ",\"result\":\"saved\"\n";
} else {
    $result = $conn->query("
    SELECT fv.fieldvalue
    FROM med_fieldtypes ft
    JOIN med_fieldvalues fv ON (ft.fieldtypeID = fv.fieldtypeID)
    WHERE ft.fieldname='${fieldname}'
    AND fv.characterID=${characterID}
    AND close_timestamp IS NULL
    ORDER BY mod_timestamp DESC
    LIMIT 1
    ");
    if ($result) {
        $row = $result->fetch_assoc();
        $thevalue = $row["fieldvalue"];
        echo ",\"error\":\"not saved\"\n";
        echo ",\"fieldvalue\":\"${thevalue}\"\n";
    } else {
        echo ",\"error\":\"not saved, unable to get current value\"\n";
    }
}
echo "}\n";

$conn->close();
?> 
