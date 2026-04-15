<template>
	<view class="chat-container">
		<view class="bg-decoration">
			<view class="glow glow-1"></view>
			<view class="glow glow-2"></view>
		</view>

		<!-- 会话列表面板 -->
		<view class="session-panel" v-if="showSessionPanel">
			<view class="session-header">
				<text class="session-title">对话历史</text>
				<view class="close-btn" @click="toggleSessionPanel">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</view>
			</view>
			<scroll-view class="session-list" scroll-y>
				<view 
					v-for="session in sessions" 
					:key="session.id"
					class="session-item"
					:class="{ active: currentSessionId === session.id }"
					@click="loadSession(session.id)"
				>
					<view class="session-info">
						<text class="session-name">{{ session.session_name }}</text>
						<text class="session-time">{{ formatTime(session.updated_at) }}</text>
					</view>
					<view class="delete-btn" @click.stop="deleteSession(session.id)">
						<text class="delete-icon">✕</text>
					</view>
				</view>
			</scroll-view>
			<view class="new-session-btn" @click="createNewSession">
				<text>+ 新建对话</text>
			</view>
		</view>

		<!-- 遮罩层 -->
		<view class="mask" v-if="showSessionPanel" @click="toggleSessionPanel"></view>

		<view class="chat-header">
			<view class="menu-btn" @click="toggleSessionPanel">
				<text class="menu-icon">☰</text>
			</view>
			<view class="placeholder"></view>
		</view>

		<scroll-view 
			class="message-list" 
			scroll-y 
			:scroll-top="scrollTop"
			@scrolltoupper="onScrollToUpper"
		>
			<view v-if="messages.length === 0" class="welcome-section">
				<view class="welcome-icon">
					<text class="welcome-icon-text">🤖</text>
				</view>
				<text class="welcome-title">智慧农业AI助手</text>
				<text class="welcome-desc">我可以帮你解答种植、病虫害防治、设备使用等问题；登录后还可让我帮你开关已绑定的设备（请直接说设备名称与开/关）</text>
				
				<view class="quick-questions">
					<text class="quick-title">试试问我：</text>
					<view 
						v-for="(q, index) in quickQuestions" 
						:key="index" 
						class="quick-item"
						@click="askQuickQuestion(q)"
					>
						<text>{{ q }}</text>
					</view>
				</view>
			</view>

			<view v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.role">
				<view class="avatar" :class="msg.role">
					<text v-if="msg.role === 'user'">我</text>
					<svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
						<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
						<path d="M8 14s1.5 2 4 2 4-2 4-2"/>
						<line x1="9" y1="9" x2="9.01" y2="9"/>
						<line x1="15" y1="9" x2="15.01" y2="9"/>
					</svg>
				</view>
				<view class="message-content">
					<text class="message-text" :user-select="true">{{ msg.content }}</text>
					<view v-if="msg.role === 'assistant' && msg.usage" class="token-info">
						<text>消耗 {{ msg.usage.total_tokens }} tokens</text>
					</view>
				</view>
			</view>

			<view v-if="isLoading" class="message-item assistant">
				<view class="avatar assistant">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
						<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
						<path d="M8 14s1.5 2 4 2 4-2 4-2"/>
						<line x1="9" y1="9" x2="9.01" y2="9"/>
						<line x1="15" y1="9" x2="15.01" y2="9"/>
					</svg>
				</view>
				<view class="message-content">
					<view class="typing-indicator">
						<view class="dot"></view>
						<view class="dot"></view>
						<view class="dot"></view>
					</view>
				</view>
			</view>
		</scroll-view>

		<view class="input-area">
			<view class="input-wrapper">
				<input 
					v-model="inputText" 
					class="chat-input" 
					placeholder="输入你的问题..." 
					:disabled="isLoading"
					@confirm="sendMessage"
				/>
				<view 
				class="send-btn" 
				:class="{ active: inputText.trim() && !isLoading }"
				@click="sendMessage"
			>
				<text class="send-icon">➤</text>
			</view>
			</view>
			<text class="input-hint">按 Enter 发送</text>
		</view>
	</view>
</template>

<script>
import ai from '@/utils/ai.js'

const API_BASE = 'http://175.24.203.151:3000'

