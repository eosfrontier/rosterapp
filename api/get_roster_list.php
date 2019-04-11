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

$result = $conn->query("SELECT rosterID, roster_type, roster_description FROM ros_rosters") or die("SQL failure".$conn->error);

$roster_list = array();
while ($row = $result->fetch_assoc()) {
    array_push($roster_list, $row);
}

header('Content-Type: application/json');
echo "{\"field_types\":{";
$result = $conn->query("
    SELECT ft.fieldname, ft.fieldlabel, ft.fielddescription, ft.field_external_table
    FROM ros_fieldtypes ft
    ") or die("SQL failure".$conn->error);
$ocomma = "\n  ";
while ($row = $result->fetch_assoc()) {
    $fieldname = json_encode($row["fieldname"]);
    $fieldlabel = json_encode($row["fieldlabel"]);
    $fielddescription = json_encode($row["fielddescription"]);
    $field_external_table = json_encode($row["field_external_table"]);
    echo "${ocomma}${fieldname}:{\"fieldlabel\":${fieldlabel},\"fielddescription\":${fielddescription},\"field_external_table\":${field_external_table}}";
    $ocomma = ",\n  ";
}

echo "},\n\"roster_types\":[";
$ocomma = "\n  ";
foreach ($roster_list as $roster) {
    $rosterID = $roster["rosterID"];
    $roster_type = json_encode($roster["roster_type"]);
    $roster_description = json_encode($roster["roster_description"]);
    echo "${ocomma}{\"rosterID\":\"${rosterID}\",\"roster_type\":${roster_type},\"roster_description\":${roster_description},\"fields\":{";
    $comma = "\n    ";
    $result = $conn->query("
      SELECT ft.fieldname, rf.roster_order, rf.roster_fieldtype
      FROM ros_roster_fields rf
      JOIN ros_fieldtypes ft ON (ft.fieldtypeID = rf.fieldtypeID)
      WHERE rf.rosterID=${rosterID}
      ORDER BY rf.roster_order
    ") or die("SQL failure".$conn->error);
    while ($row = $result->fetch_assoc()) {
        $fieldname = json_encode($row["fieldname"]);
        $roster_fieldtype = $row["roster_fieldtype"];
        $roster_order = $row["roster_order"];
        echo "${comma}${fieldname}:{\"order\":${roster_order},\"fieldtype\":${roster_fieldtype}}";
        $comma = ",\n    ";
    }
    echo "}}";
    $ocomma = ",\n  ";
}
echo "]}\n";

$conn->close();
?> 
