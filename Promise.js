(function(global, factory) {
  "use strict";
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory(global);
  } else if (typeof define === "function" && define.amd) {
    define("Promise", [], factory);
  } else {
    global.Promise = factory(global);
  }
})(typeof window !== "undefined" ? window : this, function(global) {
  var getType = function(v) {
    return Object.prototype.toString.call(v).slice(8, -1);
  };
  var isFunction = function(v) {
    return getType(v) === "Function";
  };
  var throwError = function(v) {
    throw new TypeError(v);
  };

  var microtasks =
    typeof MutationObserver !== "undefined" && global.document
      ? function(callback) {
          var observer = new MutationObserver(callback);
          var div = document.createElement("div");
          observer.observe(div, { attributes: true });
          div.id = Date.now() + Math.random();
        }
      : function(callback) {
          var timer = setTimeout(function() {
            callback();
            clearTimeout(timer);
          }, 0);
        };

  var nextTick = (function() {
    var isPending = false;
    var observerCallbackQueue = [];
    function execTask() {
      isPending = true;
      microtasks(function() {
        var observerCallback;
        while ((observerCallback = observerCallbackQueue.shift())) {
          try {
            observerCallback();
          } catch (e) {
            console.log(e);
          }
        }
        isPending = false;
      });
    }
    return function(callback) {
      observerCallbackQueue.push(callback);
      if (!isPending) {
        execTask();
      }
    };
  })();

  var parseQueue = function parseQueue(queue, callback) {
    var _resolve, _reject;
    var promise = new Promise(function(resolve, reject) {
      _resolve = resolve;
      _reject = reject;
    });
    var queueCall = function queueCall(value, pass) {
      if (!pass) {
        value = callback(value);
      }
      if (value instanceof Promise) {
        value.then(_resolve).catch(_reject);
      } else {
        this.PromiseStatus === "rejected" ? _reject(value) : _resolve(value);
        //_resolve(value);
      }
    };
    queue.push(queueCall);
    return promise;
  };

  var counter = 0;
  var Promise = function Promise(resolver) {
    if (!this instanceof Promise) {
      throwError("undefined is not a promise");
    }
    if (!isFunction(resolver)) {
      throwError("Promise resolver #<Object> is not a function");
    }
    var _PromiseStatus = "pending";
    var _PromiseValue = null;
    this.id = counter++;
    Object.defineProperties(this, {
      PromiseStatus: {
        get: function() {
          return _PromiseStatus;
        }
      },
      PromiseValue: {
        get: function() {
          return _PromiseValue;
        }
      }
    });

    var resolveQueue = [];
    var rejectQueue = [];
    var finallyQueue = [];

    var execQueue = function() {
      if (_PromiseStatus === "pending") return;
      var queueCall;
      var pass = _PromiseStatus === "resolved";

      while ((queueCall = resolveQueue.shift())) {
        queueCall.call(this, _PromiseValue, !pass);
      }
      while ((queueCall = rejectQueue.shift())) {
        queueCall.call(this, _PromiseValue, pass);
      }
      while ((queueCall = finallyQueue.shift())) {
        queueCall.call(this, _PromiseValue);
      }
    }.bind(this);

    this.then = function(callback) {
      var promise = parseQueue(resolveQueue, callback);
      nextTick(execQueue);
      return promise;
    };
    this.catch = function(callback) {
      var promise = parseQueue(rejectQueue, callback);
      nextTick(execQueue);
      return promise;
    };
    this.finally = function(callback) {
      var promise = parseQueue(finallyQueue, callback);
      nextTick(execQueue);
      return promise;
    };

    resolver(
      function resolve(value) {
        if (_PromiseStatus !== "pending") return;
        _PromiseValue = value;
        _PromiseStatus = "resolved";
        nextTick(execQueue);
      },
      function reject(value) {
        if (_PromiseStatus !== "pending") return;
        _PromiseValue = value;
        _PromiseStatus = "rejected";
        nextTick(execQueue);
      }
    );
  };

  Promise.resolve = function(value) {
    return new Promise(function(resolve, reject) {
      resolve(value);
    });
  };
  Promise.reject = function(value) {
    return new Promise(function(resolve, reject) {
      reject(value);
    });
  };
  Promise.all = function(promises) {
    return new Promise(function(resolve, reject) {
      var result = [];
      var length = promises.length;
      var isFill = function() {
        for (var i = 0; i < length; i++) {
          if (!(i in result)) {
            return false;
          }
        }
        return true;
      };
      var thenCall = function(index) {
        return function(data) {
          result[index] = data;
          if (isFill()) {
            resolve(result);
          }
        };
      };
      for (var i = 0, len = length; i < len; i++) {
        promises[i].then(thenCall(i)).catch(reject);
      }
    });
  };

  return Promise;
});
