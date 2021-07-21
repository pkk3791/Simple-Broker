import activeMQ from "../secure/activeMQ";
import usePGP from '@/secure/pgp';


const recieveTopicName = "SendMessageRound"
const actualSendQueueName = "ActualMessage"
const dummySendQueueName = "DummyMessage"
const pgp = usePGP();
const dummyMessage = "Dummy Message";

let subscriptionId: string
const useActiveMQ = activeMQ()
let iterationNumber = 1;
const sendMessageInterval = 120000;


// TODO
export default function() {

  const getMessageFromLocalQueueAndProcess = async () => {
    
    console.log("Iteration number " + iterationNumber);
    iterationNumber = iterationNumber + 1;
    let dequeuedmessage: string;
      if(useActiveMQ.getQueueLength() == 0){
        console.log("No message in queue");
      
        // generating and encrypting dummy message
        // TO DO - have to ensure that keys are ready
        // may have to move some methods used in create.vue (ensureKeys etc.)
        dequeuedmessage = await pgp.encrypt(JSON.stringify(dummyMessage));
        const size = new TextEncoder().encode(JSON.stringify(dequeuedmessage)).length;
        console.log("Size of dummy message in KB is");
        console.log(size/1024);
        console.log("Sending message " + dequeuedmessage + " to queue " + dummySendQueueName)
        useActiveMQ.sendMessageToQueue(dequeuedmessage, dummySendQueueName)
  
      }
      else{
        dequeuedmessage = useActiveMQ.removeFromLocalQueue();
        const size = new TextEncoder().encode(JSON.stringify(dummyMessage)).length;
        console.log("Size of actual message in KB is");
        console.log(size/1024);
        console.log("Sending message " + dequeuedmessage + " to queue " + actualSendQueueName)
        useActiveMQ.sendMessageToQueue(dequeuedmessage, actualSendQueueName)
      }
  }

  const _callbackFunc = async (message: string) => {
    console.log("Received send signal", message);

    // Unsubscribe from topic first

    console.log("Unsubscribing from topic now ");

    useActiveMQ.unSubscribeFromTopic(subscriptionId);

    // Then send whatever is in the local queue for scheduling 
    // the same function in an interval

    getMessageFromLocalQueueAndProcess();

    setInterval (getMessageFromLocalQueueAndProcess,sendMessageInterval);
   
  }

  const startProcessing = async () => {
    console.log("started processing : messaging service")
    if(subscriptionId){
      console.log("Subscription ID for topic SendMessageRound = " + subscriptionId);
    }
    console.log(subscriptionId)
    try{
      if(subscriptionId){
        const subscriptionDetails = await useActiveMQ.subscribeToTopicWithID(recieveTopicName, _callbackFunc, subscriptionId);
        subscriptionId = subscriptionDetails.id
        console.log("Subscribed with old topic subscription ID : " + subscriptionId);
      }
      else{
        const subscriptionDetails = await useActiveMQ.subscribeToTopic(recieveTopicName, _callbackFunc);
        subscriptionId = subscriptionDetails.id
        console.log("Got new topic subscription ID : "+subscriptionId);
      }
    }catch(e){
      console.log("PromiseError:");
      console.log(e);
    }
  }

  const stopProcessing = () => {
    console.log("stopped processing : messaging service")
    if (subscriptionId) {
      console.log("Stopping topic subscription for subscription ID : " + subscriptionId);
      useActiveMQ.unSubscribeFromTopic(subscriptionId)
      subscriptionId = ""
    }
  }

  const restartProcessing = () => {

    startProcessing();

    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        startProcessing();
        resolve(true);
      }, 180000)
    })

    return promise;

  }

  return {
    startProcessing,
    stopProcessing,
    restartProcessing
  }
}