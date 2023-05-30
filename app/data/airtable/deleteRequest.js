var Airtable = require('airtable')
var axios = require('axios')
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE,
)

async function DeleteRequest(id) {
  try {
      return await base('Reviews').destroy([id])
  } catch (err) {
    console.log(err)
  }
}

module.exports = DeleteRequest
