import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let currentApiKey = null;

app.get('/',(request, response)=>{
  response.json({message: "hello!"});
}) 

const DEFAULT_SCHEMAS = {
  'web-scraper': {
    start_urls: {
      type: 'array',
      title: 'Start URLs',
      description: 'List of URLs to scrape',
      default: [{ url: 'https://example.com' }],
      example: [{ url: 'https://example.com' }]
    },
    startUrls: {
      type: 'array',
      title: 'Start URLs',
      description: 'List of URLs to scrape',
      default: [{ url: 'https://example.com' }],
      example: [{ url: 'https://example.com' }]
    },
    maxPages: {
      type: 'number',
      title: 'Max Pages',
      description: 'Maximum number of pages to scrape',
      default: 10
    },
    max_pages: {
      type: 'number',
      title: 'Max Pages',
      description: 'Maximum number of pages to scrape',
      default: 10
    }
  },
  'instagram-scraper': {
    usernames: {
      type: 'array',
      title: 'Usernames',
      description: 'Instagram usernames to scrape',
      default: ['instagram'],
      example: ['instagram', 'natgeo']
    },
    resultsLimit: {
      type: 'number',
      title: 'Results Limit',
      description: 'Maximum number of posts to scrape',
      default: 20
    },
    results_limit: {
      type: 'number',
      title: 'Results Limit',
      description: 'Maximum number of posts to scrape',
      default: 20
    }
  },
  'google-search-results': {
    queries: {
      type: 'array',
      title: 'Search Queries',
      description: 'Google search queries',
      default: ['web scraping'],
      example: ['web scraping', 'automation']
    },
    maxPagesPerQuery: {
      type: 'number',
      title: 'Max Pages Per Query',
      description: 'Maximum pages to scrape per query',
      default: 1
    },
    max_pages_per_query: {
      type: 'number',
      title: 'Max Pages Per Query',
      description: 'Maximum pages to scrape per query',
      default: 1
    }
  },
  'default': {
    input: {
      type: 'string',
      title: 'Input',
      description: 'General input for the actor',
      default: '',
      example: 'Enter your input here'
    },
    start_urls: {
      type: 'array',
      title: 'Start URLs',
      description: 'URLs to process',
      default: [{ url: 'https://example.com' }],
      example: [{ url: 'https://example.com' }]
    },
    startUrls: {
      type: 'array',
      title: 'Start URLs',
      description: 'URLs to process',
      default: [{ url: 'https://example.com' }],
      example: [{ url: 'https://example.com' }]
    }
  }
};

const getDefaultSchema = (actorName, actorDescription = '') => {
  const name = actorName.toLowerCase();
  const desc = actorDescription.toLowerCase();
  
  if (name.includes('instagram') || desc.includes('instagram')) {
    return DEFAULT_SCHEMAS['instagram-scraper'];
  } else if (name.includes('google') && (name.includes('search') || desc.includes('search'))) {
    return DEFAULT_SCHEMAS['google-search-results'];
  } else if (name.includes('scraper') || name.includes('crawler') || desc.includes('scrape')) {
    return DEFAULT_SCHEMAS['web-scraper'];
  } else {
    return DEFAULT_SCHEMAS['default'];
  }
};

const probeActorRequirements = async (actorId) => {
  try {
    console.log('Probing actor requirements for:', actorId);
    
    const probeResponse = await axios.post(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          waitForFinish: 5 
        }
      }
    );

    return { success: true, response: probeResponse.data };
  } catch (error) {
    console.log('Probe failed (expected):', error.response?.data?.error?.message);
    
    const errorMessage = error.response?.data?.error?.message || '';
    const requiredFields = [];
    
    const fieldPatterns = [
      /Field input\.([a-zA-Z_]+) is required/g,
      /Missing required field[s]?: ([a-zA-Z_,\s]+)/g,
      /'([a-zA-Z_]+)' is required/g,
      /Required field[s]?: ([a-zA-Z_,\s]+)/g
    ];
    
    fieldPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(errorMessage)) !== null) {
        if (match[1]) {
          // Handle comma-separated fields
          const fields = match[1].split(',').map(f => f.trim());
          requiredFields.push(...fields);
        }
      }
    });
    
    if (requiredFields.length === 0) {
      if (errorMessage.includes('start_urls')) requiredFields.push('start_urls');
      if (errorMessage.includes('startUrls')) requiredFields.push('startUrls');
      if (errorMessage.includes('usernames')) requiredFields.push('usernames');
      if (errorMessage.includes('queries')) requiredFields.push('queries');
      if (errorMessage.includes('url')) requiredFields.push('url');
      if (errorMessage.includes('urls')) requiredFields.push('urls');
    }
    
    const uniqueFields = [...new Set(requiredFields)];
    
    console.log('Detected required fields:', uniqueFields);
    
    return { 
      success: false, 
      error: errorMessage, 
      requiredFields: uniqueFields,
      errorType: error.response?.data?.error?.type
    };
  }
};

