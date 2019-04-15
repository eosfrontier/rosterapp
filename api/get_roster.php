<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); 
 
require_once 'db_sql.php';

$result = exec_sql("
  SELECT rt.roster_type, ft.fieldtypeID, ft.fieldname, ft.fieldlabel, ft.fielddescription, rf.roster_fieldtype, ft.field_external_table, rf.roster_order
  FROM ros_rosters rt
  JOIN ros_roster_fields rf ON (rf.rosterID = rt.rosterID)
  JOIN ros_fieldtypes ft ON (ft.fieldtypeID = rf.fieldtypeID)
  ORDER BY rf.roster_order
");

$rostertypes = array();
$fieldtypes = array();
$qryselect = "SELECT c.`characterID`, CONCAT('\"',REPLACE(c.`character_name`,'\"','\\\\\"'),'\"') AS `character_name`";
while ($row = $result->fetch_assoc()) {
    $ext = $row["field_external_table"];
    $fieldname = $row["fieldname"];
    $fieldtypeID = $row["fieldtypeID"];
    $roster_type = $row["roster_type"];
    if (!isset($rostertypes[$roster_type])) {
        $rostertypes[$roster_type] = array();
    }
    array_push($rostertypes[$roster_type], $row);
    if (!isset($fieldtypes[$fieldtypeID])) {
        $fieldtypes[$fieldtypeID] = true;
        if ($ext == 'ecc_characters') {
            $qryselect .= ", CONCAT('\"',REPLACE(c.`${fieldname}`,'\"','\\\\\"'),'\"') AS `${fieldname}`";
        } elseif ($ext == 'med_fieldvalues') {
            $qryselect .= ", (
                SELECT CONCAT('\"',REPLACE(fv.fieldvalue, '\"', '\\\\\"'),'\"')
                FROM med_fieldvalues fv
                JOIN med_fieldtypes ft ON fv.fieldtypeID = ft.fieldtypeID
                WHERE fv.characterID = c.characterID
                AND ft.fieldname='$fieldname'
                AND fv.close_timestamp IS NULL
                ORDER BY fv.mod_timestamp DESC
                LIMIT 1
            ) as `$fieldname`";
        } elseif ($ext != '') {
            throw new Exception("Unknown external table ${ext}");
        } else {
            $qryselect .= ", (
                SELECT CONCAT('[',GROUP_CONCAT(CONCAT('\"',REPLACE(fv.fieldvalue, '\"', '\\\\\"'),'\"') ORDER BY fv.fieldvalueID),']')
                FROM ros_fieldvalues fv
                WHERE fv.characterID = c.characterID
                AND fv.fieldtypeID=$fieldtypeID
                AND NOT EXISTS (SELECT 1 FROM ros_fieldvalues nx
                                WHERE nx.prev_fieldvalueID = fv.fieldvalueID)
            ) as `$fieldname`";
        }
    }
}

$qryselect  .= "
FROM ecc_characters c
WHERE NOT EXISTS (SELECT 1 FROM med_fieldtypes ft JOIN med_fieldvalues fv ON ft.fieldtypeID = fv.fieldvalueID
        WHERE ft.fieldname='exclude' AND fv.characterID = c.characterID)
AND c.character_name IS NOT NULL
ORDER BY character_name";

// Get all the characters in the roster
$result = $conn->query($qryselect);

if ($result) {
    // Build json by hand because it didn't work in one go for some reason
    header('Content-Type: application/json');
    echo "{\"rosters\":".json_encode($rostertypes).",\n\"people\":[";
    $comma = "";
    while ($row = $result->fetch_assoc()) {
        $row = array_filter($row, function($value) { return $value !== null; });
        echo "${comma}{";
        $subcomma = "";
        foreach ($row as $key => $value) {
            $valarr = json_decode($value);
            if (is_array($valarr)) {
                if (count($valarr) == 0) {
                    $value = "null";
                } elseif (count($valarr) == 1) {
                    $value = json_encode($valarr[0]);
                }
            }
            echo $subcomma.json_encode($key).":${value}";
            $subcomma = ",\n";
        }
        echo "}";
        $comma = ",\n";
    }
    // echo "]}";
    echo "],\n\"selectquery\":".json_encode($qryselect)."}";
} else {
    echo "SQL: ${qryselect}";
    die("SQL failure".$conn->error);
}

$conn->close();
?> 
