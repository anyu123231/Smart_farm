let app = null
let ai = null
let isInitialized = false
let serverUrl = ''

const SYSTEM_PROMPT = `你是一位专业的智慧农业助手，具备以下能力：

1. **作物种植指导**：提供各类农作物的种植技术、管理方法、病虫害防治建议
2. **环境分析**：根据温湿度、土壤、光照等数据，给出科学的种植建议
3. **设备管理**：帮助用户理解和使用智慧农业物联网设备
4. **农事决策**：根据天气、季节、作物生长阶段提供农事安排建议

回答要求：
- 使用简洁易懂的语言
- 提供具体可操作的建议
- 适当使用emoji让回答更生动
- 如果涉及专业术语，请简单解释`

function setServerUrl(url) {
	serverUrl = url
}

// #ifdef H5
async function initH5(envId, accessKey) {
	if (isInitialized && app) {
		return app
	}

	if (!envId || !accessKey) {
		console.warn('[AI] 缺少 envId 或 accessKey')
		return null
	}

	try {
		const cloudbase = await import('@cloudbase/js-sdk')
		app = cloudbase.default.init({
			env: envId,
			accessKey: accessKey
		})
		isInitialized = true
		console.log('[AI] CloudBase 初始化成功 (H5)')
		return app
	} catch (err) {
		console.error('[AI] CloudBase 初始化失败:', err)
		return null
	}
}

async function ensureAuth() {
	if (!app) {
		return false
	}

	try {
		const auth = app.auth()
		const loginState = await auth.getLoginState()
		
		if (!loginState) {
			await auth.signInAnonymously()
			console.log('[AI] 匿名登录成功')
		}
		return true
	} catch (err) {
		console.error('[AI] 认证失败:', err)
		return false
	}
}

async function getAI() {
	if (!app) {
		return null
	}
	
	if (!ai) {
		const authed = await ensureAuth()
		if (authed) {
			ai = app.ai()
		}
	}
	return ai
}

async function chatH5(messages) {
	const aiInstance = await getAI()
	if (!aiInstance) {
		throw new Error('AI 服务未初始化')
	}

	const model = aiInstance.createModel('hunyuan-exp')
	
	const fullMessages = [
		{ role: 'system', content: SYSTEM_PROMPT },
		...messages
	]

	const result = await model.generateText({
		model: 'hunyuan-2.0-instruct-20251111',
		messages: fullMessages
	})

	return {
		text: result.text,
		usage: result.usage
	}
}
// #endif

// #ifndef H5
async function chatApp(messages) {
	if (!serverUrl) {
		throw new Error('未配置服务器地址，请在 .env 中设置 VITE_SERVER_URL')
	}

	const response = await new Promise((resolve, reject) => {
		uni.request({
			url: `${serverUrl}/api/ai/chat`,
			method: 'POST',
			data: { messages },
			header: {
				'Content-Type': 'application/json'
			},
			success: (res) => {
				if (res.statusCode === 200 && res.data.code === 200) {
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

	return {
		text: response.data.text,
		usage: response.data.usage
	}
}
// #endif

async function init(envId, accessKey) {
	// #ifdef H5
	return initH5(envId, accessKey)
	// #endif
	
	// #ifndef H5
	console.log('[AI] APP 模式，使用后端代理')
	return true
	// #endif
}

async function chat(messages, onStream) {
	// #ifdef H5
	return chatH5(messages)
	// #endif
	
	// #ifndef H5
	return chatApp(messages)
	// #endif
}

function reset() {
	app = null
	ai = null
	isInitialized = false
}

export default {
	init,
	chat,
	reset,
	setServerUrl
}
