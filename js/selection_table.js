/*global YUI */
YUI.add("selection_table",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      selectionTable;

   selectionTable = function(containerID, options) {
     var table,
         css,
         settings;

     settings = GEP.util.mergeSettings(options, {
       eventPrefix: "selection_table",
       summary: "selection table",
       css: {
         selectRow: "selectRow",
         highlightRow: "highlightRow"
       }
     });

     css = settings.css;

     table = new Y.DataTable(settings);

     table.allModels = new Y.ModelList({ items: table.data });

     table.getModelById = function(id) {
       return table.allModels.getById(id);
     };

     table.addAttr("selectedRow", { value: null });


     table.delegate('click', function (e) {
       this.set("selectedRow", e.currentTarget);
     }, '.yui3-datatable-data tr', table);


     table.delegate('hover', function (e) {
       e.currentTarget.addClass(css.highlightRow);
     }, function (e) {
       e.currentTarget.removeClass(css.highlightRow);
     }, '.yui3-datatable-data tr', table);


     table.after('selectedRowChange', function(e) {
       var tr = e.newVal,
           last_tr = e.prevVal,
           rec = this.getRecord(tr);

       if (last_tr) {
         last_tr.removeClass(css.selectRow);
       }

       tr.addClass(css.selectRow);

       Y.fire(settings.eventPrefix + ":selectedRow", {
         node: tr,
         record: rec
       });
     });

     table.render("#" + containerID);

     return table;
   };

  GEP.selectionTable = selectionTable;
}, '0.0.1', {
  requires: ['gep', 'datatable', "event-hover"]
});
