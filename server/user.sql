-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 为设备表添加用户ID外键
ALTER TABLE devices ADD COLUMN IF NOT EXISTS user_id INT NOT NULL;
ALTER TABLE devices ADD CONSTRAINT IF NOT EXISTS fk_devices_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);

-- 插入测试数据
INSERT INTO users (username, password) VALUES 
('admin', '123456'),
('user1', '123456');