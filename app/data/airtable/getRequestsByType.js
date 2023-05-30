var Airtable = require('airtable')
var axios = require('axios')
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE,
)

async function GetRequestsByType(view) {
  try {
    return await base('Reviews').select({ view: view }).all()
  } catch (err) {
    console.log(err)
  }
}

module.exports = GetRequestsByType

