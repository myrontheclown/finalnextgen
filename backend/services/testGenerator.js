const { getValidUser, getValidPet, getValidOrder } = require('./baseData');

/**
 * Generates test cases for a list of endpoints
 */
function generateTests(endpoints) {
  const tests = [];

  for (const ep of endpoints) {
    let baseData;

    if (ep.path.includes("/user") && !ep.path.includes("/login")) {
      baseData = getValidUser();
    } else if (ep.path.includes("/pet")) {
      baseData = getValidPet();
    } else if (ep.path.includes("/order")) {
      baseData = getValidOrder();
    } else {
      baseData = ep.requestSchema ? generateDummyPayload(ep.requestSchema) : {};
    }

    // 🧩 STEP 1 — HANDLE ARRAY PAYLOADS
    let validPayload = baseData;
    if (ep.requestSchema && ep.requestSchema.type === 'array') {
      validPayload = [baseData];
    }

    // 🔥 STEP 2 — EXTRACT RESPONSE SCHEMA (CRITICAL FIX)
    const responseSchema =
      ep.responses?.["200"]?.schema ||
      ep.responses?.["201"]?.schema ||
      ep.responseSchema ||
      null;

    // 🟢 1. POSITIVE TEST
    tests.push({
      endpoint: ep.path,
      method: ep.method,
      payload: validPayload,
      expectedStatus: (ep.method === 'POST' || ep.method === 'PUT') ? 201 : 200,
      caseName: "Valid input",
      type: "positive", // ✅ ensure type exists
      requestSchema: ep.requestSchema,
      responseSchema: responseSchema // ✅ KEY ADDITION
    });

    // 🔴 2. NEGATIVE TEST (MISSING REQUIRED FIELD)
    if (ep.requestSchema && ep.requestSchema.type !== 'array') {
      const required = ep.requestSchema.required || [];

      if (required.length > 0) {
        tests.push({
          endpoint: ep.path,
          method: ep.method,
          payload: validPayload,
          expectedStatus: 400,
          caseName: `Missing required field: ${required[0]}`,
          type: "negative",
          requestSchema: ep.requestSchema,
          responseSchema: responseSchema // ✅ KEY ADDITION
        });
      }
    }
  }

  return tests;
}

/**
 * Generates dummy payload based on schema
 */
function generateDummyPayload(schema) {
  if (!schema) return {};

  if (schema.type === 'object' || schema.properties) {
    const obj = {};
    const props = schema.properties || {};

    for (const [key, prop] of Object.entries(props)) {
      obj[key] = generateDummyPayload(prop);
    }

    return obj;
  }

  if (schema.type === 'array') {
    return [generateDummyPayload(schema.items)];
  }

  switch (schema.type) {
    case 'string':
      return "test_string";
    case 'integer':
    case 'number':
      return 123;
    case 'boolean':
      return true;
    default:
      return "unknown";
  }
}

module.exports = { generateTests, generateDummyPayload };