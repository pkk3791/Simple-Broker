import activeMQ from "../clients/activeMQ";

const topicName = "testTopic"
const useActiveMQ = activeMQ()

let _interval: number = 120000
let running: boolean = false

export default () => {

    const _publishMessage = () => {
        useActiveMQ.sendMessageToTopic("test", topicName)
        if (running) {
            setTimeout(_publishMessage, _interval);
        }
    }

    const start = (interval: number = _interval) => {
        _interval = interval
        running = true
        console.log("started");
        _publishMessage()
    }

    const stop = () => {
        console.log("stopping")
        running = false
    }

    return {
        start,
        stop
    }
}