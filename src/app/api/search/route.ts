import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }

    const apiKey = process.env.SAUCENAO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    const sauceFormData = new FormData();
    sauceFormData.append('file', file);
    sauceFormData.append('api_key', apiKey);
    sauceFormData.append('output_type', '2');
    sauceFormData.append('numres', '3');

    const response = await fetch('https://saucenao.com/search.php', {
      method: 'POST',
      body: sauceFormData,
    });

    if (!response.ok) {
      throw new Error(`SauceNAO Error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: error.message || '搜索失败' }, { status: 500 });
  }
}