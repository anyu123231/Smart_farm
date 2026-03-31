<template>
	<view class="content">
		<view class="bg-decoration">
			<view class="glow glow-1"></view>
			<view class="glow glow-2"></view>
		</view>
		
		<view class="page-header">
			<view class="header-back" @click="goBack">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6"/>
				</svg>
			</view>
			<view class="header-info">
				<text class="page-title">{{ device.name }}</text>
				<text class="page-subtitle">定时设置</text>
			</view>
			<view class="header-right">
				<view class="status-badge" :class="{ 'is-on': isOn }">
					<view class="status-dot"></view>
					<text class="status-text">{{ statusText }}</text>
				</view>
			</view>
		</view>
		
		<view class="settings-container">
			<view class="section-header">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
				</svg>
				<text class="section-title">定时任务配置</text>
			</view>
			
			<view class="settings-card">
				<view v-if="isOn || hasOpenTime" class="form-item">
					<view class="form-label-row">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5252" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
						</svg>
						<text class="label">关闭时间</text>
					</view>
					<view class="datetime-picker">
						<uni-datetime-picker 
							v-model="closeTime" 
							type="datetime" 
							:start="minDateTime" 
							@change="onCloseTimeChange"
						/>
					</view>
				</view>
				
				<view v-if="!isOn" class="form-item">
					<view class="form-label-row">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
						</svg>
						<text class="label">开启时间</text>
					</view>
					<view class="datetime-picker">
						<uni-datetime-picker 
							v-model="openTime" 
							type="datetime" 
							:start="minDateTime" 
							@change="onOpenTimeChange"
						/>
					</view>
				</view>
			</view>
			
			<view class="tips-bar">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
				</svg>
				<text class="tips-text">{{ isOn ? '设备已开启，设置关闭时间后将自动关闭' : '请先设置开启时间，再设置关闭时间' }}</text>
			</view>
		</view>
		
		<view class="button-container">
			<button class="save-button" @click="saveSettings">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12"/>
				</svg>
				<text class="btn-text">保存设置</text>
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			// 设备信息
			device: {},
			switchType: '',
			// 状态信息
			isOn: false,
			hasOpenTime: false,
			// 时间设置
			openTime: '',
			closeTime: '',
			minDateTime: ''
		}
	},
	computed: {
		// 状态文本
		statusText() {
			return this.isOn ? '已开启' : '已关闭'
		}
	},
	onLoad(options) {
		// 解析设备信息
		if (options.device) {
			try {
				this.device = JSON.parse(decodeURIComponent(options.device))
				this.switchType = options.switchType || ''
				
				// 检查当前状态
				if (this.switchType === 'left') {
					this.isOn = this.device.leftStatus === 'on'
				} else if (this.switchType === 'right') {
					this.isOn = this.device.rightStatus === 'on'
				} else {
					this.isOn = this.device.status === 'on'
				}
			} catch (err) {
				console.error('解析设备信息失败:', err)
				uni.showToast({ title: '数据解析失败', icon: 'none' })
			}
		}
		
		// 设置最小日期时间（当前时间+1分钟）
		const now = new Date()
		now.setMinutes(now.getMinutes() + 1)
		this.minDateTime = now.toISOString().slice(0, 16)
	},
	methods: {
		// 返回上一页
		goBack() {
			uni.navigateBack()
		},
		
		// 保存设置
		saveSettings() {
			// 验证时间设置
			if (this.isOn) {
				// 开启状态：必须设置关闭时间
				if (!this.closeTime) {
					uni.showToast({ title: '请设置关闭时间', icon: 'none' })
					return
				}
				// 关闭时间必须大于当前时间
				const closeTime = new Date(this.closeTime)
				const now = new Date()
				if (closeTime <= now) {
					uni.showToast({ title: '关闭时间必须大于当前时间', icon: 'none' })
					return
				}
				// 设置定时关闭
				this.setSchedule('off', closeTime)
			} else {
				// 关闭状态：必须设置开启和关闭时间
				if (!this.openTime || !this.closeTime) {
					uni.showToast({ title: '请设置开启和关闭时间', icon: 'none' })
					return
				}
				// 开启时间必须大于当前时间，关闭时间必须大于开启时间
				const openTime = new Date(this.openTime)
				const closeTime = new Date(this.closeTime)
				const now = new Date()
				if (openTime <= now) {
					uni.showToast({ title: '开启时间必须大于当前时间', icon: 'none' })
					return
				}
				if (closeTime <= openTime) {
					uni.showToast({ title: '关闭时间必须大于开启时间', icon: 'none' })
					return
				}
				// 设置定时开启和关闭
				this.setSchedule('on', openTime)
				this.setSchedule('off', closeTime)
			}
			
			// 保存成功，返回上一页
			uni.showToast({ title: '设置成功', icon: 'success' })
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		},
		
		// 开启时间变化处理
		onOpenTimeChange(e) {
			this.openTime = e.detail.value
			this.hasOpenTime = true
		},
		
		// 关闭时间变化处理
		onCloseTimeChange(e) {
			this.closeTime = e.detail.value
		},
		
		// 设置定时任务
		setSchedule(targetStatus, scheduleTime) {
			// 计算延迟时间（毫秒）
			const now = new Date()
			const delay = scheduleTime - now
			
			// 如果延迟时间小于0，不设置定时任务
			if (delay <= 0) return
			
			// 发送定时任务到服务器（这里简化处理，实际应该调用API）
			console.log(`设置定时任务：设备 ${this.device.name} ${targetStatus === 'on' ? '开启' : '关闭'} 时间：${scheduleTime}`)
			
			// 设置定时器
			setTimeout(() => {
				this.updateDeviceStatus(targetStatus)
				
				// 显示定时任务执行提示
				uni.showToast({
					title: `设备${targetStatus === 'on' ? '开启' : '关闭'}成功`,
					icon: 'success'
				})
			}, delay)
		},
		
		// 更新设备状态
		updateDeviceStatus(targetStatus) {
			// 获取token
			const token = uni.getStorageSync('token')
			
			let statusToUpdate
			let msg
			
			if (this.switchType === 'left') {
				// 类型2设备左开关
				const newLeftStatus = targetStatus
				const rightStatus = this.device.rightStatus
				statusToUpdate = `${newLeftStatus}:${rightStatus}`
				
				// 生成消息
				if (newLeftStatus === 'on' && rightStatus === 'on') {
					msg = 'full'
				} else if (newLeftStatus === 'on') {
					msg = 'left'
				} else if (rightStatus === 'on') {
					msg = 'right'
				} else {
					msg = 'close'
				}
			} else if (this.switchType === 'right') {
				// 类型2设备右开关
				const leftStatus = this.device.leftStatus
				const newRightStatus = targetStatus
				statusToUpdate = `${leftStatus}:${newRightStatus}`
				
				// 生成消息
				if (leftStatus === 'on' && newRightStatus === 'on') {
					msg = 'full'
				} else if (leftStatus === 'on') {
					msg = 'left'
				} else if (newRightStatus === 'on') {
					msg = 'right'
				} else {
					msg = 'close'
				}
			} else {
				// 类型1设备
				statusToUpdate = targetStatus
				msg = targetStatus
			}
			
			// 更新数据库中的状态
			uni.request({
				url: 'http://175.24.203.151:3000/api/device/status',
				method: 'PUT',
				header: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				data: {
					id: this.device.id,
					status: statusToUpdate
				},
				success: (res) => {
					if (res.data && res.data.code === 200) {
						// 更新成功，发送控制指令到巴法云API
						this.sendCmd(msg, statusToUpdate)
					}
				}
			})
		},
		
		// 发送控制指令到巴法云API
		sendCmd(msg, status) {
			// 发送POST请求到巴法云API
			uni.request({
				url: "https://apis.bemfa.com/va/postJsonMsg",
				method: "POST",
				data: {
					uid: this.device.uid,
					topic: this.device.topic,
					type: 3,
					msg: msg
				},
				success: (res) => {
					console.log('发送指令成功:', res)
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
	background: #0D0D1A;
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
	background: rgba(0, 176, 255, 0.04);
	top: -80rpx;
	right: -60rpx;
}

.glow-2 {
	width: 250rpx;
	height: 250rpx;
	background: rgba(0, 230, 118, 0.03);
	bottom: 100rpx;
	left: -80rpx;
}

.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 0;
	margin-bottom: 30rpx;
	position: relative;
	z-index: 1;
}

.header-back {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(30, 30, 45, 0.6);
	border-radius: 16rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.4);
}

.header-info {
	flex: 1;
	margin-left: 20rpx;
}

.page-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #FFFFFF;
	margin-bottom: 4rpx;
}

.page-subtitle {
	font-size: 24rpx;
	color: #757575;
}

.header-right {
	width: auto;
}

.status-badge {
	display: flex;
	align-items: center;
	background: rgba(255, 82, 82, 0.12);
	border: 1rpx solid rgba(255, 82, 82, 0.25);
	border-radius: 20rpx;
	padding: 8rpx 20rpx;
}

.status-badge.is-on {
	background: rgba(0, 230, 118, 0.12);
	border-color: rgba(0, 230, 118, 0.25);
}

.status-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: #FF5252;
	margin-right: 10rpx;
}

