import activeMQ from "../clients/activeMQ";
import ipfs from "../clients/ipfs";

const queueName = "testQueue"
const useActiveMQ = activeMQ()
const useIpfs = ipfs()

let subScriptionId: string

export default () => {

    const _messageProcessor = async (message: string) => {
        console.log(message);
        const resp = await useIpfs.storeOnIPFS(message)
        console.log(resp)
    }

    const start = async () => {
        console.log("started");
        const subScriptionDetails = await useActiveMQ.subscribeToQueue(queueName, _messageProcessor)
        subScriptionId = subScriptionDetails.id
    }

    const stop = () => {
        console.log("stopping")
        useActiveMQ.unSubscribeFromQueue(subScriptionId)
    }

    return {
        start,
        stop
    }
}