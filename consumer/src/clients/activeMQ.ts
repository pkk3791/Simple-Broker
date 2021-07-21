import {Client, Message, ActivationState, messageCallbackType} from '@stomp/stompjs'

const brokerEndpoint = "ws://localhost:61614";

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
  return client;
}

const client: Client = createClient()

export default () => {

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
        }, 1000);
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

    console.log("here");
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

    console.log("here1");

    await activate();
    
    
    console.log("here");

    const _callbackFunc = (message: Message) => {
      //console.log (message)
      callbackFunc(message.body)
    }

    return client.subscribe(`/topic/${topicName}`, _callbackFunc)
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
    unSubscribeFromTopic
  }
}