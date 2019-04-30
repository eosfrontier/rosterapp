<?php

require_once 'joomla.php'
require_once 'db_sql.php'

$result = exec_sql("SELECT characterID,character_name FROM ecc_characters WHERE card_id IS NOT NULL AND card_id <> '' ORDER BY characterID DESC LIMIT 1");
$user_characterID = 0;
$user_character_name = '';
if ($result->num_rows >= 1) {
  $resultassoc = $result->fetch_assoc();
  $user_characterID = $resultassoc['characterID'];
  $user_character_name = $resultassoc['character_name'];
}
