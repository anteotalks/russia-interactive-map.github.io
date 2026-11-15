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
export {
  newQueue
};
