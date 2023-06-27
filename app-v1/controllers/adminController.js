// Global
require('dotenv').config()
var Airtable = require('airtable')
var axios = require('axios')
var moment = require('moment')
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE,
)

var NotifyClient = require('notifications-node-client').NotifyClient,
  notify = new NotifyClient(process.env.NOTIFYAPIKEY)



async function GetRequestsByType(view) {
  try {
    return await base('Reviews').select({ view: view }).all()
  } catch (err) {
    console.log(err)
  }
}

async function GetAllPanels(view) {
  try {
    return await base('ReviewPanel').select({ view: view }).all()
  } catch (err) {
    console.log(err)
  }
}

// Gets a record by an ID
async function getEntryByID(id) {
  return await base('Reviews')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function getArtefacts(id) {
  return await base('Artefacts')
    .select({ view: 'Files', filterByFormula: `{ReviewID} = "${id}"` })
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

async function getTeam(id) {
  return await base('ReviewTeam')
    .select({ view: 'People', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getAssessors(viewName) {
  return await base('Assessors').select({ view: viewName }).all()
}

async function getPerson(id) {
  return await base('ReviewTeam')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function getAssessor(id) {
  return await base('Assessors')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function getArtefact(id) {
  return await base('Artefacts')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function getDates(id) {
  return await base('ReviewDateOptions')
    .select({ view: 'All', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getDate(id) {
  //console.log(id)
  return await base('ReviewDateOptions')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}


async function getPanelMember(id) {
  return await base('ReviewPanel')
    .select({ view: 'People', filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}



function wait(waitTime) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, waitTime)
  })
}

exports.g_dashboard = function (req, res) {

  console.log('Admin - Get Dashboard')
  axios
    .all([
      GetRequestsByType('New'),
      GetRequestsByType('AdminProgress'),
      GetRequestsByType('Upcoming'),
    ])
    .then(
      axios.spread(
        (
          new_records,
          active_records,
          upcoming
        ) => {
          return res.render('admin/dashboard', {
            new_records,
            active_records,
            upcoming
          })
        },
      ),
    )
}

exports.g_assessors_needed = function (req, res) {

  axios
    .all([
      GetRequestsByType('Active'), GetAllPanels('All')
    ])
    .then(
      axios.spread(
        (
          assessments, panels
        ) => {
          return res.render(`admin/reporting/assessors-needed`, { assessments, panels })
        },
      ),
    )
}

exports.g_analysis = function (req, res) {
  axios
    .all([
      GetRequestsByType('Red'), GetRequestsByType('Amber'), GetRequestsByType('Green')
    ])
    .then(
      axios.spread(
        (
          red, amber, green
        ) => {
          return res.render(`admin/analysis/index`, { red, amber, green })
        },
      ),
    )
}

exports.g_send_volunteer_email = function (req, res) {

  return res.render(`admin/reporting/send-assessor-request`)

}

exports.g_assessor_activity = function (req, res) {

  axios
    .all([
      getAssessors('Assessors')
    ])
    .then(
      axios.spread(
        (
          assessors
        ) => {
          return res.render(`admin/reporting/assessor-activity`, { assessors })
        },
      ),
    )



}

exports.p_send_volunteer_email = function (req, res) {

  return res.redirect(`/admin/reporting/send-assessor-request-complete`)

}

exports.g_send_volunteer_email_done = function (req, res) {

  return res.render(`admin/reporting/send-assessor-request-complete`)

}



exports.g_code_needed = function (req, res) {

  console.log('get missing codes')

  axios
    .all([
      GetRequestsByType('MissingCodes')
    ])
    .then(
      axios.spread(
        (
          assessments
        ) => {
          return res.render(`admin/reporting/missing-code`, { assessments })
        },
      ),
    )
}


exports.g_all_requests = function (req, res) {

  console.log('Admin - All Requests')
  axios
    .all([
      GetRequestsByType('All'),
    ])
    .then(
      axios.spread(
        (
          all_records
        ) => {
          return res.render('admin/entries/all', {
            all_records
          })
        },
      ),
    )
}

exports.g_get_request = async function (req, res) {

  var id = req.params.id;

  await wait(500);

  console.log('Admin - Get Request ' + id)
  axios
    .all([
      getEntryByID(id), getArtefacts(id), getPanel(id), getTeam(id)
    ])
    .then(
      axios.spread(
        (
          entry, artefacts, panel, team
        ) => {
          entry = entry[0]
          return res.render('admin/entry/index', {
            entry, artefacts, panel, team
          })
        },
      ),
    )
}

exports.g_action = function (req, res) {

  var action = req.params.action;
  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]
          return res.render(`admin/entry/editor-layout`, {
            entry, action, assessors, panel
          })
        },
      ),
    )
}

exports.p_submission = async function (req, res) {


  var id = req.params.id;
  var entryid = req.body.entryid;

  if (req.body.action === 'accept') {
    // Update to accepted and redirect to the task list

    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            Status: 'In progress',
            RejectedReason: null,
            RejectedDate: null,
            SubStatus: 'Pre-assessment'
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          //console.log(record.get('Status'))
        })
      },
    )

    return res.redirect(`/admin/entry/${id}`)
  }

  if (req.body.action === 'reject_reason') {
    // redirect to the reject reason page

    return res.redirect(`/admin/reject_reason/${id}`)
  }

}

exports.p_action = async function (req, res) {

  var view = req.params.action;
  var id = req.params.id;
  var entryid = req.body.entryid;

  console.log(entryid)

  var optiondate, optiontime

  //console.log(req.session.data)

  optiondate =
    req.session.data['xmonth'] +
    '/' +
    req.session.data['xday'] +
    '/' +
    req.session.data['xyear']

  //console.log(optiondate)

  //availabletime
  var optiontime = req.body.availabletime



  if (view === 'update-summary') {
    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            Description: req.body.purpose
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {

        })
      }
    )
  }

  if (view === 'update-outcome') {
    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            Outcome: req.body.outcomerag
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
      }
    )
    await wait(500);
    return res.redirect(`/admin/report/done-well/${id}`)
  }

  if (view === 'done-well') {
    var donewell = req.body.donewell

    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            ReviewDoneWell: donewell,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ReviewDoneWell'))
        })
      },
    )

    return res.redirect(`/admin/report/improve/${id}`)
  }

  if (view === 'improve') {
    var improve = req.body.improve

    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            ReviewImprove: improve,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ReviewDoneWell'))
        })
      },
    )

    return res.redirect(`/admin/report/preview/${id}`)
  }

  if (view === 'add-panel-member') {

    axios.all([getEntryByID(id)]).then(
      axios.spread((entry) => {
        //console.log(entry)
        var serviceName = entry[0].fields.Name

        let roleinteam = req.body.roleinteam;

        if (!Array.isArray(roleinteam)) {
          roleinteam = [roleinteam];
        }

        console.log(roleinteam)

        base('ReviewPanel').create(
          [
            {
              fields: {
                Name: req.body.team_,
                ReviewID: parseInt(id),
                Role: roleinteam
              },
            },
          ],
          function (err, records) {
            if (err) {
              console.error(err)
              return
            }
            records.forEach(function (record) {

            })
          },
        )

        let roleStrings;

        var split = req.body.team_.split(' ');
        var firstName = split[0];

        if (roleinteam.length === 1) {
          roleStrings = roleinteam[0];
        } else {
          const lastItem = roleinteam.pop();
          roleStrings = roleinteam.join(', ') + ' and ' + lastItem;
        }

        notify
          .sendEmail(
            process.env.added_to_discovery_panel_review,
            process.env.recipient,
            {
              personalisation: {
                firstName: firstName,
                nameOfDiscovery: serviceName,
                role: roleStrings,
                id: entry[0].fields.ID,
                serviceURL: process.env.serviceURL,
                date: moment(entry[0].fields.ReviewDate).format('dddd D MMM YYYY'),
                time: entry[0].fields.ReviewTime
              },
            },
          )
          .then((response) => {
            //console.log(response)
          })
          .catch((err) => console.log(err))



      })
    ).catch((err) => console.log(err))



    await wait(800);
    return res.redirect(`/admin/entry/${id}`)
  }

  if (view === 'submitreport') {
    var now = new Date()
    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            SubStatus: 'SAT Review',
            ReportSATDate: now.toLocaleDateString("en-US")
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('Status'))


          notify
            .sendEmail(
              process.env.peer_review_report_completed,
              process.env.recipient,
              {
                personalisation: {
                  nameOfDiscovery: record.fields.Name,
                  id: record.fields.ID,
                  serviceURL: process.env.serviceURL,
                },
              },
            )
            .then((response) => {
              console.log(response.data)
            })
            .catch((err) => console.log(err))
        })
      },
    )
    await wait(800);
    return res.redirect(`/admin/report/report-submitted-to-sat/${id}`)
  }

  if (view === 'satsubmit') {
    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            SubStatus: 'Team Review',
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {

          notify
            .sendEmail(
              process.env.peer_review_report_ready,
              process.env.recipient,
              {
                personalisation: {
                  nameOfDiscovery: record.fields.Name,
                  id: record.fields.ID,
                  serviceURL: process.env.serviceURL,
                },
              },
            )
            .then((response) => {
              //console.log(response)
            })
            .catch((err) => console.log(err))
        })
      },
    )




    await wait(800);
    return res.redirect(`/admin/report/preview/${id}`)
  }

  if (view === 'teamsubmit') {
    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            SubStatus: 'SAT Publish',
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {

          notify
            .sendEmail(
              process.env.peer_review_report_ready,
              process.env.recipient,
              {
                personalisation: {
                  nameOfDiscovery: record.fields.Name,
                  id: record.fields.ID,
                  serviceURL: process.env.serviceURL,
                },
              },
            )
            .then((response) => {
              //console.log(response)
            })
            .catch((err) => console.log(err))
        })
      },
    )
    await wait(800);
    return res.redirect(`/admin/report/report-ready-to-publish/${id}`)
  }

  if (view === 'publishreport') {


    var now = new Date()

    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            SubStatus: 'Published',
            Status: 'Complete',
            PublishedDate: now.toLocaleDateString("en-US")
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {

          notify
            .sendEmail(
              process.env.finalEmail,
              process.env.recipient,
              {
                personalisation: {
                  nameOfDiscovery: record.fields.Name,
                  serviceURL: process.env.serviceURL,
                  id: record.fields.ID
                },
              },
            )
            .then((response) => {
              //console.log(response)
            })
            .catch((err) => console.log(err))

        })
      },
    )
    await wait(800);
    return res.redirect(`/admin/report/complete/${id}`)
  }

  if (view === 'reject_reason') {
    // This is the reject reason page

    let now = new Date()
    now.toISOString()

    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            Status: 'Rejected',
            RejectedReason: req.body.reject_reason,
            RejectedDate: now,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          notify
            .sendEmail(
              process.env.peer_review_request_rejected,
              process.env.recipient,
              {
                personalisation: {
                  nameOfDiscovery: record.fields.ReviewName,
                  reason: record.fields.RejectedReason,
                },
              },
            )
            .then((response) => {
              //console.log(response)
            })
            .catch((err) => console.log(err))
        })
      },
    )
  }

  if (view === 'review_date') {
    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            ReviewDate: optiondate,
            ReviewTime: optiontime,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          //console.log(record.get('ReviewDate'))

          optiondate = new Date(optiondate).toLocaleDateString('en-GB')

          notify
            .sendEmail(
              process.env.confirmation_date_time_review,
              process.env.recipient,
              {
                personalisation: {
                  nameOfDiscovery: record.fields.Name,
                  serviceURL: process.env.serviceURL,
                  id: record.fields.ID,
                  date: optiondate,
                  time: optiontime
                },
              },
            )
            .then((response) => {
              //console.log(response)
            })
            .catch((err) => console.log(err))

        })
      },
    )
  }

  if (view === 'project-code') {
    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            ProjectCode: req.body.code_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
        })
      },
    )
  }

  if (view === 'bp') {
    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            BusinessPartnerName: req.body.bp_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          //console.log(record.get('BusinessPartnerName'))
        })
      },
    )
  }

  if (view === 'product') {
    base('Reviews').update(
      [
        {
          id: entryid,
          fields: {
            ProductManagerName: req.body.pm_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
        })
      },
    )
  }

  await wait(800);
  res.redirect(`/admin/submission/${id}`)

}

