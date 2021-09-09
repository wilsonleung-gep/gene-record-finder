/*global YUI, document */
YUI.add('gep',
function(Y) {
  "use strict";

  Y.namespace("GEP");

  Y.GEP.plugin = {};

  Y.GEP.data = {
    flyBaseUrl: "http://flybase.org",

    loadingClass: "yui3-widget-loading",

    appRoot: "[URL for the UCSC Genome Browser]",

    genomeBrowserRoot: "[URL for the UCSC Genome Browser hgTracks CGI]",

    cssHidden: "hidden"
  };


  Y.byID = Y.byID || function(id) {
    var node = Y.one(document.getElementById(id)) || Y.one('#' + id);

    if (! node) {
      throw new ReferenceError("Node " + id + " does not exist");
    }

    return node;
  };


  Y.GEP.exceptions = {
    XHRException: function(message) {
      if (!(this instanceof Y.GEP.exceptions.XHRException)) {
        return new Y.GEP.exceptions.XHRException(message);
      }

      var separator = "\n";

      this.message = message;
      this.name = "GEP_XHRException";

      this.toString = function() {
        var errorMessages = (Y.Lang.isArray(message)) ? message.join(separator) : message;
        return errorMessages;
      };
      return this;
    }
  };


  Y.GEP.util = {
    tryParseInt: function(value) {
      var convertedValue = parseInt(value, 10);

      if ((typeof value === "number") &&
          (convertedValue === value)) {
        return convertedValue;
      }

      if ((typeof value === "string") &&
          (convertedValue.toString() === value)) {
        return convertedValue;
      }

      return null;
    },

    clone: function(o) {
      if (Object.create) {
        return Object.create(o);
      }

      function F(){ return; }
      F.prototype = o;
      return new F();
    },

    collect: function(fn, arr) {
      if (arr.map) {
        return arr.map(fn);
      }

      var i,
              newArray = [],
              numElements = arr.length;

      for (i = 0; i < numElements; i += 1) {
        newArray.push(fn(arr[i]));
      }

      return newArray;
    },

    inject: function(fn, arr, initValue) {
      if (arr.reduce) {
        return arr.reduce(fn, initValue);
      }

      var i,
          s = initValue,
          numElements = arr.length;

      for (i = 0; i < numElements; i += 1) {
        s = fn(s, arr[i]);
      }

      return s;
    },
    
    filter: function(fn, arr) {
      if (arr.filter) {
        return arr.filter(fn);
      }

      var i,
          filteredArr = [],
          numElements = arr.length;

      for (i = 0; i < numElements; i += 1) {
        if (fn(arr[i])) {
          filteredArr.push(arr[i]);
        }
      }

      return filteredArr;
    },
    
    isObjectEmpty: function(obj) {
      var prop;

      for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }

      return true;
    },
    
    objectToParams: function(obj) {
      var params = [],
              prop;

      for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          params.push(prop + "=" + obj[prop]);
        }
      }

      return params.join('&');
    },

    objectKeys: function(obj) {
      if (Object.keys) {
        return Object.keys(obj);
      }

      var prop,
              keys = [];

      for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          keys.push(prop);
        }
      }

      return keys;
    },

    objectValues: function(obj, func) {
      var prop,
          values = [];

      func = func || {};

      for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (func instanceof Function) {
            values.push(func(obj[prop]));
          } else {
            values.push(obj[prop]);
          }
        }
      }

      return values;
    },
    
    joinURI: function(baseURL, pathsURL) {
      var combinedURL = baseURL.replace(/(\/)+$/, "") + "/" +
              pathsURL.replace(/^(\/)+/, "");

      return encodeURI(combinedURL);
    },
    
    mergeSettings: function(options, defaultOptions) {
      if ((! options) || (this.isObjectEmpty(options))) {
        return defaultOptions;
      }

      if (this.isObjectEmpty(defaultOptions)) {
        return options;
      }

      var YLang = Y.Lang,
            settings = defaultOptions,
            prop;

      for (prop in options) {
        if (options.hasOwnProperty(prop)) {
          if (YLang.isFunction(options[prop])) {
            settings[prop] = options[prop];

          } else if (YLang.isObject(options[prop])) {
            settings[prop] = this.mergeSettings(
                    options[prop], defaultOptions[prop]);

          } else {
            settings[prop] = options[prop];
          }
        }
      }


      return settings;
    },

    capitalize: function(str) {
      return str.charAt(0).toUpperCase() + str.substr(1);
    },

    nlTobr: function(str) {
      return str.replace(/\n/g, "<br/>");
    },

    idToLabel: function(id) {
      var words = id.split("_");

      return this.collect(this.capitalize, words).join(" ");
    },

    labelToID: function(label) {
      var words = label.toLowerCase().split(" ");

      return words.join("_");
    },

    arrayToObject: function(keys, values) {
      var i = 0,
              defaultValue = 1,
              numItems = keys.length,
              objectValues = values || [],
              itemObject = {};

      for (i = 0; i < numItems; i += 1) {
        itemObject[keys[i]] = objectValues[i] || defaultValue;
      }

      return itemObject;
    },

    checkRequiredProperties: function(obj, requiredKeys, objectLabel) {
      var missingProperties,
              status = {type: "_internal", isValid: true, error: null};

      obj = obj || {};

      if (! Y.Lang.isArray(requiredKeys)) {
        requiredKeys = [requiredKeys];
      }

      missingProperties = this.filter(function(k) {
        return (! obj.hasOwnProperty(k));
      }, requiredKeys);

      if (missingProperties.length > 0) {
        objectLabel = objectLabel || "Object";

        status.error = objectLabel +
                " missing required properties: " +
                missingProperties.join(", ");
      }

      if (status.error !== null) {
        status.isValid = false;
      }

      return status;
    },

    propertiesMustExist: function(o, requiredKeys, label) {
      var status = this.checkRequiredProperties(o, requiredKeys, label);

      if (! status.isValid) {
        throw new TypeError(status.error);
      }

      return status;
    },

    fetchProperty: function(record, key, defaultValue) {
      var value = (record.get) ? record.get(key) : record[key];

      if (value !== undefined) {
        return value;
      }

      if (defaultValue === undefined) {
        throw new TypeError("Cannot find key: " + key + " in record");
      }

      return defaultValue;
    }
  };
}, '0.0.1', {
  requires: ['node']
});
