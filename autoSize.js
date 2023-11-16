(function() {

    window.autoSize = function() {

        // Get all elements with the 'autoSize' class and cache the length for performance.
        const autoSizeElements = document.getElementsByClassName('autoSize');
        const len = autoSizeElements.length;

        // Iterate over each element with the 'autoSize' class.
        for (let x = 0; x < len; x++) {

            // Default values for width and alignment.
            let targetWidth = 1;
            let targetAlign = 'initial';

            // Access the element's classList.
            const classes = autoSizeElements[x].classList;

            // Iterate over each class to find relevant 'width-' and 'align-' classes.
            classes.forEach(className => {

                // Check and process 'width-' class.
                if (className.startsWith('width-')) {
                    const classWidth = parseInt(className.split('-')[1], 10) * 0.01;
                    targetWidth = classWidth > 1 ? 1 : classWidth;
                }

                // Check and process 'align-' class.
                if (className.startsWith('align-')) {
                    targetAlign = className.split('-')[1];
                }

            });

            // Main resizing logic.
            const element = autoSizeElements[x];

            // Store current text and remove child elements to avoid extra spans.
            const tmp = element.textContent;

            // Clear the element's content.
            element.textContent = '';

            // Create a new span element and set its text.
            const span = document.createElement('span');
            span.textContent = tmp;

            // Append the span to the element.
            element.appendChild(span);

            // Initialize the font size and text alignment.
            element.style.fontSize = '1px';
            element.style.textAlign = targetAlign;

            // Loop to increase font size until the span fills the target width of the parent.
            while (true) {

                // Get the current width of the span (the width of the text).
                const spanWidth = span.getBoundingClientRect().width;

                // Get the width of the parent element.
                const parentWidth = element.parentElement.clientWidth;

                // Calculate the target pixel width based on the parent width and target width.
                const threshold = parentWidth - (parentWidth * (1 - targetWidth));

                // Check if the span's width is less than the threshold.
                if (spanWidth < threshold) {

                    // Get the height of the span.
                    const spanHeight = span.getBoundingClientRect().height;

                    // Get the current font size.
                    const fontSize = parseFloat(window.getComputedStyle(element, null).getPropertyValue('font-size'));

                    // Check if the span's height is greater than double the font size, indicating a line wrap.
                    // If text wrapped to next line, reduce font size and break out of the loop.
                    if (spanHeight > (fontSize * 2)) {
                        element.style.fontSize = `${fontSize - 1.00}px`;
                        break;
                    } else {
                        element.style.fontSize = `${fontSize + 1.00}px`;
                    }

                // If the span fills the parent, break out of the loop.
                } else {
                    break;
                }
            }
        }
    };

    // Debounce function to optimize performance during window resize.
    let resizeTimer;
    window.onresize = function() {

        // Clear the previous timer to debounce the resize event.
        clearTimeout(resizeTimer);

        // Set a new timer with a 250ms delay to re-run the autoSize function.
        resizeTimer = setTimeout(autoSize, 250);

    };

    // Initialize the autoSize function on script load.
    autoSize();

})();
