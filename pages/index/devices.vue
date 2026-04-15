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
						<view class="title-row">
							<text class="card-title">{{ device.name }}</text>
							<!-- 设备连接状态 -->
							<view v-if="!isDeviceOnline(device.topic) && connectionCountdown > 0" class="online-status connecting">
								<view class="status-spinner"></view>
								<text class="status-text">{{ connectionCountdown }}s</text>
							</view>
							<view v-else class="online-status" :class="{ 'is-online': isDeviceOnline(device.topic) }">
								<view class="status-dot"></view>
								<text class="status-text">{{ isDeviceOnline(device.topic) ? '在线' : '离线' }}</text>
							</view>
						</view>
						<text class="card-topic">Topic: {{ device.topic }}</text>
					</view>
					<view class="card-actions">
						<view class="action-btn edit-btn" @click="editDeviceName(device)">
							<view class="icon-wrapper edit-icon"></view>
						</view>
						<view class="action-btn delete-btn" @click="deleteDevice(device.id)">
							<view class="icon-wrapper delete-icon"></view>
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
						<view class="info-row" v-if="device.status === 'off' && (device.closeTime || Number(device.lastDuration) > 0)">
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
						<view class="info-row" v-if="device.leftStatus === 'off' && (device.leftCloseTime || Number(device.leftLastDuration) > 0)">
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
						<view class="info-row" v-if="device.rightStatus === 'off' && (device.rightCloseTime || Number(device.rightLastDuration) > 0)">
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
import mqtt from '../../utils/mqtt.js'

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
			userInfo: {},
			// 已订阅的主题列表（用于比较是否需要重新订阅）
			subscribedTopics: [],
			// 设备心跳记录 { topic: lastHeartbeatTime }
			deviceHeartbeats: {},
			// 心跳检查定时器
			heartbeatCheckTimer: null,
			// 连接状态倒计时（秒）
			connectionCountdown: 0,
			// 倒计时定时器
			countdownTimer: null
		}
	},
	// 计算属性
	computed: {
		// MQTT连接状态
		isMqttConnected() {
			return mqtt.getConnectionStatus()
		}
	},
	// 页面加载生命周期钩子
	onLoad() {
		// 检查登录状态
		this.checkLoginStatus()
	},
	// 页面显示生命周期钩子
	onShow() {
		// 先注册MQTT消息监听器（确保能收到消息）
		uni.$on('mqtt:message', this.onMqttMessage)
		// 注册订阅成功监听器
		uni.$on('mqtt:subscribed', this.onMqttSubscribed)
		// 注册连接成功监听器
		uni.$on('mqtt:connected', this.onMqttConnected)
		console.log('[Devices] onShow: MQTT消息监听器已注册')
		// 检查登录状态
		this.checkLoginStatus()
		
		// 如果已经订阅过但心跳检查停止了，重新启动
		if (this.subscribedTopics.length > 0 && !this.heartbeatCheckTimer) {
			console.log('[Devices] 页面重新显示，启动心跳检查')
			this.startHeartbeatCheck()
		}
	},
	// 页面隐藏生命周期钩子
	onHide() {
		uni.$off('mqtt:message', this.onMqttMessage)
		uni.$off('mqtt:subscribed', this.onMqttSubscribed)
		uni.$off('mqtt:connected', this.onMqttConnected)
		// 停止心跳检查定时器
		this.stopHeartbeatCheck()
	},
	// 页面卸载生命周期钩子
	onUnload() {
		uni.$off('mqtt:message', this.onMqttMessage)
		uni.$off('mqtt:subscribed', this.onMqttSubscribed)
		uni.$off('mqtt:connected', this.onMqttConnected)
		this.unsubscribeAllTopics()
		// 停止心跳检查定时器
		this.stopHeartbeatCheck()
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
						// 使用第一个设备的uid连接MQTT
						// 注意：订阅会在连接成功后通过 onMqttConnected 自动进行
						this.connectMqtt()
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
		// 发送控制指令（通过MQTT发布消息）
		sendCmd(uid, topic, msg, deviceId, newStatus) {
			const sent = mqtt.publish(topic, msg)
			if (sent) {
				uni.showToast({ title: "指令已发送" })
				this.updateDeviceStatus(deviceId, newStatus)
			} else {
				console.warn('[Devices] MQTT未连接，尝试通过HTTP发送')
				uni.request({
					url: "https://apis.bemfa.com/va/sendMessage",
					method: "GET",
					data: {
						uid: uid,
						topic: topic,
						type: 1,
						msg: msg
					},
					success: (res) => {
						if (res.data && res.data.code === 0) {
							uni.showToast({ title: "指令已发送" })
							this.updateDeviceStatus(deviceId, newStatus)
						} else {
							uni.showToast({ title: "发送失败: " + (res.data.message || ''), icon: "none" })
						}
						console.log('[Devices] HTTP发送结果:', res.data)
					},
					fail: (err) => {
						console.error("发送指令失败:", err)
						uni.showToast({ title: "发送指令失败", icon: "none" })
					}
				})
			}
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
			
			// 先找到要删除的设备，获取其 topic
			const deviceToDelete = this.deviceList.find(d => d.id === deviceId)
			
			// 如果 MQTT 已连接，先取消订阅
			if (deviceToDelete && deviceToDelete.topic && mqtt.getConnectionStatus()) {
				mqtt.unsubscribe(deviceToDelete.topic)
				console.log('[Devices] 删除设备，取消订阅:', deviceToDelete.topic)
			}
			
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
						
						// 重新订阅（确保只订阅当前存在的设备）
						this.subscribeAllTopics()
						
						// 如果设备列表为空，断开 MQTT 连接
						if (this.deviceList.length === 0) {
							mqtt.disconnect()
							console.log('[Devices] 设备列表为空，断开 MQTT 连接')
						}
						
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
			const s = Number(seconds) || 0
			if (s <= 0) return '不足1秒'
			if (s < 60) return `${s}秒`
			const hours = Math.floor(s / 3600)
			const minutes = Math.floor((s % 3600) / 60)
			if (hours > 0) {
				return `${hours}小时${minutes}分钟`
			}
			return `${minutes}分钟`
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
		},

		// 连接MQTT（使用appID/secretKey认证，不占用设备在线状态）
		connectMqtt() {
			// 检查是否已连接，避免重复连接
			if (mqtt.getConnectionStatus()) {
				console.log('[Devices] MQTT已连接，跳过')
				return
			}

			const appId = uni.getStorageSync('bemfa_appId')
			const secretKey = uni.getStorageSync('bemfa_secretKey')
			if (appId && secretKey) {
				console.log('[Devices] 使用appID连接MQTT')
				mqtt.connect(appId, secretKey)
			} else {
				console.warn('[Devices] 未配置巴法云appID/secretKey，请在个人中心设置')
			}
		},

		// 订阅所有设备的MQTT主题
		subscribeAllTopics() {
			// 只在已连接状态下订阅
			if (!mqtt.getConnectionStatus()) {
				console.warn('[Devices] MQTT未连接，跳过订阅')
				return
			}
			
			// 获取当前设备列表中的主题
			const currentTopics = this.deviceList.filter(d => d.topic).map(d => d.topic).sort()
			const subscribedTopics = [...this.subscribedTopics].sort()
			
			// 比较两个数组是否相同
			const isSame = currentTopics.length === subscribedTopics.length && 
				currentTopics.every((topic, index) => topic === subscribedTopics[index])
			
			if (isSame) {
				console.log('[Devices] 设备列表未变化，跳过订阅')
				return
			}
			
			// 计算需要取消订阅和新增订阅的主题
			const topicsToUnsubscribe = this.subscribedTopics.filter(t => !currentTopics.includes(t))
			const topicsToSubscribe = currentTopics.filter(t => !this.subscribedTopics.includes(t))
			
			console.log('[Devices] 当前订阅:', this.subscribedTopics)
			console.log('[Devices] 目标订阅:', currentTopics)
			console.log('[Devices] 取消订阅:', topicsToUnsubscribe)
			console.log('[Devices] 新增订阅:', topicsToSubscribe)
			
			// 取消不再需要的订阅
			topicsToUnsubscribe.forEach(topic => {
				mqtt.unsubscribe(topic)
			})
			
			// 新增需要的订阅
			topicsToSubscribe.forEach(topic => {
				mqtt.subscribe(topic)
			})
			
			// 更新已订阅列表
			this.subscribedTopics = currentTopics
			console.log('[Devices] 订阅更新完成')
		},

		// 取消订阅所有设备的MQTT主题
		unsubscribeAllTopics() {
			console.log('[Devices] 取消所有订阅:', this.subscribedTopics)
			this.subscribedTopics.forEach(topic => {
				mqtt.unsubscribe(topic)
			})
			this.subscribedTopics = []
			console.log('[Devices] 取消订阅完成')
		},

		// 处理MQTT连接成功事件
		onMqttConnected() {
			console.log('[Devices] MQTT连接成功，开始订阅主题')
			// 连接成功后订阅所有主题
			this.subscribeAllTopics()
		},

		// 处理MQTT订阅成功事件
		onMqttSubscribed(data) {
			console.log('[Devices] MQTT订阅成功:', data.topic)
			// 订阅成功后启动心跳检查
			if (!this.heartbeatCheckTimer) {
				this.startHeartbeatCheck()
			}
		},

		// 处理MQTT收到的消息
		onMqttMessage(data) {
			const { topic, msg } = data
			console.log('[Devices] 收到MQTT消息:', topic, msg)

			// 处理设备心跳消息
			if (msg === 'heartbeat' || msg === 'alive' || msg === 'ping') {
				this.updateDeviceHeartbeat(topic)
				return
			}

			const device = this.deviceList.find(d => d.topic === topic)
			if (!device) return

			const msgLower = (msg || '').toLowerCase().trim()

			if (device.type === '1' || device.type === 1) {
				// 类型1设备：on/off
				const newStatus = (msgLower === 'on') ? 'on' : 'off'
				if (device.status !== newStatus) {
					this.updateDeviceStatus(device.id, newStatus)
					this.syncStatusToServer(device.id, newStatus)
				}
			} else if (device.type === '2' || device.type === 2) {
				// 类型2设备：close/left/right/full
				let newLeft = 'off'
				let newRight = 'off'

				if (msgLower === 'left') {
					newLeft = 'on'
				} else if (msgLower === 'right') {
					newRight = 'on'
				} else if (msgLower === 'full') {
					newLeft = 'on'
					newRight = 'on'
				}

				const combinedStatus = `${newLeft}:${newRight}`
				if (device.status !== combinedStatus) {
					this.updateDeviceStatus(device.id, combinedStatus)
					this.syncStatusToServer(device.id, combinedStatus)
				}
			}
		},

		// 更新设备心跳时间
		updateDeviceHeartbeat(topic) {
			this.deviceHeartbeats[topic] = Date.now()
			console.log('[Devices] 收到设备心跳:', topic)
			
			// 如果倒计时还在进行，停止它（设备已确认在线）
			if (this.connectionCountdown > 0) {
				this.stopCountdown()
				this.connectionCountdown = 0
				console.log('[Devices] 收到设备心跳，倒计时停止')
			}
			
			// 强制刷新设备列表，更新在线状态显示
			this.$forceUpdate()
		},

		// 检查设备是否在线（根据心跳时间）
		isDeviceOnline(topic) {
			const lastHeartbeat = this.deviceHeartbeats[topic]
			if (!lastHeartbeat) return false
			// 60秒内收到过心跳认为在线
			return (Date.now() - lastHeartbeat) < 60000
		},

		// 启动心跳检查定时器
		startHeartbeatCheck() {
			// 无论MQTT是否连接，都启动倒计时等待设备心跳
			console.log('[Devices] 启动连接倒计时，等待设备心跳')
			// 启动60秒倒计时
			this.connectionCountdown = 60
			this.startCountdown()
			
			// 每10秒检查一次设备在线状态
			this.heartbeatCheckTimer = setInterval(() => {
				// 触发刷新，更新在线状态显示
				this.$forceUpdate()
			}, 10000)
			console.log('[Devices] 启动心跳检查定时器')
		},

		// 停止心跳检查定时器
		stopHeartbeatCheck() {
			if (this.heartbeatCheckTimer) {
				clearInterval(this.heartbeatCheckTimer)
				this.heartbeatCheckTimer = null
				console.log('[Devices] 停止心跳检查定时器')
			}
			// 同时停止倒计时
			this.stopCountdown()
		},
		
		// 启动倒计时
		startCountdown() {
			// 先清除已有的倒计时
			this.stopCountdown()
			// 每秒更新一次倒计时
			this.countdownTimer = setInterval(() => {
				if (this.connectionCountdown > 0) {
					this.connectionCountdown--
					console.log('[Devices] 连接倒计时:', this.connectionCountdown + 's')
					// 触发刷新，更新UI
					this.$forceUpdate()
				} else {
					// 倒计时结束
					this.stopCountdown()
					console.log('[Devices] 连接倒计时结束')
				}
			}, 1000)
		},
		
		// 停止倒计时
		stopCountdown() {
			if (this.countdownTimer) {
				clearInterval(this.countdownTimer)
				this.countdownTimer = null
			}
		},

		// 将MQTT收到的状态同步到服务器
		syncStatusToServer(deviceId, newStatus) {
			const token = uni.getStorageSync('token')
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
						console.log('[Devices] 状态已同步到服务器')
					}
				},
				fail: (err) => {
					console.error('[Devices] 同步状态到服务器失败:', err)
				}
			})
		}
	}
}
</script>