// GET extended entry
exports.g_extended_entry = function (req, res) {

  var id = req.params.id
  var action = req.params.view
  var entry = req.params.entry

  console.log('/admin/' + action + '/' + id + '/' + entry)

  axios
    .all([
      getEntryByID(id),
      getPerson(entry),
      getArtefact(entry),
      getPanelMember(entry),
      getObservers(id),
      getDate(entry),
    ])
    .then(
      axios.spread((entryx, person, artefact, panel, observers, datex) => {
        entry = entryx[0]
        res.render('admin/entry/entry-editor-layout', {
          entry,
          person,
          artefact,
          action,
          panel,
          observers,
          datex,

        })
      }),
    )
}


exports.p_entry_post = async function (req, res) {

  console.log('p_entry_post')

  var id = req.params.id
  var view = req.params.view
  var entry = req.params.entry



  if (view === 'remove-panel-member') {
    base('ReviewPanel').destroy([entry], function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        //console.log(record.get('ID'))
      })
    })
    await wait(150)
    return res.redirect('/admin/entry/' + id)
  }



}

exports.g_report = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]

          if (entry.fields.SubStatus === 'Published') {
            return res.render(`admin/entry/published-report`, {
              entry, assessors, panel
            })
          }
          else if (entry.fields.Status === 'Rejected' || entry.fields.Status === 'Cancelled' || entry.fields.Status === 'New') {
            return res.render(`admin/entry/report-none`, {
              entry, assessors, panel
            })
          } else {
            return res.render(`admin/entry/report`, {
              entry, assessors, panel
            })
          }


        },
      ),
    )
}

