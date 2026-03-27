<template>
	<view class="custom-tabbar">
		<!-- 导航栏整体容器 -->
		<view class="tabbar-container">
			<!-- 导航项 -->
			<view
				v-for="(item, index) in tabList"
				:key="index"
				class="tab-item"
				:class="{ active: currentIndex === index }"
				@click="switchTab(index)"
			>
				<!-- 小胶囊椭圆背景 -->
				<view
					class="capsule-bg"
					:class="{ active: currentIndex === index }"
				>
					<text class="tab-text">{{ item.text }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'CustomTabbar',
	props: {
		currentIndex: {
			type: Number,
			default: 0
		},
		tabList: {
			type: Array,
			default: () => [
				{ text: '首页' },
				{ text: '设备' },
				{ text: '我的' }
			]
		}
	},
	methods: {
		switchTab(index) {
			this.$emit('tab-change', index)
		}
	}
}
</script>

<style scoped>
/* 导航栏整体容器样式 - 大胶囊椭圆形外框 */
.tabbar-container {
	/* 大胶囊椭圆形外框 */
	background-color: #ffffff;
	border-radius: 100rpx;
	border: 2rpx solid #e0e0e0;

	/* 浅底色 */
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

	/* 内部水平间距 */
	padding: 10rpx 20rpx;

	/* 固定高度和宽度 */
	height: 120rpx;
	width: 90%;
	max-width: 750rpx;

	/* 居中显示 */
	margin: 20rpx auto;

	/* Flex布局 */
	display: flex;
	align-items: center;
	justify-content: space-around;

	/* 确保在页面底部 */
	position: fixed;
	bottom: 20rpx;
	left: 50%;
	transform: translateX(-50%);
	z-index: 999;
}

/* 导航项样式 */
.tab-item {
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;

	/* 确保点击区域足够大 */
	min-width: 150rpx;
}

/* 小胶囊椭圆形背景 */
.capsule-bg {
	/* 小胶囊椭圆形 */
	background-color: transparent;
	border-radius: 100rpx;

	/* 默认边框透明 */
	border: 2rpx solid transparent;

	/* 文字居中 */
	display: flex;
	justify-content: center;
	align-items: center;

	/* 内部填充 */
	padding: 10rpx 24rpx;

	/* 过渡动画 */
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	/* 悬停效果 */
	cursor: pointer;
}

/* 激活状态下的小胶囊椭圆 */
.capsule-bg.active {
	/* 激活时的背景色 */
	background-color: #34C759;

	/* 激活时的边框 */
	border-color: #34C759;

	/* 激活时的文字颜色 */
	color: white;
}

/* 导航文字样式 */
.tab-text {
	font-size: 24rpx;
	font-weight: 500;
	color: #666666;

	/* 激活状态文字颜色 */
	transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 激活状态下的文字 */
.capsule-bg.active .tab-text {
	color: white;
}

/* 悬停效果 */
.tab-item:hover .capsule-bg {
	transform: scale(1.05);
}

/* 激活状态悬停效果 */
.tab-item:hover .capsule-bg.active {
	transform: scale(1.05);
}

/* 点击反馈效果 */
.tab-item:active .capsule-bg {
	transform: scale(0.95);
}

/* 激活状态点击反馈效果 */
.tab-item:active .capsule-bg.active {
	transform: scale(0.95);
}
</style>