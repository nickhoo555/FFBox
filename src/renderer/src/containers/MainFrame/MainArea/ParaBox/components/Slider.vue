<script setup lang="ts">
import { computed, ref, VNodeRef } from 'vue';
import type { SliderOptions } from '@common/params/types';
import { useAppStore } from '@renderer/stores/appStore';

const appStore = useAppStore();

interface Props {
	title: string;
	value: number | string;
	tags?: [number, string][] | Map<number, string>;
	step?: number;
	valueToText: SliderOptions['valueToText'];
	valueProcess?: SliderOptions['valueProcess'];
	stringToNumber?: SliderOptions['stringToNumber'];
	numberToParam?: SliderOptions['numberToParam'];	// 若指定 numberToParam，Slider 将认为 value 是字符串类型。使用滑块操作时，返回值将通过此函数计算出
	onChange?: (value: number | string) => any;
}

const props = defineProps<Props>();

// 如果 props.value 是字符串，那么此处将其转换为对应值（如果有）
const convertedValue = computed(() => {
	if (typeof props.value === 'string') {
		return props.stringToNumber(props.value);
	} else {
		return props.value;
	}
})

const slipperRef = ref<VNodeRef>(null);

const valueToTextConverter = (setting: Props['valueToText'], value: string | number) => {
	if (setting instanceof Function) {
		return setting(value);
	} else {
		if (setting.type === 'bitrate') {
			const bps = Math.round(setting.min * 2 ** ((value as number) * setting.power));
			if (window.frontendSettings.useIEC) {
				if (bps >= 10 * 1024 ** 2) {
					return (bps / 1024 ** 2).toFixed(1) + ' Mibps';
				} else {
					return (bps / 1024).toFixed(0) + ' kibps';
				}
			} else {
				if (bps >= 10 * 1000 ** 2) {
					return (bps / 1000 ** 2).toFixed(1) + ' Mbps';
				} else {
					return (bps / 1000).toFixed(0) + ' kbps';
				}
			}
		} else if (setting.type === 'integer') {
			const range = setting.max - setting.min;
			return (setting.min + range * (value as number)).toFixed(0);
		} else {
			const range = setting.max - setting.min;
			return String(setting.min + range * (value as number));
		}
	}
}

const handleDragStart = (event: MouseEvent | TouchEvent) => {
	event.preventDefault();
	let mouseDownX = (event as MouseEvent).pageX || (event as TouchEvent).touches[0].pageX;	// 鼠标在页面（窗口）内的坐标
	let slipper = event.target! === slipperRef.value ? true : false;
	let sliderLeft: number, sliderWidth: number, slipperOffsetX: number;
	if (slipper) {
		sliderLeft = event.target!.parentElement!.getBoundingClientRect().left;
		sliderWidth = event.target!.parentElement!.offsetWidth;
		slipperOffsetX = (event as MouseEvent).offsetX - event.target!.offsetWidth / 2;
		event.target!.focus();
	} else {
		sliderLeft = event.target!.getBoundingClientRect().left;
		sliderWidth = event.target!.offsetWidth;
		slipperOffsetX = 0;
	}
	// 添加鼠标事件捕获，将其独立为一个函数，以便于 mouseDown 直接触发 mouseMove
	let handleMouseMove = (event: Partial<MouseEvent | TouchEvent>) => {
		let value = (Math.floor((event as MouseEvent).pageX || (event as TouchEvent).touches[0].pageX) - sliderLeft - slipperOffsetX) / sliderWidth;	// event.pageX == 0 时短路逻辑失效，会报错，不影响使用
		if (value > 1) {
			value = 1;
		} else if (value < 0) {
			value = 0;
		}
		value = props.valueProcess ? props.valueProcess(value) : value;
		if (value != lastValue) {
			const emitValue = props.numberToParam ? props.numberToParam(value) : value;
			(props.onChange || (() => {}))(emitValue);
			lastValue = value;
		}
	}
	const handleMouseUp = (event: MouseEvent | TouchEvent) => {
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	};
	document.addEventListener('mousemove', handleMouseMove);
	document.addEventListener('mouseup', handleMouseUp);
	let lastValue = NaN;
	handleMouseMove({ pageX: mouseDownX });	// mouseDown 直接触发 mouseMove
}

