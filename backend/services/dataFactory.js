function generateFromSchema(schema) {
  if (!schema) return null;

  // Handle arrays
  if (schema.type === 'array') {
    return [generateFromSchema(schema.items || {})];
  }

  // Handle objects
  if (schema.type === 'object' || schema.properties) {
    const obj = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        obj[key] = generateFromSchema(propSchema);
      }
    }
    return obj;
  }

  // Handle primitive types
  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') {
        return new Date().toISOString();
      }
      return "sample_string";
    case 'integer':
      return 1;
    case 'number':
      return 1.0;
    case 'boolean':
      return true;
    default:
      return null;
  }
}

module.exports = {
  generateFromSchema
};
