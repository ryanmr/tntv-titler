<?php

$raw = $_POST['data'];

$matches = getLinksFromText($raw);

$json = array( 'urls' => $matches );

exit( json_encode($json) );