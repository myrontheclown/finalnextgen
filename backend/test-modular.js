const axios = require('axios');

async function testModular() {
  console.log("🚀 Testing Modular AI API Testing System...");
  
  try {
    // 1. Test /auto-generate
    console.log("\n--- Testing Fully Automatic Mode ---");
    const autoRes = await axios.post('http://localhost:5001/api/auto-generate', {
      specUrl: "https://petstore.swagger.io/v2/swagger.json"
    });
    console.log(`✅ Success! Title: ${autoRes.data.title}`);
    console.log(`📊 Summary: ${autoRes.data.summary.passed}/${autoRes.data.summary.total} Passed`);

    // 2. Test /nlp-suggest
    console.log("\n--- Testing NLP Mapping ---");
    const nlpRes = await axios.post('http://localhost:5001/api/nlp-suggest', {
      promptStr: "Create a pet with name Fido",
      spec: { endpoints: autoRes.data.results.map(r => ({ path: r.endpoint, method: r.tests[0].method })) }
    });
    console.log(`✅ Success! Mapped to: ${nlpRes.data.testCase.method} ${nlpRes.data.testCase.endpoint}`);

    // 3. Test /run-tests (Assisted Mode)
    console.log("\n--- Testing Assisted Mode ---");
    const manualRes = await axios.post('http://localhost:5001/api/run-tests', {
      baseUrl: "https://petstore.swagger.io/v2",
      tests: [
        { endpoint: "/pet", method: "POST", payload: { name: "Sparky", photoUrls: [] }, expectedStatus: 200 }
      ]
    });
    console.log(`✅ Success! Status: ${manualRes.data[0].status}, Code: ${manualRes.data[0].actualStatus}`);

  } catch (err) {
    console.error("❌ Test Failed:", err.response?.data || err.message);
  }
}

testModular();
