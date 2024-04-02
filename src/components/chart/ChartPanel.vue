<template>
	<div class="w-100 h-100">
		<div class="p-3 bg-secondary d-flex align-items-center w-100">
			<div class="pe-2">
				<select
					class="form-select mr-3"
					aria-label="Symbol"
					v-model="symbol"
				>
					<option
						v-for="item in symbolsList"
						:value="item.value"
						:key="item.value"
					>
						{{ item.title }}
					</option>
				</select>
			</div>

			<div>
				<select
					class="form-select"
					aria-label="Time frame"
					v-model="period"
				>
					<option
						v-for="item in PERIODSList"
						:value="item.value"
						:key="item.value"
					>
						{{ item.title }}
					</option>
				</select>
			</div>

			<div class="ms-2">
				<h4>Price: {{ currentPrice }}</h4>
			</div>

			<div class="ms-2"></div>
		</div>

		<div class="w-100 h-100" style="max-height: calc(100svh - 100px);">
			<template v-if="isLoading">
				<div class="w-100 h-100 d-flex align-items-center justify-content-center">
					<UiSpinner />
				</div>
			</template>
			<template v-else>
				<Chart
					:data="currentData"
					:signals="currentSignals"
				/>
			</template>
		</div>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue'

// Configs
import { SYMBOLS, PERIODS } from '@/configs/apiConfig';

// Components
import UiSpinner from '@/components/ui/UiSpinner.vue'
import Chart from '@/components/chart/Chart.vue'

// BL
import useApi from '@/composables/useApi'

const signals = ref([])

const symbolsList = computed(() => [
	{
		title: 'BTC/USDT',
		value: SYMBOLS.BTC_USDT
	},
	{
		title: 'ETH/USDT',
		value: SYMBOLS.ETH_USDT
	},
	{
		title: 'LTC/USDT',
		value: SYMBOLS.LTC_USDT
	},
])

const PERIODSList = computed(() => [
	{
		title: '5M',
		value: PERIODS['5_M']
	},
	{
		title: '30M',
		value: PERIODS['30_M']
	},
	{
		title: '1H',
		value: PERIODS['1_H']
	},
])

const symbol = ref(symbolsList.value.at(0).value)
const period = ref(PERIODSList.value.at(0).value)

const {
	currentData,
	currentSignals,
	currentPrice,
	isLoading,
	isError,
} = useApi(symbol, period)
</script>