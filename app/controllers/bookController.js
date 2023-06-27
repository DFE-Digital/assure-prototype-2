// Global
var Airtable = require('airtable')
var axios = require('axios')
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE,
)

var urlencode = require('urlencode')

var NotifyClient = require('notifications-node-client').NotifyClient,
  notify = new NotifyClient(process.env.NOTIFYAPIKEY)

function getMonday(d) {
  d = new Date(d)
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function addWeeksToDate(date, weeks) {
  console.log('Adding ' + weeks + ' weeks to ' + date)
  console.log(date)
  date.setDate(date.getDate() + 7 * weeks)
  return date
}

function wait(waitTime) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, waitTime)
  })
}

// Gets a record by an ID
async function getDataByID(id) {
  return await base('Reviews')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function search(term) {
  try {
    console.log(term)
    return await base('Pipeline')
      .select({
        filterByFormula: `OR( find("${term}", Lower({ProjectID})),
        find("${term}", Lower({ProjectName})))`,
      })
      .firstPage()
  } catch (err) {
    console.log(err)
  }
}

async function getData(viewName) {
  return await base('Reviews').select({ view: viewName }).all()
}

// Gets a record by an ID
async function getPipelineDataByID(id) {
  return await base('Pipeline')
    .select({ maxRecords: 1, filterByFormula: `{ProjectID} = "${id}"` })
    .firstPage()
}

// Gets a record by an ID
async function getEntryDataByID(id) {
  return await base('Reviews')
    .select({ maxRecords: 1, filterByFormula: `{ProjectCode} = "${id}"` })
    .firstPage()
}

async function searchTracker(term) {
  term = term.toLowerCase()
  try {
    console.log(term)
    return await base('Pipeline')
      .select({
        filterByFormula: `OR( find("${term}", Lower({ProjectName})),
                              find("${term}", Lower({ProjectID})))`,
      })
      .firstPage()
  } catch (err) {
    console.log(err)
  }
}

async function searchReviews(term) {
  term = term.toLowerCase()
  try {
    console.log(term)
    return await base('Reviews')
      .select({
        filterByFormula: `OR( find("${term}", Lower({Name})),
                              find("${term}", Lower({ProjectCode})))`,
      })
      .firstPage()
  } catch (err) {
    console.log(err)
  }
}

// Local requests

const GetRequestsByType = require('../data/airtable/getRequestsByType')
const GetRequestByID = require('../data/airtable/getRequestByID')
const DeleteRequest = require('../data/airtable/deleteRequest')

// GET Methods

// Get the book start page with drafts
exports.get_start = function (req, res) {
  axios.all([GetRequestsByType('Draft')]).then(
    axios.spread((draft_records) => {

      var currentSignedInUserType =  req.session.data['role']


      console.log('ROLE b: ' + req.session.data['role'])

      req.session.data = {}

      req.session.data['role'] = currentSignedInUserType

      console.log('ROLE p: ' + req.session.data['role'])


  
      return res.render('book/index', { draft_records })
    }),
  )
}

// Get a draft
exports.get_draft = function (req, res) {
  var draftID = req.params.id

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      req.session.data['draftID'] = request.id

      console.log(request)

      return res.render('book/request/tasks/index', { request })
    }),
  )
}

// Get the tasks view
exports.get_tasks = function (req, res) {
  var draftID = req.session.data['draftID']

  if (draftID) {
    axios.all([GetRequestByID(draftID)]).then(
      axios.spread((request) => {
        req.session.data['draftID'] = request.id

        return res.render('book/request/tasks/index', { request })
      }),
    )
  } else {
    return res.redirect('/book/index')
  }
}

// Get name of discovery
exports.get_name_of_discovery = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      return res.render('book/request/name-of-discovery/index', { request })
    }),
  )
}

// Get summary
exports.get_summary = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      return res.render('book/request/summary/index', { request })
    }),
  )
}

// Get confidential
exports.get_confidential = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      return res.render('book/request/confidential/index', { request })
    }),
  )
}

exports.get_projectcode = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      return res.render('book/request/project-code/index', { request })
    }),
  )
}

