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

// ---------------- INTENT NORMALIZATION ----------------
function ensureMethod(intent) {
  if (!intent.httpMethod) {
    const map = {
      login: 'GET',
      fetch: 'GET',
      create: 'POST',
      update: 'PUT',
      delete: 'DELETE',
      upload: 'POST'
    };
    intent.httpMethod = map[intent.action] || 'GET';
  }
  return intent;
}

async function normalizeWithAI(testCase) {
  if (!openai) return null;

  try {
    const prompt = `You convert API test sentences into structured intent.

Return ONLY JSON:
{
  "action": string,
  "entity": string,
  "httpMethod": "GET" | "POST" | "PUT" | "DELETE",
  "isNegative": boolean,
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}

Rules:
- login/authenticate → login
- create/add/register → create
- fetch/get/retrieve → fetch
- update/modify → update
- delete/remove → delete
- entities: user, pet, order, store
- negative: fail, invalid, incorrect, missing → true

Input: "${testCase}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" }
    });

    return ensureMethod(JSON.parse(response.choices[0].message.content));
  } catch {
    return null;
  }
}

// ---------------- FALLBACK INTENT ----------------
function extractIntent(prompt) {
  const text = prompt.toLowerCase();

  const actionMap = {
    login: 'login',
    authenticate: 'login',
    register: 'create',
    create: 'create',
    add: 'create',
    fetch: 'fetch',
    get: 'fetch',
    retrieve: 'fetch',
    update: 'update',
    delete: 'delete',
    remove: 'delete',
    upload: 'upload',
    'place order': 'create'
  };

  const entityMap = {
    user: 'user',
    pet: 'pet',
    order: 'order',
    store: 'store'
  };

  let action = 'unknown';
  for (const key in actionMap) {
    if (text.includes(key)) {
      action = actionMap[key];
      break;
    }
  }

  let entity = 'unknown';
  for (const key in entityMap) {
    if (text.includes(key)) {
      entity = entityMap[key];
      break;
    }
  }

  const isNegative = /fail|invalid|incorrect|missing|error/.test(text);

  return ensureMethod({
    action,
    entity,
    isNegative,
    confidence: (action !== 'unknown' && entity !== 'unknown') ? 'HIGH' : 'LOW'
  });
}

// ---------------- HARD RULE ENGINE ----------------
function applyHardRules(intent, endpoints) {
  const { action, entity } = intent;

  const rules = [
    { action: 'login', path: '/user/login', method: 'GET' },
    { action: 'create', entity: 'user', path: '/user', method: 'POST' },
    { action: 'create', entity: 'pet', path: '/pet', method: 'POST' },
    { action: 'fetch', entity: 'pet', path: '/pet/{petId}', method: 'GET' },
    { action: 'create', entity: 'order', path: '/store/order', method: 'POST' }
  ];

  for (const r of rules) {
    if (r.action === action && (!r.entity || r.entity === entity)) {
      const match = endpoints.find(ep => ep.path === r.path && ep.method === r.method);
      if (match) return match;
    }
  }

  return null;
}

// ---------------- 🔥 STRICT FILTER ----------------
function strictFilterEndpoints(endpoints, intent) {
  let filtered = endpoints;

  // Method filter
  filtered = filtered.filter(ep => ep.method === intent.httpMethod);

  // Entity filter
  if (intent.entity !== "unknown") {
    filtered = filtered.filter(ep =>
      ep.path.toLowerCase().includes(intent.entity)
    );
  }

  // Action-specific logic
  if (intent.action === "create") {
    filtered = filtered.filter(ep => !ep.path.includes("{"));
  }

  if (intent.action === "fetch") {
    filtered = filtered.filter(ep =>
      ep.path.includes("{") || ep.path.includes("find")
    );
  }

  return filtered.length > 0 ? filtered : endpoints;
}

// ---------------- SCORING ----------------
function scoreEndpoint(intent, endpoint) {
  let score = 0;

  // 🔥 ACTION BOOST
  if (intent.action === 'create' && endpoint.method === 'POST') score += 5;
  if (intent.action === 'fetch' && endpoint.method === 'GET') score += 3;
  if (intent.action === 'delete' && endpoint.method === 'DELETE') score += 5;

  // ENTITY MATCH
  if (intent.entity !== 'unknown' && endpoint.path.includes(intent.entity)) {
    score += 3;
  } else {
    score -= 3; // penalty
  }

  // SUMMARY MATCH
  const text = ((endpoint.summary || "") + " " + (endpoint.description || "")).toLowerCase();
  if (text.includes(intent.action)) score += 2;

  return score;
}

// ---------------- BOOSTING ----------------
function applyBoosting(prompt, endpoint, score) {
  const text = prompt.toLowerCase();

  if (text.includes("add") && endpoint.method === "POST") score += 4;
  if (text.includes("create") && endpoint.method === "POST") score += 4;
  if (text.includes("delete") && endpoint.method === "DELETE") score += 4;

  return score;
}

// ---------------- MAIN FUNCTION ----------------
async function mapBulkPrompts(prompts, endpoints) {
  const indexedEndpoints = endpoints.map(ep => ({
    ...ep,
    indexText: [ep.method, ep.path, ep.summary || "", ep.description || ""].join(" ").toLowerCase()
  }));

  const results = [];
  const seen = new Set();

  for (const promptText of prompts) {
    if (!promptText) continue;

    const aiIntent = await normalizeWithAI(promptText);
    const intent = aiIntent || extractIntent(promptText);

    let bestMatch = null;
    let maxScore = -Infinity;

    // HARD RULE
    const hardMatch = applyHardRules(intent, indexedEndpoints);

    if (hardMatch) {
      bestMatch = hardMatch;
    } else {
      const filtered = strictFilterEndpoints(indexedEndpoints, intent);

      for (const ep of filtered) {
        let score = scoreEndpoint(intent, ep);
        score = applyBoosting(promptText, ep, score);

        if (score > maxScore) {
          maxScore = score;
          bestMatch = ep;
        }
      }
    }

    if (bestMatch) {
      const key = `${bestMatch.method}-${bestMatch.path}-${intent.isNegative}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        endpoint: bestMatch.path,
        method: bestMatch.method,
        payload: generateDummyPayload(bestMatch.requestSchema),
        expectedStatus: intent.isNegative ? 400 : (bestMatch.method === "POST" ? 201 : 200),
        type: intent.isNegative ? "negative" : "positive",
        caseName: promptText,
        source: 'csv',
        requestSchema: bestMatch.requestSchema
      });
    } else {
      results.push({
        endpoint: "UNMAPPED",
        status: "UNMAPPED",
        caseName: promptText
      });
    }
  }

  return results;
}

module.exports = { mapBulkPrompts };