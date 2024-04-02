<template>
	<div class="app-chart w-100 h-100">
		<canvas ref="CanvasRef"></canvas>
	</div>
</template>
<script setup>
import { ref, unref, onMounted, toRefs, watch } from 'vue'

import { OhlcElement, OhlcController, CandlestickElement, CandlestickController } from 'chartjs-chart-financial'
import Chart from 'chart.js/auto';
import 'chartjs-adapter-moment';

const props = defineProps({
	data: {
		type: [Object, Array],
		default: () => []
	},
	signals: {
		type: [Object, Array],
		default: () => []
	},
})

const emit = defineEmits('hover')

const { data, signals } = toRefs(props)
const CanvasRef = ref(null)
let chartInstance = null

const buyImage = new Image();
buyImage.src = '/buy.png'

const sellImage = new Image()
sellImage.src = '/sell.png'

const drawArrowsPlugin = {
	id: 'drawArrows',
	beforeDraw: (chart) => {
		const { ctx } = chart;

		const signals = chart.options.plugins.drawArrows.signals;

		signals.forEach(signal => {
			const { x, y, type } = signal;
            // Convert timestamp (x) to pixel position on chart's x-axis
            const xPos = chart.scales.x.getPixelForValue(x);
            // Convert closing price (y) to pixel position on chart's y-axis
            const yPos = chart.scales.y.getPixelForValue(y);

            const image = type === 'buy' ? buyImage : sellImage;
			ctx.drawImage(image, xPos - image.width / 2, type === 'buy' ? yPos : yPos - image.height);
		});
	}
};

const getContainerDimensions = (canvasNode) => {
	return {
		width: canvasNode.parentNode.clientWidth,
		height: canvasNode.parentNode.clientHeight
	}
}

const initializeChart = (canvasNode, data, signals) => {
	const ctx = canvasNode.getContext('2d');

	const { width, height } = getContainerDimensions(canvasNode)

	ctx.canvas.width = width;
	ctx.canvas.height = height;

	return new Chart(ctx, {
		type: 'candlestick',
		data: {
			datasets: [
				{
					data: data,
				},
			]
		},
		options: {
			plugins: {
				legend: {
					display: false
				},
				drawArrows: {
					signals: signals
				},
				tooltip: {
					enabled: false,
					position: 'nearest',
					external: (data) => console.log(data)
				}
			}
		}
	});
}

Chart.register(OhlcElement, OhlcController, CandlestickElement, CandlestickController, drawArrowsPlugin)

watch(data, (newData) => {
	chartInstance.data.datasets.at(0).data = [...newData]
	chartInstance.update()
}, { deep: true })

watch(signals, (newData) => {
	chartInstance.options.plugins.drawArrows.signals = [...newData]
	chartInstance.update()
}, { deep: true })

onMounted(() => {
	chartInstance = initializeChart(unref(CanvasRef), unref(data), unref(signals))
	chartInstance.update();

	window.addEventListener('resize', chartInstance.update)
})
</script>