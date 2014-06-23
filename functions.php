<?php

/**
 * Gets a UTF-8 compliant remote file/page. 
 */
function file_get_contents_utf8($fn) {
	$content = @file_get_contents($fn);
	if ( $content === false ) {return false;}
	return mb_convert_encoding($content, 'HTML-ENTITIES', "UTF-8");
}

/**
 * Removes extra whitespace.
 * 
 */
function normalize_whitespace($string) {
	return preg_replace( '/\s+/', ' ', $string );
}

/**
 * Removes extra whitespace.
 * 
 */
function is_post($key) {
	return isset($_POST[$key]) && !empty($_POST[$key]);
}

/**
 * Get the remote HTML file with cURL.
 * 
 */
function get_remote_html($url) {

	$ch = curl_init($url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	curl_setopt($ch, CURLOPT_VERBOSE, true); 
	curl_setopt($ch, CURLOPT_HEADER, true);

	$response = curl_exec($ch);

	list($header, $body) = explode("\r\n\r\n", $response, 2);

	return array( 'header' => $header, 'body' => $body );

}

/**
 * Return the response code.
 * 
 */
function get_response_code($header) {
	$parts = explode("\r\n", $header);
	return $part[0];
}

/**
 * Get the text between an open and closing tag.
 * 
 * Note: this does not use regular expressions and relies on DOMDocument
 * for creating a traversible DOM.
 * This function is from: http://stackoverflow.com/questions/3299033/getting-all-values-from-h1-tags-using-php
 * 
 * @param $string a string of HTML, usually an entire document
 * @param $tagname the name of the tag to look for in the DOM
 * @return returns an array of text strings that were found between tags
 */
function get_text_between_tags($string, $tagname){
		$d = new DOMDocument();
		@$d->loadHTML($string);
		$return = array();
		foreach($d->getElementsByTagName($tagname) as $item){
				$return[] = $item->textContent;
		}
		return $return;
}

/**
 * Gets URLs in text.
 * 
 * Notes: this function uses regex to seek URLs in a body of text.
 * 
 * @param $raw a raw document of text to find URLs in
 * @return returns an array of URLs found in a document string
 */
function get_links_from_text($raw) {
	$reg_exUrl = "/(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,4}(\/\S*)?/";

	$matches = array();
	preg_match_all($reg_exUrl, $raw, $matches);
	return $matches[0];
}

/**
 * Removes utm_ query strings from a url.
 *  
 * See: http://forums.phpfreaks.com/topic/257622-remove-utm-tags-from-url-regex/
 * 
 * @param $url a url
 * @return a cleaned url
 */
function remove_utm($url) {
	return preg_replace("/&?utm_(.*?)\=[^&]+/","", $url);
}