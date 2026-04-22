const SwaggerParser = require('@apidevtools/swagger-parser');

/**
 * Parses and dereferences a Swagger/OpenAPI object
 * @param {Object|string} spec - Raw spec object or path
 * @returns {Promise<Object>} - Structured spec data
 */
async function parseSpec(spec) {
  try {
    const api = await SwaggerParser.dereference(spec);
    
    const endpoints = [];
    for (const [path, methods] of Object.entries(api.paths || {})) {
      for (const [method, details] of Object.entries(methods)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: details.summary || "",
            description: details.description || "",
            operationId: details.operationId,
            requestSchema: extractRequestSchema(details),
            responseSchema: extractResponseSchema(details),
            parameters: details.parameters || [],
            auth: details.security || api.security || []
          });
        }
      }
    }

    let baseUrl = "";
    if (api.servers && api.servers.length > 0) {
      baseUrl = api.servers[0].url;
    } else if (api.host) {
      const scheme = (api.schemes && api.schemes[0]) || 'http';
      baseUrl = `${scheme}://${api.host}${api.basePath || ''}`;
    }

    return {
      title: api.info?.title || "API Specification",
      version: api.info?.version || "1.0",
      baseUrl,
      endpoints,
      raw: api
    };
  } catch (err) {
    throw new Error(`Parser Error: ${err.message}`);
  }
}

function extractRequestSchema(details) {
  // OAS 3.0
  if (details.requestBody && details.requestBody.content) {
    const content = details.requestBody.content['application/json'] || details.requestBody.content['*/*'];
    if (content) return content.schema;
  }
  // Swagger 2.0
  if (details.parameters) {
    const bodyParam = details.parameters.find(p => p.in === 'body');
    if (bodyParam) return bodyParam.schema;
  }
  return null;
}

function extractResponseSchema(details) {
  const successResponse = details.responses?.['200'] || details.responses?.['201'] || details.responses?.['default'];
  if (successResponse) {
    // OAS 3.0
    if (successResponse.content) {
      const content = successResponse.content['application/json'] || successResponse.content['*/*'];
      if (content) return content.schema;
    }
    // Swagger 2.0
    if (successResponse.schema) return successResponse.schema;
  }
  return null;
}

module.exports = { parseSpec };
