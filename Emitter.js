define(["../util/Class"], function(Class) {
  let Emitter = Class.extend({
    init() {
      this.listener = {};
    },
    on(name, fn, context) {
      let list = this.listener[name] || (this.listener[name] = []);
      list.push({ name, fn, context });
      return this;
    },
    once(name, fn, context) {
      let list = this.listener[name] || (this.listener[name] = []);
      let that = this;
      let proxyFuntion = function proxyFuntion() {
        let res = fn.apply(context || this, arguments);
        that.off(name, proxyFuntion);
        return res;
      };
      list.push({ name, fn: proxyFuntion, context });
      return this;
    },
    off(name, fn, context) {
      let list = this.listener[name] || (this.listener[name] = []);
      for (let i = list.length; i >= 0; i--) {
        let item = list[i];
        if (item.fn === fn || item.context === context) {
          list.splice(i, 1);
        }
      }
      return this;
    },
    emit(name, ...args) {
      let list = this.listener[name] || (this.listener[name] = []);
      for (let i = 0, len = list.length; i < len; i++) {
        let { fn, context } = list[i];
        fn.apply(context, args);
      }
      return this;
    }
  });

  return Emitter;
});
