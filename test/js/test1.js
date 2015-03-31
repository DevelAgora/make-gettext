var TestNoGetMessages = function () {

  var translator = {
    i18n: function (text) { return text; }
  };

  return translator.gettext("gettext Translation Function");


}