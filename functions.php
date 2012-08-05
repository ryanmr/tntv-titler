<?php
/**
 * Get the text between an open and closing tag.
 * 
 * Note: this does not use regular expressions and replies on DOMDocument
 * for creating a traversible DOM.
 * This function is from: http://stackoverflow.com/questions/3299033/getting-all-values-from-h1-tags-using-php
 * 
 * @param $string a string of HTML, usually an entire document
 * @param $tagname the name of the tag to look for in the DOM
 * @return returns an array of text strings that were found between tags
 */
function getTextBetweenTags($string, $tagname){
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
function getLinksFromText($raw) {
	$reg_exUrl = "/(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/";

	$matches = array();
	preg_match_all($reg_exUrl, $raw, $matches);
	return $matches[0];
}