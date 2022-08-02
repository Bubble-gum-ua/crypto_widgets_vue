import {subscribeToTicker} from 'src/api'

let connected = false;
self.addEventListener("connect", e => {
    console.log(e)
    e.source.addEventListener("message", ev => {
        console.log('dasd')
        console.log(ev)
        if (ev.data === "start") {
            console.log(ev.data)
            subscribeToTicker()
            if (connected === false) {
                e.source.postMessage('worker init');
                connected = true;
            } else {
                e.source.postMessage('worker already inited');
            }
        }
    }, false);
    e.source.start();
}, false);