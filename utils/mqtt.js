// MQTT 工具模块 - 支持 H5 和小程序/APP 端
// 使用原生 WebSocket 实现，避免平台兼容性问题

let client = null
let currentAppId = null
let reconnectTimer = null
let fixedClientId = null
let wsConnection = null
let isConnecting = false // 是否正在连接中（避免重复创建连接）

function getClientId(appId) {
	// 基于 appId 生成固定的 clientId，确保同一账号在不同设备上使用相同的 clientId
	// 这样电脑端和手机端不会同时在线（互踢），巴法云只显示一个订阅者
	if (!fixedClientId) {
		// 使用 appId 生成固定的 clientId，去掉特殊字符，只保留字母数字
		const cleanAppId = appId.replace(/[^a-zA-Z0-9]/g, '')
		fixedClientId = 'app_' + cleanAppId.substring(0, 16)
	}
	return fixedClientId
}

// 字符串转 Uint8Array（兼容小程序/APP）
function stringToBytes(str) {
	const bytes = []
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		if (char < 0x80) {
			bytes.push(char)
		} else if (char < 0x800) {
			bytes.push(0xc0 | (char >> 6), 0x80 | (char & 0x3f))
		} else if (char < 0xd800 || char >= 0xe000) {
			bytes.push(0xe0 | (char >> 12), 0x80 | ((char >> 6) & 0x3f), 0x80 | (char & 0x3f))
		} else {
			i++
			const char2 = str.charCodeAt(i)
			const surrogate = 0x10000 + (((char & 0x3ff) << 10) | (char2 & 0x3ff))
			bytes.push(0xf0 | (surrogate >> 18), 0x80 | ((surrogate >> 12) & 0x3f), 0x80 | ((surrogate >> 6) & 0x3f), 0x80 | (surrogate & 0x3f))
		}
	}
	return new Uint8Array(bytes)
}

// Uint8Array 转字符串（兼容小程序/APP）
function bytesToString(bytes) {
	let str = ''
	let i = 0
	while (i < bytes.length) {
		const byte1 = bytes[i]
		if (byte1 < 0x80) {
			str += String.fromCharCode(byte1)
			i++
		} else if ((byte1 & 0xe0) === 0xc0) {
			const byte2 = bytes[i + 1]
			str += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f))
			i += 2
		} else if ((byte1 & 0xf0) === 0xe0) {
			const byte2 = bytes[i + 1]
			const byte3 = bytes[i + 2]
			str += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f))
			i += 3
		} else {
			const byte2 = bytes[i + 1]
			const byte3 = bytes[i + 2]
			const byte4 = bytes[i + 3]
			const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f)
			str += String.fromCharCode(0xd800 + ((codePoint - 0x10000) >> 10), 0xdc00 + ((codePoint - 0x10000) & 0x3ff))
			i += 4
		}
	}
	return str
}

// 简单的 MQTT 协议实现
class SimpleMqttClient {
	constructor(ws, options) {
		this.ws = ws
		this.options = options
		this.connected = false
		this.messageId = 1
		this.subscribedTopics = [] // 已订阅的主题列表（避免重复订阅）
		
		this.ws.onOpen(() => {
			this.sendConnect()
		})
		
		this.ws.onMessage((res) => {
			this.handleMessage(res.data)
		})
		
		this.ws.onClose(() => {
			this.connected = false
			console.log('[MQTT] WebSocket 已关闭')
		})
		
		this.ws.onError((err) => {
			console.error('[MQTT] WebSocket 错误:', err)
		})
	}
	
