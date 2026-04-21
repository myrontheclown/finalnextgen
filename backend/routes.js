const express = require('express');
const multer = require('multer');
const SwaggerParser = require('@apidevtools/swagger-parser');
const xlsx = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const { OpenAI } = require('openai');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Safe initialization of OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// 1. Upload & Parse OpenAPI Spec (Supports File or remote URL)
router.post('/upload-spec', upload.single('spec'), async (req, res) => {
  try {
    let apiObj;
    const specUrl = req.body.specUrl || req.query.specUrl;

    if (specUrl) {
      try {
        const response = await axios.get(specUrl, { timeout: 10000 });
        apiObj = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } catch (err) {
        return res.status(400).json({ error: `Remote Spec Unreachable: ${err.message}` });
      }
    } else if (req.file) {
      try {
         apiObj = await SwaggerParser.dereference(req.file.path);
      } catch(err) {
         const rawData = fs.readFileSync(req.file.path, 'utf8');
         apiObj = JSON.parse(rawData);
      }
      fs.unlinkSync(req.file.path);
    } else {
      return res.status(400).json({ error: "No schema file or URL provided" });
    }
    
    let endpoints = [];
    let isSynthesized = false;

    if (apiObj.paths && Object.keys(apiObj.paths).length > 0) {
      for (const [path, methods] of Object.entries(apiObj.paths)) {
        for (const [method, details] of Object.entries(methods)) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: details.summary || "",
            parameters: details.parameters || []
          });
        }
      }
    } else if (openai) {
      try {
        const jsonPreview = JSON.stringify(apiObj).slice(0, 3000);
        const prompt = `
        TASK: Convert this raw JSON database into a RESTful OpenAPI-style endpoint list.
        DATA: ${jsonPreview}
        
        RULES:
        - Identify root keys (e.g. "posts", "users") and create GET/POST paths for them.
        - Return ONLY a raw JSON array of objects. No markdown.
        - Format: [{"path": "/resource", "method": "GET", "summary": "Retrieve resource"}]
        
        EXAMPLE: {"users": [...]} -> [{"path": "/users", "method": "GET", "summary": "Get users"}]
        `;
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: "You are a professional API Architect." }, { role: "user", content: prompt }],
          temperature: 0
        });
        const cleanContent = response.choices[0].message.content.replace(/```json|```/g, "").trim();
        endpoints = JSON.parse(cleanContent);
        isSynthesized = true;
      } catch (err) { console.error("Neural Spec Inference failed:", err); }
    }

    let suggestedBaseUrl = "";
    if (apiObj.servers && apiObj.servers.length > 0) {
      suggestedBaseUrl = apiObj.servers[0].url;
    } else if (apiObj.host) {
      const scheme = (apiObj.schemes && apiObj.schemes[0]) || 'http';
      suggestedBaseUrl = `${scheme}://${apiObj.host}${apiObj.basePath || ''}`;
    }

    res.json({
      title: apiObj.info?.title || "Parsed API",
      version: apiObj.info?.version || "1.0",
      suggestedBaseUrl,
      isSynthesized,
      endpoints
    });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Schema Integration Failed: Neural parser could not resolve the document structure." });
  }
});

