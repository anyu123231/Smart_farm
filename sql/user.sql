-- 创建数据库
CREATE DATABASE IF NOT EXISTS appdb;

-- 使用数据库
USE appdb;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建设备表（添加用户ID外键）
CREATE TABLE IF NOT EXISTS devices (
    id bigint AUTO_INCREMENT PRIMARY KEY,
    createAt timestamp DEFAULT CURRENT_TIMESTAMP,
    _openid varchar(255),
    name varchar(255),
    topic varchar(255),
    uid varchar(255),
    status tinyint DEFAULT 0,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_devices_user_id ON devices(user_id);

-- 插入测试数据
INSERT INTO users (username, password) VALUES 
('admin', '123456'),
('user1', '123456');

-- 插入测试设备数据
INSERT INTO devices (user_id, name, topic, uid, status) VALUES 
(1, '测试设备1', 'light001', 'your_uid_here', 0),
(1, '测试设备2', 'light002', 'your_uid_here', 1),
(2, '用户1设备', 'light003', 'your_uid_here', 0);