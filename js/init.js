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
    
    // Enhanced dependency check with more detailed logging
    function checkDependenciesDetailed() {
        const deps = {
            localforage: typeof localforage !== 'undefined',
            marked: typeof marked !== 'undefined',
            DOMPurify: typeof DOMPurify !== 'undefined',
            Chart: typeof Chart !== 'undefined',
            d3: typeof d3 !== 'undefined',
            ULID: typeof ULID !== 'undefined',
            Store: typeof Store !== 'undefined',
            Search: typeof Search !== 'undefined',
            Analytics: typeof Analytics !== 'undefined',
            Graph: typeof Graph !== 'undefined',
            TagManager: typeof TagManager !== 'undefined',
            Router: typeof Router !== 'undefined',
            UI: typeof UI !== 'undefined'
        };
        
        console.log('Dependency check results:', deps);
        return Object.values(deps).every(dep => dep);
    }
    
    // Try to initialize the app with better error handling
    function initApp(attempt = 1) {
        if (attempt > 20) {
            console.error('Failed to initialize app after 20 attempts. Please check console for errors.');
            // Show user-friendly error message
            document.body.innerHTML = `
                <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0f1115;color:#e7ecf5;font-family:sans-serif;">
                    <div style="text-align:center;padding:2rem;background:#151922;border:1px solid #1f2434;border-radius:14px;max-width:500px;">
                        <h2 style="color:#ef476f;margin-top:0;">Initialization Error</h2>
                        <p>Failed to load all required components after multiple attempts.</p>
                        <p>Please check the browser console for detailed error messages.</p>
                        <button onclick="location.reload()" style="background:#1b2130;border:1px solid #2a3147;border-radius:10px;color:#d7def0;padding:8px 16px;cursor:pointer;margin-top:1rem;">Reload Page</button>
                    </div>
                </div>
            `;
            return;
        }
        
        if (checkDependencies() && typeof UI !== 'undefined' && typeof UI.init === 'function') {
            console.log('Initializing Mahart Notes...');
            UI.init().then(() => {
                // Initialize router after UI is ready
                if (typeof Router !== 'undefined') {
                    console.log('Initializing router...');
                    Router.init();
                }
            }).catch(error => {
                console.error('App initialization failed:', error);
                // Try to create a fallback UI
                setTimeout(() => {
                    if (typeof UI !== 'undefined') {
                        UI.createFallbackNote().catch(console.error);
                    }
                }, 1000);
            });
        } else {
            console.log(`Dependencies not ready (attempt ${attempt}), retrying in ${Math.min(attempt * 50, 500)}ms...`);
            setTimeout(() => initApp(attempt + 1), Math.min(attempt * 50, 500));
        }
    }
    
    // Wait for DOM to be loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, starting initialization...');
            initApp();
        });
    } else {
        // DOM is already loaded
        console.log('DOM already loaded, starting initialization...');
        initApp();
    }
    
    // Additional safety check after 5 seconds
    setTimeout(() => {
        if (typeof UI === 'undefined' || typeof UI.init !== 'function') {
            console.warn('UI not initialized after 5 seconds, forcing initialization check...');
            checkDependenciesDetailed();
        }
    }, 5000);
})();