<style lang="scss">
/* 全局变量 */
:root {
	--primary-color: #00E676;
	--secondary-color: #00B0FF;
	--background-color: #F5F7FA;
	--card-background: #FFFFFF;
	--text-primary: #1A202C;
	--text-secondary: #4A5568;
	--text-light: #718096;
	--border-radius: 24rpx;
	--shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	--shadow-md: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
	--shadow-lg: 0 16rpx 48rpx rgba(0, 0, 0, 0.18);
}

.content {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: var(--background-color);
	padding: 20rpx 24rpx;
	padding-bottom: 140rpx;
	position: relative;
	overflow: hidden;
	font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 背景装饰 */
.bg-decoration {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	z-index: 0;
}

.glow {
	position: absolute;
	border-radius: 50%;
	filter: blur(120rpx);
	animation: pulse 8s ease-in-out infinite alternate;
}

@keyframes pulse {
	0% {
		transform: scale(1);
		opacity: 0.6;
	}
	100% {
		transform: scale(1.2);
		opacity: 0.8;
	}
}

.glow-1 {
	width: 400rpx;
	height: 400rpx;
	background: linear-gradient(135deg, var(--primary-color), transparent);
	top: -100rpx;
	right: -100rpx;
	animation-delay: 0s;
}

.glow-2 {
	width: 350rpx;
	height: 350rpx;
	background: linear-gradient(135deg, var(--secondary-color), transparent);
	bottom: 100rpx;
	left: -100rpx;
	animation-delay: 2s;
}

/* 登录提示 */
.login-tip {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.95);
	border-radius: var(--border-radius);
	padding: 80rpx 40rpx;
	margin-top: 120rpx;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	position: relative;
	z-index: 1;
	box-shadow: var(--shadow-lg);
	backdrop-filter: blur(20rpx);
	animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(40rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.login-tip-icon {
	margin-bottom: 32rpx;
	animation: fadeInUp 1s ease-out 0.2s both;
}

.login-tip-text {
	font-size: 32rpx;
	color: var(--text-secondary);
	margin-bottom: 48rpx;
	text-align: center;
	animation: fadeInUp 1s ease-out 0.4s both;
}

.login-button {
	width: 280rpx;
	height: 88rpx;
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
	color: #FFFFFF;
	font-size: 32rpx;
	font-weight: 600;
	border-radius: 20rpx;
	border: none;
	box-shadow: 0 8rpx 32rpx rgba(0, 230, 118, 0.3);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	animation: fadeInUp 1s ease-out 0.6s both;
	position: relative;
	overflow: hidden;
}

.login-button::before {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
	transition: left 0.6s ease;
}

.login-button:hover::before {
	left: 100%;
}

.login-button:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.3);
}

