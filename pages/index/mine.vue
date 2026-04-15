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
	import mqtt from '../../utils/mqtt.js'
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
						icon: '☁',
						text: '巴法云配置',
						bgColor: 'rgba(0, 230, 118, 0.1)'
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
								mqtt.disconnect();
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
				if (item.text === '巴法云配置') {
					this.showBemfaConfig()
				} else if (item.text === '注销') {
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
							mqtt.disconnect();
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
			},

			showBemfaConfig() {
				const savedAppId = uni.getStorageSync('bemfa_appId') || ''

				uni.showModal({
					title: '巴法云 MQTT 配置',
					content: `当前AppID: ${savedAppId || '未配置'}\n\n点击"自动获取"将调用巴法云API自动生成AppID和SecretKey`,
					confirmText: '自动获取',
					cancelText: '清除配置',
					success: (res) => {
						if (res.confirm) {
							this.autoGetBemfaKeys()
						} else if (res.cancel) {
							uni.removeStorageSync('bemfa_appId')
							uni.removeStorageSync('bemfa_secretKey')
							mqtt.disconnect()
							uni.showToast({ title: '已清除配置', icon: 'success' })
						}
					}
				})
			},

			autoGetBemfaKeys() {
				const token = uni.getStorageSync('token')

				uni.showLoading({ title: '正在获取...' })

				uni.request({
					url: 'http://175.24.203.151:3000/api/device',
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					},
					success: (res) => {
						if (res.data && res.data.code === 200 && res.data.data.length > 0) {
							const uid = res.data.data[0].uid
							if (!uid) {
								uni.hideLoading()
								uni.showToast({ title: '设备缺少uid', icon: 'none' })
								return
							}
							this.fetchBemfaAppID(uid)
						} else {
							uni.hideLoading()
							uni.showToast({ title: '请先添加设备', icon: 'none' })
						}
					},
					fail: () => {
						uni.hideLoading()
						uni.showToast({ title: '网络错误', icon: 'none' })
					}
				})
			},

			fetchBemfaAppID(uid) {
				uni.request({
					url: 'https://pro.bemfa.com/vs/web/v1/userSecretKey',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: {
						openID: uid
					},
					success: (res) => {
						uni.hideLoading()
						if (res.data && res.data.code === 0 && res.data.data) {
							const appId = res.data.data.appID
							const secretKey = res.data.data.secretKey
							uni.setStorageSync('bemfa_appId', appId)
							uni.setStorageSync('bemfa_secretKey', secretKey)
							uni.showToast({ title: '获取成功', icon: 'success' })
							console.log('[Bemfa] AppID:', appId, 'SecretKey:', secretKey)
						} else {
							uni.showToast({ title: '获取失败: ' + (res.data.msg || ''), icon: 'none' })
						}
					},
					fail: (err) => {
						uni.hideLoading()
						console.error('[Bemfa] 获取AppID失败:', err)
						uni.showToast({ title: '请求巴法云失败', icon: 'none' })
					}
				})
			}
		}
	}
</script>

<style lang="scss">
/* 全局变量 */
:root {
	--primary-color: #00E676;
	--secondary-color: #00B0FF;
	--background-color: #F5F7FA;
	--card-background: #FFFFFF;
	--text-primary: #1A202C;
	--text-secondary: #4A5568;
	--text-light: #718096;
	--border-radius: 24rpx;
	--shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	--shadow-md: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
	--shadow-lg: 0 16rpx 48rpx rgba(0, 0, 0, 0.18);
}

.content {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: var(--background-color);
	padding-bottom: 120rpx;
	position: relative;
	overflow: hidden;
	font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 背景装饰 */
.bg-decoration {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	z-index: 0;
}

.glow {
	position: absolute;
	border-radius: 50%;
	filter: blur(120rpx);
	animation: pulse 8s ease-in-out infinite alternate;
}

@keyframes pulse {
	0% {
		transform: scale(1);
		opacity: 0.6;
	}
	100% {
		transform: scale(1.2);
		opacity: 0.8;
	}
}

.glow-1 {
	width: 400rpx;
	height: 400rpx;
	background: linear-gradient(135deg, var(--primary-color), transparent);
	top: -100rpx;
	left: -100rpx;
	animation-delay: 0s;
}

.glow-2 {
	width: 350rpx;
	height: 350rpx;
	background: linear-gradient(135deg, var(--secondary-color), transparent);
	top: 400rpx;
	right: -100rpx;
	animation-delay: 2s;
}

/* 头部 */
.header {
	padding: 20rpx 30rpx;
	display: flex;
	justify-content: flex-end;
	position: relative;
	z-index: 1;
}

.logout-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 20rpx;
	background: rgba(255, 82, 82, 0.08);
	border-radius: 12rpx;
	border: 1rpx solid rgba(255, 82, 82, 0.15);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	backdrop-filter: blur(10rpx);
	cursor: pointer;
	animation: fadeInUp 0.8s ease-out;
}

.logout-btn:hover {
	transform: translateY(-2rpx);
	box-shadow: 0 4rpx 16rpx rgba(255, 82, 82, 0.15);
}

.logout-btn:active {
	background: rgba(255, 82, 82, 0.15);
	transform: scale(0.95);
}

.logout-text {
	font-size: 24rpx;
	color: #FF5252;
	font-weight: 500;
}

