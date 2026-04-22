const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

(async () => {
  try {
    fs.writeFileSync('dummy.json', JSON.stringify({ paths: {} }));
    const form = new FormData();
    form.append('spec', fs.createReadStream('dummy.json'));
    
    console.log("Sending request to http://localhost:5000/api/upload-spec");
    const res = await axios.post('http://localhost:5000/api/upload-spec', form, {
      headers: form.getHeaders()
    });
    fs.writeFileSync('test-output.txt', "SUCCESS: " + res.status);
  } catch (err) {
    let errMsg = err.message;
    if (err.response) {
      errMsg += " | STATUS: " + err.response.status;
      errMsg += " | DATA: " + (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data.substring(0, 200));
    }
    fs.writeFileSync('test-output.txt', "ERROR: " + errMsg);
  }
})();
