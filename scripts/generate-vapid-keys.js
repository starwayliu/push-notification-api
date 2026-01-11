/**
 * 生成 VAPID 密钥的辅助脚本
 * 运行: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('正在生成 VAPID 密钥...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=== VAPID 密钥 ===\n');
console.log('公钥 (VAPID_PUBLIC_KEY):');
console.log(vapidKeys.publicKey);
console.log('\n私钥 (VAPID_PRIVATE_KEY):');
console.log(vapidKeys.privateKey);
console.log('\n=== 配置说明 ===');
console.log('请将以上密钥复制到 .env 文件中:');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:your-email@example.com');
console.log('\n注意: VAPID_SUBJECT 应该是你的邮箱地址，格式为 mailto:your-email@example.com');
