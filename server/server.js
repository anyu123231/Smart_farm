require('dotenv').config()
const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')

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

// 健康检查接口
app.get('/health', (req, res) => {
	res.json({
		code: 200,
		message: '服务运行正常',
		timestamp: new Date().toISOString()
	})
})

// 获取所有设备列表（支持单数和复数路径）
app.get('/api/device', async (req, res) => {
	try {
		const [rows] = await pool.query(
			'SELECT id, name, topic, uid, status, createAt FROM devices ORDER BY createAt DESC'
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

// 创建新设备
app.post('/api/device', async (req, res) => {
	try {
		const { name, topic, uid, _openid, status } = req.body
		
		console.log('收到创建设备请求:', { name, topic, uid, _openid, status })
		
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
		
		console.log('_openid不存在，开始创建设备')
		const [result] = await pool.query(
			'INSERT INTO devices (name, topic, uid, _openid, status, createAt) VALUES (?, ?, ?, ?, ?, NOW())',
			[name, topic, uid, _openid, status || 0]
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
				status: status || 0
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
app.get('/api/devices/user', async (req, res) => {
	try {
		const { openid } = req.query
		const [rows] = await pool.query(
			'SELECT id, name, topic, uid, status, createAt FROM devices WHERE _openid = ? ORDER BY createAt DESC',
			[openid]
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
app.put('/api/device/status', async (req, res) => {
	try {
		const { id, status } = req.body
		const [result] = await pool.query(
			'UPDATE devices SET status = ? WHERE id = ?',
			[status, id]
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

// 删除设备
app.delete('/api/device', async (req, res) => {
	try {
		const { id } = req.query
		const [result] = await pool.query('DELETE FROM devices WHERE id = ?', [id])
		
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
