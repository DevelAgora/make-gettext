/*************************
The MIT License (MIT)

Copyright (c) 2015 Patricia Sara Juarez Muñoz (@ccsakuweb)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
***************************/

var config = {
  extensions: ['js', 'html'],
  outputdir: '.',
  exclude: [],
  keyword: [],
  onSuccess: null
};

TranslateWithGettext = function (options) {
  var that = this;

  var po2json = require('po2json'),
      fs = require('fs'),
      Q = require('q'),
      exec = require('child_process').exec,
      FilesWalker = require('./lib/filesWalker'),
      _ = require('underscore');


  options = _.extend({}, config, options);

  debugger;

  if (!options.locale) {
    console.log("The option locale is required to start the translation.");
    return;
  }

  if (options.exclude)
    options.exclude.forEach(function (dir, i) {
      options.exclude[i] = dir.replace('/', '\\'); 
    });

  if (options.outputdir  != '.')
    options.outputdir = './' + options.outputdir;

  Q.all([
      promiseValidateOutputDir(options.outputdir), 
      promiseCreateFilesWalker(this)
    ])
    .then(buildGettext);

  function promiseValidateOutputDir (outputdir) {
    var deferred = Q.defer();
    validateOutputDir(outputdir, function () {
      deferred.resolve();
    });
    return deferred.promise;
  }

  function promiseCreateFilesWalker () {
    var deferred = Q.defer();
    that.filesWalker = new FilesWalker(options, function () {
      deferred.resolve();
    });
    return deferred.promise;
  }
  
  function buildGettext () {
    var potFilePath = options.outputdir + '/' + options.locale + '.pot';

    removePOTFile(potFilePath, function () {

      buildPOTFiles(that.filesWalker.filesByExtension, potFilePath, function () {

        var poFilePath = options.outputdir + '/' + options.locale + '.po';
        mergePOFile( poFilePath, potFilePath, function () {

          if (options['no-obsolete']) 
            editPOFile('--no-obsolete', function () {});

          if (!options['keep-pot'])
            removePOTFile(potFilePath);
          
          console.log("The make gettext messages task succeded.");

          if (options.onSuccess)
            options.onSuccess();
        });

      });
    });
  }

  function buildPOTFiles (filesByExtension, potFilePath, onSuccess, index) {
    var index = index || 0

    var extensions = Object.keys(filesByExtension);

    if (!extensions.length) {
      console.log("There are not files to gettext.");
      return;
    }

    var extension = extensions[index],
        fileNames = filesByExtension[extension],
        joinWithExistingPot = index>0;

    xgettext(potFilePath, options.directory, options.keyword, extension, fileNames, joinWithExistingPot, function () {

      if (index == extensions.length - 1)
        onSuccess();
      else
        buildPOTFiles(filesByExtension, potFilePath, onSuccess, index+1);

    });  
  }

  function xgettext (potFilePath, directory, keywords, extension, fileNames, join, onSuccess) {
    debugger;
    var language = extension == 'js' ? 'JavaScript' : 'Python',
        opts = ' --force-po --from-code=UTF-8 --language=' + language;

    if (join)
      opts += ' -j';

    //TODO: If html it would be great to create a temporal html file to convert to gettext. This way we could have interesting functionality
    //      like a block to translate like Django.
    if (directory) 
      opts += ' -d ' + directory;

    opts += ' -o ' + potFilePath;

    keywords.forEach(function (keyword) {
      opts += ' --keyword=' + keyword;
    });

    opts += ' ' + fileNames.join(' ');

    executeCommand('xgettext ' + opts, 
      function () {
        onSuccess();  
      }, 
      function (error) {
        console.log('xgettext failed. Please confirm you have installed correctly GNU Gettext');
      }
    );        
  }

  function mergePOFile (poFilePath, potFilePath, onSuccess) {
    fs.open(poFilePath, 'r', function (error) {      
      if (error !== null) {
        //The PO File does not exist so it is not necessary to merge
        exec('cp ' + potFilePath + ' ' + poFilePath);  
      }
      else {      
        //Merge the existing PO with the new POT
        var opts = ' -q -U --no-fuzzy-matching --previous ' + poFilePath + ' ' + potFilePath; 
        executeCommand('msgmerge ' + opts, onSuccess, function (error) {
          console.log('msgmerge failed. Please confirm you have installed correctly GNU Gettext');
        });
      }
    });
  }

  function editPOFile (opts, onSuccess, outputPath, inputPath) {
    var opts = opts || '';
    outputPath = outputPath || poFilePath;
    inputPath = inputPath || poFilePath;    
    opts += ' -o ' + outputPath; 

    executeCommand ('msgattrib ' + opts + ' ' + inputPath, onSuccess, onSuccess); 
  }

  function removePOTFile (potFilePath, onSuccess) {
      exec('rm -f ' + potFilePath, function () {
        if(onSuccess)
          onSuccess();
      });
  }

  function executeCommand (command, onSuccess, onError) {

    exec(command, function (error, stdout, stderr) {
      if (error !== null) {
        console.log(command.split(' ')[0] + ' error: ' + error);
        if (onError)
          onError( error );
      }
      else {
        if (onSuccess)
          onSuccess();
      }
    }); 

  }

  function validateOutputDir (outputdir, onSuccess, index) {
    var index = index || 0;
    var paths = outputdir.split('/');
    
    fs.readdir(paths.slice(0,index+1).join('\\'), function(error, files) {
      if(error !== null) {
        //No existe el directorio que se ha intentado abrir
        fs.mkdirSync(paths.slice(0,index+1).join('\\'));
      }
      if(index < paths.length - 1)
        validateOutputDir(outputdir, onSuccess, index+1)
      else 
        onSuccess();
    });
  }
}

module.exports = TranslateWithGettext;

