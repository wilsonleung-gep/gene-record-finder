/*global YUI */
YUI.add("column_formatter",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      columnFormatter;

   columnFormatter = (function(options) {
     var formatter,
         settings,
         GEPutil = GEP.util;

     settings = GEPutil.mergeSettings(options, {
       flyBaseUrl: "http://flybase.org"
     });

     formatter = {
       gbrowseLink: function(o) {
         GEPutil.propertiesMustExist(o, "value", "gbrowseLink");

         var url = settings.flyBaseUrl +
           "/cgi-bin/gbrowse2/dmel/?name={value};h_feat={value}",
             tpl = "<a target='_blank' href='" + url + "'>View in GBrowse</a>";

         return Y.Lang.sub(tpl, o);
       },

       flyBaseRecordLink: function(o) {
         GEPutil.propertiesMustExist(o, "value", "flyBaseRecordLink");

         var url = settings.flyBaseUrl + "/reports/{value}.html",
             tpl = "<a target='_blank' href='" + url + "'>{value}</a>";

         return Y.Lang.sub(tpl, o);
       },

       coordinates: function(o) {
         GEPutil.propertiesMustExist(o, "value", "coordinates");

         return Y.DataType.Number.format(o.value, {
           thousandsSeparator: ","
         });
       },

       mRNAToProteinName: function(mRNAname) {
         if (mRNAname === undefined) {
           throw new TypeError("mRNAname field is empty");
         }

         var match = mRNAname.match(/^(\S+)\-R([A-Z]+)$/);

         if (! match) {
           throw new TypeError("Invalid mRNA name: " + mRNAname);
         }

         return match[1] + "-P" + match[2];
       }
     };

     return formatter;
   }(GEP.data));

  GEP.columnFormatter = columnFormatter;
}, '0.0.1', {
  requires: ['gep', 'datatype-number-format']
});
