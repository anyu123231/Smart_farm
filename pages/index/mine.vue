<template>
	<view class="content">
		<!-- 顶部退出按钮（仅登录状态显示） -->
		<view v-if="isLoggedIn" class="header">
			<view class="login-btn" @click="handleLoginLogout">
				<text class="login-text">退出</text>
			</view>
		</view>
		
		<view class="user-info">
			<image class="avatar" :src="avatar || '/static/logo.png'"></image>
			<!-- 未登录时显示登录按钮，登录时显示用户名 -->
			<view v-if="!isLoggedIn" class="login-btn user-login-btn" @click="handleLoginLogout">
				<text class="login-text">登录</text>
			</view>
			<text v-else class="username">{{ username }}</text>
		</view>
		<view class="menu-list">
			<view class="menu-item" v-for="(item, index) in menuList" :key="index" @click="handleMenuClick(item)">
				<text class="menu-icon">{{ item.icon }}</text>
				<text class="menu-text">{{ item.text }}</text>
				<text class="menu-arrow">></text>
			</view>
		</view>
		

	</view>
</template>

<script>
	// 导入 TabBar 组件
	import TabBar from '../components/TabBar.vue'
	export default {
		components: {
			TabBar // 注册 TabBar 组件
		},
		data() {
			return {
				isLoggedIn: false, // 登录状态
				username: '', // 用户名
				avatar: '', // 头像
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
					},
					{
						icon: '🚪',
						text: '注销'
					}
				]
			}
		},
		onLoad() {
			// 页面加载时检查登录状态
			this.checkLoginStatus();
		},
		onShow() {
			// 页面显示时检查登录状态，确保登录后信息更新
			this.checkLoginStatus();
		},
		methods: {
			// 检查登录状态
			checkLoginStatus() {
				const token = uni.getStorageSync('token');
				const user = uni.getStorageSync('userInfo');
				if (token && user) {
					this.isLoggedIn = true;
					this.username = user.username;
					this.avatar = user.avatar;
				} else {
					this.isLoggedIn = false;
					this.username = '';
					this.avatar = '';
				}
			},
			
			// 处理登录/退出点击
			handleLoginLogout() {
				if (!this.isLoggedIn) {
					// 未登录，跳转到登录页面
					uni.navigateTo({
						url: '/pages/index/login'
					});
				} else {
					// 已登录，退出登录
					uni.showModal({
						title: '退出确认',
						content: '确定要退出登录吗？',
						confirmText: '确定',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								// 清除本地存储
								uni.removeStorageSync('token');
								uni.removeStorageSync('userInfo');
								this.isLoggedIn = false;
								this.username = '';
								this.avatar = '';
								uni.showToast({
									title: '退出成功',
									icon: 'success'
								});
							}
						}
					});
				}
			},
			
			// 处理菜单点击
			handleMenuClick(item) {
				if (item.text === '注销') {
					// 提示用户确认注销
					uni.showModal({
						title: '注销确认',
						content: '确定要注销并删除账户吗？',
						confirmText: '确定',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								// 调用注销API
								this.logout();
							}
						}
					});
				} else if (item.text === '设置') {
					// 跳转到设置页面
					// 这里可以添加设置页面的跳转逻辑
				}
			},
			
			// 注销并删除用户
			logout() {
				const token = uni.getStorageSync('token');
				if (!token) {
					uni.showToast({
						title: '未登录',
						icon: 'none'
					});
					return;
				}
				
				// 调用注销API
				uni.request({
					url: 'http://175.24.203.151:3000/api/user/delete',
					method: 'DELETE',
					header: {
						'Authorization': `Bearer ${token}`
					},
					success: (res) => {
						if (res.data.code === 200) {
							// 清除本地存储
							uni.removeStorageSync('token');
							uni.removeStorageSync('userInfo');
							this.isLoggedIn = false;
							this.username = '';
							this.avatar = '';
							uni.showToast({
								title: '注销成功',
								icon: 'success'
							});
						} else {
							uni.showToast({
								title: res.data.message || '注销失败',
								icon: 'none'
							});
						}
					},
					fail: (err) => {
						uni.showToast({
							title: '网络错误',
							icon: 'none'
						});
					}
				});
			}
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding-bottom: 120rpx;
	}

	.header {
		padding: 20rpx;
		background-color: rgba(255, 255, 255, 0.9);
		text-align: left;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		backdrop-filter: blur(10rpx);
	}

	.login-btn {
		display: inline-block;
		padding: 12rpx 24rpx;
		background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
		color: white;
		border-radius: 25rpx;
		font-size: 28rpx;
		font-weight: 600;
		transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
	}

	.login-btn:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 6rpx rgba(76, 175, 80, 0.3);
	}

	.login-text {
		font-size: 28rpx;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60rpx 0;
		background-color: rgba(255, 255, 255, 0.95);
		margin: 20rpx;
		border-radius: 30rpx;
		backdrop-filter: blur(10rpx);
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	}

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		margin-bottom: 20rpx;
		border: 3rpx solid #4CAF50;
		box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
		transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.avatar:hover {
		transform: scale(1.1);
	}

	.username {
		font-size: 36rpx;
		color: #333333;
		font-weight: 700;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	/* 用户名称位置的登录按钮样式 */
	.user-login-btn {
		margin-top: 20rpx;
		padding: 15rpx 40rpx;
		font-size: 32rpx;
	}

	.menu-list {
		display: flex;
		flex-direction: column;
		background-color: rgba(255, 255, 255, 0.95);
		margin: 0 20rpx;
		border-radius: 30rpx;
		backdrop-filter: blur(10rpx);
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
		transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		position: relative;
		overflow: hidden;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-item:active {
		background-color: rgba(0, 0, 0, 0.05);
		transform: translateX(10rpx);
	}

	.menu-icon {
		font-size: 40rpx;
		margin-right: 20rpx;
		z-index: 1;
	}

	.menu-text {
		flex: 1;
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
		z-index: 1;
	}

	.menu-arrow {
		font-size: 32rpx;
		color: #999999;
		z-index: 1;
		transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.menu-item:active .menu-arrow {
		transform: translateX(5rpx);
	}
</style>
