<template>
	<!-- 登录页面容器 -->
	<view class="login-container">
		<!-- 登录表单卡片 -->
		<view class="login-card">
			<!-- 应用Logo -->
			<image class="app-logo" src="/static/logo.png"></image>
			<!-- 应用名称 -->
			<text class="app-name">智慧农业</text>
			
			<!-- 登录表单 -->
			<view class="login-form">
				<!-- 用户名输入框 -->
				<view class="input-group">
					<text class="input-label">用户名</text>
					<view class="input-wrapper">
						<text class="input-icon">👤</text>
						<input 
							v-model="username" 
							class="input" 
							placeholder="请输入用户名"
							placeholder-class="placeholder"
						/>
					</view>
				</view>
				
				<!-- 密码输入框 -->
				<view class="input-group">
					<text class="input-label">密码</text>
					<view class="input-wrapper">
						<text class="input-icon">🔒</text>
						<input 
							v-model="password" 
							class="input" 
							type="password"
							placeholder="请输入密码"
							placeholder-class="placeholder"
						/>
					</view>
				</view>
				
				<!-- 登录按钮 -->
				<button class="login-button" @click="login">登录</button>
				
				<!-- 注册按钮 -->
				<button class="register-button" @click="register">注册</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			// 用户名
			username: '',
			// 密码
			password: ''
		}
	},
	methods: {
		// 登录方法
		login() {
			// 表单验证
			if (!this.username || !this.password) {
				uni.showToast({ title: '请输入用户名和密码', icon: 'none' });
				return;
			}
			
			// 发送登录请求
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
					// 登录成功
					if (res.data && res.data.code === 200) {
						// 保存用户信息到本地存储
						uni.setStorageSync('userInfo', res.data.data);
						uni.setStorageSync('token', res.data.token);
						
						// 显示成功提示
						uni.showToast({ title: '登录成功', icon: 'success' });
						
						// 返回上一页
						uni.navigateBack();
					} else {
						// 登录失败
						uni.showToast({ title: res.data.message || '登录失败', icon: 'none' });
					}
				},
				fail: (err) => {
					// 网络请求失败
					console.error('登录请求失败:', err);
					uni.showToast({ title: '网络请求失败', icon: 'none' });
				}
			});
		},
		
		// 注册方法
		register() {
			// 表单验证
			if (!this.username || !this.password) {
				uni.showToast({ title: '请输入用户名和密码', icon: 'none' });
				return;
			}
			
			// 发送注册请求
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
					// 注册成功
					if (res.data && res.data.code === 200) {
						uni.showToast({ title: '注册成功', icon: 'success' });
						// 自动登录
						this.login();
					} else {
						// 注册失败
						uni.showToast({ title: res.data.message || '注册失败', icon: 'none' });
					}
				},
				fail: (err) => {
					// 网络请求失败
					console.error('注册请求失败:', err);
					uni.showToast({ title: '网络请求失败', icon: 'none' });
				}
			});
		}
	}
}
</script>

<style>
/* 登录页面容器 */
.login-container {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	padding: 40rpx;
}

/* 登录卡片 */
.login-card {
	width: 100%;
	max-width: 500rpx;
	background-color: rgba(255, 255, 255, 0.95);
	border-radius: 30rpx;
	padding: 60rpx 40rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
	display: flex;
	flex-direction: column;
	align-items: center;
	backdrop-filter: blur(10rpx);
	transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.login-card:hover {
	transform: translateY(-10rpx);
	box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.25);
}

/* 应用Logo */
.app-logo {
	width: 160rpx;
	height: 160rpx;
	border-radius: 80rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
	transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.app-logo:hover {
	transform: scale(1.1);
}

/* 应用名称 */
.app-name {
	font-size: 48rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 60rpx;
	text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

/* 登录表单 */
.login-form {
	width: 100%;
}

/* 输入组 */
.input-group {
	margin-bottom: 30rpx;
}

/* 输入标签 */
.input-label {
	display: block;
	font-size: 28rpx;
	color: #333333;
	margin-bottom: 10rpx;
	font-weight: 600;
}

/* 输入框容器 */
.input-wrapper {
	display: flex;
	align-items: center;
	background-color: rgba(255, 255, 255, 0.8);
	border-radius: 20rpx;
	padding: 0 20rpx;
	height: 80rpx;
	border: 1rpx solid #e0e0e0;
	box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
	transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.input-wrapper:focus-within {
	border-color: #007AFF;
	box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.2);
}

/* 输入图标 */
.input-icon {
	font-size: 32rpx;
	margin-right: 15rpx;
	color: #999999;
}

/* 输入框 */
.input {
	flex: 1;
	height: 100%;
	font-size: 32rpx;
	color: #333333;
	background-color: transparent;
}

/* 占位符样式 */
.placeholder {
	color: #999999;
}

/* 登录按钮 */
.login-button {
	width: 100%;
	height: 80rpx;
	background: linear-gradient(135deg, #007AFF 0%, #0056b3 100%);
	color: #ffffff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 20rpx;
	margin-top: 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
	transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.login-button:active {
	transform: scale(0.98);
	box-shadow: 0 2rpx 6rpx rgba(0, 122, 255, 0.3);
}

/* 注册按钮 */
.register-button {
	width: 100%;
	height: 80rpx;
	background-color: rgba(255, 255, 255, 0.9);
	color: #007AFF;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 20rpx;
	border: 1rpx solid #007AFF;
	transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.register-button:active {
	background-color: rgba(0, 122, 255, 0.1);
	transform: scale(0.98);
}
</style>