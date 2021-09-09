/*global YUI */
YUI.add("gene_table",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      geneTable;

   geneTable = function(containerID, options) {
     var table,
         formatter = GEP.columnFormatter,
         settings;

     settings = GEP.util.mergeSettings(options, {
       data: [],
       columns: [
         { key: "FBid", label: "FlyBase ID",
           formatter: formatter.flyBaseRecordLink, allowHTML: true },
         { key: "FBname", label: "FlyBase Name" },
         { key: "chr", label: "Chr" },
         { key: "fivePrimeStart", label: "5' Start",
           formatter: formatter.coordinates },
         { key: "threePrimeEnd", label: "3' End",
           formatter: formatter.coordinates },
         { key: "strand", label: "Strand" },
         { key: "FBid", label: "Graphical Viewer",
           formatter: formatter.gbrowseLink, allowHTML: true }
       ],
       summary: "Gene location"
     });

     table = new Y.DataTable(settings);
     table.render("#" + containerID);

     return table;
   };

  GEP.geneTable = geneTable;
}, '0.0.1', {
  requires: ['gep', 'datatable', "column_formatter"]
});
