const fs = require("fs");

const path = require("path");
const helpers = require("./helpers");

const lib = {};
lib.basedir = path.join(__dirname, "/../.data/");

lib.create = function (dir, file, data, callback) {
  //Open file to create
  fs.open(lib.basedir + dir + "/" + file + ".json", "wx", function (
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);

      fs.writeFile(fileDescriptor, stringData, function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback("Error closing file");
            }
          });
        } else {
          callback("Error writing to new File");
        }
      });
    } else {
      console.log(err);
      callback("Could not create a new file, it may already exists");
    }
  });
};

lib.read = function (dir, file, callback) {
  fs.readFile(lib.basedir + dir + "/" + file + ".json", "utf8", function (
    err,
    data
  ) {
    if (!err && data) {
      callback(false, helpers.parseToObject(data));
    } else {
      callback(err, data);
    }
  });
};

lib.update = function (dir, file, data, callback) {
  fs.open(lib.basedir + dir + "/" + file + ".json", "r+", function (
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);
      fs.ftruncate(fileDescriptor, function (err) {
        if (!err) {
          fs.writeFile(fileDescriptor, stringData, function (err) {
            if (!err) {
              fs.close(fileDescriptor, function (err) {
                if (!err) {
                  callback(false);
                } else {
                  callback("Error closing file");
                }
              });
            } else {
              callback("Error writing to existing File");
            }
          });
        } else {
          callback("Error updating file");
        }
      });
    }
  });
};

lib.delete = function (dir, file, callback) {
  fs.unlink(lib.basedir + dir + "/" + file + ".json", function (err) {
    if (!err) {
      callback(false);
    } else {
      callback("Error deleting the file");
    }
  });
};

lib.list = function (dir, callback) {
  fs.readdir(lib.basedir + dir + "/", function (err, data) {
    if (!err && data && data.length > 0) {
      trimmedFileNames = [];
      data.forEach(function (filename) {
        trimmedFileNames.push(filename.replace(".json", ""));
      });
      callback(err, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

module.exports = lib;

//{
//     "firstName": "Mad",
//     "lastName": "Codez",
//     "phone": "1234567890",
//     "password": "ItsmyPassword",
//     "tosAgreement": true
// }
