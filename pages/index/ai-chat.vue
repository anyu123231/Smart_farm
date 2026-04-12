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
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"/>
							<line x1="6" y1="6" x2="18" y2="18"/>
						</svg>
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
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2">
					<line x1="3" y1="12" x2="21" y2="12"/>
					<line x1="3" y1="6" x2="21" y2="6"/>
					<line x1="3" y1="18" x2="21" y2="18"/>
				</svg>
			</view>
			<text class="header-title">{{ currentSessionName || 'AI助手' }}</text>
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
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="1.5">
						<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
						<path d="M12 16v-4"/>
						<path d="M12 8h.01"/>
					</svg>
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
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="22" y1="2" x2="11" y2="13"/>
						<polygon points="22 2 15 22 11 13 2 9 22 2"/>
					</svg>
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
.chat-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #F5F7FA;
	position: relative;
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
	filter: blur(80rpx);
}

.glow-1 {
	width: 300rpx;
	height: 300rpx;
	background: rgba(0, 200, 83, 0.06);
	top: 100rpx;
	right: -50rpx;
}

.glow-2 {
	width: 250rpx;
	height: 250rpx;
	background: rgba(0, 176, 255, 0.04);
	bottom: 200rpx;
	left: -60rpx;
}

/* 会话面板 */
.session-panel {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	width: 70%;
	max-width: 300px;
	background: #FFFFFF;
	z-index: 100;
	display: flex;
	flex-direction: column;
	box-shadow: 2rpx 0 20rpx rgba(0, 0, 0, 0.1);
}

.session-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #EEEEEE;
}

.session-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #212121;
}

.close-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
}

.close-btn:active {
	background: #F5F5F5;
}

.session-list {
	flex: 1;
	padding: 20rpx;
}

.session-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx;
	margin-bottom: 16rpx;
	background: #F5F7FA;
	border-radius: 16rpx;
	border: 2rpx solid transparent;
}

.session-item.active {
	background: #E8F5E9;
	border-color: #00C853;
}

.session-info {
	flex: 1;
	overflow: hidden;
}

.session-name {
	font-size: 28rpx;
	color: #212121;
	font-weight: 500;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.session-time {
	font-size: 22rpx;
	color: #9E9E9E;
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
}

.delete-btn:active {
	background: #FFEBEE;
}

.new-session-btn {
	margin: 20rpx;
	padding: 28rpx;
	background: linear-gradient(135deg, #00C853 0%, #00E676 100%);
	border-radius: 16rpx;
	text-align: center;
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
}

/* 聊天头部 */
.chat-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 30rpx;
	background: #FFFFFF;
	border-bottom: 1rpx solid #EEEEEE;
	position: relative;
	z-index: 10;
}

.menu-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
}

.menu-btn:active {
	background: #F5F5F5;
}

.header-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #212121;
	flex: 1;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	padding: 0 20rpx;
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
}

.welcome-icon {
	width: 120rpx;
	height: 120rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
	border-radius: 50%;
	margin-bottom: 32rpx;
}

.welcome-title {
	font-size: 40rpx;
	font-weight: 700;
	color: #212121;
	margin-bottom: 16rpx;
}

.welcome-desc {
	font-size: 26rpx;
	color: #757575;
	text-align: center;
	margin-bottom: 48rpx;
}

.quick-questions {
	width: 100%;
}

.quick-title {
	font-size: 24rpx;
	color: #9E9E9E;
	margin-bottom: 20rpx;
	display: block;
}

.quick-item {
	background: #FFFFFF;
	border: 1rpx solid #E0E0E0;
	border-radius: 16rpx;
	padding: 24rpx 28rpx;
	margin-bottom: 16rpx;
	transition: all 0.2s ease;
}

.quick-item:active {
	background: #F5F7FA;
	border-color: #00C853;
}

.quick-item text {
	font-size: 26rpx;
	color: #424242;
	line-height: 1.5;
}

.message-item {
	display: flex;
	margin-bottom: 24rpx;
	position: relative;
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
}

.avatar.user {
	background: linear-gradient(135deg, #00C853 0%, #00E676 100%);
	margin-left: 16rpx;
}

.avatar.user text {
	color: white;
	font-size: 24rpx;
	font-weight: 600;
}

.avatar.assistant {
	background: linear-gradient(135deg, #2196F3 0%, #00B0FF 100%);
	margin-right: 16rpx;
}

.message-content {
	max-width: 70%;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 24rpx 28rpx;
	border: 1rpx solid #E0E0E0;
	position: relative;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.message-item.user .message-content {
	background: linear-gradient(135deg, #00C853 0%, #00E676 100%);
	border: none;
}

.message-item.user .message-content .message-text {
	color: white;
}

.message-text {
	font-size: 28rpx;
	color: #212121;
	line-height: 1.6;
	word-break: break-word;
}

.token-info {
	margin-top: 12rpx;
	padding-top: 12rpx;
	border-top: 1rpx solid #EEEEEE;
}

.token-info text {
	font-size: 20rpx;
	color: #9E9E9E;
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
	background: #00C853;
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
	background: #FFFFFF;
	padding: 20rpx 24rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	border-top: 1rpx solid #E0E0E0;
	z-index: 10;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: #F5F7FA;
	border-radius: 40rpx;
	padding: 8rpx 8rpx 8rpx 28rpx;
	border: 1rpx solid #E0E0E0;
}

.chat-input {
	flex: 1;
	font-size: 28rpx;
	color: #212121;
	background: transparent;
	height: 72rpx;
}

.chat-input::placeholder {
	color: #9E9E9E;
}

.send-btn {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #E0E0E0;
	color: #9E9E9E;
	transition: all 0.2s ease;
}

.send-btn.active {
	background: linear-gradient(135deg, #00C853 0%, #00E676 100%);
	color: white;
}

.send-btn.active:active {
	transform: scale(0.92);
}

.input-hint {
	display: block;
	text-align: center;
	font-size: 20rpx;
	color: #BDBDBD;
	margin-top: 12rpx;
}
</style>
