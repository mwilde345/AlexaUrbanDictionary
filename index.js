"use strict";
const Alexa = require('alexa-sdk');
const request = require('request');
const reqprom = require('request-promise');
const APP_ID = 'amzn1.ask.skill.eab4fd25-9eeb-479f-a80c-bf0f2e0ee2ef';
var API_URL = 'http://api.urbandictionary.com/v0/define?term=';

var HELP_MESSAGE = "You can ask me to define a word. Say, define YOLO. Or say, what are amazeballs.";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "YOLO! Goodbye!";

exports.handler = (event, context) => {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  // To enable string internationalization (i18n) features, set a resources object.
  //alexa.dynamoDBTableName = 'Facts';
  //alexa.resources = languageStrings;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

const handlers = {
  'SayHello': function () {
    this.emit(':tell', 'ASaah Dude!');
  },
  'GetDefinition': function () {
    var that = this;
    var context = this.context;
    var session = this.event.session;
    var intent = this.event.request.intent;
    if (!isValidSlot(intent)) {
      this.emit(':ask', "I didn't understand that word.", "Ask me to define a word.");
    }
    var field = intent.slots.WORD.value;

    getDefinition(field, function (definition) {
      var speechOutput = "Definition: " + definition;
      that.emit(':ask', speechOutput, "Give me another word!");
    });
    //callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true));
  },
  'LaunchRequest': function () {
    this.emit(':ask', "Welcome to Urban Dictionary. You can say: what does DudeBro mean. You can also say define baller.",
      "Give me a word to define.");
  },
  'AMAZON.HelpIntent': function () {
    var speechOutput = HELP_MESSAGE;
    var reprompt = HELP_REPROMPT;
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', 'canceled');
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', STOP_MESSAGE);
  },
  'SessionEndedRequest': function () {
    console.log('session ended!');
    this.emit(':tell', STOP_MESSAGE);
  }
};

function getDefinition(field, callback) {
  var options = {
    url: API_URL + encodeURIComponent(field)
  }
  console.log(options.url);
  setTimeout(() => {
    reqprom(options)
      .then((body) => {
          var reply = JSON.parse(body);
          if(reply.result_type!='exact'){
            callback("I turned up empty handed, try another word.");
          }
          var def = reply.list[0].definition;
          if (def.length > 0) {
            callback(def);
          } else {
            callback("ERROR");
          }
        },
        (error) => {
          callback("Sorry I failed to contact the server.");
        });
  }, 200);
};

function isValidSlot(intent) {
  var validSlot = intent && intent.slots && intent.slots.WORD &&
    intent.slots.WORD.value;
  return validSlot;
};