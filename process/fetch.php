<?php

if (is_post('url') == false) {
	die('no url');
}

$url = trim($_POST['url']);

$html = file_get_contents_utf8($url);

if ( $html === false ) {
	die('no response');
}

$h1 = get_text_between_tags($html, 'h1');
$title = get_text_between_tags($html, 'title');

/**
 * Controls image titles.
 */
if ( stristr($url, '.jpg') || stristr($url, '.jpeg') || stristr($url, '.gif') || stristr($url, '.png') ) {
	$parts = explode('/', $url);
	$title[] = "Image: " . end($parts);
}

if ( stristr($url, '.pdf') ) {
	$parts = explode('/', $url);
	$title[] = "PDF: " . end($parts);
}

if ( isset($title[0]) == false || trim($title[0]) == "" ) {
	$title[0] = 'Untitled: ' . $url;
}

$h1 = array_map('trim', $h1);
$title = array_map('trim', $title);

$h1 = array_filter($h1, function($str) {
	if ( $str != '' ) return true;
	return false;
});

$h1 = array_map('normalize_whitespace', $h1);
$title = array_map('normalize_whitespace', $title);

$json = array('h1' => $h1, 'title' => $title);

exit( json_encode($json) );