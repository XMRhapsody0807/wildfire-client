# Wildfire Client

野火IM Node.js客户端服务，通过HTTP API与Java后端通信。

## 功能

- 连接野火IM服务器
- 发送文本/图片/表情包消息
- 接收消息并转发到后端

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3001 | 服务端口 |
| BACKEND_URL | http://localhost:8080 | Java后端地址 |

## API

### 连接
```
POST /api/connect
{
  "tenantId": 1,
  "appServerUrl": "https://xxx",
  "username": "xxx",
  "password": "xxx"
}
```

### 发送消息
```
POST /api/send/text
POST /api/send/image
POST /api/send/sticker
```

### 状态
```
GET /api/status/:tenantId
```

## 部署

```bash
npm install --production
pm2 start index.js --name wildfire-client
```
