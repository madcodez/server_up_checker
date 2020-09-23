const helpers = require("./helpers");
const _data = require("./data");
const config = require("./config");
var handlers = {};

handlers.users = function (data, callback) {
  var methods = ["get", "post", "put", "delete"];

  if (methods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405, "Internal Error");
  }
};
//Container for users submethods
handlers._users = {};

handlers._users.post = function (data, callback) {
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read("users", phone, function (err) {
      if (err) {
        const hashpassword = helpers.hash(password);

        if (hashpassword) {
          const userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            password: hashpassword,
            tosAgreement: tosAgreement,
          };

          _data.create("users", phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not create the user's. " });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password." });
        }
      } else {
        callback(400, {
          Error: "A user with that phone number already exists",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

handlers._users.get = function (data, callback) {
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    var token =
      typeof data.headers.token == "string" &&
      data.headers.token.trim().length == 20
        ? data.headers.token.trim()
        : false;
    console.log(token);
    handlers._token.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read("users", phone, function (err, data) {
          if (!err && data) {
            delete data.password;
            callback(200, data);
          } else {
            callback(500, { Error: "Could not find the user." });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid.",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

handlers._users.put = function (data, callback) {
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  //console.log(data)

  if (phone) {
    var token =
      typeof data.headers.token == "string" &&
      data.headers.token.trim().length == 20
        ? data.headers.token.trim()
        : false;
    handlers._token.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read("users", phone, function (err, user) {
          if (!err && user) {
            if (firstName) {
              user.firstName = firstName;
            }
            if (lastName) {
              user.lastName = lastName;
            }
            if (password) {
              const hashpassword = helpers.hash(password);
              user.password = hashpassword;
            }
            //#TODO verify token
            _data.update("users", phone, user, function (err) {
              if (!err) {
                callback(200);
              } else {
                callback(500, { Error: "Could not update the user." });
              }
            });
          } else {
            callback(400, { Error: "Specified user does not exist." });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid.",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

handlers._users.delete = function (data, callback) {
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    var token =
      typeof data.headers.token == "string" &&
      data.headers.token.trim().length == 20
        ? data.headers.token.trim()
        : false;
    handlers._token.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read("users", phone, function (err, data) {
          if (!err && data) {
            _data.delete("users", phone, function (err) {
              if (!err) {
                callback(200, data);
              } else {
                callback(500, { Error: "Could not delete the user" });
              }
            });
          } else {
            callback(500, { Error: "Could not find the user." });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid.",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

handlers.token = {};

handlers.token = function (data, callback) {
  var methods = ["get", "post", "put", "delete"];

  if (methods.indexOf(data.method) > -1) {
    handlers._token[data.method](data, callback);
  } else {
    callback(405, "Internal Error");
  }
};

handlers._token = {};
//payload - phone : '' , password : ''
handlers._token.post = function (data, callback) {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    _data.read("users", phone, function (err, userdata) {
      if (!err && userdata) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword === userdata.password) {
          const tokenObject = {};
          tokenObject.id = helpers.createRandomString(20);
          tokenObject.expires = Date.now() + 1000 * 60 * 60;
          tokenObject.phone = phone;
          _data.create("token", tokenObject.id, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create the new token" });
            }
          });
        } else {
          callback(400, {
            Error:
              "Password did not match the specified user's stored password",
          });
        }
      } else {
        callback(400, { Error: "Cound not find the specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing reqired field" });
  }
};
//payload -id : ''

handlers._token.get = function (data, callback) {
  var id =
    typeof (data.queryStringObject.id == "string") &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("token", id, function (err, tokendata) {
      if (!err && tokendata) {
        callback(200, tokendata);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field, or field invalid" });
  }
};
//payload - extent : true , id : ''

handlers._token.put = function (data, callback) {
  var extend =
    typeof data.payload.extend == "boolean" ? data.payload.extend : false;
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  console.log(id, extend);
  if (id && extend) {
    _data.read("token", id, function (err, tokendata) {
      if (!err && tokendata) {
        if (tokendata.expires < Date.now()) {
          tokendata.expires = Date.now() + 1000 * 60 * 60;

          _data.update("token", id, tokendata, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not update the token's expiration",
              });
            }
          });
        } else {
          callback(400, {
            Error: "The token has already expired, and cannot be extended.",
          });
        }
      } else {
        callback(400, { Error: "Could not find the user" });
      }
    });
  } else {
    callback(400, { Error: "Missing feilds required" });
  }
};

handlers._token.delete = function (data, callback) {
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    _data.read("token", id, function (err, tokendata) {
      if (!err && tokendata) {
        _data.delete("token", id, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the token" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the token" });
      }
    });
  } else {
    callback(400, { Error: "Missing field required" });
  }
};

handlers._token.verifyToken = function (id, phone, callback) {
  _data.read("token", id, function (err, tokendata) {
    if (!err && tokendata) {
      if (tokendata.phone == phone && tokendata.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

handlers.checks = {};

handlers.checks = function (data, callback) {
  const methods = ["get", "post", "put", "delete"];

  if (methods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._checks = {};

handlers._checks.post = function (data, callback) {
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var method =
    typeof data.payload.method == "string" &&
    data.payload.method &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds < 5 &&
    data.payload.timeoutSeconds >= 1
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && successCodes && method && timeoutSeconds) {
    var token =
      typeof data.headers.token == "string" &&
      data.headers.token.trim().length == 20
        ? data.headers.token.trim()
        : false;

    _data.read("token", token, function (err, tokendata) {
      if (!err && tokendata) {
        console.log(tokendata);
        handlers._token.verifyToken(tokendata.id, tokendata.phone, function (
          tokenIsValid
        ) {
          if (tokenIsValid) {
            _data.read("users", tokendata.phone, function (err, userData) {
              if (!err && userData) {
                var userChecks =
                  typeof userData.checks == "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];

                if (userChecks.length < config.maxChecks) {
                  var checkId = helpers.createRandomString(20);

                  var checkObject = {
                    id: checkId,
                    userPhone: userData.phone,
                    protocol: protocol,
                    url: url,
                    method: method,
                    successCodes: successCodes,
                    timeoutSeconds: timeoutSeconds,
                  };
                  _data.create("checks", checkId, checkObject, function (err) {
                    if (!err) {
                      userData.checks = userChecks;
                      userData.checks.push(checkId);

                      _data.update(
                        "users",
                        tokendata.phone,
                        userData,
                        function (err) {
                          if (!err) {
                            callback(200);
                          } else {
                            callback(500, {
                              Error:
                                "Could not update the user with the new check.",
                            });
                          }
                        }
                      );
                    } else {
                      callback(500, {
                        Error: "Could not create the new check",
                      });
                    }
                  });
                } else {
                  callback(400, {
                    Error:
                      "The user already has the maximum number of checks (" +
                      config.maxChecks +
                      ").",
                  });
                }
              } else {
                callback(500, { Error: "Could not find the user." });
              }
            });
          } else {
            callback(403, {
              Error: "Missing required token in header, or token is invalid.",
            });
          }
        });
      } else {
        callback(400, { Error: "Could not find the token" });
      }
    });
  } else {
    callback(400, { Erorr: "Missing fields required" });
  }
};

handlers._checks.get = function (data, callback) {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("checks", id, function (err, checkdata) {
      if (!err && checkdata) {
        var token =
          typeof data.headers.token == "string" &&
          data.headers.token.trim().length == 20
            ? data.headers.token.trim()
            : false;

        handlers._token.verifyToken(token, checkdata.userPhone, function (
          tokenIsValid
        ) {
          if (tokenIsValid) {
            callback(200, checkdata);
          } else {
            callback(403, {
              Error: "Missing required token in header, or token is invalid.",
            });
          }
        });
      } else {
        callback(500, { Error: "Could not find the checks." });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

handlers._checks.put = function (data, callback) {
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var method =
    typeof data.payload.method == "string" &&
    data.payload.method &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds < 5 &&
    data.payload.timeoutSeconds >= 1
      ? data.payload.timeoutSeconds
      : false;
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  if (id) {
    if (protocol || url || method || successCode || timeoutSeconds) {
      _data.read("checks", id, function (err, checkdata) {
        if (!err && checkdata) {
          if (protocol) {
            checkdata.protocol = protocol;
          }
          if (url) {
            checkdata.url = url;
          }
          if (successCodes) {
            checkdata.successCodes = successCodes;
          }
          if (method) {
            checkdata.method = method;
          }
          if (timeoutSeconds) {
            checkdata.timeoutSeconds = timeoutSeconds;
          }
          var token =
            typeof data.headers.token == "string" &&
            data.headers.token.trim().length == 20
              ? data.headers.token.trim()
              : false;

          handlers._token.verifyToken(token, checkdata.userPhone, function (
            err
          ) {
            if (!err) {
              _data.update("checks", id, checkdata, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update checks" });
                }
              });
            } else {
              callback(403, {
                Error: "Missing required token in header, or token is invalid.",
              });
            }
          });
        } else {
          callback(500, { Error: "Could not find the checks." });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update." });
    }
  } else {
    callback(400, { Error: "Missing required  field" });
  }
};

handlers._checks.delete = function (data, callback) {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("checks", id, function (err, checkdata) {
      if (!err && checkdata) {
        var token =
          typeof data.headers.token == "string" &&
          data.headers.token.trim().length == 20
            ? data.headers.token.trim()
            : false;
        handlers._token.verifyToken(token, checkdata.userPhone, function (
          tokenIsValid
        ) {
          if (tokenIsValid) {
            _data.delete("checks", id, function (err) {
              if (!err) {
                callback(200);
              } else {
                callback(500, { Error: "Could not delete the check" });
              }
            });
          } else {
            callback(403, {
              Error: "Missing required token in header, or token is invalid.",
            });
          }
        });
      } else {
        callback(500, { Error: "Could not find the check." });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

handlers.ping = function (data, callback) {
  callback(200);
};
handlers.notFound = function (data, callback) {
  callback(404);
};
module.exports = handlers;
