"use client";

import React, { useState } from "react";

const ENGINES = [
  {
    id: "google_lens",
    name: "Google Lens (以图搜图)",
    type: "url",
    urlTemplate: "https://lens.google.com/upload?url={url}"
  },
  {
    id: "saucenao_url",
    name: "SauceNAO (跳转官网)",
    type: "url",
    urlTemplate: "https://saucenao.com/search.php?db=999&url={url}"
  },
  {
    id: "yandex_url",
    name: "Yandex (高清大图)",
    type: "url",
    urlTemplate: "https://yandex.com/images/search?rpt=imageview&url={url}"
  },
  {
    id: "ascii2d_url",
    name: "Ascii2d (色调搜索)",
    type: "url",
    urlTemplate: "https://ascii2d.net/search/url/{url}"
  },
  {
    id: "iqdb_url",
    name: "IQDB (多站聚合)",
    type: "url",
    urlTemplate: "https://iqdb.org/?url={url}"
  },
];

export default function ImageSearchButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [selectedEngine, setSelectedEngine] = useState(ENGINES[0].id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 🖼️ 辅助函数：前端压缩图片 (核心黑科技)
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // 1. 如果图片本来就很小 (小于 1MB)，直接放行
      if (file.size < 1024 * 1024) {
        resolve(file);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // 2. 限制最大边长为 1920px (既保证清晰度，又大幅减小体积)
        const MAX_SIZE = 1920; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // 3. 压缩为 JPEG，质量 0.8
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("图片压缩失败"));
        }, "image/jpeg", 0.8);
      };
      img.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
    setStatusMsg("");
  };

  const handleSearch = async () => {
    if (!selectedFile) return;
    const engine = ENGINES.find((e) => e.id === selectedEngine);
    if (!engine) return;

    setLoading(true);
    setError("");

    try {
        setStatusMsg("1/3 正在压缩优化图片...");
        
        // ✨ 第一步：先在浏览器里把图片变小
        const compressedBlob = await compressImage(selectedFile);
        
        setStatusMsg("2/3 正在上传图片...");

        // ✨ 第二步：上传压缩后的小图
        const uploadForm = new FormData();
        // 注意：这里必须给 Blob 一个文件名，否则后端可能不认
        uploadForm.append("file", compressedBlob, "compressed_image.jpg");

        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        
        // 尝试解析错误信息
        let uploadData;
        try {
            uploadData = await uploadRes.json();
        } catch (e) {
            throw new Error(`上传接口返回了非 JSON 数据 (${uploadRes.status})`);
        }

        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || `上传失败: ${uploadRes.status}`);
        }

        const imageUrl = uploadData.url;
        setStatusMsg("3/3 正在跳转...");

        // ✨ 第三步：跳转
        const targetUrl = engine.urlTemplate.replace("{url}", encodeURIComponent(imageUrl));

        setTimeout(() => {
          window.open(targetUrl, "_blank");
          setLoading(false);
          setStatusMsg("");
        }, 500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "请求失败");
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg bg-white/50 dark:bg-gray-800 transition min-h-[44px]">
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-8 w-8 object-cover rounded-md" />
          ) : (
            <span className="text-xl">📁</span>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
            {selectedFile ? selectedFile.name : "选择图片"}
          </span>
        </label>

        <select
          value={selectedEngine}
          onChange={(e) => setSelectedEngine(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        >
          {ENGINES.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <button
          onClick={handleSearch}
          disabled={!selectedFile || loading}
          className={`px-6 py-2 rounded-lg text-white font-bold text-sm transition shadow-lg min-h-[44px] whitespace-nowrap
            ${!selectedFile
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 active:scale-95"
            }`}
        >
          {loading ? "处理中..." : "Go 🚀"}
        </button>
      </div>

      {(loading || error || statusMsg) && (
        <div className="mt-3 text-center">
             {loading && <span className="text-blue-500 text-sm animate-pulse">⏳ {statusMsg}</span>}
             {error && <span className="text-red-500 text-sm font-bold">❌ {error}</span>}
        </div>
      )}
    </div>
  );
}