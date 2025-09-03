import React, { useState, useEffect, useCallback } from 'react';
import { AIAssistant } from './ai-assistant.js';
import { Store } from './store.js';

interface AISuggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action?: () => void;
  score?: number;
}

interface AIInsight {
  type: string;
  title: string;
  message: string;
}

const AIAssistantComponent: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [currentNote, setCurrentNote] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'insights' | 'chat'>('suggestions');

  // Load notes from store
  const loadNotes = useCallback(async () => {
    try {
      const storedNotes = await Store.allNotes();
      setNotes(storedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, []);

  // Generate suggestions
  const generateSuggestions = useCallback(async () => {
    if (notes.length === 0) return;
    
    setIsLoading(true);
    try {
      const suggestionsData = await AIAssistant.generateSuggestions(notes, currentNote);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [notes, currentNote]);

  // Generate insights
  const generateInsights = useCallback(async () => {
    if (notes.length === 0) return;
    
    setIsLoading(true);
    try {
      const insightsData = await AIAssistant.generateDailyInsights(notes);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [notes]);

  // Answer question
  const answerQuestion = useCallback(async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      const answerData = await AIAssistant.answerQuestion(question, notes);
      setAnswer(answerData);
    } catch (error) {
      console.error('Failed to answer question:', error);
      setAnswer('Sorry, I encountered an error while processing your question.');
    } finally {
      setIsLoading(false);
    }
  }, [question, notes]);

  // Handle suggestion action
  const handleSuggestionAction = (action?: () => void) => {
    if (action) {
      action();
    }
  };

  // Initialize component
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Generate initial suggestions and insights
  useEffect(() => {
    if (notes.length > 0) {
      generateSuggestions();
      generateInsights();
    }
  }, [notes, generateSuggestions, generateInsights]);

  // Refresh data when notes change
  useEffect(() => {
    const handleStorageChange = () => {
      loadNotes();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadNotes]);

  return (
    <div className="ai-assistant p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ 
          background: 'var(--primary-gradient)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          backgroundClip: 'text' 
        }}>
          AI Assistant
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your intelligent companion for knowledge management
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suggestions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Chat
          </button>
        </nav>
      </div>

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Smart Suggestions</h2>
            <button
              onClick={generateSuggestions}
              disabled={isLoading}
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
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt mr-2"></i>
                  Refresh Suggestions
                </>
              )}
            </button>
          </div>

          {suggestions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700"
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
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium text-gray-900 dark:text-white">{suggestion.title}</h3>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">{suggestion.message}</p>
                      <div className="mt-3">
                        <button 
                          onClick={() => handleSuggestionAction(suggestion.action)}
                          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Suggestions Yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {isLoading ? 'Generating suggestions...' : 'Click "Refresh Suggestions" to get AI recommendations'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Knowledge Insights</h2>
            <button
              onClick={generateInsights}
              disabled={isLoading}
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
              {isLoading ? (
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

          {insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.map((insight, index) => (
                <div 
                  key={index} 
                  className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700"
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
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      style={{ 
                        background: 'rgba(34, 197, 94, 0.15)', 
                        borderRadius: 'var(--radius-full)'
                      }}>
                        <i className="fas fa-chart-line"></i>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">{insight.title}</h3>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-chart-bar text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Insights Yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {isLoading ? 'Generating insights...' : 'Click "Refresh Insights" to get knowledge analytics'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ask AI Assistant</h2>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && answerQuestion()}
                placeholder="Ask me anything about your notes..."
                className="flex-grow px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: 'var(--radius-lg)'
                }}
                disabled={isLoading}
              />
              <button
                onClick={answerQuestion}
                disabled={isLoading || !question.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
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
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </button>
            </div>
            
            {answer && (
              <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700"
                   style={{ 
                     background: 'rgba(255, 255, 255, 0.05)', 
                     border: '1px solid var(--glass-border)', 
                     borderRadius: 'var(--radius-lg)',
                     boxShadow: 'var(--shadow-premium)',
                     backdropFilter: 'blur(40px)'
                   }}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    style={{ 
                      background: 'rgba(103, 126, 234, 0.15)', 
                      borderRadius: 'var(--radius-full)'
                    }}>
                      <i className="fas fa-robot"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">AI Assistant</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">{answer}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Example Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setQuestion('How do I create connections between notes?')}
                className="text-left p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                How do I create connections between notes?
              </button>
              <button
                onClick={() => setQuestion('What are the best practices for tagging notes?')}
                className="text-left p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                What are the best practices for tagging notes?
              </button>
              <button
                onClick={() => setQuestion('How can I search for specific content?')}
                className="text-left p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                How can I search for specific content?
              </button>
              <button
                onClick={() => setQuestion('How do templates work?')}
                className="text-left p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                How do templates work?
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantComponent;