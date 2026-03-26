<template>
	<view class="content">
		<!-- 扫一扫按钮 -->
		<view class="scan-button" @click="scanQRCode">
			<image class="scan-icon" src="/static/icon/scan.png" mode="aspectFit"></image>
			<text class="scan-text">扫一扫</text>
		</view>
		
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">{{title}}</text>
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
			// 扫描二维码
			scanQRCode() {
				uni.scanCode({
					success: (res) => {
						console.log('扫描结果:', res)
						// 处理扫描结果
						if (res.result) {
							// 扫描成功，处理二维码内容
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
			// 处理扫描结果
			handleScanResult(result) {
				// 解析二维码内容（格式：name:01,_openid:1,topic:eDko44218006,uid:7389427f70094e918d5ea65ea2ca985b）
				if (result.includes('name:') && result.includes('_openid:')) {
					// 解析设备信息
					const deviceInfo = this.parseDeviceInfo(result)
					if (deviceInfo) {
						// 跳转到设备编辑页面
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
					// 如果是网址，跳转
					uni.navigateTo({
						url: `/pages/webview/webview?url=${encodeURIComponent(result)}`
					})
				} else {
					// 其他内容，显示提示
					uni.showModal({
						title: '扫描结果',
						content: result,
						showCancel: false
					})
				}
			},
			// 解析设备信息
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
					
					// 验证必要字段
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
		align-items: center;
		justify-content: center;
		padding-bottom: 100rpx;
		position: relative;
	}

	/* 扫一扫按钮样式 */
	.scan-button {
		position: absolute;
		top: 30rpx;
		left: 30rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 20rpx;
		z-index: 100;
	}

	.scan-icon {
	width: 48rpx;
	height: 48rpx;
	margin-bottom: 10rpx;
}

	.scan-text {
		font-size: 24rpx;
		color: #010713;
		font-weight: bold;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
</style>
