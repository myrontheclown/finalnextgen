const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

(async () => {
  try {
    fs.writeFileSync('test.json', JSON.stringify({ paths: { '/test': { get: {} } } }));
    const form = new FormData();
    form.append('spec', fs.createReadStream('test.json'));
    
    const res = await axios.post('http://localhost:5000/api/upload-spec', form, {
      headers: form.getHeaders()
    });
    console.log(res.data);
  } catch (err) {
    console.error('ERROR:', err.response ? err.response.data : err.message);
  }
})();
