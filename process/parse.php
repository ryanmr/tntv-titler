<?php

if (is_post('data') == false) {
	exit(json_encode(array('error' => 'no data')));
}

$raw = $_POST['data'];

$matches = get_links_from_text($raw);

$matches = array_map('remove_utm', $matches);

$json = array( 'urls' => $matches );

exit( json_encode($json) );