// Get start date
exports.get_start_date = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      console.log(request)

      var day, month, year

      // Does a start date exist?
      if (request.fields.StartDate) {
        day = request.fields.StartDate.split('-')[2]
        month = request.fields.StartDate.split('-')[1]
        year = request.fields.StartDate.split('-')[0]
      }

      return res.render('book/request/start-date/index', {
        request,
        day,
        month,
        year,
      })
    }),
  )
}

// Get end date
exports.get_end_date = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      console.log(request)

      var day, month, year

      // Does an end date exist?
      if (request.fields.EndDate) {
        day = request.fields.EndDate.split('-')[2]
        month = request.fields.EndDate.split('-')[1]
        year = request.fields.EndDate.split('-')[0]
      }

      var endDateYN = req.session.data['disco-end']

      if (request.fields.EndDateYN) {
        endDateYN = request.fields.EndDateYN
      }

      return res.render('book/request/end-date/index', {
        request,
        day,
        month,
        year,
        endDateYN,
      })
    }),
  )
}

// Get dates
exports.get_dates = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      var endDateEstimated = new Date(request.fields.EndDate)

      // What are the weeks 5-10 from now?

      var weeks5 = getMonday(addWeeksToDate(new Date(), 5).toISOString())
      var weeks6 = getMonday(addWeeksToDate(new Date(), 6).toISOString())
      var weeks7 = getMonday(addWeeksToDate(new Date(), 7).toISOString())
      var weeks8 = getMonday(addWeeksToDate(new Date(), 8).toISOString())
      var weeks9 = getMonday(addWeeksToDate(new Date(), 9).toISOString())
      var weeks10 = getMonday(addWeeksToDate(new Date(), 10).toISOString())

      let dates = []

      if (request.fields.EndDateYN === 'No') {
        dates.push({
          week: weeks5.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
          }),
        })
        dates.push({
          week: weeks6.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
          }),
        })
        dates.push({
          week: weeks7.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
          }),
        })
        dates.push({
          week: weeks8.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
          }),
        })
        dates.push({
          week: weeks9.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
          }),
        })
        dates.push({
          week: weeks10.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
          }),
        })
      } else {
        if (endDateEstimated >= weeks5) {
          dates.push({
            week: weeks5.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
            }),
          })
        }
        if (endDateEstimated >= weeks6) {
          dates.push({
            week: weeks6.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
            }),
          })
        }
        if (endDateEstimated >= weeks7) {
          dates.push({
            week: weeks7.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
            }),
          })
        }
        if (endDateEstimated >= weeks8) {
          dates.push({
            week: weeks8.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
            }),
          })
        }
        if (endDateEstimated >= weeks9) {
          dates.push({
            week: weeks9.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
            }),
          })
        }
        if (endDateEstimated >= weeks10) {
          dates.push({
            week: weeks10.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
            }),
          })
        }
      }

      req.session.data['dates'] = dates

      if (dates.length) {
        req.session.data['hasdates'] = 'yes'
      } else {
        req.session.data['hasdates'] = 'no'
      }

      console.log(dates)

      res.render('book/request/dates/index', { request, dates })
    }),
  )
}

// Get summary
exports.get_portfolio = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      return res.render('book/request/portfolio/index', { request })
    }),
  )
}

// Get Deputy director
exports.get_dd = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      var dd

      if (!request.fields.DeputyDirector) {
        dd = req.session.data['dd']
      } else {
        dd = request.fields.DeputyDirector
      }

      return res.render('book/request/dd/index', { request, dd })
    }),
  )
}

// Get SRO
exports.get_sro = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      var sroName

      if (request.fields.SROSameAsDD === 'Yes') {
        sroName = request.fields.DeputyDirector
      } else {
        sroName = request.fields.SROName
      }

      return res.render('book/request/sro/index', { request, sroName })
    }),
  )
}

// Get Product manager
exports.get_product = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      return res.render('book/request/product/index', { request })
    }),
  )
}

// Get Delivery manager
exports.get_delivery = function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      return res.render('book/request/delivery/index', { request })
    }),
  )
}

// Get Complete
exports.get_complete = function (req, res) {
  return res.render('book/request/complete/index')
}

