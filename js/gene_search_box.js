/*global YUI */
YUI.add("gene_search_box",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      searchBox;

  searchBox = function(containerID, options) {
    var settings,
        container = Y.byID(containerID),
        template,
        searchForm;

    function initializeTemplate() {
      var source = Y.byID(settings.acListtemplate).getHTML();

      return Y.Handlebars.compile(source);
    }

    /*jslint unparam: true*/
    function geneInfoFormatter(query, response) {
      var results = response || [];

      template = template || initializeTemplate();

      return Y.Array.map(results, function (result) {
        return template(result.raw);
      });
    }
    /*jslint unparam: false*/

    settings = GEP.util.mergeSettings(options, {
      acListtemplate: "geneInfo-list-template",
      acConfig: {
        resultHighlighter: "phraseMatch",
        resultListLocator: "results",
        resultTextLocator: "FBname",
        resultFormatter: geneInfoFormatter,
        source: "services/quickgenelookup.php?q={query}&db=" +
          Y.byID("db").get("value")
      },
      formID: "searchform"
    });

    searchForm = Y.byID(settings.formID);

    container.plug(Y.Plugin.AutoComplete, settings.acConfig);

    container.ac.after("select", function(itemNode) {
      if ((itemNode.result === undefined) || (itemNode.result === "")) {
        return;
      }

      searchForm.submit();
    });

    return container;
  };

  GEP.geneSearchBox = searchBox;

}, '0.0.1', {
  requires: [
  "array-extras",
  "handlebars",
  "autocomplete",
  "autocomplete-highlighters",
  "gep"]
});
