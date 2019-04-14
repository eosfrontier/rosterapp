<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); 
 
require_once 'db_sql.php';

$characterID = $conn->real_escape_string($_POST["characterID"]);
$fieldname = $conn->real_escape_string($_POST["fieldname"]);
$oldvalue = $conn->real_escape_string($_POST["oldvalue"]);
$newvalue = $conn->real_escape_string($_POST["newvalue"]);

$result = exec_sql("SELECT fieldtypeID FROM ros_fieldtypes WHERE fieldname='${fieldname}'");
if ($result->num_rows != 1) { throw new Exception("Unknown field ${fieldname}"); }
$fieldtypeID = $result->fetch_object()->fieldtypeID;

$result = exec_sql("
    SELECT MAX(fieldvalueID) AS prev_fieldvalueID
    FROM ros_fieldvalues
    WHERE fieldtypeID = ${fieldtypeID}
    AND characterID = ${characterID}
    AND fieldvalue = ${oldvalue}
");
$prev_fieldvalueID = $result->fetch_object()->prev_fieldvalueID;

exec_sql("
    INSERT INTO ros_fieldvalues (fieldtypeID, characterID, prev_fieldtypeID, fieldvalue)
    VALUES (${fieldtypeID}, ${characterID}, ${prev_fieldtypeID}, ${newvalue})
");

$result = exec_sql("
    SELECT fv.fieldvalue FROM ros_fieldvalues fv
    WHERE fv.characterID=${characterID}
    AND fv.fieldtypeID=${fieldtypeID}
    AND NOT EXISTS(SELECT 1 FROM ros_fieldvalues nx
                   WHERE nx.prev_fieldvalueID = fv.fieldvalueID)
");

header('Content-Type: application/json');
echo "{\"characterID\":".$_POST["characterID"]."\n";
echo ",\"fieldname\":".json_encode($_POST["fieldname"])."\n";
if ($result->num_rows == 1) {
    $row = $result->fetch_assoc();
    $rfv = $row["fieldvalue"];
    echo ",\"fieldvalue\":".json_encode($row["fieldvalue"])."\n";
    if ($rfv == $_POST["newvalue"]) {
        echo ",\"result\":\"saved\"\n";
    } else {
        echo ",\"result\":\"saved but overridden\"\n";
    }
} else {
    echo ",\"error\":\"conflict\"\n";
    echo ",\"fieldvalues\":[";
    $comma = "";
    while ($row = $result->fetch_assoc()) {
        echo $comma.json_encode($row["fieldvalue"]);
        $comma = ",\n";
    }
    echo "]";
}
echo "}\n";

$conn->close();
?> 
