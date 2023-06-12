// Global
var Airtable = require('airtable')
var axios = require('axios')
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE,
)

var NotifyClient = require('notifications-node-client').NotifyClient,
  notify = new NotifyClient(process.env.NOTIFYAPIKEY)

// Gets a record by an ID
async function getDataByID(id) {
  return await base('Reviews')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function getData(viewName) {
  return await base('Reviews').select({ view: viewName }).all()
}

async function getSurveysData(viewName) {
  return await base('Surveys').select({ view: viewName }).all()
}

exports.get_home = function (req, res) {
  axios.all([getData('Completed'), getData('Published'), getSurveysData('Grid'), getSurveysData('Q1Values'), getSurveysData('Q2Values'), getSurveysData('Q3Values')]).then(
    axios.spread((completed, published, surveys, q1,q2,q3) => {

  
      res.render('survey/index', {
        completed,
        published,
        surveys, q1,q2,q3
      })
    }),
  )
}



exports.get_start = function (req, res) {
  var id = req.params.id

  if (id === undefined) {
    return res.redirect('/')
  }
  var view = 'survey'
  axios.all([getDataByID(id)]).then(
    axios.spread((entry) => {
      entry = entry[0]

      if (
        entry.fields.Status !== 'Complete' &&
        entry.fields.Status !== 'Published'
      ) {
        return res.redirect('/')
      }

      res.render('survey/index', {
        entry,
        view,
      })
    }),
  )
}

exports.get_question = function (req, res) {
  var id = req.params.id
  var question = req.params.q

  if (id === undefined) {
    return res.redirect('/')
  }
  var view = 'survey'
  axios.all([getDataByID(id)]).then(
    axios.spread((entry) => {
      entry = entry[0]

      if (
        entry.fields.Status !== 'Complete' &&
        entry.fields.Status !== 'Published'
      ) {
        return res.redirect('/')
      }

      res.render('survey/q' + question, {
        entry,
        view,
        id,
        question,
      })
    }),
  )
}

exports.post_question = function (req, res) {
  var id = req.params.id
  var question = req.params.q

  var nextQuestion = parseInt(question) + 1

  if (id === undefined) {
    return res.redirect('/')
  }

  var view = 'survey'
  axios.all([getDataByID(id)]).then(
    axios.spread((entry) => {
      entry = entry[0]

      if (
        entry.fields.Status !== 'Complete' &&
        entry.fields.Status !== 'Published'
      ) {
        return res.redirect('/')
      }

      if (nextQuestion === 4) {
        console.log('3')
        return res.redirect('/survey/submit/' + id)
      } else {
        return res.redirect('/survey/' + id + '/q' + nextQuestion)
      }
    }),
  )
}

exports.post_submit_survey = function (req, res) {
  var id = req.params.id
  console.log('submit get')

  if (id === undefined) {
    return res.redirect('/')
  }
  var view = 'survey'
  axios.all([getDataByID(id)]).then(
    axios.spread((entry) => {
      entry = entry[0]

      base('Surveys').create(
        [
          {
            fields: {
              Name: 'Response',
              Comments: req.session.data['comments'],
              Q1: parseInt(req.session.data['q1']),
              Q1comments: req.session.data['q1comments'],
              Q2: parseInt(req.session.data['q2']),
              Q2comments: req.session.data['q2comments'],
              Q3: parseInt(req.session.data['q3']),
              Q3comments: req.session.data['q3comments'],
              ProjectID: parseInt(id)
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

            req.session.data['q1'] = [];
            req.session.data['q2'] = [];
            req.session.data['q3'] = [];
            req.session.data['q1comments'] = [];
            req.session.data['q2comments'] = [];
            req.session.data['q3comments'] = [];

            return res.redirect('/survey/submitted')
          })
        },
      )
    }),
  )
}

exports.get_survey_submit = function (req, res) {
    var id = req.params.id

    if (id === undefined) {
      return res.redirect('/')
    }
    var view = 'survey'
    axios.all([getDataByID(id)]).then(
      axios.spread((entry) => {
        entry = entry[0]
  
        if (
          entry.fields.Status !== 'Complete' &&
          entry.fields.Status !== 'Published'
        ) {
          return res.redirect('/')
        }
  
        res.render('survey/submit', {
          entry,
          view,
        })
      }),
    )
}

exports.get_submitted = function (req, res) {
  return res.render('survey/submitted')
}
