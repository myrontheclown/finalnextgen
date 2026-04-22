const environments = {
  dev: "http://localhost:5001",
  staging: "https://staging.api.com",
  prod: "https://api.com"
};

/**
 * Returns the base URL for the given environment.
 * Falls back to dev if the environment is invalid or not provided.
 */
function getBaseUrl(env) {
  return environments[env] || environments.dev;
}

module.exports = { environments, getBaseUrl };