export default {
	data() {
		return {
			messages: [],
			inputText: '',
			isLoading: false,
			scrollTop: 0,
			quickQuestions: [
				'番茄叶子发黄怎么办？',
				'温室大棚如何通风？',
				'如何防治蚜虫？',
				'帮我打开第一个设备'
			],
			sessions: [],
			currentSessionId: null,
			currentSessionName: '',
			showSessionPanel: false,
			token: ''
		}
	},
	onLoad() {
		this.initAI()
		this.loadToken()
		this.loadSessions()
	},
	methods: {
		initAI() {
			ai.setServerUrl(API_BASE)
			// #ifdef H5
			const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID
			const accessKey = import.meta.env.VITE_CLOUDBASE_ACCESS_KEY
			if (envId && accessKey) {
				ai.init(envId, accessKey)
			}
			// #endif
		},
		loadToken() {
			// 从本地存储获取 token（优先从 token 字段读取，兼容 userInfo.token）
			this.token = uni.getStorageSync('token') || ''
			if (!this.token) {
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo && userInfo.token) {
					this.token = userInfo.token
				}
			}
		},
		async loadSessions() {
			if (!this.token) return
			
			try {
				const res = await this.request('/api/ai/sessions')
				if (res.code === 200) {
					this.sessions = res.data
					// 如果有会话，加载最新的一个
					if (this.sessions.length > 0 && !this.currentSessionId) {
						this.loadSession(this.sessions[0].id)
					}
				}
			} catch (err) {
				console.error('加载会话失败:', err)
			}
		},
		async loadSession(sessionId) {
			if (!this.token) {
				uni.showToast({ title: '请先登录', icon: 'none' })
				return
			}
			
			this.currentSessionId = sessionId
			const session = this.sessions.find(s => s.id === sessionId)
			if (session) {
				this.currentSessionName = session.session_name
			}
			
			try {
				const res = await this.request(`/api/ai/sessions/${sessionId}/messages`)
				if (res.code === 200) {
					this.messages = res.data.map(msg => ({
						role: msg.role,
						content: msg.content,
						usage: msg.usage
					}))
					this.scrollToBottom()
				}
			} catch (err) {
				console.error('加载消息失败:', err)
			}
			
			this.showSessionPanel = false
		},
		async createNewSession() {
			if (!this.token) {
				uni.showToast({ title: '请先登录', icon: 'none' })
				return
			}
			
			try {
				const res = await this.request('/api/ai/sessions', 'POST')
				if (res.code === 200) {
					this.currentSessionId = res.data.sessionId
					this.currentSessionName = '新对话'
					this.messages = []
					this.loadSessions()
				}
			} catch (err) {
				console.error('创建会话失败:', err)
			}
			
			this.showSessionPanel = false
		},
		async deleteSession(sessionId) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个对话吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							const result = await this.request(`/api/ai/sessions/${sessionId}`, 'DELETE')
							if (result.code === 200) {
								uni.showToast({ title: '删除成功', icon: 'success' })
								if (this.currentSessionId === sessionId) {
									this.currentSessionId = null
									this.currentSessionName = ''
									this.messages = []
								}
								this.loadSessions()
							}
						} catch (err) {
							console.error('删除会话失败:', err)
						}
					}
				}
			})
		},
		async sendMessage() {
			const text = this.inputText.trim()
			if (!text || this.isLoading) return

			// 如果没有会话，先创建一个
			if (!this.currentSessionId) {
				await this.createNewSession()
			}

			this.messages.push({
				role: 'user',
				content: text
			})
			this.inputText = ''
			this.isLoading = true
			this.scrollToBottom()

			// 保存用户消息
			await this.saveMessage('user', text)

			try {
				const chatMessages = this.messages.map(m => ({
					role: m.role,
					content: m.content
				}))

				let assistantMessage = { role: 'assistant', content: '', usage: null }
				this.messages.push(assistantMessage)
				const msgIndex = this.messages.length - 1

				const result = await ai.chat(chatMessages)

				this.messages[msgIndex].content = result.text
				this.messages[msgIndex].usage = result.usage
				
				// 保存 AI 回复
				await this.saveMessage('assistant', result.text)
			} catch (err) {
				console.error('[AI Chat] 发送失败:', err)
				this.messages.push({
					role: 'assistant',
					content: '抱歉，我遇到了一些问题，请稍后再试。错误信息：' + err.message
				})
			} finally {
				this.isLoading = false
				this.scrollToBottom()
			}
		},
		async saveMessage(role, content) {
			if (!this.currentSessionId || !this.token) return
			
			try {
				await this.request(`/api/ai/sessions/${this.currentSessionId}/messages`, 'POST', {
					role,
					content
				})
			} catch (err) {
				console.error('保存消息失败:', err)
			}
		},
		request(url, method = 'GET', data = null) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: API_BASE + url,
					method,
					data,
					header: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + this.token
					},
					success: (res) => {
						if (res.statusCode === 200) {
							resolve(res.data)
						} else {
							reject(new Error(res.data?.message || '请求失败'))
						}
					},
					fail: (err) => {
						reject(new Error(err.errMsg || '网络请求失败'))
					}
				})
			})
		},
		askQuickQuestion(question) {
			this.inputText = question
			this.sendMessage()
		},
		toggleSessionPanel() {
			this.showSessionPanel = !this.showSessionPanel
		},
		scrollToBottom() {
			this.$nextTick(() => {
				this.scrollTop = 999999
			})
		},
		onScrollToUpper() {},
		formatTime(timeStr) {
			if (!timeStr) return ''
			const date = new Date(timeStr)
			const now = new Date()
			const diff = now - date
			
			if (diff < 60000) return '刚刚'
			if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
			if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
			if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
			
			return date.toLocaleDateString()
		}
	}
}
</script>