exports.get_delete = async function (req, res) {
  var draftID = req.session.data['draftID']

  axios.all([GetRequestByID(draftID)]).then(
    axios.spread((request) => {
      return res.render('book/request/delete/index', { request })
    }),
  )
}

// POST Methods

// Post the name of the discovey
exports.post_name_of_discovery = function (req, res) {
  var draftID = req.session.data['draftID']
  var name = req.body.title

  // If no title, return an error
  if (!name) {
    var err = true
    return res.render('book/request/name-of-discovery/index', { err })
  }

  // If we have a draftID then this is already in the DB so lets update the entry
  // Otherwise, create a new draft
  if (draftID) {
    // Update the draft
    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            Name: name,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          return res.redirect('/book/request/summary/')
        })
      },
    )
  } else {
    // Create a draft
    base('Reviews').create(
      [
        {
          fields: {
            Name: name,
            Status: 'Draft',
            RequestedBy: process.env.usr,
            ReportStatus: 'Enabled',
            Type: 'Peer Review',
            Phase: 'Discovery',
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          // Save the ID to the session so we know it's a draft
          req.session.data['draftID'] = record.id

          return res.redirect('/book/request/summary/')
        })
      },
    )
  }
}



// Post the summary
exports.post_summary = function (req, res) {
  var draftID = req.session.data['draftID']
  var description = req.body.purpose

  // If no title, return an error
  if (!description) {
    var err = true
    return res.render('book/request/summary/index', { err })
  }

  // If we have a draftID then this is already in the DB so lets update the entry
  // Otherwise, create a new draft
  if (draftID) {
    // Update the draft
    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            Description: description,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          return res.redirect('/book/request/project-code/')
        })
      },
    )
  } else {
    return res.redirect('/book/')
  }
}

// Post the confidential
exports.post_confidential = function (req, res) {
  var draftID = req.session.data['draftID']
  var confidential = req.body.confidential

  // If no title, return an error
  if (!confidential) {
    var err = true
    return res.render('book/request/confidential/index', { err })
  }

  // If we have a draftID then this is already in the DB so lets update the entry
  // Otherwise, create a new draft
  if (draftID) {
    // Update the draft
    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            Confidential: confidential,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          return res.redirect('/book/request/project-code/')
        })
      },
    )
  } else {
    return res.redirect('/book/')
  }
}

// Post the projectcode
exports.post_projectcode = function (req, res) {
  var draftID = req.session.data['draftID']
  var codeyn = req.body.projcode
  var code = req.body.projcodenumber


  if (!codeyn) {
    var err = true
    return res.render('book/request/project-code/index', { err })
  } else if (codeyn === 'Yes' && !code) {
    var errcode = true
    return res.render('book/request/project-code//index', { errcode })
  }
else{



  // If we have a draftID then this is already in the DB so lets update the entry
  // Otherwise, create a new draft
  if (draftID) {
    // Update the draft
    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            ProjectCodeYN: codeyn,
            ProjectCode: code,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          return res.redirect('/book/request/start-date/')
        })
      },
    )
  } else {
    return res.redirect('/book/')
  }
}
}

// Post the start date
exports.post_start_date = function (req, res) {
  var draftID = req.session.data['draftID']

  // If no start date
  if (
    !req.session.data['disco-start-day'] ||
    !req.session.data['disco-start-month'] ||
    !req.session.data['disco-start-year']
  ) {
    var err = true
    return res.render('book/request/start-date/index', { err })
  }

  var startDate = null

  // US Format for Airtable
  startDate =
    req.session.data['disco-start-month'] +
    '/' +
    req.session.data['disco-start-day'] +
    '/' +
    req.session.data['disco-start-year']

  // If we have a draftID then this is already in the DB so lets update the entry
  // Otherwise, create a new draft
  if (draftID) {
    // Update the draft
    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            StartDate: startDate,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          return res.redirect('/book/request/end-date/')
        })
      },
    )
  } else {
    return res.redirect('/book/')
  }
}

