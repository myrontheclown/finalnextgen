function validateResponse(result) {
  const status = result.actualStatus;
  const type = result.type || "positive"; // default safety

  // 🟢 POSITIVE TESTS
  if (type === "positive") {
    if (status >= 200 && status < 300) {
      return { ...result, status: "PASS" };
    }
    return { ...result, status: "FAIL" }; // ❌ real failure
  }

  // 🔴 NEGATIVE TESTS
  if (type === "negative") {
    if (status >= 400) {
      return { ...result, status: "EXPECTED_FAIL" }; // ✅ correct behavior
    }
    return { ...result, status: "FAIL" }; // ❌ should have failed but didn’t
  }

  return { ...result, status: "FAIL" };
}

module.exports = { validateResponse };