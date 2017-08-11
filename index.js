"use strict";
const Alexa = require('alexa-sdk');
const request = require('request');
const reqprom = require('request-promise');
const APP_ID = 'amzn1.ask.skill.ef0670dd-6332-44d3-8393-0913e4793ecf';
var parsedUrls = ["www.sciencedaily.com"];//add more urls once a parser is built for them

var HELP_MESSAGE = "You can ask me what's new in a Field of Study, like Math, or you can say exit.";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "Stay Relevant! Goodbye!";

var ALL_MAJORS = getMajors();

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
    'SayHello': function (){
        this.emit(':tell','ASaah Dude!');
    },
    'RelevantInfoIntent': function(){
      var that = this;
      var context = this.context;
      var session = this.event.session;
      var callback = function (sessionAttributes, speechletResponse) {
          context.succeed(buildResponse(sessionAttributes, speechletResponse));
      }
      
      var intent = this.event.request.intent;
      if(!isValidSlot(intent)){
        this.emit(':ask', "I didn't understand that Field of Study.", "Ask me about a Field of Study.");
      }
      var field = intent.slots.FIELDOFSTUDY.value;

      getTop5(field, function(urlArray){
        if(urlArray.length==0){
          that.emit(':tell',"I am sorry, the API key is no longer valid. Please ask the developer to update it.")
        }
        console.log(urlArray[0]);
        var found = false;
        for(var i in urlArray){
          for(var j in parsedUrls){
            if(urlArray[i].url.includes(parsedUrls[j])){
              found = true;
              getArticle(urlArray[i].url,function(articleTitle){
                  var speechOutput = "Here is an article. "+articleTitle;

                  that.emit(':tell',speechOutput);
              });
              //callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true));

            }else{
              continue;
            }
          }
        }
        if(!found){
          var speechOutput = "I found a website to look at. "+urlArray[0].name;
          that.emit(':tell',speechOutput);
          //callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true));
        }
      });
    },
    'LaunchRequest': function () {
        this.emit(':ask',"Welcome to Relevant Student. You can say: what's new in Engineering. You can also simply say a Field of Study.",
          "Give me a Field of Study to get relevant info.");
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

function isValidSlot(intent){
  var validSlot = intent && intent.slots && intent.slots.FIELDOFSTUDY &&
    intent.slots.FIELDOFSTUDY.value;
  return validSlot;
}

function getTop5(major, callback){
  var query = major.replace(" ","%20")+"%20News";
  var urlArray = [];
  var apiKey = "f23a214625264589a181459a3904fbae";
  var options = {
    url : "https://api.cognitive.microsoft.com/bing/v5.0/search?q="+query,
    headers:{
      'Ocp-Apim-Subscription-Key':apiKey,
      'textDecorations':false
    }
  }
  console.log("about to request");
  setTimeout(()=>{
    reqprom(options)
    .then((body) => {
      console.log('running');
      var info = JSON.parse(body);
      for(var i in [0,1,2,3,4]){
        var searchResult = info.webPages.value[i];
        console.log(searchResult.name);
        urlArray.push({url: searchResult.url, name: searchResult.name});
      }
      if(urlArray.length==0){
        urlArray = [{url:"",name:"blank"}];
      }
      callback(urlArray);
    },
    (error) => {
      return [];
    });
  }, 200);
}

function getArticle(url, callback){
  var baseurl = url.includes("www.sciencedaily.com") ? "sciencedaily" : null; //do checks for future urls that we parse and add to the list
  url = decodeURIComponent(url.match(/www.sciencedaily.com.*(?=&p.*)/)[0]);
  switch(baseurl){
    case "sciencedaily":
      //request the url, run jquery on it and get the first article. Or list of 5 articles
      url = "http://"+url.replace("www","rss").replace("news/","").replace(/\/$/,".xml");
      var feedparser = new FeedParser({feedurl: url});
      var req = request(url);

      req.on('response', function (res) {
        var stream = this; // `this` is `req`, which is a stream

        if (res.statusCode !== 200) {
          this.emit('error', new Error('Bad status code'));
        }
        else {
          stream.pipe(feedparser);
        }
      });

      feedparser.on('error', function (error) {
        // always handle errors
        var stream = this;
        this.emit('error', new Error('Error parsing response'));
      });

      feedparser.on('readable', function () {
        // This is where the action is!
        var stream = this; // `this` is `feedparser`, which is a stream
        var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
        var item;
        var counter = 0;
        var articleArray = [];
        while(item = stream.read()){
          articleArray.push({url: item.link, title: item.title});
        }
        var articleTitle = articleArray[0].title;
        //or if random() then get random articleTitle
        //or if next() then get the next one?
        callback(articleTitle);
      });
      break;
    /*case "url2":
      break;
    case "url3":
      break;
    case "url4":
      break;
    case "url5":
      break;*/
    default:
      return "try again";
      break;
  }
}

function getJSON(callback){
    var body = ''
    var reply= 'nothin'
    var apiKey = '4ac0ec9992af4a078cc87bd6fd651741';
    request.get(url(), function(error, response, body){
      reply = JSON.parse(body).articles[0].title;
      if(reply.length>0){
        callback(reply);
      }else{
        callback("ERROR");
      }
    });
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

}

// ------- Skill specific logic -------

function getWelcomeResponse(callback) {
    var speechOutput = "Welcome! Do you want to hear about some facts?"

    var reprompt = "Do you want to hear about some facts?"

    var header = "Get Info"

    var shouldEndSession = false

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    }

    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))

}

