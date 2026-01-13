/**
 * 野火IM WebSocket客户端
 * 简化实现，实际需要根据野火IM协议完善
 */
const WebSocket = require('ws');
const axios = require('axios');

class WildfireClient {
    constructor(options) {
        this.tenantId = options.tenantId;
        this.userId = options.userId;
        this.token = options.token;
        this.appServerUrl = options.appServerUrl;
        this.onMessage = options.onMessage || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        
        this.ws = null;
        this.connected = false;
        this.messageId = 0;
        this.pendingCallbacks = new Map();
    }
    
    /**
     * 连接到IM服务器
     * 野火IM使用自定义协议，这里用HTTP轮询作为简化方案
     * 实际生产环境应该使用野火IM的proto协议
     */
    async connect() {
        this.connected = true;
        this.onStatusChange(true);
        console.log(`[${this.tenantId}] client connected, userId: ${this.userId}`);
        
        // 启动消息轮询
        this.startPolling();
        
        return true;
    }
    
    /**
     * 消息轮询（简化方案）
     * 每隔几秒从服务器拉取新消息
     */
    startPolling() {
        this.pollTimer = setInterval(async () => {
            if (!this.connected) return;
            
            try {
                // 这里应该调用野火IM的拉取消息接口
                // 实际实现需要根据野火IM的API
                // await this.pullMessages();
            } catch (err) {
                console.error('poll error:', err.message);
            }
        }, 3000);
    }
    
    /**
     * 断开连接
     */
    disconnect() {
        this.connected = false;
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.onStatusChange(false);
        console.log(`[${this.tenantId}] client disconnected`);
    }
    
    isConnected() {
        return this.connected;
    }
    
    /**
     * 发送文本消息
     * 通过App Server的API发送
     */
    async sendTextMessage(targetUserId, content) {
        // 使用App Server的发送消息接口
        // 野火IM的App Server应该提供发送消息的HTTP接口
        const msgId = ++this.messageId;
        
        try {
            // 这里调用野火IM App Server的发送消息接口
            // 具体接口需要根据野火IM的文档
            const resp = await axios.post(`${this.appServerUrl}/message/send`, {
                sender: this.userId,
                conv: {
                    type: 0, // 单聊
                    target: targetUserId,
                    line: 0
                },
                content: {
                    type: 1, // 文本消息
                    searchableContent: content,
                    content: content
                }
            }, {
                headers: {
                    'authToken': this.token
                }
            });
            
            if (resp.data.code === 0) {
                console.log(`[${this.tenantId}] sent text to ${targetUserId}`);
                return resp.data.result || msgId.toString();
            } else {
                throw new Error(resp.data.message || '发送失败');
            }
        } catch (err) {
            console.error('send text error:', err.message);
            throw err;
        }
    }
    
    /**
     * 发送图片消息
     */
    async sendImageMessage(targetUserId, imageUrl) {
        const msgId = ++this.messageId;
        
        try {
            const resp = await axios.post(`${this.appServerUrl}/message/send`, {
                sender: this.userId,
                conv: {
                    type: 0,
                    target: targetUserId,
                    line: 0
                },
                content: {
                    type: 3, // 图片消息
                    searchableContent: '[图片]',
                    remoteMediaUrl: imageUrl,
                    mediaType: 1
                }
            }, {
                headers: {
                    'authToken': this.token
                }
            });
            
            if (resp.data.code === 0) {
                console.log(`[${this.tenantId}] sent image to ${targetUserId}`);
                return resp.data.result || msgId.toString();
            } else {
                throw new Error(resp.data.message || '发送失败');
            }
        } catch (err) {
            console.error('send image error:', err.message);
            throw err;
        }
    }
    
    /**
     * 发送表情包
     */
    async sendStickerMessage(targetUserId, stickerUrl) {
        const msgId = ++this.messageId;
        
        try {
            const resp = await axios.post(`${this.appServerUrl}/message/send`, {
                sender: this.userId,
                conv: {
                    type: 0,
                    target: targetUserId,
                    line: 0
                },
                content: {
                    type: 8, // 贴图消息
                    searchableContent: '[表情]',
                    remoteMediaUrl: stickerUrl
                }
            }, {
                headers: {
                    'authToken': this.token
                }
            });
            
            if (resp.data.code === 0) {
                console.log(`[${this.tenantId}] sent sticker to ${targetUserId}`);
                return resp.data.result || msgId.toString();
            } else {
                throw new Error(resp.data.message || '发送失败');
            }
        } catch (err) {
            console.error('send sticker error:', err.message);
            throw err;
        }
    }
}

module.exports = WildfireClient;