// 1.5 Quickstart Load Demo
router.post('/load-demo', async (req, res) => {
  try {
    const path = require('path');
    const specPath = path.join(__dirname, '..', 'demo-sample-openapi.json');
    const testsPath = path.join(__dirname, '..', 'demo-sample-tests.csv');

    // Parse Spec
    const specRaw = fs.readFileSync(specPath, 'utf8');
    const apiObj = JSON.parse(specRaw);
    const endpoints = [];
    if (apiObj.paths) {
      for (const [path, methods] of Object.entries(apiObj.paths)) {
        for (const [method, details] of Object.entries(methods)) {
          endpoints.push({ path, method: method.toUpperCase(), summary: details.summary || "" });
        }
      }
    }

    // Parse CSV
    const workbook = xlsx.readFile(testsPath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const testCases = data.map(row => ({
      endpoint: row.endpoint || row.Endpoint,
      method: row.method || row.Method || "GET",
      payload: row.payload || row.Payload ? parsePayload(row.payload || row.Payload) : {},
      expectedStatus: row.expectedStatus || row.ExpectedStatus || 200
    }));

    res.json({
      spec: { title: apiObj.info?.title || "Demo API", version: apiObj.info?.version || "1.0", endpoints },
      tests: testCases
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Demo files missing on server root" });
  }
});

// 2. Upload & Parse Excel Test Cases (AI-Powered Dynamic Mapping + Remote URL Support)
router.post('/upload-excel', upload.single('tests'), async (req, res) => {
  try {
    let workbook;
    const { excelUrl } = req.body;

    if (excelUrl) {
      // Fetch remote spreadsheet
      const response = await axios.get(excelUrl, { responseType: 'arraybuffer' });
      workbook = xlsx.read(response.data, { type: 'buffer' });
    } else if (req.file) {
      workbook = xlsx.readFile(req.file.path);
    } else {
      return res.status(400).json({ error: "No file or URL provided" });
    }

    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ error: "The file is empty." });
    }

    // Step 1: Detect Headers
    const headers = Object.keys(rawData[0]);
    let mapping = {
      endpoint: ['endpoint', 'path', 'url', 'route', 'api'],
      method: ['method', 'type', 'verb', 'requestMethod'],
      payload: ['payload', 'body', 'data', 'json', 'requestBody'],
      expectedStatus: ['expectedStatus', 'status', 'expected', 'code', 'statusCode']
    };

    // Step 2: Logic - If standard headers aren't found, use AI to map
    let detectedMapping = {};
    const standardKeys = ['endpoint', 'method', 'payload', 'expectedStatus'];
    
    // Heuristic first
    standardKeys.forEach(key => {
      const found = headers.find(h => mapping[key].some(m => h.toLowerCase().includes(m.toLowerCase())));
      if (found) detectedMapping[key] = found;
    });

    // AI Refinement & Synthesis
    let isSynthesized = false;
    if ((!detectedMapping.endpoint || !detectedMapping.method) && openai) {
       try {
         const dataSample = JSON.stringify(rawData[0]).slice(0, 1000);
         const prompt = `
         TASK: Synthesize API test vectors from this raw dataset.
         HEADERS: ${headers.join(', ')}
         SAMPLE DATA: ${dataSample}
         
         The file lacks "endpoint" columns. Analyze the data and:
         1. Create a logical REST path (e.g. /users, /iris, /products).
         2. Suggest a primary Method (POST or GET).
         3. List the headers that should form the testing payload.
         
         Return ONLY a clean JSON object: {"endpoint": "/path", "method": "POST", "payloadMapping": ["h1", "h2"]}
         
         EXAMPLE: [name, age] -> {"endpoint": "/users", "method": "POST", "payloadMapping": ["name", "age"]}
         `;
         const response = await openai.chat.completions.create({
           model: "gpt-4o-mini",
           messages: [{ role: "system", content: "You are a Neural Data Synchronizer." }, { role: "user", content: prompt }],
           temperature: 0
         });
         const cleanSynthesis = response.choices[0].message.content.replace(/```json|```/g, "").trim();
         const aiSynthesis = JSON.parse(cleanSynthesis);
         
         // Apply synthesis
         if (!detectedMapping.endpoint) detectedMapping.endpoint = "ai_generated";
         if (!detectedMapping.method) detectedMapping.method = "ai_generated";
         
         // Store synthesis metadata for the map loop
         detectedMapping.synthesis = aiSynthesis;
         isSynthesized = true;
       } catch (err) { console.warn("Excel AI Mapping/Synthesis failed."); }
    }

    // Final Mapping
    const testCases = rawData.map(row => {
      let endpoint = row[detectedMapping.endpoint] || row.endpoint || row.Endpoint;
      let method = row[detectedMapping.method] || row.method || row.Method || "GET";
      let payload = (row[detectedMapping.payload] || row.payload || row.Payload) ? parsePayload(row[detectedMapping.payload] || row.payload || row.Payload) : null;

      // Handle Synthesized Data
      if (isSynthesized && detectedMapping.synthesis) {
        endpoint = endpoint || detectedMapping.synthesis.endpoint;
        method = method || detectedMapping.synthesis.method;
        if (!payload) {
          payload = {};
          detectedMapping.synthesis.payloadMapping.forEach(h => { payload[h] = row[h]; });
        }
      }

      return {
        endpoint: endpoint || "/api/v1/unknown",
        method: method || "GET",
        payload: payload || {},
        expectedStatus: row[detectedMapping.expectedStatus] || row.expectedStatus || row.ExpectedStatus || 200,
        isSynthesized
      };
    });

    if (req.file) fs.unlinkSync(req.file.path);
    res.json(testCases);
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Failed to parse CSV/Excel file" });
  }
});

function parsePayload(payloadStr) {
  try {
    return typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
  } catch {
    return payloadStr;
  }
}

