<template>
	<!-- 页面根容器 -->
	<view class="content">
		<!-- 设备卡片列表 -->
		<view 
			class="card" 
			v-for="device in deviceList"
			:key="device.id"
		>
			<!-- 卡片标题区域 -->
			<view class="card-header">
				<text class="card-title">{{ device.name }}</text>
				<!-- 删除按钮 -->
				<view class="delete-button" @click="deleteDevice(device.id)">
					<text class="delete-icon">删除</text>
				</view>
			</view>
			<!-- 设备信息小字 -->
			<view class="device-info">
				<text class="info-text">主题: {{ device.topic }}</text>
				<text class="info-text">UID: {{ device.uid }}</text>
				<text class="info-text">创建时间: {{ formatTime(device.createAt) }}</text>
			</view>
			<!-- 开关容器 -->
			<view class="switch-container">
				<!-- 开关组件，根据device.status状态切换active类，点击触发toggleSwitch方法 -->
				<view 
					class="switch" 
					:class="{ active: device.status === 1 }" 
					@click="toggleSwitch(device)"
				>
					<!-- 开关圆形滑块 -->
					<view class="switch-circle"></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
// 引入CloudBase Web SDK
// Vue组件脚本部分
export default {
	// 数据定义
	data() {
		return {
			// 设备列表数据
			deviceList: []
		}
	},
	// 页面加载生命周期钩子
	onLoad() {
		// 页面加载时获取设备列表
		this.fetchDeviceList()
	},
	// 页面显示生命周期钩子
	onShow() {
		// 每次显示页面时获取设备列表（确保数据最新）
		this.fetchDeviceList()
	},
	// 方法定义
	methods: {
		// 获取设备列表数据
		fetchDeviceList() {
			// 发送 HTTP 请求到云服务器 API 获取设备列表
			uni.request({
				url: 'http://175.24.203.151:3000/api/device',
				method: 'GET',
				header: {
					'Content-Type': 'application/json'
				},
				success: (res) => {
					// 添加调试日志
					console.log('获取设备列表成功:', res.data)
					
					// 检查响应数据
					if (!res || !res.data) {
						console.error("响应数据为空")
						uni.showToast({ title: "获取设备列表失败", icon: "none" })
						return
					}
					
					// 请求成功，更新设备列表
					if (res.data.code === 200) {
						// 确保 status 是数字类型
						this.deviceList = res.data.data.map(device => ({
							...device,
							status: parseInt(device.status)
						}))
						console.log('设备列表:', this.deviceList)
					} else {
						uni.showToast({ title: "获取设备列表失败", icon: "none" })
					}
				},
				fail: (err) => {
					// 请求失败，显示错误信息
					console.error("获取设备列表失败:", err)
					uni.showToast({ title: "网络请求失败", icon: "none" })
				}
			})
		},
		// 切换设备开关状态的方法
		async toggleSwitch(device) {
			// 根据当前状态切换开关
			const newStatus = device.status === 1 ? 0 : 1
			const msg = newStatus === 1 ? "on" : "off"
			
			// 先更新数据库中的状态
			try {
				await this.updateDeviceStatusInDB(device.id, newStatus)
				
				// 数据库更新成功后，发送控制指令到巴法云API
				this.sendCmd(device.uid, device.topic, msg, device.id, newStatus)
			} catch (err) {
				console.error("更新数据库状态失败:", err)
				uni.showToast({ title: "更新状态失败", icon: "none" })
			}
		},
	// 更新数据库中的设备状态
		updateDeviceStatusInDB(deviceId, newStatus) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'http://175.24.203.151:3000/api/device/status',
					method: 'PUT',
					header: {
						'Content-Type': 'application/json'
					},
					data: {
						id: deviceId,
						status: newStatus
					},
					success: (res) => {
						if (res.data && res.data.code === 200) {
							// 更新本地设备列表状态
							this.updateDeviceStatus(deviceId, newStatus)
							resolve()
						} else {
							reject(res.data.message || '更新失败')
						}
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		// 发送控制指令到巴法云API
		sendCmd(uid, topic, msg, deviceId, newStatus) {
			// 发送POST请求到巴法云API
			uni.request({
				url: "https://apis.bemfa.com/va/postJsonMsg",
				method: "POST",
				data: {
					uid: uid,
					topic: topic,
					type: 3,
					msg: msg
				},
				success: (res) => {
					// 请求成功，更新本地设备状态
					uni.showToast({ title: "指令已发送" })
					this.updateDeviceStatus(deviceId, newStatus)
					console.log(res)
				},
				fail: (err) => {
					// 请求失败，显示错误信息
					console.error("发送指令失败:", err)
					uni.showToast({ title: "发送指令失败", icon: "none" })
				}
			})
		},
		// 更新设备状态
		updateDeviceStatus(deviceId, newStatus) {
			// 在本地设备列表中找到对应设备并更新状态
			const device = this.deviceList.find(d => d.id === deviceId)
			if (device) {
				device.status = newStatus
			}
		},
		// 删除设备
		deleteDevice(deviceId) {
			// 确认删除
			uni.showModal({
				title: '确认删除',
				content: '确定要删除该设备吗？',
				success: (res) => {
					if (res.confirm) {
						// 用户确认删除
						this.deleteDeviceFromDatabase(deviceId)
					}
				}
			})
		},
		// 从数据库删除设备
		deleteDeviceFromDatabase(deviceId) {
			uni.request({
				url: `http://175.24.203.151:3000/api/device?id=${deviceId}`,
				method: 'DELETE',
				header: {
					'Content-Type': 'application/json'
				},
				success: (res) => {
					if (res.data && res.data.code === 200) {
						// 删除成功，从本地列表中移除
						this.deviceList = this.deviceList.filter(d => d.id !== deviceId)
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						})
					} else {
						uni.showToast({
							title: res.data.message || '删除失败',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					console.error('删除设备失败:', err)
					uni.showToast({
						title: '网络请求失败',
						icon: 'none'
					})
				}
			})
		},
		// 格式化时间戳
		formatTime(timestamp) {
			// 将时间戳转换为可读格式
			if (!timestamp) return ""
			const date = new Date(timestamp)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, "0")
			const day = String(date.getDate()).padStart(2, "0")
			const hours = String(date.getHours()).padStart(2, "0")
			const minutes = String(date.getMinutes()).padStart(2, "0")
			return `${year}-${month}-${day} ${hours}:${minutes}`
		}
	}
}
</script>

<style>
/* 页面根容器样式 */
.content {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: flex-start;
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx;
	padding-bottom: 120rpx;
}

/* 卡片容器样式 */
.card {
	width: calc(50% - 10rpx);
	background-color: #ffffff;
	border-radius: 20rpx;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	margin-bottom: 20rpx;
	box-sizing: border-box;
}

/* 卡片头部区域样式 */
.card-header {
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	position: relative;
}

/* 卡片标题样式 */
.card-title {
	font-size: 36rpx;
	color: #333333;
	font-weight: bold;
	flex: 1;
}

/* 删除按钮样式 */
.delete-button {
	width: 80rpx;
	height: 40rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-left: 20rpx;
}

.delete-icon {
	font-size: 28rpx;
	color: #ff0000;
	font-weight: bold;
	line-height: 1;
	white-space: nowrap;
}
/* 设备信息区域样式 */
.device-info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	width: 100%;
	word-wrap: break-word;
	word-break: break-all;
}

/* 信息文本样式 */
.info-text {
	font-size: 24rpx;
	color: #999999;
}

/* 开关容器样式 */
.switch-container {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	padding: 20rpx 0;
}

/* 开关组件基础样式 */
.switch {
	width: 120rpx;
	height: 60rpx;
	background-color: #cccccc;
	border-radius: 30rpx;
	position: relative;
	transition: background-color 0.3s ease;
	cursor: pointer;
}

/* 开关激活状态样式 */
.switch.active {
	background-color: #007AFF;
}

/* 开关圆形滑块样式 */
.switch-circle {
	width: 52rpx;
	height: 52rpx;
	background-color: #ffffff;
	border-radius: 50%;
	position: absolute;
	top: 4rpx;
	left: 4rpx;
	transition: left 0.3s ease;
	box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

/* 开关激活状态下圆形滑块位置 */
.switch.active .switch-circle {
	left: 64rpx;
}
</style>