// Post the end date
exports.post_end_date = function (req, res) {
  var draftID = req.session.data['draftID']

  var endDateYN = req.session.data['disco-end']

  if (!endDateYN) {
    var err = true
    return res.render('book/request/end-date/index', { err, endDateYN })
  } else if (
    endDateYN === 'Yes' &&
    (!req.session.data['disco-end-day'] ||
      !req.session.data['disco-end-month'] ||
      !req.session.data['disco-end-year'])
  ) {
    var errcode = true
    return res.render('book/request/end-date/index', { errcode, endDateYN })
  }

  var endDate = null

  if (endDateYN === 'Yes') {
    // US Format for Airtable
    endDate =
      req.session.data['disco-end-month'] +
      '/' +
      req.session.data['disco-end-day'] +
      '/' +
      req.session.data['disco-end-year']
  }

  // If we have a draftID then this is already in the DB so lets update the entry
  // Otherwise, create a new draft
  if (draftID) {
    // Update the draft
    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            EndDate: endDate,
            EndDateYN: endDateYN,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          return res.redirect('/book/request/dates')
        })
      },
    )
  } else {
    return res.redirect('/book/')
  }
}

// Post dates
exports.post_dates = function (req, res) {
  var draftID = req.session.data['draftID']

  var dates = req.session.data['dates']
  var err = false

  if (
    req.session.data['hasdates'] === 'yes' &&
    !req.session.data['reviewWeek']
  ) {
    err = true
    return res.render('book/request/dates/index', { dates, err })
  } else {
    var requestedWeeks = ''

    requestedWeeks = req.session.data['reviewWeek']
      ? req.session.data['reviewWeek'].toString()
      : 'None available as end date is within next 5 weeks'

    var draftID = req.session.data['draftID']

    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            RequestedWeeks: requestedWeeks,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.fields.ID)

          return res.redirect('/book/request/portfolio')
        })
      },
    )
  }
}

// Post the summary
exports.post_portfolio = function (req, res) {
  var portfolio = req.body.portfolio

  if (!portfolio) {
    var err = true
    return res.render('book/request/portfolio/index', { err })
  }

  var draftID = req.session.data['draftID']

  base('Reviews').update(
    [
      {
        id: draftID,
        fields: {
          Portfolio: portfolio,
        },
      },
    ],
    { typecast: true },
    function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        return res.redirect('/book/request/dd')
      })
    },
  )
}

// Post the deputy director
exports.post_dd = function (req, res) {
  var dd = req.body.dd
  var DeputyDirectorName = dd

  console.log(req.session)

  if (!dd) {
    var err = true
    return res.render('book/request/dd/index', { err, DeputyDirectorName })
  }

  var draftID = req.session.data['draftID']

  base('Reviews').update(
    [
      {
        id: draftID,
        fields: {
          DeputyDirector: dd,
        },
      },
    ],
    function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        return res.redirect('/book/request/sro')
      })
    },
  )
}

// Post the SRO
exports.post_sro = function (req, res) {
  var sroYesNo = req.session.data['sro']

  if (!sroYesNo) {
    var err = true
    return res.render('book/request/sro/index', { err })
  } else if (sroYesNo === 'No' && !req.session.data['sro-name']) {
    var errcode = true
    return res.render('book/request/sro/index', { errcode })
  } else {
    var draftID = req.session.data['draftID']

    var sroName = req.session.data['sro-name']

    if (sroYesNo === 'Yes') {
      sroName = null
    }

    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            SROName: sroName,
            SROSameAsDD: sroYesNo,
          },
        },
      ],
      { typecast: true },
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          return res.redirect('/book/request/product')
        })
      },
    )
  }
}

// Post the product manager
exports.post_product = function (req, res) {
  var pm = req.body.pm
  var pmName = req.session.data['pm-name']

  if (!pm) {
    var err = true
    return res.render('book/request/product/index', { err })
  } else if (pm === 'Yes' && !pmName) {
    var errcode = true
    return res.render('book/request/product/index', { errcode })
  } else {
    var draftID = req.session.data['draftID']

    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            ProductManagerName: pmName,
            ProductManagerYN: pm,
          },
        },
      ],
      { typecast: true },
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          return res.redirect('/book/request/delivery')
        })
      },
    )
  }
}

