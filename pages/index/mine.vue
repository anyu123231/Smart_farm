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

<style>
.content {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: #F5F7FA;
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
	background: rgba(0, 200, 83, 0.06);
	top: -60rpx;
	left: -80rpx;
}

.glow-2 {
	width: 200rpx;
	height: 200rpx;
	background: rgba(0, 176, 255, 0.04);
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
	background: rgba(255, 82, 82, 0.08);
	border-radius: 12rpx;
	border: 1rpx solid rgba(255, 82, 82, 0.15);
	transition: all 0.3s ease;
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

.profile-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 50rpx 30rpx 40rpx;
	background: #FFFFFF;
	margin: 10rpx 24rpx 24rpx;
	border-radius: 24rpx;
	border: 1rpx solid #E0E0E0;
	position: relative;
	z-index: 1;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
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
	border: 2rpx solid rgba(0, 200, 83, 0.3);
}

.login-btn-wrapper {
	margin-top: 12rpx;
	padding: 14rpx 48rpx;
	background: rgba(0, 200, 83, 0.08);
	border-radius: 12rpx;
	border: 1rpx solid rgba(0, 200, 83, 0.25);
	transition: all 0.3s ease;
}

.login-btn-wrapper:active {
	background: rgba(0, 200, 83, 0.15);
	transform: scale(0.95);
}

.login-text {
	font-size: 28rpx;
	color: #00C853;
	font-weight: 600;
}

.user-info-area {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.username {
	font-size: 36rpx;
	color: #212121;
	font-weight: 700;
	margin-bottom: 8rpx;
}

.user-role {
	font-size: 22rpx;
	color: #757575;
	padding: 4rpx 16rpx;
	background: rgba(0, 200, 83, 0.08);
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
	background: #FFFFFF;
	border-radius: 24rpx;
	border: 1rpx solid #E0E0E0;
	overflow: hidden;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 28rpx 30rpx;
	border-bottom: 1rpx solid #EEEEEE;
	transition: all 0.2s ease;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-item:active {
	background: #F5F5F5;
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
	color: #212121;
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
	color: #9E9E9E;
}
</style>
