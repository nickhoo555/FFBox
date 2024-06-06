export type strict2 = { strict2?: true };
export type MenuItem = {
    type: 'normal';
	value: any;
	label: string;
	tooltip?: string;
	disabled?: boolean;
	onClick?: (event: Event, value: any) => void;
} | {
    type: 'separator';
} | {
	type: 'submenu';
	label: string;
	tooltip?: string;
	subMenu: MenuItem[];
	disabled?: boolean;
	key?: number; // 仅供内部使用
} | {
	type: 'checkbox' | 'radio';
	value: any;
	checked: boolean;
	label: string;
	tooltip?: string;
	disabled?: boolean;
	onClick?: (event: Event, checked: boolean) => void;
};
export type NarrowedMenuItem = Extract<MenuItem, { type: 'normal' }> & strict2;
export interface ComboOptions {
	items: NarrowedMenuItem[];
	default?: any;
}
export interface SliderOptions {
	step: number;	// 键盘步进的步长（如鼠标或触屏操作需使用 valueProcess 进行处理），如不需要则传 0
	tags: Map<number, string>;
	default?: number | string; // 值可以是数字或字符串。为字符串时将尝试通过 stringToNumber 转换为数字提供给滑块内部使用，否则不显示滑块
	valueToText: { min: number, max?: number, power?: number, type?: 'bitrate' | 'integer' } | ((value: number | string) => string);	// 显示在滑杆旁边的文字，可以是指示值域的对象、转换函数
	valueProcess: (value: number) => number;	// 拖动滑块时通过内部值进行吸附、整数化处理
	valueToParam: (value: number | string) => string | number;	// 输出到 ffmpeg 参数的文字
	stringToNumber?: (value: string) => number | undefined;	// 提供给 Slider 组件用于将字符串值处理成滑块进度的方法，需与 numberToParam 共同使用
	numberToParam?: (value: number) => string | undefined;	// 提供给 Slider 组件用于将滑块进度处理成字符串值的方法。若指定，Slider 将使用 numberToParam 进行输出
}
export interface BasicParameter {
	parameter: string;	// 实际传给 ffmpeg 的参数
	display: string;	// 显示于表单标题
}
export type Parameter = BasicParameter & (
	({ mode: 'combo' } & ComboOptions) |
	({ mode: 'slider' } & SliderOptions)
);
export type RateControl = NarrowedMenuItem & { cmd: (string | Symbol)[] } & SliderOptions;
