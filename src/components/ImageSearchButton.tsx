"use client";

import React, { useState } from "react";

// 定义强大的搜索引擎列表
const ENGINES = [
  // 1. 本地直接搜 (API模式)
  { id: "saucenao_api", name: "SauceNAO (站内直显)", type: "api" },
  
  // 2. 链接跳转模式 (先上传，再搜链接) - 模仿 4evergr8 的功能
  { 
    id: "google_lens", 
    name: "Google Lens (以图搜图)", 
    type: "url", 
    urlTemplate: "https://lens.google.com/upload?url={url}" 
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
    id: "saucenao_url", 
    name: "SauceNAO (跳转官网)", 
    type: "url", 
    urlTemplate: "https://saucenao.com/search.php?db=999&url={url}" 
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
  const [result, setResult] = useState<any>(null); // 仅用于 API 模式
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState(""); // 显示当前步骤状态
  const [selectedEngine, setSelectedEngine] = useState(ENGINES[0].id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 文件选择处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError("");
    setStatusMsg("");
  };

  // 执行搜索
  const handleSearch = async () => {
    if (!selectedFile) return;
    const engine = ENGINES.find((e) => e.id === selectedEngine);
    if (!engine) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // === 模式 A: 站内 API (SauceNAO) ===
      if (engine.type === "api") {
        setStatusMsg("正在请求 SauceNAO...");
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        const res = await fetch("/api/search", { method: "POST", body: formData });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "搜索出错");
        
        if (data.results && data.results.length > 0) {
          setResult(data.results[0]);
          setStatusMsg("搜索完成！");
        } else {
          setError("未找到相似图片");
        }
        setLoading(false);
      } 
      
      // === 模式 B: 图床链接模式 (Google/Yandex 等) ===
      else if (engine.type === "url" && engine.urlTemplate) {
        setStatusMsg("1/2 正在上传图片生成链接...");
        
        // 1. 先上传图片到我们的 /api/upload 接口
        const uploadForm = new FormData();
        uploadForm.append("file", selectedFile);
        
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || "图片上传失败，无法生成链接");
        }
        
        const imageUrl = uploadData.url;
        setStatusMsg("2/2 正在跳转搜索引擎...");
        
        // 2. 替换模板中的 {url} 并跳转
        const targetUrl = engine.urlTemplate.replace("{url}", encodeURIComponent(imageUrl));
        
        // 延迟一下让用户看到状态
        setTimeout(() => {
          window.open(targetUrl, "_blank");
          setLoading(false);
          setStatusMsg("");
        }, 500);
      }

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

      {/* 状态/错误提示 */}
      {(loading || error || statusMsg) && (
        <div className="mt-3 text-center">
             {loading && <span className="text-blue-500 text-sm animate-pulse">⏳ {statusMsg}</span>}
             {error && <span className="text-red-500 text-sm font-bold">❌ {error}</span>}
        </div>
      )}

      {result && selectedEngine === 'saucenao_api' && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex gap-3 animate-fade-in-up">
          <img src={result.header.thumbnail} className="w-20 h-20 object-cover rounded-md bg-gray-100" />
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">{result.data.title || "未知标题"}</h4>
              <p className="text-xs text-gray-500 truncate">{result.data.member_name || "未知画师"}</p>
            </div>
            {result.data.ext_urls?.[0] && (
              <a href={result.data.ext_urls[0]} target="_blank" rel="noreferrer" className="self-start text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-200">
                查看原图 &rarr;
              </a>
            )}
          </div>
          <div className="text-right">
             <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded">{result.header.similarity}%</span>
          </div>
        </div>
      )}
    </div>
  );
}