const axios = require('axios');

async function run() {
  console.log("🚀 Firing Auto-Generate Engine with Swagger Petstore...");
  try {
    const res = await axios.post('http://localhost:5001/api/auto-generate', {
      specUrl: "https://petstore.swagger.io/v2/swagger.json"
    });
    
    console.log("✅ Auto-Generate Report Received!");
    console.log("Title:", res.data.title);
    console.log("Base URL:", res.data.baseUrl);
    console.log(`Found ${res.data.results.length} endpoints with test sets.\n`);
    
    // Print first 2 endpoints as a sample
    for (let i = 0; i < Math.min(2, res.data.results.length); i++) {
      const ep = res.data.results[i];
      console.log(`\nEndpoint: ${ep.endpoint}`);
      for (const t of ep.tests) {
        const icon = t.status === "PASS" ? "🟢" : "🔴";
        console.log(`  ${icon} [${t.method}] ${t.case} -> Exp: ${t.expectedStatus}, Act: ${t.actualStatus} (${t.responseTime}ms)`);
      }
    }
    
  } catch (err) {
    console.error("❌ Test Failed:", err.response ? err.response.data : err.message);
  }
}

run();
