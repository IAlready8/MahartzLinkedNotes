// 👑 Guide: This is the lightweight, dependency-free router that will manage the single-page application states.
// It listens for URL hash changes and triggers the appropriate `onLoad` function for the defined page.

const pages = {};

/**
 * Defines a route and its corresponding page element and initialization function.
 * @param {string} path - The URL hash for the route (e.g., '#/graph').
 * @param {object} pageConfig - Configuration for the page.
 * @param {string} pageConfig.pageId - The ID of the DOM element for the page.
 * @param {function} [pageConfig.onLoad] - The function to call when the page is first loaded.
 */
function definePage(path, pageConfig) {
    console.log(`Defining page: ${path}`);
    pages[path] = pageConfig;
}

/**
 * Hides all registered page elements.
 */
function hideAllPages() {
    Object.values(pages).forEach(p => {
        const el = document.getElementById(p.pageId);
        if (el) {
            el.classList.add('hidden');
        }
    });
}

/**
 * Handles the logic for showing the correct page and running its init function.
 */
function handleRouteChange() {
    const path = window.location.hash || '#/';
    console.log(`Route changed to: ${path}`);
    
    const pageConfig = pages[path];

    if (pageConfig) {
        hideAllPages();
        const pageElement = document.getElementById(pageConfig.pageId);
        if (!pageElement) {
            console.error(`Router error: Element with ID '${pageConfig.pageId}' not found.`);
            return;
        }
        pageElement.classList.remove('hidden');
        
        // Ensure the onLoad function is only called once to prevent re-initialization.
        if (pageConfig.onLoad && !pageConfig.loaded) {
            console.log(`Loading initial data for ${pageConfig.pageId}`);
            pageConfig.onLoad();
            pageConfig.loaded = true; // Mark as loaded
        }
    } else {
        console.warn(`No page found for path: ${path}. Redirecting to home.`);
        window.location.hash = '#/';
    }
}

/**
 * Initializes the router, sets up event listeners, and triggers the initial route handling.
 */
function initRouter() {
    console.log('Initializing router...');
    window.addEventListener('hashchange', handleRouteChange);
    
    // Ensure the default route is handled on first load if no hash is present.
    if (!window.location.hash) {
        window.location.hash = '#/';
    }
    
    handleRouteChange();
}
