var TestNoGetMessages = function () {

  var translator = {
    i18n: function (text) { return text; }
  };

  return translator.i18n("i18n Translation Function");


}