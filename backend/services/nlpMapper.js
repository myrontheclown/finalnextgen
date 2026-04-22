const { OpenAI } = require('openai');
const { generateDummyPayload } = require('./testGenerator');

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 1);
}

// STEP 1 - INTENT STRUCTURE NORMALIZATION
function ensureMethod(intent) {
  if (!intent.httpMethod) {
    const map = { login: 'GET', fetch: 'GET', create: 'POST', update: 'PUT', delete: 'DELETE', upload: 'POST' };
    intent.httpMethod = map[intent.action] || 'GET';
  }
  return intent;
}

async function normalizeWithAI(testCase) {
  if (!openai) return null;
  try {
    const prompt = `You are an API Test Intent Normalizer.
Your job is to convert natural language test cases into structured intent for API testing.
You MUST return ONLY valid JSON. No explanations.

---
INPUT:
"${testCase}"

---
OUTPUT FORMAT:
{
  "action": string,
  "entity": string,
  "httpMethod": "GET" | "POST" | "PUT" | "DELETE",
  "isNegative": boolean,
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}

---
RULES:
1. ACTION DETECTION: login, authenticate, sign in -> "login"; register, signup, create user -> "create"; fetch, get, retrieve, view -> "fetch"; update, modify, change -> "update"; delete, remove -> "delete"; upload -> "upload"; place order, create order -> "create"
2. ENTITY DETECTION: user, account -> "user"; pet, animal -> "pet"; order -> "order"; store, inventory -> "store". If unclear -> "unknown"
3. HTTP METHOD MAPPING: login/fetch -> GET, create/upload -> POST, update -> PUT, delete -> DELETE
4. NEGATIVE DETECTION: fail, invalid, incorrect, without, missing, unauthorized, error -> isNegative = true
5. CONFIDENCE: HIGH (clear), MEDIUM (partial), LOW (vague)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" }
    });
    return ensureMethod(JSON.parse(response.choices[0].message.content));
  } catch (err) {
    return null;
  }
}

// STEP 8 - SAFE FALLBACK
function extractIntent(prompt) {
  const text = prompt.toLowerCase();
  const tokens = tokenize(text);
  
  // Mapping Rules
  const actionMap = {
    login: 'login', authenticate: 'login', 'sign in': 'login',
    register: 'create', signup: 'create', create: 'create',
    fetch: 'fetch', get: 'fetch', retrieve: 'fetch', view: 'fetch',
    update: 'update', modify: 'update', change: 'update',
    delete: 'delete', remove: 'delete',
    upload: 'upload', 'place order': 'create'
  };

  const entityMap = {
    user: 'user', account: 'user',
    pet: 'pet', animal: 'pet',
    order: 'order',
    store: 'store', inventory: 'store'
  };

  let action = 'unknown';
  for (const [key, val] of Object.entries(actionMap)) {
    if (text.includes(key)) { action = val; break; }
  }

  let entity = 'unknown';
  for (const [key, val] of Object.entries(entityMap)) {
    if (text.includes(key)) { entity = val; break; }
  }

  const negativePatterns = [/fail/, /invalid/, /incorrect/, /without/, /missing/, /unauthorized/, /error/];
  const isNegative = negativePatterns.some(p => p.test(text));

  const httpMethodMap = {
    login: 'GET', fetch: 'GET', create: 'POST', upload: 'POST', update: 'PUT', delete: 'DELETE'
  };

  return ensureMethod({
    action,
    entity,
    httpMethod: httpMethodMap[action] || 'GET',
    isNegative,
    confidence: (action !== 'unknown' && entity !== 'unknown') ? 'HIGH' : 'LOW'
  });
}

// STEP 2 - ADD HARD RULE ENGINE
function applyHardRules(intent, endpoints) {
  const { action, entity } = intent;
  let targetPath = null;
  let targetMethod = null;

  if (action === 'login') { targetPath = '/user/login'; targetMethod = 'GET'; }
  else if (action === 'fetch' && entity === 'user') { targetPath = '/user/{username}'; targetMethod = 'GET'; }
  else if (action === 'create' && entity === 'user') { targetPath = '/user'; targetMethod = 'POST'; }
  else if (action === 'create' && entity === 'pet') { targetPath = '/pet'; targetMethod = 'POST'; }
  else if (action === 'fetch' && entity === 'pet') { targetPath = '/pet/{petId}'; targetMethod = 'GET'; }
  else if (action === 'create' && entity === 'order') { targetPath = '/store/order'; targetMethod = 'POST'; }

  if (targetPath && targetMethod) {
    const match = endpoints.find(ep => ep.path === targetPath && ep.method === targetMethod);
    if (match) return match;
  }
  return null;
}

// STEP 4 - SCORING ENGINE
function scoreEndpoint(intent, endpoint) {
  let score = 0;
  
  // +3 -> entity match in path
  if (intent.entity !== 'unknown' && endpoint.path.toLowerCase().includes(intent.entity)) {
    score += 3;
  }
  
  // +3 -> correct HTTP method
  if (endpoint.method === intent.httpMethod) {
    score += 3;
  }
  
  // +2 -> path contains parameter ({id}) when fetching
  if (intent.action === 'fetch' && endpoint.path.includes('{')) {
    score += 2;
  }
  
  // +2 -> summary/description contains action keyword
  const summaryDesc = ((endpoint.summary || "") + " " + (endpoint.description || "")).toLowerCase();
  if (intent.action !== 'unknown' && summaryDesc.includes(intent.action)) {
    score += 2;
  }
  
  // +1 -> partial keyword match
  const matchedKeywords = [];
  const qTokens = tokenize(`${intent.action} ${intent.entity}`);
  const epTokens = new Set(tokenize(endpoint.indexText));
  qTokens.forEach(word => {
    if (epTokens.has(word)) {
      score += 1;
      matchedKeywords.push(word);
    }
  });

  return { score, matchedKeywords };
}

// STEP 6 - KEYWORD BOOSTING
function applyBoosting(promptText, endpoint, score) {
  const text = promptText.toLowerCase();
  if (text.includes("login") && endpoint.path === "/user/login") score += 5;
  if (text.includes("upload") && endpoint.path.includes("upload")) score += 5;
  if (text.includes("inventory") && endpoint.path === "/store/inventory") score += 5;
  return score;
}

async function mapBulkPrompts(prompts, endpoints) {
  const indexedEndpoints = endpoints.map(ep => ({
    ...ep,
    indexText: [ep.method, ep.path, ep.summary || "", ep.description || "", ...(ep.tags || [])].join(" ").toLowerCase()
  }));

  const results = [];
  const seenTests = new Set();

  for (const promptText of prompts) {
    if (!promptText) continue;

    let aiIntent = await normalizeWithAI(promptText);
    const intent = aiIntent || extractIntent(promptText);

    let bestMatch = null;
    let maxScore = 0;
    let bestMatchedKeywords = [];
    
    // STEP 7 - DEBUG METADATA Prep
    let mappingReason = "";
    let confidenceLabel = "LOW";
    let status = "UNMAPPED";

    // STEP 2 - HARD RULE ENGINE
    const hardMatch = applyHardRules(intent, indexedEndpoints);

    if (hardMatch) {
      bestMatch = hardMatch;
      status = "MAPPED";
      confidenceLabel = "HIGH";
      mappingReason = "Matched via Hard Rule Engine";
    } else {
      // STEP 3 - METHOD FILTERING
      let filteredEndpoints = indexedEndpoints.filter(ep => ep.method === intent.httpMethod);
      if (filteredEndpoints.length === 0) {
        filteredEndpoints = indexedEndpoints; // fallback to all
      }

      // STEP 5 - BEST MATCH SELECTION
      for (const ep of filteredEndpoints) {
        let { score, matchedKeywords } = scoreEndpoint(intent, ep);
        
        // STEP 6 - KEYWORD BOOSTING
        score = applyBoosting(promptText, ep, score);

        if (score > maxScore) {
          maxScore = score;
          bestMatch = ep;
          bestMatchedKeywords = matchedKeywords;
        }
      }

      if (maxScore >= 5) {
        status = "MAPPED";
        confidenceLabel = "HIGH";
        mappingReason = `Matched via Scoring Engine (score: ${maxScore}) with tokens: ${bestMatchedKeywords.join(", ")}`;
      } else if (maxScore >= 3) {
        status = "MAPPED";
        confidenceLabel = "MEDIUM";
        mappingReason = `Partial match via Scoring Engine (score: ${maxScore}) with tokens: ${bestMatchedKeywords.join(", ")}`;
      } else {
        // score < 3 -> UNMAPPED
        status = "UNMAPPED";
        mappingReason = "Low confidence mapping (score < 3). No strong keyword overlap found.";
      }
    }

    const debugLog = {
      testCase: promptText,
      intent: `${intent.action}:${intent.entity}`,
      httpMethod: intent.httpMethod,
      isNegative: intent.isNegative,
      confidenceLabel,
      source: aiIntent ? "AI-POWERED" : "FALLBACK",
      mappingReason,
      status: status
    };

    if (status === "MAPPED" && bestMatch) {
      const testKey = `${bestMatch.method}:${bestMatch.path}:${intent.isNegative}`;
      if (seenTests.has(testKey)) continue;
      seenTests.add(testKey);

      results.push({
        endpoint: bestMatch.path,
        method: bestMatch.method,
        payload: generateDummyPayload(bestMatch.requestSchema),
        expectedStatus: intent.isNegative ? 400 : (bestMatch.method === "POST" ? 201 : 200),
        type: intent.isNegative ? "negative" : "positive",
        caseName: promptText,
        source: 'csv',
        debug: debugLog,
        requestSchema: bestMatch.requestSchema
      });
    } else {
      results.push({
        endpoint: "UNMAPPED",
        status: "UNMAPPED",
        caseName: promptText,
        source: 'csv',
        debug: debugLog
      });
    }
  }
  return results;
}

module.exports = { mapBulkPrompts };
