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
			
			<view class="map-card" :class="{ 'map-fullscreen': mapFullscreen }">
				<view class="map-header">
					<view class="map-title-wrapper">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2">
							<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
							<line x1="8" y1="2" x2="8" y2="18"/>
							<line x1="16" y1="6" x2="16" y2="22"/>
						</svg>
						<text class="map-title">位置地图</text>
					</view>
					<view class="map-actions">
						<view class="map-type-selector">
							<view class="map-type-btn" :class="{ active: mapType === 'normal' }" @click.stop="switchMapType('normal')">
								<text class="map-type-btn-text">普通</text>
							</view>
							<view class="map-type-btn" :class="{ active: mapType === 'satellite' }" @click.stop="switchMapType('satellite')">
								<text class="map-type-btn-text">卫星</text>
							</view>
							<view class="map-type-btn" :class="{ active: mapType === 'traffic' }" @click.stop="switchMapType('traffic')">
								<text class="map-type-btn-text">交通</text>
							</view>
						</view>
						<view class="map-locate-btn" @click.stop="relocateMap">
							<text class="map-btn-icon">⌖</text>
						</view>
						<view class="map-fullscreen-btn" @click.stop="toggleFullscreen">
							<text class="map-btn-icon" v-if="!mapFullscreen">⛶</text>
							<text class="map-btn-icon" v-else>⛶</text>
						</view>
					</view>
				</view>
				<view class="map-container">
					<!-- #ifdef H5 -->
					<view id="amap-container" class="amap-h5" :style="{ display: mapFullscreen ? 'block' : 'block' }"></view>
					<!-- #endif -->
					<!-- #ifdef APP-PLUS -->
					<map
					id="amap"
					class="amap"
					:longitude="mapLongitude"
					:latitude="mapLatitude"
					:scale="15"
					:show-location="true"
					:enable-zoom="true"
					:enable-scroll="true"
					:enable-rotate="false"
					:markers="mapMarkers"
					@markertap="onMarkerTap"
					@updated="onMapUpdated"
				></map>
				<!-- #endif -->
					<view class="map-loading" v-if="mapLoading">
						<text>地图加载中...</text>
					</view>
				</view>
			</view>
		</view>
		
		
		<view class="quick-actions">
			<view class="action-card" @click="goToDeviceList">
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
				updateTime: '',
				mapLongitude: 116.397428,
				mapLatitude: 39.90923,
				mapLoading: true,
				mapMarkers: [],
				mapType: 'normal',
				showTraffic: false,
				mapFullscreen: false,
				amapInstance: null,
				satelliteLayer: null,
				trafficLayer: null,
				amapMarker: null,
				appMapReady: false,
				trafficLayerInstance: null
			}
		},
		computed: {
		},
		onLoad() {
			this.initWeather()
		},
		mounted() {
			// #ifdef H5
			this.initAmap()
			// #endif
		},
		onShow() {
			// #ifdef H5
			// 添加ESC键监听退出全屏（仅H5端）
			document.addEventListener('keydown', this.handleKeyDown)
			// 重新调整地图大小
			this.$nextTick(() => {
				if (this.amapInstance) {
					this.amapInstance.resize()
				}
			})
			// #endif
			// 每次进入首页自动获取位置
			this.getLocation()
		},
		onHide() {
			// #ifdef H5
			// 移除ESC键监听（仅H5端）
			document.removeEventListener('keydown', this.handleKeyDown)
			// #endif
		},
		onUnload() {
			// #ifdef H5
			// 页面卸载时移除ESC键监听（仅H5端）
			document.removeEventListener('keydown', this.handleKeyDown)
			// #endif
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
							type: 'gcj02',
							isHighAccuracy: true,
							altitude: true,
							geocode: true,
							success: resolve,
							fail: reject
						})
					})
					
					const location = `${position.longitude},${position.latitude}`
					
					this.mapLongitude = position.longitude
					this.mapLatitude = position.latitude
					this.mapLoading = false
					this.updateMapMarker()
					
					// #ifdef H5
					if (this.amapInstance) {
						this.amapInstance.setCenter([position.longitude, position.latitude])
						this.amapInstance.setZoom(15)
						this.updateAmapMarker(position.longitude, position.latitude)
					}
					// #endif
					
					await this.getLocationId(location)
				} catch (error) {
					console.error('定位失败:', error)
					this.cityName = '点击选择城市'
					this.loading = false
					this.mapLoading = false
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
			
			goToDeviceList() {
				uni.switchTab({
					url: '/pages/index/devices'
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
			},
			
			updateMapMarker() {
				this.mapMarkers = [{
					id: 1,
					latitude: this.mapLatitude,
					longitude: this.mapLongitude,
					title: this.cityName || '当前位置',
					iconPath: '/static/logo.png',
					width: 30,
					height: 30,
					callout: {
						content: this.cityName || '当前位置',
						display: 'ALWAYS',
						padding: 10,
						borderRadius: 5,
						bgColor: '#FFFFFF',
						color: '#333333',
						fontSize: 14,
						textAlign: 'center'
					}
				}]
			},
			
			relocateMap() {
				this.mapLoading = true
				uni.getLocation({
					type: 'gcj02',
					isHighAccuracy: true,
					success: (res) => {
						this.mapLongitude = res.longitude
						this.mapLatitude = res.latitude
						this.mapLoading = false
						this.updateMapMarker()
						
						// #ifdef H5
						if (this.amapInstance) {
							this.amapInstance.setCenter([res.longitude, res.latitude])
							this.amapInstance.setZoom(15)
							this.updateAmapMarker(res.longitude, res.latitude)
						}
						// #endif
						
						uni.showToast({
							title: '定位成功',
							icon: 'success'
						})
					},
					fail: (err) => {
						console.error('重新定位失败:', err)
						this.mapLoading = false
						uni.showToast({
							title: '定位失败',
							icon: 'none'
						})
					}
				})
			},
			
			onMarkerTap() {
				uni.showToast({
					title: this.cityName || '当前位置',
					icon: 'none'
				})
			},
			
			switchMapType(type) {
				if (this.mapType === type) return
				
				this.mapType = type
				
				const typeNames = {
					normal: '普通地图',
					satellite: '卫星地图',
					traffic: '交通地图'
				}
				
				// #ifdef H5
				this.switchAmapLayer(type)
				// #endif
				
				// #ifdef APP-PLUS
				this.switchAppMapLayer(type)
				// #endif
				
				uni.showToast({
					title: `已切换到${typeNames[type]}`,
					icon: 'none'
				})
			},
			
			// #ifdef APP-PLUS
			switchAppMapLayer(type) {
				const doSwitch = () => {
					const mapContext = uni.createMapContext('amap', this)
					const nativeMap = mapContext.$getAppMap()
					
					if (!nativeMap) {
						console.log('原生地图对象未就绪，重试中...')
						setTimeout(doSwitch, 300)
						return
					}
					
					const map = nativeMap
					
					if (type === 'satellite') {
						map.setMapType(plus.maps.MapType.MAPTYPE_SATELLITE)
						console.log('已切换到卫星地图')
					} else if (type === 'traffic') {
						map.setMapType(plus.maps.MapType.MAPTYPE_NORMAL)
						map.setTraffic(true)
						console.log('已切换到交通地图')
					} else {
						map.setMapType(plus.maps.MapType.MAPTYPE_NORMAL)
						map.setTraffic(false)
						console.log('已切换到普通地图')
					}
				}
				
				doSwitch()
			},
			// #endif
			
			// #ifdef H5
			initAmap() {
				this.$nextTick(() => {
					const container = document.getElementById('amap-container')
					if (!container || typeof AMap === 'undefined') {
						setTimeout(() => this.initAmap(), 500)
						return
					}
					
					this.amapInstance = new AMap.Map('amap-container', {
						center: [this.mapLongitude, this.mapLatitude],
						zoom: 15,
						resizeEnable: true
					})
					
					this.satelliteLayer = new AMap.TileLayer.Satellite()
					this.trafficLayer = new AMap.TileLayer.Traffic()
					
					this.amapInstance.on('click', (e) => {
						uni.showToast({
							title: `${e.lnglat.lng.toFixed(6)}, ${e.lnglat.lat.toFixed(6)}`,
							icon: 'none'
						})
					})
					
					// 如果已有定位数据，添加标记
					if (this.mapLongitude !== 116.397428 || this.mapLatitude !== 39.90923) {
						this.updateAmapMarker(this.mapLongitude, this.mapLatitude)
					}
					
					this.mapLoading = false
				})
			},
			
			updateAmapMarker(lng, lat) {
				if (!this.amapInstance) return
				
				if (this.amapMarker) {
					this.amapInstance.remove(this.amapMarker)
				}
				
				this.amapMarker = new AMap.Marker({
					position: [lng, lat],
					title: this.cityName || '当前位置',
					content: `<div style="width:24px;height:24px;background:#00E676;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`
				})
				
				this.amapInstance.add(this.amapMarker)
			},
			
			switchAmapLayer(type) {
				if (!this.amapInstance) return
				
				this.amapInstance.remove(this.satelliteLayer)
				this.amapInstance.remove(this.trafficLayer)
				
				if (type === 'satellite') {
					this.amapInstance.add(this.satelliteLayer)
				} else if (type === 'traffic') {
					this.amapInstance.add(this.trafficLayer)
				}
			},
			// #endif
			
			toggleFullscreen() {
				this.mapFullscreen = !this.mapFullscreen
				
				if (this.mapFullscreen) {
					uni.showToast({
						title: '全屏模式',
						icon: 'none'
					})
				} else {
					uni.showToast({
						title: '退出全屏',
						icon: 'none'
					})
				}
			},
			
			handleKeyDown(e) {
				if (e.key === 'Escape' && this.mapFullscreen) {
					this.toggleFullscreen()
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
	z-index: 0;
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
	z-index: 0;
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

.map-card {
	margin-top: 28rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: var(--border-radius);
	padding: 0;
	box-shadow: var(--shadow-md);
	backdrop-filter: blur(20rpx);
	overflow: hidden;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	animation: fadeInUp 1.4s ease-out 0.8s both;
}

.map-header {
	padding: 24rpx 28rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.map-actions {
	display: flex;
	align-items: center;
	gap: 16rpx;
	position: relative;
	z-index: 10001;
	pointer-events: auto;
}

.map-type-selector {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 6rpx;
	background: rgba(0, 0, 0, 0.04);
	border-radius: 12rpx;
}

.map-type-btn {
	padding: 10rpx 18rpx;
	border-radius: 8rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
}

.map-type-btn.active {
	background: rgba(0, 230, 118, 0.15);
	box-shadow: 0 2rpx 8rpx rgba(0, 230, 118, 0.2);
}

.map-type-btn:hover {
	background: rgba(0, 0, 0, 0.06);
}

.map-type-btn.active:hover {
	background: rgba(0, 230, 118, 0.25);
}

.map-type-btn-text {
	font-size: 20rpx;
	color: var(--text-secondary);
	font-weight: 500;
}

.map-type-btn.active .map-type-btn-text {
	color: var(--primary-color);
	font-weight: 600;
}

.map-title-wrapper {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.map-title {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-primary);
}

.map-locate-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 14rpx;
	background: rgba(0, 230, 118, 0.08);
	border-radius: 12rpx;
	border: 1rpx solid rgba(0, 230, 118, 0.2);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
}

.map-locate-btn:hover {
	background: rgba(0, 230, 118, 0.15);
	transform: translateY(-2rpx);
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.15);
}

.map-locate-btn:active {
	background: rgba(0, 230, 118, 0.2);
	transform: scale(0.95);
}

.map-fullscreen-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 14rpx;
	background: rgba(0, 176, 255, 0.08);
	border-radius: 12rpx;
	border: 1rpx solid rgba(0, 176, 255, 0.2);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
}

.map-fullscreen-btn:hover {
	background: rgba(0, 176, 255, 0.15);
	transform: translateY(-2rpx);
	box-shadow: 0 4rpx 16rpx rgba(0, 176, 255, 0.15);
}

.map-fullscreen-btn:active {
	background: rgba(0, 176, 255, 0.2);
	transform: scale(0.95);
}

.map-btn-icon {
	font-size: 36rpx;
	color: var(--primary-color);
	font-weight: bold;
	line-height: 1;
}

.map-container {
	position: relative;
	width: 100%;
	height: 400rpx;
}

.map-fullscreen {
	position: fixed !important;
	top: 0 !important;
	left: 0 !important;
	right: 0 !important;
	bottom: 0 !important;
	z-index: 999999 !important;
	margin: 0 !important;
	border-radius: 0 !important;
	width: 100vw !important;
	height: 100vh !important;
	max-height: 100vh !important;
	overflow: hidden !important;
	animation: none !important;
	display: flex !important;
	flex-direction: column !important;
	background: #ffffff;
}

.map-fullscreen .map-header {
	padding: 16rpx 35rpx !important;
	/* #ifdef H5 */
	padding-top: 80rpx !important;
	/* #endif */
	/* #ifdef APP-PLUS */
	padding-top: 16rpx !important;
	/* #endif */
	background: rgba(255, 255, 255, 0.98) !important;
	backdrop-filter: blur(20rpx);
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
	z-index: 1000000 !important;
	position: sticky !important;
	top: 0 !important;
	left: 0 !important;
	right: 0 !important;
	display: flex !important;
	justify-content: space-between !important;
	align-items: center !important;
	min-height: 80rpx !important;
	flex-shrink: 0 !important;
}

.map-fullscreen .map-container {
	flex: 1 !important;
	height: auto !important;
	max-height: none !important;
	position: relative !important;
	overflow: hidden;
}

.map-fullscreen .map-actions {
	gap: 12rpx;
	z-index: 1000001 !important;
	pointer-events: auto;
}

.map-fullscreen .map-type-selector {
	gap: 6rpx;
}

.map-fullscreen .map-type-btn {
	padding: 8rpx 14rpx;
}

.map-fullscreen .map-type-btn-text {
	font-size: 18rpx;
}

.amap {
	width: 100%;
	height: 100%;
}

/* #ifdef H5 */
.amap-h5 {
	width: 100%;
	height: 400rpx;
}
/* #endif */

.map-loading {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background: rgba(255, 255, 255, 0.8);
	backdrop-filter: blur(10rpx);
	font-size: 26rpx;
	color: var(--text-secondary);
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
	z-index: 0;
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
	
	.map-header {
		flex-wrap: wrap;
		gap: 16rpx;
	}
	
	.map-actions {
		width: 100%;
		justify-content: space-between;
	}
	
	.map-type-selector {
		flex: 1;
		justify-content: center;
	}
	
	.map-type-btn {
		padding: 8rpx 14rpx;
	}
	
	.map-type-btn-text {
		font-size: 18rpx;
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
	z-index: 0;
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

.map-fullscreen .amap-h5 {
	height: 100% !important;
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
	
	.map-card {
		background: rgba(45, 55, 72, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.map-header {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}
	
	.map-title {
		color: var(--text-primary);
	}
	
	.map-locate-btn {
		background: rgba(0, 230, 118, 0.15);
		border-color: rgba(0, 230, 118, 0.3);
	}
	
	.map-locate-btn:hover {
		background: rgba(0, 230, 118, 0.25);
	}
	
	.map-fullscreen-btn {
		background: rgba(0, 176, 255, 0.15);
		border-color: rgba(0, 176, 255, 0.3);
	}
	
	.map-fullscreen-btn:hover {
		background: rgba(0, 176, 255, 0.25);
	}
	
	.map-type-selector {
		background: rgba(255, 255, 255, 0.08);
	}
	
	.map-type-btn:hover {
		background: rgba(255, 255, 255, 0.12);
	}
	
	.map-type-btn.active {
		background: rgba(0, 230, 118, 0.25);
	}
	
	.map-fullscreen .map-header {
		background: rgba(45, 55, 72, 0.95);
	}
	
	.map-loading {
		background: rgba(45, 55, 72, 0.8);
		color: var(--text-secondary);
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
