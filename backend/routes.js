const express = require('express');
const multer = require('multer');
const fs = require('fs');
const xlsx = require('xlsx');

// Import Services
const { fetchSpec } = require('./services/swaggerFetcher');
const { parseSpec } = require('./services/parser');
const { generateTests } = require('./services/testGenerator');
const { executeTest } = require('./services/executor');
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
    const { specUrl } = req.body;
    const rawSpec = await fetchSpec(specUrl);
    const parsed = await parseSpec(rawSpec);

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

    // 4. Execute
    const context = {};
    const validationResults = [];
    for (const test of allTestCases) {
      if (test.status === "UNMAPPED") {
        validationResults.push({ ...test, status: "UNMAPPED" });
        continue;
      }
      const execResult = await executeTest(test, parsed.baseUrl, context);
      const validated = validateResponse(execResult);
      validationResults.push({ ...validated, source: test.source || 'auto' });
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