<style>
/* 全局变量 */
:root {
	--primary-color: #00E676;
	--secondary-color: #00B0FF;
	--background-color: #F5F7FA;
	--text-primary: #212121;
	--text-secondary: #757575;
	--text-light: #9E9E9E;
	--border-color: #E0E0E0;
	--border-radius: 24rpx;
	--shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	--shadow-md: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
	--shadow-lg: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
}

.chat-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: var(--background-color);
	position: relative;
	font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

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

.glow-1 {
	width: 400rpx;
	height: 400rpx;
	background: linear-gradient(135deg, var(--primary-color), transparent);
	top: -100rpx;
	right: -100rpx;
}

.glow-2 {
	width: 350rpx;
	height: 350rpx;
	background: linear-gradient(135deg, var(--secondary-color), transparent);
	bottom: -100rpx;
	left: -100rpx;
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

/* 会话面板 */
.session-panel {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	width:70%;
	max-width: 320px;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20rpx);
	z-index: 100;
	display: flex;
	flex-direction: column;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
	border-right: 1rpx solid rgba(0, 0, 0, 0.05);
	animation: slideInLeft 0.3s ease-out;
	box-sizing: border-box;
}

@keyframes slideInLeft {
	from {
		transform: translateX(-100%);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
}

.session-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(10rpx);
	box-sizing: border-box;
	width: 100%;
}

.session-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary);
}

.close-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	transition: all 0.3s ease;
}

.close-btn:hover {
	background: rgba(0, 0, 0, 0.05);
}

.close-btn:active {
	transform: scale(0.9);
}

.session-list {
	flex: 1;
}

.session-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx;
	margin-bottom: 16rpx;
	background: rgba(245, 247, 250, 0.9);
	border-radius: 16rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
	backdrop-filter: blur(10rpx);
	box-sizing: border-box;
	width: 100%;
}

.session-item:hover {
	transform: translateY(-2rpx);
	box-shadow: var(--shadow-sm);
}

.session-item.active {
	background: rgba(0, 230, 118, 0.1);
	border-color: var(--primary-color);
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.2);
}

.session-info {
	flex: 1;
	overflow: hidden;
}

.session-name {
	font-size: 28rpx;
	color: var(--text-primary);
	font-weight: 500;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.session-time {
	font-size: 22rpx;
	color: var(--text-light);
	margin-top: 8rpx;
	display: block;
}

.delete-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	transition: all 0.3s ease;
}

.delete-btn:hover {
	background: rgba(255, 82, 82, 0.1);
}

.delete-btn:active {
	transform: scale(0.9);
}

.delete-icon {
	font-size: 28rpx;
	color: var(--text-light);
	font-weight: 600;
	line-height: 1;
}

.new-session-btn {
	margin: 20rpx;
	padding: 28rpx;
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
	border-radius: 16rpx;
	text-align: center;
	transition: all 0.3s ease;
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.3);
	box-sizing: border-box;
	width: calc(100% - 40rpx);
}

.new-session-btn:hover {
	transform: translateY(-2rpx);
	box-shadow: 0 8rpx 24rpx rgba(0, 230, 118, 0.4);
}

.new-session-btn:active {
	transform: scale(0.98);
}

.new-session-btn text {
	color: white;
	font-size: 28rpx;
	font-weight: 500;
}

.mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 99;
	animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

/* 聊天头部 */
.chat-header {
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20rpx);
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	position: relative;
	z-index: 10;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.menu-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	transition: all 0.3s ease;
}

.menu-btn:hover {
	background: rgba(0, 0, 0, 0.05);
}

.menu-btn:active {
	transform: scale(0.9);
}

.menu-icon {
	font-size: 32rpx;
	color: var(--text-primary);
	font-weight: 600;
}

.placeholder {
	width: 60rpx;
}

.message-list {
	flex: 1;
	padding: 20rpx 24rpx;
	padding-bottom: 180rpx;
	position: relative;
	z-index: 1;
}

.welcome-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 80rpx 40rpx;
	animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
	from {
		transform: translateY(30rpx);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

.welcome-icon {
	width: 120rpx;
	height: 120rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, rgba(0, 230, 118, 0.1), rgba(0, 230, 118, 0.2));
	border-radius: 50%;
	margin-bottom: 32rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 230, 118, 0.2);
	animation: pulse 2s ease-in-out infinite;
}

