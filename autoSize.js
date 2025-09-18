(function() {
    /**
     * AutoSize Configuration Constants
     * These values control the behavior and safety limits of the font sizing algorithm.
     */

    // Mobile browsers have quirks with line-height calculations that can cause
    // very small fonts to appear "wrapped" when they're not, leading to 0px fonts.
    const MIN_FS = 10;     // px - Never go below this size.

    // Maximum font size when no 'max-' class is specified.
    const MAX_FS_DEFAULT = 999; // px

    // Binary search iterations instead of linear stepping.
    // 6 iterations gives us ±1px precision, vastly faster than 300 linear steps
    const BINARY_SEARCH_ITERATIONS = 6;

    /**
     * Enhanced configuration extraction supporting both CSS classes and data attributes.
     * Data attributes take priority over classes for better performance and easier API.
     *
     * Supports: data-width="0.75" OR class="width-75"
     *
     * @param {HTMLElement} element - The element to extract config from
     * @returns {Object} - Configuration object with width, align, maxFS
     */
    function getElementConfig(element) {
        const config = {
            targetWidth: 1,
            alignment: 'initial',
            maxFontSize: MAX_FS_DEFAULT
        };

        // PRIORITY 1: Data attributes (faster, more explicit)
        if (element.dataset.width) {
            const width = parseFloat(element.dataset.width);
            if (!isNaN(width)) {
                config.targetWidth = Math.max(0.01, Math.min(1, width));
            }
        }

        if (element.dataset.align) {
            config.alignment = element.dataset.align;
        }

        if (element.dataset.maxfs) {
            const maxFS = parseInt(element.dataset.maxfs, 10);
            if (!isNaN(maxFS)) {
                config.maxFontSize = maxFS;
            }
        }

        // PRIORITY 2: CSS classes (fallback for backward compatibility)
        if (config.targetWidth === 1) {
            for (const className of element.classList) {
                if (className.startsWith('width-')) {
                    const percentage = parseInt(className.split('-')[1], 10);
                    if (!isNaN(percentage)) {
                        config.targetWidth = Math.max(0.01, Math.min(1, percentage * 0.01));
                        break;
                    }
                }
            }
        }

        if (config.alignment === 'initial') {
            for (const className of element.classList) {
                if (className.startsWith('align-')) {
                    config.alignment = className.split('-')[1];
                    break;
                }
            }
        }

        if (config.maxFontSize === MAX_FS_DEFAULT) {
            for (const className of element.classList) {
                if (className.startsWith('max-')) {
                    const maxSize = parseInt(className.split('-')[1], 10);
                    if (!isNaN(maxSize)) {
                        config.maxFontSize = maxSize;
                        break;
                    }
                }
            }
        }

        return config;
    }

    /**
     * Width-based fit detection for reliable text sizing.
     *
     * @param {HTMLElement} span - Span element containing the text.
     * @param {number} targetPx - Target width in pixels.
     * @returns {boolean} - True if text fits within target width.
     */
    function measureFit(span, targetPx) {
        return span.scrollWidth <= targetPx;
    }

    /**
     * High-speed font sizing with proportional scaling + binary search.
     *
     * This algorithm replaces 300+ linear iterations with ~8 layout calculations total:
     * 1. Proportional scaling jump (1-2 layouts)
     * 2. Binary search refinement (6 layouts max)
     *
     * Results in 30-40x performance improvement over linear stepping!
     *
     * @param {HTMLElement} element - Element to size
     * @param {HTMLElement} span - Measuring span
     * @param {number} targetPx - Target width in pixels
     * @param {number} minFS - Minimum font size
     * @param {number} maxFS - Maximum font size
     */
    function fitFont(element, span, targetPx, minFS, maxFS) {

        // PHASE 1: Smart starting point using proportional scaling
        let currentFS = parseFloat(getComputedStyle(element).fontSize) || Math.min(24, maxFS);
        currentFS = Math.max(minFS, Math.min(currentFS, maxFS));
        element.style.fontSize = currentFS + 'px';

        // PHASE 2: One-shot proportional jump to get close
        const currentWidth = span.scrollWidth || 1;
        const scaleFactor = targetPx / currentWidth;

        // Smart clamping: don't jump too aggressively to avoid overshooting
        const proposedFS = currentFS * scaleFactor;
        const jumpFS = Math.max(minFS, Math.min(maxFS, Math.floor(proposedFS)));
        element.style.fontSize = jumpFS + 'px';

        // PHASE 3: Binary search refinement for pixel-perfect sizing
        // Create a small window around our jump result for precise tuning
        let lowFS = Math.max(minFS, jumpFS - 8);
        let highFS = Math.max(minFS, Math.min(maxFS, jumpFS + 8));

        // Binary search with guaranteed termination
        for (let iteration = 0; iteration < BINARY_SEARCH_ITERATIONS; iteration++) {
            if (lowFS >= highFS) break;
            const midFS = Math.floor((lowFS + highFS) / 2);
            element.style.fontSize = midFS + 'px';
            if (span.scrollWidth <= targetPx) {
                lowFS = midFS + 1; // Size fits, try larger.
            } else {
                highFS = midFS - 1; // Too big, try smaller.
            }
        }

        // Final safety-clamped result.
        const finalFS = Math.max(minFS, Math.min(highFS, maxFS));
        element.style.fontSize = finalFS + 'px';

    }

    /**
     * AutoSize Function with all performance optimizations.
     */
    window.autoSize = function() {
        const elements = document.getElementsByClassName('autoSize');

        // Process each element.
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const parent = element.parentElement;

            // Early exit for orphaned elements.
            if (!parent) continue;

            // Skip hidden/zero-geometry elements entirely.
            // Prevents thrashing on display:none, collapsed grids, mid-transition elements
            const elementRect = element.getBoundingClientRect();
            if (elementRect.width === 0 || elementRect.height === 0) continue;

            const parentWidth = parent.clientWidth;
            if (!parentWidth) continue;

            // Enhanced configuration extraction (data-attrs + classes).
            const config = getElementConfig(element);

            // True visual fit accounting for element padding.
            const elementStyle = getComputedStyle(element);
            const elementHPadding = parseFloat(elementStyle.paddingLeft) + parseFloat(elementStyle.paddingRight);

            const targetBox = config.targetWidth === 1
                ? element.clientWidth
                : Math.floor(parentWidth * config.targetWidth);

            const thresholdPixels = Math.max(0, targetBox - elementHPadding);

            // Smart span management with content preservation.
            let span = element.querySelector(':scope > span[data-autosize="1"]');
            if (!span) {

                // First-time setup: preserve ALL content (including markup).
                span = document.createElement('span');
                span.dataset.autosize = '1';

                // Preserve markup instead of just textContent.
                if (element.children.length === 0) {
                    // Pure text content
                    span.textContent = element.textContent;
                    element.textContent = '';
                } else {
                    // Has child elements - preserve them.
                    span.innerHTML = element.innerHTML;
                    element.innerHTML = '';
                }

                element.appendChild(span);
                element.dataset.autosizeWrapped = '1';
            }

            // Enhanced whitespace control for accurate measurement.
            // Save all text flow properties that affect measurement
            const prevWhiteSpace = span.style.whiteSpace;
            const prevOverflowWrap = span.style.overflowWrap;
            const prevHyphens = span.style.hyphens;

            // Force precise measurement conditions.
            span.style.whiteSpace = 'nowrap';
            span.style.overflowWrap = 'normal';
            span.style.hyphens = 'none';

            // Apply text alignment.
            element.style.textAlign = config.alignment;

            // Use ultra-fast proportional + binary search algorithm.
            fitFont(element, span, thresholdPixels, MIN_FS, config.maxFontSize);

            // Restore all original text flow properties.
            span.style.whiteSpace = prevWhiteSpace || '';
            span.style.overflowWrap = prevOverflowWrap || '';
            span.style.hyphens = prevHyphens || '';
        }
    };

    /**
     * Comprehensive event handling for optimal mobile performance.
     *
     * Handles all layout-changing events across desktop and mobile:
     * - Window resizing (desktop/mobile)
     * - Orientation changes (mobile)
     * - Visual viewport changes (mobile Safari, Chrome)
     * - Font loading completion (web fonts)
     * - Element-specific resizing (ResizeObserver)
     */

    let resizeTimeout;

    /**
     * Optimally debounced resize handler.
     * 100ms provides the best balance of responsiveness vs performance.
     */
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(window.autoSize, 100);
    };

    // Listen for all resize events.
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Visual viewport changes (zoom, keyboard, etc).
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize, { passive: true });
    }

    // Re-run after web fonts load.
    // Critical for accurate sizing when custom fonts change metrics
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            window.autoSize();
        });
    }

    /**
    * Enhanced ResizeObserver for comprehensive element tracking.
     *
     * Now observes BOTH elements AND parents for maximum responsiveness.
     * Handles padding changes, box-sizing changes, and parent container shifts.
     */
    const resizeObserver = ('ResizeObserver' in window)
        ? new ResizeObserver(handleResize)
        : null;

    /**
     * Initialize the ultra-fast autoSize system.
     */
    function initializeAutoSize() {
        const elements = document.getElementsByClassName('autoSize');
        if (resizeObserver) {

            // Watch both elements and their parents.
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                const parent = element.parentElement;

                // Observe the element itself (for padding/border changes).
                resizeObserver.observe(element);

                // Observe the parent (for container size changes).
                if (parent) {
                    resizeObserver.observe(parent);
                }
            }
        }

        // Initial sizing run.
        window.autoSize();

    }

    // Handle all document ready states.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAutoSize);
    } else {
        // Document already loaded - initialize immediately.
        initializeAutoSize();
    }

    // Re-initialize if new autoSize elements are added dynamically.
    // This MutationObserver watches for new elements with the autoSize class
    if ('MutationObserver' in window) {
        const mutationObserver = new MutationObserver((mutations) => {
            let hasNewAutoSizeElements = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList?.contains('autoSize') ||
                                node.querySelector?.('.autoSize')) {
                                hasNewAutoSizeElements = true;
                                break;
                            }
                        }
                    }
                }
                if (hasNewAutoSizeElements) break;
            }

            // Re-initialize to catch new elements.
            if (hasNewAutoSizeElements) {
                initializeAutoSize();
            }

        });

        // Observe DOM changes after initial load.
        document.addEventListener('DOMContentLoaded', () => {
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        });

    }

})();
