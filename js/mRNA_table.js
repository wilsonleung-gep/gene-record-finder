/*global YUI */
YUI.add("mRNA_table",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      mRNATable;

   mRNATable = function(containerID, options) {
     var table,
         formatter = GEP.columnFormatter,
         settings;

     settings = GEP.util.mergeSettings(options, {
       eventPrefix: "mRNA_table",
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
         { key: "proteinID", label: "Protein ID",
           formatter: formatter.flyBaseRecordLink, allowHTML: true },
         { key: "FBid", label: "Graphical Viewer",
           formatter: formatter.gbrowseLink, allowHTML: true }
       ],
       summary: "mRNA location"
     });

     table = new GEP.selectionTable(containerID, settings);

     Y.on("usage_table:selectLabel", function(record) {
       var selectedRecord = table.getRecord(record.id);

       table.set("selectedRow", table.getRow(selectedRecord));
     });


     return table;
   };

  GEP.mRNATable = mRNATable;
}, '0.0.1', {
  requires: ['gep', 'selection_table', "column_formatter"]
});
