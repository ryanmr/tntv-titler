<?php

$url = trim($_POST['url']);

$html = file_get_contents_utf8($url);
//$response = getRemoteHTML($url);
//$html = $response['body'];
$header = '';

$h1 = getTextBetweenTags($html, 'h1');
$title = getTextBetweenTags($html, 'title');

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

$json = array('h1' => $h1, 'title' => $title, 'header' => $header);

exit( json_encode($json) );