define([], function() {
  function isType(type) {
    return function(val) {
      return Object.prototype.toString.call(val) === "[object " + type + "]";
    };
  }
  var isFunction = isType("Function");
  var isArray = isType("Array");

  const uuid = len => {
    let codes = [];
    for (var i = 0; i < len; i++) {
      codes.push(Math.ceil(Math.random() * 57) + 65);
    }
    return String.fromCharCode.apply(String, codes);
  };
  let Helper = {
    util: { isFunction, isArray, uuid }
  };
  return Helper;
});
