const authHelper = require("../public/javascripts/authHelper.js")
var express = require('express');
var router = express.Router();


router.get('/', function(req, res) {
    var authCode = req.query.code;
    if (authCode) {
      authHelper.getTokenFromCode(authCode, req, res).then(res.status(200));
    } else {
      // redirect to home
      console.log('/authorize called without a code parameter, redirecting to login');
      res.status(500).end();
    }
});

// FUNCIONES AUXILIARES
function tokenReceived(req, res, error, token, callback) {
    if (error) {
        console.log('ERROR getting token:'  + error);
        res.send('ERROR getting token: ' + error);
    }
    else {
        // save tokens in session
        req.session.token = token;
        req.session.email = authHelper.getEmailFromIdToken(token.token.id_token);
        res.redirect()
        ;
    }
}

module.exports = router
