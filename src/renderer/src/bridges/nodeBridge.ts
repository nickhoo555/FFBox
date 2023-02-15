import _ElectronStore from 'electron-store';
import { IpcRenderer } from 'electron';
import { ChildProcess } from 'child_process';
import CryptoJS from 'crypto-js';
import { getEnv } from '@common/utils';

let ElectronStore: typeof _ElectronStore, electronStore: _ElectronStore;
let ipcRenderer: IpcRenderer;
let spawn: (...args: any) => ChildProcess, exec: (...args: any) => ChildProcess;

if (getEnv() === 'electron-renderer') {
	ElectronStore = window.require('electron-store');
	ipcRenderer = window.jsb.ipcRenderer as any;
	spawn = window.jsb.spawn;
	exec = window.jsb.exec;
}

export default {
	/**
	 * 执行任何 nodeBridge 函数前都应检查当前是否在 electron 环境
	 * 可以通过此函数验证，或者，若不是 electron 环境，取出的 node 模块将为 undefined
	 */
	get isElectron(): boolean {
		return getEnv() !== 'browser';
	},

	get electronStore(): _ElectronStore | undefined {
		if (ElectronStore) {
			if (!electronStore) {
				electronStore = new ElectronStore();
			}
			return electronStore;
		}
	},

	get ipcRenderer(): IpcRenderer | undefined {
		return ipcRenderer;
	},

	get spawn(): (...args: any) => ChildProcess | undefined {
		return spawn;
	},

	get exec(): (...args: any) => ChildProcess | undefined {
		return exec;
	},

	get cryptoJS(): typeof CryptoJS {
		return CryptoJS;
	},

	get os(): 'Windows' | 'Linux' | 'MacOS' | 'Unix' | 'Android' | 'iPadOS' | 'iOS' | 'unknown' {
		if (this.isElectron) {
			// electron 环境
			let platform : NodeJS.Platform = process.platform
			switch (platform) {
				case 'win32':
					return 'Windows';
				case 'linux':
					return 'Linux';
				case 'darwin':
					return 'MacOS';
				default:
					return 'unknown';
			}
		} else {
			// web 环境（有新的 navigator.userAgentData 可以代替 platform）
			if (navigator.userAgent.match(/(Android)\s+([\d.]+)/)) {
				return 'Android';
			}
			if (navigator.userAgent.match(/(iPad).*OS\s([\d_]+)/)) {
				return 'iPadOS';
			}
			if (navigator.userAgent.match(/(iPhone\sOS)\s([\d_]+)/)) {
				return 'iOS';
			}
			if (navigator.platform.indexOf('Win') >= 0) {
				return 'Windows';
			}
			if (navigator.platform.indexOf('Mac') >= 0) {
				return 'MacOS';
			}
			if (navigator.platform.indexOf('Linux') >= 0) {
				return 'Linux';
			}
			if (navigator.platform.indexOf('X11') >= 0) {
				return 'Unix';
			}
			return 'unknown';
		}
	},

	jumpToUrl(url: string): void {
		if (this.isElectron) {
			switch (this.os) {
				case 'MacOS':
					this.exec('open ' + url);
					break;
				case 'Windows':
					this.exec('start ' + url);
					break;
				case 'Linux':
					this.exec('xdg-open', [url]);
					break;
				default:
					window.open(url);
					break;
			}
		} else {
			window.open(url);
		}
	},

	openFile(url: string): void {
		if (!this.isElectron) {
			return;
		}
		switch (this.os) {
			case 'MacOS':
				this.exec(url);
				break;
			case 'Windows':
				this.exec(url);
				break;
			case 'Linux':
				this.exec(url);
				break;
			default:
				window.open(url);
				break;
		}
	},

	flashFrame(value = true): void {
		ipcRenderer?.send('flashFrame', value);
	},

	openDevTools(): void {
		ipcRenderer?.send('openDevTools');
	}
}
