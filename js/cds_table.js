/*global YUI */
YUI.add("cds_table",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      cdsTable;

   cdsTable = function(containerID, options) {
     var table,
         formatter = GEP.columnFormatter,
         fetchProperty = GEP.util.fetchProperty,
         settings;

     function calcCdsSize() {
       var bpSize = this.get("end") - this.get("start") + 1,
         inPhaseSize = bpSize - this.get("phase"),
         codonSize = 3.0,
         aaSize = Math.floor(inPhaseSize / codonSize);

       return Math.max(aaSize, 0);
     }

     settings = GEP.util.mergeSettings(options, {
       eventPrefix: "cds_table",

       infoType: "cdsIDs",
       keyType: "FBname",
       idMap: {},
       data: [],
       columns: [
         { key: "FBid", label: "FlyBase ID" },
         { key: "fivePrimeStart", label: "5' Start", sortable: true,
           formatter: formatter.coordinates },
         { key: "threePrimeEnd", label: "3' End", sortable: true,
           formatter: formatter.coordinates },
         { key: "strand", label: "Strand" },
         { key: "phase", label: "Phase" },
         { key: "featureLength", label: "Size (aa)", sortable: true }
       ],
       recordType: {
         "FBid": {},
         "chr": {},
         "fivePrimeStart": {},
         "threePrimeEnd": {},
         "strand": {},
         "featureLength": {
           getter: calcCdsSize,
           readOnly: true
         }
       },
       summary: "CDS location"
     });

     function getSequenceID(selectedExon) {
       var id = fetchProperty(selectedExon, "FBid"),
           prefix = fetchProperty(selectedExon, "FBprefix");

       if (id.indexOf(prefix) === 0) {
         return id;
       }

       return prefix + ":" + id;
     }

     if (! settings.summarizeRecord) {
       settings.summarizeRecord = function(m) {
         return {
           name: getSequenceID(m),
           sequence: fetchProperty(m, "sequence")
         };
       };
     }

     table = GEP.exonTable(containerID, settings);

     table.calcCdsSize = calcCdsSize;

     return table;
   };

  GEP.cdsTable = cdsTable;
}, '0.0.1', {
  requires: ['gep', 'exon_table', "column_formatter"]
});