/* 设备列表 */
.device-list {
	display: flex;
	flex-direction: column;
	gap: 28rpx;
	position: relative;
	z-index: 1;
}

/* 无设备提示 */
.no-device {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.95);
	border-radius: var(--border-radius);
	padding: 120rpx 40rpx;
	margin-top: 80rpx;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	box-shadow: var(--shadow-md);
	backdrop-filter: blur(20rpx);
	animation: fadeInUp 0.8s ease-out;
}

.no-device-icon {
	margin-bottom: 32rpx;
	animation: fadeInUp 1s ease-out 0.2s both;
}

.no-device-text {
	font-size: 32rpx;
	color: var(--text-primary);
	font-weight: 600;
	margin-bottom: 16rpx;
	animation: fadeInUp 1s ease-out 0.4s both;
}

.no-device-sub {
	font-size: 24rpx;
	color: var(--text-light);
	text-align: center;
	animation: fadeInUp 1s ease-out 0.6s both;
}

/* 设备卡片 */
.card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: var(--border-radius);
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	box-shadow: var(--shadow-md);
	backdrop-filter: blur(20rpx);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	animation: fadeInUp 0.8s ease-out;
	overflow: hidden;
}

.card:hover {
	transform: translateY(-4rpx);
	box-shadow: var(--shadow-lg);
}

