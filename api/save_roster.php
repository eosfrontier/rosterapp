<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); 

require_once 'db_sql.php';

$roster_type = $conn->real_escape_string($_POST["roster_type"]);
$roster_description = $conn->real_escape_string($_POST["roster_description"]);
$rosterID = null;
if (isset($_POST["rosterID"])) {
    $rosterID = $conn->real_escape_string($_POST["rosterID"]);
}

try {
    if (!$conn->begin_transaction()) { throw new Exception("SQL transaction failure: ".$conn->error); }
    if ($rosterID) {
        exec_sql("
            UPDATE ros_rosters
            SET roster_type='${roster_type}'
            , roster_description='${roster_description}'
            WHERE rosterID=${rosterID}
        ");
    } else {
        exec_sql("
            INSERT INTO ros_rosters (roster_type, roster_description)
            VALUES ('${roster_type}','${roster_description}')
        ");
        $rosterID = $conn->insert_id;
    }

    // Scan for all fieldtype-* parameters
    foreach ($_POST as $key => $value) {
        if (preg_match("/^fieldtype-(.*)$/", $key, $matches)) {
            $fieldname = $conn->real_escape_string($matches[1]);
            $fieldlabel = $conn->real_escape_string($value);
            exec_sql("
                INSERT INTO ros_fieldtypes(fieldname, fieldlabel)
                VALUES ('${fieldname}', '${fieldlabel}')
                ON DUPLICATE KEY UPDATE
                fieldlabel = '${fieldlabel}'
            ");
        }
    }

    $mandatory_count = 0;
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
            $result = exec_sql("SELECT fieldtypeID, field_external_table FROM ros_fieldtypes WHERE fieldname='${fieldname}'");
            if ($result->num_rows != 1) { throw new Exception("Unknown field '${fieldname}'!"); }
            $fieldtypeID = $result->fetch_object()->fieldtypeID;
            $field_external_table = $result->fetch_object()->field_external_table;
            if ($roster_fieldtype > 0 && $roster_order > 0 && !$field_external_table) {
                $mandatory_count++;
            }
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
    if ($mandatory_count == 0) {
        throw new Exception("No mandatory field for roster");
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
    $saveresult = "\"error\":".json_encode($ex->getMessage());
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
