<template>
	<view class="content">
		<view class="bg-decoration">
			<view class="glow glow-1"></view>
		</view>
		
		<view class="page-header">
			<text class="page-title">设备编辑</text>
			<text class="page-subtitle">配置设备连接信息</text>
		</view>
		
		<view class="form-container">
			<view class="form-item">
				<text class="label">设备名称</text>
				<view class="input-wrapper">
					<input 
						class="input" 
						v-model="deviceInfo.name" 
						placeholder="请输入设备名称"
						placeholder-class="placeholder"
					/>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">主题 (Topic)</text>
				<view class="input-wrapper">
					<input 
						class="input" 
						v-model="deviceInfo.topic" 
						placeholder="请输入主题"
						placeholder-class="placeholder"
					/>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">UID</text>
				<view class="input-wrapper">
					<input 
						class="input" 
						v-model="deviceInfo.uid" 
						placeholder="请输入UID"
						placeholder-class="placeholder"
					/>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">设备ID (_openid)</text>
				<view class="input-wrapper readonly">
					<input 
						class="input" 
						v-model="deviceInfo._openid" 
						placeholder="设备ID"
						disabled
					/>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">设备类型 (type)</text>
				<view class="input-wrapper readonly">
					<input 
						class="input" 
						v-model="deviceInfo.type" 
						placeholder="设备类型"
						disabled
					/>
				</view>
			</view>
		</view>
		
		<view class="button-container">
			<button class="connect-button" @click="connectDevice">连接设备</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			deviceInfo: {
				name: '',
				_openid: '',
				topic: '',
				uid: '',
				type: '1'
			}
		}
	},
	onLoad(options) {
		this.checkLoginStatus();
		
		if (options.data) {
			try {
				const data = JSON.parse(decodeURIComponent(options.data))
				this.deviceInfo = {
					name: data.name || '',
					_openid: data._openid || '',
					topic: data.topic || '',
					uid: data.uid || '',
					type: data.type || '1'
				}
				console.log('设备信息:', this.deviceInfo)
			} catch (err) {
				console.error('解析设备信息失败:', err)
				uni.showToast({
					title: '数据解析失败',
					icon: 'none'
				})
			}
		}
	},
	methods: {
		checkLoginStatus() {
			const token = uni.getStorageSync('token');
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				});
				setTimeout(() => {
					uni.navigateTo({
						url: '/pages/index/login'
					});
				}, 1000);
			}
		},
		connectDevice() {
			if (!this.deviceInfo.name || !this.deviceInfo.topic || !this.deviceInfo.uid || !this.deviceInfo._openid) {
				uni.showToast({
					title: '请填写完整信息',
					icon: 'none'
				})
				return
			}
			
			this.saveDeviceToDatabase()
		},
		saveDeviceToDatabase() {
			console.log('准备保存设备:', this.deviceInfo)
			
			const token = uni.getStorageSync('token');
			
			uni.request({
			url: 'http://175.24.203.151:3000/api/device',
			method: 'POST',
			header: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			data: {
				name: this.deviceInfo.name,
				topic: this.deviceInfo.topic,
				uid: this.deviceInfo.uid,
				_openid: this.deviceInfo._openid,
				status: 0,
				type: this.deviceInfo.type
			},
				success: (res) => {
					console.log('服务器响应:', res)
					
					if (res.data && res.data.code === 401) {
						uni.showToast({
							title: '登录已过期，请重新登录',
							icon: 'none'
						})
						uni.removeStorageSync('token')
						uni.removeStorageSync('userInfo')
						setTimeout(() => {
							uni.navigateTo({
								url: '/pages/index/login'
							})
						}, 1500)
						return
					}
					
					if (res.data && res.data.code === 200) {
						uni.showToast({
							title: '连接成功',
							icon: 'success'
						})
						setTimeout(() => {
							uni.switchTab({
								url: '/pages/index/devices'
							})
						}, 1500)
					} else {
						console.error('连接失败:', res.data)
						uni.showToast({
							title: res.data.message || '连接失败',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					console.error('保存设备失败:', err)
					uni.showToast({
						title: '网络请求失败',
						icon: 'none'
					})
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
	padding: 24rpx;
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
	background: rgba(0, 176, 255, 0.05);
	top: -80rpx;
	right: -60rpx;
}

.page-header {
	padding: 20rpx 0;
	margin-bottom: 30rpx;
	position: relative;
	z-index: 1;
}

.page-title {
	font-size: 40rpx;
	font-weight: 700;
	color: #212121;
	margin-bottom: 8rpx;
}

.page-subtitle {
	font-size: 24rpx;
	color: #9E9E9E;
}

.form-container {
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	border: 1rpx solid #E0E0E0;
	position: relative;
	z-index: 1;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.form-item {
	margin-bottom: 28rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.label {
	display: block;
	font-size: 26rpx;
	color: #424242;
	margin-bottom: 12rpx;
	font-weight: 600;
}

.input-wrapper {
	background: #F5F7FA;
	border-radius: 14rpx;
	padding: 0 24rpx;
	height: 88rpx;
	border: 1rpx solid #E0E0E0;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
}

.input-wrapper:focus-within {
	border-color: #00C853;
	box-shadow: 0 0 0 2rpx rgba(0, 200, 83, 0.15);
}

.input-wrapper.readonly {
	opacity: 0.6;
}

.input {
	flex: 1;
	height: 100%;
	font-size: 28rpx;
	color: #212121;
	background-color: transparent;
}

.placeholder {
	color: #9E9E9E;
}

.button-container {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20rpx 0;
	position: relative;
	z-index: 1;
}

.connect-button {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, #00C853 0%, #00A344 100%);
	color: #FFFFFF;
	font-size: 32rpx;
	font-weight: 700;
	border-radius: 16rpx;
	border: none;
	box-shadow: 0 4rpx 20rpx rgba(0, 200, 83, 0.25);
	transition: all 0.3s ease;
	letter-spacing: 2rpx;
}

.connect-button:active {
	transform: scale(0.98);
	box-shadow: 0 2rpx 10rpx rgba(0, 200, 83, 0.25);
}
</style>
