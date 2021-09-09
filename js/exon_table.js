/*global YUI */
YUI.add("exon_table",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      exonTable;

   exonTable = function(containerID, options) {
     var table,
         cachedModels = {},
         formatter = GEP.columnFormatter,
         fetchProperty = GEP.util.fetchProperty,
         settings;

     settings = GEP.util.mergeSettings(options, {
       eventPrefix: "exon_table",
       infoType: "exonIDs",
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
         { key: "featureLength", label: "Size (bp)", sortable: true }
       ],
       recordType: {
         "FBid": {},
         "chr": {},
         "fivePrimeStart": {},
         "threePrimeEnd": {},
         "strand": {},
         "featureLength": {
           getter: function() {
             return this.get("end") - this.get("start") + 1;
           },
           readOnly: true
         }
       },
       summary: "exons location",
       summarizeRecord: function(m) {
         return { name: m.get("FBname"), sequence: m.get("sequence") };
       }
     });

     if (! settings.getCollectionInfo) {
       settings.getCollectionInfo = function(models) {
         var collection = [];

         models.each(function(m) {
           collection.push(settings.summarizeRecord(m));
         });

         return collection;
       };
     }

     table = new GEP.selectionTable(containerID, settings);

     function filterModels(record) {
       var idMap = settings.idMap,
           key = fetchProperty(record, settings.keyType),
           featureIDs = fetchProperty(record, settings.infoType),
           numFeatures = featureIDs.length,
           selectedModels = new Y.ModelList(),
           itemIndex,
           i;

       for (i=0; i<numFeatures; i+=1) {
         itemIndex = idMap[featureIDs[i]];
         selectedModels.add(table.allModels.item(itemIndex));
       }

       cachedModels[key] = selectedModels;

       return selectedModels;
     }

     function fetchExonModels(record) {
       var key = fetchProperty(record, settings.keyType);

       return cachedModels[key] || filterModels(record);
     }

     Y.on('mRNA_table:selectedRow', function(selectedRecord) {
       var selectedModels = fetchExonModels(selectedRecord.record);
       table.set('data', selectedModels);
     });

     Y.on(settings.eventPrefix + ':selectedRow', function(exonInfo) {
       var selectedExon = exonInfo.record;

       Y.fire('sequence_panel:show', {
         node: exonInfo.node,
         details: settings.summarizeRecord(selectedExon)
       });
     });


     Y.on('usage_table:selectColumn', function(idInfo) {
       if (idInfo.type !== settings.infoType) {
         return;
       }

       var selectedExon = table.allModels.getById(idInfo.id);
       if (! selectedExon) {
         return;
       }

       Y.fire('sequence_panel:show', {
         details: settings.summarizeRecord(selectedExon)
       });
     });

     Y.on(settings.eventPrefix + ":showAll", function() {
       Y.fire('sequence_panel:show', {
         collection: settings.getCollectionInfo(table.allModels)
       });
     });

     Y.on(settings.eventPrefix + ":showSelected", function() {
       Y.fire('sequence_panel:show', {
         collection: settings.getCollectionInfo(table.get("data"))
       });
     });

     return table;
   };

  GEP.exonTable = exonTable;
}, '0.0.1', {
  requires: ['gep', 'selection_table', "column_formatter"]
});