	// 发送 MQTT CONNECT 包
	sendConnect() {
		const { clientId, clean, keepalive, username, password } = this.options
		
		// 将字符串转为字节
		const protocolName = stringToBytes('MQTT')
		const clientIdBytes = stringToBytes(clientId)
		const usernameBytes = stringToBytes(username)
		const passwordBytes = stringToBytes(password)
		
		// 计算剩余长度
		const remainingLength = 2 + protocolName.length + 1 + 1 + 2 + 
			2 + clientIdBytes.length + 
			2 + usernameBytes.length + 
			2 + passwordBytes.length
		
		// 构建 CONNECT 包
		const packet = new Uint8Array(2 + remainingLength)
		let pos = 0
		
		// 固定头: CONNECT 类型 (0x10)
		packet[pos++] = 0x10
		packet[pos++] = remainingLength
		
		// 协议名长度 + 协议名
		packet[pos++] = 0
		packet[pos++] = protocolName.length
		packet.set(protocolName, pos)
		pos += protocolName.length
		
		// 协议级别 (4 = MQTT 3.1.1)
		packet[pos++] = 4
		
		// 连接标志 (clean session + username + password)
		let connectFlags = 0
		if (clean) connectFlags |= 0x02
		connectFlags |= 0x80 // username
		connectFlags |= 0x40 // password
		packet[pos++] = connectFlags
		
		// Keep alive
		packet[pos++] = (keepalive >> 8) & 0xFF
		packet[pos++] = keepalive & 0xFF
		
		// Client ID
		packet[pos++] = (clientIdBytes.length >> 8) & 0xFF
		packet[pos++] = clientIdBytes.length & 0xFF
		packet.set(clientIdBytes, pos)
		pos += clientIdBytes.length
		
		// Username
		packet[pos++] = (usernameBytes.length >> 8) & 0xFF
		packet[pos++] = usernameBytes.length & 0xFF
		packet.set(usernameBytes, pos)
		pos += usernameBytes.length
		
		// Password
		packet[pos++] = (passwordBytes.length >> 8) & 0xFF
		packet[pos++] = passwordBytes.length & 0xFF
		packet.set(passwordBytes, pos)
		
		this.send(packet)
	}
	
	// 处理收到的消息
	handleMessage(data) {
		if (!(data instanceof ArrayBuffer)) {
			console.warn('[MQTT] 收到的数据不是 ArrayBuffer')
			return
		}
		
		const buf = new Uint8Array(data)
		const packetType = (buf[0] >> 4) & 0x0F
		
		switch (packetType) {
			case 2: // CONNACK
				this.connected = true
				console.log('[MQTT] 连接成功')
				// 通知连接成功（小程序/APP端）
				uni.$emit('mqtt:connected')
				break
				
			case 3: // PUBLISH
				this.handlePublish(buf)
				break
				
			case 4: // PUBACK
				break
				
			case 9: // SUBACK
				console.log('[MQTT] 订阅确认')
				break
				
			case 13: // PINGRESP
				break
		}
	}
	
	// 处理 PUBLISH 包
	handlePublish(buf) {
		let pos = 2 // 跳过固定头
		
		// 读取 topic 长度
		const topicLen = (buf[pos] << 8) | buf[pos + 1]
		pos += 2
		
		// 读取 topic
		const topic = bytesToString(buf.slice(pos, pos + topicLen))
		pos += topicLen
		
		// 读取 payload
		const payload = bytesToString(buf.slice(pos))
		
		console.log('[MQTT] 收到消息, topic:', topic, 'msg:', payload)
		uni.$emit('mqtt:message', { topic, msg: payload })
	}
	
	// 发送数据
	send(data) {
		this.ws.send({
			data: data.buffer || data,
			complete: () => {}
		})
	}
	
	// 订阅主题
	subscribe(topic, opts = {}, callback) {
		if (!this.connected) {
			console.warn('[MQTT] 未连接，无法订阅')
			return
		}
		
		// 检查是否已经订阅过
		if (this.subscribedTopics.indexOf(topic) !== -1) {
			console.log('[MQTT] 已经订阅过:', topic)
			if (callback) callback(null)
			return
		}
		
		const topicBytes = stringToBytes(topic)
		const qos = opts.qos || 0
		const messageId = this.messageId++
		
		// 计算剩余长度
		const remainingLength = 2 + 2 + topicBytes.length + 1
		
		// 构建 SUBSCRIBE 包
		const packet = new Uint8Array(2 + remainingLength)
		let pos = 0
		
		// 固定头: SUBSCRIBE 类型 (0x82)
		packet[pos++] = 0x82
		packet[pos++] = remainingLength
		
		// Message ID
		packet[pos++] = (messageId >> 8) & 0xFF
		packet[pos++] = messageId & 0xFF
		
		// Topic length + topic
		packet[pos++] = (topicBytes.length >> 8) & 0xFF
		packet[pos++] = topicBytes.length & 0xFF
		packet.set(topicBytes, pos)
		pos += topicBytes.length
		
		// QoS
		packet[pos++] = qos
		
		this.send(packet)
		
		// 添加到已订阅列表
		this.subscribedTopics.push(topic)
		console.log('[MQTT] 订阅:', topic)
		
		// 通知订阅成功（小程序/APP端）
		uni.$emit('mqtt:subscribed', { topic })
		
		if (callback) callback(null)
	}
	