.card-top {
	display: flex;
	align-items: flex-start;
	padding: 32rpx 28rpx;
	gap: 20rpx;
}

.device-icon-wrapper {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(245, 247, 250, 0.9);
	border-radius: 16rpx;
	color: var(--text-secondary);
	transition: all 0.3s ease;
	flex-shrink: 0;
}

.device-icon-wrapper.is-on {
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
	color: #FFFFFF;
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.3);
}

.card-title-area {
	flex: 1;
	min-width: 0;
}

.title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8rpx;
}

.card-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary);
	line-height: 1.3;
}

.card-topic {
	font-size: 22rpx;
	color: var(--text-light);
	line-height: 1.4;
}

.card-actions {
	display: flex;
	gap: 16rpx;
	flex-shrink: 0;
}

.action-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(245, 247, 250, 0.9);
	border-radius: 12rpx;
	color: var(--text-secondary);
	transition: all 0.3s ease;
	cursor: pointer;
}

.action-btn:hover {
	background: rgba(0, 230, 118, 0.1);
	color: var(--primary-color);
	transform: scale(1.1);
}

.edit-btn:hover {
	background: rgba(0, 176, 255, 0.1);
	color: var(--secondary-color);
}

.delete-btn:hover {
	background: rgba(255, 82, 82, 0.1);
	color: #FF5252;
}

