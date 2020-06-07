<?php

if (is_post('url') == false) {
	die('no url');
}

$url = trim($_POST['url']);
$originalUrl = trim($_POST['url']);

$isTwitterUrl = preg_match('/https:\/\/twitter\.com\/(.*)/i', $originalUrl, $isTwitterUrlMatches);

if ($isTwitterUrl) {
	// rewrite url
	$slugPart = $isTwitterUrlMatches[1];
	$url = "https://mobile.twitter.com/$slugPart";
}

$isTwitterStatus = preg_match('/https:\/\/twitter\.com\/(.*)\/status\/([0-9]*)/i', $originalUrl, $isTwitterStatusMatches);

if ($isTwitterStatus) {
	// rewrite url
	$url = $originalUrl;
}

$html = false;
if ($isTwitterStatus) {
	$html = file_get_contents_utf8_advanced($url);
} else {
	$html = file_get_contents_utf8($url);
}

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

$h1 = array_map(function ($str) {
	return wordwrap($str, 50, "\n", false);
}, $h1);
$title = array_map(function ($str) {
	return wordwrap($str, 50, "\n", false);
}, $title);

$json = array('h1' => $h1, 'title' => $title);

exit( json_encode($json) );