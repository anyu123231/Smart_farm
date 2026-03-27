<template>
	<view class="content">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">设备编辑</text>
		</view>
		
		<!-- 设备信息表单 -->
		<view class="form-container">
			<!-- 设备名称 -->
			<view class="form-item">
				<text class="label">设备名称</text>
				<input 
					class="input" 
					v-model="deviceInfo.name" 
					placeholder="请输入设备名称"
				/>
			</view>
			
			<!-- 主题 -->
			<view class="form-item">
				<text class="label">主题</text>
				<input 
					class="input" 
					v-model="deviceInfo.topic" 
					placeholder="请输入主题"
				/>
			</view>
			
			<!-- UID -->
			<view class="form-item">
				<text class="label">UID</text>
				<input 
					class="input" 
					v-model="deviceInfo.uid" 
					placeholder="请输入UID"
				/>
			</view>
			
			<!-- _openid（只读） -->
			<view class="form-item">
				<text class="label">设备ID (_openid)</text>
				<input 
					class="input readonly" 
					v-model="deviceInfo._openid" 
					placeholder="设备ID"
					disabled
				/>
			</view>
		</view>
		
		<!-- 连接按钮 -->
		<view class="button-container">
			<button class="connect-button" @click="connectDevice">连接</button>
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
				uid: ''
			}
		}
	},
	onLoad(options) {
		// 检查登录状态
		this.checkLoginStatus();
		
		// 获取传递过来的设备信息
		if (options.data) {
			try {
				const data = JSON.parse(decodeURIComponent(options.data))
				this.deviceInfo = {
					name: data.name || '',
					_openid: data._openid || '',
					topic: data.topic || '',
					uid: data.uid || ''
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
		// 检查登录状态
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
		// 连接设备（保存到数据库）
		connectDevice() {
			// 验证必填字段
			if (!this.deviceInfo.name || !this.deviceInfo.topic || !this.deviceInfo.uid || !this.deviceInfo._openid) {
				uni.showToast({
					title: '请填写完整信息',
					icon: 'none'
				})
				return
			}
			
			// 保存到数据库
			this.saveDeviceToDatabase()
		},
		// 保存设备到数据库
		saveDeviceToDatabase() {
			console.log('准备保存设备:', this.deviceInfo)
			
			// 获取token
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
					status: 0
				},
				success: (res) => {
					console.log('服务器响应:', res)
					
					if (res.data && res.data.code === 200) {
						uni.showToast({
							title: '连接成功',
							icon: 'success'
						})
						// 延迟跳转到设备列表页面
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
	background-color: #f5f5f5;
	padding: 20rpx;
	padding-bottom: 120rpx;
}

/* 页面标题样式 */
.page-header {
	padding: 20rpx 0;
	margin-bottom: 30rpx;
}

.page-title {
	font-size: 48rpx;
	font-weight: bold;
	color: #333333;
}

/* 表单容器样式 */
.form-container {
	background-color: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

/* 表单项样式 */
.form-item {
	margin-bottom: 30rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

/* 标签样式 */
.label {
	display: block;
	font-size: 28rpx;
	color: #666666;
	margin-bottom: 15rpx;
	font-weight: bold;
}

/* 输入框样式 */
.input {
	width: 100%;
	height: 80rpx;
	background-color: #f8f8f8;
	border: 2rpx solid #e0e0e0;
	border-radius: 10rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	color: #333333;
	box-sizing: border-box;
}

.input:focus {
	border-color: #007AFF;
	background-color: #ffffff;
}

.readonly {
	background-color: #f0f0f0;
	color: #999999;
}

/* 按钮容器样式 */
.button-container {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20rpx 0;
}

/* 连接按钮样式 */
.connect-button {
	width: 80%;
	height: 90rpx;
	background-color: #007AFF;
	color: #ffffff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 45rpx;
	border: none;
	box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
}

.connect-button:active {
	background-color: #0056b3;
	transform: scale(0.98);
}
</style>