const handleKeypress = (event: KeyboardEvent) => {
	if (event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
		let direction, delta, sum;
		if (event.key == 'ArrowLeft') {
			direction = -1;
		} else {
			direction = 1;
		}
		if (props.step) {
			delta = 1 / props.step;
		} else {
			delta = 0.01;
		}
		sum = (convertedValue.value !== undefined ? convertedValue.value : 0.5) + direction * delta;
		if (sum < 0) {
			sum = 0;
		} else if (sum > 1) {
			sum = 1;
		}
		(props.onChange || (() => {}))(sum);
	}
};

</script>

<template>
	<div class="slider" :data-color_theme="appStore.frontendSettings.colorTheme">
		<div class="slider-title">{{ props.title }}</div>
		<div class="slider-module" @mousedown="handleDragStart">
			<div class="slider-module-track"></div>
			<div class="slider-module-track-background" :style="{ width: convertedValue * 100 + '%' }"></div>
			<span v-for="(tag, index) in tags" :key="index" class="slider-module-mark" :style="{ left: tag[0] * 100 + '%' }">{{ tag[1] }}</span>
			<button class="slider-module-slipper" v-bind:style="{ left: convertedValue * 100 + '%' }" ref="slipperRef" @keydown="handleKeypress" :aria-label="title + '滑块'"></button>
		</div>
		<div class="slider-text">{{ valueToTextConverter(props.valueToText, value) }}</div>
	</div>
</template>

<style lang="less" scoped>
	.slider {
		position: relative;
		width: calc(100% - 16px);
		height: 56px;
		margin: 4px 24px;
		transition: all 0.5s;
		.slider-title {
			position: absolute;
			left: 0;
			top: 50%;
			width: 88px;
			transform: translateY(-50%);
			font-size: 14px;
			text-align: center;
		}
		.slider-module {
			position: absolute;
			left: 104px;
			width: calc(100% - 88px - 88px - 32px);
			height: 100%;
			font-size: 14px;
			.slider-module-track {
				position: absolute;
				top: 17px;
				width: 100%;
				height: 6px;
				border-radius: 8px;
				box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.15) inset;
			}
			.slider-module-track-background {
				position: absolute;
				top: 17px;
				height: 6px;
				background: #49e;
				border-radius: 8px;
				box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.15) inset;
				pointer-events: none;
			}
			.slider-module-slipper {
				position: absolute;
				top: 4px;
				transform: translateX(-50%);
				width: 18px;
				height: 30px;
				background: linear-gradient(180deg, #fefefe, #f0f0f0);
				border-radius: 4px;
				box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.2);
				border: none;
				outline: none;
			}
			.slider-module-slipper:hover {
				background: linear-gradient(180deg, #ffffff, #fefefe);
			}
			.slider-module-slipper:active {
				background: linear-gradient(180deg, #f0f0f0, #ededed);
			}
			/*
			.slider-module-slipper:before {
				position: absolute;
				display: inline-block;
				left: 0;
				content: "";
				width: 18px;
				height: 15px;
				background: linear-gradient(-90deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3));
				border-radius: 1px 1px 18px 18px / 1px 1px 3px 3px;
			}
			*/
			.slider-module-mark {
				position: absolute;
				bottom: 0px;
				transform: translateX(-50%);
				width: 96px;
				font-size: 10px;
				text-align: center;
				opacity: 0.7;
				pointer-events: none;
			}
			.slider-module-mark:before {
				content: "";
				position: absolute;
				left: calc(50% - 2px);
				top: -8px;
				width: 4px;
				height: 4px;
				border-radius: 4px;
				box-shadow: 0px 1px 1px 0px rgba(0, 0, 0, 0.2) inset;
				z-index: -10;
			}
		}
		.slider-text {
			position: absolute;
			right: 0px;
			top: 50%;
			transform: translateY(-50%);
			width: 88px;
			font-size: 14px;
			text-align: center;
		}
	}

	// 主题
	.slider[data-color_theme="themeLight"] {
		.slider-module-track {
			background: #FFF;
		}
		.slider-module-mark:before {
			background: #FFF;
		}
	}
	.slider[data-color_theme="themeDark"] {
		.slider-module-track {
			background: #444;
		}
		.slider-module-mark:before {
			background: #777;
		}
	}

</style>
