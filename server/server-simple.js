// server-simple.js - 简化稳定版本
const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./database');

console.log('🚀 启动简化版服务器...');
console.log(`📁 当前目录: ${__dirname}`);
console.log(`🔧 Node版本: ${process.version}`);

const app = express();

// 基础配置
app.set('trust proxy', 1); // 信任第一个代理

// CORS
app.use(cors());

// JSON 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件（简化版）
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.ip;
  console.log(`📥 [${timestamp}] ${ip} - ${req.method} ${req.path}`);
  next();
});

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 管理后台（带密码）
app.get('/admin', (req, res) => {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const password = req.query.password;
  
  if (password === ADMIN_PASSWORD) {
    res.sendFile(path.join(__dirname, '../public/fosheng.html'));
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>管理员登录</title>
        <style>body{font-family:sans-serif;padding:20px}</style>
      </head>
      <body>
        <h2>管理员登录</h2>
        <form action="/admin" method="GET">
          <input type="password" name="password" placeholder="密码" required>
          <button type="submit">登录</button>
        </form>
      </body>
      </html>
    `);
  }
});

// 路由文件（确保存在）
try {
  const routes = require('./routes');
  app.use('/', routes);
  console.log('✅ 路由模块加载成功');
} catch (error) {
  console.error('❌ 路由模块加载失败:', error.message);
  
  // 提供基础API作为备用
  app.post('/api/records', async (req, res) => {
    console.log('📥 收到数据提交:', req.body.data?.length || 0, '条');
    res.json({ 
      success: true, 
      message: '数据接收成功（简易模式）',
      count: req.body.data?.length || 0 
    });
  });
  
  app.get('/api/records', async (req, res) => {
    res.json({ 
      success: true, 
      data: [],
      message: '简易模式：返回空数据'
    });
  });
}

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '未找到资源' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.message);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ 服务器启动成功，端口: ${PORT}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
});

// 异步连接数据库
setTimeout(async () => {
  try {
    await database.connect();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('⚠️ 数据库连接失败:', error.message);
  }
}, 1000);

// 优雅关闭
const gracefulShutdown = () => {
  console.log('🛑 收到关闭信号...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('❌ 强制关闭');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 保持进程运行
setInterval(() => {
  console.log(`⏱️  服务器运行时间: ${process.uptime().toFixed(0)} 秒`);
}, 30000);
