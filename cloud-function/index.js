// 腾讯云函数入口文件
const mysql = require('mysql2/promise')

// 数据库连接配置（从环境变量读取）
const dbConfig = {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	charset: process.env.DB_CHARSET || 'utf8mb4',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
}

// 创建数据库连接池
let pool

// 初始化数据库连接
function initDB() {
	if (!pool) {
		pool = mysql.createPool(dbConfig)
	}
	return pool
}

// 云函数主入口
exports.main_handler = async (event, context) => {
	try {
		// 初始化数据库连接
		const db = initDB()
		
		// 解析请求参数
		const path = event.path || ''
		const httpMethod = event.httpMethod || 'GET'
		const queryString = event.queryString || {}
		const body = event.body ? JSON.parse(event.body) : {}
		
		// 路由分发
		let result
		if (path === '/api/devices' && httpMethod === 'GET') {
			result = await getDevices(db)
		} else if (path === '/api/devices/user' && httpMethod === 'GET') {
			result = await getUserDevices(db, queryString.openid)
		} else if (path === '/api/devices/status' && httpMethod === 'PUT') {
			result = await updateDeviceStatus(db, body.id, body.status)
		} else if (path === '/api/devices' && httpMethod === 'POST') {
			result = await addDevice(db, body)
		} else if (path === '/api/devices' && httpMethod === 'DELETE') {
			result = await deleteDevice(db, queryString.id)
		} else if (path === '/health') {
			result = healthCheck()
		} else {
			return {
				statusCode: 404,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				},
				body: JSON.stringify({
					code: 404,
					message: '接口不存在'
				})
			}
		}
		
		// 返回响应
		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			},
			body: JSON.stringify(result)
		}
		
	} catch (error) {
		console.error('云函数执行错误:', error)
		return {
			statusCode: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			},
			body: JSON.stringify({
				code: 500,
				message: '服务器内部错误',
				error: error.message
			})
		}
	}
}

// 获取所有设备列表
async function getDevices(db) {
	try {
		const [rows] = await db.query(
			'SELECT id, name, topic, uid, status, createAt FROM devices ORDER BY createAt DESC'
		)
		return {
			code: 200,
			message: '获取设备列表成功',
			data: rows
		}
	} catch (error) {
		throw error
	}
}

// 获取用户设备列表
async function getUserDevices(db, openid) {
	try {
		const [rows] = await db.query(
			'SELECT id, name, topic, uid, status, createAt FROM devices WHERE _openid = ? ORDER BY createAt DESC',
			[openid]
		)
		return {
			code: 200,
			message: '获取用户设备列表成功',
			data: rows
		}
	} catch (error) {
		throw error
	}
}

// 更新设备状态
async function updateDeviceStatus(db, id, status) {
	try {
		const [result] = await db.query(
			'UPDATE devices SET status = ? WHERE id = ?',
			[status, id]
		)
		
		if (result.affectedRows === 0) {
			return {
				code: 404,
				message: '设备不存在'
			}
		}
		
		return {
			code: 200,
			message: '更新设备状态成功'
		}
	} catch (error) {
		throw error
	}
}

// 添加新设备
async function addDevice(db, deviceData) {
	try {
		const { name, topic, uid, status, _openid } = deviceData
		const [result] = await db.query(
			'INSERT INTO devices (name, topic, uid, status, _openid) VALUES (?, ?, ?, ?, ?)',
			[name, topic, uid, status || 0, _openid]
		)
		
		return {
			code: 200,
			message: '添加设备成功',
			data: {
				id: result.insertId
			}
		}
	} catch (error) {
		throw error
	}
}

// 删除设备
async function deleteDevice(db, id) {
	try {
		const [result] = await db.query('DELETE FROM devices WHERE id = ?', [id])
		
		if (result.affectedRows === 0) {
			return {
				code: 404,
				message: '设备不存在'
			}
		}
		
		return {
			code: 200,
			message: '删除设备成功'
		}
	} catch (error) {
		throw error
	}
}

// 健康检查
function healthCheck() {
	return {
		code: 200,
		message: '服务运行正常',
		timestamp: new Date().toISOString()
	}
}
