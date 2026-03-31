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
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

<style>
.login-container {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	background: #0D0D1A;
	padding: 60rpx 40rpx;
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

.circle {
	position: absolute;
	border-radius: 50%;
	opacity: 0.08;
}

.circle-1 {
	width: 400rpx;
	height: 400rpx;
	background: #00E676;
	top: -100rpx;
	right: -100rpx;
}

.circle-2 {
	width: 300rpx;
	height: 300rpx;
	background: #00B0FF;
	bottom: 100rpx;
	left: -80rpx;
}

.circle-3 {
	width: 200rpx;
	height: 200rpx;
	background: #00E676;
	bottom: -50rpx;
	right: 80rpx;
}

.login-card {
	width: 100%;
	max-width: 600rpx;
	background: rgba(30, 30, 45, 0.9);
	border-radius: 32rpx;
	padding: 60rpx 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	border: 1rpx solid rgba(0, 230, 118, 0.15);
	position: relative;
	z-index: 1;
}

.logo-wrapper {
	position: relative;
	margin-bottom: 24rpx;
}

.app-logo {
	width: 140rpx;
	height: 140rpx;
	border-radius: 32rpx;
	position: relative;
	z-index: 1;
}

.logo-glow {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 180rpx;
	height: 180rpx;
	background: radial-gradient(circle, rgba(0, 230, 118, 0.2) 0%, transparent 70%);
	border-radius: 50%;
}

.app-name {
	font-size: 44rpx;
	font-weight: 700;
	color: #FFFFFF;
	margin-bottom: 8rpx;
	letter-spacing: 4rpx;
}

.app-slogan {
	font-size: 22rpx;
	color: #757575;
	margin-bottom: 60rpx;
	letter-spacing: 2rpx;
}

.login-form {
	width: 100%;
}

.input-group {
	margin-bottom: 28rpx;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: rgba(44, 44, 62, 0.8);
	border-radius: 16rpx;
	padding: 0 24rpx;
	height: 96rpx;
	border: 1rpx solid rgba(51, 51, 85, 0.6);
	transition: all 0.3s ease;
}

.input-wrapper:focus-within {
	border-color: #00E676;
	box-shadow: 0 0 0 2rpx rgba(0, 230, 118, 0.15);
}

.input-icon {
	margin-right: 16rpx;
	display: flex;
	align-items: center;
}

.input {
	flex: 1;
	height: 100%;
	font-size: 30rpx;
	color: #E0E0E0;
	background-color: transparent;
}

.placeholder {
	color: #616161;
}

.login-button {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, #00E676 0%, #00C853 100%);
	border-radius: 16rpx;
	margin-top: 20rpx;
	margin-bottom: 20rpx;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 20rpx rgba(0, 230, 118, 0.3);
	transition: all 0.3s ease;
}

.login-button:active {
	transform: scale(0.98);
	box-shadow: 0 2rpx 10rpx rgba(0, 230, 118, 0.3);
}

.btn-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #0D0D1A;
	letter-spacing: 4rpx;
}

.register-button {
	width: 100%;
	height: 96rpx;
	background: transparent;
	border-radius: 16rpx;
	border: 1rpx solid rgba(0, 230, 118, 0.4);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
}

.register-button:active {
	background: rgba(0, 230, 118, 0.1);
	transform: scale(0.98);
}

.register-text {
	color: #00E676;
}
</style>
