/*global YUI */
YUI.add("unique_proteins_table",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      uniqueProteinsTable;

   uniqueProteinsTable = function(containerID, options) {
     var container,
         hasIdenticalProteins = false,
         isoformRowMapping = {},
         formatter = GEP.columnFormatter,
         previousTr,
         css,
         uniqueInfo,
         tableSource,
         tableTpl,
         settings;

     settings = GEP.util.mergeSettings(options, {
       mrnas: [],
       tableSuffix: "-table",
       hiddenCSS: "hidden",
       tplSource: "uniqueProteins-template",
       idPrefix: "uniqueProtein-item",
       css: {
         selectRow: "selectRow"
       }
     });

     container = Y.byID(containerID);
     css = settings.css;

     tableSource = Y.byID(settings.tplSource).getHTML();
     tableTpl = Y.Handlebars.compile(tableSource);

     function addProteinCdsInfo(mrna, uniqueProteins) {
       var uidKey = mrna.cdsIDs.join(";"),
           protein = formatter.mRNAToProteinName(mrna.FBname),
           recordID = settings.idPrefix + "-" + protein,
           recordKey = uniqueProteins.uid[uidKey],
           record;

       if (recordKey === undefined) {
         uniqueProteins.add({ id: recordID, name: protein, isoformList: [] });
         uniqueProteins.uid[uidKey] = recordID;
         recordKey = recordID;

       } else {
         record = uniqueProteins.get(recordKey);

         if (record === undefined) {
           throw new ReferenceError("Invalid record key: " + recordKey);
         }

         record.isoformList.push(protein);
         hasIdenticalProteins = true;
       }

         isoformRowMapping[mrna.id] = recordKey;
     }

     function groupProteinsByCDS(mrnas) {
       var uniqueProteins = GEP.orderedMap(),
           i;

       uniqueProteins.uid = {};

       for (i=0; i<mrnas.length; i+=1) {
         addProteinCdsInfo(mrnas[i], uniqueProteins);
       }

       delete uniqueProteins.uid;

       return hasIdenticalProteins ? uniqueProteins : null;
     }

     function buildProteinTableData(uniqueInfo) {
       return uniqueInfo.map(function(item) {
         item.isoformList = item.isoformList.join(", ");
         return item;
       });
     }

     function buildProteinTable(proteinsInfo) {
       var tableData = buildProteinTableData(proteinsInfo),
           table = tableTpl({
             id: containerID + settings.tableSuffix,
             items: tableData
           });

       container.append(table);
     }

     uniqueInfo = groupProteinsByCDS(settings.mrnas.items);
     if (uniqueInfo === null) {
       return null;
     }

     buildProteinTable(uniqueInfo);

     Y.on("mRNA_table:selectedRow", function(selectedRecord) {
       var key = selectedRecord.record.get("id"),
           tr = Y.byID(isoformRowMapping[key]);

       if (previousTr) {
         previousTr.removeClass(css.selectRow);
       }

       tr.addClass(css.selectRow);

       previousTr = tr;
     });

     container.removeClass(settings.hiddenCSS);

     return container;
   };

  GEP.uniqueProteinsTable = uniqueProteinsTable;
}, '0.0.1', {
  requires: ['gep', 'ordered_map', 'column_formatter', 'handlebars']
});
