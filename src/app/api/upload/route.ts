import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '后端没收到文件' }, { status: 400 });
    }

    console.log(`[Upload] 开始上传: ${file.name} (${file.size} bytes)`);

    // 1. 构造发给 Telegraph 的数据
    const uploadForm = new FormData();
    // Telegraph 要求的字段名必须是 'file'
    uploadForm.append('file', file, file.name || 'image.jpg');

    // 2. 发送请求 (关键：伪装成浏览器)
    const response = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: uploadForm,
      headers: {
        // 🚨 关键：没有这个 User-Agent，Telegraph 会拒绝 Vercel 的请求
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        // 注意：千万不要手动设置 'Content-Type'，让 fetch 自己生成 boundary
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Upload Error] 图床拒收: ${response.status} - ${text}`);
      throw new Error(`图床服务报错: ${response.status}`);
    }

    // 3. 解析结果
    const result = await response.json();
    console.log('[Upload] 图床返回:', result);

    // Telegraph 成功返回格式: [{ src: '/file/xxx.jpg' }]
    // 失败返回格式: { error: '...' }
    if (Array.isArray(result) && result[0] && result[0].src) {
      return NextResponse.json({ url: `https://telegra.ph${result[0].src}` });
    } 
    
    if (result.error) {
      throw new Error(`图床错误信息: ${result.error}`);
    }

    throw new Error('图床返回了无法识别的数据');

  } catch (error: any) {
    console.error('[Fatal Error]', error);
    return NextResponse.json({ error: error.message || '上传接口内部崩溃' }, { status: 500 });
  }
}