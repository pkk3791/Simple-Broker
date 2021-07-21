import listerner from "./components/listener";
import producer from "./components/producer";

Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const useListerner = listerner()
const useProducer = producer()

console.log("starting app");

useListerner.start()
useProducer.start()