const createSmartDefaultInput = async (actorId, actorName, actorDescription) => {
  console.log('Creating smart default input for:', actorName);
  
  const probeResult = await probeActorRequirements(actorId);
  
  let smartInput = {};
  const defaultSchema = getDefaultSchema(actorName, actorDescription);
  
  if (!probeResult.success && probeResult.requiredFields.length > 0) {
    console.log('Required fields detected from error:', probeResult.requiredFields);
    
    probeResult.requiredFields.forEach(field => {
      if (defaultSchema[field]) {
        smartInput[field] = defaultSchema[field].default;
        console.log(`Set ${field} to:`, defaultSchema[field].default);
      } else {
        if (field.includes('url') || field.includes('Url')) {
          smartInput[field] = field.includes('start') || field.includes('Start') 
            ? [{ url: 'https://example.com' }] 
            : 'https://example.com';
        } else if (field.includes('username') || field.includes('user')) {
          smartInput[field] = ['example_user'];
        } else if (field.includes('quer') || field.includes('search')) {
          smartInput[field] = ['example query'];
        } else if (field.includes('limit') || field.includes('max') || field.includes('count')) {
          smartInput[field] = 10;
        } else {
          smartInput[field] = field.toLowerCase().includes('url') ? ['https://example.com'] : 'example value';
        }
        console.log(`Generated default for unknown field ${field}:`, smartInput[field]);
      }
    });
  } else if (probeResult.success) {
    console.log('Probe succeeded, using example input if available');
    const firstSchemaField = Object.keys(defaultSchema)[0];
    if (firstSchemaField && defaultSchema[firstSchemaField].default !== undefined) {
      smartInput[firstSchemaField] = defaultSchema[firstSchemaField].default;
    }
  } else {
    console.log('No probe results, using schema-based defaults');
    const priorityFields = ['start_urls', 'startUrls', 'usernames', 'queries', 'url', 'urls'];
    
    for (const field of priorityFields) {
      if (defaultSchema[field]) {
        smartInput[field] = defaultSchema[field].default;
        break; 
      }
    }
    
    if (Object.keys(smartInput).length === 0) {
      Object.entries(defaultSchema).forEach(([key, schema]) => {
        if (schema.default !== undefined && Object.keys(smartInput).length === 0) {
          smartInput[key] = schema.default;
        }
      });
    }
  }
  
  if (Object.keys(smartInput).length === 0) {
    console.log('No specific requirements found, using universal fallback');
    if (actorName.toLowerCase().includes('scrap') || actorDescription.toLowerCase().includes('scrap')) {
      smartInput.start_urls = [{ url: 'https://example.com' }];
    } else if (actorName.toLowerCase().includes('instagram')) {
      smartInput.usernames = ['instagram'];
    } else if (actorName.toLowerCase().includes('google') || actorName.toLowerCase().includes('search')) {
      smartInput.queries = ['example search'];
    } else {
      smartInput.start_urls = [{ url: 'https://example.com' }];
    }
  }
  
  console.log('Final smart input:', JSON.stringify(smartInput, null, 2));
  return smartInput;
};
const API_BASE_URL = 'https://apify-api-ten.vercel.app/';

