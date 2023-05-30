
require('dotenv').config()
var Airtable = require('airtable')
var axios = require('axios')
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE,
)

var NotifyClient = require('notifications-node-client').NotifyClient,
  notify = new NotifyClient(process.env.NOTIFYAPIKEY)


  exports.g_report = function (req, res) {
return res.render('panel/report')
  }