const express = require('express')
const nunjucks = require('nunjucks')
const https = require('https')
const axios = require('axios')
var dateFilter = require('nunjucks-date-filter')
var markdown = require('nunjucks-markdown')
var marked = require('marked')
const bodyParser = require('body-parser')
const lunr = require('lunr')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const config = require('./app/config')
const puppeteer = require('puppeteer');
const glob = require('glob');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
var session = require('express-session')
var cookieSession = require('cookie-session')

const socketIO = require('socket.io');

const sessionInCookie = require('client-sessions')

const routes = require('./app/routes.js')

dayjs.extend(relativeTime);

const helmet = require('helmet');

const favicon = require('serve-favicon');

const PageIndex = require('./middleware/pageIndex')
const pageIndex = new PageIndex(config)

var NotifyClient = require('notifications-node-client').NotifyClient
const slugifyFilter = require('./middleware/filters/slugify');



require('dotenv').config()
const app = express()

const notify = new NotifyClient(process.env.notifyKey)

var Airtable = require('airtable')
var base = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY
}).base(
    process.env.AIRTABLE_BASE,
)
const table = 'test'; // Replace with your table name
const recordId = 'rec0mUpzQRolTQHMp'; // Replace with your record ID

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(favicon(path.join(__dirname, 'public/assets/images', 'favicon.ico')));

app.set('view engine', 'html')

app.locals.serviceName = 'Design Manual'
app.locals.recaptchaPublic = process.env.recaptchaPublic


// Set up Nunjucks as the template engine
var nunjuckEnv = nunjucks.configure(
    [
        'app/views',
        'node_modules/govuk-frontend',
        'node_modules/dfe-frontend-alpha/packages/components',
    ], {
        autoescape: true,
        express: app,
    },
)

markdown.register(nunjuckEnv, marked.parse)

nunjuckEnv.addFilter('date', (date, format) => {
    return dayjs(date).format(format);
});

nunjuckEnv.addFilter('fromNow', (date) => {
    return dayjs(date).fromNow();
});

nunjuckEnv.addFilter('split', function(str, seperator) {
    return str.split(seperator);
});

nunjuckEnv.addFilter('BoolToYesNo', function(str) {
    return str ? 'Yes' : 'No'
})

nunjuckEnv.addFilter('BoolToYesBlank', function(str) {
    return str ? 'Yes' : '-'
})

nunjuckEnv.addFilter('slugify', slugifyFilter);
nunjuckEnv.addFilter('markdown', mdFilter);

// Set up static file serving for the app's assets
app.use('/assets', express.static('public/assets'))

app.set('trust proxy', 1)

const sessionOptions = {
    name: 'assurecookie',
    keys: ['r43gfgr5hh5gr5hg43h43ew4ef'],
    maxAge: 86400000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    secret: '23hfeuwgihougi2u3tui7tu23ef' // Add a secret string here
};

app.use(cookieSession(sessionOptions));

function autoStoreData(req, res, next) {
    if (!req.session.data) {
        req.session.data = {}
    }

    req.session.data = Object.assign({}, req.session.data)

    storeData(req.body, req.session.data)
    storeData(req.query, req.session.data)

    // Send session data to all views

    res.locals.data = {}

    for (var j in req.session.data) {
        res.locals.data[j] = req.session.data[j]
    }

    next()
}

var storeData = function(input, data) {
    for (var i in input) {
        // any input where the name starts with _ is ignored
        if (i.indexOf('_') === 0) {
            continue
        }

        var val = input[i]

        // Delete values when users unselect checkboxes
        if (val === '_unchecked' || val === ['_unchecked']) {
            delete data[i]
            continue
        }

        // Remove _unchecked from arrays of checkboxes
        if (Array.isArray(val)) {
            val = val.filter((item) => item !== '_unchecked')
        } else if (typeof val === 'object') {
            // Store nested objects that aren't arrays
            if (typeof data[i] !== 'object') {
                data[i] = {}
            }

            // Add nested values
            storeData(val, data[i])
            continue
        }

        data[i] = val
    }
}


app.use(autoStoreData)

const server = app.listen(config.port)

// Create a Socket.IO server
const io = socketIO(server);
let doneWellText = '';
let improveText = '';

