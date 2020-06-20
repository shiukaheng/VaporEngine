var timeoutError = new Error('Request timed out.')

class LoadingTask {
    constructor(promise, timeout=60000, updateCallback=()=>{}) {
        this.promise = promise
        this.pending = true
        this.sucess = false

        if (timeout >= 0) {
            var timeoutPromise = new Promise((_, reject) => {
                timeout = setTimeout(() => {
                    reject(timeoutError)
                }, timeout)
            })
            this.modifiedPromise = Promise.race([promise, timeoutPromise])
        } else {
            this.modifiedPromise = promise
        }
        this.modifiedPromise.then(()=>{
            this.pending = false
            this.sucess = true
            updateCallback()
        },
        error=>{
            this.pending = false
            this.sucess = false
            updateCallback()
        })
        }
    }

class CallbackRequest {
    constructor(listOfTasks, callback) {
        this.listOfTasks = listOfTasks
        this.callback = callback
    }
    checkDependenciesFulfilled() {
        var pending = []
        this.listOfTasks.forEach(task => {
            pending.push(task.pending)
        })
        return (!pending.includes(true))
    }
}

class LoadingHelper {
    constructor() {
        // Define empty list
        this.dependecyList = []
        this.callbackList = []
    }
    register(promise, timeout=60000) {
        // Adds function to list. Function would be anonymous function, and LoadingHelper would call the function with a parameter, a callback function that is supposed to be called with a bool indicating success.
        var loadingTask = new LoadingTask(promise, timeout, this._checkDependencies)
    }
    onLoaded(callback) {
        this.callbackList.push(new CallbackRequest([...this.dependecyList], callback))
    }
    _checkDependencies() {
        for (i = this.callbackList.length - 1; i >= 0; --i) {
            if (this.callbackList[i].checkDependenciesFulfilled()) {
                this.callbackList.splice(this.callbackList.indexOf(callbackRequest), 1)
            }
        }
    }
}

module.exports = LoadingHelper