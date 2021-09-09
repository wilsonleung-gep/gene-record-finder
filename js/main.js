/*global YUI, window */
YUI().use(
  "gene_search_box",
  "gene_table",
  "mRNA_table",
  "exon_table",
  "cds_table",
  "intron_table",
  "usage_table",
  "tabview",
  "sequence_panel",
  "unique_proteins_table",
  "column_formatter",
  "event-key",
  "anim",

function (Y) {
  "use strict";

  var GEP = Y.GEP,
      pageData,
      geneName,
      mRNATable,
      exonTab,
      workbookService = "./services/downloadgeneworkbook.php";

  function initializeAutoComplete() {
    Y.GEP.geneSearchBox("searchname");
  }

  function initializeAnimation() {
    var anim = new Y.Anim({ node: Y.byID("exoninfo-content"),
      from: { backgroundColor: "#FFFFB2" },
      to: { backgroundColor: "#FFF" },
      duration: 0.5
    });

    Y.on("mRNA_table:selectedRow", function() { anim.run(); });
  }

  function initializeIntronTab() {
    var introns = pageData.introns.items,
        srcNode = "#introninfo-tab",
        intronTab;

    if (! introns || (introns.length === 0)) {
      return;
    }

    intronTab = new Y.TabView({ srcNode: srcNode });
    intronTab.render();

    GEP.intronTable("introninfo-table", { data: introns });

    Y.one(srcNode).removeClass("hidden");
  }

  function initializeTabs() {
    var geneTab, mRNATab;

    geneTab = new Y.TabView({ srcNode: "#geneinfo-tab" });
    geneTab.render();

    mRNATab = new Y.TabView({ srcNode: "#mRNAinfo-tab" });
    mRNATab.render();

    exonTab = new Y.TabView({ srcNode: "#exoninfo-tab" });
    exonTab.render();

    exonTab.addAttr("selectedTabIndex", { value: null });

    exonTab.after("selectionChange", function(e) {
      this.set("selectedTabIndex", e.newVal.get("index"));
    });

    initializeIntronTab();

    exonTab.selectChild(1);
  }

  function initializeUsageTable() {
    GEP.usageTable("transcriptinfo-usage", {
      mrnas: pageData.mrnas,
      exons: pageData.exons,
      exonMapID: "exonIDs"
    });

    GEP.usageTable("peptideinfo-usage", {
      mrnas: pageData.mrnas,
      exons: pageData.cds,
      exonMapID: "cdsIDs",
      colIDprefix: "cdsID_",
      rowIDprefix: "cdsitem_",
      labelFormatter: GEP.columnFormatter.mRNAToProteinName
    });
  }

  function initializeTables() {
    GEP.geneTable("geneinfo-table", { data: [pageData.gene] });
    mRNATable = GEP.mRNATable("mRNAinfo-table", { data: pageData.mrnas.items });

    GEP.exonTable("transcriptinfo-table", {
      data: pageData.exons.items,
      idMap: pageData.exons.idMap
    });

    GEP.cdsTable("peptideinfo-table", {
       data: pageData.cds.items,
       idMap: pageData.cds.idMap
    });

    initializeUsageTable();
  }

  function initializePanels() {
    GEP.sequencePanel("sequencepanel", {
      "headerContent": "Sequence viewer for " + geneName
    });
  }

  function initializeUniqueProteins() {
    GEP.uniqueProteinsTable("cdsUniqueProteins", {
      mrnas: pageData.mrnas
    });
  }

  function createWorkbookLink(type) {
    var uri = workbookService +
      Y.Lang.sub("?q={q}&t={t}", { q: geneName, t: type });

    return uri;
  }

  function initializeButtons() {
    Y.byID("exportExons").on("click", function() {
      Y.fire("exon_table:showAll");
    });

    Y.byID("exportCds").on("click", function() {
      Y.fire("cds_table:showAll");
    });

    Y.byID("exportSelectedExons").on("click", function() {
      Y.fire("exon_table:showSelected");
    });

    Y.byID("exportSelectedCds").on("click", function() {
      Y.fire("cds_table:showSelected");
    });

    Y.byID("downloadExonWorkbook").set("href", createWorkbookLink("exon"));

    Y.byID("downloadCdsWorkbook").set("href", createWorkbookLink("cds"));
  }

  function keyHandler(handler) {
    var tagsToSkip = { "INPUT": 1, "TEXTAREA": 1 },
        tabs = ["exon", "cds"];

    return function(e) {
      var tagName = e.target.get("tagName").toUpperCase(),
          type = tabs[exonTab.get("selectedTabIndex")];

      if (tagsToSkip[tagName] !== undefined) {
        return;
      }

      e.halt();
      handler(type);
    };
  }

  function initializeKeys() {
    var doc = Y.one("doc");

    doc.on("key", keyHandler(function(type) {
      Y.fire(type + "_table:showAll");
    }), "A");

    doc.on("key", keyHandler(function(type) {
      Y.fire(type + "_table:showSelected");
    }), "S");

    doc.on("key", keyHandler(function(type) {
      window.location = createWorkbookLink(type);
    }), "D");

    doc.on("key", keyHandler(function() {
      Y.byID("searchname").focus();
    }), "?");
  }

  function main() {
    pageData = YUI.Env.GEP.pageData;
    geneName = pageData.gene.FBname;

    initializeAutoComplete();
    initializeTabs();
    initializeUniqueProteins();
    initializeTables();
    initializePanels();
    initializeButtons();
    initializeKeys();

    mRNATable.set("selectedRow", mRNATable.getRow(0));

    initializeAnimation();
  }

  main();
});
