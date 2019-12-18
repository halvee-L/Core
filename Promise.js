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

  if (!isFunction(Function.prototype.bind)) {
    Function.prototype.bind = function(context) {
      var fn = this;
      return function bindCall() {
        fn.apply(context || this, arguments);
      };
    };
  }
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
        value.then(_resolve, _reject); //.catch(_reject);
      } else {
        this.PromiseStatus === "rejected" ? _reject(value) : _resolve(value);
        //_resolve(value);
      }
    };
    queue.push(queueCall);
    return promise;
  };

  var ArrayFull = function(length) {
    this.values = [];
    this.length = length;
  };
  ArrayFull.prototype.isFull = function() {
    for (var i = 0, len = this.length; i < len; i++) {
      if (!(i in this.values)) {
        return false;
      }
    }
    return true;
  };
  ArrayFull.prototype.set = function(index, value) {
    this.values[index] = value;
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

    var callQueue = (function() {
      var callin = false;
      return function() {
        if (callin) return;
        callin = true;
        nextTick(function() {
          execQueue();
          callin = false;
        });
      };
    })();

    this.then = function(onFulfilled, onRejected) {
      var promises = [parseQueue(resolveQueue, onFulfilled)];
      if (isFunction(onRejected)) {
        var promiseReject = this.catch(onRejected);
        promises.push(promiseReject);
      }
      callQueue();
      return Promise.race(promises);
    };
    this.catch = function(onRejected) {
      var promise = parseQueue(rejectQueue, onRejected);
      callQueue();
      return promise;
    };
    this.finally = function(onFinally) {
      var promise = parseQueue(finallyQueue, onFinally);
      callQueue();
      return promise;
    };

    function statusFactory(status) {
      return function statusFunction(value) {
        if (_PromiseStatus !== "pending") return;
        _PromiseValue = value;
        _PromiseStatus = status;
        nextTick(execQueue);
      };
    }
    var onRejecter = statusFactory("rejected");
    var onResolver = statusFactory("resolved");
    try {
      resolver(onResolver, onRejecter);
    } catch (e) {
      onRejecter(e);
    }
  };

  Promise.resolve = function(value) {
    if (value instanceof Promise) return value;
    return new Promise(function(resolve, reject) {
      resolve(value);
    });
  };
  Promise.reject = function(value) {
    return new Promise(function(resolve, reject) {
      if (value instanceof Promise) {
        value.then(reject);
      } else {
        reject(value);
      }
    });
  };

  var PromiseAllFactory = function(caller) {
    return function PromiseProxy(promises) {
      return new Promise(function(resolve, reject) {
        var length = promises.length;
        var result = new ArrayFull(length);
        var thenCall = function(index, status) {
          return caller(
            function(data) {
              result.set(index, data);
              if (result.isFull()) {
                resolve(result.values);
              }
            },
            reject,
            status
          );
        };
        for (var i = 0, len = length; i < len; i++) {
          if (promises[i] && promises[i].then) {
            promises[i].then(thenCall(i, "fulfilled"), thenCall(i, "rejected"));
            // .catch(thenCall(i, "rejected"));
          } else {
            thenCall(i, "resolve")(promises[i]);
          }
        }
      });
    };
  };
  Promise.all = PromiseAllFactory(function(proxy, reject, status) {
    if (status === "rejected") return reject;
    return function(data) {
      proxy(data);
    };
  });
  Promise.race = function(promises) {
    if (promises.length == 1) {
      return promises[0];
    }
    return new Promise(function(resolve, reject) {
      var length = promises.length;
      for (var i = 0, len = length; i < len; i++) {
        promises[i].then(resolve, reject); //.catch();
      }
    });
  };
  Promise.allSettled = PromiseAllFactory(function(proxy, reject, status) {
    return function(data) {
      var resultData = {
        status: status
      };
      var key = status === "fulfilled" ? "value" : "reason";
      resultData[key] = data;
      proxy(resultData);
    };
  });
  return Promise;
});
