# make-gettext - Makemessages with GNU Gettext

[make-gettext Npm package](https://www.npmjs.com/package/make-gettext)

The perfect solution to compile your application with GNU Gettext.

Sometimes applications like PoEdit or EazyPo are not enought to extract all the messages from the source code. And using xgettext is not trivial and needs more than two commands.

This NodeJS Module tries to help you automate gettext tasks for your huge projects. It supports HTML, JavaScript and will support more if you request it.

It is based on makemessages from Django and it allows you also to convert the result to JSON or CSV. 

If you want to send the PO file or CSV to your translators you can add the option --to-translate and it will generate a file with only the messages untranslated and fuzzy.

Also you can use the functions you need, like i18n() or translate(). Just add the keyword option and tell the module what function names has the messages to extract additionally to the defaults gettext functions.

The pot file will be deleted but you can keep it adding the -keep-pot option.

Soon this module will allow you get the messages inside blocks of html templates made with underscore, handlebars...

Have a nice Gettext experience.


## Instalation

    npm install -g make-gettext


## Usage

  As lib: 

    require('make-gettext')

  As command:

    make-gettext -l <locale> [options] 

  Options:

    -h, --help                    output usage information
    -V, --version                 output the version number
    -l, --locale <file>           write locale/s to translate
    -d, --directory <path>        directory to search for gettext text to add the pot file
    -x, --exclude [excludes]      directories to avoid in the search for gettext text to add the pot file
    -p, --outputdir <path>        output files will be placed in directory <path>
    -k, --keyword [keywords]      additional keywords to be looked for
    -e, --extension [extensions]  extensions files to apply gettext
    --no-obsolete                 removes obsolete translated and untranslated messages from the final po file
    --to-translate                generates an additional po file to translate with fuzzy and empty messages
    --to-json                     export the final po to json
    --to-csv                      export the final po to csv
    --keep-pot                     keep pot files after the build

  Example:

    node make-gettext -p lns -l es -d js -x js/libs

## Gettext Documentation
  
  [GNU gettext utilities](https://www.gnu.org/software/gettext/manual/gettext.html)


## License 

MIT