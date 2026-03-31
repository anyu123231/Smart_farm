<template>
	<view class="content">
		<view class="bg-decoration">
			<view class="glow glow-1"></view>
			<view class="glow glow-2"></view>
		</view>
		
		<view class="header-section">
			<view class="scan-button" @click="scanQRCode">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
					<circle cx="12" cy="13" r="4"/>
				</svg>
				<text class="scan-text">扫一扫</text>
			</view>
		</view>
		
		<view class="hero-section">
			<view class="logo-wrapper">
				<image class="logo" src="/static/logo.png"></image>
				<view class="logo-ring"></view>
			</view>
			<text class="title">{{title}}</text>
			<text class="subtitle">智慧农业物联网控制平台</text>
		</view>
		
		<view class="quick-actions">
			<view class="action-card">
				<view class="action-icon">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
						<line x1="8" y1="21" x2="16" y2="21"/>
						<line x1="12" y1="17" x2="12" y2="21"/>
					</svg>
				</view>
				<text class="action-text">设备管理</text>
			</view>
			<view class="action-card" @click="scanQRCode">
				<view class="action-icon">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00B0FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
						<circle cx="12" cy="13" r="4"/>
					</svg>
				</view>
				<text class="action-text">添加设备</text>
			</view>
			<view class="action-card">
				<view class="action-icon">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD600" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 20V10"/>
						<path d="M12 20V4"/>
						<path d="M6 20v-6"/>
					</svg>
				</view>
				<text class="action-text">数据统计</text>
			</view>
		</view>
		
		<view class="status-bar">
			<view class="status-item">
				<view class="status-dot online"></view>
				<text class="status-label">系统在线</text>
			</view>
			<view class="status-divider"></view>
			<view class="status-item">
				<text class="status-label">v1.0.1</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {

		},
		methods: {
			scanQRCode() {
				uni.scanCode({
					success: (res) => {
						console.log('扫描结果:', res)
						if (res.result) {
							this.handleScanResult(res.result)
						}
					},
					fail: (err) => {
						console.error('扫描失败:', err)
						uni.showToast({
							title: '扫描失败',
							icon: 'none'
						})
					}
				})
			},
			handleScanResult(result) {
				if (result.includes('name:') && result.includes('_openid:')) {
					const deviceInfo = this.parseDeviceInfo(result)
					if (deviceInfo) {
						uni.navigateTo({
							url: `/pages/index/device-edit?data=${encodeURIComponent(JSON.stringify(deviceInfo))}`
						})
					} else {
						uni.showToast({
							title: '二维码格式错误',
							icon: 'none'
						})
					}
				} else if (result.startsWith('http')) {
					uni.navigateTo({
						url: `/pages/webview/webview?url=${encodeURIComponent(result)}`
					})
				} else {
					uni.showModal({
						title: '扫描结果',
						content: result,
						showCancel: false
					})
				}
			},
			parseDeviceInfo(result) {
				try {
					const parts = result.split(',')
					const deviceInfo = {}
					
					parts.forEach(part => {
						const [key, value] = part.split(':')
						if (key && value) {
							deviceInfo[key.trim()] = value.trim()
						}
					})
					
					if (deviceInfo.name && deviceInfo._openid && deviceInfo.topic && deviceInfo.uid) {
						return deviceInfo
					}
					return null
				} catch (err) {
					console.error('解析设备信息失败:', err)
					return null
				}
			}
		}
	}
</script>

<style>
.content {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	padding-bottom: 120rpx;
	position: relative;
	background: #0D0D1A;
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
	filter: blur(80rpx);
}

.glow-1 {
	width: 300rpx;
	height: 300rpx;
	background: rgba(0, 230, 118, 0.06);
	top: -50rpx;
	right: -50rpx;
}

.glow-2 {
	width: 250rpx;
	height: 250rpx;
	background: rgba(0, 176, 255, 0.05);
	bottom: 200rpx;
	left: -60rpx;
}

.header-section {
	padding: 20rpx 30rpx;
	display: flex;
	justify-content: flex-end;
	position: relative;
	z-index: 2;
}

.scan-button {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 16rpx 24rpx;
	background: rgba(30, 30, 45, 0.8);
	border-radius: 16rpx;
	border: 1rpx solid rgba(0, 230, 118, 0.2);
	transition: all 0.3s ease;
}

.scan-button:active {
	transform: scale(0.95);
	background: rgba(0, 230, 118, 0.1);
}

.scan-text {
	font-size: 20rpx;
	color: #00E676;
	margin-top: 6rpx;
	font-weight: 500;
}

.hero-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 60rpx 30rpx 40rpx;
	position: relative;
	z-index: 1;
}

.logo-wrapper {
	position: relative;
	margin-bottom: 40rpx;
}

.logo {
	width: 180rpx;
	height: 180rpx;
	border-radius: 40rpx;
	position: relative;
	z-index: 1;
}

.logo-ring {
	position: absolute;
	top: -16rpx;
	left: -16rpx;
	right: -16rpx;
	bottom: -16rpx;
	border-radius: 48rpx;
	border: 2rpx solid rgba(0, 230, 118, 0.2);
	animation: pulse-ring 3s ease-in-out infinite;
}

@keyframes pulse-ring {
	0%, 100% {
		border-color: rgba(0, 230, 118, 0.2);
		transform: scale(1);
	}
	50% {
		border-color: rgba(0, 230, 118, 0.4);
		transform: scale(1.02);
	}
}

.title {
	font-size: 48rpx;
	color: #FFFFFF;
	font-weight: 700;
	margin-bottom: 12rpx;
	letter-spacing: 2rpx;
}

.subtitle {
	font-size: 26rpx;
	color: #757575;
	letter-spacing: 1rpx;
}

.quick-actions {
	display: flex;
	justify-content: space-around;
	padding: 30rpx;
	margin: 20rpx 30rpx;
	background: rgba(30, 30, 45, 0.6);
	border-radius: 24rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.4);
	position: relative;
	z-index: 1;
}

.action-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	padding: 20rpx;
}

.action-icon {
	width: 88rpx;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(44, 44, 62, 0.8);
	border-radius: 20rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.4);
}

.action-text {
	font-size: 24rpx;
	color: #B0BEC5;
	font-weight: 500;
}

.status-bar {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24rpx;
	margin: 20rpx 30rpx;
	background: rgba(30, 30, 45, 0.4);
	border-radius: 16rpx;
	position: relative;
	z-index: 1;
}

.status-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.status-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
}

.status-dot.online {
	background: #00E676;
	box-shadow: 0 0 8rpx rgba(0, 230, 118, 0.6);
}

.status-label {
	font-size: 22rpx;
	color: #757575;
}

.status-divider {
	width: 1rpx;
	height: 24rpx;
	background: rgba(51, 51, 85, 0.6);
	margin: 0 30rpx;
}
</style>
