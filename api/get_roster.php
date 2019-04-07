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

// Return list of roster types of none is requested
if (!isset($_GET["roster_type"])) {
    $result = $conn->query("SELECT roster_type FROM ros_rosters");
    if ($result) {
        header('Content-Type: application/json');
        echo "{\"roster_types\":[";
        $comma = "";
        while ($row = $result->fetch_assoc()) {
            echo $comma.json_encode($row["roster_type"]);
            $comma = "\n,";
        }
        echo "\n]}\n";
        $conn->close();
        exit(0);
    } else {
        die("SQL failure".$conn->error);
    }
}
$roster_type = $conn->real_escape_string($_GET["roster_type"]);

$result = $conn->query("
  SELECT ft.fieldtypeID, ft.fieldname, ft.fieldlabel, ft.fielddescription, rf.roster_fieldtype, ft.field_external_table, rf.roster_order
  FROM ros_rosters rt
  JOIN ros_roster_fields rf ON (rf.rosterID = rt.rosterID)
  JOIN ros_fieldtypes ft ON (ft.fieldtypeID = rf.fieldtypeID)
  WHERE rt.roster_type='${roster_type}'
  ORDER BY rf.roster_order
") or die("SQL failure".$conn->error);

$mandatoryfields = array();
$fieldtypes = array();
$qryselect = "SELECT c.`characterID`, CONCAT('https://www.eosfrontier.space/eos_douane/images/mugs/',c.`characterID`,'.jpg') AS `character_image`, c.`character_name`";
while ($row = $result->fetch_assoc()) {
    $ext = $row["field_external_table"];
    $fieldname = $row["fieldname"];
    $fieldtypeID = $row["fieldtypeID"];
    array_push($fieldtypes, json_encode($row));
    if ($row["roster_fieldtype"] == 1) {
        array_push($mandatoryfields, $fieldname);
    }
    if ($ext == 'ecc_characters') {
        $qryselect .= ", c.`${fieldname}`";
    } elseif ($ext == 'med_fieldvalues') {
        $qryselect .= ", (
            SELECT fv.fieldvalue
            FROM med_fieldvalues fv
            JOIN med_fieldtypes ft ON fv.fieldtypeID = ft.fieldtypeID
            WHERE fv.characterID = c.characterID
            AND ft.fieldname='$fieldname'
            AND fv.close_timestamp IS NULL
            ORDER BY fv.mod_timestamp DESC
            LIMIT 1
        ) as `$fieldname`";
    } elseif ($ext != '') {
        echo "Unknown external table ${ext}";
        die("Unknown external table ${ext}");
    } else {
        $qryselect .= ", (
            SELECT fv.fieldvalue
            FROM ros_fieldvalues fv
            WHERE fv.characterID = c.characterID
            AND fv.fieldtypeID=$fieldtypeID
            ORDER BY fv.mod_timestamp DESC
            LIMIT 1
        ) as `$fieldname`";
    }
}

$qryselect  .= "
FROM ecc_characters c
WHERE NOT EXISTS (SELECT 1 FROM ros_fieldtypes ft JOIN ros_fieldvalues fv ON ft.fieldtypeID = fv.fieldvalueID
        WHERE ft.fieldname='exclude' AND fv.characterID = c.characterID)
AND c.character_name IS NOT NULL";
if (isset($_GET["characterID"])) {
    $characterID = $conn->real_escape_string($_GET["characterID"]);
    $qryselect .= " AND c.characterID=${characterID}";
} else {
    $qryselect .= " HAVING 1=1";
    foreach ($mandatoryfields as $field) {
        $qryselect .= " AND `${field}` IS NOT NULL AND `${field}` <> '__deleted__'";
    }
    $qryselect .= " ORDER BY character_name";
}

// Get all the characters in the roster
$result = $conn->query($qryselect);

if ($result) {
    // Build json by hand because it didn't work in one go for some reason
    header('Content-Type: application/json');
    echo "{\"fields\":[".join(",", $fieldtypes)."],\"people\":[";
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
