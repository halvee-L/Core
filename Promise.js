const PromiseStatus = Symbol("PromiseStatus");
const PromiseValue = Symbol("PromiseValue");
const getType = v => Object.prototype.toString.call(v).slice(8, -1);
const throwError = v => {
  throw new TypeError(v);
};
export default class Promise {
  [PromiseStatus] = "pending";
  [PromiseValue] = null;
  constructor(resolver) {
    let type = getType(resolver);
    if (type !== "Object") {
      throwError("Promise resolver #<Object> is not a function");
    }
  }
}
