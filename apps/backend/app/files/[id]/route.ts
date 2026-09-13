import { NextRequest, NextResponse } from 'next/server';
import { db, crawlDetectedItem } from '@tinhchuan/database';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { isAuthorizedAdmin } from '@/lib/auth';

const BUCKET_NAME = 'legal-documents';

// MinIO Endpoint: trong container dùng minio:9000 (hoặc MINIO_ENDPOINT env), ngoài host dùng 127.0.0.1:9000
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://minio:9000';

const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'minio_admin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || '',
  },
  forcePathStyle: true,
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Kiểm tra quyền xác thực admin
  const isAuthorized = await isAuthorizedAdmin(req);
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
  }

  try {
    // 2. Query crawl_detected_item WHERE id = params.id
    const item = await db.query.crawlDetectedItem.findFirst({
      where: eq(crawlDetectedItem.id, id),
    });

    if (!item || !item.sourceFileUrl) {
      return NextResponse.json(
        { error: 'Document file not found' },
        { status: 404 }
      );
    }

    // 3. Tải stream file từ MinIO nội bộ
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: item.sourceFileUrl,
    });

    const s3Response = await s3Client.send(command);

    if (!s3Response.Body) {
      return NextResponse.json(
        { error: 'File content empty' },
        { status: 404 }
      );
    }

    // Determine Content-Type và file extension
    const isDocx = item.sourceFileUrl.endsWith('.docx');
    const ext = isDocx ? 'docx' : 'pdf';
    const contentType = isDocx
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

    // Làm sạch tên file cho Content-Disposition
    const cleanTitle = (item.title || 'van-ban')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    const asciiFilename = `${cleanTitle || 'van-ban'}.${ext}`;
    const utf8Filename = encodeURIComponent(`${item.title || 'van-ban'}.${ext}`);

    const stream = s3Response.Body.transformToWebStream();

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set(
      'Content-Disposition',
      `inline; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`
    );
    if (s3Response.ContentLength) {
      headers.set('Content-Length', s3Response.ContentLength.toString());
    }

    return new NextResponse(stream as any, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return NextResponse.json(
        { error: 'File object not found in MinIO' },
        { status: 404 }
      );
    }
    console.error('💥 Error in /files/[id] proxy route:', err);
    return NextResponse.json(
      { error: 'Internal Server Error streaming file' },
      { status: 500 }
    );
  }
}
