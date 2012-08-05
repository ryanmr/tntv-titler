<?php

require('functions.php');

$type = $_POST['type'];

if ( $type == 'parse' ) {
  include('process/parse.php');
} else if ( $type  == 'fetch' ) {
  include('process/fetch.php');
} 

