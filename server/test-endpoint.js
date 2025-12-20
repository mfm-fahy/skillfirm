const axios = require('axios');

async function testFieldAnalysis() {
  try {
    console.log('Testing field analysis endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/ai/analyze-field', {
      field: 'Data Science'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success! Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFieldAnalysis();