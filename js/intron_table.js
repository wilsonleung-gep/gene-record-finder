/*global YUI */
YUI.add("intron_table",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      intronTable;

   intronTable = function(containerID, options) {
     var table,
         settings,
         cachedModels = {};

     settings = GEP.util.mergeSettings(options, {
       data: [],
       columns: [
         { key: "transcriptname", label: "Transcript Name" },
         { key: "FBid", label: "FlyBase ID" },
         { key: "splicedonor", label: "Splice Donor" },
         { key: "spliceacceptor", label: "Splice Acceptor" }
       ],
       summary: "Non-canonical introns",
       keyType: "transcriptname"
     });

     table = new Y.DataTable(settings);
     table.render("#" + containerID);

     table.allModels = new Y.ModelList({ items: table.data });

     function filterModels(key) {
       var selectedIntrons = [];

       table.allModels.each(function(intron) {
         if (intron.get(settings.keyType) === key) {
           selectedIntrons.push(intron);
         }
       });

       cachedModels[key] = selectedIntrons;

       return selectedIntrons;
     }

     Y.on('mRNA_table:selectedRow', function(selectedRecord) {
       var selectedmRNA = selectedRecord.record,
           key = selectedmRNA.get("FBname"),
           selectedModels = cachedModels[key] || filterModels(key);

       table.set('data', selectedModels);
     });

     return table;
   };

  GEP.intronTable = intronTable;
}, '0.0.1', {
  requires: ['gep', 'datatable']
});
