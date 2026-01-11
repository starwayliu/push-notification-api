/**
 * 推送通知 API 测试脚本
 * 使用 Node.js 运行: node examples/test-api.js
 */

const API_URL = 'http://localhost:3000/api/push';

// 测试数据
const testNotifications = {
  web: {
    title: 'Web 推送通知',
    body: '这是一条来自 Web 的推送通知',
    platform: 'web',
    tokens: [
      // 这里需要替换为实际的 Web Push Subscription JSON 字符串
      JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/...',
        keys: {
          p256dh: '...',
          auth: '...'
        }
      })
    ]
  },
  android: {
    title: 'Android 推送通知',
    body: '这是一条来自 Android 的推送通知',
    platform: 'android',
    tokens: [
      // 这里需要替换为实际的 FCM 设备令牌
      'fcm_device_token_here'
    ]
  },
  ios: {
    title: 'iOS 推送通知',
    body: '这是一条来自 iOS 的推送通知',
    platform: 'ios',
    tokens: [
      // 这里需要替换为实际的 APNs 设备令牌
      'apns_device_token_here'
    ]
  },
  all: {
    title: '全平台推送通知',
    body: '这是一条发送到所有平台的通知',
    platform: 'all',
    tokens: [
      // 混合不同平台的令牌
    ]
  }
};

// 发送推送通知
async function sendNotification(notification) {
  try {
    console.log(`\n发送 ${notification.platform} 推送通知...`);
    const response = await fetch(`${API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notification)
    });

    const data = await response.json();
    console.log('响应:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('错误:', error.message);
    return null;
  }
}

// 获取服务状态
async function getStatus() {
  try {
    const response = await fetch(`${API_URL}/status`);
    const data = await response.json();
    console.log('\n服务状态:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('错误:', error.message);
    return null;
  }
}

// 获取 Web Push 公钥
async function getPublicKey() {
  try {
    const response = await fetch(`${API_URL}/web/public-key`);
    const data = await response.json();
    console.log('\nWeb Push 公钥:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('错误:', error.message);
    return null;
  }
}

// 主函数
async function main() {
  console.log('=== 推送通知 API 测试 ===\n');

  // 检查服务状态
  await getStatus();

  // 获取 Web Push 公钥
  await getPublicKey();

  // 测试发送通知（取消注释以测试）
  // await sendNotification(testNotifications.web);
  // await sendNotification(testNotifications.android);
  // await sendNotification(testNotifications.ios);
  // await sendNotification(testNotifications.all);

  console.log('\n测试完成！');
  console.log('\n提示: 请先配置 .env 文件并替换测试数据中的实际令牌');
}

// 运行测试
if (typeof fetch === 'undefined') {
  console.error('此脚本需要 Node.js 18+ 或安装 node-fetch 包');
  console.log('安装: npm install node-fetch@2');
} else {
  main();
}
