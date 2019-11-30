define(["../util/Helper"], function(helper) {
  var util = helper.util;

  function Ctor() {}

  // See: http://jsperf.com/object-create-vs-new-ctor
  var createProto = Object.__proto__
    ? function(proto) {
        return {
          __proto__: proto
        };
      }
    : function(proto) {
        Ctor.prototype = proto;
        return new Ctor();
      };

  function Class(params) {
    if (this instanceof Class) {
      this.init(params);
    }
    throw "must new Class Instance";
  }
  var fnMatch = /hv/.test(function() {
    hv;
  })
    ? /\b_super\b/
    : /.*/;

  function inheritProps(newproto, oldproto, addTo) {
    addTo = addTo || newproto;
    for (var attr in newproto) {
      addTo[attr] =
        util.isFunction(newproto[attr]) &&
        util.isFunction(oldproto[attr]) &&
        fnMatch.test(newproto[attr])
          ? (function(name, fn) {
              return function() {
                var tmp = this._super,
                  ret;
                this._super = oldproto[name];
                ret = fn.apply(this, arguments);
                this._super = tmp;
                return ret;
              };
            })(attr, newproto[attr])
          : newproto[attr];
    }
    return addTo;
  }

  Class.extend = function(proto) {
    proto = proto || {};
    var _super = this.prototype;
    var prototype = createProto(_super);
    inheritProps(proto, _super, prototype);
    function subClass(params) {
      this.init(params);
    }
    subClass.constructor = subClass;
    subClass.prototype = prototype;
    subClass.extend = Class.extend;
    return subClass;
  };
  return Class;
});
