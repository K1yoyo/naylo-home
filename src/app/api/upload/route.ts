// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
    }

    // 构造发送给 Telegraph 的数据
    const uploadData = new FormData();
    uploadData.append('file', file);

    // 发送给 Telegraph 
    // 这里的 upload.telegra.ph 是官方接口，Vercel 后端访问通常不会跨域
    const response = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: uploadData,
    });

    if (!response.ok) {
      throw new Error('上传图床失败');
    }

    const result = await response.json();

    // Telegraph 返回格式: [{ src: '/file/xxx.jpg' }]
    if (result && result[0] && result[0].src) {
      const fullUrl = `https://telegra.ph${result[0].src}`;
      return NextResponse.json({ url: fullUrl });
    } else {
      throw new Error('图床返回格式异常');
    }

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || '上传失败' }, { status: 500 });
  }
}