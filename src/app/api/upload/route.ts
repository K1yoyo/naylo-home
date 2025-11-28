import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '后端没收到文件' }, { status: 400 });
    }

    // 获取 API Key
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: '服务端未配置 IMGBB_API_KEY' }, { status: 500 });
    }

    console.log(`[Upload] 上传到 ImgBB: ${file.name}`);

    // 构造 ImgBB 需要的数据
    const uploadForm = new FormData();
    uploadForm.append('image', file);
    // 设置过期时间：600秒（10分钟）后自动删除图片
    uploadForm.append('expiration', '600'); 

    // 发送请求
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: uploadForm,
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({ url: result.data.url });
    } else {
      throw new Error(result.error?.message || 'ImgBB 上传失败');
    }

  } catch (error: any) {
    console.error('[Upload Error]', error);
    return NextResponse.json({ error: error.message || '上传接口崩溃' }, { status: 500 });
  }
}