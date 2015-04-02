
var optAsList = function (val) { return val.split(','); };
var opts = require("commander")
  .version(require('../package.json').version)
  .usage('[options]')
  .option('-l, --locale <file>', 'write locale/s to translate', optAsList)  
  .option('-d, --directory <path>', 'directory to search for gettext text to add the pot file')
  .option('-x, --exclude [excludes]', 'directories to avoid in the search for gettext text to add the pot file', optAsList)
  .option('-p, --outputdir <path>', 'output files will be placed in directory <path>')
  .option('-k, --keyword [keywords]', 'additional keywords to be looked for', optAsList)
  .option('-e, --extension [extensions]', 'extensions files to apply gettext', optAsList)
  .option('--no-obsolete', 'removes obsolete translated and untranslated messages from the final po file')
  .option('--to-translate-po', 'generates an additional po file to translate with fuzzy and empty messages') 
  .option('--to-translate-csv', 'generates an additional csv file to translate with fuzzy and empty messages') 
  .option('--to-json', 'export the final po to json')  
  .option('--to-csv', 'export the final po to csv')    
  .option('--keep-pot', 'keep pot files after the build')
  .parse(process.argv);


var Translator = require('../index');

opts.locale.forEach(function(locale) {
  var translateL = new Translator(extend(
    opts,
    {
      locale: locale
    }));
});

function extend () {
  if (!arguments.length)
    return;
  var e = arguments[0];
  for (var i=0, len=arguments.length; i<len; i++) {
    var o = arguments[i];
    for (var key in arguments[i]) e[key] = o[key];
  }
  return e;
}