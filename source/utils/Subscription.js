class Subscription {
    constructor() {
        this.subscribers = new Set()
        this.update = this.update.bind(this)
    }
    subscribe(func) {
        this.subscribers.add(func)
    }
    unsubscribe(func) {
        this.subscribers.delete(func)
    }
    update(data) {
        this.subscribers.forEach(x => {
            x(data)
        })
    }
}
module.exports = Subscription