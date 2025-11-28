"use client";

import React, { useState } from "react";
// 引入动画库
import { motion } from "framer-motion";

const ENGINES = [
  {
    id: "google_lens",
    name: "Google Lens",
    type: "url",
    urlTemplate: "https://lens.google.com/upload?url={url}",
  },
  {
    id: "saucenao_url",
    name: "SauceNAO",
    type: "url",
    urlTemplate: "https://saucenao.com/search.php?db=999&url={url}",
  },
  {
    id: "yandex_url",
    name: "Yandex",
    type: "url",
    urlTemplate: "https://yandex.com/images/search?rpt=imageview&url={url}",
  },
  {
    id: "ascii2d_url",
    name: "Ascii2d",
    type: "url",
    urlTemplate: "https://ascii2d.net/search/url/{url}",
  },
  {
    id: "iqdb_url",
    name: "IQDB",
    type: "url",
    urlTemplate: "https://iqdb.org/?url={url}",
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
      setStatusMsg("上传中...");
      const uploadForm = new FormData();
      uploadForm.append("file", selectedFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "上传失败");
      }
      const imageUrl = uploadData.url;
      const targetUrl = engine.urlTemplate.replace(
        "{url}",
        encodeURIComponent(imageUrl)
      );
      setStatusMsg("跳转中...");
      setTimeout(() => {
        window.open(targetUrl, "_blank");
        setLoading(false);
        setStatusMsg("");
      }, 300);
    } catch (err: any) {
      console.error(err);
      setError("失败");
      setLoading(false);
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    // ✨ 修改了这里：纯粹的“从无到有”渐变动画
    <motion.div 
      initial={{ opacity: 0 }}        // 初始：完全看不见 (透明度 0)
      animate={{ opacity: 1 }}        // 结束：完全看得见 (透明度 1)
      transition={{ duration: 0.8, delay: 0.2 }} // 过程：持续 0.8秒，慢慢浮现
      className="w-full group relative overflow-hidden rounded-2xl border transition-all hover:shadow-sm backdrop-blur-md
      bg-white/20 border-white/30 
      dark:bg-black/20 dark:border-white/10
      hover:bg-white/30 dark:hover:bg-black/30"
    >
      
      <div className="flex flex-col sm:flex-row items-center p-3 gap-3">
        
        {/* 左侧图标 */}
        <div className="flex-shrink-0">
           <div className="h-12 w-12 rounded-full flex items-center justify-center border transition-colors
             bg-white/40 border-white/40 text-gray-700
             dark:bg-white/5 dark:border-white/10 dark:text-gray-200">
              <span className="text-xl">🔍</span>
           </div>
        </div>

        {/* 中间控制区 */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-2">
            <label className="relative flex items-center gap-3 cursor-pointer group/label select-none">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                
                {previewUrl ? (
                    <div className="flex items-center gap-3 w-full">
                         <div className="h-8 w-8 rounded-lg overflow-hidden border shadow-sm
                           border-white/40 dark:border-white/20">
                             <img src={previewUrl} className="h-full w-full object-cover" />
                         </div>
                         <span className="text-sm font-medium truncate 
                           text-gray-800 dark:text-gray-200">
                           {selectedFile?.name}
                         </span>
                         <span className="text-xs transition 
                           text-gray-600 hover:text-black 
                           dark:text-gray-500 dark:hover:text-gray-300">
                           (更换)
                         </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 w-full">
                         <span className="text-sm font-bold transition 
                           text-gray-800 group-hover/label:text-black
                           dark:text-gray-200 dark:group-hover/label:text-white">
                           点击上传图片
                         </span>
                         <span className="text-xs transition 
                           text-gray-600 group-hover/label:text-gray-800
                           dark:text-gray-500 dark:group-hover/label:text-gray-400">
                           JPG / PNG
                         </span>
                    </div>
                )}
            </label>

            <div className="flex items-center gap-2">
                <select 
                    value={selectedEngine}
                    onChange={(e) => setSelectedEngine(e.target.value)}
                    className="bg-transparent text-xs cursor-pointer focus:outline-none transition border-none p-0 pr-4 
                      text-gray-600 hover:text-black
                      dark:text-gray-400 dark:hover:text-white"
                >
                     {ENGINES.map(e => (
                       <option key={e.id} value={e.id} className="bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                         {e.name}
                       </option>
                     ))}
                </select>
                
                {(loading || error) && (
                    <span className={`text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400 animate-pulse'}`}>
                        {error || statusMsg}
                    </span>
                )}
            </div>
        </div>

        {/* 右侧按钮 */}
        <button
            onClick={handleSearch}
            disabled={!selectedFile || loading}
            className={`flex-shrink-0 h-10 px-5 rounded-xl font-bold text-sm transition-all flex items-center justify-center border
                ${!selectedFile 
                    ? "bg-black/5 text-gray-400 border-transparent cursor-not-allowed dark:bg-white/5 dark:text-gray-600" 
                    : "shadow-sm active:scale-95 \
                       bg-white/60 border-white/60 hover:bg-white text-gray-800 \
                       dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20 dark:text-white"
                }
            `}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
                "Go"
            )}
        </button>

      </div>
    </motion.div>
  );
}