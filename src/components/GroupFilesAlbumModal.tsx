import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  File, 
  Image as ImageIcon, 
  Folder, 
  Cpu, 
  Check, 
  Loader2, 
  MoreVertical,
  ChevronRight,
  Download,
  Sparkles,
  Send,
  ArrowRight,
  Bot,
  Database,
  ShieldCheck
} from 'lucide-react';

interface GroupFilesAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'files' | 'album';
  /** 内容管理：控制整理完成后是否出现「同步群知识库」等能力 */
  hasContentManagement?: boolean;
  /** 文件管理：控制是否显示「AI 智能整理」入口 */
  hasFileManagement?: boolean;
}

type AIPhase = 'idle' | 'scanning' | 'proposed' | 'executing' | 'finished';

const GroupFilesAlbumModal: React.FC<GroupFilesAlbumModalProps> = ({ 
  isOpen, 
  onClose, 
  type: initialType,
  hasContentManagement = false,
  hasFileManagement = false
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'album'>(initialType);
  const [phase, setPhase] = useState<AIPhase>('idle');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiHistory, setAIHistory] = useState<{ role: 'ai' | 'user', content: string, isKBAction?: boolean, isRenameAction?: boolean }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSyncingKB, setIsSyncingKB] = useState(false);
  const [isKBSynced, setIsKBSynced] = useState(false);
  const [syncedFolders, setSyncedFolders] = useState<Set<string>>(new Set());
  const [selectedKBFolders, setSelectedKBFolders] = useState<Set<string>>(new Set(['技术文档', '会议纪要', '烹饪成果', '户外装备']));
  const [executingLabel, setExecutingLabel] = useState('正在重塑文件结构...');
  const [executingSub, setExecutingSub] = useState('AI 正在为 12 个文档创建引用关系');
  
  const [files, setFiles] = useState([
    { id: 1, name: '2024-03-户外徒步方案.pdf', size: '2.4 MB', time: '2小时前', icon: <FileText className="text-red-500" /> },
    { id: 2, name: '装备采购清算-0315.xlsx', size: '1.1 MB', time: '5小时前', icon: <File className="text-green-600" /> },
    { id: 3, name: 'IMG_8829.jpg', size: '4.5 MB', time: '昨天', icon: <ImageIcon className="text-blue-500" /> },
    { id: 4, name: 'IMG_8830.jpg', size: '3.8 MB', time: '昨天', icon: <ImageIcon className="text-blue-500" /> },
    { id: 5, name: '线路草图.png', size: '800 KB', time: '前天', icon: <ImageIcon className="text-blue-500" /> },
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiHistory]);

  if (!isOpen) return null;

  const handleStartAI = () => {
    setShowAIPanel(true);
    setPhase('scanning');
    
    setTimeout(() => {
      setPhase('proposed');
      setAIHistory([
        { 
          role: 'ai', 
          content: activeTab === 'files' 
            ? '群主，已扫描到 50 个未归类文件。🦐 建议方案：\n1. 建立 [技术文档] 移动 12 个 PDF\n2. 建立 [会议纪要] 移动 5 个文档\n3. 其余文件移动至 [其他]'
            : '群主，我已识别 128 张图片。🦐 建议按内容归类：\n- 烹饪成果 (22张)\n- 户外装备 (45张)\n- 群友合营 (12张)\n- 表情包 (49张)'
        }
      ]);
    }, 1500);
  };

  const handleExecute = () => {
    setPhase('executing');
    setExecutingLabel('正在智能整理文件...');
    setExecutingSub('AI 正在根据语义特征为 50 个文件归类');
    
    setTimeout(() => {
      setPhase('finished');
      setAIHistory(prev => [...prev, { role: 'ai', content: '✅ 整理引擎执行完毕。所有文件已按方案安全归位，群主请查阅！' }]);
      
      // Step 4: After a short delay, propose KB sync
      setTimeout(() => {
         setAIHistory(prev => [...prev, { 
           role: 'ai', 
           content: '🤖 整理引擎执行完毕标记，文件已归位！\n\n我发现部分文件命名较为随意，为了便于后续检索，需要我为您进行**批量重命名**吗？',
           isRenameAction: true 
         }]);
      }, 1000);
    }, 2500);
  };

  const handleSyncKB = () => {
    setIsSyncingKB(true);
    setTimeout(() => {
      setIsSyncingKB(false);
      setIsKBSynced(true);
      // Update synced folders set
      setSyncedFolders(new Set(Array.from(selectedKBFolders)));
      
      setAIHistory(prev => [...prev, { 
        role: 'ai', 
        content: `✅ 同步成功！已为 ${selectedKBFolders.size} 个分类下的核心资料建立知识索引。群友现在可以在聊天中 @群龙虾 提问相关内容了。` 
      }]);
    }, 2000);
  };

  const handleRenameConfirm = () => {
    setPhase('executing');
    setExecutingLabel('正在批量重命名...');
    setExecutingSub('AI 正在根据上传者与日期自动修复文件名');
    
    setTimeout(() => {
      handleBulkRename();
      setPhase('finished');
      setAIHistory((prev) => [
        ...prev,
        hasContentManagement
          ? {
              role: 'ai',
              content:
                '✅ 重命名执行完毕！文件名已统一格式：`日期-上传人-原名`。\n\n最后一步：是否需要将本次整理的内容同步至**【群知识库】**以供后续提问检索？您可以在下方选择需要同步的分类。',
              isKBAction: true,
            }
          : {
              role: 'ai',
              content:
                '✅ 重命名执行完毕！文件名已统一格式：`日期-上传人-原名`。\n\n本次群文件智能整理已全部完成。🦐',
            },
      ]);
    }, 2000);
  };

  const handleAdjust = () => {
    if (!inputText.trim()) return;
    const userMsg = inputText;
    setInputText('');
    setAIHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    setPhase('scanning'); // Simulate thinking
    setTimeout(() => {
      setPhase('proposed');
      const response = userMsg.includes('旧') 
        ? '已收到指令，群主！🦐 正在更新方案：将 2024 年前的所有文件额外归入 [历史存档] 文件夹。'
        : '好的群主，已按照您的建议调整方案。预览已更新。';
      setAIHistory(prev => [...prev, { role: 'ai', content: response }]);
    }, 1000);
  };

  const handleBulkRename = () => {
    setFiles(prev => prev.map(f => ({
      ...f,
      name: `2024-04-18-摄影小马-${f.name}`
    })));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-mac-fade" onClick={onClose} />
      
      <div className={`relative w-full ${showAIPanel ? 'max-w-[1100px]' : 'max-w-[800px]'} h-[600px] bg-white rounded-2xl shadow-[0_32px_96px_rgba(0,0,0,0.3)] border border-white/50 overflow-hidden flex flex-col transition-all duration-500 animate-mac-fade`}>
        {/* Main Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left: File/Album Viewer */}
          <div className="flex-1 flex flex-col border-r border-gray-100 bg-white relative">
             {/* Header */}
             <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50">
               <div className="flex bg-gray-200/50 rounded-lg p-1">
                 <button onClick={() => { setActiveTab('files'); setPhase('idle'); setShowAIPanel(false); setIsKBSynced(false); }} className={`px-6 py-1.5 text-[13px] font-bold rounded-md transition-all ${activeTab === 'files' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>群文件</button>
                 <button onClick={() => { setActiveTab('album'); setPhase('idle'); setShowAIPanel(false); setIsKBSynced(false); }} className={`px-6 py-1.5 text-[13px] font-bold rounded-md transition-all ${activeTab === 'album' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>群相册</button>
               </div>
               
               <div className="flex items-center gap-4">
                 {hasFileManagement && (
                 <button 
                   onClick={handleStartAI}
                   disabled={phase !== 'idle'}
                   className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-black transition-all shadow-sm ${
                     phase !== 'idle' 
                       ? 'bg-blue-50 text-blue-400 border border-blue-100' 
                       : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-200 hover:scale-105 active:scale-95'
                   }`}
                 >
                   <Sparkles size={14} className={phase === 'scanning' ? 'animate-pulse' : ''} />
                   AI 智能整理
                 </button>
                  )}
                 <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
               </div>
             </div>

             {/* Toolbar */}
             <div className="h-12 border-b border-gray-50 flex items-center justify-between px-6">
                <div className="flex gap-4">
                   <button className="text-[12px] text-gray-400 hover:text-blue-500 flex items-center gap-1"><Search size={14}/> 搜索</button>
                   <button className="text-[12px] text-gray-400 hover:text-blue-500 flex items-center gap-1"><Download size={14}/> 批量下载</button>
                </div>
                <p className="text-[11px] text-gray-400 font-bold">{activeTab === 'files' ? '共 50 个文件' : '共 128 张图片'}</p>
             </div>

             {/* List View */}
             <div className="flex-1 overflow-y-auto p-4 relative">
                {activeTab === 'files' ? (
                  <div className="space-y-1">
                    {phase === 'finished' ? (
                       <div className="space-y-4 animate-mac-fade">
                          <div className="grid grid-cols-3 gap-4">
                             {['技术文档', '会议纪要', '其他'].map(folder => (
                                <div key={folder} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center gap-2 group cursor-pointer hover:bg-blue-50 transition relative">
                                   {syncedFolders.has(folder) && (
                                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-[8px] font-bold shadow-sm animate-mac-fade">
                                         <ShieldCheck size={10} /> 已入库
                                      </div>
                                   )}
                                   <Folder size={48} className="text-blue-400" />
                                   <span className="text-[12px] font-bold text-gray-700">{folder}</span>
                                </div>
                             ))}
                          </div>
                          <div className="bg-gray-50/50 rounded-xl p-2 mt-4">
                             {files.slice(0, 3).map((f, i) => (
                               <div key={i} className={`flex items-center gap-3 p-3 bg-white rounded-lg mb-1 shadow-sm border-l-2 border-blue-500 relative group`}>
                                  {syncedFolders.has('技术文档') && (
                                     <Sparkles size={12} className="absolute top-2 right-2 text-blue-500 opacity-60 group-hover:opacity-100 transition animate-mac-fade" />
                                  )}
                                  <div className="w-8 h-8 flex items-center justify-center shrink-0">{f.icon}</div>
                                  <div className="flex-1 min-w-0">
                                     <div className="text-[13px] font-medium text-gray-900 flex items-center gap-2">{f.name} <ChevronRight size={12} className="text-gray-300" /> <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 rounded">已移至技术文档</span></div>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    ) : (
                      files.map((f, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group transition ${phase === 'executing' ? 'animate-pulse bg-blue-50/50' : ''}`}>
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg group-hover:bg-white shrink-0 shadow-sm transition-all">{f.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium text-gray-900 truncate tracking-tight">{f.name}</div>
                            <div className="text-[11px] text-gray-400 flex items-center gap-4"><span>{f.size}</span><span>{f.time}</span></div>
                          </div>
                          <MoreVertical size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 cursor-pointer" />
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                     {phase === 'finished' ? (
                       ['烹饪成果', '户外装备', '群友合营', '表情包'].map(tag => (
                          <div key={tag} className="flex flex-col gap-2 animate-mac-fade relative group">
                             {syncedFolders.has(tag) && (
                                <div className="absolute top-1 right-1 z-10 p-1 bg-white rounded-full shadow-md text-blue-500 animate-mac-fade">
                                   <ShieldCheck size={14} />
                                </div>
                             )}
                             <div className="aspect-square bg-gray-100 rounded-xl border-4 border-white shadow-sm overflow-hidden relative group cursor-pointer">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tag}`} className="w-full h-full object-cover opacity-50 transition group-hover:scale-105" alt=""/>
                               <div className="absolute inset-0 flex items-center justify-center flex-col gap-1"><span className="text-2xl">📁</span><span className="text-[11px] font-black text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-md">{tag}</span></div>
                             </div>
                         </div>
                       ))
                     ) : (
                       [1,2,3,4,5,6,7,8].map(i => (
                         <div key={i} className={`aspect-square bg-gray-100 rounded-lg border border-gray-50 overflow-hidden relative group cursor-pointer shadow-sm ${phase === 'executing' ? 'animate-pulse border-blue-400 ring-2 ring-blue-100' : ''}`}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} className="w-full h-full object-cover" alt=""/>
                         </div>
                       ))
                     )}
                  </div>
                )}
             </div>
          </div>

          {/* Right: AI Assistant Side Panel */}
          {showAIPanel && (
            <div className="w-[350px] bg-gray-50/80 backdrop-blur-xl flex flex-col animate-mac-slide-in shrink-0 relative border-l border-gray-100/50 shadow-[-8px_0_32px_rgba(0,0,0,0.02)]">
               {/* Side Panel Header */}
               <div className="h-14 border-b border-gray-100 flex items-center justify-between px-5 shrink-0 bg-white/50">
                  <div className="flex items-center gap-2">
                     <div className="w-7 h-7 bg-lobster-orange rounded-full flex items-center justify-center text-[14px] shadow-sm transform hover:scale-110 transition cursor-default">🦞</div>
                     <span className="text-[13px] font-black text-gray-800 tracking-tight">群龙虾</span>
                  </div>
                  <button onClick={() => { setShowAIPanel(false); setPhase('idle'); setIsKBSynced(false); }} className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded"><ChevronRight size={18} /></button>
               </div>

               {/* AI Dialogue Area */}
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {phase === 'scanning' && (
                    <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm animate-mac-fade">
                       <div className="flex items-center gap-3 mb-4">
                          <Loader2 size={16} className="text-blue-500 animate-spin" />
                          <span className="text-[13px] font-black text-blue-600">正在智能扫描...</span>
                       </div>
                       <div className="space-y-3">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-2/3 animate-mac-progress"></div></div>
                          <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider"><span>分析内容特征</span><span>67%</span></div>
                       </div>
                    </div>
                  )}

                  {aiHistory.map((h, i) => (
                    <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'} animate-mac-fade`}>
                       <div className={`max-w-[90%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm border ${
                         h.role === 'user' 
                           ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                           : 'bg-white text-gray-800 border-gray-100 rounded-tl-none font-medium'
                       }`}>
                          <div className="whitespace-pre-wrap">{h.role === 'ai' && <Bot size={14} className="inline mr-2 text-lobster-orange" />}{h.content}</div>
                          
                          {h.isRenameAction && i === aiHistory.length - 1 && phase === 'finished' && (
                             <div className="flex gap-2 pt-4 mt-2 border-t border-gray-50 flex-col">
                                <button 
                                  onClick={handleRenameConfirm}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-[12px] font-black shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                   需要批量重命名
                                </button>
                                <button 
                                  onClick={() =>
                                    setAIHistory((prev) =>
                                      hasContentManagement
                                        ? [
                                            ...prev,
                                            { role: 'user', content: '不需要，保持原名' },
                                            {
                                              role: 'ai',
                                              content:
                                                '好的，保持原文件名。🦐 \n\n最后一步：是否需要将本次整理的内容一键同步至**【群知识库】**构建索引？',
                                              isKBAction: true,
                                            },
                                          ]
                                        : [
                                            ...prev,
                                            { role: 'user', content: '不需要，保持原名' },
                                            {
                                              role: 'ai',
                                              content: '好的，保持原文件名。🦐 本次群文件智能整理已全部完成。',
                                            },
                                          ]
                                    )
                                  }
                                  className="w-full bg-white hover:bg-gray-50 text-gray-400 py-2 rounded-xl text-[12px] font-bold border border-gray-100 transition-all font-pingfang"
                                >
                                   不需要，保持原名
                                </button>
                             </div>
                          )}

                          {hasContentManagement && h.isKBAction && !isKBSynced && i === aiHistory.length - 1 && phase === 'finished' && (
                             <div className="flex gap-2 pt-4 mt-2 border-t border-gray-50 flex-col animate-mac-fade">
                                <div className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100">
                                   <div className="text-[11px] font-bold text-gray-400 mb-2 flex justify-between items-center">
                                      <span>选择同步分类 ({selectedKBFolders.size})</span>
                                      <Bot size={12} />
                                   </div>
                                   <div className="grid grid-cols-1 gap-2">
                                      {Array.from(new Set(['技术文档', '会议纪要', '烹饪成果', '户外装备'])).map(folder => (
                                         <label key={folder} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors group">
                                            <input 
                                              type="checkbox" 
                                              checked={selectedKBFolders.has(folder)}
                                              onChange={() => {
                                                const next = new Set(selectedKBFolders);
                                                if (next.has(folder)) next.delete(folder);
                                                else next.add(folder);
                                                setSelectedKBFolders(next);
                                              }}
                                              className="rounded text-blue-500"
                                            />
                                            <span className="text-[12px] text-gray-600 group-hover:text-blue-600 transition-colors uppercase font-bold tracking-tight">{folder}</span>
                                         </label>
                                      ))}
                                   </div>
                                </div>
                                <div className="flex gap-2 flex-col">
                                   <button 
                                     onClick={handleSyncKB}
                                     disabled={isSyncingKB || selectedKBFolders.size === 0}
                                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-[12px] font-black shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                   >
                                      {isSyncingKB ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                                      {isSyncingKB ? '正在向量化入库...' : `✨ 同步选中的 ${selectedKBFolders.size} 个分类`}
                                   </button>
                                   <button 
                                     onClick={() => setAIHistory(prev => [...prev, {role: 'user', content: '不需要，直接结束'}, {role: 'ai', content: '好的。本次群文件智能整理已全部完成。🦐'}])}
                                     className="w-full bg-white hover:bg-gray-50 text-gray-400 py-2 rounded-xl text-[12px] font-bold border border-gray-100 transition-all"
                                   >
                                      不需要，直接结束
                                   </button>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                  ))}

                  {phase === 'proposed' && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 shadow-md animate-mac-fade space-y-3">
                       <div className="flex items-center gap-2 text-[12px] font-black text-blue-600">
                          <Check size={16} /> 方案已就绪
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/60 p-2 rounded-lg border border-white/50 flex flex-col">
                             <span className="text-[10px] text-gray-400 font-bold uppercase">移动文件</span>
                             <span className="text-[16px] font-black text-blue-600 tracking-tighter">50 <span className="text-[11px]">项</span></span>
                          </div>
                          <div className="bg-white/60 p-2 rounded-lg border border-white/50 flex flex-col">
                             <span className="text-[10px] text-gray-400 font-bold uppercase">新建分类</span>
                             <span className="text-[16px] font-black text-blue-600 tracking-tighter">3 <span className="text-[11px]">类</span></span>
                          </div>
                       </div>
                       <button 
                         onClick={handleExecute}
                         className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-[13px] font-black shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                       >
                          确认并立刻执行 <ArrowRight size={14} />
                       </button>
                    </div>
                  )}

                  {phase === 'executing' && (
                    <div className="flex flex-col items-center justify-center p-8 text-center animate-mac-fade">
                       <div className="relative mb-4">
                          <Cpu size={48} className="text-blue-500 animate-spin" />
                          <Sparkles size={20} className="absolute -top-1 -right-1 text-amber-400 animate-bounce" />
                       </div>
                       <p className="text-[13px] font-black text-gray-800">{executingLabel}</p>
                       <p className="text-[11px] text-gray-400 mt-1">{executingSub}</p>
                    </div>
                  )}
               </div>

               {/* AI Dialogue Input (Sticky Bottom) */}
               <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                  <div className="relative flex items-center bg-gray-100 rounded-xl px-3 py-2 border border-transparent focus-within:border-blue-200 transition-all">
                     <textarea 
                       value={inputText}
                       onChange={e => setInputText(e.target.value)}
                       placeholder="告诉 AI 您的调整建议..."
                       className="flex-1 max-h-20 bg-transparent border-none outline-none text-[12px] resize-none py-0.5 leading-relaxed placeholder:text-gray-400"
                       onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAdjust())}
                       disabled={phase === 'executing' || phase === 'scanning' || isSyncingKB}
                     />
                     <button 
                       onClick={handleAdjust}
                       disabled={!inputText.trim() || isSyncingKB}
                       className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 transition"
                     >
                       <Send size={16} />
                     </button>
                  </div>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar text-gray-400 italic text-[9px] px-1 select-none">
                     交互指令由群龙虾驱动
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupFilesAlbumModal;
