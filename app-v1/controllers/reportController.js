// Global
var Airtable = require('airtable')
var axios = require('axios')
var momentBusinessDays = require('moment-business-days')
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE,
)

// Local requests
const GetRequestsByType = require('../data/airtable/getRequestsByType')
const GetRequestByID = require('../data/airtable/getRequestByID')

// Gets data by an AirTable view
async function getData(viewName) {
  return await base('Reviews').select({ view: viewName }).all()
}

// Gets data by an AirTable view
async function getAssessors(viewName) {
  return await base('Assessors').select({ view: viewName }).all()
}
async function getPeople(viewName) {
  return await base('Assessors').select({ view: viewName }).all()
}

async function getTeam(id) {
  return await base('ReviewTeam')
    .select({ view: 'People', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getPanel(id) {
  return await base('ReviewPanel')
    .select({ view: 'People', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getObservers(id) {
  return await base('ReviewObservers')
    .select({ view: 'People', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getArtefacts(id) {
  return await base('Artefacts')
    .select({ view: 'Files', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getDates(id) {
  return await base('ReviewDateOptions')
    .select({ view: 'All', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getDate(id) {
  console.log(id)
  return await base('ReviewDateOptions')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

// Gets a record by an ID
async function getDataByID(id) {
  return await base('Reviews')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function getPerson(id) {
  return await base('ReviewTeam')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function getArtefact(id) {
  return await base('Artefacts')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

exports.getReportHome = function (req, res) {

    axios.all([GetRequestsByType('Published')]).then(
      axios.spread((results) => {
        return res.render('reports/index', {
          results
        })
      }),
    )
  }

exports.applyFilter = function (req, res) {
  var outcomes = req.session.data['filter_outcome']
  console.log(outcomes)

  axios.all([GetRequestsByType('Published')]).then(
    axios.spread((results) => {
      return res.render('reports/index', {
        results,
        outcomes,
      })
    }),
  )
}

// Gets a report for a given ID
exports.getReport = function (req, res) {
  var id = req.params.id

  axios
    .all([
      getDataByID(id),
      getTeam(id),
      getArtefacts(id),
      getPanel(id),
      getObservers(id),
    ])
    .then(
      axios.spread((entryx, team, artefacts, panel, observers) => {
        entry = entryx[0]
        res.render('reports/report.html', {
          entry,
          team,
          artefacts,
          panel,
          observers,
        })
      }),
    )
}
