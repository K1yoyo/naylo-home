"use client";

import React, { useState } from "react";

// 定义搜索引擎列表 (仅保留跳转模式)
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
        setStatusMsg("1/2 正在上传图片生成链接...");

        // 1. 上传图片到 /api/upload (使用我们刚才改的 Catbox 图床)
        const uploadForm = new FormData();
        uploadForm.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || "图片上传失败");
        }

        const imageUrl = uploadData.url;
        setStatusMsg("2/2 正在跳转搜索引擎...");

        // 2. 拼接链接并跳转
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
        {/* 文件选择 */}
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

        {/* 引擎选择 */}
        <select
          value={selectedEngine}
          onChange={(e) => setSelectedEngine(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        >
          {ENGINES.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        {/* 搜索按钮 */}
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

      {/* 状态提示 */}
      {(loading || error || statusMsg) && (
        <div className="mt-3 text-center">
             {loading && <span className="text-blue-500 text-sm animate-pulse">⏳ {statusMsg}</span>}
             {error && <span className="text-red-500 text-sm font-bold">❌ {error}</span>}
        </div>
      )}
    </div>
  );
}