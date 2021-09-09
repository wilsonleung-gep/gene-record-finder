/*global YUI */
YUI.add("sequence_panel",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      sequencePanel;

   sequencePanel = function(containerID, options) {
     var panel,
         panelContent,
         settings;

     settings = GEP.util.mergeSettings(options, {
       srcNode: "#" + containerID + "-bd",
       visible: false,
       headerContent: "Sequence viewer",
       footerContent: "",
       modal: false,
       constrain: true,
       bodyID: containerID + "-contentBox",
       plugins: [Y.Plugin.Drag],
       tpl: ">{name}\n{sequence}\n"
     });

     settings.bodyContent = settings.bodyContent ||
       Y.Node.create('<textarea rows="15" cols="52" readonly="readonly" + ' +
                     'class="sequence" id="' + settings.bodyID + '"/>');

     panel = new Y.Panel(settings);

     panel.render("#" + containerID);

     panelContent = Y.byID(settings.bodyID);

     panel.getTextAreaContent = function() {
       return panelContent.get("value");
     };

     function showSingleSequence(seqInfo) {
       var details = seqInfo.details,
           tr = seqInfo.node,
           a = Y.WidgetPositionAlign;

       panel.set("headerContent", settings.headerContent + ": " + details.name);

       Y.byID(settings.bodyID).setHTML(Y.Lang.sub(settings.tpl, details));

       if (tr) {
         panel.set("align", { node: tr, points: [a.TL, a.TR]});
       } else {
         panel.set("centered", true);
       }
     }

     function showSequenceCollection(collection) {
       var numItems = collection.length,
           fastaRecord = [],
           tpl = settings.tpl,
           details,
           i;

       for (i=0; i<numItems; i+=1) {
         details = collection[i];
         fastaRecord.push(Y.Lang.sub(tpl, details));
       }

       panel.set("headerContent", settings.headerContent);

       panelContent.setHTML(fastaRecord.join(""));

       panel.set("centered", true);
     }


     Y.on('sequence_panel:show', function(seqInfo) {
       if (seqInfo.details) {
         showSingleSequence(seqInfo);
       } else if (seqInfo.collection) {
         showSequenceCollection(seqInfo.collection);
       } else {
         throw new TypeError("Missing sequence information");
       }

       panel.show();

       panelContent.focus();
     });

     panel.after('visibleChange', function(e) {
       var isVisible = e.newVal;

       if (! isVisible) {
         panelContent.blur();
       }
     });

     return panel;
   };

  GEP.sequencePanel = sequencePanel;
}, '0.0.1', {
  requires: ['gep', 'panel', 'dd-plugin']
});
