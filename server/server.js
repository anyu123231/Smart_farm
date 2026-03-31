require('dotenv').config()
const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')
const jwt = require('jsonwebtoken')

// 创建 Express 应用
const app = express()
const PORT = process.env.PORT || 3000

// 中间件配置
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 数据库连接配置
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

// 创建数据库连接池
const pool = mysql.createPool(dbConfig)

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

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
		const axios = require('axios')
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
	const open = new Date(openTime.replace(' ', 'T'))
	const now = new Date()
	return Math.floor((now - open) / 1000)
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
