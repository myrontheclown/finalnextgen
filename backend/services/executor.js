const axios = require('axios');

async function executeTest(test, baseUrl, context = {}) {
  try {
    // 🔧 1. Build full URL
    let url = baseUrl + test.endpoint;

    // 🔧 2. Replace path params safely
    url = url
      .replace(/{petId}/g, context.petId || "1")
      .replace(/{orderId}/g, context.orderId || "1")
      .replace(/{username}/g, context.username || "testUser");

    // 🔧 3. Setup request config
    const config = {
      method: (test.method || "GET").toLowerCase(),
      url,
      validateStatus: () => true, // never throw
      headers: {
        "Content-Type": "application/json"
      }
    };

    // 🔧 4. Handle LOGIN (VERY IMPORTANT)
    if (url.includes("/user/login")) {
      config.params = {
        username: context.username || "testUser",
        password: "test123"
      };
    }

    // 🔧 5. Attach payload for POST/PUT
    if (["post", "put", "patch"].includes(config.method)) {
      config.data = test.payload || generateSafePayload(test.endpoint);
    }

    // 🔍 DEBUG LOG (VERY IMPORTANT)
    console.log("🚀 EXECUTING:", {
      method: config.method,
      url: config.url,
      params: config.params,
      body: config.data
    });

    const start = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - start;

    // 🔧 6. Capture state for chaining
    if (response.data) {
      if (response.data.id) context.orderId = response.data.id;
      if (response.data.username) context.username = response.data.username;
      if (response.data.petId) context.petId = response.data.petId;
    }

    return {
      ...test,
      actualStatus: response.status,
      responseTime,
      responseData: response.data
    };

  } catch (error) {
    return {
      ...test,
      actualStatus: 500,
      error: error.message
    };
  }
}

// 🔧 Fallback payload generator
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

module.exports = { executeTest };