import {Client, Message, ActivationState, messageCallbackType} from '@stomp/stompjs'
import { Queue } from 'queue-typescript';

//const brokerEndpoint = "ws://10.0.2.2:61614";
const brokerEndpoint = "ws://10.168.38.203:4504";
const backupBrokerEndpoint = "ws://10.168.38.203:61614"

const items: string[] = [];
const queue = new Queue<string>(...items);

const createClient = () => {
  const client: Client = new Client({
    brokerURL: brokerEndpoint,
    connectHeaders: {
      login: 'admin',
      passcode: 'admin',
    },
    debug: function (str) {
      console.log(str);
    },
    reconnectDelay: 1000,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 0
  });
  client.onWebSocketError = function(message){
    console.log("Websocket error. Creating non-anonymous client");
    client.brokerURL = backupBrokerEndpoint
    client.activate();
  }
  /*const mySocketFactory = () => {
    return new SockJS('http://127.0.0.1:61613/stomp');
  }*/

  return client;
}

const client: Client = createClient()

export default () => {

  const addToLocalQueue = (message: string) => {
    queue.enqueue(message);
  }

  const removeFromLocalQueue = () => {
    const dequeuedmessage = queue.dequeue();
    return dequeuedmessage;
  }

  const getQueueLength = () => {
    return queue.length;
  }

  const isClientActive = () => {
    return (client.state == ActivationState.ACTIVE &&
    client.connected);
  }

  const prepMessageForQueue = (encryptedMessage: string, userId: string,
    createdAt: number, tags: string[]) => {
      const preppedMessage: any = {
        "encMessage": encryptedMessage,
        "userid": userId,
        "created": createdAt,
        "hashtags": tags
      }
      return preppedMessage;
  }

  const activate = () => {
    const promise = new Promise((resolve, reject) => {
      
      if (client.state != ActivationState.ACTIVE || !client.connected) {
        client.activate();
      
        setTimeout(() => {
          if (client.state != ActivationState.ACTIVE || !client.connected) {
            reject();
          } else {
            resolve(true);
          }
        }, 3000);
      } else {
        resolve(true);
      }
    });
    return promise;
  }

  const sendMessageToQueue = async (message: string, queueName: string) => {
    await activate();
    const reciptId: string = Date.now().toString();
    client.publish({
      destination: `${queueName}`,
      body: message,
      headers: {receipt: reciptId}
    })
  }

  const sendMessageToTopic  = async (message: string, topicName: string) => {

    await activate();
    const reciptId: string = Date.now().toString();
    client.publish({
      destination: `/topic/${topicName}`,
      body: message,
      headers: {receipt: reciptId}
    })
  }

  const subscribeToQueue = async (queueName: string, callbackFunc: Function) => {

    await activate();

    const _callbackFunc = (message: Message) => {
      callbackFunc(message.body)
    }

    return client.subscribe(queueName, _callbackFunc)
  }

  const unSubscribeFromQueue = (subscriptionId: string) => {
    client.unsubscribe(subscriptionId)
  }

  const subscribeToTopic = async (topicName: string, callbackFunc: Function) => {

    await activate();
  
    const _callbackFunc = (message: Message) => {
      
      callbackFunc(message.body)
    }

    return client.subscribe(`/topic/${topicName}`, _callbackFunc)
  }

  const subscribeToTopicWithID = async (topicName: string, callbackFunc: Function, mySubId: any) => {

    await activate();
  
    const _callbackFunc = (message: Message) => {
      
      callbackFunc(message.body)
    }

    return client.subscribe(`/topic/${topicName}`, _callbackFunc, { id: mySubId })
  }

  const unSubscribeFromTopic = (subscriptionId: string) => {
    client.unsubscribe(subscriptionId)
  }

  return {
    sendMessageToQueue,
    sendMessageToTopic,
    subscribeToQueue,
    unSubscribeFromQueue,
    subscribeToTopic,
    subscribeToTopicWithID,
    unSubscribeFromTopic,
    addToLocalQueue,
    removeFromLocalQueue,
    getQueueLength,
    isClientActive,
    prepMessageForQueue
  }
}