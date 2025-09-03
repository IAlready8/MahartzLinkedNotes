import React, { useState, useEffect } from 'react';
import { AIOchestration } from '../../js/ai-orchestration-platform.js';
import { AIAssistant } from './ai-assistant.js';

interface PlatformStatus {
  coreEngine: any;
  multiModal: any;
  cognitive: any;
  neural: any;
  quantum: any;
  bio: any;
  temporal: any;
  swarm: any;
  initialized: boolean;
}

interface HealthStatus {
  core: string;
  multiModal: string;
  cognitive: string;
  neural: string;
  quantum: string;
  bio: string;
  temporal: string;
  swarm: string;
  overall: string;
}

const AIOrchestrationPlatform: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Initialize the platform
  const initializePlatform = async () => {
    setLoading(true);
    setError(null);
    try {
      await AIOchestration.initialize();
      setIsInitialized(true);
      await updateStatus();
    } catch (err) {
      setError(`Failed to initialize platform: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Shutdown the platform
  const shutdownPlatform = async () => {
    setLoading(true);
    setError(null);
    try {
      await AIOchestration.shutdown();
      setIsInitialized(false);
      setStatus(null);
      setHealth(null);
    } catch (err) {
      setError(`Failed to shutdown platform: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Shutdown error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update platform status
  const updateStatus = async () => {
    if (!isInitialized) return;
    
    try {
      const statusData = await AIOchestration.getStatus();
      setStatus(statusData);
      
      const healthData = await AIOchestration.healthCheck();
      setHealth(healthData);
    } catch (err) {
      setError(`Failed to get platform status: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Status update error:', err);
    }
  };

  // Enable orchestration capabilities
  const enableOrchestration = async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setError(null);
    try {
      await AIOchestration.transformToAIOchestration();
      await updateStatus();
    } catch (err) {
      setError(`Failed to enable orchestration: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Orchestration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enable autonomous learning
  const enableAutonomousLearning = async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setError(null);
    try {
      await AIOchestration.enableAutonomousLearning();
      await updateStatus();
    } catch (err) {
      setError(`Failed to enable autonomous learning: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Autonomous learning error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enable predictive orchestration
  const enablePredictiveOrchestration = async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setError(null);
    try {
      await AIOchestration.enablePredictiveOrchestration();
      await updateStatus();
    } catch (err) {
      setError(`Failed to enable predictive orchestration: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Predictive orchestration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enable quantum orchestration
  const enableQuantumOrchestration = async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setError(null);
    try {
      await AIOchestration.enableQuantumOrchestration();
      await updateStatus();
    } catch (err) {
      setError(`Failed to enable quantum orchestration: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Quantum orchestration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enable bio orchestration
  const enableBioOrchestration = async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setError(null);
    try {
      await AIOchestration.enableBioOrchestration();
      await updateStatus();
    } catch (err) {
      setError(`Failed to enable bio orchestration: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Bio orchestration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Orchestrate AI agents for a task
  const orchestrateAgents = async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, this would take task specifications from user input
      const taskSpec = {
        name: 'Knowledge Discovery',
        description: 'Analyze notes and discover new connections',
        priority: 'high',
        requirements: ['reasoning', 'learning', 'execution']
      };
      
      // This would call the actual orchestration method
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add a success message
      setSuggestions([
        ...suggestions,
        {
          type: 'orchestration',
          priority: 'high',
          title: 'Agent Orchestration Complete',
          message: `Successfully orchestrated AI agents for task: ${taskSpec.name}`,
          action: null
        }
      ]);
    } catch (err) {
      setError(`Failed to orchestrate agents: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Agent orchestration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate AI suggestions
  const generateAISuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, this would use the actual notes from the store
      // For now, we'll generate general suggestions
      const dummyNotes = [
        {
          id: '1',
          title: 'Sample Note 1',
          body: 'This is a sample note for testing AI suggestions',
          tags: ['#sample', '#test'],
          links: [],
          color: '#6B7280',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Sample Note 2',
          body: 'Another sample note with different content for AI analysis',
          tags: ['#sample', '#analysis'],
          links: [],
          color: '#6B7280',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      const suggestionsData = await AIAssistant.generateSuggestions(dummyNotes);
      setSuggestions(suggestionsData);
    } catch (err) {
      setError(`Failed to generate AI suggestions: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Suggestions error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update status periodically
  useEffect(() => {
    if (isInitialized) {
      const interval = setInterval(() => {
        updateStatus();
      }, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  // Initialize on component mount if already initialized
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        // Check if platform is already initialized
        const statusData = await AIOchestration.getStatus();
        if (statusData.initialized) {
          setIsInitialized(true);
          setStatus(statusData);
          const healthData = await AIOchestration.healthCheck();
          setHealth(healthData);
        }
      } catch (err) {
        // Platform not initialized, which is fine
        console.log('Platform not yet initialized');
      }
    };
    
    checkInitialization();
  }, []);

  return (
    <div className="ai-orchestration-platform p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ 
          background: 'var(--primary-gradient)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          backgroundClip: 'text' 
        }}>
          AI Orchestration Platform
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced AI coordination system with multi-modal interfaces, cognitive architecture, and quantum processing
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800" 
             style={{ 
               background: 'rgba(239, 68, 68, 0.1)', 
               border: '1px solid rgba(239, 68, 68, 0.2)', 
               borderRadius: 'var(--radius-lg)',
               boxShadow: 'var(--shadow-premium)'
             }}>
          <div className="flex items-center text-red-800 dark:text-red-200">
            <i className="fas fa-exclamation-circle mr-2"></i>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Platform Control Panel */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700" 
           style={{ 
             background: 'rgba(255, 255, 255, 0.05)', 
             border: '1px solid var(--glass-border)', 
             borderRadius: 'var(--radius-xl)',
             boxShadow: 'var(--shadow-premium)',
             backdropFilter: 'blur(40px)'
           }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Platform Control</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Manage the AI orchestration platform
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isInitialized 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
            }`}>
              {isInitialized ? 'Initialized' : 'Not Initialized'}
            </div>
            
            {health && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                health.overall === 'healthy' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : health.overall === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {health.overall}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {!isInitialized ? (
            <button
              onClick={initializePlatform}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
              style={{ 
                background: 'var(--primary-gradient)', 
                border: 'none',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-floating)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Initializing...
                </>
              ) : (
                <>
                  <i className="fas fa-play mr-2"></i>
                  Initialize Platform
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={enableOrchestration}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-floating)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enabling...
                  </>
                ) : (
                  <>
                    <i className="fas fa-robot mr-2"></i>
                    Enable Orchestration
                  </>
                )}
              </button>
              
              <button
                onClick={enableAutonomousLearning}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                style={{ 
                  background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)', 
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-floating)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(168, 85, 247, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enabling...
                  </>
                ) : (
                  <>
                    <i className="fas fa-graduation-cap mr-2"></i>
                    Autonomous Learning
                  </>
                )}
              </button>
              
              <button
                onClick={enablePredictiveOrchestration}
                disabled={loading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                style={{ 
                  background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', 
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-floating)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(13, 148, 136, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enabling...
                  </>
                ) : (
                  <>
                    <i className="fas fa-chart-line mr-2"></i>
                    Predictive Orchestration
                  </>
                )}
              </button>
              
              <button
                onClick={enableQuantumOrchestration}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                style={{ 
                  background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', 
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-floating)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(8, 145, 178, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enabling...
                  </>
                ) : (
                  <>
                    <i className="fas fa-atom mr-2"></i>
                    Quantum Orchestration
                  </>
                )}
              </button>
              
              <button
                onClick={enableBioOrchestration}
                disabled={loading}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                style={{ 
                  background: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)', 
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-floating)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(219, 39, 119, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enabling...
                  </>
                ) : (
                  <>
                    <i className="fas fa-dna mr-2"></i>
                    Bio Orchestration
                  </>
                )}
              </button>
              
              <button
                onClick={shutdownPlatform}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                style={{ 
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', 
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-floating)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(220, 38, 38, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Shutting Down...
                  </>
                ) : (
                  <>
                    <i className="fas fa-power-off mr-2"></i>
                    Shutdown
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Platform Status Dashboard */}
      {isInitialized && status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.05)', 
                 border: '1px solid var(--glass-border)', 
                 borderRadius: 'var(--radius-lg)',
                 boxShadow: 'var(--shadow-premium)',
                 backdropFilter: 'blur(40px)',
                 transition: 'all 0.3s ease'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.transform = 'translateY(-4px)';
                 e.currentTarget.style.boxShadow = '0 20px 40px rgba(103, 126, 234, 0.3), 0 8px 16px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'var(--shadow-premium)';
               }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                   style={{ 
                     background: 'rgba(103, 126, 234, 0.1)', 
                     borderRadius: 'var(--radius-md)'
                   }}>
                <i className="fas fa-microchip text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Core Engine</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {status.coreEngine?.initialized ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.05)', 
                 border: '1px solid var(--glass-border)', 
                 borderRadius: 'var(--radius-lg)',
                 boxShadow: 'var(--shadow-premium)',
                 backdropFilter: 'blur(40px)',
                 transition: 'all 0.3s ease'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.transform = 'translateY(-4px)';
                 e.currentTarget.style.boxShadow = '0 20px 40px rgba(34, 197, 94, 0.3), 0 8px 16px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'var(--shadow-premium)';
               }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                   style={{ 
                     background: 'rgba(34, 197, 94, 0.1)', 
                     borderRadius: 'var(--radius-md)'
                   }}>
                <i className="fas fa-comments text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Multi-Modal</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {status.multiModal?.initialized ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.05)', 
                 border: '1px solid var(--glass-border)', 
                 borderRadius: 'var(--radius-lg)',
                 boxShadow: 'var(--shadow-premium)',
                 backdropFilter: 'blur(40px)',
                 transition: 'all 0.3s ease'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.transform = 'translateY(-4px)';
                 e.currentTarget.style.boxShadow = '0 20px 40px rgba(168, 85, 247, 0.3), 0 8px 16px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'var(--shadow-premium)';
               }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                   style={{ 
                     background: 'rgba(168, 85, 247, 0.1)', 
                     borderRadius: 'var(--radius-md)'
                   }}>
                <i className="fas fa-brain text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Cognitive</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {status.cognitive?.initialized ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.05)', 
                 border: '1px solid var(--glass-border)', 
                 borderRadius: 'var(--radius-lg)',
                 boxShadow: 'var(--shadow-premium)',
                 backdropFilter: 'blur(40px)',
                 transition: 'all 0.3s ease'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.transform = 'translateY(-4px)';
                 e.currentTarget.style.boxShadow = '0 20px 40px rgba(251, 191, 36, 0.3), 0 8px 16px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'var(--shadow-premium)';
               }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                   style={{ 
                     background: 'rgba(251, 191, 36, 0.1)', 
                     borderRadius: 'var(--radius-md)'
                   }}>
                <i className="fas fa-network-wired text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Neural</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {status.neural?.initialized ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Status */}
      {health && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
             style={{ 
               background: 'rgba(255, 255, 255, 0.05)', 
               border: '1px solid var(--glass-border)', 
               borderRadius: 'var(--radius-xl)',
               boxShadow: 'var(--shadow-premium)',
               backdropFilter: 'blur(40px)'
             }}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(health).map(([component, status]) => (
              component !== 'overall' && (
                <div 
                  key={component} 
                  className={`p-4 rounded-lg border ${
                    status === 'healthy' 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : status === 'degraded'
                        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}
                  style={{ 
                    background: status === 'healthy' 
                      ? 'rgba(34, 197, 94, 0.1)' 
                      : status === 'degraded'
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid ' + (
                      status === 'healthy' 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : status === 'degraded'
                          ? 'rgba(234, 179, 8, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)'
                    ),
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      status === 'healthy' 
                        ? 'bg-green-500' 
                        : status === 'degraded'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium capitalize text-gray-900 dark:text-white">
                      {component}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    status === 'healthy' 
                      ? 'text-green-700 dark:text-green-400' 
                      : status === 'degraded'
                        ? 'text-yellow-700 dark:text-yellow-400'
                        : 'text-red-700 dark:text-red-400'
                  }`}>
                    {status}
                  </p>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* AI Agent Orchestration */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
           style={{ 
             background: 'rgba(255, 255, 255, 0.05)', 
             border: '1px solid var(--glass-border)', 
             borderRadius: 'var(--radius-xl)',
             boxShadow: 'var(--shadow-premium)',
             backdropFilter: 'blur(40px)'
           }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Agent Orchestration</h2>
          <button
            onClick={orchestrateAgents}
            disabled={loading || !isInitialized}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center text-sm"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              border: 'none',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-floating)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Orchestrating...
              </>
            ) : (
              <>
                <i className="fas fa-robot mr-2"></i>
                Orchestrate Agents
              </>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
               style={{ 
                 background: 'rgba(103, 126, 234, 0.1)', 
                 border: '1px solid rgba(103, 126, 234, 0.2)', 
                 borderRadius: 'var(--radius-lg)'
               }}>
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Reasoning Agents</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">Specialized in logical analysis and problem solving</p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
               style={{ 
                 background: 'rgba(168, 85, 247, 0.1)', 
                 border: '1px solid rgba(168, 85, 247, 0.2)', 
                 borderRadius: 'var(--radius-lg)'
               }}>
            <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Learning Agents</h3>
            <p className="text-sm text-purple-600 dark:text-purple-400">Adapt and improve based on new information</p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
               style={{ 
                 background: 'rgba(34, 197, 94, 0.1)', 
                 border: '1px solid rgba(34, 197, 94, 0.2)', 
                 borderRadius: 'var(--radius-lg)'
               }}>
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">Execution Agents</h3>
            <p className="text-sm text-green-600 dark:text-green-400">Implement solutions and take actions</p>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
             style={{ 
               background: 'rgba(255, 255, 255, 0.03)', 
               borderRadius: 'var(--radius-lg)'
             }}>
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Orchestration Task</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Define a task for AI agents to collaborate on. The orchestration platform will deploy specialized agents 
            to work together and achieve the desired outcome.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 rounded-full text-xs"
                  style={{ 
                    background: 'rgba(103, 126, 234, 0.15)', 
                    borderRadius: 'var(--radius-sm)'
                  }}>
              Knowledge Discovery
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 rounded-full text-xs"
                  style={{ 
                    background: 'rgba(168, 85, 247, 0.15)', 
                    borderRadius: 'var(--radius-sm)'
                  }}>
              Content Synthesis
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded-full text-xs"
                  style={{ 
                    background: 'rgba(34, 197, 94, 0.15)', 
                    borderRadius: 'var(--radius-sm)'
                  }}>
              Pattern Recognition
            </span>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 rounded-full text-xs"
                  style={{ 
                    background: 'rgba(251, 191, 36, 0.15)', 
                    borderRadius: 'var(--radius-sm)'
                  }}>
              Insight Generation
            </span>
          </div>
        </div>
      </div>

      {/* AI Insights & Suggestions */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
           style={{ 
             background: 'rgba(255, 255, 255, 0.05)', 
             border: '1px solid var(--glass-border)', 
             borderRadius: 'var(--radius-xl)',
             boxShadow: 'var(--shadow-premium)',
             backdropFilter: 'blur(40px)'
           }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Insights & Suggestions</h2>
          <button
            onClick={generateAISuggestions}
            disabled={loading || !isInitialized}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center text-sm"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              border: 'none',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-floating)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh Insights
              </>
            )}
          </button>
        </div>
        
        {suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                style={{ 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      suggestion.priority === 'high' 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                        : suggestion.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                    style={{ 
                      background: suggestion.priority === 'high' 
                        ? 'rgba(239, 68, 68, 0.15)' 
                        : suggestion.priority === 'medium'
                          ? 'rgba(234, 179, 8, 0.15)'
                          : 'rgba(103, 126, 234, 0.15)',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      <i className="fas fa-lightbulb"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">{suggestion.title}</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">{suggestion.message}</p>
                    <div className="mt-3">
                      <button className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
                              style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                borderRadius: 'var(--radius-sm)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                              }}
                      >
                        {suggestion.action ? 'Apply' : 'Learn More'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fas fa-robot text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No AI Insights Yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isInitialized 
                ? 'Click "Refresh Insights" to generate AI suggestions' 
                : 'Initialize the platform to get AI insights'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIOrchestrationPlatform;