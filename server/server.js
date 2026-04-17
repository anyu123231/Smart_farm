require('dotenv').config()
const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const cloudbase = require('@cloudbase/node-sdk')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const dbConfig = {
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 3306,
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_DATABASE || 'valvecontrol',
	charset: process.env.DB_CHARSET || 'utf8mb4',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
}

const pool = mysql.createPool(dbConfig)

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '365d'

const tcbApp = cloudbase.init({
	env: process.env.CLOUDBASE_ENV_ID || 'valvecontrol-6gosonkm966694e0',
	secretId: process.env.CLOUDBASE_SECRET_ID,
	secretKey: process.env.CLOUDBASE_SECRET_KEY
})

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

function formatDevicesForAiPrompt(devices) {
	if (!devices || devices.length === 0) {
		return '（当前账号下没有已绑定的可控设备）'
	}
	return devices
		.map((d) => {
			const isDual = d.type === '2' || d.type === 2
			const typeLabel = isDual ? '双路' : '单路'
			let st = ''
			if (isDual) {
				const parts = String(d.status || 'off:off').split(':')
				const l = parts[0] === 'on' ? '开' : '关'
				const r = (parts[1] === 'on' ? '开' : '关')
				st = `左${l}右${r}`
			} else {
				st =
					d.status === 'on' || d.status === 1 || d.status === '1'
						? '开'
						: '关'
			}
			return `- id=${d.id}，名称「${d.name}」，${typeLabel}，当前${st}`
		})
		.join('\n')
}

function buildDeviceControlPrompt(deviceLines, syncedAtISO) {
	return `## 设备远程控制（物联网）

**状态唯一依据（必须遵守）**
- 下方「设备列表」由服务器在**每一次**收到对话请求时，从数据库实时查询得到（查询时间：${syncedAtISO}）。
- 用户在 App「设备」页手动开关、设备通过 MQTT 上报、或你本轮下发的 [[DEVICE_CMD]] 成功写入后，数据库会更新；**下一轮对话会读到新状态**。
- **此前任意轮次里，用户或助手口头说的「开着/关着」一律可能已过期。回答「现在开没开」「当前状态」类问题时，只能依据下方列表，禁止根据聊天历史推断或复述旧状态。**
- 若用户问「我刚才手动关了你怎么还说开着」，应说明以本列表为准并据列表纠正。

下列设备属于当前登录用户，你只能使用下列 id 执行开关操作。

${deviceLines}

当用户**明确要求你执行**打开/关闭某设备（双路设备可单独控制左/右）时：
1. 先用简短自然语言说明将要执行的操作；
2. 在整段回复的最后，按需另起一行输出一条或多条机器指令，格式严格如下（不要用 Markdown 代码块包裹）：
[[DEVICE_CMD:{"device_id":数字,"status":"状态"}}]]

status 规则：
- 单路设备：只能是 "on" 或 "off"
- 双路设备：必须是 "左:右"，每段为 "on" 或 "off"，例如左开右关写作 "on:off"

若用户只是咨询、未要求真实执行开关，则**不要**输出任何 [[DEVICE_CMD:...]] 行。
若需连续控制多台设备，可输出多行，每行一个 [[DEVICE_CMD:...]]。`
}

function buildUserSnapshotMessage(deviceRows, syncedAtISO) {
	const lines = formatDevicesForAiPrompt(deviceRows)
	return (
		`[系统注入·非用户输入] 以下为服务端于 ${syncedAtISO} 从数据库读取的当前开关状态；` +
		`回答「现在/当前是否开启」等问题时仅以此为依据，忽略上文对话中的旧描述。\n` +
		`${lines}`
	)
}

function dualStatusToMqttMsg(normalizedStatus) {
	const parts = normalizedStatus.split(':')
	const leftOn = parts[0] === 'on'
	const rightOn = parts[1] === 'on'
	if (leftOn && rightOn) return 'full'
	if (leftOn) return 'left'
	if (rightOn) return 'right'
	return 'close'
}

function formatDateTimeMySQL(date = new Date()) {
	const pad = (n) => String(n).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** mysql2 对 DATETIME 常返回 JS Date；误用 String(date).replace(' ', 'T') 会得到非法字符串，导致时长恒为 0 */
function mysqlTimeToMs(value) {
	if (value == null || value === '') return NaN
	if (value instanceof Date) {
		const t = value.getTime()
		return Number.isNaN(t) ? NaN : t
	}
	const s = String(value).trim()
	if (!s) return NaN
	const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}(\.\d{1,6})?)/)
	if (m) {
		return new Date(`${m[1]}T${m[2]}`).getTime()
	}
	return new Date(s).getTime()
}

function secondsSinceMysqlTime(mysqlTime) {
	const t = mysqlTimeToMs(mysqlTime)
	if (Number.isNaN(t)) return 0
	return Math.max(0, Math.floor((Date.now() - t) / 1000))
}

function parseDualStatusFromDb(statusVal) {
	const parts = String(statusVal || 'off:off').split(':')
	return {
		left: parts[0] === 'on' ? 'on' : 'off',
		right: parts[1] === 'on' ? 'on' : 'off'
	}
}

function isType1On(statusVal) {
	return statusVal === 'on' || statusVal === 1 || statusVal === '1'
}

