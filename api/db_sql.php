<?php
// Separate file which is not in git repo because it contains password
require_once 'db_config.php';

// Create connection
$conn = new mysqli($db_server, $db_username, $db_password, $db_database, $db_port);

// Check connection
if ($conn->connect_error) {
    throw new Exception("Connection failed: " . $conn->connect_error);
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
?>
