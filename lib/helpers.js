const crypto = require("crypto");
const config = require("./config");
var querystring = require("querystring");
var https = require("https");
const helpers = {};

helpers.parseToObject = function (str) {
  //  console.log(str)
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};
helpers.hash = function (str) {
  if (typeof str == "string" && str.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};
helpers.createRandomString = function (strlength) {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strlength) {
    var possibleCharacter = "abcdefghijklmopqrstuvwxyz0123456789";
    var str = "";
    for (let i = 1; i <= strlength; i++) {
      var randonString = possibleCharacter.charAt(
        Math.floor(Math.random() * possibleCharacter.length)
      );
      str += randonString;
    }
    return str;
  } else {
    return false;
  }
};
helpers.sendTwilioSms = function (phone, msg, callback) {
  phone =
    typeof phone == "string" && phone.trim().length == 10
      ? phone.trim()
      : false;
  msg =
    typeof msg == "string" && msg.trim().length > 0 && msg.trim().length <= 1600
      ? msg.trim()
      : false;

  if (phone && msg) {
    //Configure the request payload

    var payload = {
      From: config.twilio.fromPhone,
      To: "+91" + phone,
      Body: msg,
    };
    var stringPayload = querystring.stringify(payload);
    //console.log(Buffer.byteLength(stringPayload));
    var requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path:
        "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload),
      },
    };
    var req = https.request(requestDetails, function (res) {
      var status = res.statusCode;

      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback("Status code returned was " + status);
      }
    });
    req.on("error", function (e) {
      callback(e);
    });
    req.write(stringPayload);

    req.end();
  } else {
    callback("Given parameters were missing or invalid");
  }
};

module.exports = helpers;
