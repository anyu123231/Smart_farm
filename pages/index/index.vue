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
		
		<view class="weather-section">
			<view class="weather-card" @click="showCitySelector = true">
				<view class="weather-header">
					<view class="location-info">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2">
							<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
							<circle cx="12" cy="10" r="3"/>
						</svg>
						<text class="location-text">{{ cityName || '定位中...' }}</text>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#757575" stroke-width="2">
							<polyline points="6 9 12 15 18 9"/>
						</svg>
					</view>
					<text class="update-time">{{ updateTime }}</text>
				</view>
				
				<view class="weather-main" v-if="weatherNow">
					<view class="temp-section">
						<text class="temp-value">{{ weatherNow.temp }}</text>
						<text class="temp-unit">°C</text>
					</view>
					<view class="weather-info">
						<text class="weather-text">{{ weatherNow.text }}</text>
						<text class="weather-detail">{{ weatherNow.windDir }} {{ weatherNow.windScale }}级</text>
					</view>
				</view>
				
				<view class="weather-extra" v-if="weatherNow">
					<view class="extra-item">
						<text class="extra-label">湿度</text>
						<text class="extra-value">{{ weatherNow.humidity }}%</text>
					</view>
					<view class="extra-item">
						<text class="extra-label">体感</text>
						<text class="extra-value">{{ weatherNow.feelsLike }}°</text>
					</view>
					<view class="extra-item" v-if="airQuality">
						<text class="extra-label">空气</text>
						<text class="extra-value" :class="getAqiClass(airQuality.aqi)">{{ airQuality.category }}</text>
					</view>
				</view>
				
				<view class="weather-loading" v-if="loading">
					<text>加载中...</text>
				</view>
			</view>
			
			<view class="forecast-section" v-if="forecast.length > 0">
				<view class="forecast-title">未来3天预报</view>
				<view class="forecast-list">
					<view class="forecast-item" v-for="(day, index) in forecast" :key="index">
						<text class="forecast-date">{{ formatForecastDate(day.fxDate, index) }}</text>
						<text class="forecast-weather">{{ day.textDay }}</text>
						<text class="forecast-temp">{{ day.tempMin }}° / {{ day.tempMax }}°</text>
					</view>
				</view>
			</view>
		</view>
		
		
		<view class="quick-actions">
			<view class="action-card">
				<view class="action-icon">
					<view class="icon-wrapper device-icon"></view>
				</view>
				<text class="action-text">设备管理</text>
			</view>
			<view class="action-card" @click="scanQRCode">
				<view class="action-icon">
					<view class="icon-wrapper qr-icon"></view>
				</view>
				<text class="action-text">添加设备</text>
			</view>
			<view class="action-card" @click="goToAIChat">
				<view class="action-icon ai-icon">
					<view class="icon-wrapper ai-icon"></view>
				</view>
				<text class="action-text">AI助手</text>
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
		
		<view class="city-selector" v-if="showCitySelector" @click.self="showCitySelector = false">
			<view class="city-selector-content">
				<view class="city-selector-header">
					<text class="city-selector-title">选择城市</text>
					<view class="city-selector-close" @click="showCitySelector = false">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"/>
							<line x1="6" y1="6" x2="18" y2="18"/>
						</svg>
					</view>
				</view>
				<view class="city-search">
					<input type="text" v-model="citySearchKeyword" placeholder="输入城市名称搜索" @input="searchCity" class="search-input" />
				</view>
				<view class="city-action" @click="retryLocation">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<line x1="12" y1="8" x2="12" y2="12"/>
						<line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
					<text>重新定位当前位置</text>
				</view>
				<view class="city-list" v-if="citySearchResults.length > 0">
					<view class="city-item" v-for="city in citySearchResults" :key="city.id" @click="selectCity(city)">
						<text class="city-item-text">{{ city.name }}</text>
						<text class="city-item-adm">{{ city.adm1 }} {{ city.adm2 }}</text>
					</view>
				</view>
				<view class="city-not-found" v-else-if="citySearchKeyword">
					<text>未找到匹配的城市</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	// 服务器API地址
	const API_BASE = 'http://175.24.203.151:3000/api'
	
	export default {
		data() {
			return {
				title: 'Hello',
				loading: true,
				showCitySelector: false,
				citySearchKeyword: '',
				citySearchResults: [],
				locationId: '',
				cityName: '',
				weatherNow: null,
				forecast: [],
				airQuality: null,
				updateTime: ''
			}
		},
		onLoad() {
			this.initWeather()
		},
		methods: {
			async initWeather() {
				this.loading = true
				const savedLocation = uni.getStorageSync('weather_location')
				
				if (savedLocation) {
					this.locationId = savedLocation.id
					this.cityName = savedLocation.name
					await this.fetchWeather()
				} else {
					await this.getLocation()
				}
			},
			
			async getLocation() {
				try {
					const position = await new Promise((resolve, reject) => {
						uni.getLocation({
							type: 'wgs84',
							geocode: true,
							success: resolve,
							fail: reject
						})
					})
					
					const location = `${position.longitude},${position.latitude}`
					await this.getLocationId(location)
				} catch (error) {
					console.error('定位失败:', error)
					this.cityName = '点击选择城市'
					this.loading = false
				}
			},
			
			async getLocationId(location) {
				try {
					const res = await uni.request({
						url: `${API_BASE}/weather/location`,
						data: { location }
					})
					
					if (res.data.code === 200 && res.data.data.length > 0) {
						const city = res.data.data[0]
						this.locationId = city.id
						this.cityName = city.name
						uni.setStorageSync('weather_location', { id: city.id, name: city.name })
						await this.fetchWeather()
					}
				} catch (error) {
					console.error('获取城市ID失败:', error)
					this.loading = false
				}
			},
			
			async fetchWeather() {
				if (!this.locationId) return
				
				try {
					const res = await uni.request({
						url: `${API_BASE}/weather/all`,
						data: { location: this.locationId }
					})
					
					if (res.data.code === 200) {
						const data = res.data.data
						this.weatherNow = data.now
						this.forecast = data.forecast || []
						this.airQuality = data.air
						this.updateTime = this.formatTime(res.data.data.updateTime)
					}
				} catch (error) {
					console.error('获取天气失败:', error)
				} finally {
					this.loading = false
				}
			},
			
			async searchCity() {
				if (!this.citySearchKeyword.trim()) {
					this.citySearchResults = []
					return
				}
				
				try {
					const res = await uni.request({
						url: `${API_BASE}/weather/location`,
						data: { location: this.citySearchKeyword }
					})
					
					if (res.data.code === 200) {
						this.citySearchResults = res.data.data.slice(0, 10)
					}
				} catch (error) {
					console.error('搜索城市失败:', error)
				}
			},
			
			selectCity(city) {
				this.locationId = city.id
				this.cityName = city.name
				this.showCitySelector = false
				this.citySearchKeyword = ''
				this.citySearchResults = []
				uni.setStorageSync('weather_location', { id: city.id, name: city.name })
				this.fetchWeather()
			},
			
			async retryLocation() {
				this.showCitySelector = false
				this.citySearchKeyword = ''
				this.citySearchResults = []
				uni.removeStorageSync('weather_location')
				this.loading = true
				this.cityName = '定位中...'
				await this.getLocation()
			},
			
			formatTime(timeStr) {
				if (!timeStr) return ''
				const date = new Date(timeStr)
				return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} 更新`
			},
			
			formatForecastDate(dateStr, index) {
				if (index === 0) return '今天'
				if (index === 1) return '明天'
				const date = new Date(dateStr)
				return `${date.getMonth() + 1}/${date.getDate()}`
			},
			
			getAqiClass(aqi) {
				const val = parseInt(aqi)
				if (val <= 50) return 'aqi-good'
				if (val <= 100) return 'aqi-moderate'
				if (val <= 150) return 'aqi-unhealthy1'
				if (val <= 200) return 'aqi-unhealthy2'
				if (val <= 300) return 'aqi-very-unhealthy'
				return 'aqi-hazardous'
			},
			
			goToAIChat() {
				uni.navigateTo({
					url: '/pages/index/ai-chat'
				})
			},
			
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

<style lang="scss">
/* 全局变量 */
:root {
	--primary-color: #00E676;
	--secondary-color: #00B0FF;
	--accent-color: #667eea;
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
	padding-bottom: 120rpx;
	position: relative;
	background: var(--background-color);
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

/* 头部区域 */
.header-section {
	padding: 30rpx 30rpx 10rpx;
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
	padding: 20rpx 28rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	border: 1rpx solid rgba(0, 230, 118, 0.2);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: var(--shadow-sm);
	backdrop-filter: blur(10rpx);
	cursor: pointer;
}

.scan-button:hover {
	transform: translateY(-2rpx);
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.2);
}

.scan-button:active {
	transform: scale(0.95);
	background: rgba(0, 230, 118, 0.1);
}

.scan-text {
	font-size: 20rpx;
	color: var(--primary-color);
	margin-top: 8rpx;
	font-weight: 600;
}

/* 天气区域 */
.weather-section {
	padding: 0 30rpx 40rpx;
	position: relative;
	z-index: 1;
}

.weather-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: var(--border-radius);
	padding: 36rpx;
	color: #FFFFFF;
	box-shadow: var(--shadow-lg);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	backdrop-filter: blur(20rpx);
}

.weather-card:hover {
	transform: translateY(-4rpx);
	box-shadow: 0 20rpx 56rpx rgba(102, 126, 234, 0.4);
}

.weather-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
	animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.location-info {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.location-text {
	font-size: 32rpx;
	font-weight: 600;
	letter-spacing: 1rpx;
}

.update-time {
	font-size: 22rpx;
	opacity: 0.8;
	font-weight: 400;
}

.weather-main {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 28rpx;
	animation: fadeInUp 0.8s ease-out 0.2s both;
}

.temp-section {
	display: flex;
	align-items: flex-start;
	gap: 8rpx;
}

.temp-value {
	font-size: 112rpx;
	font-weight: 200;
	line-height: 1;
	background: linear-gradient(45deg, #FFFFFF, rgba(255, 255, 255, 0.8));
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.temp-unit {
	font-size: 36rpx;
	margin-top: 20rpx;
	opacity: 0.9;
}

.weather-info {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 12rpx;
	padding-top: 8rpx;
}

.weather-text {
	font-size: 40rpx;
	font-weight: 600;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.weather-detail {
	font-size: 24rpx;
	opacity: 0.8;
}

.weather-extra {
	display: flex;
	justify-content: space-around;
	gap: 16rpx;
	padding-top: 24rpx;
	border-top: 1rpx solid rgba(255, 255, 255, 0.2);
	animation: fadeInUp 1s ease-out 0.4s both;
}

.extra-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
	flex: 1;
	padding: 16rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 16rpx;
	backdrop-filter: blur(10rpx);
	transition: all 0.3s ease;
}

.extra-item:hover {
	background: rgba(255, 255, 255, 0.15);
	transform: translateY(-2rpx);
}

.extra-label {
	font-size: 20rpx;
	opacity: 0.8;
}

.extra-value {
	font-size: 28rpx;
	font-weight: 600;
}

.weather-loading {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 80rpx 0;
	font-size: 24rpx;
	opacity: 0.8;
}

/* 预报区域 */
.forecast-section {
	margin-top: 28rpx;
	animation: fadeInUp 1.2s ease-out 0.6s both;
}

.forecast-title {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 20rpx;
	padding-left: 8rpx;
	border-left: 4rpx solid var(--primary-color);
}

.forecast-list {
	display: flex;
	gap: 16rpx;
	overflow-x: auto;
	padding-bottom: 12rpx;
	
	/* 隐藏滚动条 */
	::-webkit-scrollbar {
		display: none;
	}
	scrollbar-width: none;
}

.forecast-item {
	flex: 0 0 140rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	padding: 24rpx 16rpx;
	box-shadow: var(--shadow-sm);
	backdrop-filter: blur(10rpx);
	transition: all 0.3s ease;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
}

.forecast-item:hover {
	transform: translateY(-4rpx);
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.forecast-date {
	font-size: 22rpx;
	color: var(--text-secondary);
	font-weight: 500;
}

.forecast-weather {
	font-size: 24rpx;
	color: var(--text-primary);
	font-weight: 600;
}

.forecast-temp {
	font-size: 22rpx;
	color: var(--text-light);
	font-weight: 500;
}

/* 英雄区域 */
.hero-section {
	padding: 40rpx 30rpx;
	position: relative;
	z-index: 1;
	animation: fadeInUp 1.4s ease-out 0.8s both;
}

.logo-wrapper {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 24rpx;
}

.logo {
	width: 160rpx;
	height: 160rpx;
	object-fit: contain;
	border-radius: 32rpx;
	box-shadow: var(--shadow-md);
	transition: all 0.3s ease;
}

.logo:hover {
	transform: scale(1.05);
	box-shadow: var(--shadow-lg);
}

.logo-ring {
	position: absolute;
	width: 200rpx;
	height: 200rpx;
	border: 2rpx solid rgba(0, 230, 118, 0.3);
	border-radius: 50%;
	animation: rotate 20s linear infinite;
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.title {
	font-size: 48rpx;
	font-weight: 700;
	color: var(--text-primary);
	text-align: center;
	margin-bottom: 12rpx;
	letter-spacing: 2rpx;
}

.subtitle {
	font-size: 28rpx;
	color: var(--text-secondary);
	text-align: center;
	font-weight: 400;
}

/* 快速操作 */
.quick-actions {
	padding: 0 30rpx 40rpx;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 24rpx;
	position: relative;
	z-index: 1;
	animation: fadeInUp 1.6s ease-out 1s both;
}

.action-card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 24rpx;
	padding: 40rpx 24rpx;
	box-shadow: var(--shadow-sm);
	backdrop-filter: blur(10rpx);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
}

.action-card:hover {
	transform: translateY(-6rpx);
	box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.12);
	border-color: rgba(0, 230, 118, 0.3);
}

.action-card:active {
	transform: scale(0.98);
}

.action-icon {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
	border-radius: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.3);
	transition: all 0.3s ease;
}

.action-card:hover .action-icon {
	transform: scale(1.1);
	box-shadow: 0 6rpx 24rpx rgba(0, 230, 118, 0.4);
}

.action-text {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-primary);
}

.icon-wrapper {
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28px;
	color: #FFFFFF;
}

.device-icon::before {
	content: "📱";
}

.qr-icon::before {
	content: "📷";
}

.ai-icon::before {
	content: "🤖";
}

/* 城市选择器 */
.city-selector {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	justify-content: center;
	align-items: flex-end;
	animation: fadeIn 0.3s ease-out;
	backdrop-filter: blur(10rpx);
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.city-selector-content {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 32rpx 32rpx 0 0;
	width: 100%;
	max-height: 80vh;
	animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	backdrop-filter: blur(20rpx);
	border-top: 1rpx solid rgba(0, 0, 0, 0.05);
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(100%);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.city-selector-header {
	padding: 32rpx;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.city-selector-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary);
}

.city-selector-close {
	font-size: 32rpx;
	color: var(--text-light);
	cursor: pointer;
	padding: 8rpx;
	border-radius: 8rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	backdrop-filter: blur(10rpx);
}

.city-selector-close:hover {
	background: rgba(0, 0, 0, 0.05);
	color: var(--text-secondary);
	transform: scale(1.1);
}

.city-search {
	padding: 0 32rpx 24rpx;
}

.search-input {
	width: 100%;
	padding: 20rpx 24rpx;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	border-radius: 16rpx;
	font-size: 28rpx;
	color: var(--text-primary);
	background: rgba(247, 250, 252, 0.9);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	backdrop-filter: blur(10rpx);
}

.search-input:focus {
	outline: none;
	border-color: var(--primary-color);
	box-shadow: 0 0 0 4rpx rgba(0, 230, 118, 0.1);
	background: rgba(255, 255, 255, 0.95);
	transform: translateY(-2rpx);
}

.city-action {
	padding: 0 32rpx 24rpx;
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 16rpx 32rpx;
	margin: 0 32rpx 24rpx;
	background: rgba(0, 230, 118, 0.08);
	border-radius: 16rpx;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	backdrop-filter: blur(10rpx);
}

.city-action:hover {
	background: rgba(0, 230, 118, 0.15);
	transform: translateY(-2rpx);
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.15);
}

.city-action text {
	font-size: 26rpx;
	color: var(--primary-color);
	font-weight: 500;
}

.city-list {
	max-height: 60vh;
	overflow-y: auto;
	padding: 0 32rpx 32rpx;
}

.city-item {
	padding: 24rpx 0;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.city-item:hover {
	color: var(--primary-color);
	transform: translateX(8rpx);
}

.city-item:last-child {
	border-bottom: none;
}

.city-item-text {
	font-size: 28rpx;
	color: var(--text-primary);
	font-weight: 500;
}

.city-item-adm {
	font-size: 24rpx;
	color: var(--text-light);
	flex: 1;
	text-align: right;
}

.city-not-found {
	padding: 80rpx 0;
	text-align: center;
	color: var(--text-light);
	font-size: 24rpx;
	animation: fadeInUp 0.6s ease-out;
}

/* 响应式设计 */
@media (max-width: 375px) {
	.weather-card {
		padding: 28rpx;
	}
	
	.temp-value {
		font-size: 96rpx;
	}
	
	.quick-actions {
		gap: 16rpx;
	}
	
	.action-card {
		padding: 32rpx 16rpx;
	}
}

/* 状态栏 */
.status-bar {
	padding: 16rpx 30rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	box-shadow: var(--shadow-sm);
	backdrop-filter: blur(10rpx);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 24rpx;
	position: relative;
	z-index: 1;
	animation: fadeInUp 0.8s ease-out 1.2s both;
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
	background: #E2E8F0;
	transition: all 0.3s ease;
}

.status-dot.online {
	background: var(--primary-color);
	box-shadow: 0 0 8rpx rgba(0, 230, 118, 0.4);
	animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
		transform: scale(1);
	}
	50% {
		opacity: 0.7;
		transform: scale(1.2);
	}
}

.status-label {
	font-size: 24rpx;
	color: var(--text-secondary);
	font-weight: 500;
}

.status-divider {
	width: 1rpx;
	height: 24rpx;
	background: rgba(0, 0, 0, 0.05);
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
	.content {
		background: #1A202C;
	}
	
	:root {
		--text-primary: #F7FAFC;
		--text-secondary: #E2E8F0;
		--text-light: #A0AEC0;
	}
	
	.weather-card {
		background: linear-gradient(135deg, #4A5568, #2D3748);
	}
	
	.action-card,
	.forecast-item {
		background: rgba(45, 55, 72, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.scan-button {
		background: rgba(45, 55, 72, 0.95);
		border-color: rgba(0, 230, 118, 0.3);
	}
	
	.scan-text {
		color: var(--primary-color);
	}
	
	.city-selector-content {
		background: #2D3748;
	}
	
	.city-selector-header {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}
	
	.search-input {
		background: #4A5568;
		border-color: rgba(255, 255, 255, 0.1);
		color: var(--text-primary);
	}
	
	.city-item {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}
	
	.city-item-text {
		color: var(--text-primary);
	}
	
	.status-bar {
		background: rgba(45, 55, 72, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.status-divider {
		background: rgba(255, 255, 255, 0.1);
	}
	
	.status-label {
		color: var(--text-secondary);
	}
}

</style>
