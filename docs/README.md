# Amazon Frontend 项目文档

欢迎使用Amazon Frontend项目文档！这里提供了项目中各组件和工具的详细使用说明。

## 文档目录

### 组件文档

- [StoreIdentifier 商店来源标识组件](./components/StoreIdentifier.md) - 用于显示商品来源店铺的标识组件
- [产品模板系统文档](./components/ProductTemplates.md) - 包含 CardProductElement, HorizontalProductElement, MiniProductElement, SimpleProductElement 等模板的说明
- [收藏功能](./Favorites/Favorites.md) - 收藏功能的完整使用指南，包含前端组件和API
- [邮件订阅功能](./NewsletterSubscribe.md) - 邮件订阅功能的实现细节和使用方法
- [仪表盘系统](./dashboard/README.md) - 后台管理仪表盘的完整文档，包含角色权限系统和组件说明
- [自定义脚本功能](./dashboard/CustomScripts.md) - 在网站中注入自定义JavaScript或HTML代码的功能说明

### API文档

- [Amazon Frontend API 文档](./API.md) - 详细的API使用说明和示例代码
- [收藏功能 API](./Favorites/Favorites.md#后端api) - 收藏功能相关的API端点和使用示例
- [邮件订阅 API](./email/NewsletterSubscribe.md#后端api) - 邮件订阅相关的API端点和数据库结构
- [仪表盘 API](./dashboard/README.md#api文档) - 仪表盘相关的API端点和权限控制
- [自定义脚本 API](./dashboard/CustomScripts.md#技术实现) - 自定义脚本相关的API端点和技术实现

### 系统功能

- [缓存机制实现文档](./cach/Caching.md) - 缓存策略和实现细节，包含分类统计和精选商品的缓存机制
- [角色权限系统](./dashboard/README.md#角色权限系统) - 用户角色和权限管理的详细说明

## 如何使用本文档

每个组件文档包含以下内容：

1. 组件概述 - 组件的功能介绍
2. 属性API - 组件支持的属性详细说明
3. 使用示例 - 常见使用场景的代码示例
4. 高级用法 - 组件的进阶使用方法
5. 注意事项 - 使用组件时需要注意的问题

## 贡献文档

如需添加或更新文档，请按照以下步骤：

1. 在相应目录创建或编辑Markdown文件
2. 更新本README.md文件以包含新文档的链接
3. 遵循现有文档的格式和风格

## 相关资源

- [项目GitHub仓库](#) - 项目源代码
- [问题反馈](#) - 报告问题或提出建议 