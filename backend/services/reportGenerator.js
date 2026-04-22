/**
 * Generates a structured report from validation results
 * @param {Array} results - List of validated results
 * @param {string} title - Report title
 * @param {string} baseUrl - Base URL tested
 * @returns {Object} - Final report object
 */
function generateReport(results, title, baseUrl) {
  const total = results.length;
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = total - passed;

  // Group by endpoint for better visualization
  const grouped = {};
  results.forEach(r => {
    if (!grouped[r.endpoint]) {
      grouped[r.endpoint] = {
        endpoint: r.endpoint,
        tests: []
      };
    }
    grouped[r.endpoint].tests.push(r);
  });

  return {
    title: title || "API Execution Report",
    baseUrl,
    summary: {
      total,
      passed,
      failed,
      passPercentage: total > 0 ? ((passed / total) * 100).toFixed(2) : 0
    },
    results: Object.values(grouped),
    flatResults: results // useful for some UI views
  };
}

module.exports = { generateReport };
