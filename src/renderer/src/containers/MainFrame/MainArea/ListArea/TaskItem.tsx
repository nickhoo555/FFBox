import { computed, defineComponent, defineProps, FunctionalComponent, onBeforeUnmount, ref, Transition, VNodeRef, watch, onUnmounted, toRef, onMounted, StyleValue } from 'vue'; // defineComponent 的主要功能是提供类型检查
import { TaskStatus, TransferStatus } from '@common/types';
import { UITask } from '@renderer/types'
import { generator as vGenerator } from '@common/params/vcodecs';
import { generator as aGenerator } from '@common/params/acodecs';
import { useAppStore } from '@renderer/stores/appStore';
import Tooltip from '@renderer/components/Tooltip/Tooltip';
import nodeBridge from '@renderer/bridges/nodeBridge';
import { stringifyTimeValue } from '@common/utils';
import { getOutputDuration } from '@renderer/common/dashboardCalc';
import IconPreview from '@renderer/assets/video.svg';
import IconRightArrow from '@renderer/assets/mainArea/swap_right.svg';
import style from './TaskItem.module.less';

interface Props {
	task: UITask;
	id: number;
	selected?: boolean;
	shouldHandleHover?: boolean;	// 如果正在多选，或者单选但选的不是自己，那么不响应悬浮
	onClick?: (event: MouseEvent) => any;
	onDblClick?: (event: MouseEvent) => any;
	onPauseOrRemove?: () => any;
}

