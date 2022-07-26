const API_KEY = '10b7215deb51f422cadae475e1a2ff8a7c84f327cd1898f6d78f3924f4477e8b'

const tickersHandlers = new Map();

const socket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
)
const AGGREGATE_INDEX = "5"
const STATUS_MESSAGE = "INVALID_SUB"
socket.addEventListener('message', e => {
    const {TYPE: type, FROMSYMBOL: currency, PRICE: newPrice,PARAMETER: parameter, MESSAGE: newStatus} = JSON.parse(e.data)
    const item = parameter?.split('~')[2]
    if(newStatus === STATUS_MESSAGE) {
        const msgHandler = tickersHandlers.get(item) ?? []
        msgHandler.forEach(fn => fn('-','error'))
        return;
    } else if(type !== AGGREGATE_INDEX || newPrice === undefined){
        return
    }
    const handlers = tickersHandlers.get(currency) ?? []
    handlers.forEach(fn => fn(newPrice))
})
//TODO Refactor url search params

function sendToWebsocket(message){
    const stringifiedMessage = JSON.stringify(message)
    if(socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage)
        return``
    }
    socket.addEventListener('open', ()=>{
        socket.send(stringifiedMessage)
    }, {once: true})
}
function subscribeToTickerOnWs(ticker){
    sendToWebsocket({
        "action": "SubAdd",
        subs: [`5~CCCAGG~${ticker}~USD`]
    })
}
function unSubscribeFromTickerOnWs(ticker){
    sendToWebsocket({
        "action": "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    })
}
export const subscribeToTicker = (ticker, cb) =>{
    const subscribers = tickersHandlers.get(ticker) || []
    tickersHandlers.set(ticker,[...subscribers, cb])
    subscribeToTickerOnWs(ticker)
}
export const unsubscribeToTicker = (ticker) => {
    // const subscribers = tickersHandlers.get(ticker) || []
    // tickersHandlers.set(
    //     ticker,
    //     subscribers.filter(fn => fn !== cb)
    // )
    tickersHandlers.delete(ticker)
    unSubscribeFromTickerOnWs(ticker)
}
