var _data = require("./data");
var _log = require("./logs");
var url = require("url");
var https = require("https");
var http = require("http");
const { worker } = require("cluster");
const { SSL_OP_LEGACY_SERVER_CONNECT } = require("constants");
const { log } = require("util");

var workers = {};

workers.gatherAllChecks = function () {
  _data.list("checks", function (err, checks) {
    if (!err && checks && checks.length > 0) {
      checks.forEach(function (check) {
        _data.read("checks", check, function (err, checkData) {
          if (!err) {
            workers.validateCheckData(checkData);
          } else {
            console.log("Error reading one of the check's data: ", err);
          }
        });
      });
    } else {
      console.log("Error: Could not find any checks to process");
    }
  });
};

workers.validateCheckData = function (checkData) {
  var originalCheckData = checkData;
  originalCheckData =
    typeof originalCheckData == "object" && originalCheckData !== null
      ? originalCheckData
      : {};
  originalCheckData.id =
    typeof originalCheckData.id == "string" &&
    originalCheckData.id.trim().length == 20
      ? originalCheckData.id
      : false;
  originalCheckData.userPhone =
    typeof originalCheckData.userPhone == "string" &&
    originalCheckData.userPhone.trim().length == 10
      ? originalCheckData.userPhone
      : false;
  originalCheckData.protocol =
    typeof originalCheckData.protocol == "string" &&
    ["https", "http"].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false;
  originalCheckData.url =
    typeof originalCheckData.url == "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url
      : false;
  originalCheckData.method =
    typeof originalCheckData.method == "string" &&
    ["get", "post", "put", "delete"].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false;
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes == "object" &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false;
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds == "number" &&
    originalCheckData.timeoutSeconds % 1 == 0 &&
    originalCheckData.timeoutSeconds >= 1
      ? originalCheckData.timeoutSeconds
      : false;

  originalCheckData.state =
    typeof originalCheckData.state == "string" &&
    ["up", "down"].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : false;
  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked == "number" &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false;

  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    console.log("Error : one of the checks is not properly formatted");
  }
};

workers.performCheck = function (originalCheckData) {
  var checkResult = {
    error: "",
    responseCode: "",
  };

  var resultSent = false;

  var parsedUrl = url.parse(
    originalCheckData.protocol + "://" + originalCheckData.url,
    true
  );
  var hostName = parsedUrl.hostname;
  var path = parsedUrl.path;

  var moduleProtocol = originalCheckData.protocol == "https" ? https : http;

  var reqDetails = {
    protocol: originalCheckData.protocol + ":",
    hostname: hostName,
    method: originalCheckData.method,
    path: path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };
  var req = moduleProtocol.request(reqDetails, function (res) {
    var statusCode = res.statusCode;

    checkResult.responseCode = statusCode;

    if (!resultSent) {
      workers.processCheckResult(originalCheckData, checkResult);
      resultSent = true;
    }
  });
  req.on("error", function (e) {
    checkResult.error = { error: true, value: e };
    if (!resultSent) {
      workers.processCheckResult(originalCheckData, checkResult);
      resultSent = true;
    }
  });
  req.on("timeout", function (e) {
    checkResult.error = { error: true, value: "timeout" };
    if (!resultSent) {
      workers.processCheckResult(originalCheckData, checkResult);
      resultSent = true;
    }
  });

  req.end();
  //console.log(parsedUrl);
};

workers.processCheckResult = function (originalCheckData, checkResult) {
  var state =
    !checkResult.error &&
    checkResult.responseCode &&
    originalCheckData.successCodes.indexOf(checkResult.responseCode) > -1
      ? "up"
      : "down";

  var alertCheckedData =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false;
  var timeCheck = Date.now();

  workers.log(originalCheckData, alertCheckedData, state, checkResult);
  var newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = timeCheck;

  _data.update("checks", newCheckData.id, newCheckData, function (err) {
    if (!err) {
      if (alertCheckedData) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log("Check outcome has not changed, no alert needed");
      }
    } else {
      console.log("Error trying to save updates to one of the checks");
    }
  });
};
workers.alertUserToStatusChange = function (newCheckData) {
  var msg =
    "Alert: Your check for " +
    newCheckData.method.toUpperCase() +
    " " +
    newCheckData.protocol +
    "://" +
    newCheckData.url +
    " is currently " +
    newCheckData.state;
  helpers.sendTwilioSms(newCheckData.userPhone, msg, function (err) {
    if (!err) {
      console.log(
        "Success: User was alerted to a status change in their check, via sms: ",
        msg
      );
    } else {
      console.log(
        "Error: Could not send sms alert to user who had a state change in their check",
        err
      );
    }
  });
};

workers.log = function (
  originalCheckData,
  alertCheckedData,
  state,
  checkResult,
  timeCheck
) {
  var logData = {
    check: originalCheckData,
    alert: alertCheckedData,
    state: state,
    checkResult: checkResult,
    time: timeCheck,
  };
  var logString = JSON.stringify(logData);

  var logFileName = originalCheckData.id;

  _log.append(logFileName, logString, function (err) {
    if (!err) {
      console.log("Logging to file");
    } else {
      console.log("Logging to file failed");
    }
  });
};

workers.rotateLogs = function () {
  _log.list(true, function (err, logs) {
    if (!err && logs && logs.length > 0) {
      logs.forEach(function (logId) {
        var newFileId = logId + "-" + Date.now();

        _log.compress(logId, newFileId, function (err) {
          if (!err) {
            _log.truncate(logId, function (err) {
              if (!err) {
                console.log("File Trucated");
              } else {
                console.log("Error! File cannot be trucated");
              }
            });
          } else {
            console.log(err);
          }
        });
      });
    } else {
      console.log(err);
    }
  });
};
workers.init = () => {
  workers.gatherAllChecks();

  workers.loop();

  workers.rotateLogs();
};

workers.loop = function () {
  setInterval(function () {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

module.exports = workers;
