tntv-titler
===========

A tool to read through show notes to get appropriate titles based on remote markup.

This automated titling tool extracts:
- title tags and their contents
- h1 tags and their contents

While pages usually have a single title tag, frequently pages misuse h1 heading tags. The titler will automatically rank alternative h1 tags down in importance going down the given page.

Usage
-----

1. Simply paste your standard raw show notes into the the textarea and _click_ **Parse**.
2. The URLs in the show notes will be parsed from the document.
3. Each URL will be shown inside a _card_ and below the parsed titles will be listed.
4. To use a title, simply _click_ on it. These titles are also editable if tweaks are needed.
5. At the end of the _card_ list, _click_ **Transcribe**, which will generate standard content for the TNTV CMS.