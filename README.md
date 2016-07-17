# autoSize.js
A simple solution to responsive typography. autoSize.js automatically adjusts the font-size of an element to fill its parent.

Live Demo: https://jsfiddle.net/makememodern/vwg7L7m5/2/

How to Use
==========

* Include autoSize.min.js or autoSize.js before the closing body tag.
```html
<script src="js/autoSize.min.js"></script>
<!-- or -->
<script src="js/autoSize.js"></script>
```

* Add the 'autoSize' class to an HTML element with text.
```html
<!-- This text will fill 100% of its parent's width. -->
<h1 class="autoSize">Hello World</h1>
```
* Add an optional width class.
```html
<!-- This text will fill 80% of its parent's width. -->
<h1 class="autoSize width-80">Hello World</h1>
```
* Add an optional align class.
```html
<!-- This text will fill 80% of its parent's width and be aligned to the right. -->
<h1 class="autoSize width-80 align-right">Hello World</h1>
```