// Helper to inject tokens into payload or URL
function injectChainedVariables(dataRaw, chainContext) {
  let str = typeof dataRaw === 'object' ? JSON.stringify(dataRaw) : String(dataRaw);
  for (const [key, value] of Object.entries(chainContext)) {
     // replace {{variableName}}
     const regex = new RegExp(`{{${key}}}`, 'g');
     str = str.replace(regex, value);
  }
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// 3. Execute Tests ENGINE (FULLY DYNAMIC: Base URL, Environments, and Auth)
router.post('/run-tests', async (req, res) => {
  try {
    const { tests, baseUrl, bearerToken, apiKey } = req.body; 
    if (!tests || !Array.isArray(tests)) return res.status(400).json({ error: "Invalid payload" });

    const results = [];
    const chainContext = {}; // Stores dynamic chained variables like {{token}}
    
    // Default fallback if baseUrl is missing (not recommended for dynamic use)
    const effectiveBaseUrl = baseUrl || "http://localhost:3000";

    for (const test of tests) {
      const startTime = Date.now();
      let status = "FAIL";
      let actualStatus = null;
      let responseData = null;
      let errorDetail = null;

      try {
        // Step 1: Inject Chained Variables into payload/endpoint
        const dynamicEndpoint = typeof test.endpoint === 'string' ? injectChainedVariables(test.endpoint, chainContext) : test.endpoint;
        const dynamicPayload = test.payload ? injectChainedVariables(test.payload, chainContext) : undefined;
        
        // Robust URL Construction
        let targetUrl;
        try {
          if (dynamicEndpoint.startsWith('http')) {
            targetUrl = dynamicEndpoint;
          } else {
            const base = effectiveBaseUrl.endsWith('/') ? effectiveBaseUrl : `${effectiveBaseUrl}/`;
            const endpoint = dynamicEndpoint.startsWith('/') ? dynamicEndpoint.substring(1) : dynamicEndpoint;
            targetUrl = `${base}${endpoint}`;
          }
        } catch (urlErr) {
            targetUrl = `${effectiveBaseUrl}/${dynamicEndpoint}`;
        }

        // Construct Headers
        const headers = { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        if (bearerToken) {
           headers['Authorization'] = bearerToken.startsWith('Bearer') ? bearerToken : `Bearer ${bearerToken}`;
        }
        if (apiKey) {
           headers['X-API-Key'] = apiKey;
        }

        // Construct Axios config
        const config = {
          method: (test.method || 'GET').toUpperCase(),
          url: targetUrl,
          headers,
          data: dynamicPayload,
          timeout: 10000, // 10s timeout for stability
          validateStatus: () => true 
        };

        const response = await axios(config);
        actualStatus = response.status;
        responseData = response.data;

        // Step 2: Extract variables for future chaining! (e.g. login tokens)
        if (typeof responseData === 'object' && responseData !== null) {
           if (responseData.token) chainContext['token'] = responseData.token;
           if (responseData.access_token) chainContext['access_token'] = responseData.access_token;
           if (responseData.id) chainContext['id'] = responseData.id;
        }

        // Validate Status
        if (actualStatus.toString() === (test.expectedStatus || 200).toString()) {
          status = "PASS";
        }
      } catch (err) {
        actualStatus = err.response?.status || 500;
        if (err.code === 'ENOTFOUND') errorDetail = "DNS LOOKUP FAILED: Target host not found.";
        else if (err.code === 'ECONNREFUSED') errorDetail = "CONNECTION REFUSED: Is the server running?";
        else if (err.code === 'ETIMEDOUT') errorDetail = "REQUEST TIMED OUT: Server took too long.";
        else errorDetail = err.message;
        
        responseData = { error: errorDetail };
      }

      results.push({
        ...test,
        status,
        statusCode: actualStatus,
        responseTime: Date.now() - startTime,
        targetUrl,
        response: responseData,
        errorDetail
      });
    }

    // Firebase persisting logic (Graceful if connection fails)
    try {
      const admin = require('firebase-admin');
      if (admin.apps.length > 0) {
        const db = admin.firestore();
        const batchRef = db.collection('testExecutions').doc(Date.now().toString());
        const formattedTestResults = results.map(r => ({
           endpoint: r.endpoint,
           status: r.status,
           response: typeof r.response === 'object' ? JSON.stringify(r.response) : r.response,
           timestamp: new Date().toISOString()
        }));
        await batchRef.set({ testResults: formattedTestResults, targetBaseUrl: effectiveBaseUrl });
      }
    } catch (e) { }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Execution Engine: Terminal failure." });
  }
});

// 4. Natural Language Processing Endpoint
router.post('/nlp-suggest', async (req, res) => {
  try {
     if (!openai) return res.status(503).json({ error: "OpenAI is not configured. Missing API Key." });
     
     const { promptStr } = req.body;
     const prompt = `
     You are an API testing assistant. A user provided this natural language prompt: "${promptStr}".
     Convert this sentence into a structured JSON test case exactly matching this schema:
     { "endpoint": "url_path", "method": "GET/POST/PUT/DELETE", "payload": { /* if applicable */ }, "expectedStatus": 200/400/etc }
     Return ONLY the raw JSON object. Do not include formatting or markdown wrappers like \`\`\`json.
     `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    });

    let rawOutput = response.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
    const testCase = JSON.parse(rawOutput);
    res.json({ testCase });
  } catch (err) {
    console.error("NLP Error:", err.message);
    res.status(500).json({ error: "Failed to process natural language string."});
  }
});

// 5. AI Suggest Tests (From Dashboard Results)
router.post('/ai-suggest', async (req, res) => {
  try {
    if (!openai) return res.status(503).json({ error: "OpenAI is not configured. Missing API Key." });

    const { spec } = req.body;
    const specStr = JSON.stringify(spec).substring(0, 3000);

    const prompt = `
    Analyze this API endpoint specification and suggest additional test cases including edge cases and missing validations.
    Return ONLY a JSON array of objects with 'title' and 'description' keys.
    API Spec part: ${specStr}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let rawOutput = response.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
    const suggestions = JSON.parse(rawOutput);
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate AI suggestions" });
  }
});

module.exports = router;
