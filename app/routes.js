const express = require('express')
const router = express.Router()


var admin_controller = require('./controllers/adminController.js')
var generic_controller = require('./controllers/genericController.js')
var panel_controller = require('./controllers/panelController.js')
var team_controller = require('./controllers/teamController.js')
var book_controller = require('./controllers/bookController.js')
var report_controller = require('./controllers/reportController.js')
var survey_controller = require('./controllers/surveyController.js')

const checkUser = (req, res, next) => {

    console.log('ROLE: ' + req.session.data['role'])

    if (req.originalUrl === '/change-user/admin') {
        next();
    } else if (req.originalUrl === '/change-user/team') {
        next();
    } else if (req.originalUrl === '/change-user/panel') {
        next();
    } else if (req.originalUrl === '/change-user/combined') {
        next();
    }
    else {
        if (req.session.data['role'] !== undefined) {
            next();
        } else {
            res.render('setuser')
        }
    }


};


router.use(checkUser);

router.get("/", function(req, res){
res.redirect("/change-user/admin")
})


router.get("/generic/assessments", generic_controller.g_assessors_needed);
router.get("/generic/volunteer/:id/:role", generic_controller.g_volunteer);

router.get("/admin/reporting/assessors-needed", admin_controller.g_assessors_needed);
router.get("/admin/reporting/assessor-activity", admin_controller.g_assessor_activity);
router.get("/admin/reporting/send-assessor-request", admin_controller.g_send_volunteer_email);
router.get("/admin/reporting/send-assessor-request-complete", admin_controller.g_send_volunteer_email_done);

router.post("/admin/reporting/send-assessor-request", admin_controller.p_send_volunteer_email);


router.get("/admin/reporting/missing-code", admin_controller.g_code_needed);


router.get("/admin/analysis", admin_controller.g_analysis);

router.get("/admin/dashboard", admin_controller.g_dashboard);
router.get("/admin/assessors", admin_controller.g_assessors);

router.get("/admin/assessor/:id", admin_controller.g_assessor);
router.get("/admin/entries/all", admin_controller.g_all_requests);
router.get("/admin/entry/:id", admin_controller.g_get_request);
router.get("/admin/history/:id", admin_controller.g_get_history);
router.get("/admin/admin/:id", admin_controller.g_get_admin);
router.get("/admin/report/:id", admin_controller.g_report);
router.get("/admin/report/outcome/:id", admin_controller.g_report_outcome);
router.get("/admin/report/done-well/:id", admin_controller.g_report_donewell);
router.get("/admin/report/improve/:id", admin_controller.g_report_improve);
router.get("/admin/report/preview/:id", admin_controller.g_report_preview);
router.get("/admin/report/report-submitted-to-sat/:id", admin_controller.g_report_sat1);
router.get("/admin/report/report-submitted-to-team/:id", admin_controller.g_report_team);
router.get("/admin/report/report-ready-to-publish/:id", admin_controller.g_report_publish);
router.get("/admin/report/complete/:id", admin_controller.g_report_complete);



router.get("/admin/:view/:id/:entry", admin_controller.g_extended_entry);
router.get("/admin/submission/:id", admin_controller.g_submission);
router.get("/admin/alpha/:id", admin_controller.g_alpha_report);
router.get("/admin/:action/:id", admin_controller.g_action);

router.post("/admin/submission/:id", admin_controller.p_submission);
router.post("/admin/:view/:id/:entry", admin_controller.p_entry_post);
router.post("/admin/:action/:id", admin_controller.p_action);




router.post("/generic/volunteer/:id/:role", generic_controller.p_volunteer);


/// Panel ///

router.get("/panel/dashboard", panel_controller.g_dashboard);
router.get("/panel/report", panel_controller.g_report);
router.get("/panel/entry/:id", panel_controller.g_get_request);
router.get("/panel/history/:id", panel_controller.g_get_history);
router.get("/panel/panel/:id", panel_controller.g_get_panel);
router.get("/panel/report/:id", panel_controller.g_report);
router.get("/panel/report/outcome/:id", panel_controller.g_report_outcome);
router.get("/panel/report/done-well/:id", panel_controller.g_report_donewell);
router.get("/panel/report/improve/:id", panel_controller.g_report_improve);
router.get("/panel/report/preview/:id", panel_controller.g_report_preview);
router.get("/panel/report/report-submitted-to-sat/:id", panel_controller.g_report_sat1);
router.get("/panel/report/report-submitted-to-team/:id", panel_controller.g_report_team);
router.get("/panel/report/report-ready-to-publish/:id", panel_controller.g_report_publish);
router.get("/panel/report/complete/:id", panel_controller.g_report_complete);



router.get("/panel/:view/:id/:entry", panel_controller.g_extended_entry);
router.get("/panel/submission/:id", panel_controller.g_submission);
router.get("/panel/alpha/:id", panel_controller.g_alpha_report);
router.get("/panel/:action/:id", panel_controller.g_action);

