const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Fetches Swagger/OpenAPI spec from URL or local path
 * @param {string} source - URL or file path
 * @returns {Promise<Object>} - Parsed JSON object of the spec
 */
async function fetchSpec(source) {
  if (!source) throw new Error("No source provided for Swagger spec");

  let rawData;
  let isUrl = source.startsWith('http');

  if (isUrl) {
    try {
      const response = await axios.get(source, { timeout: 10000 });
      rawData = response.data;
    } catch (err) {
      throw new Error(`Failed to fetch remote spec: ${err.message}`);
    }
  } else {
    try {
      rawData = fs.readFileSync(source, 'utf8');
    } catch (err) {
      throw new Error(`Failed to read local spec: ${err.message}`);
    }
  }

  // Handle if rawData is already an object (axios might parse JSON automatically)
  if (typeof rawData === 'object' && rawData !== null) {
    return rawData;
  }

  // Try parsing as JSON, then YAML
  try {
    return JSON.parse(rawData);
  } catch (jsonErr) {
    try {
      return yaml.load(rawData);
    } catch (yamlErr) {
      throw new Error("Failed to parse spec: Document is neither valid JSON nor YAML.");
    }
  }
}

module.exports = { fetchSpec };
