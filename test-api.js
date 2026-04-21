const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_BASE = "http://localhost:5000/api";

async function runAutomaticTest() {
  try {
    console.log("🚀 Starting Automatic API Injection...");

    // 1. Upload OpenAPI Spec
    console.log("1️⃣ Uploading OpenAPI Spec...");
    const specForm = new FormData();
    specForm.append('spec', fs.createReadStream('./demo-sample-openapi.json'));
    const specRes = await axios.post(`${API_BASE}/upload-spec`, specForm, {
      headers: specForm.getHeaders()
    });
    console.log("   ✅ Spec Parsed Successfully! Enpdoints identified:", specRes.data.endpoints.length);

    // 2. Upload Excel/CSV Test Cases
    console.log("\n2️⃣ Uploading Test Cases (CSV)...");
    const testForm = new FormData();
    testForm.append('tests', fs.createReadStream('./demo-sample-tests.csv'));
    const testRes = await axios.post(`${API_BASE}/upload-excel`, testForm, {
      headers: testForm.getHeaders()
    });
    console.log(`   ✅ Test cases parsed! Validated ${testRes.data.length} tests.`);

    // 3. Execution Engine
    console.log("\n3️⃣ Running Execution Engine on parsed tests...");
    const executeRes = await axios.post(`${API_BASE}/run-tests`, { tests: testRes.data });
    
    const results = executeRes.data;
    console.log("\n📊 Execution Results Overview:");
    
    let passed = 0;
    let failed = 0;

    results.forEach((r, idx) => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      if(r.status === 'PASS') passed++; else failed++;
      console.log(`   ${icon} Test ${idx + 1}: ${r.method} ${r.endpoint.substring(0, 30)}... | Expected: ${r.expectedStatus} | Actual: ${r.statusCode} | Time: ${r.responseTime}ms`);
    });

    console.log(`\n🎯 FINAL SCORE: ${passed} Passed | ${failed} Failed out of ${results.length} total tests.\n`);

  } catch (error) {
    console.error("❌ Error during test run:", error.message);
  }
}

runAutomaticTest();
