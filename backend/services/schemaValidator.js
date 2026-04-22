function validateSchema(data, schema) {
  if (!schema || !data) return { valid: true };

  // Handle array responses
  if (schema.type === "array" && Array.isArray(data)) {
    return validateSchema(data[0], schema.items);
  }

  // Only validate objects
  if (schema.type === "object" && typeof data === "object") {
    const errors = [];
    const properties = schema.properties || {};
    const required = schema.required || [];

    // 🔍 Check required fields
    for (const field of required) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // 🔍 Check types
    for (const key in properties) {
      const expectedType = properties[key].type;
      const actualValue = data[key];

      if (actualValue === undefined) continue;

      if (expectedType === "integer" && typeof actualValue !== "number") {
        errors.push(`${key} should be number`);
      }

      if (expectedType === "string" && typeof actualValue !== "string") {
        errors.push(`${key} should be string`);
      }

      if (expectedType === "boolean" && typeof actualValue !== "boolean") {
        errors.push(`${key} should be boolean`);
      }

      // 🔁 Nested object validation
      if (expectedType === "object") {
        const nested = validateSchema(actualValue, properties[key]);
        if (!nested.valid) {
          errors.push(...nested.errors.map(e => `${key}.${e}`));
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  return { valid: true };
}

module.exports = { validateSchema };
