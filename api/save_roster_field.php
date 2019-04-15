<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); 
 
if(strcasecmp($_SERVER['REQUEST_METHOD'], 'POST') != 0){
    throw new Exception('Request method must be POST!');
}
 
//Make sure that the content type of the POST request has been set to application/json
$contentType = trim(preg_replace("/;.*$/" ,"", isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : ''));

if (strcasecmp($contentType, 'application/x-www-form-urlencoded') == 0){
    $characterID = $_POST["characterID"];
    $fieldname = $_POST["fieldname"];
    $oldvalue = $_POST["oldvalue"];
    $newvalue = $_POST["newvalue"];
} elseif (strcasecmp($contentType, 'application/json') == 0){
    $postcontent = json_decode(trim(file_get_contents("php://input")), true);
    if (!is_array($postcontent)) {
        throw new Exception("Unable to decode JSON content");
    }
    $characterID = $postcontent["characterID"];
    $fieldname = $postcontent["fieldname"];
    $oldvalue = $postcontent["oldvalue"];
    $newvalue = $postcontent["newvalue"];
} else {
    throw new Exception("Unrecognized content type: ${contentType}");
}

require_once 'db_sql.php';

$characterID = $conn->real_escape_string($characterID);
$result = exec_sql("SELECT fieldtypeID FROM ros_fieldtypes WHERE fieldname='".$conn->real_escape_string($fieldname)."'");
if ($result->num_rows != 1) { throw new Exception("Unknown field ${fieldname}"); }
$fieldtypeID = $result->fetch_object()->fieldtypeID;

$result = exec_sql("
    SELECT fv.fieldvalue
    FROM ros_fieldvalues fv
    WHERE fv.fieldtypeID = ${fieldtypeID}
    AND fv.characterID = ${characterID}
    AND fv.fieldvalue IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM ros_fieldvalues nx
                    WHERE nx.prev_fieldvalueID = fv.fieldvalueID)
");
$valchanged = true;
if ($newvalue == null and $result->num_rows == 0) {
    $valchanged = false;
}
while ($row = $result->fetch_assoc()) {
    if ($row["fieldvalue"] === $newvalue) {
        $valchanged = false;
    }
}
if ($valchanged) {
    // We needed the non-escaped value before, but now we need the escaped value
    $newvalueesc = "'".$conn->real_escape_string($newvalue)."'";
    $oldvalueesc = $conn->real_escape_string($oldvalue);
    if ($newvalue == null) { $newvalueesc = 'NULL'; }

    exec_sql("
        INSERT INTO ros_fieldvalues (fieldtypeID, characterID, prev_fieldvalueID, fieldvalue)
        VALUES (${fieldtypeID}, ${characterID},
                ( SELECT prev_fieldvalueID FROM (SELECT MAX(fieldvalueID) AS prev_fieldvalueID
                      FROM ros_fieldvalues
                      WHERE fieldtypeID = ${fieldtypeID}
                      AND characterID = ${characterID}
                      AND fieldvalue = '${oldvalueesc}' ) workaround),
                ${newvalueesc})
    ");
}

$result = exec_sql("
    SELECT fv.fieldvalue FROM ros_fieldvalues fv
    WHERE fv.characterID=${characterID}
    AND fv.fieldtypeID=${fieldtypeID}
    AND fv.fieldvalue IS NOT NULL
    AND NOT EXISTS(SELECT 1 FROM ros_fieldvalues nx
                   WHERE nx.prev_fieldvalueID = fv.fieldvalueID)
");

header('Content-Type: application/json');
echo "{\"characterID\":${characterID}\n";
echo ",\"fieldname\":".json_encode($fieldname)."\n";
echo ",\"oldvalue\":".json_encode($oldvalue)."\n";
echo ",\"newvalue\":".json_encode($newvalue)."\n";
if ($result->num_rows <= 1) {
    $rfv = null;
    if ($result->num_rows == 1) {
        $row = $result->fetch_assoc();
        $rfv = $row["fieldvalue"];
    }
    echo ",\"fieldvalue\":".json_encode($rfv)."\n";
    if ($rfv == $newvalue) {
        if ($valchanged) {
            echo ",\"result\":\"saved\"\n";
        } else {
            echo ",\"result\":\"saved but was already saved\"\n";
        }
    } else {
        echo ",\"result\":\"saved but overridden\"\n";
    }
} else {
    echo ",\"result\":\"saved\"\n";
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