function buildAiDeviceTimeUpdates(row, normalizedStatus, deviceType) {
	const nowStr = formatDateTimeMySQL()
	const updates = { status: normalizedStatus }

	if (deviceType === '2' || deviceType === 2) {
		const prev = parseDualStatusFromDb(row.status)
		const next = parseDualStatusFromDb(normalizedStatus)

		if (prev.left === 'off' && next.left === 'on') {
			updates.leftOpenTime = nowStr
		}
		if (prev.left === 'on' && next.left === 'off') {
			const dur = secondsSinceMysqlTime(row.leftOpenTime)
			updates.leftCloseTime = nowStr
			updates.leftLastDuration = dur
			updates.leftTotalDuration = (Number(row.leftTotalDuration) || 0) + dur
		}

		if (prev.right === 'off' && next.right === 'on') {
			updates.rightOpenTime = nowStr
		}
		if (prev.right === 'on' && next.right === 'off') {
			const dur = secondsSinceMysqlTime(row.rightOpenTime)
			updates.rightCloseTime = nowStr
			updates.rightLastDuration = dur
			updates.rightTotalDuration = (Number(row.rightTotalDuration) || 0) + dur
		}
	} else {
		const wasOn = isType1On(row.status)
		const willOn = normalizedStatus === 'on'

		if (!wasOn && willOn) {
			updates.openTime = nowStr
		}
		if (wasOn && !willOn) {
			const dur = secondsSinceMysqlTime(row.openTime)
			updates.closeTime = nowStr
			updates.lastDuration = dur
			updates.totalDuration = (Number(row.totalDuration) || 0) + dur
		}
	}

	return updates
}

async function applyAiDeviceCommand(pool, userId, deviceId, statusInput) {
	const [device] = await pool.query(
		`SELECT id, type, uid, topic, status,
			openTime, closeTime, totalDuration,
			leftOpenTime, leftCloseTime, leftTotalDuration,
			rightOpenTime, rightCloseTime, rightTotalDuration
		 FROM devices WHERE id = ? AND user_id = ?`,
		[deviceId, userId]
	)
	if (!device.length) {
		return { ok: false, message: '设备不存在或无权操作' }
	}

	const row = device[0]
	const deviceType = row.type
	let normalizedStatus

	if (deviceType === '2' || deviceType === 2) {
		const s = String(statusInput || '')
		if (!s.includes(':')) {
			return { ok: false, message: '双路设备 status 需为 "on:off" 形式（左:右）' }
		}
		const parts = s.split(':')
		if (parts.length !== 2) {
			return { ok: false, message: '双路设备状态格式无效' }
		}
		const leftStatus =
			parts[0] === 'on' || parts[0] === '1' || parts[0] === 1 ? 'on' : 'off'
		const rightStatus =
			parts[1] === 'on' || parts[1] === '1' || parts[1] === 1 ? 'on' : 'off'
		normalizedStatus = `${leftStatus}:${rightStatus}`
	} else {
		normalizedStatus =
			statusInput === 'on' || statusInput === 1 || statusInput === '1'
				? 'on'
				: 'off'
	}

	const updates = buildAiDeviceTimeUpdates(row, normalizedStatus, deviceType)
	const keys = Object.keys(updates)
	const setClause = keys.map((k) => `${k} = ?`).join(', ')
	const values = keys.map((k) => updates[k])
	await pool.query(
		`UPDATE devices SET ${setClause} WHERE id = ? AND user_id = ?`,
		[...values, deviceId, userId]
	)

	let mqttMsg
	if (deviceType === '2' || deviceType === 2) {
		mqttMsg = dualStatusToMqttMsg(normalizedStatus)
	} else {
		mqttMsg = normalizedStatus
	}

	try {
		const bemfaRes = await axios.get('https://apis.bemfa.com/va/sendMessage', {
			params: {
				uid: row.uid,
				topic: row.topic,
				type: 1,
				msg: mqttMsg
			},
			timeout: 8000
		})
		if (!bemfaRes.data || bemfaRes.data.code !== 0) {
			return {
				ok: false,
				message: bemfaRes.data?.message || '巴法云下发失败',
				dbUpdated: true
			}
		}
	} catch (e) {
		return {
			ok: false,
			message: e.message || '巴法云请求异常',
			dbUpdated: true
		}
	}

	return { ok: true, message: '已更新并下发' }
}

async function processAiDeviceCommandTags(pool, userId, text) {
	if (!text || typeof text !== 'string') {
		return { cleanText: text, commandNotes: [] }
	}

	const re = /\[\[DEVICE_CMD:\s*(\{[\s\S]*?\})\s*\]\]/g
	const notes = []
	let m
	const toRun = []
	while ((m = re.exec(text)) !== null) {
		toRun.push(m[0])
		try {
			const payload = JSON.parse(m[1])
			const did = payload.device_id ?? payload.id
			const status = payload.status
			if (did == null || status === undefined) {
				notes.push('某条 DEVICE_CMD 缺少 device_id 或 status')
				continue
			}
			const r = await applyAiDeviceCommand(pool, userId, Number(did), status)
			notes.push(
				r.ok
					? `设备 id=${did}：${r.message}`
					: `设备 id=${did}：失败 — ${r.message}`
			)
		} catch (e) {
			notes.push(`解析或执行 DEVICE_CMD 失败：${e.message}`)
		}
	}

	let cleanText = text
	for (const tag of toRun) {
		cleanText = cleanText.split(tag).join('')
	}
	cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim()

	if (notes.length) {
		const fail = notes.some((n) => n.includes('失败'))
		const hint = fail
			? '\n\n⚠️ 部分设备指令未能完成，详见：' + notes.join('；')
			: '\n\n✅ ' + notes.join('；')
		cleanText = (cleanText || '已完成操作。') + hint
	}

	return { cleanText, commandNotes: notes }
}

