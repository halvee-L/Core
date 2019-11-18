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
  var getType = v => Object.prototype.toString.call(v).slice(8, -1);
  var isFunction = v => getType(v) === "Function";
  var throwError = v => {
    throw new TypeError(v);
  };
  var nextTick =
    typeof MutationObserver !== "undefined" && global.document
      ? (function() {
          var isPending = false;
          var observerCallbackQueue = [];
          var observer = new MutationObserver(function() {
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
          var div = document.createElement("div");
          observer.observe(div, { attributes: true });
          return function(callback) {
            observerCallbackQueue.push(callback);
            if (!isPending) {
              div.id = Date.now() + Math.random();
              isPending = true;
            }
          };
        })()
      : function(callback) {
          var timer = setTimeout(function() {
            callback();
            clearTimeout(timer);
          }, 10);
        };

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
      }
    };
    queue.push(queueCall);
    return promise;
  };

  var Promise = function Promise(resolver) {
    if (!this instanceof Promise) {
      throwError("undefined is not a promise");
    }
    if (!isFunction(resolver)) {
      throwError("Promise resolver #<Object> is not a function");
    }
    var _PromiseStatus = "pending";
    var _PromiseValue = null;
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
        _PromiseValue = value;
        _PromiseStatus = "resolved";
        nextTick(execQueue);
      },
      function reject(value) {
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
  Promise.all = function() {};

  return Promise;
});
