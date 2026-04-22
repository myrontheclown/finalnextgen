const axios = require('axios');
const { generateFromSchema } = require('./dataFactory');
const { generateEdgeCases } = require('./edgeCaseGenerator'); // ✅ NEW
const authConfig = require('../config/auth');

// 🔧 Helper: safely join baseUrl + endpoint
function buildFullUrl(baseUrl, endpoint) {
  if (!endpoint) return baseUrl;
  if (endpoint.startsWith('http')) return endpoint;

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${cleanBase}${cleanEndpoint}`;
}

async function executeTest(test, baseUrl, context = {}) {
  try {
    let url = buildFullUrl(baseUrl, test.endpoint);

    // 🔗 Path params
    url = injectPathParams(url, context);

    const config = {
      method: (test.method || "GET").toLowerCase(),
      url,
      validateStatus: () => true,
      headers: {
        "Content-Type": "application/json"
      }
    };

    // 🔐 Login handling
    if (url.includes("/user/login")) {
      config.params = {
        ...(config.params || {}),
        username: context.username || "testUser",
        password: "test123"
      };
    }

    // 🧬 ✅ UPDATED PAYLOAD BLOCK (EDGE CASE ADDED)
    if (["post", "put", "patch"].includes(config.method)) {
      let payload;

      if ((!test.payload || Object.keys(test.payload).length === 0) && test.requestSchema) {
        payload = generateFromSchema(test.requestSchema);
      } else {
        payload = test.payload || generateSafePayload(test.endpoint);
      }

      // 🔥 EDGE CASE LOGIC
      if (test.type === "negative") {
        payload = generateEdgeCases(payload, test.requestSchema);
        console.log("⚠️ EDGE CASE APPLIED:", payload);
      }

      config.data = payload;
    }

    // 🛡️ Auth
    applyAuth(config);

    // 🔐 Debug
    console.log("🔐 AUTH STATE:", {
      type: authConfig.type,
      headers: config.headers,
      params: config.params || {}
    });

    console.log("🚀 EXECUTING:", {
      method: config.method,
      url: config.url,
      params: config.params || {},
      body: config.data || {}
    });

    const start = Date.now();
    const response = await executeWithRetry(() => axios(config), 2);
    const responseTime = Date.now() - start;

    // 🔗 Context capture
    if (response.data) {
      if (response.data.id) {
        if (url.includes('/pet')) context.petId = response.data.id;
        else if (url.includes('/order')) context.orderId = response.data.id;
        else context.userId = response.data.id;
      }

      if (response.data.username) {
        context.username = response.data.username;
        context.user = response.data.username;
      }

      if (response.data.petId) {
        context.petId = response.data.petId;
      }
    }

    console.log("🧠 CONTEXT:", context);

    return {
      ...test,
      actualStatus: response.status,
      responseTime,
      responseData: response.data,
      authUsed: authConfig.type,
      edgeCaseApplied: test.type === "negative" // ✅ BONUS
    };

  } catch (error) {
    return {
      ...test,
      actualStatus: 500,
      error: error.message,
      authUsed: authConfig.type,
      edgeCaseApplied: test.type === "negative"
    };
  }
}

// 🔧 Payload fallback
function generateSafePayload(endpoint) {
  if (endpoint.includes("/user")) {
    return {
      id: Date.now(),
      username: "testUser",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "test123",
      phone: "9999999999",
      userStatus: 1
    };
  }

  if (endpoint.includes("/pet")) {
    return {
      id: 1,
      name: "doggie",
      photoUrls: [],
      status: "available"
    };
  }

  if (endpoint.includes("/store/order")) {
    return {
      id: 1,
      petId: 1,
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: "placed",
      complete: true
    };
  }

  return {};
}

// 🔗 Path param injection
function injectPathParams(url, context) {
  return url
    .replace(/{username}/g, context.username || context.user || "testUser")
    .replace(/{petId}/g, context.petId || "1")
    .replace(/{orderId}/g, context.orderId || "1");
}

// 🔁 Retry
async function executeWithRetry(fn, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fn();

      if (response.status >= 500 && i < retries) {
        console.log(`⚠️ Retry ${i + 1}/${retries} due to 5xx error (${response.status})`);
        continue;
      }

      return response;

    } catch (error) {
      if (!error.response && i < retries) {
        console.log(`⚠️ Retry ${i + 1}/${retries} due to network error: ${error.message}`);
        continue;
      }
      throw error;
    }
  }
}

// 🔐 Auth
function applyAuth(config) {
  if (authConfig.type === "apiKey") {
    if (authConfig.apiKey.in === "header") {
      config.headers = {
        ...config.headers,
        [authConfig.apiKey.key]: authConfig.apiKey.value
      };
    } else {
      config.params = {
        ...(config.params || {}),
        [authConfig.apiKey.key]: authConfig.apiKey.value
      };
    }
  }

  if (authConfig.type === "bearer") {
    if (authConfig.bearer.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${authConfig.bearer.token}`
      };
    }
  }

  return config;
}

async function fetchAuthToken(baseUrl) {
  try {
    await axios.get(buildFullUrl(baseUrl, "/user/login"), {
      params: {
        username: "testUser",
        password: "test123"
      }
    });

    return "mock-token-123";
  } catch {
    console.log("⚠️ Auth token fetch failed");
    return null;
  }
}

module.exports = { executeTest, fetchAuthToken };