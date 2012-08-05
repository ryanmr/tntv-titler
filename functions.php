<?php

header('Content-Type: text/plain; charset=utf-8');


  // http://stackoverflow.com/questions/3299033/getting-all-values-from-h1-tags-using-php
  function getTextBetweenTags($string, $tagname){
    $d = new DOMDocument();
    @$d->loadHTML($string);
    $return = array();
    foreach($d->getElementsByTagName($tagname) as $item){
        $return[] = $item->textContent;
    }
    return $return;
}

  function getLink($link, $text) {
    return '<a href="'.$link.'">'.trim($text).'</a>';
  }
  
  function getAllLinks($link, $texts) {
    $r = array();
    foreach ($texts as $text) {
      $r[] = getLink($link, $text);
    }
    return $r;
  }

	function getLinksFromText($raw) {
		$reg_exUrl = "/(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/";

		$matches = array();
		preg_match_all($reg_exUrl, $raw, $matches);
		return $matches[0];
	}

	function getLinksFromSource($source) {
		
	}
  
?>