	// 取消订阅
	unsubscribe(topic, callback) {
		// 从已订阅列表中移除（无论是否连接都要移除）
		const index = this.subscribedTopics.indexOf(topic)
		if (index > -1) {
			this.subscribedTopics.splice(index, 1)
		}
		
		// 如果未连接，只记录日志，不发送 UNSUBSCRIBE 包
		if (!this.connected) {
			console.log('[MQTT] 未连接，仅从本地移除订阅:', topic)
			if (callback) callback(null)
			return
		}
		
		const topicBytes = stringToBytes(topic)
		const messageId = this.messageId++
		
		// 计算剩余长度
		const remainingLength = 2 + 2 + topicBytes.length
		
		// 构建 UNSUBSCRIBE 包
		const packet = new Uint8Array(2 + remainingLength)
		let pos = 0
		
		// 固定头: UNSUBSCRIBE 类型 (0xA2)
		packet[pos++] = 0xA2
		packet[pos++] = remainingLength
		
		// Message ID
		packet[pos++] = (messageId >> 8) & 0xFF
		packet[pos++] = messageId & 0xFF
		
		// Topic length + topic
		packet[pos++] = (topicBytes.length >> 8) & 0xFF
		packet[pos++] = topicBytes.length & 0xFF
		packet.set(topicBytes, pos)
		
		this.send(packet)
		
		console.log('[MQTT] 取消订阅:', topic)
		
		if (callback) callback(null)
	}
	
	// 发布消息
	publish(topic, message, opts = {}) {
		if (!this.connected) {
			console.warn('[MQTT] 未连接，无法发布')
			return false
		}
		
		const topicBytes = stringToBytes(topic)
		const msgBytes = stringToBytes(message)
		const qos = opts.qos || 0
		
		// 计算剩余长度
		const remainingLength = 2 + topicBytes.length + msgBytes.length
		
		// 构建 PUBLISH 包
		const packet = new Uint8Array(2 + remainingLength)
		let pos = 0
		
		// 固定头: PUBLISH 类型 (0x30)
		let packetType = 0x30
		if (qos === 1) packetType |= 0x02
		packet[pos++] = packetType
		packet[pos++] = remainingLength
		
		// Topic length + topic
		packet[pos++] = (topicBytes.length >> 8) & 0xFF
		packet[pos++] = topicBytes.length & 0xFF
		packet.set(topicBytes, pos)
		pos += topicBytes.length
		
		// Payload
		packet.set(msgBytes, pos)
		
		this.send(packet)
		return true
	}
	
	// 关闭连接
	end() {
		if (this.ws) {
			// 发送 DISCONNECT
			this.send(new Uint8Array([0xE0, 0x00]))
			this.ws.close()
		}
	}
}

