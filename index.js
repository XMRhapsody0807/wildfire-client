/**
 * 野火IM Node.js客户端服务
 * 通过WebSocket连接野火IM，像真正用户一样收发消息
 */
const express = require('express');
const axios = require('axios');
const WildfireClient = require('./wildfire-client');

const app = express();
app.use(express.json());

// 存储每个租户的客户端实例
const clients = new Map();

// Java后端地址
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * 启动客户端连接
 */
app.post('/api/connect', async (req, res) => {
    const { tenantId, appServerUrl, username, password } = req.body;
    
    try {
        // 先登录获取token
        const loginResp = await axios.post(`${appServerUrl}/login_pwd`, {
            email: username,
            password: password,
            platform: 2,
            type: 1,
            applyId: 0,
            clientId: `aiim-node-${tenantId}`
        });
        
        if (loginResp.data.code !== 0) {
            return res.json({ 
                success: false, 
                message: loginResp.data.message || '登录失败' 
            });
        }
        
        const { userId, token } = loginResp.data.result;
        
        // 创建客户端并连接
        const client = new WildfireClient({
            tenantId,
            userId,
            token,
            appServerUrl,
            onMessage: (msg) => handleIncomingMessage(tenantId, msg),
            onStatusChange: (online) => updateClientStatus(tenantId, online)
        });
        
        // 停掉旧的
        if (clients.has(tenantId)) {
            clients.get(tenantId).disconnect();
        }
        
        clients.set(tenantId, client);
        await client.connect();
        
        res.json({
            success: true,
            userId,
            userName: loginResp.data.result.userName
        });
    } catch (err) {
        console.error('connect error:', err.message);
        res.json({ success: false, message: err.message });
    }
});

/**
 * 断开连接
 */
app.post('/api/disconnect', (req, res) => {
    const { tenantId } = req.body;
    
    if (clients.has(tenantId)) {
        clients.get(tenantId).disconnect();
        clients.delete(tenantId);
    }
    
    res.json({ success: true });
});

/**
 * 发送文本消息
 */
app.post('/api/send/text', async (req, res) => {
    const { tenantId, targetUserId, content } = req.body;
    
    const client = clients.get(tenantId);
    if (!client || !client.isConnected()) {
        return res.json({ success: false, message: '客户端未连接' });
    }
    
    try {
        const msgId = await client.sendTextMessage(targetUserId, content);
        res.json({ success: true, messageId: msgId });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

/**
 * 发送图片消息
 */
app.post('/api/send/image', async (req, res) => {
    const { tenantId, targetUserId, imageUrl } = req.body;
    
    const client = clients.get(tenantId);
    if (!client || !client.isConnected()) {
        return res.json({ success: false, message: '客户端未连接' });
    }
    
    try {
        const msgId = await client.sendImageMessage(targetUserId, imageUrl);
        res.json({ success: true, messageId: msgId });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

/**
 * 发送表情包
 */
app.post('/api/send/sticker', async (req, res) => {
    const { tenantId, targetUserId, stickerUrl } = req.body;
    
    const client = clients.get(tenantId);
    if (!client || !client.isConnected()) {
        return res.json({ success: false, message: '客户端未连接' });
    }
    
    try {
        const msgId = await client.sendStickerMessage(targetUserId, stickerUrl);
        res.json({ success: true, messageId: msgId });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

/**
 * 获取客户端状态
 */
app.get('/api/status/:tenantId', (req, res) => {
    const tenantId = parseInt(req.params.tenantId);
    const client = clients.get(tenantId);
    
    res.json({
        connected: client ? client.isConnected() : false,
        userId: client ? client.userId : null
    });
});

/**
 * 处理收到的消息，转发到Java后端
 */
async function handleIncomingMessage(tenantId, msg) {
    try {
        console.log(`[${tenantId}] recv msg:`, msg.fromUser, msg.contentType);
        
        await axios.post(`${BACKEND_URL}/api/wildfire/webhook/${tenantId}`, {
            sender: msg.fromUser,
            conv: {
                type: msg.convType,
                target: msg.convTarget
            },
            payload: {
                type: msg.msgType,
                content: msg.content,
                remoteMediaUrl: msg.mediaUrl
            }
        });
    } catch (err) {
        console.error('forward msg error:', err.message);
    }
}

/**
 * 更新客户端在线状态
 */
async function updateClientStatus(tenantId, online) {
    try {
        await axios.post(`${BACKEND_URL}/api/wildfire/client-status`, {
            tenantId,
            online
        });
    } catch (err) {
        console.error('update status error:', err.message);
    }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`野火IM客户端服务启动: http://localhost:${PORT}`);
});
