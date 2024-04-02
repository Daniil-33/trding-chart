/**
 * Description
 * @param {string} symbol btsusdt || ltcusdt
 * @param {number} limit
 * @param {string} period 1h || 30m || 5m
 * @returns {promise} resolve either array with candles data or empty array if request fails
 */
function getPreviousCandles(symbol, limit, period) {
	return new Promise((resolve) => {
		fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&limit=${limit}&interval=${period}`)
			.then(data => data.json())
			.then(parsedData => resolve(parsedData.map(([x, open, high, low, close ]) => ({
				o: open,
				h: high,
				l: low,
				c: close,
				x,
			}))))
			.catch(() => resolve([]))
	})
}

/**
 * Description
 * @param {string} symbol
 * @param {string} period
 * @param {function} callback
 * @returns {promise} resolve true if ws connection successfully setup and false if its fails
 */
function createLastCandleDataWSConnection(symbol, period, callback) {
	return new Promise((resolve, reject) => {
		const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${period}`)

		// When WebSocket connection is opened
		socket.onopen = function(event) {
			resolve(true)
		};

		// When WebSocket receives a message
		socket.onmessage = function(event) {
			const data = JSON.parse(event.data);
			const { o, h, l, c, T } = data.k;

			callback({
				o,
				h,
				l,
				c,
				x: T,
			})
		};

		// When WebSocket connection encounters an error
		socket.onerror = function(error) {
			reject(false)
		};
	})
}

export default class ApiService {
	static #instance = null

	constructor() {
		if (ApiService.#instance) {
			return ApiService.#instance
		}

		this.connections = {}

		ApiService.#instance = this
	}

	static createConfigId(symbol, limit, period) {
		return `${symbol}__${limit}__${period}`
	}

	updateConnectionListenerCallback(connectionId, listenerCallback) {
		const connection = this.connections[connectionId]
		connection.listener = listenerCallback

		connection.listener(connection.lastData, connection.config)
	}

	/**
	 * Description
	 * @param {object} config { symbol, limit, period }
	 * @param {function} listenerCallback callback which get new data from api as argument
	 * @returns {promise} resolve true or reject false if ws connection set up successfully
	 */
	createConnection(config, listenerCallback) {
		const { symbol, limit, period } = config
		const connectionConfigId = ApiService.createConfigId(symbol, limit, period)

		return new Promise((resolve, reject) => {
			// check is connection with such config already exist
			if (this.connections[connectionConfigId]) {
				this.updateConnectionListenerCallback(connectionConfigId, listenerCallback)

				return resolve(true)
			}

			const connection = {
				config,
				lastData: [],
				listener: listenerCallback
			}

			// declare ws message callback
			const webSocketCallback = async (lastCandleUpdatedData) => {
				const lastCandle = connection.lastData.at(-1)

				// new candle was generated and window within limit was moved or data is missing (initialization)
				if (!lastCandle || lastCandle.x !== lastCandleUpdatedData.x) {
					const previousCandles = await getPreviousCandles(symbol, limit, period)

					previousCandles.pop()

					connection.lastData = [
						...previousCandles,
						lastCandleUpdatedData
					]
				} else {
					connection.lastData = connection.lastData.toSpliced(limit - 1, 1, lastCandleUpdatedData)
				}

				connection.listener(connection.lastData, connection.config)
			}

			createLastCandleDataWSConnection(symbol, period, webSocketCallback)
				.then(() => {
					this.connections[connectionConfigId] = connection
					resolve(true)
				})
				.catch(() => reject(false))
		})
	}
}