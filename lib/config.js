const enviornment = {};

enviornment.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashSecret: "qweertyuiiad",
  maxChecks: 5,
  twilio: {
    fromPhone: "+12513193693",
    accountSid: "AC9ee1c345019f872958bc77d0526dd50d",
    authToken: "2991e6fb290d97bd25389cfc63c744f3",
  },
};
enviornment.production = {
  httpport: 5000,
  httpsport: 5001,
  envName: "production",
  hashAlsoSecret: "qweertyuii",
  maxChecks: 5,
};

var currentEnviornment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLocaleLowerCase()
    : "staging";

var enviornmentExport =
  typeof enviornment[currentEnviornment] == "object"
    ? enviornment[currentEnviornment]
    : "";

module.exports = enviornmentExport;