.icon-wrapper {
	width: 16px;
	height: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
}

.edit-icon::before {
	content: "✏️";
}

.delete-icon::before {
	content: "🗑️";
}

.card-divider {
	height: 1rpx;
	background: rgba(0, 0, 0, 0.05);
	margin: 0 28rpx;
}

/* 设备信息 */
.device-info {
	padding: 28rpx;
	gap: 16rpx;
}

.info-section-title {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.section-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
}

.section-dot.left {
	background: var(--primary-color);
	box-shadow: 0 0 8rpx rgba(0, 230, 118, 0.4);
}

.section-dot.right {
	background: var(--secondary-color);
	box-shadow: 0 0 8rpx rgba(0, 176, 255, 0.4);
}

.section-label {
	font-size: 26rpx;
	font-weight: 600;
	color: var(--text-primary);
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.03);
}

.info-row:last-child {
	border-bottom: none;
}

.info-label {
	font-size: 24rpx;
	color: var(--text-secondary);
}

.info-value {
	font-size: 24rpx;
	color: var(--text-primary);
	font-weight: 500;
}

.info-value.highlight {
	color: var(--primary-color);
	font-weight: 600;
}

/* 开关区域 */
.switch-area {
	padding: 28rpx;
}

.switch-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.switch-status-text {
	font-size: 28rpx;
	font-weight: 500;
	color: var(--text-secondary);
	transition: all 0.3s ease;
}

.switch-status-text.is-on {
	color: var(--primary-color);
}

