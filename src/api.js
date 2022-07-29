const API_KEY = '10b7215deb51f422cadae475e1a2ff8a7c84f327cd1898f6d78f3924f4477e8b'

const tickersHandlers = new Map();

const socket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
)
const AGGREGATE_INDEX = "5"
const STATUS_MESSAGE = "INVALID_SUB"

let BTCPrice = 0
let coinsToCalculate = []
socket.addEventListener('message', e => {
    const {
        TYPE: type,
        FROMSYMBOL: currency,
        PRICE: newPrice,
        PARAMETER: parameter,
        MESSAGE: newStatus,
        TOSYMBOL: toSymbol
    } = JSON.parse(e.data)
    const item = parameter?.split('~')[2]
    const curr = parameter?.split('~')[3]

    if (newStatus === STATUS_MESSAGE) {
        const msgHandler = tickersHandlers.get(item) ?? []
        msgHandler.forEach(fn => fn('-', 'error'))
        if (curr !== 'BTC') {
            calculateCrossCurrency(item)
            return;
        }
        return;
    } else if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return
    }
    if (currency === 'BTC') {
        coinsToCalculate.forEach(e => {
            const handlers = tickersHandlers.get(e.currency) ?? []
            let currencyCalculated = newPrice * e.newPrice
            handlers.forEach(fn => fn(currencyCalculated, '-'))
        })
        BTCPrice = newPrice ? newPrice : BTCPrice
    }
    const handlers = tickersHandlers.get(currency) ?? []
    if (toSymbol === 'BTC') {
        coinsToCalculate.push({currency: currency, newPrice: newPrice})
        let currencyCalculated = newPrice * BTCPrice
        handlers.forEach(fn => fn(currencyCalculated, '-'))

    } else {
        handlers.forEach(fn => fn(newPrice, '-'))
    }
})

//TODO Refactor url search params
function calculateCrossCurrency(ticker) {
    if (BTCPrice === 0) {
        subscribeToBTCToUSD()
    }
    subscribeToTickerOnWsAndBTC(ticker)
}

function sendToWebsocket(message) {
    const stringifiedMessage = JSON.stringify(message)
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage)
        return ``
    }
    socket.addEventListener('open', () => {
        socket.send(stringifiedMessage)
    }, {once: true})
}

function subscribeToTickerOnWs(ticker) {
    sendToWebsocket({
        "action": "SubAdd",
        subs: [`5~CCCAGG~${ticker}~USD`]
    })
}

function subscribeToTickerOnWsAndBTC(ticker) {
    sendToWebsocket({
        "action": "SubAdd",
        subs: [`5~CCCAGG~${ticker}~BTC`]
    })
}

function subscribeToBTCToUSD() {
    sendToWebsocket({
        "action": "SubAdd",
        subs: [`5~CCCAGG~BTC~USD`]
    })
}

function unSubscribeFromTickerOnWs(ticker) {
    sendToWebsocket({
        "action": "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    })
}

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || []
    tickersHandlers.set(ticker, [...subscribers, cb])
    console.log(cb)
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
