// Ensure all scripts are loaded before initializing
(function() {
    // Check if all required libraries are loaded
    function checkDependencies() {
        return typeof localforage !== 'undefined' &&
               typeof marked !== 'undefined' &&
               typeof DOMPurify !== 'undefined' &&
               typeof Chart !== 'undefined' &&
               typeof d3 !== 'undefined' &&
               typeof ULID !== 'undefined' &&
               typeof Store !== 'undefined' &&
               typeof Search !== 'undefined' &&
               typeof Analytics !== 'undefined' &&
               typeof Graph !== 'undefined' &&
               typeof TagManager !== 'undefined' &&
               typeof UI !== 'undefined';
    }
    
    // Try to initialize the app
    function initApp() {
        if (checkDependencies() && typeof UI !== 'undefined' && typeof UI.init === 'function') {
            console.log('Initializing Mahart Notes...');
            UI.init().catch(console.error);
        } else {
            console.log('Dependencies not ready, retrying in 100ms...');
            setTimeout(initApp, 100);
        }
    }
    
    // Wait for DOM to be loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        // DOM is already loaded
        initApp();
    }
})();