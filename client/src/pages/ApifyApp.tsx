import React, { useState, useEffect } from 'react';
import { Key, Play, RefreshCw, CheckCircle, XCircle, AlertCircle, Loader, Eye, EyeOff, Code, Zap, Info } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const ApifyApp = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [actors, setActors] = useState([]);
  const [selectedActor, setSelectedActor] = useState(null);
  const [actorSchema, setActorSchema] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [error, setError] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Authenticate with API key
  const handleAuthenticate = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Apify API key');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        fetchActors();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available actors
  const fetchActors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/actors`);
      const data = await response.json();

      if (response.ok) {
        setActors(data.actors);
      } else {
        setError(data.error || 'Failed to fetch actors');
      }
    } catch (err) {
      setError('Failed to fetch actors');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch actor schema
  const fetchActorSchema = async (actorId) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/actors/${actorId}/schema`);
      const data = await response.json();

      if (response.ok) {
        setActorSchema(data);

        // Initialize input values with defaults or examples
        const initialValues = {};
        if (data.schema) {
          Object.entries(data.schema).forEach(([key, schema]) => {
            if (schema.default !== undefined) {
              initialValues[key] = schema.default;
            } else if (schema.example !== undefined) {
              initialValues[key] = schema.example;
            }
          });
        }
        setInputValues(initialValues);
        setRunResult(null);
      } else {
        setError(data.error || 'Failed to fetch actor schema');
      }
    } catch (err) {
      setError('Failed to fetch actor schema');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle actor selection
  const handleActorSelect = (actor) => {
    setSelectedActor(actor);
    fetchActorSchema(actor.id);
  };

  // Update input values
  const handleInputChange = (key, value) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  // Quick run with defaults
  const quickRunActor = async () => {
    if (!selectedActor) return;

    setIsLoading(true);
    setError('');
    setRunResult(null);

    try {
      const response = await fetch(`${API_BASE}/actors/${selectedActor.id}/quick-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      setRunResult(data);

      if (!response.ok || !data.success) {
        if (data.inputValidationError) {
          setError(`Input validation failed: ${data.details}\n\n${data.suggestion || 'Try using "Run with Custom Settings" and provide the required fields.'}`);
        } else {
          setError(data.error || data.details || 'Failed to run actor');
        }
      }
    } catch (err) {
      setError('Failed to run actor: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Run the selected actor with custom input
  const runActor = async () => {
    if (!selectedActor) return;

    setIsLoading(true);
    setError('');
    setRunResult(null);

    try {
      const response = await fetch(`${API_BASE}/actors/${selectedActor.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputValues })
      });

      const data = await response.json();
      setRunResult(data);

      if (!response.ok && !data.success) {
        setError(data.error || data.details || 'Failed to run actor');
      }
    } catch (err) {
      setError('Failed to run actor');
    } finally {
      setIsLoading(false);
    }
  };

  // Render input field based on type
  const renderInputField = (key, schema) => {
    const value = inputValues[key];

    const getDisplayValue = () => {
      if (value === undefined || value === null) {
        if (schema.default !== undefined) return schema.default;
        if (schema.example !== undefined) {
          return typeof schema.example === 'string' ? schema.example : JSON.stringify(schema.example, null, 2);
        }
        return '';
      }
      if (schema.type === 'array' || schema.type === 'object') {
        return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      }
      return value;
    };

    const getPlaceholder = () => {
      if (schema.example !== undefined) {
        return typeof schema.example === 'string' ? schema.example : JSON.stringify(schema.example, null, 2);
      }
      if (schema.default !== undefined) {
        return typeof schema.default === 'string' ? schema.default : JSON.stringify(schema.default, null, 2);
      }
      return '';
    };

    return (
      <div key={key} className="mb-4 p-3 border border-gray-200 rounded-lg">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          {schema.title || key}
          {schema.title && schema.title !== key && (
            <span className="text-gray-600 font-normal text-xs ml-2">({key})</span>
          )}
          {schema.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>

        {schema.description && (
          <p className="text-sm text-gray-600 mb-2 italic">{schema.description}</p>
        )}

        <div className="mb-2 flex flex-wrap gap-1">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {schema.type || 'string'}
          </span>
          {schema.default !== undefined && (
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Default
            </span>
          )}
          {schema.required && (
            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
              Required
            </span>
          )}
        </div>

        {schema.type === 'boolean' ? (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(key, e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        ) : schema.type === 'number' || schema.type === 'integer' ? (
          <input
            type="number"
            value={getDisplayValue()}
            onChange={(e) => handleInputChange(key, e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={getPlaceholder()}
            step={schema.type === 'integer' ? '1' : 'any'}
          />
        ) : schema.type === 'array' ? (
          <div>
            <textarea
              value={getDisplayValue()}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleInputChange(key, parsed);
                } catch {
                  handleInputChange(key, e.target.value);
                }
              }}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder={getPlaceholder() || 'Enter JSON array\nExample: [{"url": "https://example.com"}]'}
            />
          </div>
        ) : schema.type === 'object' ? (
          <div>
            <textarea
              value={getDisplayValue()}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleInputChange(key, parsed);
                } catch {
                  handleInputChange(key, e.target.value);
                }
              }}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder={getPlaceholder() || 'Enter JSON object\nExample: {"key": "value"}'}
            />
          </div>
        ) : (
          <input
            type="text"
            value={getDisplayValue()}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={getPlaceholder()}
          />
        )}
      </div>
    );
  };

  // Render schema source info
  const renderSchemaInfo = () => {
    if (!actorSchema) return null;

    const getSchemaSourceInfo = (source) => {
      switch (source) {
        case 'officialInputSchema':
          return { text: 'Official Input Schema', color: 'green', icon: CheckCircle };
        case 'actorInputSchema':
          return { text: 'Actor Input Schema', color: 'green', icon: CheckCircle };
        case 'exampleRunInput':
          return { text: 'Example Input', color: 'blue', icon: Info };
        case 'defaultRunOptions':
          return { text: 'Default Options', color: 'blue', icon: Info };
        case 'probedRequirements':
          return { text: 'Auto-Detected', color: 'orange', icon: AlertCircle };
        case 'intelligentDefault':
          return { text: 'Smart Default', color: 'purple', icon: Zap };
        default:
          return { text: 'Unknown', color: 'gray', icon: AlertCircle };
      }
    };

    const sourceInfo = getSchemaSourceInfo(actorSchema.schemaSource);
    const IconComponent = sourceInfo.icon;

    return (
      <div className={`mb-4 p-3 rounded-md border bg-${sourceInfo.color}-50 border-${sourceInfo.color}-200`}>
        <div className={`flex items-center space-x-2 text-${sourceInfo.color}-700 mb-2`}>
          <IconComponent className="h-4 w-4" />
          <span className="font-medium">Schema Source: {sourceInfo.text}</span>
          {actorSchema.hasOfficialSchema && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
              ✓ Official
            </span>
          )}
        </div>
        <div className={`text-sm text-${sourceInfo.color}-600`}>
          {actorSchema.schemaSource === 'officialInputSchema' && (
            <p>This actor has an official input schema fetched from the Apify API. All field types and requirements are accurate.</p>
          )}
          {actorSchema.schemaSource === 'actorInputSchema' && (
            <p>This actor has an input schema with defined field types and requirements.</p>
          )}
          {actorSchema.schemaSource === 'exampleRunInput' && (
            <p>Schema generated from the actor's example input. Field types are inferred from examples.</p>
          )}
          {actorSchema.schemaSource === 'defaultRunOptions' && (
            <p>Schema generated from the actor's default run options.</p>
          )}
          {actorSchema.schemaSource === 'probedRequirements' && (
            <p>Schema auto-detected by testing the actor to understand its requirements. Required fields are highlighted.</p>
          )}
          {actorSchema.schemaSource === 'intelligentDefault' && (
            <p>Smart default schema based on the actor's name and description. May need adjustment for specific use cases.</p>
          )}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Key className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Apify Integration</h1>
            <p className="text-gray-600 mt-2">Enter your Apify API key to get started</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Apify API key"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleAuthenticate}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Authenticating...' : 'Authenticate'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Apify Actor Runner</h1>
            <div className="flex items-center space-x-4">
              {/* <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
              >
                <Code className="h-4 w-4" />
                <span>Debug</span>
              </button> */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Authenticated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Actor Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Available Actors</h2>
              <button
                onClick={fetchActors}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {actors.map((actor) => (
                <button
                  key={actor.id}
                  onClick={() => handleActorSelect(actor)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${selectedActor?.id === actor.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="font-medium truncate">{actor.title}</div>
                  <div className="text-sm text-gray-500 truncate">@{actor.username}</div>
                  {actor.description && (
                    <div className="text-xs text-gray-400 truncate mt-1">{actor.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actor Configuration</h2>

            {selectedActor ? (
              <div>
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-900">{actorSchema?.title}</h3>
                  {actorSchema?.description && (
                    <p className="text-sm text-gray-600 mt-1">{actorSchema.description}</p>
                  )}
                </div>

                {renderSchemaInfo()}

                {actorSchema?.schema && Object.keys(actorSchema.schema).length > 0 ? (
                  <div className="space-y-4">
                    <div className="max-h-80 overflow-y-auto">
                      {Object.entries(actorSchema.schema).map(([key, schema]) =>
                        renderInputField(key, schema)
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={quickRunActor}
                        disabled={isLoading}
                        className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                      >
                        {isLoading ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                          <Zap className="h-5 w-5" />
                        )}
                        <span>{isLoading ? 'Quick Running...' : 'Quick Run with Smart Defaults'}</span>
                      </button>

                      <button
                        onClick={runActor}
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                      >
                        {isLoading ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                        <span>{isLoading ? 'Running Actor...' : 'Run with Custom Settings'}</span>
                      </button>
                    </div>

                    {showDebugInfo && (
                      <div className="mt-6 p-3 bg-gray-100 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Debug: Current Input Values</h4>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(inputValues, null, 2)}
                        </pre>
                        {actorSchema?.fullSchema && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Debug: Full Schema</h4>
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {JSON.stringify(actorSchema.fullSchema, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 mb-2">No schema available for this actor</p>
                    <p className="text-xs text-gray-500 mb-4">Quick run will use smart defaults based on actor analysis</p>

                    <button
                      onClick={quickRunActor}
                      disabled={isLoading}
                      className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto font-medium"
                    >
                      {isLoading ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                      <span>{isLoading ? 'Running...' : 'Quick Run with Smart Defaults'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Select an actor to configure and run</p>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Execution Results</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2 text-red-700">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Error</span>
                </div>
                <div className="text-sm text-red-600 mt-1 whitespace-pre-line">{error}</div>
              </div>
            )}

            {runResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-md ${runResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                  <div className={`flex items-center space-x-2 ${runResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                    {runResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      Status: {runResult.status || 'Unknown'}
                    </span>
                  </div>
                  {runResult.runId && (
                    <p className="text-sm mt-1">Run ID: {runResult.runId}</p>
                  )}
                  {runResult.message && (
                    <p className="text-sm mt-1">{runResult.message}</p>
                  )}
                  {runResult.resultCount !== undefined && (
                    <p className="text-sm mt-1">Results: {runResult.resultCount} items</p>
                  )}
                </div>

                {runResult.results && runResult.results.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                      <span>Results ({runResult.results.length} items)</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Success
                      </span>
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(runResult.results, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {runResult.inputUsed && Object.keys(runResult.inputUsed).length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Input Used</h3>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <pre className="text-xs text-blue-800 whitespace-pre-wrap">
                        {JSON.stringify(runResult.inputUsed, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {runResult.stats && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Statistics</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {runResult.stats.inputBodyLen && (
                        <p>Input size: {runResult.stats.inputBodyLen} bytes</p>
                      )}
                      {runResult.stats.memAvgBytes && (
                        <p>Memory usage: {Math.round(runResult.stats.memAvgBytes / 1024 / 1024)} MB</p>
                      )}
                      {runResult.stats.cpuAvgUsage && (
                        <p>CPU usage: {Math.round(runResult.stats.cpuAvgUsage * 100)}%</p>
                      )}
                      {runResult.startedAt && (
                        <p>Started: {new Date(runResult.startedAt).toLocaleString()}</p>
                      )}
                      {runResult.finishedAt && (
                        <p>Finished: {new Date(runResult.finishedAt).toLocaleString()}</p>
                      )}
                      {runResult.startedAt && runResult.finishedAt && (
                        <p>Duration: {Math.round((new Date(runResult.finishedAt) - new Date(runResult.startedAt)) / 1000)}s</p>
                      )}
                    </div>
                  </div>
                )}

                {showDebugInfo && runResult && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Debug: Full Response</h4>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {JSON.stringify(runResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Run an actor to see results here</p>
                <p className="text-xs mt-1">Results will appear automatically after execution</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApifyApp;