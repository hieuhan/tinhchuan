import { scanWatchSources } from './scan-watch-sources';
import { classifyDetectedItems } from './classify-detected-items';
import { extractDetectedItemContent } from './extract-detected-item-content';

/**
 * Pipeline chạy tuần tự 3 giai đoạn của AI Content Pipeline (Stage 1 -> Stage 2 -> Stage 3)
 */
export async function runPipeline() {
  console.log(
    `=============================================================================`
  );
  console.log(
    `[${new Date().toISOString()}] ⚡ BẮT ĐẦU CHẠY AI CONTENT PIPELINE (3 GIAI ĐOẠN)`
  );
  console.log(
    `=============================================================================\n`
  );

  // Giai đoạn 1: Scan phát hiện văn bản mới từ các nguồn theo dõi
  try {
    console.log('--- [1/3] GIAI ĐOẠN 1: SCAN PHÁT HIỆN VĂN BẢN MỚI ---');
    await scanWatchSources();
  } catch (error: any) {
    console.error(
      '❌ Lỗi ở Giai đoạn 1 (Scan):',
      error?.message || String(error)
    );
    console.log('   -> Bỏ qua lỗi Scan, tiếp tục chuyển sang Giai đoạn 2...\n');
  }

  // Giai đoạn 2: Phân loại AI (Relevant / Not Relevant)
  try {
    console.log('\n--- [2/3] GIAI ĐOẠN 2: PHÂN LOẠI VĂN BẢN BẰNG AI ---');
    await classifyDetectedItems();
  } catch (error: any) {
    console.error(
      '❌ Lỗi ở Giai đoạn 2 (Classify):',
      error?.message || String(error)
    );
    console.log('   -> Bỏ qua lỗi Classify, tiếp tục chuyển sang Giai đoạn 3...\n');
  }

  // Giai đoạn 3: Tải file, lưu MinIO & Trích xuất nội dung text layer
  try {
    console.log('\n--- [3/3] GIAI ĐOẠN 3: TẢI FILE, LƯU MINIO & TRÍCH XUẤT NỘI DUNG ---');
    await extractDetectedItemContent();
  } catch (error: any) {
    console.error(
      '❌ Lỗi ở Giai đoạn 3 (Extract):',
      error?.message || String(error)
    );
  }

  console.log(
    `\n=============================================================================`
  );
  console.log(
    `[${new Date().toISOString()}] 🎉 HOÀN TẤT TOÀN BỘ AI CONTENT PIPELINE`
  );
  console.log(
    `=============================================================================\n`
  );
}

if (require.main === module) {
  runPipeline()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('💥 Lỗi không xác định khi chạy Pipeline:', err);
      process.exit(1);
    });
}
