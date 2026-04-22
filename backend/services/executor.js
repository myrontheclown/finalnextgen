const axios = require('axios');
const { generateFromSchema } = require('./dataFactory');
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
    // 🧠 1. Build FULL URL
    let url = buildFullUrl(baseUrl, test.endpoint);

    // 🔗 2. Inject path params
    url = injectPathParams(url, context);

    // ⚙️ 3. Request config
    const config = {
      method: (test.method || "GET").toLowerCase(),
      url,
      validateStatus: () => true,
      headers: {
        "Content-Type": "application/json"
      }
    };

    // 🔐 4. LOGIN handling
    if (url.includes("/user/login")) {
      config.params = {
        ...(config.params || {}),
        username: context.username || "testUser",
        password: "test123"
      };
    }

    // 🧬 5. Payload handling
    if (["post", "put", "patch"].includes(config.method)) {
      if ((!test.payload || Object.keys(test.payload).length === 0) && test.requestSchema) {
        config.data = generateFromSchema(test.requestSchema);
      } else {
        config.data = test.payload || generateSafePayload(test.endpoint);
      }
    }

    // 🛡️ 6. Apply Authentication
    applyAuth(config);

    // 🔐 AUTH DEBUG (FINAL VERSION)
    console.log("🔐 AUTH STATE:", {
      type: authConfig.type,
      headers: config.headers,
      params: config.params || {}
    });

    // 🚀 EXECUTION DEBUG
    console.log("🚀 EXECUTING:", {
      method: config.method,
      url: config.url,
      params: config.params || {},
      body: config.data || {}
    });

    const start = Date.now();

    // 🔁 7. Retry system
    const response = await executeWithRetry(() => axios(config), 2);

    const responseTime = Date.now() - start;

    // 🔗 8. Context capture (IMPROVED)
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
      authUsed: authConfig.type
    };

  } catch (error) {
    return {
      ...test,
      actualStatus: 500,
      error: error.message,
      authUsed: authConfig.type
    };
  }
}

// 🧬 Safe fallback payloads
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

// 🔁 Retry logic
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

// 🛡️ AUTH ENGINE (SAFE)
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

// 🔐 TOKEN FETCH (FOR DEMO)
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