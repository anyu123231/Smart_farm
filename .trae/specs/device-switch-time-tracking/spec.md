# 设备开关时间记录功能 Spec

## Why
用户需要追踪设备的开启和关闭时间，以便了解设备的使用情况和时长统计。当前卡片上显示的创建时间和uid信息对用户没有实际意义，需要替换为更有价值的开关时间信息。

## What Changes
- 在设备卡片上显示开关时间信息
- 记录设备的开启和关闭时间到云数据库
- 移除卡片上的创建时间和uid显示
- 添加数据库字段以存储开关时间信息

## Impact
- Affected specs: 设备管理功能
- Affected code: 
  - d:\智慧农业APP\智慧农业\pages\index\devices.vue (设备卡片UI)
  - d:\智慧农业APP\智慧农业\server\user.sql (数据库结构)
  - 云数据库设备集合

## ADDED Requirements
### Requirement: 设备开关时间记录
系统 SHALL 记录设备的每次开启和关闭时间，并计算开启时长。

#### Scenario: 设备开启时
- **WHEN** 用户打开设备
- **THEN** 系统记录开启时间到数据库
- **AND** 更新设备状态为开启

#### Scenario: 设备关闭时
- **WHEN** 用户关闭设备
- **THEN** 系统记录关闭时间到数据库
- **AND** 计算本次开启时长并保存
- **AND** 更新设备状态为关闭

### Requirement: 卡片时间显示
卡片 SHALL 根据设备状态显示不同的时间信息。

#### Scenario: 设备处于开启状态
- **WHEN** 设备状态为开启
- **THEN** 显示"开启时间：[开启时间]"
- **AND** 显示"已开启：[当前时长]"

#### Scenario: 设备处于关闭状态
- **WHEN** 设备状态为关闭
- **AND** 有历史开启记录
- **THEN** 显示"关闭时间：[上一次关闭时间]"
- **AND** 显示"上次开启时长：[总开启时长]"

## MODIFIED Requirements
### Requirement: 设备卡片显示
设备卡片 SHALL 移除创建时间和uid的显示，替换为开关时间信息。

#### Scenario: 卡片信息展示
- **WHEN** 用户查看设备卡片
- **THEN** 不显示创建时间
- **AND** 不显示uid
- **AND** 显示开关时间相关信息

## REMOVED Requirements
### Requirement: 创建时间和uid显示
**Reason**: 这些信息对用户没有实际价值，替换为更有意义的开关时间信息
**Migration**: 直接移除显示，不需要数据迁移
