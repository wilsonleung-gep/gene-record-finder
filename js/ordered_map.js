/*global YUI */
YUI.add("ordered_map",

function(Y) {
  "use strict";

  var GEP = Y.namespace("GEP"),
      fetchProperty = GEP.util.fetchProperty,
      orderedMap;

  orderedMap = function(elements) {
    var items = {},
        order = [];

    function addItem(item) {
      var itemID = fetchProperty(item, "id");

      if (items[itemID] !== undefined) {
        throw new TypeError("Item with id: " + itemID + " already exists");
      }

      items[itemID] = item;
      order.push(itemID);
    }

    function reindexMap() {
      var i, item,
        newOrder = [];

      for (i=0; i<order.length; i+=1) {
        item = items[order[i]];

        if (item !== undefined) {
          newOrder.push(fetchProperty(item, "id"));
        }
      }

      order = newOrder;
    }

    function remove(keys) {
      var i, key;

      if (! Y.Lang.isArray(keys)) {
        keys = [keys];
      }

      for (i=0; i<keys.length; i+=1) {
        key = keys[i];

        if (items[key] === undefined) {
          throw new ReferenceError("Key: " + key + " does not exists");
        }

        delete items[key];
      }

      reindexMap();
    }

    function get(key) {
      return items[key];
    }

    function getByIndex(idx) {
      return items[order[idx]];
    }

    function map(func) {
      var numItems = order.length,
          results = [],
          i;

      for (i=0; i<numItems; i+=1) {
        results.push(func(getByIndex(i)));
      }

      return results;
    }

    function add(items) {
      var i;

      if (! Y.Lang.isArray(items)) {
        addItem(items);
      }

      for (i=0; i<items.length; i+=1) {
        addItem(items[i]);
      }
    }

    function size() {
      return order.length;
    }

    if (elements !== undefined) {
      add(elements);
    }

    return {
      add: add,
      remove: remove,
      get: get,
      getByIndex: getByIndex,
      size: size,
      map: map,
      getMapData: function() {
        return { order: order, items: items };
      }
    };
  };

  GEP.orderedMap = orderedMap;

}, '0.0.1', {
  requires: ["gep", "node"]
});
