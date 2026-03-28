# Tasks
- [x] Task 1: 分析现有数据库结构和设备卡片代码
  - [x] SubTask 1.1: 查看当前devices.vue中的设备卡片实现
  - [x] SubTask 1.2: 查看user.sql文件了解当前数据库结构
  - [x] SubTask 1.3: 确定需要添加的数据库字段

- [x] Task 2: 更新数据库结构
  - [x] SubTask 2.1: 在user.sql中添加开关时间相关字段
  - [x] SubTask 2.2: 添加字段说明注释

- [x] Task 3: 修改设备卡片UI显示
  - [x] SubTask 3.1: 移除卡片上的创建时间显示
  - [x] SubTask 3.2: 移除卡片上的uid显示
  - [x] SubTask 3.3: 添加开关时间显示逻辑
  - [x] SubTask 3.4: 实现开启状态下的时间显示
  - [x] SubTask 3.5: 实现关闭状态下的时间显示

- [x] Task 4: 实现开关时间记录功能
  - [x] SubTask 4.1: 在设备开启时记录开启时间
  - [x] SubTask 4.2: 在设备关闭时记录关闭时间
  - [x] SubTask 4.3: 计算并保存开启时长
  - [x] SubTask 4.4: 更新云数据库中的设备记录

- [x] Task 5: 实现时长计算和显示
  - [x] SubTask 5.1: 实现当前开启时长的实时计算
  - [x] SubTask 5.2: 实现历史开启时长的累计计算
  - [x] SubTask 5.3: 格式化时长显示（小时、分钟）

- [x] Task 6: 测试和验证
  - [x] SubTask 6.1: 测试设备开启时时间记录
  - [x] SubTask 6.2: 测试设备关闭时时间记录和时长计算
  - [x] SubTask 6.3: 验证卡片显示的正确性
  - [x] SubTask 6.4: 验证数据库数据正确保存

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 2]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 3, Task 4, Task 5]