// 健康检查接口
app.get('/health', (req, res) => {
	res.json({
		code: 200,
		message: '服务运行正常',
		timestamp: new Date().toISOString()
	})
})

// 验证JWT中间件
const verifyToken = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				code: 401,
				message: '未提供认证令牌'
			})
		}
		
		const token = authHeader.split(' ')[1]
		const decoded = jwt.verify(token, JWT_SECRET)
		req.user = decoded
		next()
	} catch (error) {
		return res.status(401).json({
			code: 401,
			message: '无效的认证令牌'
		})
	}
}

// 登录接口
app.post('/api/user/login', async (req, res) => {
	try {
		const { username, password } = req.body
		
		if (!username || !password) {
			return res.status(400).json({
				code: 400,
				message: '缺少必要参数'
			})
		}
		
		// 查询用户
		const [rows] = await pool.query(
			'SELECT id, username, password FROM users WHERE username = ?',
			[username]
		)
		
		if (rows.length === 0) {
			return res.status(401).json({
				code: 401,
				message: '用户名或密码错误'
			})
		}
		
		const user = rows[0]
		
		// 验证密码（实际应用中应该使用bcrypt加密）
		if (password !== user.password) {
			return res.status(401).json({
				code: 401,
				message: '用户名或密码错误'
			})
		}
		
		// 生成JWT令牌
		const token = jwt.sign(
			{ id: user.id, username: user.username },
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN }
		)
		
		res.json({
			code: 200,
			message: '登录成功',
			data: {
				id: user.id,
				username: user.username
			},
			token
		})
	} catch (error) {
		console.error('登录失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 注册接口
app.post('/api/user/register', async (req, res) => {
	try {
		const { username, password } = req.body
		
		if (!username || !password) {
			return res.status(400).json({
				code: 400,
				message: '缺少必要参数'
			})
		}
		
		// 检查用户名是否已存在
		const [existing] = await pool.query(
			'SELECT id FROM users WHERE username = ?',
			[username]
		)
		
		if (existing.length > 0) {
			return res.status(409).json({
				code: 409,
				message: '用户名已存在'
			})
		}
		
		// 插入新用户
		const [result] = await pool.query(
			'INSERT INTO users (username, password, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
			[username, password]
		)
		
		res.json({
			code: 200,
			message: '注册成功',
			data: {
				id: result.insertId,
				username
			}
		})
	} catch (error) {
		console.error('注册失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 删除用户接口
app.delete('/api/user/delete', verifyToken, async (req, res) => {
	try {
		const userId = req.user.id
		
		// 开始事务
		const connection = await pool.getConnection()
		await connection.beginTransaction()
		
		try {
			// 删除用户的所有设备
			await connection.query('DELETE FROM devices WHERE user_id = ?', [userId])
			
			// 删除用户
			const [result] = await connection.query('DELETE FROM users WHERE id = ?', [userId])
			
			// 提交事务
			await connection.commit()
			
			if (result.affectedRows === 0) {
				return res.status(404).json({
					code: 404,
					message: '用户不存在'
				})
			}
			
			res.json({
				code: 200,
				message: '用户删除成功'
			})
		} catch (error) {
			// 回滚事务
			await connection.rollback()
			throw error
		} finally {
			connection.release()
		}
	} catch (error) {
		console.error('删除用户失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 获取所有设备列表（支持单数和复数路径）
app.get('/api/device', verifyToken, async (req, res) => {
	try {
		const [rows] = await pool.query(
			'SELECT id, name, topic, uid, status, type, createAt, openTime, closeTime, totalDuration, lastDuration, leftOpenTime, leftCloseTime, leftTotalDuration, leftLastDuration, rightOpenTime, rightCloseTime, rightTotalDuration, rightLastDuration FROM devices WHERE user_id = ? ORDER BY createAt DESC',
			[req.user.id]
		)
		res.json({
			code: 200,
			message: '获取设备列表成功',
			data: rows
		})
	} catch (error) {
		console.error('获取设备列表失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 从巴法云获取设备最新消息
async function fetchBemfaLatestMsg(uid, topic, type = 1) {
	try {
		const url = `https://apis.bemfa.com/va/getmsg?uid=${uid}&topic=${topic}&type=${type}&num=1`
		const response = await axios.get(url, { timeout: 5000 })
		
		if (response.data && response.data.code === 0 && response.data.data && response.data.data.length > 0) {
			const latest = response.data.data[0]
			return {
				msg: latest.msg,
				time: latest.time,
				unix: latest.unix
			}
		}
		return null
	} catch (error) {
		console.error('[Bemfa] 获取最新消息失败:', error.message)
		return null
	}
}

// 将巴法云时间格式转为MySQL格式
function bemfaTimeToMySQL(bemfaTime) {
	// 巴法云格式: "2022-08-03 17:26:34"
	// MySQL格式相同，直接返回
	return bemfaTime
}

// 计算从开启时间到现在的秒数
function calculateDuration(openTime) {
	if (!openTime) return 0
	const t = mysqlTimeToMs(openTime)
	if (Number.isNaN(t)) return 0
	return Math.floor((Date.now() - t) / 1000)
}

// 创建新设备
app.post('/api/device', verifyToken, async (req, res) => {
	try {
		const { name, topic, uid, _openid, status, type } = req.body
		const userId = req.user.id
		
		console.log('收到创建设备请求:', { name, topic, uid, _openid, status, type, userId })
		
		if (!name || !topic || !uid || !_openid) {
			return res.status(400).json({
				code: 400,
				message: '缺少必要参数'
			})
		}
		
		// 检查_openid是否已存在
		console.log('检查_openid是否存在:', _openid)
		const [existing] = await pool.query(
			'SELECT id FROM devices WHERE _openid = ?',
			[_openid]
		)
		
		console.log('查询结果:', existing)
		
		if (existing.length > 0) {
			console.log('_openid已存在，拒绝创建')
			return res.status(409).json({
				code: 409,
				message: '该设备已连接'
			})
		}
		
		// 从巴法云拉取最新消息
		console.log('从巴法云拉取最新消息:', { uid, topic })
		const bemfaMsg = await fetchBemfaLatestMsg(uid, topic, type === '3' || type === 3 ? 3 : 1)
		console.log('巴法云返回:', bemfaMsg)
		
		// 确定初始状态和时间
		let initialStatus = status || 'off'
		let openTime = null
		let totalDuration = 0
		let leftOpenTime = null
		let rightOpenTime = null
		let leftTotalDuration = 0
		let rightTotalDuration = 0
		
		if (bemfaMsg && bemfaMsg.msg) {
			// 根据消息内容设置状态
			const msg = bemfaMsg.msg.toString().toLowerCase().trim()
			const bemfaMySQLTime = bemfaTimeToMySQL(bemfaMsg.time)
			
			if (type === '2' || type === 2) {
				// 类型2设备：解析 left/right/full/close
				if (msg === 'full') {
					initialStatus = 'on:on'
					leftOpenTime = bemfaMySQLTime
					rightOpenTime = bemfaMySQLTime
					leftTotalDuration = calculateDuration(bemfaMsg.time)
					rightTotalDuration = calculateDuration(bemfaMsg.time)
				} else if (msg === 'left') {
					initialStatus = 'on:off'
					leftOpenTime = bemfaMySQLTime
					leftTotalDuration = calculateDuration(bemfaMsg.time)
				} else if (msg === 'right') {
					initialStatus = 'off:on'
					rightOpenTime = bemfaMySQLTime
					rightTotalDuration = calculateDuration(bemfaMsg.time)
				} else {
					initialStatus = 'off:off'
				}
			} else {
				// 类型1设备：on/off
				if (msg === 'on') {
					initialStatus = 'on'
					openTime = bemfaMySQLTime
					totalDuration = calculateDuration(bemfaMsg.time)
				} else {
					initialStatus = 'off'
				}
			}
		}
		
		console.log('_openid不存在，开始创建设备')
		const [result] = await pool.query(
			`INSERT INTO devices (name, topic, uid, _openid, status, type, user_id, createAt, 
			 openTime, totalDuration, leftOpenTime, rightOpenTime, leftTotalDuration, rightTotalDuration) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
			[name, topic, uid, _openid, initialStatus, type || '1', userId, 
			 openTime, totalDuration, leftOpenTime, rightOpenTime, leftTotalDuration, rightTotalDuration]
		)
		
		console.log('设备创建成功，ID:', result.insertId)
		
		res.json({
			code: 200,
			message: '创建设备成功',
			data: {
				id: result.insertId,
				name,
				topic,
				uid,
				_openid,
				status: initialStatus,
				type: type || '1',
				user_id: userId,
				bemfaMsg: bemfaMsg || null
			}
		})
	} catch (error) {
		console.error('创建设备失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 获取用户设备列表
app.get('/api/devices/user', verifyToken, async (req, res) => {
	try {
		const { openid } = req.query
		const userId = req.user.id
		const [rows] = await pool.query(
			'SELECT id, name, topic, uid, status, createAt FROM devices WHERE _openid = ? AND user_id = ? ORDER BY createAt DESC',
			[openid, userId]
		)
		res.json({
			code: 200,
			message: '获取用户设备列表成功',
			data: rows
		})
	} catch (error) {
		console.error('获取用户设备列表失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 更新设备状态
app.put('/api/device/status', verifyToken, async (req, res) => {
	try {
		const { id, status } = req.body
		const userId = req.user.id
		
		console.log('接收到状态更新请求:', { id, status, type: typeof status })
		
		// 检查设备是否属于该用户，并获取设备类型
		const [device] = await pool.query(
			'SELECT id, type FROM devices WHERE id = ? AND user_id = ?',
			[id, userId]
		)
		
		if (device.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在或无权操作'
			})
		}
		
		// 根据设备类型规范化状态值
		let normalizedStatus
		const deviceType = device[0].type
		
		if (deviceType === '2' || deviceType === 2) {
			// 类型2设备：处理复合状态值（如 'on:off'）
			if (status.includes(':')) {
				// 验证复合状态格式
				const parts = status.split(':')
				if (parts.length === 2) {
					const leftStatus = (parts[0] === 'on' || parts[0] === '1') ? 'on' : 'off'
					const rightStatus = (parts[1] === 'on' || parts[1] === '1') ? 'on' : 'off'
					normalizedStatus = `${leftStatus}:${rightStatus}`
				} else {
					normalizedStatus = 'off:off'
				}
			} else {
				// 如果不是复合状态，默认为 'off:off'
				normalizedStatus = 'off:off'
			}
		} else {
			// 类型1设备：规范化为 'on' 或 'off'
			normalizedStatus = (status === 'on' || status === 1 || status === '1') ? 'on' : 'off'
		}
		
		console.log('规范化后的状态:', normalizedStatus)
		
		const [result] = await pool.query(
			'UPDATE devices SET status = ? WHERE id = ? AND user_id = ?',
			[normalizedStatus, id, userId]
		)
		
		if (result.affectedRows === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在'
			})
		}
		
		res.json({
			code: 200,
			message: '更新设备状态成功'
		})
	} catch (error) {
		console.error('更新设备状态失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 更新设备名称
app.put('/api/device/name', verifyToken, async (req, res) => {
	try {
		const { id, name } = req.body
		const userId = req.user.id
		
		// 检查设备是否属于该用户
		const [device] = await pool.query(
			'SELECT id FROM devices WHERE id = ? AND user_id = ?',
			[id, userId]
		)
		
		if (device.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在或无权操作'
			})
		}
		
		const [result] = await pool.query(
			'UPDATE devices SET name = ? WHERE id = ? AND user_id = ?',
			[name, id, userId]
		)
		
		if (result.affectedRows === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在'
			})
		}
		
		res.json({
			code: 200,
			message: '更新设备名称成功'
		})
	} catch (error) {
		console.error('更新设备名称失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 记录设备开启时间
app.put('/api/device/openTime', verifyToken, async (req, res) => {
	try {
		const { id, openTime } = req.body
		const userId = req.user.id
		
		console.log('记录开启时间:', { id, openTime, userId })
		
		// 检查设备是否属于该用户
		const [device] = await pool.query(
			'SELECT id FROM devices WHERE id = ? AND user_id = ?',
			[id, userId]
		)
		
		if (device.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在或无权操作'
			})
		}
		
		const [result] = await pool.query(
			'UPDATE devices SET openTime = ? WHERE id = ? AND user_id = ?',
			[openTime, id, userId]
		)
		
		console.log('更新结果:', result)
		
		res.json({
			code: 200,
			message: '记录开启时间成功'
		})
	} catch (error) {
		console.error('记录开启时间失败:', error)
		console.error('错误堆栈:', error.stack)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message,
			stack: error.stack
		})
	}
})

// 记录设备关闭时间和计算开启时长
app.put('/api/device/closeTime', verifyToken, async (req, res) => {
	try {
		const { id, closeTime, duration } = req.body
		const userId = req.user.id
		
		console.log('记录关闭时间:', { id, closeTime, duration, userId })
		
		// 检查设备是否属于该用户
		const [device] = await pool.query(
			'SELECT id, totalDuration FROM devices WHERE id = ? AND user_id = ?',
			[id, userId]
		)
		
		if (device.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在或无权操作'
			})
		}
		
		const currentTotalDuration = device[0].totalDuration || 0
		const newTotalDuration = currentTotalDuration + duration
		
		console.log('当前累计时长:', currentTotalDuration, '本次时长:', duration, '新累计时长:', newTotalDuration)
		
		const [result] = await pool.query(
			'UPDATE devices SET closeTime = ?, lastDuration = ?, totalDuration = ? WHERE id = ? AND user_id = ?',
			[closeTime, duration, newTotalDuration, id, userId]
		)
		
		console.log('更新结果:', result)
		
		res.json({
			code: 200,
			message: '记录关闭时间成功'
		})
	} catch (error) {
		console.error('记录关闭时间失败:', error)
		console.error('错误堆栈:', error.stack)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message,
			stack: error.stack
		})
	}
})

// 记录左开关开启时间
app.put('/api/device/leftOpenTime', verifyToken, async (req, res) => {
	try {
		const { id, leftOpenTime } = req.body
		const userId = req.user.id
		
		console.log('记录左开关开启时间:', { id, leftOpenTime, userId })
		
		const [device] = await pool.query(
			'SELECT id FROM devices WHERE id = ? AND user_id = ?',
			[id, userId]
		)
		
		if (device.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在或无权操作'
			})
		}
		
		await pool.query(
			'UPDATE devices SET leftOpenTime = ? WHERE id = ? AND user_id = ?',
			[leftOpenTime, id, userId]
		)
		
		res.json({
			code: 200,
			message: '记录左开关开启时间成功'
		})
	} catch (error) {
		console.error('记录左开关开启时间失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 记录左开关关闭时间和计算开启时长
app.put('/api/device/leftCloseTime', verifyToken, async (req, res) => {
	try {
		const { id, leftCloseTime, duration } = req.body
		const userId = req.user.id
		
		console.log('记录左开关关闭时间:', { id, leftCloseTime, duration, userId })
		
		const [device] = await pool.query(
			'SELECT id, leftTotalDuration FROM devices WHERE id = ? AND user_id = ?',
			[id, userId]
		)
		
		if (device.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在或无权操作'
			})
		}
		
		const currentTotalDuration = device[0].leftTotalDuration || 0
		const newTotalDuration = currentTotalDuration + duration
		
		await pool.query(
			'UPDATE devices SET leftCloseTime = ?, leftLastDuration = ?, leftTotalDuration = ? WHERE id = ? AND user_id = ?',
			[leftCloseTime, duration, newTotalDuration, id, userId]
		)
		
		res.json({
			code: 200,
			message: '记录左开关关闭时间成功'
		})
	} catch (error) {
		console.error('记录左开关关闭时间失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 记录右开关开启时间
app.put('/api/device/rightOpenTime', verifyToken, async (req, res) => {
	try {
		const { id, rightOpenTime } = req.body
		const userId = req.user.id
		
		console.log('记录右开关开启时间:', { id, rightOpenTime, userId })
		
		const [device] = await pool.query(
			'SELECT id FROM devices WHERE id = ? AND user_id = ?',
			[id, userId]
		)
		
		if (device.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在或无权操作'
			})
		}
		
		await pool.query(
			'UPDATE devices SET rightOpenTime = ? WHERE id = ? AND user_id = ?',
			[rightOpenTime, id, userId]
		)
		
		res.json({
			code: 200,
			message: '记录右开关开启时间成功'
		})
	} catch (error) {
		console.error('记录右开关开启时间失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 记录右开关关闭时间和计算开启时长
app.put('/api/device/rightCloseTime', verifyToken, async (req, res) => {
	try {
		const { id, rightCloseTime, duration } = req.body
		const userId = req.user.id
		
		console.log('记录右开关关闭时间:', { id, rightCloseTime, duration, userId })
		
		const [device] = await pool.query(
			'SELECT id, rightTotalDuration FROM devices WHERE id = ? AND user_id = ?',
			[id, userId]
		)
		
		if (device.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在或无权操作'
			})
		}
		
		const currentTotalDuration = device[0].rightTotalDuration || 0
		const newTotalDuration = currentTotalDuration + duration
		
		await pool.query(
			'UPDATE devices SET rightCloseTime = ?, rightLastDuration = ?, rightTotalDuration = ? WHERE id = ? AND user_id = ?',
			[rightCloseTime, duration, newTotalDuration, id, userId]
		)
		
		res.json({
			code: 200,
			message: '记录右开关关闭时间成功'
		})
	} catch (error) {
		console.error('记录右开关关闭时间失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

// 删除设备
app.delete('/api/device', verifyToken, async (req, res) => {
	try {
		const { id } = req.query
		const userId = req.user.id
		
		// 检查设备是否属于该用户
		const [device] = await pool.query(
			'SELECT id FROM devices WHERE id = ? AND user_id = ?',
			[id, userId]
		)
		
		if (device.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在或无权操作'
			})
		}
		
		const [result] = await pool.query('DELETE FROM devices WHERE id = ? AND user_id = ?', [id, userId])
		
		if (result.affectedRows === 0) {
			return res.status(404).json({
				code: 404,
				message: '设备不存在'
			})
		}
		
		res.json({
			code: 200,
			message: '删除设备成功'
		})
	} catch (error) {
		console.error('删除设备失败:', error)
		res.status(500).json({
			code: 500,
			message: '服务器内部错误',
			error: error.message
		})
	}
})

app.post('/api/ai/chat', verifyToken, async (req, res) => {
	try {
		const { messages, sessionId } = req.body
		const userId = req.user.id
		
		if (!messages || !Array.isArray(messages)) {
			return res.status(400).json({
				code: 400,
				message: '缺少 messages 参数'
			})
		}
		
		const [deviceRows] = await pool.query(
			'SELECT id, name, type, status FROM devices WHERE user_id = ? ORDER BY id ASC',
			[userId]
		)
		const syncedAt = new Date().toISOString()
		const deviceLines = formatDevicesForAiPrompt(deviceRows)
		const devicePrompt = buildDeviceControlPrompt(deviceLines, syncedAt)
		const systemContent = `${SYSTEM_PROMPT}\n\n${devicePrompt}`
		
		const ai = tcbApp.ai()
		const model = ai.createModel('hunyuan-exp')
		
		let augmentedMessages = Array.isArray(messages) ? [...messages] : []
		const lastIdx = augmentedMessages.length - 1
		const last = lastIdx >= 0 ? augmentedMessages[lastIdx] : null
		const snapshot = buildUserSnapshotMessage(deviceRows, syncedAt)
		if (last && last.role === 'user') {
			augmentedMessages = [
				...augmentedMessages.slice(0, lastIdx),
				{ role: 'user', content: snapshot },
				last
			]
		} else {
			augmentedMessages.push({ role: 'user', content: snapshot })
		}
		
		const fullMessages = [
			{ role: 'system', content: systemContent },
			...augmentedMessages
		]
		
		const result = await model.generateText({
			model: 'hunyuan-2.0-instruct-20251111',
			messages: fullMessages
		})
		
		const { cleanText } = await processAiDeviceCommandTags(
			pool,
			userId,
			result.text
		)
		
		res.json({
			code: 200,
			message: 'AI 响应成功',
			data: {
				text: cleanText,
				usage: result.usage,
				sessionId: sessionId
			}
		})
	} catch (error) {
		console.error('AI 聊天失败:', error)
		res.status(500).json({
			code: 500,
			message: 'AI 服务错误',
			error: error.message
		})
	}
})

// 创建对话会话
app.post('/api/ai/sessions', verifyToken, async (req, res) => {
	try {
		const userId = req.user.id
		
		const [result] = await pool.query(
			'INSERT INTO ai_chat_sessions (user_id) VALUES (?)',
			[userId]
		)
		
		res.json({
			code: 200,
			message: '创建会话成功',
			data: {
				sessionId: result.insertId
			}
		})
	} catch (error) {
		console.error('创建会话失败:', error)
		res.status(500).json({
			code: 500,
			message: '创建会话失败',
			error: error.message
		})
	}
})

// 获取用户的所有会话
app.get('/api/ai/sessions', verifyToken, async (req, res) => {
	try {
		const userId = req.user.id
		
		const [rows] = await pool.query(
			`SELECT s.id, 
				(SELECT content FROM ai_chat_messages WHERE session_id = s.id AND role = 1 ORDER BY id ASC LIMIT 1) as first_message,
				s.created_at 
			FROM ai_chat_sessions s 
			WHERE s.user_id = ? 
			ORDER BY s.id DESC`,
			[userId]
		)
		
		res.json({
			code: 200,
			message: '获取会话列表成功',
			data: rows.map(row => ({
				id: row.id,
				session_name: row.first_message ? row.first_message.substring(0, 20) : '新对话',
				created_at: row.created_at
			}))
		})
	} catch (error) {
		console.error('获取会话列表失败:', error)
		res.status(500).json({
			code: 500,
			message: '获取会话列表失败',
			error: error.message
		})
	}
})

// 获取会话的所有消息
app.get('/api/ai/sessions/:sessionId/messages', verifyToken, async (req, res) => {
	try {
		const userId = req.user.id
		const sessionId = req.params.sessionId
		
		// 验证会话属于当前用户
		const [session] = await pool.query(
			'SELECT id FROM ai_chat_sessions WHERE id = ? AND user_id = ?',
			[sessionId, userId]
		)
		
		if (session.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '会话不存在或无权访问'
			})
		}
		
		const [rows] = await pool.query(
			'SELECT role, content FROM ai_chat_messages WHERE session_id = ? ORDER BY id ASC',
			[sessionId]
		)
		
		res.json({
			code: 200,
			message: '获取消息成功',
			data: rows.map(row => ({
				role: row.role === 1 ? 'user' : 'assistant',
				content: row.content
			}))
		})
	} catch (error) {
		console.error('获取消息失败:', error)
		res.status(500).json({
			code: 500,
			message: '获取消息失败',
			error: error.message
		})
	}
})

// 保存消息
app.post('/api/ai/sessions/:sessionId/messages', verifyToken, async (req, res) => {
	try {
		const userId = req.user.id
		const sessionId = req.params.sessionId
		const { role, content } = req.body
		
		// 验证会话属于当前用户
		const [session] = await pool.query(
			'SELECT id FROM ai_chat_sessions WHERE id = ? AND user_id = ?',
			[sessionId, userId]
		)
		
		if (session.length === 0) {
			return res.status(404).json({
				code: 404,
				message: '会话不存在或无权访问'
			})
		}
		
		// role: user=1, assistant=2
		const roleId = role === 'user' ? 1 : 2
		
		const [result] = await pool.query(
			'INSERT INTO ai_chat_messages (session_id, role, content) VALUES (?, ?, ?)',
			[sessionId, roleId, content]
		)
		
		res.json({
			code: 200,
			message: '保存消息成功',
			data: {
				messageId: result.insertId
			}
		})
	} catch (error) {
		console.error('保存消息失败:', error)
		res.status(500).json({
			code: 500,
			message: '保存消息失败',
			error: error.message
		})
	}
})

// 删除会话
app.delete('/api/ai/sessions/:sessionId', verifyToken, async (req, res) => {
	try {
		const userId = req.user.id
		const sessionId = req.params.sessionId
		
		const [result] = await pool.query(
			'DELETE FROM ai_chat_sessions WHERE id = ? AND user_id = ?',
			[sessionId, userId]
		)
		
		if (result.affectedRows === 0) {
			return res.status(404).json({
				code: 404,
				message: '会话不存在或无权删除'
			})
		}
		
		res.json({
			code: 200,
			message: '删除会话成功'
		})
	} catch (error) {
		console.error('删除会话失败:', error)
		res.status(500).json({
			code: 500,
			message: '删除会话失败',
			error: error.message
		})
	}
})

// ==================== 和风天气 API ====================
const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY || 'e2671b8a81064905a7ab897bd9ab78fc'
const QWEATHER_BASE_URL = 'https://qj3qqrunru.re.qweatherapi.com/v7'
const QWEATHER_GEO_URL = 'https://qj3qqrunru.re.qweatherapi.com/geo/v2'

// 城市搜索 - 根据经纬度或城市名查询Location ID
app.get('/api/weather/location', async (req, res) => {
	try {
		const { location, adm } = req.query
		
		if (!location) {
			return res.status(400).json({
				code: 400,
				message: '请提供location参数（经纬度或城市名）'
			})
		}
		
		let url = `${QWEATHER_GEO_URL}/city/lookup?key=${QWEATHER_API_KEY}&location=${encodeURIComponent(location)}`
		if (adm) {
			url += `&adm=${encodeURIComponent(adm)}`
		}
		
		const response = await axios.get(url)
		const data = response.data
		
		if (data.code !== '200') {
			return res.status(400).json({
				code: 400,
				message: '城市查询失败',
				qweatherCode: data.code
			})
		}
		
		res.json({
			code: 200,
			message: '查询成功',
			data: data.location
		})
	} catch (error) {
		console.error('城市搜索失败:', error)
		res.status(500).json({
			code: 500,
			message: '城市搜索失败',
			error: error.message
		})
	}
})

// 实时天气
app.get('/api/weather/now', async (req, res) => {
	try {
		const { location } = req.query
		
		if (!location) {
			return res.status(400).json({
				code: 400,
				message: '请提供location参数（Location ID或经纬度）'
			})
		}
		
		const response = await axios.get(`${QWEATHER_BASE_URL}/weather/now?key=${QWEATHER_API_KEY}&location=${location}`)
		const data = response.data
		
		if (data.code !== '200') {
			return res.status(400).json({
				code: 400,
				message: '获取天气失败',
				qweatherCode: data.code
			})
		}
		
		res.json({
			code: 200,
			message: '获取成功',
			data: data.now,
			updateTime: data.updateTime
		})
	} catch (error) {
		console.error('获取实时天气失败:', error)
		res.status(500).json({
			code: 500,
			message: '获取实时天气失败',
			error: error.message
		})
	}
})

// 3天天气预报
app.get('/api/weather/forecast', async (req, res) => {
	try {
		const { location } = req.query
		
		if (!location) {
			return res.status(400).json({
				code: 400,
				message: '请提供location参数'
			})
		}
		
		const response = await axios.get(`${QWEATHER_BASE_URL}/weather/3d?key=${QWEATHER_API_KEY}&location=${location}`)
		const data = response.data
		
		if (data.code !== '200') {
			return res.status(400).json({
				code: 400,
				message: '获取天气预报失败',
				qweatherCode: data.code
			})
		}
		
		res.json({
			code: 200,
			message: '获取成功',
			data: data.daily,
			updateTime: data.updateTime
		})
	} catch (error) {
		console.error('获取天气预报失败:', error)
		res.status(500).json({
			code: 500,
			message: '获取天气预报失败',
			error: error.message
		})
	}
})

// 空气质量
app.get('/api/weather/air', async (req, res) => {
	try {
		const { location } = req.query
		
		if (!location) {
			return res.status(400).json({
				code: 400,
				message: '请提供location参数'
			})
		}
		
		const response = await axios.get(`${QWEATHER_BASE_URL}/air/now?key=${QWEATHER_API_KEY}&location=${location}`)
		const data = response.data
		
		if (data.code !== '200') {
			return res.status(400).json({
				code: 400,
				message: '获取空气质量失败',
				qweatherCode: data.code
			})
		}
		
		res.json({
			code: 200,
			message: '获取成功',
			data: data.now,
			updateTime: data.updateTime
		})
	} catch (error) {
		console.error('获取空气质量失败:', error)
		res.status(500).json({
			code: 500,
			message: '获取空气质量失败',
			error: error.message
		})
	}
})

// 综合天气接口 - 一次性获取所有天气数据
app.get('/api/weather/all', async (req, res) => {
	try {
		const { location } = req.query
		
		if (!location) {
			return res.status(400).json({
				code: 400,
				message: '请提供location参数'
			})
		}
		
		// 获取实时天气和预报（必获取）
		const [nowRes, forecastRes] = await Promise.all([
			axios.get(`${QWEATHER_BASE_URL}/weather/now?key=${QWEATHER_API_KEY}&location=${location}`),
			axios.get(`${QWEATHER_BASE_URL}/weather/3d?key=${QWEATHER_API_KEY}&location=${location}`)
		])
		
		// 空气质量可能不在订阅范围内，单独处理
		let airData = null
		try {
			const airRes = await axios.get(`${QWEATHER_BASE_URL}/air/now?key=${QWEATHER_API_KEY}&location=${location}`)
			if (airRes.data.code === '200') {
				airData = airRes.data.now
			}
		} catch (airError) {
			console.log('空气质量获取失败（可能不在订阅范围内）:', airError.message)
		}
		
		res.json({
			code: 200,
			message: '获取成功',
			data: {
				now: nowRes.data.code === '200' ? nowRes.data.now : null,
				forecast: forecastRes.data.code === '200' ? forecastRes.data.daily : null,
				air: airData,
				updateTime: nowRes.data.updateTime
			}
		})
	} catch (error) {
		console.error('获取综合天气失败:', error)
		res.status(500).json({
			code: 500,
			message: '获取综合天气失败',
			error: error.message
		})
	}
})

// 404 处理
app.use((req, res) => {
	res.status(404).json({
		code: 404,
		message: '接口不存在',
		path: req.path
	})
})

// 错误处理
app.use((err, req, res, next) => {
	console.error('服务器错误:', err)
	res.status(500).json({
		code: 500,
		message: '服务器内部错误',
		error: err.message
	})
})

// 启动服务器
app.listen(PORT, () => {
	console.log(`服务器运行在 http://localhost:${PORT}`)
	console.log(`数据库连接: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)
})
