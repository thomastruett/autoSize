(function() {

    window.autoSize = function() {

        // Iterate through all elements with the 'autoSize' class.
        var autoSizeElements = document.getElementsByClassName('autoSize');
        for (var x = 0; x < autoSizeElements.length; x++) {

            // Initialize styling variables.
            var targetWidth = 1;
            var targetAlign = 'initial';

            // Iterate through the element's class list.
            var classes = autoSizeElements[x].className.split(' ');
            for (var y in classes) {

                // Check if element contains any 'width-XX' classes.
                if (classes[y].indexOf('width-') > -1) {

                    // Store the number from the class, which determines the width.
                    // Convert the number to decimal (90 >>> 0.90)
                    var classWidth = parseInt(classes[y].split('-')[1]) * 0.01;

                    // Set targetWidth to 1 if classWidth is greater than 1.
                    var targetWidth = classWidth > 1 ? 1 : classWidth;

                }

                // Check if element contains any 'align-XX' classes.
                if (classes[y].indexOf('align-') > -1) {

                    // Store the value from the class, which will determine the alignment.
                    var targetAlign = classes[y].split('-')[1];

                }

            }

            // Store current HTML and remove all existing span tags.
            var tmp = autoSizeElements[x].innerHTML.replace(/<span>/g, '').replace(/<\/span>/g, '');

            // Wrap HTML in new span tag.
            autoSizeElements[x].innerHTML = '<span>' + tmp + '</span>';

            // Reset font size to 1px.
            autoSizeElements[x].style.fontSize = '1px';

            // Set element's text alignment.
            autoSizeElements[x].style.textAlign = targetAlign;
            
            // Loop through and increase font size until the span fills the target width of the parent.
            while (true) {

                // Store width of span tag (the width of the text).
                var spanWidth = autoSizeElements[x].childNodes[0].getBoundingClientRect().width;
            
                // Store the width of the parent element.
                var parentWidth = autoSizeElements[x].parentElement.clientWidth;

                // Calculate and set target pixel width.
                // 1200px - (1200px * (1 - 0.90))
                // 1200px - (1200px * 0.10)
                // 1200px - (120px)
                // 1080px = (90%)
                var threshold = parentWidth - (parentWidth * (1 - targetWidth));

                // If the inner text's width is less than the calculated threshold.
                if (spanWidth < threshold) {

                    // Store the height of the inner span.
                    var spanHeight = autoSizeElements[x].childNodes[0].getBoundingClientRect().height;

                    // Store the size of the font.
                    var fontSize = parseFloat(window.getComputedStyle(autoSizeElements[x], null).getPropertyValue('font-size'));
                
                    // If span height is greater than double the font-size then the text has shifted to 2 lines.
                    if (spanHeight > (fontSize * 2)) {
                        
                        // Reduce font-size by one pixel and break.
                        autoSizeElements[x].style.fontSize = fontSize - 1.00 + 'px';
                        break;

                    } else {

                        // Increase the text size of the element by 1 pixel
                        autoSizeElements[x].style.fontSize = fontSize + 1.00 + 'px';

                    }

                // Parent is filled
                } else { break; }
                
            }
            
        }

    }

    // Resize text on window resize.
    window.onresize = function() { autoSize(); };

    // Initiate
    autoSize();

})();