exports.g_report_preview = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]


          return res.render(`admin/entry/preview`, {
            entry, assessors, panel
          })



        },
      ),
    )
}

exports.g_report_sat1 = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]


          return res.render(`admin/entry/report-submitted-to-sat`, {
            entry, assessors, panel
          })



        },
      ),
    )
}

exports.g_report_team = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]


          return res.render(`admin/entry/report-submitted-to-team`, {
            entry, assessors, panel
          })



        },
      ),
    )
}

exports.g_report_publish = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]


          return res.render(`admin/entry/report-ready-to-publish`, {
            entry, assessors, panel
          })



        },
      ),
    )
}

exports.g_submission = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id)
    ])
    .then(
      axios.spread(
        (
          entry
        ) => {
          entry = entry[0]
          return res.render(`admin/entry/submission`, {
            entry
          })
        },
      ),
    )
}

exports.g_report_outcome = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]
          return res.render(`admin/entry/report_outcome`, {
            entry, assessors, panel
          })
        },
      ),
    )
}

exports.g_report_donewell = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]
          return res.render(`admin/entry/report_good`, {
            entry, assessors, panel
          })
        },
      ),
    )
}

exports.g_report_complete = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]
          return res.render(`admin/entry/complete`, {
            entry, assessors, panel
          })
        },
      ),
    )
}

