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
    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    return null;
  }
}

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

  return {
    action,
    entity,
    httpMethod: httpMethodMap[action] || 'GET',
    isNegative,
    confidence: (action !== 'unknown' && entity !== 'unknown') ? 'HIGH' : 'LOW'
  };
}

/**
 * Enhanced Similarity Scorer: Returns matched keywords
 */
function calculateScore(query, endpointText) {
  let s = 0;
  const matchedKeywords = [];
  const qTokens = tokenize(query);
  const epTokens = new Set(tokenize(endpointText));
  
  qTokens.forEach(word => {
    if (epTokens.has(word)) {
      s += 2;
      matchedKeywords.push(word);
    }
  });
  return { score: s, matchedKeywords };
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

    const aiIntent = await normalizeWithAI(promptText);
    const intent = aiIntent || extractIntent(promptText);
    const query = `${intent.action} ${intent.entity}`;

    let bestMatch = null;
    let maxScore = 0;
    let bestMatchedKeywords = [];

    for (const ep of indexedEndpoints) {
      const { score, matchedKeywords } = calculateScore(query, ep.indexText);
      if (score > maxScore) {
        maxScore = score;
        bestMatch = ep;
        bestMatchedKeywords = matchedKeywords;
      }
    }

    // Confidence Tiers
    let status = "UNMAPPED";
    let confidenceLabel = "LOW";
    if (maxScore >= 1.5) {
      status = "MAPPED";
      confidenceLabel = maxScore >= 3 ? "HIGH" : "MEDIUM";
    } else if (maxScore >= 0.5) {
      status = "MAPPED";
      confidenceLabel = "LOW";
    }

    const mappingReason = status === "MAPPED" 
      ? `Matched '${promptText}' to '${bestMatch.method} ${bestMatch.path}' via tokens: ${bestMatchedKeywords.join(", ")}`
      : "Low confidence mapping (No strong keyword overlap found)";

    const debugLog = {
      testCase: promptText,
      intent: `${intent.action}:${intent.entity}`,
      confidence: maxScore,
      confidenceLabel,
      source: aiIntent ? "AI-POWERED" : "FALLBACK",
      mappingReason,
      status: status
    };

    if (status === "MAPPED") {
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
