
var Translator = require('../index'),
    Q = require('q');


  testPromise(test1)         //With exclusion of directory to search for
  .then(testPromise(test2))  //With no exclusion of directory
  .then(testPromise(test3)); //It find i18n functions also


function testPromise (testFn) {

  var deferred = Q.defer();
  testFn(function () {
    deferred.resolve();
  });
  return deferred.promise;

}

function test1 (callback) {

  var test1 = new Translator({
    locale: 'esTest1',
    directory: 'js',
    outputdir: 'nls',
    exclude: ['js/libs'],
    onSuccess: function () {
      console.log("Test 1 ended.");
      callback();
    }
  });

}

function test2 (callback) {
  var test2NoExclusion = new Translator({
    locale: 'esTest2',
    directory: 'js',
    outputdir: 'nls',
    onSuccess: function () {
      console.log("Test 2 ended.");
      callback();
    }
  });
}

function test3 (callback) {
  var test2NoExclusion = new Translator({
    locale: 'esTest3',
    directory: 'js',
    outputdir: 'nls',
    keyword: ['i18n'],
    onSuccess: function () {
      console.log("Test 3 ended.");
      callback();
    }
  });
}