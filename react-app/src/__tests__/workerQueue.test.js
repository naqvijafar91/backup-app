import WorkerQueue from '../workerQueue';

describe("Worker Queue", () => {
    it('should eneque and deque correctly', () => {
        let wq = new WorkerQueue();

        for (let i = 0; i < 1000; i++) {
            wq.enque(i);
        }

        for (let i = 0; i < 1000; i++) {
            expect(wq.deque()).toBe(i);
        }

        expect(wq.deque()).toBe(null);
    });

    it('should assing work properly', done => {
        let totalExecutions = 10;
        let executionCount = 0;

        function worker(data, doneCb) {
            setTimeout(function () {
                console.log(data);
                executionCount++;
                if (executionCount == totalExecutions) {
                    setTimeout(function () {
                        done();
                    }, 100);
                }
                doneCb();
            }, 500);
        }

        let wq = new WorkerQueue(worker, 5);

        for (let i = 0; i < 10; i++) {
            wq.enque(i);
        }
    });
})