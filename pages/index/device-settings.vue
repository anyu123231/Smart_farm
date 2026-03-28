<template>
	<view class="content">
		<!-- 页面标题 -->
		<view class="page-header">
			<view class="header-left" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="page-title">{{ device.name }} {{ statusText }}</text>
			<view class="header-right"></view>
		</view>
		
		<!-- 设置内容 -->
		<view class="settings-container">
			<!-- 关闭时间设置 -->
			<view v-if="isOn || hasOpenTime" class="form-item">
				<text class="label">关闭时间</text>
				<view class="datetime-picker">
					<uni-datetime-picker 
						v-model="closeTime" 
						type="datetime" 
						:start="minDateTime" 
						@change="onCloseTimeChange"
					/>
				</view>
			</view>
			
			<!-- 开启时间设置（仅关闭状态时显示） -->
			<view v-if="!isOn" class="form-item">
				<text class="label">开启时间</text>
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
		
		<!-- 保存按钮 -->
		<view class="button-container">
			<button class="save-button" @click="saveSettings">保存设置</button>
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
/* 页面根容器样式 */
.content {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 20rpx;
}

/* 页面标题样式 */
.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 0;
	margin-bottom: 30rpx;
}

.header-left, .header-right {
	width: 80rpx;
}

.back-icon {
	font-size: 40rpx;
	color: #ffffff;
	font-weight: 700;
}

.page-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #ffffff;
	text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

/* 设置容器样式 */
.settings-container {
	background-color: rgba(255, 255, 255, 0.95);
	border-radius: 30rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	backdrop-filter: blur(10rpx);
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
	color: #333333;
	margin-bottom: 15rpx;
	font-weight: 600;
}

/* 日期时间选择器容器 */
.datetime-picker {
	background-color: rgba(255, 255, 255, 0.8);
	border: 2rpx solid #e0e0e0;
	border-radius: 20rpx;
	padding: 20rpx;
	box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

/* 按钮容器样式 */
.button-container {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20rpx 0;
}

/* 保存按钮样式 */
.save-button {
	width: 80%;
	height: 90rpx;
	background: linear-gradient(135deg, #007AFF 0%, #0056b3 100%);
	color: #ffffff;
	font-size: 32rpx;
	font-weight: 700;
	border-radius: 45rpx;
	border: none;
	box-shadow: 0 6rpx 18rpx rgba(0, 122, 255, 0.4);
	transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.save-button:active {
	background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
	transform: scale(0.98);
	box-shadow: 0 3rpx 9rpx rgba(0, 122, 255, 0.4);
}
</style>