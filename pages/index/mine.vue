<template>
	<view class="content">
		<view class="bg-decoration">
			<view class="glow glow-1"></view>
			<view class="glow glow-2"></view>
		</view>
		
		<view v-if="isLoggedIn" class="header">
			<view class="logout-btn" @click="handleLoginLogout">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5252" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
					<polyline points="16 17 21 12 16 7"/>
					<line x1="21" y1="12" x2="9" y2="12"/>
				</svg>
				<text class="logout-text">退出</text>
			</view>
		</view>
		
		<view class="profile-section">
			<view class="avatar-wrapper">
				<image class="avatar" :src="avatar || '/static/logo.png'"></image>
				<view class="avatar-ring"></view>
			</view>
			<view v-if="!isLoggedIn" class="login-btn-wrapper" @click="handleLoginLogout">
				<text class="login-text">点击登录</text>
			</view>
			<view v-else class="user-info-area">
				<text class="username">{{ username }}</text>
				<text class="user-role">设备管理员</text>
			</view>
		</view>
		
		<view class="menu-section">
			<view class="menu-group">
				<view class="menu-item" v-for="(item, index) in menuList" :key="index" @click="handleMenuClick(item)">
					<view class="menu-icon-wrapper" :style="{ background: item.bgColor }">
						<text class="menu-icon-emoji">{{ item.icon }}</text>
					</view>
					<text class="menu-text">{{ item.text }}</text>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#424242" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="9 18 15 12 9 6"/>
					</svg>
				</view>
			</view>
		</view>
		
		<view class="version-info">
			<text class="version-text">智慧农业 v1.0.1</text>
		</view>
	</view>
</template>

<script>
	import TabBar from '../components/TabBar.vue'
	export default {
		components: {
			TabBar
		},
		data() {
			return {
				isLoggedIn: false,
				username: '',
				avatar: '',
				menuList: [
					{
						icon: '⚙',
						text: '设置',
						bgColor: 'rgba(0, 176, 255, 0.1)'
					},
					{
						icon: '📊',
						text: '数据统计',
						bgColor: 'rgba(255, 214, 0, 0.1)'
					},
					{
						icon: '🔔',
						text: '消息通知',
						bgColor: 'rgba(0, 230, 118, 0.1)'
					},
					{
						icon: '❓',
						text: '帮助与反馈',
						bgColor: 'rgba(0, 176, 255, 0.1)'
					},
					{
						icon: 'ℹ',
						text: '关于我们',
						bgColor: 'rgba(176, 190, 197, 0.1)'
					},
					{
						icon: '🚪',
						text: '注销',
						bgColor: 'rgba(255, 82, 82, 0.1)'
					}
				]
			}
		},
		onLoad() {
			this.checkLoginStatus();
		},
		onShow() {
			this.checkLoginStatus();
		},
		methods: {
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
			
			handleLoginLogout() {
				if (!this.isLoggedIn) {
					uni.navigateTo({
						url: '/pages/index/login'
					});
				} else {
					uni.showModal({
						title: '退出确认',
						content: '确定要退出登录吗？',
						confirmText: '确定',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
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
			
			handleMenuClick(item) {
				if (item.text === '注销') {
					uni.showModal({
						title: '注销确认',
						content: '确定要注销并删除账户吗？',
						confirmText: '确定',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								this.logout();
							}
						}
					});
				} else if (item.text === '设置') {
				}
			},
			
			logout() {
				const token = uni.getStorageSync('token');
				if (!token) {
					uni.showToast({
						title: '未登录',
						icon: 'none'
					});
					return;
				}
				
				uni.request({
					url: 'http://175.24.203.151:3000/api/user/delete',
					method: 'DELETE',
					header: {
						'Authorization': `Bearer ${token}`
					},
					success: (res) => {
						if (res.data.code === 200) {
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
	background: #0D0D1A;
	padding-bottom: 120rpx;
	position: relative;
	overflow: hidden;
}

.bg-decoration {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
}

.glow {
	position: absolute;
	border-radius: 50%;
	filter: blur(100rpx);
}

.glow-1 {
	width: 300rpx;
	height: 300rpx;
	background: rgba(0, 230, 118, 0.04);
	top: -60rpx;
	left: -80rpx;
}

.glow-2 {
	width: 200rpx;
	height: 200rpx;
	background: rgba(0, 176, 255, 0.03);
	top: 400rpx;
	right: -60rpx;
}

.header {
	padding: 20rpx 30rpx;
	display: flex;
	justify-content: flex-end;
	position: relative;
	z-index: 2;
}

.logout-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 20rpx;
	background: rgba(255, 82, 82, 0.1);
	border-radius: 12rpx;
	border: 1rpx solid rgba(255, 82, 82, 0.2);
	transition: all 0.3s ease;
}

.logout-btn:active {
	background: rgba(255, 82, 82, 0.2);
	transform: scale(0.95);
}

.logout-text {
	font-size: 24rpx;
	color: #FF5252;
	font-weight: 500;
}

.profile-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 50rpx 30rpx 40rpx;
	background: rgba(30, 30, 45, 0.5);
	margin: 10rpx 24rpx 24rpx;
	border-radius: 24rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.3);
	position: relative;
	z-index: 1;
}

.avatar-wrapper {
	position: relative;
	margin-bottom: 24rpx;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	position: relative;
	z-index: 1;
}

.avatar-ring {
	position: absolute;
	top: -8rpx;
	left: -8rpx;
	right: -8rpx;
	bottom: -8rpx;
	border-radius: 68rpx;
	border: 2rpx solid rgba(0, 230, 118, 0.3);
}

.login-btn-wrapper {
	margin-top: 12rpx;
	padding: 14rpx 48rpx;
	background: rgba(0, 230, 118, 0.1);
	border-radius: 12rpx;
	border: 1rpx solid rgba(0, 230, 118, 0.3);
	transition: all 0.3s ease;
}

.login-btn-wrapper:active {
	background: rgba(0, 230, 118, 0.2);
	transform: scale(0.95);
}

.login-text {
	font-size: 28rpx;
	color: #00E676;
	font-weight: 600;
}

.user-info-area {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.username {
	font-size: 36rpx;
	color: #FFFFFF;
	font-weight: 700;
	margin-bottom: 8rpx;
}

.user-role {
	font-size: 22rpx;
	color: #757575;
	padding: 4rpx 16rpx;
	background: rgba(0, 230, 118, 0.1);
	border-radius: 8rpx;
}

.menu-section {
	position: relative;
	z-index: 1;
	margin: 0 24rpx;
}

.menu-group {
	display: flex;
	flex-direction: column;
	background: rgba(30, 30, 45, 0.5);
	border-radius: 24rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.3);
	overflow: hidden;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 28rpx 30rpx;
	border-bottom: 1rpx solid rgba(51, 51, 85, 0.2);
	transition: all 0.2s ease;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-item:active {
	background: rgba(44, 44, 62, 0.5);
}

.menu-icon-wrapper {
	width: 56rpx;
	height: 56rpx;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.menu-icon-emoji {
	font-size: 28rpx;
}

.menu-text {
	flex: 1;
	font-size: 30rpx;
	color: #E0E0E0;
	font-weight: 500;
}

.version-info {
	display: flex;
	justify-content: center;
	padding: 40rpx 0;
	position: relative;
	z-index: 1;
}

.version-text {
	font-size: 22rpx;
	color: #424242;
}
</style>
