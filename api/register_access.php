<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); 

require_once 'db_sql.php';
 
if(strcasecmp($_SERVER['REQUEST_METHOD'], 'GET') == 0){
    echo "<html><body><h2>Access log:</h2>";
    $result = exec_sql("
    SELECT fieldvalue, character_name, card_id FROM ros_fieldvalues
    LEFT OUTER JOIN ecc_characters ON (ecc_characters.card_id like concat(substring(ros_fieldvalues.fieldvalue,1,8),'%'))
    WHERE fieldtypeID=7777
    ");
    while ($row = $result->fetch_assoc()) {
        echo "<p>Access: ${row['fieldvalue']} ${row['character_name']} ${row['card_id']}</p>";
    }
    echo "</body></html>";
    $conn->close();
    exit;
}
if(strcasecmp($_SERVER['REQUEST_METHOD'], 'POST') != 0){
    throw new Exception('Request method must be GET or POST!');
}
$contentType = trim(preg_replace("/;.*$/" ,"", isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : ''));

if (strcasecmp($contentType, 'application/json') == 0){
    $postcontent = json_decode(trim(file_get_contents("php://input")), true);
    if (!is_array($postcontent)) {
        throw new Exception("Unable to decode JSON content");
    }
    $cardid = $postcontent["cardid"];
    $timestamp = $postcontent["timestamp"];
} else {
    throw new Exception("Unsupported content type: ${contentType}");
}

$valueesc = "'".$conn->real_escape_string($cardid)." - ".$conn->real_escape_string($timestamp)."'";

exec_sql("
    INSERT INTO ros_fieldvalues (fieldtypeID, characterID, prev_fieldvalueID, fieldvalue, mod_characterID)
    VALUES (7777, 0, 0, ${valueesc}, 0)
    ");

$conn->close();
echo "OK";
?> 