/* 个人资料区域 */
.profile-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 50rpx 30rpx 40rpx;
	background: rgba(255, 255, 255, 0.95);
	margin: 10rpx 24rpx 24rpx;
	border-radius: var(--border-radius);
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	position: relative;
	z-index: 1;
	box-shadow: var(--shadow-md);
	backdrop-filter: blur(20rpx);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	animation: fadeInUp 0.8s ease-out 0.2s both;
}

.profile-section:hover {
	transform: translateY(-4rpx);
	box-shadow: var(--shadow-lg);
}

.avatar-wrapper {
	position: relative;
	margin-bottom: 24rpx;
	animation: fadeInUp 1s ease-out 0.4s both;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	position: relative;
	z-index: 1;
	box-shadow: var(--shadow-md);
	transition: all 0.3s ease;
}

.avatar:hover {
	transform: scale(1.05);
	box-shadow: var(--shadow-lg);
}

.avatar-ring {
	position: absolute;
	top: -8rpx;
	left: -8rpx;
	right: -8rpx;
	bottom: -8rpx;
	border-radius: 68rpx;
	border: 2rpx solid rgba(0, 230, 118, 0.3);
	animation: rotate 20s linear infinite;
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.login-btn-wrapper {
	margin-top: 12rpx;
	padding: 14rpx 48rpx;
	background: rgba(0, 230, 118, 0.08);
	border-radius: 12rpx;
	border: 1rpx solid rgba(0, 230, 118, 0.25);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	animation: fadeInUp 1s ease-out 0.6s both;
}

.login-btn-wrapper:hover {
	transform: translateY(-2rpx);
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.15);
}

.login-btn-wrapper:active {
	background: rgba(0, 230, 118, 0.15);
	transform: scale(0.95);
}

.login-text {
	font-size: 28rpx;
	color: var(--primary-color);
	font-weight: 600;
}

.user-info-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: fadeInUp 1s ease-out 0.6s both;
}

.username {
	font-size: 36rpx;
	color: var(--text-primary);
	font-weight: 700;
	margin-bottom: 8rpx;
	letter-spacing: 1rpx;
}

.user-role {
	font-size: 22rpx;
	color: var(--text-light);
	padding: 4rpx 16rpx;
	background: rgba(0, 230, 118, 0.08);
	border-radius: 8rpx;
}

/* 菜单区域 */
.menu-section {
	position: relative;
	z-index: 1;
	margin: 0 24rpx;
	animation: fadeInUp 1s ease-out 0.8s both;
}

.menu-group {
	display: flex;
	flex-direction: column;
	background: rgba(255, 255, 255, 0.95);
	border-radius: var(--border-radius);
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	overflow: hidden;
	box-shadow: var(--shadow-md);
	backdrop-filter: blur(20rpx);
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 28rpx 30rpx;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-item:hover {
	background: rgba(0, 230, 118, 0.02);
	transform: translateX(8rpx);
}

.menu-item:active {
	background: rgba(0, 230, 118, 0.05);
}

.menu-icon-wrapper {
	width: 56rpx;
	height: 56rpx;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	transition: all 0.3s ease;
	flex-shrink: 0;
}

.menu-item:hover .menu-icon-wrapper {
	transform: scale(1.1);
}

.menu-icon-emoji {
	font-size: 28rpx;
}

.menu-text {
	flex: 1;
	font-size: 30rpx;
	color: var(--text-primary);
	font-weight: 500;
}

/* 版本信息 */
.version-info {
	display: flex;
	justify-content: center;
	padding: 40rpx 0;
	position: relative;
	z-index: 1;
	animation: fadeInUp 1s ease-out 1s both;
}

.version-text {
	font-size: 22rpx;
	color: var(--text-light);
}

/* 响应式设计 */
@media (max-width: 375px) {
	.profile-section {
		padding: 40rpx 24rpx 32rpx;
		margin: 10rpx 16rpx 16rpx;
	}
	
	.avatar {
		width: 100rpx;
		height: 100rpx;
	}
	
	.avatar-ring {
		top: -6rpx;
		left: -6rpx;
		right: -6rpx;
		bottom: -6rpx;
	}
	
	.username {
		font-size: 32rpx;
	}
	
	.menu-item {
		padding: 24rpx 24rpx;
	}
	
	.menu-section {
		margin: 0 16rpx;
	}
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
	.content {
		background: #1A202C;
	}
	
	:root {
		--text-primary: #F7FAFC;
		--text-secondary: #E2E8F0;
		--text-light: #A0AEC0;
	}
	
	.profile-section {
		background: rgba(45, 55, 72, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.menu-group {
		background: rgba(45, 55, 72, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.menu-item {
		border-bottom-color: rgba(255, 255, 255, 0.05);
	}
	
	.menu-item:hover {
		background: rgba(0, 230, 118, 0.1);
	}
	
	.menu-item:active {
		background: rgba(0, 230, 118, 0.15);
	}
	
	.logout-btn {
		background: rgba(255, 82, 82, 0.15);
		border-color: rgba(255, 82, 82, 0.3);
	}
	
	.login-btn-wrapper {
		background: rgba(0, 230, 118, 0.15);
		border-color: rgba(0, 230, 118, 0.3);
	}
	
	.user-role {
		background: rgba(0, 230, 118, 0.15);
	}
}

/* 通用动画 */
@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
