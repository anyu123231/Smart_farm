<template>
	<view class="content">
		<view class="bg-decoration">
			<view class="glow glow-1"></view>
			<view class="glow glow-2"></view>
		</view>
		
		<view v-if="!isLoggedIn" class="login-tip">
			<view class="login-tip-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
					<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
				</svg>
			</view>
			<text class="login-tip-text">请先登录后查看设备信息</text>
			<button class="login-button" @click="goToLogin">去登录</button>
		</view>
		
		<view v-else class="device-list">
			<view v-if="deviceList.length === 0" class="no-device">
				<view class="no-device-icon">
					<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#333355" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
						<line x1="8" y1="21" x2="16" y2="21"/>
						<line x1="12" y1="17" x2="12" y2="21"/>
					</svg>
				</view>
				<text class="no-device-text">暂无设备</text>
				<text class="no-device-sub">扫描设备二维码添加新设备</text>
			</view>
			
			<view 
				class="card" 
				v-for="device in deviceList"
				:key="device.id"
			>
				<view class="card-top">
					<view class="device-icon-wrapper" :class="{ 'is-on': (device.type === '1' || device.type === 1) ? device.status === 'on' : device.leftStatus === 'on' || device.rightStatus === 'on' }">
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 20V10"/>
							<path d="M12 20V4"/>
							<path d="M6 20v-6"/>
						</svg>
					</view>
					<view class="card-title-area">
						<text class="card-title">{{ device.name }}</text>
						<text class="card-topic">Topic: {{ device.topic }}</text>
					</view>
					<view class="card-actions">
						<view class="action-btn edit-btn" @click="editDeviceName(device)">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
								<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
							</svg>
						</view>
						<view class="action-btn delete-btn" @click="deleteDevice(device.id)">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="3 6 5 6 21 6"/>
								<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
							</svg>
						</view>
					</view>
				</view>
				
				<view class="card-divider"></view>
				
				<view class="device-info">
					<template v-if="device.type === '1' || device.type === 1">
						<view class="info-row" v-if="device.status === 'on'">
							<text class="info-label">开启时间</text>
							<text class="info-value">{{ formatTime(device.openTime) }}</text>
						</view>
						<view class="info-row" v-if="device.status === 'on'">
							<text class="info-label">已开启</text>
							<text class="info-value highlight">{{ formatDuration(device.openTime) }}</text>
						</view>
						<view class="info-row" v-if="device.status === 'off' && device.closeTime">
							<text class="info-label">关闭时间</text>
							<text class="info-value">{{ formatTime(device.closeTime) }}</text>
						</view>
						<view class="info-row" v-if="device.status === 'off' && device.lastDuration > 0">
							<text class="info-label">上次时长</text>
							<text class="info-value">{{ formatDurationBySeconds(device.lastDuration) }}</text>
						</view>
					</template>
					<template v-else-if="device.type === '2' || device.type === 2">
						<view class="info-section-title">
							<view class="section-dot left"></view>
							<text class="section-label">左通道</text>
						</view>
						<view class="info-row" v-if="device.leftStatus === 'on'">
							<text class="info-label">开启时间</text>
							<text class="info-value">{{ formatTime(device.leftOpenTime) }}</text>
						</view>
						<view class="info-row" v-if="device.leftStatus === 'on'">
							<text class="info-label">已开启</text>
							<text class="info-value highlight">{{ formatDuration(device.leftOpenTime) }}</text>
						</view>
						<view class="info-row" v-if="device.leftStatus === 'off' && device.leftCloseTime">
							<text class="info-label">关闭时间</text>
							<text class="info-value">{{ formatTime(device.leftCloseTime) }}</text>
						</view>
						<view class="info-row" v-if="device.leftStatus === 'off' && device.leftLastDuration > 0">
							<text class="info-label">上次时长</text>
							<text class="info-value">{{ formatDurationBySeconds(device.leftLastDuration) }}</text>
						</view>
						<view class="info-section-title">
							<view class="section-dot right"></view>
							<text class="section-label">右通道</text>
						</view>
						<view class="info-row" v-if="device.rightStatus === 'on'">
							<text class="info-label">开启时间</text>
							<text class="info-value">{{ formatTime(device.rightOpenTime) }}</text>
						</view>
						<view class="info-row" v-if="device.rightStatus === 'on'">
							<text class="info-label">已开启</text>
							<text class="info-value highlight">{{ formatDuration(device.rightOpenTime) }}</text>
						</view>
						<view class="info-row" v-if="device.rightStatus === 'off' && device.rightCloseTime">
							<text class="info-label">关闭时间</text>
							<text class="info-value">{{ formatTime(device.rightCloseTime) }}</text>
						</view>
						<view class="info-row" v-if="device.rightStatus === 'off' && device.rightLastDuration > 0">
							<text class="info-label">上次时长</text>
							<text class="info-value">{{ formatDurationBySeconds(device.rightLastDuration) }}</text>
						</view>
					</template>
				</view>
				
				<view class="card-divider"></view>
				
				<view class="switch-area">
					<view v-if="device.type === '1' || device.type === 1" class="switch-row">
						<text class="switch-status-text" :class="{ 'is-on': device.status === 'on' }">
							{{ device.status === 'on' ? '运行中' : '已关闭' }}
						</text>
						<view 
							class="switch" 
							:class="{ active: device.status === 'on' }" 
							@click="toggleSwitch(device)"
						>
							<view class="switch-circle"></view>
						</view>
					</view>
					
					<view v-else-if="device.type === '2' || device.type === 2" class="dual-switch-area">
						<view class="dual-switch-item">
							<view class="dual-switch-header">
								<view class="channel-dot left"></view>
								<text class="switch-status-text" :class="{ 'is-on': device.leftStatus === 'on' }">
									{{ device.leftStatus === 'on' ? '左-运行中' : '左-已关闭' }}
								</text>
							</view>
							<view 
								class="switch" 
								:class="{ active: device.leftStatus === 'on' }" 
								@click="toggleLeftSwitch(device)"
							>
								<view class="switch-circle"></view>
							</view>
						</view>
						<view class="dual-switch-item">
							<view class="dual-switch-header">
								<view class="channel-dot right"></view>
								<text class="switch-status-text" :class="{ 'is-on': device.rightStatus === 'on' }">
									{{ device.rightStatus === 'on' ? '右-运行中' : '右-已关闭' }}
								</text>
							</view>
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
.content {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: #0D0D1A;
	padding: 20rpx 24rpx;
	padding-bottom: 140rpx;
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
	background: rgba(0, 230, 118, 0.04);
	top: -80rpx;
	right: -60rpx;
}

