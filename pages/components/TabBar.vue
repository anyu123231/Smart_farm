<template>
	<view class="tab-bar">
		<view 
			class="tab-item" 
			v-for="(item, index) in tabList" 
			:key="index"
			:class="{ active: currentIndex === index }"
			@click="switchTab(index)"
		>
			<image 
				class="tab-icon" 
				:src="currentIndex === index ? item.selectedIcon : item.icon"
				mode="aspectFit"
				@error="handleImageError"
				@load="handleImageLoad"
			></image>
			<text class="tab-text">{{ item.text }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'TabBar',
	data() {
		return {
			currentIndex: 0,
			tabList: [
				{
					text: '首页',
					icon: '/static/icon/indexOFF.png',
					selectedIcon: '/static/icon/indexON.png',
					path: '/pages/index/index'
				},
				{
					text: '设备',
					icon: '/static/icon/devicesOFF.png',
					selectedIcon: '/static/icon/devicesON.png',
					path: '/pages/index/devices'
				},
				{
					text: '我的',
					icon: '/static/icon/mineOFF.png',
					selectedIcon: '/static/icon/mineON.png',
					path: '/pages/index/mine'
				}
			]
		}
	},
	onLoad(options) {
		if (options.index !== undefined) {
			this.currentIndex = parseInt(options.index)
		}
	},
	methods: {
		switchTab(index) {
			this.currentIndex = index
			const tab = this.tabList[index]
			uni.switchTab({
				url: tab.path
			})
		},
		handleImageLoad(e) {
			console.log('图标加载成功:', e)
		},
		handleImageError(e) {
			console.error('图标加载失败:', e)
			console.error('图标路径:', e.target.src)
		}
	}
}
</script>

<style scoped>
.tab-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 100rpx;
	background-color: #ffffff;
	display: flex;
	justify-content: space-around;
	align-items: center;
	border-top: 1rpx solid #e0e0e0;
	box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
	z-index: 999;
}

.tab-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex: 1;
	height: 100%;
	transition: all 0.3s ease;
}

.tab-icon {
	width: 48rpx;
	height: 48rpx;
	margin-bottom: 4rpx;
}

.tab-text {
	font-size: 24rpx;
	color: #666666;
}

.tab-item.active .tab-text {
	color: #007AFF;
	font-weight: bold;
}

.tab-item.active .tab-icon {
	transform: scale(1.1);
}
</style>
