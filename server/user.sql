-- 设备表结构
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '设备ID',
    name VARCHAR(100) NOT NULL COMMENT '设备名称',
    topic VARCHAR(100) NOT NULL COMMENT '设备主题',
    uid VARCHAR(100) NOT NULL COMMENT '巴法云UID',
    type VARCHAR(10) NOT NULL DEFAULT '1' COMMENT '设备类型：1-单开关，2-双开关',
    status VARCHAR(20) DEFAULT 'off' COMMENT '设备状态：on/off 或 left:right',
    createAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 单开关时间记录字段
    openTime TIMESTAMP NULL COMMENT '最近一次开启时间',
    closeTime TIMESTAMP NULL COMMENT '最近一次关闭时间',
    totalDuration INT DEFAULT 0 COMMENT '累计开启时长（秒）',
    lastDuration INT DEFAULT 0 COMMENT '上次开启时长（秒）',
    
    -- 双开关时间记录字段（左开关）
    leftOpenTime TIMESTAMP NULL COMMENT '左开关最近一次开启时间',
    leftCloseTime TIMESTAMP NULL COMMENT '左开关最近一次关闭时间',
    leftTotalDuration INT DEFAULT 0 COMMENT '左开关累计开启时长（秒）',
    leftLastDuration INT DEFAULT 0 COMMENT '左开关上次开启时长（秒）',
    
    -- 双开关时间记录字段（右开关）
    rightOpenTime TIMESTAMP NULL COMMENT '右开关最近一次开启时间',
    rightCloseTime TIMESTAMP NULL COMMENT '右开关最近一次关闭时间',
    rightTotalDuration INT DEFAULT 0 COMMENT '右开关累计开启时长（秒）',
    rightLastDuration INT DEFAULT 0 COMMENT '右开关上次开启时长（秒）',
    
    userId INT NOT NULL COMMENT '用户ID',
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';

-- 如果表已存在，添加双开关时间字段的SQL
-- ALTER TABLE devices 
-- ADD COLUMN leftOpenTime TIMESTAMP NULL COMMENT '左开关最近一次开启时间',
-- ADD COLUMN leftCloseTime TIMESTAMP NULL COMMENT '左开关最近一次关闭时间',
-- ADD COLUMN leftTotalDuration INT DEFAULT 0 COMMENT '左开关累计开启时长（秒）',
-- ADD COLUMN leftLastDuration INT DEFAULT 0 COMMENT '左开关上次开启时长（秒）',
-- ADD COLUMN rightOpenTime TIMESTAMP NULL COMMENT '右开关最近一次开启时间',
-- ADD COLUMN rightCloseTime TIMESTAMP NULL COMMENT '右开关最近一次关闭时间',
-- ADD COLUMN rightTotalDuration INT DEFAULT 0 COMMENT '右开关累计开启时长（秒）',
-- ADD COLUMN rightLastDuration INT DEFAULT 0 COMMENT '右开关上次开启时长（秒）';