io.on('connection', socket => {
    console.log(`New user connected [id=${socket.id}]`);

    // Fetch the initial text from Airtable
    base(table).find(recordId, (err, record) => {
        if (err) {
            console.error('Error fetching initial text from Airtable:', err);
            socket.emit('initialText', ''); // Send an empty initial text
        } else {
            const initialText = record.get('content');
            socket.emit('initialText', initialText); // Send the initial text to the client
        }
    });

    // Listen for updates from the connected user
    socket.on('updateText', newText => {
        updateText(newText);
        // Broadcast the updated text to all connected users
        io.emit('updatedText', getCurrentText());
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected [id=${socket.id}]`);
    });
});

let text = '';

function getCurrentText() {
    return text;
}


let previousText = '';

function updateText(newText) {

    console.log(previousText)
    console.log(newText)

    if (newText !== previousText) {
        previousText = newText;
        text = newText;
        saveTextToAirtable(newText);
        io.emit('updatedText', newText);
    }
}


function saveTextToAirtable(updatedText) {
    const currentTime = new Date().toLocaleString('en-US');


    const outputTime = new Date(currentTime).toLocaleString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
    base(table).update(recordId, {
        content: updatedText,
        LastSaved: currentTime,
    }, (err, record) => {
        if (err) {
            console.error('Error updating record in Airtable:', err);
            io.emit('saveStatus', 'Save failed');
        } else {
            console.log('Text saved to Airtable:', updatedText);
            io.emit('saveStatus', `Last saved: ${outputTime}`);
        }
    });
}

app.use('/', routes)

// Render sitemap.xml in XML format
app.get('/sitemap.xml', (_, res) => {
    res.set({
        'Content-Type': 'application/xml'
    });
    res.render('sitemap.xml');
});


app.get('/search', (req, res) => {
    console.log(req.query['searchterm'])
    const query = req.query['searchterm'] || ''
    const resultsPerPage = 10
    let currentPage = parseInt(req.query.page, 10)
    const results = pageIndex.search(query)
    console.log('Results: ' + results)
    console.log('Query: ' + query)

    const maxPage = Math.ceil(results.length / resultsPerPage)
    if (!Number.isInteger(currentPage)) {
        currentPage = 1
    } else if (currentPage > maxPage || currentPage < 1) {
        currentPage = 1
    }

    const startingIndex = resultsPerPage * (currentPage - 1)
    const endingIndex = startingIndex + resultsPerPage

    res.render('search.html', {
        currentPage,
        maxPage,
        query,
        results: results.slice(startingIndex, endingIndex),
        resultsLen: results.length,
    })
})

if (config.env !== 'development') {
    setTimeout(() => {
        pageIndex.init()
    }, 2000)
}


app.get('/change-user/:id', (req, res) => {

    var type = req.params.id

    if (type === 'admin') {
        req.session.data['role'] = 'admin'
        req.session.data['s_username'] = 'Mike Dunn'
        return res.redirect('/admin/dashboard')
    }

    if (type === 'team') {
        req.session.data['role'] = 'team'
        req.session.data['s_username'] = 'Kerry Lyons'
        return res.redirect('/team/dashboard')
    }

    if (type === 'panel') {
        req.session.data['role'] = 'panel'
        req.session.data['s_username'] = 'Andy Jones'
        return res.redirect('/panel/dashboard')
    }

    if (type === 'combined') {
        req.session.data['role'] = 'combined'
        req.session.data['s_username'] = 'Adam Dumbell'
        return res.redirect('/combined/dashboard')
    }

})


app.post('/submit-feedback', (req, res) => {
    const feedback = req.body.feedback_form_input
    const fullUrl = req.headers.referer || 'Unknown'

    //Send to notify after validation with recaptcha first
    //TODO: Implement recaptcha

    notify
        .sendEmail(process.env.feedbackTemplateID, 'design.ops@education.gov.uk', {
            personalisation: {
                feedback: feedback,
                page: fullUrl,
            },
        })
        .then((response) => {})
        .catch((err) => console.log(err))

    return res.sendStatus(200)
})

app.get('/design-system/dfe-frontend', function(req, res, next) {
    const packageName = 'dfe-frontend-alpha'
    let version = '-'

    axios
        .get(`https://registry.npmjs.org/${packageName}`)
        .then((response) => {
            const version = response.data['dist-tags'].latest
            const lastUpdatedv = new Date(response.data.time.modified).toISOString()

            res.render('design-system/dfe-frontend/index.html', {
                version,
                lastUpdatedv,
            })
        })
        .catch((error) => {
            console.error(error)
        })
})

app.get('/design-system/dfe-frontend/sass-documentation', function(
    req,
    res,
    next,
) {
    const packageName = 'dfe-frontend-alpha'
    let version = '-'

    axios
        .get(`https://registry.npmjs.org/${packageName}`)
        .then((response) => {
            const version = response.data['dist-tags'].latest
            const lastUpdatedv = new Date(response.data.time.modified).toISOString()

            res.render('design-system/dfe-frontend/sass-documentation/index.html', {
                version,
                lastUpdatedv,
            })
        })
        .catch((error) => {
            console.error(error)
        })
})

app.get(/\.html?$/i, function(req, res) {
    var path = req.path
    var parts = path.split('.')
    parts.pop()
    path = parts.join('.')
    res.redirect(path)
})

app.get(/^([^.]+)$/, function(req, res, next) {
    matchRoutes(req, res, next)
})

// Handle 404 errors
app.use(function(req, res, next) {
    res.status(404).render('error.html')
})

// Handle 500 errors
app.use(function(err, req, res, next) {
    console.error(err.stack)
    res.status(500).render('error.html')
})

// Try to match a request to a template, for example a request for /test
// would look for /app/views/test.html
// and /app/views/test/index.html

function renderPath(path, res, next) {
    // Try to render the path
    res.render(path, function(error, html) {
        if (!error) {
            // Success - send the response
            res.set({
                'Content-type': 'text/html; charset=utf-8'
            })
            res.end(html)
            return
        }
        if (!error.message.startsWith('template not found')) {
            // We got an error other than template not found - call next with the error
            next(error)
            return
        }
        if (!path.endsWith('/index')) {
            // Maybe it's a folder - try to render [path]/index.html
            renderPath(path + '/index', res, next)
            return
        }
        // We got template not found both times - call next to trigger the 404 page
        next()
    })
}

matchRoutes = function(req, res, next) {
    var path = req.path

    // Remove the first slash, render won't work with it
    path = path.substr(1)

    // If it's blank, render the root index
    if (path === '') {
        path = 'index'
    }

    renderPath(path, res, next)
}

// Start the server

// // Run application on configured port
// if (config.env === 'development') {
//   app.listen(config.port - 50, () => {
//   });
// } else {
//   app.listen(config.port);
// }




function mdFilter(value, stripPara) {
    var result;
    stripPara = stripPara !== false;
    try {
        result = marked(value).trim();
        if (stripPara) {
            result = result.replace(/^<p>|<\/p>$/g, '');
        }

        return result;
    } catch (e) {
        console.error('Error processing markdown:', e);
        return value;
    }
}