.welcome-icon-text {
	font-size: 60rpx;
	line-height: 1;
}

.welcome-title {
	font-size: 40rpx;
	font-weight: 700;
	color: var(--text-primary);
	margin-bottom: 16rpx;
	animation: fadeInUp 0.8s ease-out 0.2s both;
}

.welcome-desc {
	font-size: 26rpx;
	color: var(--text-secondary);
	text-align: center;
	margin-bottom: 48rpx;
	line-height: 1.6;
	animation: fadeInUp 0.8s ease-out 0.4s both;
}

.quick-questions {
	width: 100%;
	animation: fadeInUp 0.8s ease-out 0.6s both;
}

.quick-title {
	font-size: 24rpx;
	color: var(--text-light);
	margin-bottom: 20rpx;
	display: block;
}

.quick-item {
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(10rpx);
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	border-radius: 16rpx;
	padding: 24rpx 28rpx;
	margin-bottom: 16rpx;
	transition: all 0.3s ease;
	box-shadow: var(--shadow-sm);
}

.quick-item:hover {
	transform: translateY(-2rpx);
	box-shadow: var(--shadow-md);
	border-color: var(--primary-color);
}

.quick-item:active {
	transform: scale(0.98);
	background: rgba(0, 230, 118, 0.05);
	border-color: var(--primary-color);
}

.quick-item text {
	font-size: 26rpx;
	color: var(--text-primary);
	line-height: 1.5;
}

.message-item {
	display: flex;
	margin-bottom: 24rpx;
	position: relative;
	animation: fadeInUp 0.5s ease-out;
}

.message-item.user {
	flex-direction: row-reverse;
}

.avatar {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
}

.avatar:hover {
	transform: scale(1.05);
}

.avatar.user {
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
	margin-left: 16rpx;
}

.avatar.user text {
	color: white;
	font-size: 24rpx;
	font-weight: 600;
}

.avatar.assistant {
	background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
	margin-right: 16rpx;
}

.message-content {
	max-width: 70%;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(10rpx);
	border-radius: 20rpx;
	padding: 24rpx 28rpx;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	position: relative;
	box-shadow: var(--shadow-sm);
	transition: all 0.3s ease;
}

.message-content:hover {
	box-shadow: var(--shadow-md);
}

.message-item.user .message-content {
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
	border: none;
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.3);
}

.message-item.user .message-content .message-text {
	color: white;
}

.message-text {
	font-size: 28rpx;
	color: var(--text-primary);
	line-height: 1.6;
	word-break: break-word;
}

.token-info {
	margin-top: 12rpx;
	padding-top: 12rpx;
	border-top: 1rpx solid rgba(0, 0, 0, 0.05);
}

.token-info text {
	font-size: 20rpx;
	color: var(--text-light);
}

.typing-indicator {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 0;
}

.typing-indicator .dot {
	width: 12rpx;
	height: 12rpx;
	background: var(--primary-color);
	border-radius: 50%;
	animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator .dot:nth-child(1) {
	animation-delay: -0.32s;
}

.typing-indicator .dot:nth-child(2) {
	animation-delay: -0.16s;
}

@keyframes typing {
	0%, 80%, 100% {
		transform: scale(0.6);
		opacity: 0.4;
	}
	40% {
		transform: scale(1);
		opacity: 1;
	}
}

.input-area {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20rpx);
	padding: 20rpx 24rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	border-top: 1rpx solid rgba(0, 0, 0, 0.05);
	z-index: 10;
	box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: rgba(245, 247, 250, 0.9);
	backdrop-filter: blur(10rpx);
	border-radius: 40rpx;
	padding: 8rpx 8rpx 8rpx 28rpx;
	border: 1rpx solid rgba(0, 0, 0, 0.05);
	transition: all 0.3s ease;
}

.input-wrapper:focus-within {
	border-color: var(--primary-color);
	box-shadow: 0 0 0 4rpx rgba(0, 230, 118, 0.1);
}

.chat-input {
	flex: 1;
	font-size: 28rpx;
	color: var(--text-primary);
	background: transparent;
	height: 72rpx;
}

.chat-input::placeholder {
	color: var(--text-light);
}

.send-btn {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.05);
	color: var(--text-light);
	transition: all 0.3s ease;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.send-btn:hover {
	transform: scale(1.05);
}

.send-btn.active {
	background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
	color: white;
	box-shadow: 0 4rpx 16rpx rgba(0, 230, 118, 0.3);
}

.send-btn.active:active {
	transform: scale(0.92);
}

.send-icon {
	font-size: 28rpx;
	font-weight: 600;
	transform: rotate(45deg);
}

.input-hint {
	display: block;
	text-align: center;
	font-size: 20rpx;
	color: var(--text-light);
	margin-top: 12rpx;
}
</style>
