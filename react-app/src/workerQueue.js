class WorkerQueue {

    constructor(worker, poolSize) {
        this.head = null;
        this.tail = null;
        this.size = 0;

        // related to worker
        this.poolSize = poolSize;
        this.worker = worker;
        this.busyWorkerCount = 0;

        this.enque = this.enque.bind(this);
        this.deque = this.deque.bind(this);
        this.checkAndAssignWork = this.checkAndAssignWork.bind(this);
        this.doneHandler = this.doneHandler.bind(this);
    }

    // add to tail
    enque(data) {
        let node = {
            data: data,
            next: null
        };

        if (this.tail == null || this.size == 0) {
            this.tail = node;
            this.head = node;
        } else {
            this.tail.next = node;
            this.tail = node;
        }
        this.size++;
        // Do the work
        this.checkAndAssignWork();
    }

    // remove from head
    deque() {
        if (this.size == 0) {
            return null;
        }

        let temp = this.head;
        this.head = this.head.next;

        this.size--;

        return temp.data;
    }

    checkAndAssignWork() {
        if (!this.isFunction(this.worker)) {
            return;
        }

        if (this.busyWorkerCount >= this.poolSize) {
            return;
        }

        // dont do anything if we dont have any work left to do
        let work = this.deque();
        if (work == null) {
            return;
        }
        // start a worker
        this.worker(work, this.doneHandler);
        this.busyWorkerCount++;
        console.log("Started worker for " + work + ", busy count:" + this.busyWorkerCount);

        // recursively call itself to assign more workers
        this.checkAndAssignWork();
    }

    // callback called by each worker when it is done
    doneHandler(workerReponse) {
        // TODO: Handle retry in case of failure or false

        this.busyWorkerCount--;
        console.log("Worker returned, busy count:" + this.busyWorkerCount);
        this.checkAndAssignWork();
    }

    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }
}

export default WorkerQueue;