// Post the delivery manager
exports.post_delivery = function (req, res) {
  var dm = req.body.dm
  var dmName = req.session.data['dm-name']

  if (!dm) {
    var err = true
    return res.render('book/request/delivery/index', { err })
  } else if (dm === 'Yes' && !dmName) {
    var errcode = true
    return res.render('book/request/delivery/index', { errcode })
  } else {
    var draftID = req.session.data['draftID']

    base('Reviews').update(
      [
        {
          id: draftID,
          fields: {
            DeliveryManagerName: dmName,
            DeliveryManagerYN: dm,
          },
        },
      ],
      { typecast: true },
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          return res.redirect('/book/request/tasks')
        })
      },
    )
  }
}

exports.post_tasks = function (req, res) {
  var draftID = req.session.data['draftID']

  base('Reviews').update(
    [
      {
        id: draftID,
        fields: {
          Status: 'New',
          RequestedBy: 'Callum Mckay'
        },
      },
    ],
    { typecast: true },
    function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record)

        notify
          .sendEmail(process.env.SATTemplateId, process.env.recipient, {
            personalisation: {
              nameOfDiscovery: record.fields.Name,
              summary: record.fields.Description,
              id: record.fields.ID,
            },
          })
          .then((response) =>
            console.log('Notification: ' + response.statusText),
          )
          .catch((err) => console.error(err))
      })
    },
  )
  return res.redirect('/book/request/complete')
}

exports.post_delete = async function (req, res) {
  var draftID = req.params.id

  DeleteRequest(draftID)

  await wait(1500)

  return res.redirect('/book')
}

exports.get_search_code = function (req, res) {
  var term = req.query.projcode
  axios.all([searchTracker(term), searchReviews(term)]).then(
    axios.spread((results, requests) => {
      req.session.data['query'] = term
      res.render('book/request/project-code/results.html', {
        results,
        requests,
        term,
      })
    }),
  )
}

exports.get_request_check = function (req, res) {
  var id = req.params.id
  console.log(id)

  axios.all([getEntryDataByID(id)]).then(
    axios.spread((request) => {
      console.log(request)

      if (request.length) {
        return res.redirect('/book/request/existing/' + request[0].fields.ID)
      } else {
        var encodedURL = urlencode(id)
        console.log(encodedURL)
        return res.redirect('/book/request/create/' + encodedURL)
      }
    }),
  )
}

exports.get_request_existing = function (req, res) {
  var id = req.params.id
  console.log(id)

  axios.all([getDataByID(id)]).then(
    axios.spread((request) => {
      req.session.data['draftID'] = request.id

      request = request[0]

      return res.render('book/request/project-code/existing', { request })
    }),
  )
}

exports.get_request_create = function (req, res) {
  var id = req.params.id
  console.log(id)

  axios.all([getPipelineDataByID(id)]).then(
    axios.spread((request) => {
      request = request[0]

      return res.render('book/request/project-code/create', { request })
    }),
  )
}

exports.get_setup_from_disvovery = function (req, res) {
  var projectID = req.params.id

  // Get the entry
  axios.all([getPipelineDataByID(projectID)]).then(
    axios.spread((pipeline) => {
      console.log('pipeline')
      console.log(pipeline)

      // Get the manage entry

      axios.all([getEntryDataByID(pipeline[0].fields.ProjectID)]).then(
        axios.spread((entry) => {
          console.log('entry')
          console.log(entry)

          // Get the manage entry
          if (!entry.length) {
            //Create the entry

            base('Reviews').create(
              [
                {
                  fields: {
                    Name: pipeline[0].fields.ProjectName,
                    Description: pipeline[0].fields.ProjectObjective,
                    ProjectCode: pipeline[0].fields.ProjectID,
                    Status: 'Draft',
                    RequestedBy: process.env.usr,
                    ReportStatus: 'Disabled',
                    Type: 'Discovery Peer Review'
                  },
                },
              ],
              function (err, records) {
                if (err) {
                  console.error(err)
                  return
                }
                records.forEach(function (record) {
                  console.log(record)

                  req.session.data['draftID'] = record.id

                  return res.redirect('/book/draft/'+record.id)
                })
              },
            )
          }
        }),
      )
    }),
  )
}
