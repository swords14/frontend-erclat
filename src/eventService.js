const eventEmitter = {
  events: {},
  
  // Dispara um evento
  dispatch(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  },

  // Inscreve-se para ouvir um evento
  subscribe(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  },

  // Cancela a inscrição
  unsubscribe(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
};

export default eventEmitter;