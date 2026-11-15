var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var queue_exports = {};
__export(queue_exports, {
  newQueue: () => newQueue
});
module.exports = __toCommonJS(queue_exports);
let Promize = Promise;
let newQueue = (concurrency) => {
  let active = 0;
  let size = 0;
  let head;
  let tail;
  let resolveDonePromise;
  let donePromise;
  let queue;
  let afterRun = () => {
    active--;
    if (--size) {
      run();
    } else {
      donePromise = resolveDonePromise?.();
    }
  };
  let run = () => {
    if (head && active < concurrency) {
      active++;
      let curHead = head;
      head = head.a;
      curHead.p().then(
        (v) => (curHead.c(v), afterRun()),
        (e) => (curHead.b(e), afterRun())
      );
    }
  };
  return queue = {
    add(p) {
      let node = { p };
      let promise = new Promize((res, rej) => {
        node.c = res;
        node.b = rej;
      });
      if (head) {
        tail = tail.a = node;
      } else {
        tail = head = node;
      }
      size++;
      run();
      return promise;
    },
    done: () => {
      if (!size) {
        return Promize.resolve();
      }
      if (donePromise) {
        return donePromise;
      }
      return donePromise = new Promize((resolve) => resolveDonePromise = resolve);
    },
    clear() {
      for (let node = head; node; node = node.a) {
        node.b(new Error("Queue cleared"));
      }
      head = tail = null;
      size = active;
    },
    active: () => active,
    size: () => size,
    all: (fns) => Promize.all(fns.map((fn) => queue.add(typeof fn === "function" ? fn : () => fn)))
  };
};
