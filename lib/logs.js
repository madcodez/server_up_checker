var fs = require("fs");
var zlib = require("zlib");
const path = require("path");

var lib = {};
lib.baseDir = path.join(__dirname, "/../.logs/");

lib.append = function (file, data, callback) {
  fs.open(lib.baseDir + file + ".log", "a", function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      fs.appendFile(fileDescriptor, data + "\n", function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback("Error closing the file");
            }
          });
        } else {
          callback("Error appending a file");
        }
      });
    } else {
      callback("Could not open the file for appending");
    }
  });
};

lib.list = function (shouldCompress, callback) {
  fs.readdir(lib.baseDir, function (err, data) {
    if (!err) {
      var trimmedLogFiles = [];
      data.forEach(function (fileName) {
        if (fileName.indexOf(".log") > -1 && shouldCompress) {
          trimmedLogFiles.push(fileName.replace(".log", ""));
        }
        if (fileName.indexOf(".gz.b64") > -1) {
          trimmedLogFiles.push(fileName.replace(".gz.b64", ""));
        }
      });
      callback(false, trimmedLogFiles);
    } else {
      callback(err, data);
    }
  });
};

lib.compress = function (srcFileName, destFileName, callback) {
  var srcFile = srcFileName + ".log";
  var destFile = destFileName + ".gz.b64";

  fs.readFile(lib.baseDir + srcFile, "utf8", function (err, inputString) {
    if (!err && inputString) {
      zlib.gzip(inputString, function (err, buffer) {
        if (!err && buffer) {
          fs.open(lib.baseDir + destFile, "wx", function (err, fileDescriptor) {
            if (!err && fileDescriptor) {
              fs.writeFile(fileDescriptor, buffer.toString("base64"), function (
                err
              ) {
                if (!err) {
                  fs.close(fileDescriptor, function (err) {
                    if (!err) {
                      callback(false);
                    } else {
                      callback(err);
                    }
                  });
                } else {
                  callback(err);
                }
              });
            } else {
              callback(err);
            }
          });
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

lib.truncate = function (srcFileName, callback) {
  var srcFile = srcFileName + ".log";

  fs.truncate(lib.baseDir + srcFile, 0, function (err) {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};
module.exports = lib;
