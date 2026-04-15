<template>
	<view class="login-container">
		<view class="bg-decoration">
			<view class="circle circle-1"></view>
			<view class="circle circle-2"></view>
			<view class="circle circle-3"></view>
		</view>
		
		<view class="login-card">
			<view class="logo-wrapper">
				<image class="app-logo" src="/static/logo.png"></image>
				<view class="logo-glow"></view>
			</view>
			<text class="app-name">智慧农业</text>
			<text class="app-slogan">Smart Agriculture Platform</text>
			
			<view class="login-form">
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
								<circle cx="12" cy="7" r="4"/>
							</svg>
						</view>
						<input 
							v-model="username" 
							class="input" 
							placeholder="请输入用户名"
							placeholder-class="placeholder"
						/>
					</view>
				</view>
				
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
								<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
							</svg>
						</view>
						<input 
							v-model="password" 
							class="input" 
							type="password"
							placeholder="请输入密码"
							placeholder-class="placeholder"
						/>
					</view>
				</view>
				
				<button class="login-button" @click="login">
					<text class="btn-text">登 录</text>
				</button>
				
				<button class="register-button" @click="register">
					<text class="btn-text register-text">注 册</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			username: '',
			password: ''
		}
	},
	methods: {
		login() {
			if (!this.username || !this.password) {
				uni.showToast({ title: '请输入用户名和密码', icon: 'none' });
				return;
			}
			
			uni.request({
				url: 'http://175.24.203.151:3000/api/user/login',
				method: 'POST',
				header: {
					'Content-Type': 'application/json'
				},
				data: {
					username: this.username,
					password: this.password
				},
				success: (res) => {
					if (res.data && res.data.code === 200) {
						uni.setStorageSync('userInfo', res.data.data);
						uni.setStorageSync('token', res.data.token);
						uni.showToast({ title: '登录成功', icon: 'success' });
						uni.navigateBack();
					} else {
						uni.showToast({ title: res.data.message || '登录失败', icon: 'none' });
					}
				},
				fail: (err) => {
					console.error('登录请求失败:', err);
					uni.showToast({ title: '网络请求失败', icon: 'none' });
				}
			});
		},
		
		register() {
			if (!this.username || !this.password) {
				uni.showToast({ title: '请输入用户名和密码', icon: 'none' });
				return;
			}
			
			uni.request({
				url: 'http://175.24.203.151:3000/api/user/register',
				method: 'POST',
				header: {
					'Content-Type': 'application/json'
				},
				data: {
					username: this.username,
					password: this.password
				},
				success: (res) => {
					if (res.data && res.data.code === 200) {
						uni.showToast({ title: '注册成功', icon: 'success' });
						this.login();
					} else {
						uni.showToast({ title: res.data.message || '注册失败', icon: 'none' });
					}
				},
				fail: (err) => {
					console.error('注册请求失败:', err);
					uni.showToast({ title: '网络请求失败', icon: 'none' });
				}
			});
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
	--border-radius: 32rpx;
	--shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	--shadow-md: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
	--shadow-lg: 0 16rpx 48rpx rgba(0, 0, 0, 0.18);
}

.login-container {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	background: var(--background-color);
	padding: 60rpx 40rpx;
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

.circle {
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

.circle-1 {
	width: 400rpx;
	height: 400rpx;
	background: linear-gradient(135deg, var(--primary-color), transparent);
	top: -100rpx;
	right: -100rpx;
	animation-delay: 0s;
}

.circle-2 {
	width: 350rpx;
	height: 350rpx;
	background: linear-gradient(135deg, var(--secondary-color), transparent);
	bottom: 100rpx;
	left: -100rpx;
	animation-delay: 2s;
}

.circle-3 {
	width: 250rpx;
	height: 250rpx;
	background: linear-gradient(135deg, var(--primary-color), transparent);
	bottom: -50rpx;
	right: 80rpx;
	animation-delay: 4s;
}

/* 登录卡片 */
.login-card {
	width: 100%;
	max-width: 600rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: var(--border-radius);
	padding: 60rpx 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	position: relative;
	z-index: 1;
	box-shadow: var(--shadow-lg);
	backdrop-filter: blur(20rpx);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

.login-card:hover {
	transform: translateY(-4rpx);
	box-shadow: 0 20rpx 56rpx rgba(0, 0, 0, 0.15);
}

/* Logo区域 */
.logo-wrapper {
	position: relative;
	margin-bottom: 32rpx;
	animation: fadeInUp 1s ease-out 0.2s both;
}

.app-logo {
	width: 160rpx;
	height: 160rpx;
	border-radius: 32rpx;
	position: relative;
	z-index: 1;
	box-shadow: var(--shadow-md);
	transition: all 0.3s ease;
}

.app-logo:hover {
	transform: scale(1.05);
	box-shadow: var(--shadow-lg);
}

.logo-glow {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 200rpx;
	height: 200rpx;
	background: radial-gradient(circle, rgba(0, 230, 118, 0.2) 0%, transparent 70%);
	border-radius: 50%;
	animation: pulse 3s ease-in-out infinite;
}

/* 应用名称 */
.app-name {
	font-size: 48rpx;
	font-weight: 700;
	color: var(--text-primary);
	margin-bottom: 12rpx;
	letter-spacing: 4rpx;
	animation: fadeInUp 1s ease-out 0.4s both;
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.app-slogan {
	font-size: 24rpx;
	color: var(--text-light);
	margin-bottom: 64rpx;
	letter-spacing: 2rpx;
	animation: fadeInUp 1s ease-out 0.6s both;
}

/* 登录表单 */
.login-form {
	width: 100%;
	animation: fadeInUp 1s ease-out 0.8s both;
}

.input-group {
	margin-bottom: 32rpx;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: rgba(245, 247, 250, 0.9);
	border-radius: 20rpx;
	padding: 0 28rpx;
	height: 104rpx;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	backdrop-filter: blur(10rpx);
}

.input-wrapper:focus-within {
	border-color: var(--primary-color);
	box-shadow: 0 0 0 4rpx rgba(0, 230, 118, 0.15);
	transform: translateY(-2rpx);
}

.input-icon {
	margin-right: 20rpx;
	display: flex;
	align-items: center;
	transition: all 0.3s ease;
}

.input-wrapper:focus-within .input-icon {
	transform: scale(1.1);
}

.input {
	flex: 1;
	height: 100%;
	font-size: 32rpx;
	color: var(--text-primary);
	background-color: transparent;
}

.placeholder {
	color: var(--text-light);
}

/* 登录按钮 */
.login-button {
	width: 100%;
	height: 104rpx;
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
	border-radius: 20rpx;
	margin-top: 24rpx;
	margin-bottom: 24rpx;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 32rpx rgba(0, 230, 118, 0.3);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

.btn-text {
	font-size: 34rpx;
	font-weight: 600;
	color: #FFFFFF;
	letter-spacing: 6rpx;
	position: relative;
	z-index: 1;
}

/* 注册按钮 */
.register-button {
	width: 100%;
	height: 104rpx;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 20rpx;
	border: 1rpx solid rgba(0, 230, 118, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	backdrop-filter: blur(10rpx);
}

.register-button:hover {
	transform: translateY(-2rpx);
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.15);
	border-color: var(--primary-color);
}

.register-button:active {
	background: rgba(0, 230, 118, 0.1);
	transform: scale(0.98);
}

.register-text {
	color: var(--primary-color);
	font-size: 32rpx;
	font-weight: 600;
	letter-spacing: 4rpx;
}

/* 响应式设计 */
@media (max-width: 375px) {
	.login-card {
		padding: 52rpx 32rpx;
	}
	
	.app-logo {
		width: 140rpx;
		height: 140rpx;
	}
	
	.app-name {
		font-size: 40rpx;
	}
	
	.input-wrapper {
		height: 96rpx;
		padding: 0 24rpx;
	}
	
	.login-button,
	.register-button {
		height: 96rpx;
	}
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
	.login-container {
		background: #1A202C;
	}
	
	:root {
		--text-primary: #F7FAFC;
		--text-secondary: #E2E8F0;
		--text-light: #A0AEC0;
	}
	
	.login-card {
		background: rgba(45, 55, 72, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.input-wrapper {
		background: rgba(74, 85, 104, 0.5);
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.input {
		color: var(--text-primary);
	}
	
	.placeholder {
		color: var(--text-light);
	}
	
	.register-button {
		background: rgba(45, 55, 72, 0.95);
		border-color: rgba(0, 230, 118, 0.3);
	}
}
</style>
