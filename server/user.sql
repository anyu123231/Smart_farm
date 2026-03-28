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

-- 修改 devices 表的 status 字段类型为 varchar，并将 1/0 转换为 on/off
ALTER TABLE devices MODIFY COLUMN status VARCHAR(10) DEFAULT 'off';
UPDATE devices SET status = 'on' WHERE status = '1' OR status = 1;
UPDATE devices SET status = 'off' WHERE status = '0' OR status = 0 OR status IS NULL;

-- 添加 type 列，存放设备类型，默认为 '1'
ALTER TABLE devices ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT '1';
-- 将现有设备的 type 设置为 '1'
UPDATE devices SET type = '1' WHERE type IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);

-- 插入测试数据
INSERT INTO users (username, password) VALUES 
('admin', '123456'),
('user1', '123456');