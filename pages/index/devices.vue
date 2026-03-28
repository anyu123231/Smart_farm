<template>
	<!-- 页面根容器 -->
	<view class="content">
		<!-- 未登录提示 -->
		<view v-if="!isLoggedIn" class="login-tip">
			<text class="login-tip-text">请先登录后查看设备信息</text>
			<button class="login-button" @click="goToLogin">去登录</button>
		</view>
		
		<!-- 设备卡片列表 -->
		<view v-else class="device-list">
			<!-- 无设备提示 -->
			<view v-if="deviceList.length === 0" class="no-device">
				<text class="no-device-text">暂无设备。请添加设备</text>
			</view>
			
			<!-- 设备卡片 -->
			<view 
				class="card" 
				v-for="device in deviceList"
				:key="device.id"
			>
				<!-- 卡片标题区域 -->
				<view class="card-header">
					<text class="card-title">{{ device.name }}</text>
					<!-- 操作按钮容器 -->
					<view class="card-actions">
						<!-- 编辑按钮 -->
						<view class="edit-button" @click="editDeviceName(device)">
							<text class="edit-icon">编辑</text>
						</view>
						<!-- 删除按钮 -->
						<view class="delete-button" @click="deleteDevice(device.id)">
							<text class="delete-icon">删除</text>
						</view>
					</view>
				</view>
				<!-- 设备信息小字 -->
				<view class="device-info">
					<text class="info-text">主题: {{ device.topic }}</text>
					<!-- 单开关设备显示 -->
					<template v-if="device.type === '1' || device.type === 1">
						<text class="info-text" v-if="device.status === 'on'">开启时间: {{ formatTime(device.openTime) }}</text>
						<text class="info-text" v-if="device.status === 'on'">已开启: {{ formatDuration(device.openTime) }}</text>
						<text class="info-text" v-if="device.status === 'off' && device.closeTime">关闭时间: {{ formatTime(device.closeTime) }}</text>
						<text class="info-text" v-if="device.status === 'off' && device.lastDuration > 0">上次开启时长: {{ formatDurationBySeconds(device.lastDuration) }}</text>
					</template>
					<!-- 双开关设备显示 -->
					<template v-else-if="device.type === '2' || device.type === 2">
						<text class="info-text" v-if="device.leftStatus === 'on'">左开启: {{ formatTime(device.leftOpenTime) }}</text>
						<text class="info-text" v-if="device.leftStatus === 'on'">左已开启: {{ formatDuration(device.leftOpenTime) }}</text>
						<text class="info-text" v-if="device.leftStatus === 'off' && device.leftCloseTime">左关闭: {{ formatTime(device.leftCloseTime) }}</text>
						<text class="info-text" v-if="device.leftStatus === 'off' && device.leftLastDuration > 0">左上次时长: {{ formatDurationBySeconds(device.leftLastDuration) }}</text>
						<text class="info-text" v-if="device.rightStatus === 'on'">右开启: {{ formatTime(device.rightOpenTime) }}</text>
						<text class="info-text" v-if="device.rightStatus === 'on'">右已开启: {{ formatDuration(device.rightOpenTime) }}</text>
						<text class="info-text" v-if="device.rightStatus === 'off' && device.rightCloseTime">右关闭: {{ formatTime(device.rightCloseTime) }}</text>
						<text class="info-text" v-if="device.rightStatus === 'off' && device.rightLastDuration > 0">右上次时长: {{ formatDurationBySeconds(device.rightLastDuration) }}</text>
					</template>
				</view>
				<!-- 开关容器 -->
					<view v-if="device.type === '1' || device.type === 1" class="switch-container">
						<!-- 开关组件，根据device.status状态切换active类，点击触发toggleSwitch方法 -->
						<view 
							class="switch" 
							:class="{ active: device.status === 'on' }" 
							@click="toggleSwitch(device)"
						>
							<!-- 开关圆形滑块 -->
							<view class="switch-circle"></view>
						</view>
					</view>
					
					<!-- 双开关容器（类型2设备） -->
					<view v-else-if="device.type === '2' || device.type === 2" class="dual-switch-container">
						<!-- 左开关 -->
						<view class="dual-switch-item">
							<text class="switch-label">左</text>
							<view 
								class="switch" 
								:class="{ active: device.leftStatus === 'on' }" 
								@click="toggleLeftSwitch(device)"
							>
								<view class="switch-circle"></view>
							</view>
						</view>
						<!-- 右开关 -->
						<view class="dual-switch-item">
							<text class="switch-label">右</text>
							<view 
								class="switch" 
								:class="{ active: device.rightStatus === 'on' }" 
								@click="toggleRightSwitch(device)"
							>
								<view class="switch-circle"></view>
							</view>
						</view>
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
			deviceList: [],
			// 是否已登录
			isLoggedIn: false,
			// 用户信息
			userInfo: {}
		}
	},
	// 页面加载生命周期钩子
	onLoad() {
		// 检查登录状态
		this.checkLoginStatus()
	},
	// 页面显示生命周期钩子
	onShow() {
		// 检查登录状态
		this.checkLoginStatus()
	},
	// 方法定义
	methods: {
		// 检查登录状态
		checkLoginStatus() {
			// 从本地存储获取用户信息
			const userInfo = uni.getStorageSync('userInfo');
			const token = uni.getStorageSync('token');
			
			// 判断是否已登录
			if (userInfo && token) {
				this.userInfo = userInfo;
				this.isLoggedIn = true;
				// 获取设备列表
				this.fetchDeviceList();
			} else {
				this.userInfo = {};
				this.isLoggedIn = false;
				this.deviceList = [];
			}
		},
		
		// 跳转到登录页面
		goToLogin() {
			uni.navigateTo({
				url: '/pages/index/login'
			});
		},
		
		// 获取设备列表数据
		fetchDeviceList() {
			// 获取token
			const token = uni.getStorageSync('token');
			
			// 发送 HTTP 请求到云服务器 API 获取设备列表
			uni.request({
				url: 'http://175.24.203.151:3000/api/device',
				method: 'GET',
				header: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
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
						// 正确处理状态值
						this.deviceList = res.data.data.map(device => {
							// 对于类型2的设备，解析左右开关状态
							if (device.type === '2' || device.type === 2) {
								const statusParts = (device.status || 'off:off').split(':');
								return {
									...device,
									status: device.status || 'off:off',
									leftStatus: statusParts[0] === 'on' ? 'on' : 'off',
									rightStatus: statusParts[1] === 'on' ? 'on' : 'off',
									leftOpenTime: device.leftOpenTime || null,
									leftCloseTime: device.leftCloseTime || null,
									leftTotalDuration: device.leftTotalDuration || 0,
									leftLastDuration: device.leftLastDuration || 0,
									rightOpenTime: device.rightOpenTime || null,
									rightCloseTime: device.rightCloseTime || null,
									rightTotalDuration: device.rightTotalDuration || 0,
									rightLastDuration: device.rightLastDuration || 0
								};
							} else {
								return {
									...device,
									status: (device.status === 'on' || device.status === 1 || device.status === '1') ? 'on' : 'off',
									openTime: device.openTime || null,
									closeTime: device.closeTime || null,
									totalDuration: device.totalDuration || 0,
									lastDuration: device.lastDuration || 0
								};
							}
						})
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
		// 切换设备开关状态的方法（类型1设备）
		async toggleSwitch(device) {
			const currentStatus = device.status === 'on'
			const newStatus = currentStatus ? 'off' : 'on'
			const msg = newStatus
			
			try {
				// 先更新设备状态（核心功能）
				await this.updateDeviceStatusInDB(device.id, newStatus)
				
				// 尝试记录开关时间（非核心功能，失败不影响主流程）
				try {
					if (newStatus === 'on') {
						await this.recordOpenTime(device.id)
					} else {
						await this.recordCloseTime(device.id, device.openTime)
					}
				} catch (timeErr) {
					console.warn("记录开关时间失败（不影响主功能）:", timeErr)
				}
				
				this.sendCmd(device.uid, device.topic, msg, device.id, newStatus)
			} catch (err) {
				console.error("更新设备状态失败:", err)
				uni.showToast({ title: "更新状态失败", icon: "none" })
			}
		},
		
		// 切换左开关状态（类型2设备）
		async toggleLeftSwitch(device) {
			const newLeftStatus = device.leftStatus === 'on' ? 'off' : 'on'
			const rightStatus = device.rightStatus
			
			const { combinedStatus, msg } = this.generateCombinedStatus(newLeftStatus, rightStatus)
			
			try {
				await this.updateDeviceStatusInDB(device.id, combinedStatus)
				
				device.leftStatus = newLeftStatus
				device.status = combinedStatus
				
				try {
					if (newLeftStatus === 'on') {
						await this.recordLeftOpenTime(device.id)
					} else {
						await this.recordLeftCloseTime(device.id, device.leftOpenTime)
					}
				} catch (timeErr) {
					console.warn("记录左开关时间失败（不影响主功能）:", timeErr)
				}
				
				this.sendCmd(device.uid, device.topic, msg, device.id, combinedStatus)
			} catch (err) {
				console.error("更新数据库状态失败:", err)
				uni.showToast({ title: "更新状态失败", icon: "none" })
			}
		},
		
		// 切换右开关状态（类型2设备）
		async toggleRightSwitch(device) {
			const leftStatus = device.leftStatus
			const newRightStatus = device.rightStatus === 'on' ? 'off' : 'on'
			
			const { combinedStatus, msg } = this.generateCombinedStatus(leftStatus, newRightStatus)
			
			try {
				await this.updateDeviceStatusInDB(device.id, combinedStatus)
				
				device.rightStatus = newRightStatus
				device.status = combinedStatus
				
				try {
					if (newRightStatus === 'on') {
						await this.recordRightOpenTime(device.id)
					} else {
						await this.recordRightCloseTime(device.id, device.rightOpenTime)
					}
				} catch (timeErr) {
					console.warn("记录右开关时间失败（不影响主功能）:", timeErr)
				}
				
				this.sendCmd(device.uid, device.topic, msg, device.id, combinedStatus)
			} catch (err) {
				console.error("更新数据库状态失败:", err)
				uni.showToast({ title: "更新状态失败", icon: "none" })
			}
		},
		
		// 生成复合状态值和消息（类型2设备）
		generateCombinedStatus(leftStatus, rightStatus) {
			const combinedStatus = `${leftStatus}:${rightStatus}`
			let msg = 'close'
			
			if (leftStatus === 'on' && rightStatus === 'on') {
				msg = 'full'
			} else if (leftStatus === 'on') {
				msg = 'left'
			} else if (rightStatus === 'on') {
				msg = 'right'
			}
			
			return { combinedStatus, msg }
		},
		// 记录开启时间
		recordOpenTime(deviceId) {
			const token = uni.getStorageSync('token')
			const now = new Date()
			const openTime = this.formatDateTimeForMySQL(now)
			
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'http://175.24.203.151:3000/api/device/openTime',
					method: 'PUT',
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					data: {
						id: deviceId,
						openTime: openTime
					},
					success: (res) => {
						if (res.data && res.data.code === 200) {
							const device = this.deviceList.find(d => d.id === deviceId)
							if (device) {
								device.openTime = openTime
							}
							resolve()
						} else {
							reject(res.data.message || '记录开启时间失败')
						}
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		// 记录关闭时间和计算开启时长
		recordCloseTime(deviceId, openTime) {
			const token = uni.getStorageSync('token')
			const now = new Date()
			const closeTime = this.formatDateTimeForMySQL(now)
			
			let duration = 0
			if (openTime) {
				const open = new Date(openTime.replace(' ', 'T'))
				duration = Math.floor((now - open) / 1000)
			}
			
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'http://175.24.203.151:3000/api/device/closeTime',
					method: 'PUT',
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					data: {
						id: deviceId,
						closeTime: closeTime,
						duration: duration
					},
					success: (res) => {
						if (res.data && res.data.code === 200) {
							const device = this.deviceList.find(d => d.id === deviceId)
							if (device) {
								device.closeTime = closeTime
								device.lastDuration = duration
								device.totalDuration = (device.totalDuration || 0) + duration
							}
							resolve()
						} else {
							reject(res.data.message || '记录关闭时间失败')
						}
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		// 格式化日期时间为MySQL格式（使用本地时间）
		formatDateTimeForMySQL(date) {
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			const seconds = String(date.getSeconds()).padStart(2, '0')
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
		},
		
		// 记录左开关开启时间
		recordLeftOpenTime(deviceId) {
			const token = uni.getStorageSync('token')
			const now = new Date()
			const leftOpenTime = this.formatDateTimeForMySQL(now)
			
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'http://175.24.203.151:3000/api/device/leftOpenTime',
					method: 'PUT',
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					data: {
						id: deviceId,
						leftOpenTime: leftOpenTime
					},
					success: (res) => {
						if (res.data && res.data.code === 200) {
							const device = this.deviceList.find(d => d.id === deviceId)
							if (device) {
								device.leftOpenTime = leftOpenTime
							}
							resolve()
						} else {
							reject(res.data.message || '记录左开关开启时间失败')
						}
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		// 记录左开关关闭时间和计算开启时长
		recordLeftCloseTime(deviceId, leftOpenTime) {
			const token = uni.getStorageSync('token')
			const now = new Date()
			const leftCloseTime = this.formatDateTimeForMySQL(now)
			
			let duration = 0
			if (leftOpenTime) {
				const open = new Date(leftOpenTime.replace(' ', 'T'))
				duration = Math.floor((now - open) / 1000)
			}
			
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'http://175.24.203.151:3000/api/device/leftCloseTime',
					method: 'PUT',
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					data: {
						id: deviceId,
						leftCloseTime: leftCloseTime,
						duration: duration
					},
					success: (res) => {
						if (res.data && res.data.code === 200) {
							const device = this.deviceList.find(d => d.id === deviceId)
							if (device) {
								device.leftCloseTime = leftCloseTime
								device.leftLastDuration = duration
								device.leftTotalDuration = (device.leftTotalDuration || 0) + duration
							}
							resolve()
						} else {
							reject(res.data.message || '记录左开关关闭时间失败')
						}
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		// 记录右开关开启时间
		recordRightOpenTime(deviceId) {
			const token = uni.getStorageSync('token')
			const now = new Date()
			const rightOpenTime = this.formatDateTimeForMySQL(now)
			
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'http://175.24.203.151:3000/api/device/rightOpenTime',
					method: 'PUT',
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					data: {
						id: deviceId,
						rightOpenTime: rightOpenTime
					},
					success: (res) => {
						if (res.data && res.data.code === 200) {
							const device = this.deviceList.find(d => d.id === deviceId)
							if (device) {
								device.rightOpenTime = rightOpenTime
							}
							resolve()
						} else {
							reject(res.data.message || '记录右开关开启时间失败')
						}
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		// 记录右开关关闭时间和计算开启时长
		recordRightCloseTime(deviceId, rightOpenTime) {
			const token = uni.getStorageSync('token')
			const now = new Date()
			const rightCloseTime = this.formatDateTimeForMySQL(now)
			
			let duration = 0
			if (rightOpenTime) {
				const open = new Date(rightOpenTime.replace(' ', 'T'))
				duration = Math.floor((now - open) / 1000)
			}
			
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'http://175.24.203.151:3000/api/device/rightCloseTime',
					method: 'PUT',
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					data: {
						id: deviceId,
						rightCloseTime: rightCloseTime,
						duration: duration
					},
					success: (res) => {
						if (res.data && res.data.code === 200) {
							const device = this.deviceList.find(d => d.id === deviceId)
							if (device) {
								device.rightCloseTime = rightCloseTime
								device.rightLastDuration = duration
								device.rightTotalDuration = (device.rightTotalDuration || 0) + duration
							}
							resolve()
						} else {
							reject(res.data.message || '记录右开关关闭时间失败')
						}
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		// 更新数据库中的设备状态
		updateDeviceStatusInDB(deviceId, newStatus) {
			// 获取token
			const token = uni.getStorageSync('token');
			
			console.log('发送状态更新请求:', { deviceId, newStatus, type: typeof newStatus })
			
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'http://175.24.203.151:3000/api/device/status',
					method: 'PUT',
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
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
				
				// 如果是类型2设备，解析复合状态值并更新左右开关状态
				if (device.type === '2' || device.type === 2) {
					const statusParts = newStatus.split(':')
					device.leftStatus = statusParts[0] || 'off'
					device.rightStatus = statusParts[1] || 'off'
				}
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
			// 获取token
			const token = uni.getStorageSync('token');
			
			uni.request({
				url: `http://175.24.203.151:3000/api/device?id=${deviceId}`,
				method: 'DELETE',
				header: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
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
			if (!timestamp) return ""
			const date = new Date(timestamp)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, "0")
			const day = String(date.getDate()).padStart(2, "0")
			const hours = String(date.getHours()).padStart(2, "0")
			const minutes = String(date.getMinutes()).padStart(2, "0")
			return `${year}-${month}-${day} ${hours}:${minutes}`
		},
		
		// 计算从开启时间到现在的时长
		formatDuration(openTime) {
			if (!openTime) return "0分钟"
			const now = new Date()
			const open = new Date(openTime)
			const diffMs = now - open
			const diffSeconds = Math.floor(diffMs / 1000)
			return this.formatDurationBySeconds(diffSeconds)
		},
		
		// 将秒数转换为可读的时长格式
		formatDurationBySeconds(seconds) {
			if (!seconds || seconds <= 0) return "0分钟"
			const hours = Math.floor(seconds / 3600)
			const minutes = Math.floor((seconds % 3600) / 60)
			
			if (hours > 0) {
				return `${hours}小时${minutes}分钟`
			} else {
				return `${minutes}分钟`
			}
		},
		
		// 编辑设备名称
		editDeviceName(device) {
			// 弹出输入框，让用户输入新的设备名称
			uni.showModal({
				title: '编辑设备名称',
				content: '请输入新的设备名称',
				editable: true,
				placeholderText: device.name,
				success: (res) => {
					if (res.confirm && res.content.trim()) {
						// 用户确认并输入了内容
						const newName = res.content.trim();
						this.updateDeviceName(device.id, newName);
					}
				}
			});
		},
		
		// 更新设备名称
		updateDeviceName(deviceId, newName) {
			// 获取token
			const token = uni.getStorageSync('token');
			
			// 发送请求更新设备名称
			uni.request({
				url: 'http://175.24.203.151:3000/api/device/name',
				method: 'PUT',
				header: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				data: {
					id: deviceId,
					name: newName
				},
				success: (res) => {
					if (res.data && res.data.code === 200) {
						// 更新成功，更新本地设备列表
						const device = this.deviceList.find(d => d.id === deviceId);
						if (device) {
							device.name = newName;
						}
						uni.showToast({
							title: '更新成功',
							icon: 'success'
						});
					} else {
						uni.showToast({
							title: res.data.message || '更新失败',
							icon: 'none'
						});
					}
				},
				fail: (err) => {
					console.error('更新设备名称失败:', err);
					uni.showToast({
						title: '网络请求失败',
						icon: 'none'
					});
				}
			});
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
	background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
	padding: 20rpx;
	padding-bottom: 120rpx;
}

/* 未登录提示样式 */
.login-tip {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background-color: rgba(255, 255, 255, 0.95);
	border-radius: 30rpx;
	padding: 60rpx 40rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	margin-top: 100rpx;
	backdrop-filter: blur(10rpx);
}

.login-tip-text {
	font-size: 32rpx;
	color: #333333;
	margin-bottom: 30rpx;
	text-align: center;
	font-weight: 500;
}

.login-button {
	width: 200rpx;
	height: 60rpx;
	background: linear-gradient(135deg, #007AFF 0%, #0056b3 100%);
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 600;
	border-radius: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
	transition: all 0.3s ease;
}

.login-button:active {
	transform: scale(0.95);
	box-shadow: 0 2rpx 6rpx rgba(0, 122, 255, 0.3);
}

/* 设备列表容器 */
.device-list {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: flex-start;
}

/* 卡片容器样式 */
.card {
	width: calc(50% - 15rpx);
	min-height: 600rpx;
	background-color: rgba(255, 255, 255, 0.95);
	border-radius: 30rpx;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx 20rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	margin-bottom: 30rpx;
	box-sizing: border-box;
	backdrop-filter: blur(10rpx);
	transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.card:hover {
	transform: translateY(-5rpx);
	box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.15);
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
	font-weight: 700;
	flex: 1;
	text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

/* 操作按钮容器 */
.card-actions {
	display: flex;
	align-items: center;
}

/* 编辑按钮样式 */
.edit-button {
	width: 80rpx;
	height: 40rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-right: 10rpx;
	transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	border-radius: 20rpx;
	padding: 5rpx 10rpx;
}

.edit-button:active {
	background-color: rgba(0, 122, 255, 0.1);
	transform: scale(0.95);
}

.edit-icon {
	font-size: 28rpx;
	color: #007AFF;
	font-weight: 600;
	line-height: 1;
	white-space: nowrap;
}

/* 删除按钮样式 */
.delete-button {
	width: 80rpx;
	height: 40rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	border-radius: 20rpx;
	padding: 5rpx 10rpx;
}

.delete-button:active {
	background-color: rgba(255, 0, 0, 0.1);
	transform: scale(0.95);
}

.delete-icon {
	font-size: 28rpx;
	color: #ff3b30;
	font-weight: 600;
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
	background-color: rgba(255, 255, 255, 0.8);
	padding: 20rpx;
	border-radius: 20rpx;
	box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

/* 信息文本样式 */
.info-text {
	font-size: 24rpx;
	color: #666666;
	font-weight: 400;
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
	background-color: #e0e0e0;
	border-radius: 30rpx;
	position: relative;
	transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	cursor: pointer;
	box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

/* 开关激活状态样式 */
.switch.active {
	background-color: #4CD964;
	box-shadow: inset 0 2rpx 4rpx rgba(76, 217, 100, 0.4);
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
	transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	box-shadow: 0 3rpx 6rpx rgba(0, 0, 0, 0.2);
}

/* 开关激活状态下圆形滑块位置 */
.switch.active .switch-circle {
	left: 64rpx;
	box-shadow: 0 3rpx 6rpx rgba(0, 0, 0, 0.3);
}

/* 双开关容器样式 */
.dual-switch-container {
	display: flex;
	justify-content: space-around;
	align-items: center;
	width: 100%;
	padding: 20rpx 0;
}

/* 双开关项样式 */
.dual-switch-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
}

/* 开关标签样式 */
.switch-label {
	font-size: 24rpx;
	color: #666666;
	font-weight: 500;
}

/* 无设备提示样式 */
.no-device {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 400rpx;
	background-color: rgba(255, 255, 255, 0.95);
	border-radius: 30rpx;
	margin-top: 20rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	backdrop-filter: blur(10rpx);
}

.no-device-text {
	font-size: 32rpx;
	color: #999999;
	text-align: center;
	font-weight: 500;
}
</style>
