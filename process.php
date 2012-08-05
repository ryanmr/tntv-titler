<?php

/**
 * Handles all JSON requests. 
 * 
 * All includes must call exit.
 */

require('functions.php');

$type = $_POST['type'];

if ( $type == 'parse' ) {
  include('process/parse.php');
} else if ( $type  == 'fetch' ) {
  include('process/fetch.php');
} 

exit( json_encode('error' => 'no-type') );