.status-badge.is-on .status-dot {
	background: #00E676;
	box-shadow: 0 0 8rpx rgba(0, 230, 118, 0.5);
}

.status-text {
	font-size: 22rpx;
	color: #B0BEC5;
	font-weight: 600;
}

.status-badge.is-on .status-text {
	color: #00E676;
}

.settings-container {
	background: rgba(30, 30, 45, 0.6);
	border-radius: 24rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.4);
	position: relative;
	z-index: 1;
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 28rpx;
	color: #E0E0E0;
	font-weight: 700;
	margin-left: 12rpx;
}

.settings-card {
	background: rgba(44, 44, 62, 0.8);
	border-radius: 18rpx;
	padding: 28rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.6);
}

.form-item {
	margin-bottom: 32rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.form-label-row {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.form-label-row svg {
	margin-right: 10rpx;
}

.label {
	font-size: 26rpx;
	color: #B0BEC5;
	font-weight: 600;
}

.datetime-picker {
	background: rgba(30, 30, 45, 0.8);
	border-radius: 14rpx;
	padding: 20rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.6);
	transition: all 0.3s ease;
}

.tips-bar {
	display: flex;
	align-items: flex-start;
	margin-top: 24rpx;
	padding: 20rpx;
	background: rgba(0, 176, 255, 0.06);
	border-radius: 14rpx;
	border: 1rpx solid rgba(0, 176, 255, 0.1);
}

.tips-bar svg {
	margin-top: 2rpx;
	margin-right: 10rpx;
	flex-shrink: 0;
}

.tips-text {
	font-size: 22rpx;
	color: #757575;
	line-height: 1.5;
}

.button-container {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20rpx 0;
	position: relative;
	z-index: 1;
}

.save-button {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, #00E676 0%, #00C853 100%);
	color: #0D0D1A;
	font-size: 32rpx;
	font-weight: 700;
	border-radius: 16rpx;
	border: none;
	box-shadow: 0 4rpx 20rpx rgba(0, 230, 118, 0.3);
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	letter-spacing: 2rpx;
}

.save-button:active {
	transform: scale(0.98);
	box-shadow: 0 2rpx 10rpx rgba(0, 230, 118, 0.3);
}

.btn-text {
	margin-left: 10rpx;
}
</style>