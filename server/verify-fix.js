// verify-fix.js - 验证修复
const https = require('https');
const URL = 'https://zhongyuan-registertion.onrender.com';

function testHealth() {
  console.log('🔍 测试健康检查...');
  
  https.get(`${URL}/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ 健康检查结果:', JSON.parse(data));
      testDataSubmit();
    });
  }).on('error', (err) => {
    console.error('❌ 健康检查失败:', err.message);
  });
}

function testDataSubmit() {
  console.log('\n📤 测试数据提交...');
  
  const postData = JSON.stringify({
    data: [{
      name: "验证用户",
      project: "副总功德主",
      method: "测试方法",
      content: "验证测试",
      payment: "已缴费",
      contact: "验证联系人",
      amountTWD: 80000,
      amountRMB: 19047.62,
      localId: "verify_" + Date.now(),
      createTime: new Date().toISOString(),
      rowIndex: 1
    }],
    batchId: "verify_batch",
    deviceId: "verify_device"
  });
  
  const options = {
    hostname: 'zhongyuan-registertion.onrender.com',
    port: 443,
    path: '/api/records',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ 数据提交结果:', JSON.parse(data));
      console.log('\n🎉 验证完成！');
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ 数据提交失败:', err.message);
  });
  
  req.write(postData);
  req.end();
}

// 开始验证
console.log('🔧 开始验证服务器修复...');
testHealth();
