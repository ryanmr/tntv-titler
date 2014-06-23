tntv-titler
===========

A tool to read through show notes to get appropriate titles based on remote markup.

This automated titling tool extracts the remote page's *title tag* primarily. While pages usually have a single title tag, frequently pages misuse h1 heading tags. The titler will automatically rank alternative h1 tags down in importance going down the given page.

Usage
-----

To define a header in your show notes, use the pound symbol (*#*) at the beginning of the line you want to be a header. It will also remove any text after a *//* in the same line as a header, so you can use those as comments. Links below a header will be a part of that section's unordered list.

If there is no leading header, a generic *Links* header is provided automatically. If there are sections that have empty lists, they are removed from the output.

Examples
--------

You can look in [the examples text file](examples.txt).