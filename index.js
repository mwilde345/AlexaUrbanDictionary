"use strict";
const Alexa = require('alexa-sdk');
const request = require('request');
const reqprom = require('request-promise');
var badwordsarray = require('badwords/array');
const APP_ID = 'amzn1.ask.skill.eab4fd25-9eeb-479f-a80c-bf0f2e0ee2ef';
const Speech = require('ssml-builder');
var API_URL = 'http://api.urbandictionary.com/v0/define?term=';
var API_URL_RANDOM = 'http://api.urbandictionary.com/v0/random';

var HELP_MESSAGE = "You can ask me to define a word. Say, define YOLO. Or say, what are amazeballs.";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "YOLO! Goodbye!";
var speech = new Speech();
//var filter = new Filter();
//filter.addWords(expletives);

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
  'GetRandom': function(){
    var that = this;
    var context = this.context;
    var session = this.event.session;
    var intent = this.event.request.intent;

    getRandom(function (field, definition) {
      var speechOutput = field + ", Definition: " + definition;
      sanitize(speechOutput);
      speech.pause('1s').say("Next word please!");
      console.log(speech.ssml(true))
      that.emit(':ask', speech.ssml(true), "Give me another word!");
      speech = new Speech();
    });
  },
  'GetDefinition': function () {
    //speech = new Speech();
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
      sanitize(speechOutput);
      speech.pause('1s').say("Give me another word!");
      console.log(speech.ssml(true))
      that.emit(':ask', speech.ssml(true), "Next word please!");
      speech = new Speech();
    });
    //callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true));
  },
  'LaunchRequest': function () {
    this.emit(':ask', "Welcome to Urban Dictionary. You can say: what does DudeBro mean. You can also say: new random word.",
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

function sanitize(input){
  var inputArray = input.split(" ");
  var re = /[\W]/;
  for(var index in inputArray){
    var word = inputArray[index];
    if(expletives.indexOf(word.toLowerCase().replace(re,""))!=-1 || 
        badwordsarray.indexOf(word.toLowerCase().replace(re,""))!=-1){
      speech.sayAs({
        word: word,
        interpret: "expletive"
      });
    }else{
      speech.say(word)
    }
  }
}

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
            callback("I turned up empty handed.");
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

function getRandom(callback){
  var options = {
    url: API_URL_RANDOM
  }  
  setTimeout(() => {
    reqprom(options)
      .then((body) => {
          var reply = JSON.parse(body);
          var def = reply.list[0].definition;
          var field = reply.list[0].word;
          if (def.length > 0) {
            callback(field,def);
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

const expletives = ["amcik","arse","arsehole","arserape","arsewipe","ass","asses",
"asshole","assholes","assramer","assrape","atouche","ayir","b17ch","b1tch","bastard",
"beastial","beastiality","beastility","benchod","bestial","bestiality","bi7ch","bitch",
"bitcher","bitchers","bitches","bitchin","bitching","bloody","blowjob","blowjobs","boiolas",
"bollock","bollocks","boob","boobs","bugger","bullshit","butfuck","buttfuck","buttfucker",
"buttmonkey","c0ck","cabron","cawk","cazzo","chink","chraa","chuj","cipa","clamjouster",
"clit","clits","cock","cocking","cocks","cockslap","cockslapped","cockslapping","cocksuck",
"cocksucked","cocksucker","cocksucking","cocksucks","crap","cum","cummer","cumming","cums",
"cumshot","cunilingus","cunillingus","cunnilingus","cunt","cuntalot","cuntfish","cunting",
"cuntlick","cuntlicker","cuntlicking","cuntree","cunts","cyberfuc","cyberfuck",
"cyberfucked","cyberfucker","cyberfuckers","cyberfucking","d4mn","dago","damn",
"damnnation","daygo","dego","dick","dickabout","dickaround","dickhead","dicking",
"dickwad","dickward","dildo","dildos","dink","dinks","dirsa","dirty sanchez","donkey punch",
"dupa","dyke","dziwka","ejaculate","ejaculated","ejaculates","ejaculating","ejaculatings",
"ejaculation","ekrem","ekto","enculer","faen","fag","fagging","faggot","faggs","fagot",
"fagots","fags","fancul","fanny","fart","farted","farting","fartings","farts","farty",
"fatass","fcuk","feces","felatio","fellatio","ficken","fingerfuck","fingerfucked",
"fingerfucker","fingerfuckers","fingerfucking","fingerfucks","fistfuck","fistfucked",
"fistfucker","fistfuckers","fistfucking","fistfuckings","fistfucks","fitta","fitte",
"flange","flikker","fotze","ftq","fuck","fucked","fucker","fuckers","fuckin","fucking",
"fuckings","fuckmaster","fuckme","fucks","fuckwit","fucky","fuk","fuks","futkretzn",
"fux0r","gangbang","gangbanged","gangbangs","gash","gaysex","goddam","goddamn","goolies",
"guiena","h0r","h4x0r","hardcoresex","hell","helvete","hoer","honkey","horniest","horny",
"hotsex","huevon","hui","injun","jack-off","jerk-off","jism","jiz","jizm","kaffir","kawk",
"kike","knobend","knobhead","knobjockey","knulle","kock","kondum","kondums","kraut","kuk",
"kuksuger","kum","kumer","kummer","kumming","kums","kunilingus","Kurac","kurwa","kusi",
"kyrp","lesbian","lesbo","lust","lusting","mamhoon","masturbat","merd","merde","mibun",
"milf","minge","minger","mong","monkleigh","mothafuck","mothafucka","mothafuckas",
"mothafuckaz","mothafucked","mothafucker","mothafuckers","mothafuckin","mothafucking",
"mothafuckings","mothafucks","motherfuck","motherfucked","motherfucker","motherfuckers",
"motherfuckin","motherfucking","motherfuckings","motherfucks","mouliewop","muffdiver",
"muffmuncher","muie","mulkku","mummyporn","munter","muschi","nazis","nepesaurio","niger",
"nigga","niggar","niggars","nigger","niggers","nutsack","ootzak","orgasim","orgasims",
"orgasm","orgasms","orospu","paki","paska","pendejo","penis","penisperse","phonesex",
"phuck","phuk","phuked","phuking","phukked","phukking","phuks","phuq","picka","pierdol",
"pikey","pillu","pimmel","pimpis","pis","pises","pisin","pising","pisof","piss","pissed",
"pisser","pissers","pisses","pissin","pissing","pissoff","pizdapoontsee","porn","porno",
"pornography","pornos","pr0n","preteen","preud","prick","pricks","pula","pule","pusies",
"pusse","pussies","pussy","pussys","pusy","pusys","puta","puto","qaHbeh","queef","queer",
"quim","qweef","rautenbergschaffer","smut","spunk","scheiss","scheisse","schlampe",
"schmuck","scrotum","shag","shagged","sharmuta","sharmute","shemale","shenzi","shiat",
"shipal","shit","shited","shitfull","shithead","shithole","shiting","shitings","shits",
"shitted","shitter","shitters","shitting","shittings","shitty","shity","shiz","shizer",
"skribz","skurwysyn","slag","slut","sluts","smut","snatch","sodding","spacker","spacko",
"spank","spastic","spaz","sphencter","spic","spierdalaj","splooge","spunk","spunking",
"suka","tits","titwank","tosser","turd","twat","twatty","uncunt","wank","wanked","wanker",
"wankered","wankers","wanking","wanky","whore","wog"];