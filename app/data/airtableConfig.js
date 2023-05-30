const axios = require('axios');

const AIRTABLE_API_KEY = 'YOUR_AIRTABLE_API_KEY';
const AIRTABLE_BASE_ID = 'YOUR_AIRTABLE_BASE_ID';

async function makeAirtableApiCall(endpoint, method, data = null) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${endpoint}`;

  const headers = {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: JSON.stringify(data)
    });

    return response.data;
  } catch (error) {
    console.error('Airtable API request failed:', error);
    throw error;
  }
}

module.exports = airtableConfig