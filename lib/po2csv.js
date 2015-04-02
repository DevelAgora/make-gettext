/*
Modified po-csv library to make it work from make-gettext

The MIT License (MIT)
Copyright © 2015 Marek Augustynowicz <marek.aug@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
var PO = require('pofile');
var csv = require('fast-csv');
var fs = require('fs');

if (! global.Promise)
{
    global.Promise = require('promise');
}

function throwUp (e)
{
    console.error(e.stack);
}

function not (fn)
{
    return function () {
        return ! fn.apply(this, arguments);
    };
}

function loadPoFile (poFilePath)
{
    return new Promise(function (resolve, reject) {
        PO.load(poFilePath, function (error, poData) {
            if (error)
            {
                throw error;
            }
            poData.nplurals = (
                    ( poData.headers['Plural-Forms'] || '' )
                    .match(/nplurals\s*=\s*([0-9])/) || [,1]
                )[1];
            resolve(poData);
        });
    });
}

function loadCsvFile (csvFilePath)
{
    var csvData = [];
    return new Promise(function (resolve, reject) {
        csv.fromPath(
            csvFilePath,
            {
                headers: true
            }
        )
            .on('data', function (row) {
                csvData.push(row);
            })
            .on('end', function () {
                resolve(csvData);
            });
    });
}


function transformPoToCsv (poData)
{
    return new Promise(function (resolve, reject) {
        csv.writeToString(
            poData.items,
            {
                headers: true,
                transform: transformPoItemToCsvRow.bind(null, poData.nplurals)
            },
            function (err, data) {
                if (err)
                {
                    reject(err);
                }
                else
                {
                    resolve(data);
                }
            }
        );
    });
}

function transformCsvToPo (csvData)
{
    return Promise.resolve(csvData.map(transformCsvRowToPoItem));
}

function transformPoItemToCsvRow (nplurals, item)
{
    var row;

    row = [
        [ 'msgid',             item.msgid ],
        [ 'msgid_plural',      item.msgid_plural ],
        [ 'flags',             Object.keys(item.flags).join(', ') ],
        [ 'references',        item.references ],
        [ 'extractedComments', item.extractedComments.join('\n') ],
        [ 'comments',          item.comments.join('\n') ]
            ].concat(
                // Rest of the columns are msgstr[idx]
                item.msgstr
                // Fill up with '' to nplurals length
                .concat(new Array (nplurals - item.msgstr.length).join('.').split('.'))
                .map(function (str, idx) {
                    return ['msgstr[' + idx + ']', str];
                })
            );
    return row;
}

function transformCsvRowToPoItem (row)
{
    var i;
    var item = new PO.Item();
    var plural = false;

    item.msgid             = row.msgid             || item.msgid;
    item.msgid_plural      = row.msgid_plural      || item.msgid_plural;
    item.references        = row.references.split('\n')        || item.references;
    item.extractedComments = row.extractedComments.split('\n') || item.extractedComments;
    row.flags.split('\n').forEach(function (flag) {
        item.flags[flag] = true;
    });

    for (i = 0 ; 'msgstr[' + i + ']' in row ; i += 1)
    {
        item.msgstr[i] = row['msgstr[' + i + ']'];
        if (i && item.msgstr[i])
        {
            plural = true;
        }
    }
    if (! plural)
    {
        item.msgstr = [ item.msgstr[0] ];
    }

    return item;
}

function writeCsvOutput (data)
{
    console.log(data);
}


function mergeIntoPo (datas)
{
    var target = datas.shift();
    var targetItemsByMsgId = {};
    target.items.forEach(function (item) {
        targetItemsByMsgId[item.msgid] = item;
    });

    datas.forEach(function (itemsToMerge) {
        itemsToMerge.forEach(function (item) {
            var targetItem = targetItemsByMsgId[item.msgid];
            if (! targetItem)
            {
                throw Error('Item “' + item.msgid + '” does not exist in target PO file.');
            }
            if (targetItem.msgid_plural !== item.msgid_plural)
            {
                throw Error('msgid_plural mismatch for “' + msgid + '”');
            }
            targetItem.msgstr = item.msgstr;
            targetItem.flags  = item.flags;
        });
    });

    return Promise.resolve(target);
}

function writePoOutput (poData)
{
    try
    {
    console.log('' + poData);
    }
    catch (e) { throw e; }
}

function printHelp ()
{
    console.log('' + fs.readFileSync(__dirname + '/README.md'));
}

function printPoAsCsv (poFilePath)
{
    loadPoFile(poFilePath)
        .then(transformPoToCsv)
        .then(writeCsvOutput)
        .catch(throwUp);
}

function mergeCsvIn (poFilePath, csvFilePath)
{
    Promise.all([
        loadPoFile(poFilePath),
        loadCsvFile(csvFilePath)
            .then(transformCsvToPo)
    ])
        .then(mergeIntoPo)
        .then(writePoOutput)
        .catch(throwUp);
}


/** MAKE-GETTEXT Modifications ***/
/*
if (3 === process.argv.length)
{
    printPoAsCsv(process.argv[2]);
}
else if (4 === process.argv.length)
{
    mergeCsvIn(process.argv[2], process.argv[3]);
}
else
{
    printHelp();
}*/
function saveCsvOutput (data, csvOutput, callback) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(csvOutput, data, function (err, written, string) {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}

module.exports = {
    createCSVFileFromPo: function (poFilePath, csvOutput, callback) {
        loadPoFile(poFilePath)
            .then(transformPoToCsv)
            .then(function(data) {
                return saveCsvOutput(data, csvOutput, callback);
            })
            .then(callback)
            .catch(throwUp);
    }
}
