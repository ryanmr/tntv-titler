<?php

/*foreach ($matches[0] as $match){
  $html = file_get_contents($match);
  $titles = getTextBetweenTags($html, "h1");
  $output = getAllLinks($match, $titles);
  foreach ($output as $o) {
    echo "<li>".$o."</li>"; echo "\n<!-- -->\n";
  }
  echo "\n\n\n\n";
}*/

$url = $_POST['url'];

$html = file_get_contents($url);

$h1 = getTextBetweenTags($html, 'h1');
$title = getTextBetweenTags($html, 'title');

/**
 * Controls image titles.
 */
if ( stristr($url, '.jpg') || stristr($url, '.gif') || stristr($url, '.png') ) {
	$parts = explode('/', $url);
	$title[] = "Image: " . end($parts);
}

$json = array('h1' => $h1, 'title' => $title);

exit( json_encode($json) );