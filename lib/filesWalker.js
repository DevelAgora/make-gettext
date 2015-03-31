

var fs = require('fs'),
    path = require('path'),
    po2json = require('po2json'),
    walk = require('walk'), 
    _ = require('underscore');

module.exports = function (options, callback) {

  this.filesByExtension = {};
  this.fileNames = null;

  if (options.directory) 
    var walker = walk.walk(options.directory, { followLinks: false });

  var fileNames = [];
  
  var extensions = options.extensions.map(function(ext) {
    return ext.replace(/\./g, '\\.');
  }).join('|');
  var nameRegex = new RegExp('(' + extensions + ')$');
  var cwd = process.cwd() + path.sep;

  var that = this;
  walker.on('file', function(root, stats, next) {

    var fullFileName = path.join(root, stats.name);
    if (excludeFile(fullFileName, options.exclude)) {
      return next();
    }

    var fileName = fullFileName.replace(cwd, '');

    var extension = fileName.match(nameRegex);
    if (!extension || !extension[0]) return next();
    saveFileByExtension( that.filesByExtension, extension[0], fileName );
    fileNames.push(fileName);
    next();
  });

  walker.on('end', function() {
    this.fileNames = fileNames;
    callback(fileNames);
  });
}

function saveFileByExtension(filesByExtension, extension, fileName) {
  if (!filesByExtension[extension])
    filesByExtension[extension] = [];
  filesByExtension[extension].push(fileName);
}

function excludeFile (fileName, excludeDirs) {
  if(excludeDirs.length > 0) {
    var isExcludeDir = false;
    excludeDirs.forEach(function (dir) {
      if(fileName.indexOf(dir) != -1) {
        isExcludeDir = true;
        return false;
      };
    });
    if (isExcludeDir) {
      return true;
    }
  }
  return false;
}
