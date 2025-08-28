// Modern entry point for Mahart Linked Notes
import './styles/main.css'
import { initializeApp } from '@/app.js'
import { setupRouter } from '@/router.js'
import { initializeStore } from '@/stores/noteStore.js'
import { initializeAnalytics } from '@/utils/analytics.js'
import { registerServiceWorker } from '@/utils/serviceWorker.js'

// Version info
console.log(`Mahart Linked Notes v${__APP_VERSION__}`)
console.log(`Built: ${__BUILD_TIME__}`)

// Initialize application
async function main() {
  try {
    // Initialize core systems
    await initializeStore()
    await initializeAnalytics()
    
    // Setup routing
    setupRouter()
    
    // Initialize main app
    await initializeApp()
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      await registerServiceWorker()
    }
    
    console.log('✅ Application initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    
    // Show user-friendly error message
    const app = document.getElementById('app')
    if (app) {
      app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div class="text-center">
            <h1 class="text-2xl font-bold mb-4">Application Error</h1>
            <p class="text-gray-400 mb-4">Unable to start Mahart Linked Notes</p>
            <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Reload Application
            </button>
          </div>
        </div>
      `
    }
  }
}

// Start the application
main()
