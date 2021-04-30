const Bot = require("../public/javascripts/bot.js");
const express = require('express');
const router = express.Router();
const accountSid =  process.env.ACCOUNT_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilio = require('twilio')(accountSid, twilioToken);

let users = {};


router.post('/twilio', function(req, res, next) {
    const message = req.body.Body;
    const from = req.body.From
    const to = req.body.To
    if(!(from in users)){
        users[from] = new Bot(from, to, sendTwilioMessage);
    }
    users[from].receivedMessage(message).then((resolve) => res.status(resolve).end());
});

router.post('/apiwha', function(req, res, next) {
    const message = req.body.Body;
    const from = req.body.From
    const to = req.body.To
    if(!(from in users)){
        users[from] = new Bot(from, to, sendApiWhaMessage);
    }
    users[from].receivedMessage(message).then((resolve) => res.status(resolve).end());
});

const sendTwilioMessage = (message, from, to) => {
    twilio.messages
    .create({
    body: message,
    from: to,
    to: from
    })
    .catch(err => console.log(err))
    .done();
}

const sendApiWhaMessage = (message, from, to) => {
    twilio.messages
    .create({
    body: message,
    from: to,
    to: from
    })
    .then(message => console.log(message.sid))
    .catch(err => console.log(err))
    .done();
}

module.exports = router;
