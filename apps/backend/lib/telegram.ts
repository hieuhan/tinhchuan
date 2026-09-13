import path from 'node:path';
import dns from 'node:dns';
import { config as loadEnv } from 'dotenv';

// Đảm bảo Node.js ưu tiên IPv4 trước IPv6 cho Telegram API trên macOS
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
  loadEnv({ path: path.resolve(process.cwd(), '.env') });
  loadEnv({ path: path.resolve(process.cwd(), '../../.env') });
}

/**
 * Gửi thông báo qua Telegram Bot.
 * Đã bọc try/catch: Lỗi gửi Telegram CHỈ log console.error, KHÔNG throw làm gián đoạn pipeline chính.
 */
export async function sendTelegramNotification(message: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn(
      '⚠️ Không tìm thấy TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong biến môi trường. Bỏ qua gửi thông báo Telegram.'
    );
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    let resData: any;
    let ok = false;
    let status = 200;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      status = response.status;
      resData = await response.json().catch(() => ({}));
      ok = response.ok && resData.ok;
    } catch (fetchErr) {
      // Fallback sang curl nếu Node.js fetch bị IPv6 timeout trên macOS
      const { execFileSync } = require('node:child_process');
      const payload = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      });
      const rawRes = execFileSync('curl', [
        '-s',
        '-X',
        'POST',
        url,
        '-H',
        'Content-Type: application/json',
        '-d',
        payload,
      ]);
      resData = JSON.parse(rawRes.toString());
      ok = resData.ok === true;
    }

    if (!ok) {
      console.error(
        `❌ Lỗi từ Telegram API (HTTP ${status}):`,
        resData.description || JSON.stringify(resData)
      );
    } else {
      console.log('✅ Đã gửi thông báo Telegram thành công.');
    }
  } catch (err: any) {
    console.error('💥 Lỗi kết nối khi gửi Telegram notification:', err.message || err);
  }
}
