// Global
require('dotenv').config()
var Airtable = require('airtable')
var axios = require('axios')
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

async function GetAllPanels(view) {
    try {
        return await base('ReviewPanel').select({ view: view }).all()
    } catch (err) {
        console.log(err)
    }
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

function wait(waitTime) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true)
        }, waitTime)
    })
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
                    return res.render(`generic/assessments`, { assessments, panels })
                },
            ),
        )
}



exports.g_volunteer = function (req, res) {
    var id = req.params.id;
    var role = req.params.role;

    axios
        .all([
            getEntryByID(id), getPanel(id)
        ])
        .then(
            axios.spread(
                (
                    entry, panel
                ) => {
                    entry = entry[0]
                    return res.render('generic/volunteer', {
                        entry, role, panel
                    })
                },
            ),
        )

}


exports.p_volunteer = function (req, res) {
    var id = req.params.id;
    var role = req.params.role;

    axios
        .all([
            getEntryByID(id), getPanel(id)
        ])
        .then(
            axios.spread(
                (
                    entry
                ) => {
                    entry = entry[0]

                    notify
                    .sendEmail(
                      process.env.volunteerEmail,
                      process.env.recipient,
                      {
                        personalisation: {
                          nameOfDiscovery: entry.fields.Name,
                          id: entry.fields.ID,
                          role: role,
                          serviceURL: process.env.serviceURL,
                        },
                      },
                    )
                    .then((response) => {
                      console.log(response.data)
                    })
                    .catch((err) => console.log(err))

                    return res.render('generic/volunteer-complete',{entry, role});
                },
            ),
        )
}