// ------- Helper functions to build responses for Alexa -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function getMajors(){
  return ["Accounting","Advertising","African American Studies","Agriculture","Animal Science","Anthropology",
"Aerospace Engineering","Archaeology","Architecture","Art History","Arts Management","Asian American Studies",
"Astronomy and Astrophysics","Bilingual Education","Crosscultural Education","Athletic Training","Biochemistry",
"Biology","Biomedical Engineering","Business","Chemical Engineering","Chemistry","Civil Engineering","Classical Studies",
"Communication Disorders Sciences and Services","Communications","Comparative Literature","Computer Engineering",
"Computer Information Systems","Computer Science","Construction Services","Cosmetology Services","Creative Writing",
"Criminology","Culinary Arts","Design","Economics","Education","Electrical Engineering","Elementary Education",
"Engineering","English Language and Literature","Entomology","Environmental Engineering","Film and Video Production",
"Film Video Arts","Finance","Fine Arts","Fire Safety Science","Food Science","Foreign Languages","Forestry",
"Gender Studies","Genetics","Geology","Graphic Design","Health Sciences","History","Hospitality Management",
"Human Ecology","Industrial Technology","International Business","International Relations","Journalism","Kinesiology",
"Latin American Studies","Liberal Studies","Library Science","Linguistics","Logistics Management","Marketing","Mathematics",
"Mechanical Engineering","Medical Technology","Metallurgical Engineering","Meteorology","Microbiology",
"Military Technology","Mining and Mineral Engineering","Music","Mythology and Folklore",
"Naval Architecture and Marine Engineering","Neuroscience","Nuclear Engineering","Nursing","Oceanography",
"Occupational Health and Safety","Parks","Recreation and Leisure Studies","Performing Arts","Petroleum Engineering",
"Pharmacology","Philosophy","Photography","Physics","Physiology","Plant Science","Political Science","Pre Law",
"Psychology","Public Administration","Puppetry","Religious Studies","Rhetoric","Social Work","Sociology",
"Software Engineering","Special Education","Sports Medicine","Statistics","Student Counseling","Supply Chain Management",
"Theater Arts","Viticulture","Zoology","Business Administration","Liberal Arts","Registered Nursing","General Studies",
"Medical Assistant","Cosmetology","Licensed Practical Nurse","Criminal Justice","Nursing Assistant","English","Law",
"Speech Communication and Rhetoric","Auto Mechanic","Advertising and Marketing","Welding","Law and Justice Administration",
"Early Childhood Education","Educational Leadership and Administration","Emergency Medical Technician","Paramedic",
"Kinesiology And Exercise Science","Math","Dental Assistant","Accounting Technology","Healthcare Administration",
"Bus and Truck Driver","Massage Therapy","Information Technology","Social Science","Curriculum and Instruction","Medicine",
"Heating and Air Conditioning","Human Services","Esthetician","Human Resources","Pharmacy","Paralegal","Pharmacy Technician",
"Computer Networking","Information Science","Public Health","Electrician","Medical Executive Assistant",
"Administrative Medical Secretary","Sports Management and Fitness Administration","Medical Insurance Coding Specialist",
"Guidance Counselor","Administrative Assistant","Fine Arts and Studio Arts","Information Systems","Physical Therapy",
"Medical Insurance Specialist and Medical Biller","Counseling Psychologist",
"Health Information and Medical Records Technology","Secondary Education","Drama and Theatre Arts","Physical Education",
"Diesel Mechanic","Medical Office Assistant","Spanish Language and Literature","Human Development and Family Studies",
"Nail Technician","Veterinary Assistant","Fire Science","Surgical Technologist","Dental Hygienist","Family Practice Nurse",
"Cinematography And Film","Phlebotomy","Physician Assistant","Baking And Pastry","Respiratory Therapy",
"Audiology and Speech Pathology","Industrial Engineering","Physical Therapist Assistant","Behavioral Science",
"Organizational Leadership","Occupational Therapy","Environmental Science","Ministry","International and Global Studies",
"Reading Teacher & Literacy Specialist","Auto Body","Computer Programming","Drafting and Design Technology",
"Nursing Administration","Theology","Radiation Therapy","Logistics and Supply Chain Management","Geography","Web Design",
"Interior Design","Substance Abuse and Addiction Counseling","Dentistry","Biomedical Science",
"System Networking and LAN/WAN Manager","Public Relations","Management Science","Fashion Merchandising",
"Corrections Officer","Design and Visual Communications","Entrepreneurship","Teaching English as a Second Language",
"Office Management and Supervision","Mental Health Counseling","Hospital and Healthcare Facility Management","Osteopathy",
"Recording Arts Technology","Clinical Psychology","Aircraft Mechanic","Diagnostic Medical Sonography and Sonographer",
"Industrial Mechanics & Maintenance Technology","Occupational Therapy Assistant","Fire Prevention and Safety Technology",
"Operations Management","Medical Office Management","Organizational Behavior Studies","Commercial and Advertising Art",
"Public Policy","Dietetics","Machine Tool Technology and Machinist","Child Development","Nursing Science",
"Clinical and Medical Laboratory Technician","Animation","Fashion Design","Engineering Management","Child Care",
"Digital Communication and Multimedia","Junior High & Middle School Teaching","Financial Planning",
"Hotel and Hospitality Management","Parks and Recreation Management","Carpentry","Exercise Physiology",
"Higher Education Administration","Clinical Laboratory Science and Medical Technology","Aviation","Rhetoric and Composition",
"Systems Engineering","Marriage and Family Therapy","Manufacturing Engineering Technician",
"Community Organization and Advocacy","Real Estate","Computer Installation and Repair Technician","Machine Shop Technology",
"Urban Planning","Computer Support Specialist","Cellular and Molecular Biology","Project Management","Forensic Science",
"Nutrition","Materials Engineering","Biotechnology","Executive Assistant","School Psychology"].map(function(x){
    return x.toUpperCase();
  });
}
