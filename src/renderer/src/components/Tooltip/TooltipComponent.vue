<script setup lang="ts">
import { StyleValue, VNode } from 'vue';

interface Props {
    content: string | VNode;
    style: StyleValue;
	class?: string;
    show: boolean;
}

const props = defineProps<Props>();

</script>

<template>
	<div :style="props.style" :class="`tooltip ${props.class}`">
		<Transition name="tooltipanimate">
			<div v-if="props.show" class="tooltip-box">
				<div class="tooltip-message">
					<span v-if="typeof props.content === 'string'">{{ props.content }}</span>
					<component v-else :is="props.content" />
				</div>
			</div>
		</Transition>
	</div>
</template>


<style scoped>
	.tooltip {
		position: absolute;
		z-index: 100;
        pointer-events: none;
        max-width: calc(200px + 25%);
	}
		.tooltipanimate-enter-from {
			opacity: 0;
		}
		.tooltipanimate-enter-active {
			transition: opacity 0.1s linear;
		}
		.tooltipanimate-enter-to, .tooltipanimate-leave-from {
			opacity: 1;
		}
		.tooltipanimate-leave-active {
			transition: opacity 0.2s linear;
		}
		.tooltipanimate-leave-to {
			opacity: 0;
		}

		.tooltip-box {
			padding: 10px 12px;
			background: hwb(var(--bg98));
			will-change: transform, opacity;
			border: hsl(0, 0%, 67%) 1px solid;
			border-radius: 10px;
			box-shadow: 0px 4px 8px hsla(0, 0%, 0%, 0.3);
			z-index: 5;
		}
			.tooltip-message {
				font-size: 14px;
				line-height: 1.3em;
				text-align: left;
			}

</style>
