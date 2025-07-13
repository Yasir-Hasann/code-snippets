class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }

  emit(event, ...args) {
    if (!this.events[event]) return false;
    this.events[event].forEach((listener) => listener(...args));
    return true;
  }
}

const emitter = new EventEmitter();
const unsubscribe = emitter.on('message', (data) => console.log(data));
emitter.emit('message', 'Hello');
emitter.emit('message', 'World');
unsubscribe();
emitter.emit('message', 'Ignored');
console.log(emitter.emit('message', 'Still ignored'));