router.post("/panel/submission/:id", panel_controller.p_submission);
router.post("/panel/:view/:id/:entry", panel_controller.p_entry_post);
router.post("/panel/:action/:id", panel_controller.p_action);

/// REPORT routes ///

// Post filter
router.get("/reports/", report_controller.applyFilter);
router.post("/reports/apply-filter", report_controller.applyFilter);
router.get("/report/:id", report_controller.getReport);





/// BOOK routes /// 

router.get("/book", book_controller.get_start);
router.get("/book/draft/:id", book_controller.get_draft);
router.get("/book/request/tasks", book_controller.get_tasks);
router.post("/book/request/tasks", book_controller.post_tasks);
router.get("/book/request/complete", book_controller.get_complete);
router.get("/book/request/delete/:id", book_controller.get_delete)
router.post("/book/request/delete/:id", book_controller.post_delete)

// GET Name of discovery
router.get("/book/request/name-of-discovery/", book_controller.get_name_of_discovery);
// POST Name of discovery
router.post("/book/request/name-of-discovery/", book_controller.post_name_of_discovery);

router.get("/book/setup-from-tracker/:id", book_controller.get_setup_from_disvovery);

// POST Search code
router.get("/book/request/search-code/", book_controller.get_search_code);

router.get("/book/request/check/:id", book_controller.get_request_check);
router.get("/book/request/existing/:id", book_controller.get_request_existing);
router.get("/book/request/create/:id", book_controller.get_request_create);

// GET Summary
router.get("/book/request/summary/", book_controller.get_summary);
// POST Summary
router.post("/book/request/summary/", book_controller.post_summary);

// GET confidential
router.get("/book/request/confidential/", book_controller.get_confidential);
// POST confidential
router.post("/book/request/confidential/", book_controller.post_confidential);


// GET projectcode
router.get("/book/request/project-code/", book_controller.get_projectcode);
// POST projectcode
router.post("/book/request/project-code/", book_controller.post_projectcode);

// GET Start date
router.get("/book/request/start-date/", book_controller.get_start_date);
// POST Start date
router.post("/book/request/start-date/", book_controller.post_start_date);

// GET End date
router.get("/book/request/end-date/", book_controller.get_end_date);
// POST End date
router.post("/book/request/end-date/", book_controller.post_end_date);

// GET Requested weeks
router.get("/book/request/dates/", book_controller.get_dates);
// POST Requested weeks
router.post("/book/request/dates/", book_controller.post_dates);

// GET Portfolio
router.get("/book/request/portfolio/", book_controller.get_portfolio);
// POST Portfolio
router.post("/book/request/portfolio/", book_controller.post_portfolio);

// GET Deputy director
router.get("/book/request/dd/", book_controller.get_dd);
// POST Deputy director
router.post("/book/request/dd/", book_controller.post_dd);

// GET SRO
router.get("/book/request/sro/", book_controller.get_sro);
// POST SRO
router.post("/book/request/sro/", book_controller.post_sro);

// GET SRO
router.get("/book/request/product/", book_controller.get_product);
// POST SRO
router.post("/book/request/product/", book_controller.post_product);

// GET SRO
router.get("/book/request/delivery/", book_controller.get_delivery);
// POST SRO
router.post("/book/request/delivery/", book_controller.post_delivery);



// Team
router.get("/team/dashboard", team_controller.g_dashboard);
router.get("/team/team/:id", team_controller.g_get_team);
router.get("/team/artefacts/:id", team_controller.g_get_artefacts);
router.get("/team/submission/:id", team_controller.g_get_submission);
router.get("/team/entry/:id", team_controller.g_get_request);

router.get("/team/report/:id", team_controller.g_report);
router.get("/team/report/outcome/:id", team_controller.g_report_outcome);
router.get("/team/report/done-well/:id", team_controller.g_report_donewell);
router.get("/team/report/improve/:id", team_controller.g_report_improve);
router.get("/team/report/preview/:id", team_controller.g_report_preview);
router.get("/team/report/report-submitted-to-sat/:id", team_controller.g_report_sat1);
router.get("/team/report/report-submitted-to-team/:id", team_controller.g_report_team);
router.get("/team/report/report-ready-to-publish/:id", team_controller.g_report_publish);
router.get("/team/report/complete/:id", team_controller.g_report_complete);

router.post("/team/submission/:id", team_controller.p_submission);
router.post("/team/:view/:id/:entry", team_controller.p_entry_post);
router.post("/team/:action/:id", team_controller.p_action);

router.get("/team/:view/:id/:entry", team_controller.g_extended_entry);
router.get("/team/:action/:id", team_controller.g_action);


// Survey

router.get('/survey/submitted', survey_controller.get_submitted);
router.post('/survey/submit/:id', survey_controller.post_submit_survey);
router.get('/survey/submit/:id', survey_controller.get_survey_submit);

router.get('/survey/:id', survey_controller.get_start);


router.get('/survey/:id/q:q', survey_controller.get_question);
router.post('/survey/:id/q:q', survey_controller.post_question);



module.exports = router