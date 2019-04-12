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

function exec_sql($query)
{
    global $conn;
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception("SQL error ".$conn->error."\n query was:\n${query}\n");
    }
    return $result;
}

$roster_type = $conn->real_escape_string($_POST["roster_type"]);
$roster_description = $conn->real_escape_string($_POST["roster_description"]);

try {
    if (!$conn->begin_transaction()) { throw new Exception("SQL transaction failure: ".$conn->error); }
    exec_sql("
        INSERT INTO ros_rosters (roster_type, roster_description)
        VALUES ('${roster_type}','${roster_description}')
        ON DUPLICATE KEY UPDATE
        roster_description='${roster_description}'
    ");
    $result = exec_sql("SELECT rosterID FROM ros_rosters WHERE roster_type='${roster_type}'");

    $rosterID = $result->fetch_object()->rosterID;

    $roster_fields = array();
    // Scan for all field-* parameters
    foreach ($_POST as $key => $value) {
        if (preg_match("/^field-(.*)$/", $key, $matches)) {
            $fieldname = $conn->real_escape_string($matches[1]);
            if (!preg_match("/^\s*([0-9]+)\s*,\s*([0-9]+)\s*$/", $value, $matches)) {
                throw new Exception("Invalid value for field ${fieldname}: ${value}");
            }
            $roster_order = $conn->real_escape_string($matches[1]);
            $roster_fieldtype = $conn->real_escape_string($matches[2]);
            $result = exec_sql("SELECT fieldtypeID FROM ros_fieldtypes WHERE fieldname='${fieldname}'");
            if ($result->num_rows != 1) { throw new Exception("Unknown field '${fieldname}'!"); }
            $fieldtypeID = $result->fetch_object()->fieldtypeID;
            array_push($roster_fields, "$fieldtypeID");
            exec_sql("
                INSERT INTO ros_roster_fields (rosterID, fieldtypeID, roster_order, roster_fieldtype)
                VALUES (${rosterID}, ${fieldtypeID}, ${roster_order}, ${roster_fieldtype})
                ON DUPLICATE KEY UPDATE
                roster_order=${roster_order},
                roster_fieldtype=${roster_fieldtype}
            ");
        }
    }
    $fieldtypelist = implode(",",$roster_fields);
    exec_sql("
        DELETE FROM ros_roster_fields
        WHERE rosterID=${rosterID}
        AND fieldtypeID NOT IN (${fieldtypelist})
    ");

    if (!$conn->commit()) { throw new Exception("SQL commit failure: ".$conn->error); }
    $saveresult = "\"result\":\"saved\"";
} catch (Exception $ex) {
    $saveresult = "\"error\":\"".json_encode($ex->getMessage())."\"";
}

header('Content-Type: application/json');
echo "{ ${saveresult}\n";
if (isset($rosterID)) {
    $result = $conn->query("SELECT roster_type, roster_description FROM ros_rosters WHERE rosterID=${rosterID}");
    if ($result) {
        $row = $result->fetch_assoc();
        echo ",\"roster_type\":".json_encode($row["roster_type"])."\n";
        echo ",\"roster_description\":".json_encode($row["roster_description"])."\n";
    }
}
echo "}\n";

$conn->close();
?> 
