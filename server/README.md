# 智慧农业后端API服务

## 项目介绍
这是智慧农业应用的后端API服务，用于连接腾讯云数据库并提供设备管理接口。

## 技术栈
- Node.js
- Express.js
- MySQL2
- CORS

## 安装依赖
```bash
npm install
```

## 配置环境变量
1. 复制 `.env.example` 文件并重命名为 `.env`
2. 修改 `.env` 文件中的数据库连接信息

```env
DB_HOST=your-db-host.tencentcloudapi.com
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_DATABASE=valvecontrol-6gosonkm966694e0
DB_CHARSET=utf8mb4

PORT=3000
NODE_ENV=development
```

## 启动服务
### 开发模式（自动重启）
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

## API接口文档

### 1. 获取所有设备列表
- **接口**: `GET /api/devices`
- **描述**: 获取数据库中所有设备的列表
- **响应示例**:
```json
{
  "code": 200,
  "message": "获取设备列表成功",
  "data": [
    {
      "id": 1,
      "name": "智能温室控制器",
      "topic": "eDko44218006",
      "uid": "7389427f70094e918d5ea65ea2ca985b",
      "status": 1,
      "createAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 2. 获取用户设备列表
- **接口**: `GET /api/devices/user/:openid`
- **描述**: 根据用户openid获取对应的设备列表
- **参数**: 
  - `openid` (路径参数): 用户的openid
- **响应示例**:
```json
{
  "code": 200,
  "message": "获取用户设备列表成功",
  "data": [...]
}
```

### 3. 更新设备状态
- **接口**: `PUT /api/devices/:id/status`
- **描述**: 更新指定设备的开关状态
- **参数**:
  - `id` (路径参数): 设备ID
  - `status` (请求体): 新的状态值 (0或1)
- **请求示例**:
```json
{
  "status": 1
}
```

### 4. 添加新设备
- **接口**: `POST /api/devices`
- **描述**: 向数据库添加新的设备
- **请求体**:
```json
{
  "name": "智能温室控制器",
  "topic": "eDko44218006",
  "uid": "7389427f70094e918d5ea65ea2ca985b",
  "status": 0,
  "_openid": "user_openid"
}
```

### 5. 删除设备
- **接口**: `DELETE /api/devices/:id`
- **描述**: 删除指定的设备
- **参数**:
  - `id` (路径参数): 设备ID

### 6. 健康检查
- **接口**: `GET /health`
- **描述**: 检查服务是否正常运行

## 数据库表结构
```sql
CREATE TABLE devices (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  createAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  _openid VARCHAR(255),
  name VARCHAR(255),
  topic VARCHAR(255),
  uid VARCHAR(255),
  status TINYINT DEFAULT 0
);
```

## 注意事项
1. 确保腾讯云数据库的防火墙规则允许你的IP地址访问
2. 生产环境请使用HTTPS协议
3. 建议添加身份验证和授权机制
4. 定期备份数据库数据