exports.g_report_improve = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]
          return res.render(`admin/entry/report_improve`, {
            entry, assessors, panel
          })
        },
      ),
    )
}

exports.g_alpha_report = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]
          return res.render(`admin/entry/alpha`, {
            entry, assessors, panel
          })
        },
      ),
    )
}

exports.g_get_history = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]
          return res.render(`admin/entry/history`, {
            entry, assessors, panel
          })
        },
      ),
    )
}

exports.g_get_admin = function (req, res) {

  var id = req.params.id;

  axios
    .all([
      getEntryByID(id),
      getAssessors('All'),
      getPanel(id)
    ])
    .then(
      axios.spread(
        (
          entry, assessors, panel
        ) => {
          entry = entry[0]
          return res.render(`admin/entry/admin`, {
            entry, assessors, panel
          })
        },
      ),
    )
}



exports.g_assessors = function (req, res) {


  axios
    .all([getAssessors("Assessors")
    ])
    .then(
      axios.spread((assessors) => {

        res.render('admin/assessors/index', {
          assessors
        })
      }),
    )
}


exports.g_assessor = function (req, res) {

  var id = req.params.id;

  console.log(id)

  axios
    .all([getAssessor(id), GetRequestsByType("assessorList")
    ])
    .then(
      axios.spread((assessor, all) => {

        assessor = assessor[0]

        res.render('admin/assessors/assessor', {
          assessor, all
        })
      }),
    )
}