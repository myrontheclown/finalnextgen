const { getValidUser, getValidPet, getValidOrder } = require('./baseData');

/**
 * Generates test cases for a list of endpoints
 */
function generateTests(endpoints) {
  const tests = [];

  for (const ep of endpoints) {
    let baseData;
    if (ep.path.includes("/user") && !ep.path.includes("/login")) baseData = getValidUser();
    else if (ep.path.includes("/pet")) baseData = getValidPet();
    else if (ep.path.includes("/order")) baseData = getValidOrder();
    else baseData = ep.requestSchema ? generateDummyPayload(ep.requestSchema) : {};

    // 🧩 STEP 1 & 5 — GENERATE VALID PAYLOAD (Handle Arrays)
    let validPayload = baseData;
    if (ep.requestSchema && ep.requestSchema.type === 'array') {
      validPayload = [baseData];
    }

    // 1. Positive Case
    tests.push({
      endpoint: ep.path,
      method: ep.method,
      payload: validPayload,
      expectedStatus: (ep.method === 'POST' || ep.method === 'PUT') ? 201 : 200,
      caseName: "Valid input",
      requestSchema: ep.requestSchema
    });

    // 2. Negative Cases
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
          requestSchema: ep.requestSchema
        });
      }
    }
  }

  return tests;
}

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
  if (schema.type === 'array') return [generateDummyPayload(schema.items)];
  
  switch (schema.type) {
    case 'string': return "test_string";
    case 'integer':
    case 'number': return 123;
    case 'boolean': return true;
    default: return "unknown";
  }
}

module.exports = { generateTests, generateDummyPayload };
