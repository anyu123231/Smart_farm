<template>
	<view class="content">
		<view class="user-info">
			<image class="avatar" src="/static/logo.png"></image>
			<text class="username">用户名称</text>
		</view>
		<view class="menu-list">
			<view class="menu-item" v-for="(item, index) in menuList" :key="index">
				<text class="menu-icon">{{ item.icon }}</text>
				<text class="menu-text">{{ item.text }}</text>
				<text class="menu-arrow">></text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				menuList: [
					{
						icon: '⚙️',
						text: '设置'
					},
					{
						icon: '📊',
						text: '数据统计'
					},
					{
						icon: '🔔',
						text: '消息通知'
					},
					{
						icon: '❓',
						text: '帮助与反馈'
					},
					{
						icon: 'ℹ️',
						text: '关于我们'
					}
				]
			}
		},
		onLoad() {

		},
		methods: {

		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 120rpx;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60rpx 0;
		background-color: #ffffff;
		margin-bottom: 20rpx;
	}

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		margin-bottom: 20rpx;
		border: 2rpx solid #e0e0e0;
	}

	.username {
		font-size: 36rpx;
		color: #333333;
		font-weight: bold;
	}

	.menu-list {
		display: flex;
		flex-direction: column;
		background-color: #ffffff;
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		transition: background-color 0.3s ease;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-item:active {
		background-color: #f5f5f5;
	}

	.menu-icon {
		font-size: 40rpx;
		margin-right: 20rpx;
	}

	.menu-text {
		flex: 1;
		font-size: 32rpx;
		color: #333333;
	}

	.menu-arrow {
		font-size: 32rpx;
		color: #999999;
	}
</style>
