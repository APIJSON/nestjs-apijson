# APIJSON Server

基于 NestJS 的 APIJSON 服务器实现。

## 功能特性

- 🚀 基于 NestJS 框架，高性能、可扩展
- 📝 完整的 APIJSON 语法支持
- 🔍 强大的查询解析和验证
- 🛡️ 内置认证和授权
- 📊 详细的日志和性能监控
- 💾 灵活的缓存策略
- 📖 完整的 API 文档
- 🧪 全面的单元测试和集成测试

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env.example` 到 `.env` 并根据需要修改配置：

```bash
cp .env.example .env
```

### 启动应用

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

应用将在 `http://localhost:3000` 启动。

## API 文档

启动应用后，访问 `http://localhost:3000/docs` 查看完整的 API 文档。

## 项目结构

```
src/
├── common/                 # 公共模块
│   ├── decorators/         # 装饰器
│   ├── filters/           # 异常过滤器
│   ├── guards/            # 守卫
│   ├── interceptors/      # 拦截器
│   └── pipes/            # 管道
├── config/               # 配置文件
├── controllers/          # 控制器
├── interfaces/           # 接口定义
├── modules/              # 业务模块
│   ├── builder/          # 构建器模块
│   ├── cache/           # 缓存模块
│   ├── database/        # 数据库模块
│   ├── executor/        # 执行器模块
│   ├── parser/          # 解析器模块
│   └── verifier/        # 验证器模块
├── types/                # 类型定义
├── app.module.ts         # 应用模块
└── main.ts              # 应用入口
```

## 核心模块

### 解析器 (Parser)

负责解析 APIJSON 请求，将其转换为内部数据结构。

### 验证器 (Verifier)

负责验证解析后的请求，确保其符合规范和安全要求。

### 构建器 (Builder)

负责将验证后的请求构建为 SQL 查询。

### 执行器 (Executor)

负责执行 SQL 查询并返回结果。

### 缓存 (Cache)

负责缓存查询结果，提高性能。

## 配置

### 应用配置

| 环境变量 | 默认值 | 描述 |
| --- | --- | --- |
| NODE_ENV | development | 运行环境 |
| PORT | 3000 | 应用端口 |
| HOST | 0.0.0.0 | 应用主机 |
| GLOBAL_PREFIX | api | 全局路由前缀 |
| APP_VERSION | 1.0.0 | 应用版本 |

### 数据库配置

| 环境变量 | 默认值 | 描述 |
| --- | --- | --- |
| DB_TYPE | sqlite | 数据库类型 |
| DB_HOST | localhost | 数据库主机 |
| DB_PORT | 3306 | 数据库端口 |
| DB_USERNAME | root | 数据库用户名 |
| DB_PASSWORD | - | 数据库密码 |
| DB_DATABASE | apijson | 数据库名称 |

### JWT 配置

| 环境变量 | 默认值 | 描述 |
| --- | --- | --- |
| JWT_SECRET | default-secret | JWT 密钥 |
| JWT_EXPIRES_IN | 1d | JWT 过期时间 |
| JWT_ISSUER | apijson-server | JWT 发行者 |
| JWT_AUDIENCE | apijson-client | JWT 受众 |

### 缓存配置

| 环境变量 | 默认值 | 描述 |
| --- | --- | --- |
| CACHE_TYPE | memory | 缓存类型 |
| CACHE_HOST | localhost | 缓存主机 |
| CACHE_PORT | 6379 | 缓存端口 |
| CACHE_PASSWORD | - | 缓存密码 |
| CACHE_DEFAULT_TTL | 300000 | 默认缓存时间 (毫秒) |

## 开发

### 代码规范

项目使用 ESLint 和 Prettier 进行代码格式化：

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范
npm run lint:fix

# 格式化代码
npm run format
```

### 测试

```bash
# 运行单元测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:cov

# 运行端到端测试
npm run test:e2e
```

### 构建

```bash
# 构建应用
npm run build

# 构建生产版本
npm run build:prod
```

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t apijson-server .

# 运行容器
docker run -p 3000:3000 apijson-server
```

### 传统部署

```bash
# 构建应用
npm run build:prod

# 启动应用
npm run start:prod
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
