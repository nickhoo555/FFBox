<script setup lang="ts">
import RadioList, { Props as RadioListProps } from '../MainArea/ParaBox/components/RadioList.vue';
import { useAppStore } from '@renderer/stores/appStore';

const appStore = useAppStore();

const dataRadixList: RadioListProps['list'] = [
	{ value: false, caption: '1000 进制 (SI)' },
	{ value: true, caption: '1024 进制 (IEC)' },
];
const colorThemeList: RadioListProps['list'] = [
	{ value: 'themeLight', caption: '浅色' },
	{ value: 'themeDark', caption: '深色' },
];
const progressModeList: RadioListProps['list'] = [
	{ value: '预测实时值', disabled: true },
	{ value: 'ffmpeg 真实值', disabled: true },
];

const handleSettingChange = (key: keyof typeof appStore.frontendSettings, value: any) => {
	(appStore.frontendSettings[key] as any) = value;
	appStore.applyFrontendSettings(true);
};

</script>

<template>
	<div>
		<div class="localSettings">
			<span>数据量进制和词头</span>
			<RadioList :list="dataRadixList" :value="appStore.frontendSettings.useIEC" @change="(value) => handleSettingChange('useIEC', value)" />
			<span>颜色主题</span>
			<RadioList :list="colorThemeList" :value="appStore.frontendSettings.colorTheme" @change="(value) => handleSettingChange('colorTheme', value)" />
			<span>进度显示模式</span>
			<RadioList :list="progressModeList" value="预测实时值" />
		</div>
	</div>
</template>

<style lang="less">
	.localSettings {
		width: 100%;
		display: grid;
		grid-template-columns: calc(20% + 50px) calc(50% + 50px);
		justify-content: center;
		align-items: center;
		&>span {
			font-size: 15px;
		}
		.radioList {
			flex-direction: row;
			min-height: unset;
		}
	}
</style>