/* 开关样式 */
.switch {
	width: 100rpx;
	height: 56rpx;
	background: #E0E0E0;
	border-radius: 28rpx;
	position: relative;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch.active {
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}

.switch-circle {
	width: 48rpx;
	height: 48rpx;
	background: #FFFFFF;
	border-radius: 50%;
	position: absolute;
	top: 4rpx;
	left: 4rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.switch.active .switch-circle {
	left: 48rpx;
}

/* 双开关区域 */
.dual-switch-area {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.dual-switch-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.dual-switch-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.channel-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
}

.channel-dot.left {
	background: var(--primary-color);
	box-shadow: 0 0 8rpx rgba(0, 230, 118, 0.4);
}

.channel-dot.right {
	background: var(--secondary-color);
	box-shadow: 0 0 8rpx rgba(0, 176, 255, 0.4);
}

/* 连接状态提示 */
.connection-status {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	padding: 24rpx 32rpx;
	border-radius: 20rpx;
	background: rgba(255, 255, 255, 0.9);
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	margin-bottom: 16rpx;
	backdrop-filter: blur(10rpx);
	box-shadow: var(--shadow-sm);
}

.connection-status.connecting {
	background: rgba(255, 193, 7, 0.1);
	border-color: rgba(255, 193, 7, 0.3);
}

.connection-status.connected {
	background: rgba(0, 230, 118, 0.1);
	border-color: rgba(0, 230, 118, 0.3);
}

.connection-status.disconnected {
	background: rgba(255, 82, 82, 0.1);
	border-color: rgba(255, 82, 82, 0.3);
}

.connection-spinner {
	width: 36rpx;
	height: 36rpx;
	border: 4rpx solid #FFC107;
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

/* 状态点 */
.status-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
}

.status-dot.green {
	background: var(--primary-color);
	box-shadow: 0 0 12rpx rgba(0, 230, 118, 0.5);
}

.status-dot.red {
	background: #FF5252;
	box-shadow: 0 0 12rpx rgba(255, 82, 82, 0.5);
}

/* 设备卡片上的倒计时状态 */
.online-status.connecting {
	background: rgba(255, 193, 7, 0.15);
	border-color: rgba(255, 193, 7, 0.4);
}

.online-status.connecting .status-text {
	color: #F57C00;
	font-weight: 600;
}

.status-spinner {
	width: 16rpx;
	height: 16rpx;
	border: 3rpx solid #FFC107;
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.no-device {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 40rpx;
	background: #FFFFFF;
	border-radius: 24rpx;
	border: 1rpx solid #E0E0E0;
	margin-top: 60rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
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
	color: #9E9E9E;
}

.card {
	width: 100%;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 28rpx;
	border: 1rpx solid #E0E0E0;
	transition: all 0.3s ease;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.card:active {
	border-color: rgba(0, 200, 83, 0.3);
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
	background: #F5F7FA;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	color: #757575;
	border: 1rpx solid #EEEEEE;
	transition: all 0.3s ease;
}

.device-icon-wrapper.is-on {
	background: rgba(0, 200, 83, 0.1);
	color: #00C853;
	border-color: rgba(0, 200, 83, 0.3);
	box-shadow: 0 0 16rpx rgba(0, 200, 83, 0.1);
}

.card-title-area {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.title-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 4rpx;
}

.card-title {
	font-size: 32rpx;
	color: #212121;
	font-weight: 700;
}

.card-topic {
	font-size: 22rpx;
	color: #9E9E9E;
}

/* 设备在线状态 */
.online-status {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	background: #F5F5F5;
}

.online-status.is-online {
	background: rgba(0, 200, 83, 0.1);
}

.status-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: #BDBDBD;
}

.online-status.is-online .status-dot {
	background: #00C853;
	box-shadow: 0 0 8rpx rgba(0, 200, 83, 0.5);
}

.status-text {
	font-size: 20rpx;
	color: #757575;
	font-weight: 500;
}

.online-status.is-online .status-text {
	color: #00C853;
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
	color: #0091EA;
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
	background: #EEEEEE;
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
	background: #0091EA;
}

.section-dot.right {
	background: #FFB300;
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
	color: #616161;
}

.info-value.highlight {
	color: #00C853;
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
	color: #00C853;
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
	background: #0091EA;
}

.channel-dot.right {
	background: #FFB300;
}

.switch {
	width: 100rpx;
	height: 52rpx;
	background: #E0E0E0;
	border-radius: 26rpx;
	position: relative;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	border: 1rpx solid #D0D0D0;
}

.switch.active {
	background: rgba(0, 200, 83, 0.2);
	border-color: rgba(0, 200, 83, 0.4);
	box-shadow: 0 0 16rpx rgba(0, 200, 83, 0.15);
}

.switch-circle {
	width: 42rpx;
	height: 42rpx;
	background: #FFFFFF;
	border-radius: 50%;
	position: absolute;
	top: 4rpx;
	left: 4rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.15);
}

.switch.active .switch-circle {
	left: 52rpx;
	background: #00C853;
	box-shadow: 0 0 12rpx rgba(0, 200, 83, 0.4);
}
</style>
