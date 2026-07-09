const axios = require('axios');

const options = {
  method: 'GET',
  url: 'https://jsearch.p.rapidapi.com/search-v2',
  params: {
    query: 'developer',
    num_pages: '1',
    country: 'in',
    date_posted: 'all'
  },
  headers: {
    'x-rapidapi-key': '467d652792msh7bacb64576112b0p1b678ajsnd6fa24958e61',
    'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    'Content-Type': 'application/json'
  }
};

async function fetchData() {
  try {
    const response = await axios.request(options);
    console.log('📦 Full Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fetchData();