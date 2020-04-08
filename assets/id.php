<?php 

	define( '_JEXEC', 1 );
	define( 'JPATH_BASE', '/var/www/html/');
	
	// Required Files
	require_once (JPATH_BASE . '/includes/defines.php');
	require_once (JPATH_BASE . '/includes/framework.php');
	
	// To use Joomla's Database Class
	
	$app = JFactory::getApplication('site');
	$user = JFactory::getUser();

    if ($user->get('guest')) {
        $cookieName = 'joomla_remember_me_' . JUserHelper::getShortHashedUserAgent();
        // Check for the cookie
        if ($app->input->cookie->get($cookieName))
        {
            $app->login(array('username' => ''), array('silent' => true));
            $user = JFactory::getUser();
        }
    }
    if ($user->get('guest')) {
        http_response_code(403);
        echo "User not logged in";
        die();
    } else {
        $token = trim(file_get_contents("token.txt"));
        echo json_encode(array(id => $user->get('id'), token => $token));
    }
	
?>
