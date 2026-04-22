const express = require('express');
const multer = require('multer');
const fs = require('fs');
const xlsx = require('xlsx');

// Import Services
const { fetchSpec } = require('./services/swaggerFetcher');
const { parseSpec } = require('./services/parser');
const { generateTests } = require('./services/testGenerator');
const { executeTest, fetchAuthToken } = require('./services/executor');
const authConfig = require('./config/auth');
const { validateResponse } = require('./services/validator');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload-spec', upload.single('spec'), async (req, res) => {
  try {
    const source = req.body.specUrl || req.file?.path;
    const rawSpec = await fetchSpec(source);
    const parsed = await parseSpec(rawSpec);
    if (req.file) fs.unlinkSync(req.file.path);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auto-generate', upload.single('tests'), async (req, res) => {
  try {
    const { specUrl, env } = req.body;
    const rawSpec = await fetchSpec(specUrl);
    const parsed = await parseSpec(rawSpec);
    const { getBaseUrl } = require('./config/environments');

    // 🎯 Determine Base URL
    const selectedBaseUrl = env
      ? getBaseUrl(env)
      : parsed.baseUrl;

    // 🌍 DEBUG LOGS
    console.log("🌍 ENV SELECTED:", env || "default");
    console.log("🌍 BASE URL:", selectedBaseUrl);

    // 1. Auto-Generate
    const autoTestCases = generateTests(parsed.endpoints).map(t => ({ ...t, source: 'auto' }));

    // 2. Handle Optional Tests File (CSV/Excel or JSON)
    let csvTestCases = [];
    if (req.file) {
      let prompts = [];
      const fileExt = req.file.originalname.split('.').pop().toLowerCase();

      if (fileExt === 'json') {
        const content = fs.readFileSync(req.file.path, 'utf8');
        const data = JSON.parse(content);
        prompts = Array.isArray(data) ? data : (data.prompts || []);
      } else {
        // Assume CSV/Excel
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        prompts = rows.map(r => r[0]).filter(p => typeof p === 'string' && p.trim().length > 0);
      }

      if (prompts.length > 0) {
        const { mapBulkPrompts } = require('./services/nlpMapper');
        csvTestCases = await mapBulkPrompts(prompts, parsed.endpoints);
      }
      fs.unlinkSync(req.file.path);
    }

    // 3. Mode-Based Selection
    let allTestCases = [];
    const mode = req.body.mode || 'hybrid';

    if (mode === 'auto') {
      allTestCases = autoTestCases;
    } else if (mode === 'nlp') {
      allTestCases = csvTestCases;
    } else {
      // hybrid
      allTestCases = [...autoTestCases, ...csvTestCases];
    }

    // 4. Execution Prep: Dependency Detection
    allTestCases = allTestCases.map(test => {
      const ep = test.endpoint || "";
      const method = (test.method || "").toUpperCase();
      const meta = { produces: [], consumes: [] };

      if (ep.includes("/user") && method === "POST") meta.produces.push("username");
      if (ep.includes("{username}")) meta.consumes.push("username");

      if (ep.includes("/store/order") && method === "POST") meta.produces.push("orderId");
      if (ep.includes("{orderId}")) meta.consumes.push("orderId");

      if (ep.includes("{petId}")) meta.consumes.push("petId");

      return { ...test, meta };
    });

    // 5. Execution Prep: Test Ordering
    allTestCases.sort((a, b) => {
      const aConsumes = a.meta && a.meta.consumes.length > 0;
      const bConsumes = b.meta && b.meta.consumes.length > 0;
      if (aConsumes && !bConsumes) return 1;
      if (!aConsumes && bConsumes) return -1;
      return 0;
    });

    // 6. Execute
    const context = {
      username: "testUser",
      petId: 1,
      orderId: 1
    };

    if (authConfig.type === "bearer" && !authConfig.bearer.token) {
      const token = await fetchAuthToken(selectedBaseUrl);
      if (token) {
        authConfig.bearer.token = token;
      }
    }

    const validationResults = [];
    for (const test of allTestCases) {
      if (test.status === "UNMAPPED") {
        validationResults.push({ ...test, status: "UNMAPPED" });
        continue;
      }
      const execResult = await executeTest(test, selectedBaseUrl, context);
      const validated = validateResponse(execResult);
      validationResults.push({ 
        ...validated, 
        source: test.source || 'auto',
        environment: env || "default" // ✅ BONUS
      });
    }

    // 5. Build Report
    const report = {
      summary: {
        total: validationResults.length,
        passed: validationResults.filter(r => r.status === 'PASS').length,
        expectedFail: validationResults.filter(r => r.status === 'EXPECTED_FAIL').length,
        failed: validationResults.filter(r => r.status === 'FAIL').length,
        unmapped: validationResults.filter(r => r.status === 'UNMAPPED').length,
        responseTime: validationResults.reduce((acc, r) => acc + (r.responseTime || 0), 0)
      },
      results: validationResults
    };

    const reachableTotal = report.summary.total - report.summary.unmapped;
    report.summary.successRate = reachableTotal > 0 
      ? Math.round(((report.summary.passed + report.summary.expectedFail) / reachableTotal) * 100) 
      : 0;

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