function connect(appId, secretKey) {
	// 检查是否已连接或正在连接
	if (client && client.connected) {
		console.log('[MQTT] 已连接，跳过重复连接')
		return
	}
	if (isConnecting) {
		console.log('[MQTT] 正在连接中，跳过')
		return
	}

	if (!appId || !secretKey) {
		console.warn('[MQTT] 缺少 appId 或 secretKey，无法连接')
		return
	}

	// 如果 appId 变化了，重置 clientId
	if (currentAppId && currentAppId !== appId) {
		fixedClientId = null
	}

	currentAppId = appId
	clearReconnectTimer()

	const clientId = getClientId(appId)

	console.log('[MQTT] 正在连接巴法云(appID认证)...', 'clientId:', clientId)

	// #ifdef H5
	// H5 端使用 mqtt 库
	isConnecting = true
	import('mqtt').then(mqtt => {
		const options = {
			clientId: clientId,
			clean: true,
			connectTimeout: 10000,
			reconnectPeriod: 5000,
			keepalive: 120,
			username: appId,
			password: secretKey
		}

		client = mqtt.default.connect('wss://bemfa.com:9504/wss', options)
		setupClientEventHandlers()
		isConnecting = false
	})
	// #endif

	// #ifndef H5
	// 小程序/APP 端使用原生 WebSocket + 简化 MQTT 实现
	isConnecting = true
	const options = {
		clientId: clientId,
		clean: true,
		keepalive: 120,
		username: appId,
		password: secretKey
	}

	// 创建 WebSocket 连接
	wsConnection = uni.connectSocket({
		url: 'wss://bemfa.com:9504/wss',
		protocols: ['mqtt'],
		complete: () => {}
	})

	// 创建简化版 MQTT 客户端
	client = new SimpleMqttClient(wsConnection, options)
	
	// 监听连接成功/失败事件，重置 isConnecting
	const checkConnection = setInterval(() => {
		if (client && client.connected) {
			isConnecting = false
			clearInterval(checkConnection)
		}
	}, 100)
	// 5秒后强制重置
	setTimeout(() => {
		isConnecting = false
		clearInterval(checkConnection)
	}, 5000)
	// #endif
}

// 设置客户端事件处理器（H5 端使用）
function setupClientEventHandlers() {
	if (!client) return

	client.on('connect', () => {
		console.log('[MQTT] 连接成功(appID认证)')
		clearReconnectTimer()
		// 通知连接成功
		uni.$emit('mqtt:connected')
	})

	client.on('message', (topic, message) => {
		const msg = message.toString()
		console.log('[MQTT] 收到消息, topic:', topic, 'msg:', msg)
		uni.$emit('mqtt:message', { topic, msg })
	})

	client.on('error', (err) => {
		console.error('[MQTT] 连接错误:', err.message)
	})

	client.on('close', () => {
		console.log('[MQTT] 连接已关闭')
	})

	client.on('reconnect', () => {
		console.log('[MQTT] 正在重连...')
	})

	client.on('offline', () => {
		console.log('[MQTT] 连接离线')
	})
}

function subscribe(topic) {
	if (!topic) return

	if (client && client.connected) {
		client.subscribe(topic, { qos: 0 }, (err) => {
			if (err) {
				console.error('[MQTT] 订阅失败:', topic, err)
			} else {
				console.log('[MQTT] 订阅成功:', topic)
				// 通知订阅成功，可以启动心跳检查
				uni.$emit('mqtt:subscribed', { topic })
			}
		})
	} else {
		console.warn('[MQTT] 未连接，无法订阅:', topic)
	}
}

function unsubscribe(topic) {
	if (!topic) return

	if (client && client.connected) {
		client.unsubscribe(topic, (err) => {
			if (err) {
				console.error('[MQTT] 取消订阅失败:', topic, err)
			} else {
				console.log('[MQTT] 取消订阅成功:', topic)
			}
		})
	} else {
		console.warn('[MQTT] 未连接，无法取消订阅:', topic)
	}
}

function publish(topic, msg) {
	if (!client) {
		console.warn('[MQTT] 未连接，无法发布')
		return false
	}

	// #ifdef H5
	if (client.connected) {
		client.publish(topic, msg, { qos: 0 })
		return true
	}
	return false
	// #endif

	// #ifndef H5
	return client.publish(topic, msg, { qos: 0 })
	// #endif
}

function disconnect() {
	clearReconnectTimer()

	if (client) {
		client.end(true)
		client = null
	}

	wsConnection = null
	console.log('[MQTT] 已断开连接')
}

function getConnectionStatus() {
	return !!(client && client.connected)
}

function clearReconnectTimer() {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer)
		reconnectTimer = null
	}
}

export default {
	connect,
	disconnect,
	subscribe,
	unsubscribe,
	publish,
	getConnectionStatus
}