app.post(`${API_BASE_URL}/api/auth`, async (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const response = await axios.get('https://api.apify.com/v2/acts', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    currentApiKey = apiKey;
    res.json({ success: true, message: 'API key validated successfully' });
  } catch (error) {
    console.error('API key validation failed:', error.response?.data || error.message);
    res.status(401).json({ 
      error: 'Invalid API key or authentication failed',
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

app.get('/api/actors', async (req, res) => {
  if (!currentApiKey) {
    return res.status(401).json({ error: 'Not authenticated. Please provide API key first.' });
  }

  try {
    const response = await axios.get('https://api.apify.com/v2/acts', {
      headers: {
        'Authorization': `Bearer ${currentApiKey}`
      },
      params: {
        limit: 50,
        offset: 0
      }
    });

    const actors = response.data.data.items.map(actor => ({
      id: actor.id,
      name: actor.name,
      title: actor.title || actor.name,
      description: actor.description,
      username: actor.username
    }));

    res.json({ actors });
  } catch (error) {
    console.error('Failed to fetch actors:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch actors',
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

app.get('/api/actors/:actorId/schema', async (req, res) => {
  const { actorId } = req.params;
  console.log('Fetching schema for actor:', actorId);
  
  if (!currentApiKey) {
    return res.status(401).json({ error: 'Not authenticated. Please provide API key first.' });
  }

  try {
    const actorResponse = await axios.get(`https://api.apify.com/v2/acts/${actorId}`, {
      headers: {
        'Authorization': `Bearer ${currentApiKey}`
      }
    });

    const actor = actorResponse.data.data;
    console.log('Actor name:', actor.name);
    
    let schemaProperties = {};
    let fullSchema = null;
    let schemaFound = false;
    let schemaSource = 'none';
    
    try {
      console.log('Fetching official input schema from API...');
      const schemaResponse = await axios.get(`https://api.apify.com/v2/acts/${actorId}/input-schema`, {
        headers: {
          'Authorization': `Bearer ${currentApiKey}`
        }
      });
      
      if (schemaResponse.data) {
        console.log('Found official input schema');
        const parsedSchema = schemaResponse.data;
        fullSchema = parsedSchema;
        
        if (parsedSchema.properties) {
          schemaProperties = parsedSchema.properties;
          schemaFound = true;
          schemaSource = 'officialInputSchema';
          console.log('Found properties in official schema:', Object.keys(schemaProperties));
        } else if (parsedSchema.type === 'object' && parsedSchema.title) {
          schemaProperties = parsedSchema;
          schemaFound = true;
          schemaSource = 'officialInputSchema';
          console.log('Using full schema as properties');
        }
      }
    } catch (schemaError) {
      console.log('Official input schema not available:', schemaError.response?.status, schemaError.response?.statusText);
    }
    
    if (!schemaFound && actor.inputSchema) {
      try {
        console.log('Found actor.inputSchema, attempting to parse...');
        let parsedSchema = typeof actor.inputSchema === 'string' 
          ? JSON.parse(actor.inputSchema) 
          : actor.inputSchema;
        
        fullSchema = parsedSchema;
        
        if (parsedSchema.properties) {
          schemaProperties = parsedSchema.properties;
          schemaFound = true;
          schemaSource = 'actorInputSchema';
          console.log('Found properties in actor.inputSchema:', Object.keys(schemaProperties));
        }
      } catch (e) {
        console.error('Failed to parse actor.inputSchema:', e.message);
      }
    }
    
    if (!schemaFound && actor.exampleRunInput) {
      try {
        console.log('Using exampleRunInput');
        const exampleInput = typeof actor.exampleRunInput === 'string' 
          ? JSON.parse(actor.exampleRunInput) 
          : actor.exampleRunInput;
        
        if (!exampleInput.body && !exampleInput.contentType && !exampleInput.helloWorld) {
          for (const [key, value] of Object.entries(exampleInput)) {
            schemaProperties[key] = {
              type: Array.isArray(value) ? 'array' : typeof value,
              title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
              description: `Example: ${JSON.stringify(value)}`,
              example: value,
              default: value
            };
          }
          schemaFound = true;
          schemaSource = 'exampleRunInput';
        } else {
          console.log('Skipping exampleRunInput - appears to be HTTP format or test data');
        }
      } catch (e) {
        console.log('Failed to parse exampleRunInput:', e.message);
      }
    }
    
    if (!schemaFound && actor.defaultRunOptions?.input) {
      console.log('Using defaultRunOptions.input');
      const defaultInput = actor.defaultRunOptions.input;
      
      for (const [key, value] of Object.entries(defaultInput)) {
        schemaProperties[key] = {
          type: Array.isArray(value) ? 'array' : typeof value,
          title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          description: `Default: ${JSON.stringify(value)}`,
          default: value
        };
      }
      schemaFound = true;
      schemaSource = 'defaultRunOptions';
    }
    
    if (!schemaFound) {
      console.log('No schema found, probing actor and using intelligent defaults');
      
      const probeResult = await probeActorRequirements(actorId);
      const defaultSchema = getDefaultSchema(actor.name, actor.description);
      
      const enhancedSchema = { ...defaultSchema };
      
      if (!probeResult.success && probeResult.requiredFields.length > 0) {
        probeResult.requiredFields.forEach(field => {
          if (enhancedSchema[field]) {
            enhancedSchema[field].required = true;
            enhancedSchema[field].description = `Required field: ${enhancedSchema[field].description}`;
          } else {
            enhancedSchema[field] = {
              type: field.includes('url') ? 'array' : 'string',
              title: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
              description: `Required field detected from actor analysis`,
              required: true,
              default: field.includes('url') ? [{ url: 'https://example.com' }] : 'example value'
            };
          }
        });
        schemaSource = 'probedRequirements';
      } else {
        schemaSource = 'intelligentDefault';
      }
      
      schemaProperties = enhancedSchema;
      schemaFound = true;
    }
    
    console.log('Final schema properties:', Object.keys(schemaProperties));
    console.log('Schema source:', schemaSource);
    
    res.json({ 
      schema: schemaProperties,
      fullSchema: fullSchema,
      actorName: actor.name,
      title: actor.title || actor.name,
      description: actor.description,
      exampleRunInput: actor.exampleRunInput,
      hasInputSchema: !!actor.inputSchema,
      hasOfficialSchema: schemaSource === 'officialInputSchema',
      hasDefaultRunOptions: !!actor.defaultRunOptions?.input,
      hasExampleRunInput: !!actor.exampleRunInput,
      schemaFound: schemaFound,
      schemaSource: schemaSource,
      canRun: true 
    });
  } catch (error) {
    console.error('Failed to fetch actor schema:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch actor schema',
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

app.post('/api/actors/:actorId/run', async (req, res) => {
  const { actorId } = req.params;
  const { input } = req.body;
  
  if (!currentApiKey) {
    return res.status(401).json({ error: 'Not authenticated. Please provide API key first.' });
  }

  try {
    console.log('Running actor with input:', JSON.stringify(input, null, 2));
    
    const cleanInput = {};
    if (input && typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanInput[key] = value;
        }
      });
    }
    
    console.log('Cleaned input:', JSON.stringify(cleanInput, null, 2));
    
    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      cleanInput,
      {
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          waitForFinish: 120 
        }
      }
    );

    const run = runResponse.data.data;
    console.log('Run result:', run.status, run.id);
    
    if (run.status === 'SUCCEEDED') {
      try {
        const datasetResponse = await axios.get(
          `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items`,
          {
            headers: {
              'Authorization': `Bearer ${currentApiKey}`
            },
            params: {
              format: 'json',
              limit: 100
            }
          }
        );
        
        res.json({
          success: true,
          runId: run.id,
          status: run.status,
          results: datasetResponse.data,
          resultCount: datasetResponse.data.length,
          stats: run.stats,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
          inputUsed: cleanInput
        });
      } catch (dataError) {
        console.error('Failed to fetch results:', dataError.message);
        res.json({
          success: true,
          runId: run.id,
          status: run.status,
          results: [],
          message: 'Run completed but results could not be retrieved',
          stats: run.stats,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
          inputUsed: cleanInput
        });
      }
    } else if (run.status === 'FAILED') {
      res.json({
        success: false,
        error: 'Actor run failed',
        runId: run.id,
        status: run.status,
        exitCode: run.exitCode,
        statusMessage: run.statusMessage,
        stats: run.stats,
        inputUsed: cleanInput
      });
    } else {
      res.json({
        success: true,
        runId: run.id,
        status: run.status,
        message: 'Run started but may still be in progress. Check Apify console for updates.',
        stats: run.stats,
        startedAt: run.startedAt,
        inputUsed: cleanInput
      });
    }
  } catch (error) {
    console.error('Failed to run actor:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to run actor',
      details: error.response?.data?.error?.message || error.message,
      inputUsed: input
    });
  }
});

app.post('/api/actors/:actorId/quick-run', async (req, res) => {
  const { actorId } = req.params;
  
  if (!currentApiKey) {
    return res.status(401).json({ error: 'Not authenticated. Please provide API key first.' });
  }

  try {
    const actorResponse = await axios.get(`https://api.apify.com/v2/acts/${actorId}`, {
      headers: { 'Authorization': `Bearer ${currentApiKey}` }
    });

    const actor = actorResponse.data.data;
    let quickInput = {};

    if (actor.exampleRunInput) {
      try {
        quickInput = typeof actor.exampleRunInput === 'string' 
          ? JSON.parse(actor.exampleRunInput) 
          : actor.exampleRunInput;
        console.log('Using example input for quick run:', JSON.stringify(quickInput, null, 2));
      } catch (e) {
        console.log('Failed to parse example input:', e.message);
      }
    }

    if (Object.keys(quickInput).length === 0 || 
        (quickInput.body && quickInput.contentType) || // Filter out HTTP request format
        JSON.stringify(quickInput).includes('helloWorld')) { // Filter out test input
      
      console.log('Example input not suitable, generating smart defaults');
      quickInput = await createSmartDefaultInput(actorId, actor.name, actor.description);
    }

    const cleanInput = {};
    Object.entries(quickInput).forEach(([key, value]) => {
      if (!['body', 'contentType', 'method', 'headers'].includes(key)) {
        cleanInput[key] = value;
      }
    });

    console.log('Final quick run input:', JSON.stringify(cleanInput, null, 2));

    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      cleanInput,
      {
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          waitForFinish: 60 // Shorter wait for quick runs
        }
      }
    );

    const run = runResponse.data.data;
    
    res.json({
      success: true,
      runId: run.id,
      status: run.status,
      message: `Quick run initiated with smart default parameters`,
      inputUsed: cleanInput,
      stats: run.stats,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt
    });

  } catch (error) {
    console.error('Failed to quick run actor:', error.response?.data || error.message);
    
    if (error.response?.data?.error?.type === 'invalid-input') {
      console.log('Input validation failed, trying alternative approach');
      
      try {
        const actorResponse = await axios.get(`https://api.apify.com/v2/acts/${actorId}`, {
          headers: { 'Authorization': `Bearer ${currentApiKey}` }
        });
        
        const actor = actorResponse.data.data;
        
        const alternativeInputs = [
          { start_urls: [{ url: 'https://example.com' }] },
          { startUrls: [{ url: 'https://example.com' }] },
          { urls: ['https://example.com'] },
          { url: 'https://example.com' },
          { usernames: ['example'] },
          { queries: ['example'] },
          { search: 'example' }
        ];
        
        for (const altInput of alternativeInputs) {
          try {
            console.log('Trying alternative input:', JSON.stringify(altInput, null, 2));
            
            const altRunResponse = await axios.post(
              `https://api.apify.com/v2/acts/${actorId}/runs`,
              altInput,
              {
                headers: {
                  'Authorization': `Bearer ${currentApiKey}`,
                  'Content-Type': 'application/json'
                },
                params: {
                  waitForFinish: 30
                }
              }
            );
            
            const altRun = altRunResponse.data.data;
            return res.json({
              success: true,
              runId: altRun.id,
              status: altRun.status,
              message: `Quick run succeeded with alternative input`,
              inputUsed: altInput,
              stats: altRun.stats,
              startedAt: altRun.startedAt,
              finishedAt: altRun.finishedAt
            });
            
          } catch (altError) {
            console.log('Alternative input failed:', JSON.stringify(altInput, null, 2));
            continue; // Try next alternative
          }
        }
        
        const errorMessage = error.response.data.error.message;
        res.status(400).json({ 
          error: 'All input attempts failed',
          details: errorMessage,
          suggestion: 'This actor requires very specific input fields. Try using "Run with Custom Settings" and check the actor\'s documentation for required fields.',
          inputValidationError: true,
          lastAttemptedInput: alternativeInputs[alternativeInputs.length - 1]
        });
        
      } catch (retryError) {
        const errorMessage = error.response.data.error.message;
        res.status(400).json({ 
          error: 'Input validation failed',
          details: errorMessage,
          suggestion: 'The actor requires specific input fields. Try using "Run with Custom Settings" to provide the required fields.',
          inputValidationError: true
        });
      }
    } else {
      res.status(500).json({ 
        error: 'Failed to quick run actor',
        details: error.response?.data?.error?.message || error.message
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});