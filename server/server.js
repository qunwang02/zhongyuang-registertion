const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const routes = require('./routes');
const database = require('./database');

// 创建Express应用
const app = express();

// 重要：信任代理（Render等云平台需要此配置）
app.set('trust proxy', true);

// 捕获未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"]
    }
  }
}));

// CORS配置
app.use(cors({
  origin: config.server.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求日志
app.use(morgan(config.server.env === 'development' ? 'dev' : 'combined'));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: config.server.rateLimit.windowMs,
  max: config.server.rateLimit.max,
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api/', limiter);

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API路由
app.use('/', routes);

// 首页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 管理页面路由
const adminPassword = req.query.password;
  
  // 从环境变量获取管理员密码，默认值为 "admin123"
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (adminPassword === ADMIN_PASSWORD) {
    res.sendFile(path.join(__dirname, '../public/fosheng.html'));
  } else {
    // 如果没有密码或密码错误，显示密码输入页面
    res.send(`
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>中元信息管理系统 - 管理员登录</title>
          <style>
              body {
                  font-family: 'Microsoft JhengHei', Arial, sans-serif;
                  background-color: #f5f5f5;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
              }
              .login-container {
                  background-color: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 0 20px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 400px;
                  width: 90%;
              }
              h1 {
                  color: #2c3e50;
                  margin-bottom: 30px;
              }
              .password-input {
                  width: 100%;
                  padding: 12px;
                  margin-bottom: 20px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  font-size: 16px;
                  box-sizing: border-box;
              }
              .password-input:focus {
                  outline: none;
                  border-color: #3498db;
                  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
              }
              .submit-btn {
                  background-color: #3498db;
                  color: white;
                  border: none;
                  padding: 12px 30px;
                  border-radius: 5px;
                  font-size: 16px;
                  cursor: pointer;
                  width: 100%;
                  transition: background-color 0.3s;
              }
              .submit-btn:hover {
                  background-color: #2980b9;
              }
              .error-message {
                  color: #e74c3c;
                  margin-top: 15px;
                  display: none;
              }
              .footer-note {
                  margin-top: 20px;
                  color: #7f8c8d;
                  font-size: 12px;
              }
          </style>
      </head>
      <body>
          <div class="login-container">
              <h1><i class="fas fa-lock"></i> 管理员登录</h1>
              <p style="color: #7f8c8d; margin-bottom: 20px;">请输入管理员密码以访问管理后台</p>
              
              <form id="loginForm" action="/admin" method="GET">
                  <input type="password" 
                         class="password-input" 
                         name="password" 
                         placeholder="请输入管理员密码" 
                         required>
                  <button type="submit" class="submit-btn">
                      <i class="fas fa-sign-in-alt"></i> 登录
                  </button>
              </form>
              
              ${req.query.password ? '<div class="error-message" id="errorMessage">密码错误，请重新输入</div>' : ''}
              
              <div class="footer-note">
                  如需管理权限，请联系系统管理员
              </div>
          </div>
          
          <script>
              // 显示错误信息
              ${req.query.password ? 'document.getElementById("errorMessage").style.display = "block";' : ''}
              
              // 自动聚焦到密码输入框
              document.querySelector('.password-input').focus();
              
              // 表单提交后清除URL中的错误参数（避免刷新时再次显示错误）
              document.getElementById('loginForm').addEventListener('submit', function() {
                const url = new URL(window.location.href);
                url.searchParams.delete('password');
                window.history.replaceState({}, '', url);
              });
          </script>
      </body>
      </html>
    `);
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: '请求的资源不存在' 
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    success: false, 
    error: config.server.env === 'development' ? err.message : '服务器内部错误',
    ...(config.server.env === 'development' && { stack: err.stack })
  });
});

// 启动服务器
async function startServer() {
  try {
    console.log('🔧 开始启动服务器...');
    console.log(`📂 环境: ${config.server.env}`);
    console.log(`🔌 端口: ${config.server.port}`);
    
    // 首先启动HTTP服务器
    const server = app.listen(config.server.port, () => {
      console.log(`🚀 服务器启动成功，端口: ${config.server.port}`);
      console.log(`🌐 访问地址: http://localhost:${config.server.port}`);
      console.log(`📊 管理页面: http://localhost:${config.server.port}/admin`);
    });
    
    // 然后异步连接数据库（不阻塞服务器启动）
    setTimeout(async () => {
      try {
        console.log('🔄 正在连接数据库...');
        await database.connect();
        console.log('✅ 数据库连接成功');
      } catch (dbError) {
        console.error('⚠️ 数据库连接失败，但服务器继续运行:', dbError.message);
        console.log('ℹ️ 数据库相关功能将不可用，但静态文件和API仍可访问');
      }
    }, 1000); // 延迟1秒连接，确保服务器先启动
    
    // 优雅关闭
    const gracefulShutdown = async () => {
      console.log('🛑 收到关闭信号，正在优雅关闭...');
      
      server.close(async () => {
        console.log('✅ HTTP服务器已关闭');
        
        try {
          await database.disconnect();
          console.log('✅ 数据库连接已关闭');
        } catch (disconnectError) {
          console.error('❌ 关闭数据库连接失败:', disconnectError.message);
        }
        
        process.exit(0);
      });
      
      // 如果10秒后还没关闭，强制退出
      setTimeout(() => {
        console.error('❌ 强制关闭服务器');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    // 保持进程活跃
    setInterval(() => {
      console.log(`⏱️  服务器已运行 ${process.uptime().toFixed(0)} 秒`);
    }, 60000); // 每分钟记录一次
    
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    // 不要立即退出，给点时间记录错误
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
}

// 添加额外的日志来诊断启动过程
console.log('📦 开始执行 server.js');
console.log(`📁 当前目录: ${__dirname}`);
console.log(`🔧 Node版本: ${process.version}`);

startServer();
