function validateResponse(result) {
  const status = result.actualStatus;

  // ✅ PASS (2xx)
  if (status >= 200 && status < 300) {
    return { ...result, status: "PASS" };
  }

  // ⚠️ EXPECTED FAIL (4xx)
  if (status >= 400 && status < 500) {
    return { ...result, status: "EXPECTED_FAIL" };
  }

  // ❌ FAIL (5xx or others)
  return { ...result, status: "FAIL" };
}

module.exports = { validateResponse };