.glow-2 {
	width: 250rpx;
	height: 250rpx;
	background: rgba(0, 176, 255, 0.03);
	bottom: 300rpx;
	left: -80rpx;
}

.login-tip {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(30, 30, 45, 0.8);
	border-radius: 24rpx;
	padding: 80rpx 40rpx;
	margin-top: 120rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.4);
	position: relative;
	z-index: 1;
}

.login-tip-icon {
	margin-bottom: 24rpx;
}

.login-tip-text {
	font-size: 30rpx;
	color: #B0BEC5;
	margin-bottom: 40rpx;
	text-align: center;
}

.login-button {
	width: 240rpx;
	height: 72rpx;
	background: linear-gradient(135deg, #00E676 0%, #00C853 100%);
	color: #0D0D1A;
	font-size: 28rpx;
	font-weight: 600;
	border-radius: 16rpx;
	border: none;
	box-shadow: 0 4rpx 20rpx rgba(0, 230, 118, 0.3);
	transition: all 0.3s ease;
}

.login-button:active {
	transform: scale(0.95);
}

.device-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	position: relative;
	z-index: 1;
}

.no-device {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 40rpx;
	background: rgba(30, 30, 45, 0.5);
	border-radius: 24rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.3);
	margin-top: 60rpx;
}

.no-device-icon {
	margin-bottom: 24rpx;
}