export const TaskItem = defineComponent((props: Props) => {
	const appStore = useAppStore();
	const settings = appStore.taskViewSettings;

	// #region 预先计算以减少下方计算量

	const outputDuration = computed(() => getOutputDuration(props.task));

	// #endregion

	// #region 参数

	const beforeBitrateFilter = (kbps: number) => {
		if (isNaN(kbps)) {
			return '读取中';
		} else {
			const bps = kbps * 1000;
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
		}
	};
	const durationBefore = computed(() => stringifyTimeValue(props.task.before.duration));
	const durationAfter = computed(() => stringifyTimeValue(outputDuration.value));
	const smpteBefore = computed(() => props.task.before.vresolution && props.task.before.vframerate ? `${props.task.before.vresolution.replace('<br />', '×')}@${props.task.before.vframerate}` : '-');
	const videoRateControlValue = computed(() => vGenerator.getRateControlParam(props.task.after.video).value);
	const audioRateControlValue = computed(() => aGenerator.getRateControlParam(props.task.after.audio).value);
	const videoRateControl = computed(() => (videoRateControlValue.value === '-' ? '' : `@${props.task.after.video.ratecontrol} ${videoRateControlValue.value}`));
	const audioRateControl = computed(() => (audioRateControlValue.value === '-' ? '' : `@${props.task.after.audio.ratecontrol} ${audioRateControlValue.value}`));
	const videoInputBitrate = computed(() => props.task.before.vbitrate > 0 ? `@${beforeBitrateFilter(props.task.before.vbitrate)}` : '');
	const audioInputBitrate = computed(() => props.task.before.abitrate > 0 ? `@${beforeBitrateFilter(props.task.before.abitrate)}` : '');

	// #endregion

	// #region 仪表盘

	const graphBitrateFilter = (kbps: number) => {
		const bps = kbps * 1000;
		if (window.frontendSettings.useIEC) {
			if (bps >= 10 * 1024 ** 2) {
				return (bps / 1024 ** 2).toFixed(1) + ' M';
			} else {
				return (bps / 1024 ** 2).toFixed(2) + ' M';
			}
		} else {
			if (bps >= 10 * 1000 ** 2) {
				return (bps / 1000 ** 2).toFixed(1) + ' M';
			} else {
				return (bps / 1000 ** 2).toFixed(2) + ' M';
			}
		}
	};
	const graphBitrate = computed(() => graphBitrateFilter(props.task.dashboard_smooth.bitrate));
	const speedFilter = (value: number) => {
		if (value < 10) {
			return value.toFixed(2) + ' ×';
		} else {
			return value.toFixed(1) + ' ×';
		}
	};
	const graphSpeed = computed(() => speedFilter(props.task.dashboard_smooth.speed));
	const timeFilter = (value: number, withDecimal = true) => {
		let left = value;
		let hour = Math.floor(left / 3600); left -= hour * 3600;
		let minute = Math.floor(left / 60); left -= minute * 60;
		let second = left;
		if (hour) {
			return `${hour}:${minute.toString().padStart(2, '0')}:${second.toFixed(0).toString().padStart(2, '0')}`;
		} else if (minute) {
			return `${minute}:${withDecimal ? second.toFixed(1).padStart(4, '0') : second.toFixed(0).padStart(2, '0')}`;
		} else {
			return withDecimal ? second.toFixed(2) : `${second.toFixed(0)} s`;
		}
	};
	const graphTime = computed(() => timeFilter(props.task.dashboard_smooth.time));
	const graphLeftTime = computed(() => {
		const totalDuration = outputDuration.value;
		const needTime = totalDuration / props.task.dashboard_smooth.speed;
		const remainTime = (totalDuration - props.task.dashboard_smooth.time) / totalDuration * needTime;	// 剩余进度比例 * 全进度耗时
		return timeFilter(remainTime, false);
	});
	const graphSizeFilter = (kB: number) => {
		const B = kB * 1000;
		if (window.frontendSettings.useIEC) {
			if (B >= 10 * 1024 ** 3) {
				return (B / 1024 ** 3).toFixed(1) + ' GiB';
			} else if (B >= 1024 ** 3) {
				return (B / 1024 ** 3).toFixed(2) + ' GiB';
			} else if (B >= 100 * 1024 ** 2) {
				return (B / 1024 ** 2).toFixed(0) + ' MiB';
			} else if (B >= 10 * 1024 ** 2) {
				return (B / 1024 ** 2).toFixed(1) + ' MiB';
			} else {
				return (B / 1024 ** 2).toFixed(2) + ' MiB';
			}
		} else {
			if (B >= 10 * 1000 ** 3) {
				return (B / 1000 ** 3).toFixed(1) + ' GB';
			} else if (B >= 1000 ** 3) {
				return (B / 1000 ** 3).toFixed(2) + ' GB';
			} else if (B >= 100 * 1000 ** 2) {
				return (B / 1000 ** 2).toFixed(0) + ' MB';
			} else if (B >= 10 * 1000 ** 2) {
				return (B / 1000 ** 2).toFixed(1) + ' MB';
			} else {
				return (B / 1000 ** 2).toFixed(2) + ' MB';
			}
		}
	};
	const graphSize = computed(() => graphSizeFilter(props.task.dashboard_smooth.size));
	const transferSpeedFilter = (kBps: number) => {
		const Bps = kBps * 1000;
		if (window.frontendSettings.useIEC) {
			if (Bps >= 100 * 1024 ** 2) {
				return (Bps / 1024 ** 2).toFixed(0) + ' MiB';
			} else if (Bps >= 10 * 1024 ** 2) {
				return (Bps / 1024 ** 2).toFixed(1) + ' MiB';
			} else if (Bps >= 1024 ** 2) {
				return (Bps / 1024 ** 2).toFixed(2) + ' MiB';
			} else {
				return (Bps / 1024).toFixed(0) + ' KiB';
			}
		} else {
			if (Bps >= 100 * 1000 ** 2) {
				return (Bps / 1000 ** 2).toFixed(0) + ' MB';
			} else if (Bps >= 10 * 1000 ** 2) {
				return (Bps / 1000 ** 2).toFixed(1) + ' MB';
			} else if (Bps >= 1000 ** 2) {
				return (Bps / 1000 ** 2).toFixed(2) + ' MB';
			} else {
				return (Bps / 1000).toFixed(0) + ' KB';
			}
		}
	};
	const graphTransferSpeed = computed(() => transferSpeedFilter(props.task.dashboard_smooth.transferSpeed));
	const graphTransferred = computed(() => graphSizeFilter(props.task.dashboard_smooth.transferred / 1000));

	/** 圆环 style 部分
	 *  计算方式：(log(数值) / log(底，即每增长多少倍数为一格) + 数值为 1 时偏移多少格) / 格数
	 *  　　　或：(log(数值 / 想要以多少作为最低值) / log(底，即每增长多少倍数为一格)) / 格数
	 */
	const graphBitrateStyle = computed(() => {
		let value = Math.log(props.task.dashboard_smooth.bitrate / 62.5) / Math.log(8) / 4;		// 62.5K, 500K, 4M, 32M, 256M
		value = Math.min(Math.max(value, 0), 1);
		return `background: conic-gradient(var(--primaryColor) 0%, var(--primaryColor) ${value * 75}%, hwb(var(--opposite80) / 0.1) ${value * 75}%, hwb(var(--opposite80) / 0.1) 75%, transparent 75%)`;
	});
	const graphSpeedStyle = computed(() => {
		let value = Math.log(props.task.dashboard_smooth.speed / 0.04) / Math.log(5) / 6;			// 0.04, 0.2, 1, 5, 25, 125, 625
		value = Math.min(Math.max(value, 0), 1);
		return `background: conic-gradient(var(--primaryColor) 0%, var(--primaryColor) ${value * 75}%, hwb(var(--opposite80) / 0.1) ${value * 75}%, hwb(var(--opposite80) / 0.1) 75%, transparent 75%)`;
	});
	const graphTransferSpeedStyle = computed(() => {
		let value = Math.log(props.task.dashboard_smooth.transferSpeed / 62.5) / Math.log(10) / 4;	// 62.5K, 500K, 4M, 32M, 256M, 512M, 1024M
		value = Math.min(Math.max(value, 0), 1);
		return `background: conic-gradient(var(--primaryColor) 0%, var(--primaryColor) ${value * 75}%, hwb(var(--opposite80) / 0.1) ${value * 75}%, hwb(var(--opposite80) / 0.1) 75%, transparent 75%)`;
	});

	const overallProgress = computed(() => props.task.transferStatus === 'normal' ? props.task.dashboard_smooth.progress : props.task.dashboard_smooth.transferred / props.task.transferProgressLog.total);
	// const overallProgress = { value: 0.99 };
	const overallProgressDescription = computed(() => props.task.transferStatus === 'normal' ? '转码进度' : '上传进度');

	// #endregion

	// #region 其他样式

	const showDashboard = computed(() => [TaskStatus.TASK_RUNNING, TaskStatus.TASK_PAUSED, TaskStatus.TASK_STOPPING].includes(props.task.status) || props.task.transferStatus !== TransferStatus.normal);
	const dashboardType = computed(() => showDashboard ? (props.task.transferStatus !== TransferStatus.normal ? 'transfer' : 'convert') : 'none');

	const taskNameStyle = computed(() => {
		const width = (() => {
			if (windowWidth.value >= 920) {
				let shrinkSpace = 80;
				shrinkSpace += [0, 13 + 96, 13 + 96 + 14 + 120 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.audio)];
				shrinkSpace += [0, 13 + 96, 13 + 96 + 14 + 120 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.video)];
				shrinkSpace += [0, 13 + 88, 13 + 88 + 14 + 88 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.smpte)];
				shrinkSpace += [0, 13 + 36, 13 + 36 + 14 + 36 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.format)];
				shrinkSpace += [0, 13 + 64, 13 + 64 + 14 + 64 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.duration)];
				if (showDashboard.value) {
					shrinkSpace = Math.max(shrinkSpace, 720);
				}
				return `max(calc(100% - ${shrinkSpace}px), 64px)`;
			} else {
				return 'calc(100% - 188px)';
			}
		})();
		return {
			...(showDashboard.value && windowWidth.value >= 920 ? {} : { maxHeight: '26px', '-webkit-line-clamp': 1 }),
			width,
			...(!showDashboard.value ? { fontSize: '16px' } : {}),	// 不显示 dashboard 时不允许文字放大
			...(props.shouldHandleHover ? { pointerEvents: 'all' } : undefined),
		};
	}) as any;

	const deleteButtonBackgroundPositionX = computed(() => {
		switch (props.task.status) {
			case TaskStatus.TASK_STOPPED:
				return '0px';	// 删除按钮
			case TaskStatus.TASK_RUNNING:
				return '-100%';	// 暂停按钮
			case TaskStatus.TASK_PAUSED: case TaskStatus.TASK_STOPPING: case TaskStatus.TASK_FINISHING: case TaskStatus.TASK_FINISHED: case TaskStatus.TASK_ERROR:
				return '-200%';	// 重置按钮
		}
		return '';
	});

	/** 整个任务项的高度，包括上下 margin */
	const taskHeight = computed(() => {
		let height = 4;
		height += settings.showParams ? 24 : 0;
		height += showDashboard.value ? 72 : 0;
		height += settings.showCmd ? 64 : 0;
		height = Math.max(24, height);
		return height;
	});

	const taskBackgroundStyle = computed(() => {
		if (props.selected) {
			return {
				background: 'hwb(var(--menuItemHovered))',
				border: 'hwb(var(--menuItemSelected)) 1px solid',
			};
		} else {
			return {};
		}
	});

	const taskBackgroundProgressStyle = computed(() => ({
		width: (props.task.transferStatus === 'normal' ? props.task.dashboard_smooth.progress : props.task.dashboard_smooth.transferred / props.task.transferProgressLog.total) * 100 + '%' }
	));

	// #endregion

	// #region 体验优化

	const cmdRef = ref<HTMLTextAreaElement>(null);
	const cmdText = computed(() => settings.cmdDisplay === 'input' ? ['ffmpeg', ...props.task.paraArray].join(' ') : props.task.cmdData);
	watch(() => props.task.cmdData, () => {
		const elem = cmdRef.value;
		if (elem) {
			const scrollBottom = elem?.scrollTop + elem.getBoundingClientRect().height;
			if (elem.scrollHeight - scrollBottom < 1) {
				setTimeout(() => {
					elem.scrollTo(0, Number.MAX_SAFE_INTEGER);
				}, 0);
			}
		}
	});
	watch(() => settings.cmdDisplay, (value) => {
		const elem = cmdRef.value;
		if (value === 'output' && elem) {
			setTimeout(() => {
				elem.scrollTo(0, Number.MAX_SAFE_INTEGER);
			}, 0);
		}
	})

	const taskNameRef = ref<HTMLDivElement>(null);
	const paramAreaRef = ref<HTMLDivElement>(null);
	// 监听窗口宽度变化
	const windowWidth = ref(0);
	const windowWidthListener = ref<() => void>(() => {
		windowWidth.value = window.innerWidth;
	});
	onMounted(() => {
		window.addEventListener('resize', windowWidthListener.value);
		windowWidthListener.value();
	});
	onBeforeUnmount(() => {
		window.removeEventListener('resize', windowWidthListener.value);
	});

	// #endregion

	const handleTaskMouseEnter = (event: MouseEvent) => {
		if (props.task.status === TaskStatus.TASK_FINISHED) {
			Tooltip.show({
				content: `双击以${appStore.currentServer.entity.ip === 'localhost' ? '打开' : '下载'}输出文件`,
				style: {
					right: `calc(100vw - ${event.pageX}px)`,
					top: `${event.pageY}px`,
				},
			})
		}
	};

	const handleTaskDblClicked = (event: MouseEvent) => {
		const serverName = appStore.currentServer.data.name;
		const bridge = appStore.currentServer.entity;
		if (props.task.status === TaskStatus.TASK_FINISHED && props.task.transferStatus === TransferStatus.normal) {
			if (appStore.currentServer.entity.ip === 'localhost') {
				nodeBridge.openFile(`"${props.task.outputFile}"`);
			} else {
				const url = `http://${bridge.ip}:${bridge.port}/download/${props.task.outputFile}`;
				if (nodeBridge.env === 'electron') {
					nodeBridge.ipcRenderer?.send('downloadFile', { url, serverName, taskId: props.id });
					appStore.downloadMap.set(url, { serverId: appStore.currentServer.data.id, taskId: props.id });
				} else {
					const elem = document.createElement('a');
					elem.href = url;
					elem.click();
				}
			}
			Tooltip.hide();
		}
	};

	const handleParaAreaMouseEnter = (event: MouseEvent) => {
		const paramAreaPos = paramAreaRef.value.getBoundingClientRect();
		const position = window.innerWidth >= 920 ? { right: `${Math.min(window.innerWidth - event.pageX, window.innerWidth - 400)}px`, top: `${paramAreaPos.top}px` } : { right: '48px', top: `${paramAreaPos.top}px` };
		Tooltip.show({
			content: <span>
				时长：{durationBefore.value} → {durationAfter.value}<br />
				容器：{props.task.before.format} → {props.task.after.output.format}<br />
				规格：{smpteBefore.value} → {props.task.after.video.resolution}@{props.task.after.video.framerate}<br />
				视频：{props.task.before.vcodec}{videoInputBitrate.value} → {props.task.after.video.vcodec}{videoRateControl.value}<br />
				音频：{props.task.before.acodec}{audioInputBitrate.value} → {props.task.after.audio.acodec}{audioRateControl.value}<br />
			</span>,
			style: position,
			class: style.paraAreaTip,
		});
	};

	const handleTaskNameMouseEnter = (event: MouseEvent) => {
		const taskNamePos = taskNameRef.value.getBoundingClientRect();
		const position = { left: `44px`, top: `${taskNamePos.top}px`, maxWidth: `calc(100% - 88px)` };
		Tooltip.show({
			content: props.task.fileBaseName ?? '读取中',
			style: position,
			class: style.taskNameTip,
		});
	};

	return () => (
		<div class={style.taskWrapper1} onClick={props.onClick}>
			<div class={style.taskWrapper2}>
				<div
					class={style.task}
					style={{ height: `${taskHeight.value}px` }}
					data-color_theme={appStore.frontendSettings.colorTheme}
					onMouseenter={handleTaskMouseEnter}
					onMouseleave={() => Tooltip.hide()}
					onDblclick={handleTaskDblClicked}
				>
					<div class={style.backgroundWhite} style={taskBackgroundStyle.value} />
					<div class={`${style.backgroundProgress} ${style.progressBlue}`} style={{ ...taskBackgroundProgressStyle.value, opacity: props.task.status === TaskStatus.TASK_INITIALIZING ? 1: 0}} />
					<div class={`${style.backgroundProgress} ${style.progressGreen}`} style={{ ...taskBackgroundProgressStyle.value, opacity: [TaskStatus.TASK_RUNNING, TaskStatus.TASK_FINISHING].includes(props.task.status) ? 1: 0}} />
					<div class={`${style.backgroundProgress} ${style.progressYellow}`} style={{ ...taskBackgroundProgressStyle.value, opacity: [TaskStatus.TASK_PAUSED, TaskStatus.TASK_STOPPING].includes(props.task.status) ? 1: 0}} />
					<div class={`${style.backgroundProgress} ${style.progressGray}`} style={{ ...taskBackgroundProgressStyle.value, opacity: [TaskStatus.TASK_FINISHED, TaskStatus.TASK_STOPPED].includes(props.task.status) ? 1: 0}} />
					<div class={`${style.backgroundProgress} ${style.progressRed}`} style={{ ...taskBackgroundProgressStyle.value, opacity: props.task.status === TaskStatus.TASK_ERROR ? 1: 0}} />
					<div class={style.previewIcon} style={{ bottom: settings.showCmd ? '66px' : undefined}}>
						<IconPreview />
					</div>
					<div
						class={style.taskName}
						style={taskNameStyle.value}
						ref={taskNameRef}
						onMouseenter={handleTaskNameMouseEnter}
						onMouseleave={() => Tooltip.hide()}
					>
						{props.task.fileBaseName ?? '读取中'}
					</div>
					{settings.showParams && (
						<div
							class={style.paraArea}
							style={{ maxWidth: windowWidth.value >= 920 ? 'calc(100% - 128px)' : 'calc(0% + 120px)', pointerEvents: props.shouldHandleHover ? 'all' : undefined }}
							ref={paramAreaRef}
							onMouseenter={handleParaAreaMouseEnter}
							onMouseleave={() => Tooltip.hide()}
						>
							{windowWidth.value >= 920 ? (
								<>
									{/* 时间 */}
									<div class={style.divider}><div></div></div>
									<div class={style.durationBefore}>{durationBefore.value}</div>
									{settings.paramsVisibility.duration === 'all' && (
										<>
											<div class={style.durationTo}><IconRightArrow /></div>
											<div class={style.durationAfter}>{durationAfter.value}</div>
										</>
									)}
									{/* 容器 */}
									<div class={style.divider}><div></div></div>
									<div class={style.formatBefore}>{props.task.before.format}</div>
									{settings.paramsVisibility.format === 'all' && (
										<>
											<div class={style.formatTo}><IconRightArrow /></div>
											<div class={style.formatAfter}>{props.task.after.output.format}</div>
										</>
									)}
									{/* 分辨率码率 */}
									{settings.paramsVisibility.smpte !== 'none' && (
										<>
											<div class={style.divider}><div></div></div>
											<div class={style.smpteBefore}>{smpteBefore.value}</div>
											{settings.paramsVisibility.smpte === 'all' && (
												<>
													<div class={style.smpteTo}><IconRightArrow /></div>
													<div class={style.smpteAfter}>{props.task.after.video.resolution}@{props.task.after.video.framerate}</div>
												</>
											)}
										</>
									)}
									{/* 视频 */}
									{settings.paramsVisibility.video !== 'none' && (
										<>
											<div class={style.divider}><div></div></div>
											<div class={style.videoBefore}>{props.task.before.vcodec}{videoInputBitrate.value}</div>
											{settings.paramsVisibility.video === 'all' && (
												<>
													<div class={style.videoTo}><IconRightArrow /></div>
													<div class={style.videoAfter}>{props.task.after.video.vcodec}{videoRateControl.value}</div>
												</>
											)}
										</>
									)}
									{/* 音频 */}
									{settings.paramsVisibility.audio !== 'none' && (
										<>
											<div class={style.divider}><div></div></div>
											<div class={style.audioBefore}>{props.task.before.acodec}{audioInputBitrate.value}</div>
											{settings.paramsVisibility.audio === 'all' && (
												<>
													<div class={style.audioTo}><IconRightArrow /></div>
													<div class={style.audioAfter}>{props.task.after.audio.acodec}{audioRateControl.value}</div>
												</>
											)}
										</>
									)}
								</>
							) : (
								<>
									{/* 预设 */}
									<div class={style.divider}><div></div></div>
									<div class={style.videoBefore}>{props.task.after.extra?.presetName === undefined ? '查看配置' : props.task.after.extra.presetName || '自定义配置'}</div>
								</>
							)}
						</div>
					)}
					<Transition enterActiveClass={style['dashboardTrans-enter-active']} leaveActiveClass={style['dashboardTrans-leave-active']}>
						{showDashboard.value && (
							<div class={style.dashboardArea}>
								{dashboardType.value === 'convert' ? (
									<>
										<div class={style.linearGraphItems}>
											<div class={style.linearGraphItem}>
												<span class={style.data}>{ graphTime.value }</span>
												<span class={style.description}>时间</span>
											</div>
											<div class={style.linearGraphItem}>
												<span class={style.data}>{ props.task.dashboard_smooth.frame.toFixed(0) }</span>
												<span class={style.description}>帧</span>
											</div>
										</div>
										<div class={style.roundGraphItem}>
											<div class={style.ring} style={graphBitrateStyle.value}></div>
											<span class={style.data}>{ graphBitrate.value }</span>
											<span class={style.description}>码率</span>
										</div>
										<div class={style.roundGraphItem}>
											<div class={style.ring} style={graphSpeedStyle.value}></div>
											<span class={style.data}>{ graphSpeed.value }</span>
											<span class={style.description}>速度</span>
										</div>
										<div class={style.textItem}>
											<span class={style.data}>{ graphSize.value }</span>
											<span class={style.description}>输出大小</span>
										</div>
									</>
								) : (
									<>
										<div class={style.roundGraphItem}>
											<div class={style.ring} style={graphTransferSpeedStyle.value}></div>
											<span class={style.data}>{ graphTransferSpeed.value }</span>
											<span class={style.description}>传输秒速</span>
										</div>
										<div class={style.textItem}>
											<span class={style.data}>{graphTransferred.value}</span>
											<span class={style.description}>传输总量</span>
										</div>
									</>
								)}
								<div class={style.textItem}>
									<span class={style.data}>{ graphLeftTime.value }</span>
									<span class={style.description}>预计剩余时间</span>
								</div>
								<div class={style.textItem}>
									<span class={`${style.data} ${style.dataLarge}`}>{ overallProgress.value === 1 ? '🆗' : `${(overallProgress.value * 100).toFixed(1)}%` }</span>
									<span class={style.description}>{ overallProgressDescription.value }</span>
								</div>
							</div>
						)}
					</Transition>
					{settings.showCmd && (
						<div class={style.cmdArea} style={{ top: `${(settings.showParams ? 1 : 0) * 24 + (showDashboard.value ? 1 : 0) * 72 + 2}px` }}>
							<div class={style.margin}>
								<div class={style.switch}>
									<button
										class={`${style.item} ${settings.cmdDisplay === 'input' ? style.itemSelected : ''}`}
										onMousedown={() => settings.cmdDisplay = 'input'}
									>
										输入
									</button>
									<button
										class={`${style.item} ${settings.cmdDisplay === 'output' ? style.itemSelected : ''}`}
										onMousedown={() => settings.cmdDisplay = 'output'}
									>
										输出
									</button>
								</div>
								<div class={style.code}>
									<textarea
										aria-label="任务命令行"
										readonly
										value={cmdText.value}
										ref={cmdRef}
									/>
								</div>
							</div>
						</div>
					)}
					<div class={style.vline} style={{ bottom: settings.showCmd ? '66px' : undefined}}><div></div></div>
					<button aria-label='重置或删除任务' class={style.button} style={{ bottom: settings.showCmd ? '64px' : undefined}} onClick={props.onPauseOrRemove}>
						<div style={{ backgroundPositionX: deleteButtonBackgroundPositionX.value }}></div>
					</button>
				</div>
			</div>
		</div>

	);
}, {
	props: ['task', 'id', 'selected', 'shouldHandleHover', 'onClick', 'onDblClick', 'onPauseOrRemove'],
});
