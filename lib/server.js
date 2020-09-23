const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const StringDecoder = require("string_decoder").StringDecoder;

const config = require("./config.js");

const handlers = require("./handlers");
const helpers = require("./helpers");
var path = require("path");

// @TODO delete testing data
// helpers.sendTwilioSms(
//   "9496935332",
//   "Hey baby , are you ready! from Manoj",
//   function (err) {
//     console.log("this was the error " + err);
//   }
// );

var server = {};

//console.log(config);
server.httpServer = http.createServer(function (req, res) {
  server.commonServer(req, res);
});

server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname + "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname + "/../https/cert.pem")),
};
server.httpsServer = https.createServer(server.httpsServerOptions, function (
  req,
  res
) {
  server.commonServer(req, res);
});

server.commonServer = function (req, res) {
  //get url
  const parsedUrl = url.parse(req.url, true);
  // get the pathname from url
  const path = parsedUrl.pathname;
  // trim using regex /'s
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");
  //get query stringd from url
  const queryStringObject = parsedUrl.query;
  //get the method to for api
  const method = req.method.toLocaleLowerCase();
  // get usual headers
  const headers = req.headers;
  // use decoder to obtain the payload
  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  //server listening for req
  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();
    var chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    var data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseToObject(buffer),
    };

    chosenHandler(data, function (statuscode, payload) {
      statusCode = typeof statuscode == "number" ? statuscode : 200;

      payload = typeof payload == "object" ? payload : {};

      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(JSON.stringify(payload));
    });
  });
};

var router = {
  users: handlers.users,
  token: handlers.token,
  checks: handlers.checks,
};
// Init script
server.init = function () {
  // Start the HTTP server
  server.httpServer.listen(config.httpPort, function () {
    console.log("The HTTP server is running on port " + config.httpPort);
  });

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, function () {
    console.log("The HTTPS server is running on port " + config.httpsPort);
  });
};

module.exports = server;
