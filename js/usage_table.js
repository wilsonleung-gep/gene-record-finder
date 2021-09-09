/*global YUI */
YUI.add("usage_table",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      usageTable;

   usageTable = function(containerID, options) {
     var settings,
      container = Y.byID(containerID),
      tables,
      previousRow,
      sub = Y.Lang.sub,
      create = Y.Node.create,
      css;

     settings = GEP.util.mergeSettings(options, {
       eventPrefix: "usage_table",
       css: {
         selectRow: "selectRow",
         highlightRow: "highlightRow",
         match: "match",
         labelTable: "usageTableLabel",
         usageTable: "usageTableInfo",
         table: "pure-table pure-table-bordered"
       },
       colIDprefix: "exonID_",
       rowIDprefix: "exonitem_",
       labelIDprefix: "label-",
       labelTableID: containerID + "-labelTable",
       usageTableID: containerID + "-usageTable",
       exons: {},
       mrnas: {},
       exonMapID: "exonIDs",
       labelFormatter: null
     });

     css = settings.css;

     function extractExonIDs(exons) {
       var exonList = [], i;

       for (i=0; i<exons.length; i+=1) {
         exonList.push(exons[i].id);
       }

       return exonList;
     }

     function createExonLookupMap(exonIDs) {
       var i, lookupMap = {};

       for (i=0; i<exonIDs.length; i+=1) {
         lookupMap[exonIDs[i]] = i;
       }

       return lookupMap;
     }

     function getIDSuffix(rowID) {
       var prefix = settings.rowIDprefix,
           startPos = rowID.lastIndexOf(prefix) + prefix.length;

       return rowID.substr(startPos);
     }

     function getRowID(id) {
       var rowID = settings.rowIDprefix + id;

       return {
         row: rowID,
         label: settings.labelIDprefix + rowID
       };
     }

     function addIsoformRows(mrnas, tbody) {
       var formatter = settings.labelFormatter,
           rowNode, mrna, label, i;

       for (i=0; i<mrnas.length; i+=1) {
         mrna = mrnas[i];

         label = (formatter === null) ? mrna.FBname : formatter(mrna.FBname);

         rowNode = create("<tr></tr>");
         rowNode.set("id", (getRowID(mrna.id)).label);
         rowNode.appendChild(sub("<td>" + label + "</td>"));

         tbody.appendChild(rowNode);
       }
     }

     function addExonHeaders(exons, thead) {
       var numExons = exons.length,
           rowNode = create("<tr></tr>"),
           columnTpl = "<th id='{id}'>{label}</th>",
           column, exon, i;

       for (i=0; i<numExons; i+=1) {
         exon = exons[i];

         column = create(sub(columnTpl, {
           id: settings.colIDprefix + exon.id,
           label: exon.FBid
         }));

         rowNode.appendChild(column);
       }

       thead.appendChild(rowNode);
     }

     function addExonUsageRows(mrna, exonIDs, tbody) {

       var exonLookupMap = createExonLookupMap(mrna[settings.exonMapID]),
           cells = [],
           matchTpl = "<td class='{match}'>{exonIdx}</td>",
           rowTpl = "<tr id='{id}'>{usage}</tr>",
           exonIdx = 1,
           rowNode, i;

       for (i=0; i<exonIDs.length; i+=1) {
         if (exonLookupMap[exonIDs[i]] === undefined) {
           cells.push('<td></td>');

         } else {
           cells.push(sub(matchTpl, { match: css.match, exonIdx: exonIdx }));
           exonIdx += 1;
         }
       }

       rowNode = create(sub(rowTpl, {
         id: settings.rowIDprefix + mrna.id,
         usage: cells.join("")
       }));

       tbody.appendChild(rowNode);
     }

     function createLabelTable(mrnas) {
        var tableContainer = create(sub("<div class='{labelTable}'/>", css)),

            table = create(sub("<table id='{id}' class='{table}'></table>", {
                id: settings.labelTableID,
                table: css.table
            })),

            thead = create("<thead><tr><th>Isoform</th></thead>"),
            tbody = create("<tbody></tbody>");

       addIsoformRows(mrnas, tbody);

       table.appendChild(thead);
       table.appendChild(tbody);
       tableContainer.appendChild(table);

       container.appendChild(tableContainer);

       return table;
     }

     function createUsageTable(mrnas, exons) {
        var tableContainer = create(sub("<div class='{usageTable}'/>", css)),

            table = create(sub("<table id='{id}' class='{table}'></table>", {
                id: settings.usageTableID,
                table: css.table
            })),

            thead = create("<thead></thead>"),
            tbody = create("<tbody></tbody>"),
            exonIDs = extractExonIDs(exons),
            i;

       addExonHeaders(exons, thead);

       for (i=0; i<mrnas.length; i+=1) {
         addExonUsageRows(mrnas[i], exonIDs, tbody);
       }

       table.appendChild(thead);
       table.appendChild(tbody);

       tableContainer.appendChild(table);

       container.appendChild(tableContainer);

       return table;
     }

     function createTable() {
       return {
         label: createLabelTable(settings.mrnas.items),
         usage: createUsageTable(settings.mrnas.items, settings.exons.items)
       };
     }

     tables = createTable();

     function highlight(e) {
       var ids = getRowID(getIDSuffix(e.currentTarget.get("id"))),
           rowTr = Y.byID(ids.row);

       if (rowTr.hasClass(css.selectRow)) {
         return;
       }

       rowTr.addClass(css.highlightRow);
       Y.byID(ids.label).addClass(css.highlightRow);
     }

     function unhighlight(e) {
       var ids = getRowID(getIDSuffix(e.currentTarget.get("id"))),
           rowTr = Y.byID(ids.row);

       if (rowTr.hasClass(css.selectRow)) {
         return;
       }

       rowTr.removeClass(css.highlightRow);
       Y.byID(ids.label).removeClass(css.highlightRow);
     }

     function changeSelectedLabel(e) {
       var tr = e.currentTarget,
           rowID = tr.get("id");

       if (tr.hasClass(css.selectRow)) {
         return;
       }

       unhighlight(e);

       Y.fire("usage_table:selectLabel", { id: getIDSuffix(rowID) });
     }

     function displaySequence(e) {
       var colID = e.currentTarget.get("id"),
           colIDprefix = settings.colIDprefix,
           id = colID.substr(colID.lastIndexOf(colIDprefix) + colIDprefix.length);

       Y.fire("usage_table:selectColumn", {
         id: id,
         type: settings.exonMapID
       });
     }

     function addEventListeners() {
       var labelTable = tables.label,
           infoTable = tables.usage;

       labelTable.delegate("hover", highlight, unhighlight, "tbody tr");
       infoTable.delegate("hover", highlight, unhighlight, "tbody tr");

       labelTable.delegate("click", changeSelectedLabel, 'tbody tr');
       infoTable.delegate("click", changeSelectedLabel, 'tbody tr');

       infoTable.delegate("click", displaySequence, 'thead th');
     }

     Y.on("mRNA_table:selectedRow", function(selectedRecord) {
       var key = selectedRecord.record.get("id"),
           rowID = getRowID(key),
           selectRow = css.selectRow;

       if (previousRow) {
         Y.byID(previousRow.label).removeClass(selectRow);
         Y.byID(previousRow.row).removeClass(selectRow);
       }

       Y.byID(rowID.label).addClass(selectRow);
       Y.byID(rowID.row).addClass(selectRow);

       previousRow = rowID;
     });

     addEventListeners();

     return container;
   };

  GEP.usageTable = usageTable;
}, '0.0.1', {
  requires: ['gep', 'node', 'event-hover']
});