.no-device-text {
	font-size: 32rpx;
	color: #757575;
	font-weight: 600;
	margin-bottom: 12rpx;
}

.no-device-sub {
	font-size: 24rpx;
	color: #424242;
}

.card {
	width: 100%;
	background: rgba(30, 30, 45, 0.8);
	border-radius: 24rpx;
	padding: 28rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.4);
	transition: all 0.3s ease;
}

.card:active {
	border-color: rgba(0, 230, 118, 0.2);
}

.card-top {
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-bottom: 8rpx;
}

.device-icon-wrapper {
	width: 72rpx;
	height: 72rpx;
	border-radius: 18rpx;
	background: rgba(44, 44, 62, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	color: #757575;
	border: 1rpx solid rgba(51, 51, 85, 0.4);
	transition: all 0.3s ease;
}

.device-icon-wrapper.is-on {
	background: rgba(0, 230, 118, 0.1);
	color: #00E676;
	border-color: rgba(0, 230, 118, 0.3);
	box-shadow: 0 0 16rpx rgba(0, 230, 118, 0.15);
}

.card-title-area {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.card-title {
	font-size: 32rpx;
	color: #FFFFFF;
	font-weight: 700;
	margin-bottom: 4rpx;
}

.card-topic {
	font-size: 22rpx;
	color: #616161;
}

.card-actions {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.action-btn {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 14rpx;
	transition: all 0.2s ease;
}

.edit-btn {
	background: rgba(0, 176, 255, 0.1);
	color: #00B0FF;
}

.edit-btn:active {
	background: rgba(0, 176, 255, 0.2);
	transform: scale(0.92);
}

.delete-btn {
	background: rgba(255, 82, 82, 0.1);
	color: #FF5252;
}

.delete-btn:active {
	background: rgba(255, 82, 82, 0.2);
	transform: scale(0.92);
}

.card-divider {
	height: 1rpx;
	background: rgba(51, 51, 85, 0.4);
	margin: 20rpx 0;
}

.device-info {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.info-section-title {
	display: flex;
	align-items: center;
	gap: 8rpx;
	margin-top: 8rpx;
	margin-bottom: 4rpx;
}

.section-dot {
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
}

.section-dot.left {
	background: #00B0FF;
}

.section-dot.right {
	background: #FFD600;
}

.section-label {
	font-size: 22rpx;
	color: #757575;
	font-weight: 600;
	letter-spacing: 1rpx;
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 6rpx 0;
}

.info-label {
	font-size: 24rpx;
	color: #757575;
}

.info-value {
	font-size: 24rpx;
	color: #B0BEC5;
}

.info-value.highlight {
	color: #00E676;
	font-weight: 600;
}

.switch-area {
	display: flex;
	flex-direction: column;
}

.switch-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8rpx 0;
}

.switch-status-text {
	font-size: 26rpx;
	color: #757575;
	font-weight: 500;
}

.switch-status-text.is-on {
	color: #00E676;
}

.dual-switch-area {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.dual-switch-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.dual-switch-header {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.channel-dot {
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
}

.channel-dot.left {
	background: #00B0FF;
}

.channel-dot.right {
	background: #FFD600;
}

.switch {
	width: 100rpx;
	height: 52rpx;
	background: rgba(44, 44, 62, 0.8);
	border-radius: 26rpx;
	position: relative;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	border: 1rpx solid rgba(51, 51, 85, 0.6);
}

.switch.active {
	background: rgba(0, 230, 118, 0.2);
	border-color: rgba(0, 230, 118, 0.4);
	box-shadow: 0 0 16rpx rgba(0, 230, 118, 0.2);
}

.switch-circle {
	width: 42rpx;
	height: 42rpx;
	background: #757575;
	border-radius: 50%;
	position: absolute;
	top: 4rpx;
	left: 4rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch.active .switch-circle {
	left: 52rpx;
	background: #00E676;
	box-shadow: 0 0 12rpx rgba(0, 230, 118, 0.5);
}
</style>
