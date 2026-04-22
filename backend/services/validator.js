const { validateSchema } = require('./schemaValidator');

function validateResponse(result) {
  const status = result.actualStatus;
  const type = result.type || "positive";

  let validated;

  // 🟢 POSITIVE
  if (type === "positive") {
    validated = status >= 200 && status < 300
      ? { ...result, status: "PASS" }
      : { ...result, status: "FAIL" };
  }

  // 🔴 NEGATIVE
  if (type === "negative") {
    validated = status >= 400
      ? { ...result, status: "EXPECTED_FAIL" }
      : { ...result, status: "FAIL" };
  }

  if (!validated) validated = { ...result, status: "FAIL" };

  // 🧠 SCHEMA VALIDATION (ALWAYS RUN)
  let schemaResult = { valid: true, errors: [] };

  if (result.responseData && result.responseSchema) {
    schemaResult = validateSchema(result.responseData, result.responseSchema);
    console.log("🧪 SCHEMA VALIDATION:", schemaResult);
  }

  // ❌ Override ONLY for positive tests
  if (type === "positive" && !schemaResult.valid) {
    return {
      ...validated,
      status: "FAIL",
      schemaErrors: schemaResult.errors
    };
  }

  return validated;
}

module.exports = { validateResponse };