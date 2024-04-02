import { ref, watch, unref, computed } from 'vue'

import { PERIODS } from '@/configs/apiConfig'
import ApiService from '@/services/ApiService'
import { formatCurrency, generateRandomSignals } from '@/helpers/utilsHelper.js'

const ApiServiceInstance = new ApiService()

// Returns count of candles for last 24 hours withing interval (time frame)
const periodToLimit = (period) => {
	const timeWindowInMinutes = 1440

	switch(period) {
		case PERIODS['1_H']:
			return timeWindowInMinutes / 60
		case PERIODS['30_M']:
			return timeWindowInMinutes / 30
		case PERIODS['5_M']:
			return timeWindowInMinutes / 5
	}
}

// Symbol and period is a reactive vars from our ui
// When it changes we opens new connection or toggles on connection
// which already exist, and listen it`s changes
export default function useApi(symbol, period) {
	let watchNextDataChange = false

	const currentData = ref([])
	const currentSignals = ref([])
	const isLoading = ref(false)
	const isError = ref(false)

	const currentPrice = computed(() => formatCurrency(parseFloat(unref(currentData).at(-1)?.c || 0).toFixed(2)))

	// Updates could be from others already opened connections
	// Second argument is a connection config
	const onDataUpdated = (data, { symbol: configSymbol, period: configPeriod }) => {
		// if this updates config does no match with our current ui params we skip this data update
		if (unref(symbol) !== configSymbol || unref(period) !== configPeriod) {
			return
		}

		currentData.value = data

		if (watchNextDataChange) {
			currentSignals.value = generateRandomSignals(unref(currentData), 5)
			watchNextDataChange = false
		}
	}

	watch(currentData, (value) => {
		isLoading.value = !value.length
	}, { deep: true, immediate: true })

	watch([symbol, period], ([symbolValue, periodValue]) => {
		isError.value = false
		currentData.value = []

		watchNextDataChange = true

		try {
			ApiServiceInstance.createConnection({
				symbol: symbolValue,
				period: periodValue,
				limit: periodToLimit(periodValue),
			}, onDataUpdated)
		} catch (error) {
			console.log(error)
			isError.value = true
		}
	}, { deep: true, immediate: true })

	return {
		currentData,
		currentSignals,
		currentPrice,
		isLoading,
		isError,
	}
}