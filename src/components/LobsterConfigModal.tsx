import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Sparkles, 
  UserPlus, 
  Send, 
  Loader2, 
  Calendar, 
  Database, 
  Folder, 
  Lock,
  Info,
  Check as CheckIcon,
  Brain,
  FileText,
  Cpu,
  History,
  Terminal,
  CheckCircle2
} from 'lucide-react';

// --- Reusable UI Components ---

const Switch: React.FC<{ enabled: boolean; onToggle: () => void; disabled?: boolean }> = ({ enabled, onToggle, disabled }) => (
  <button 
    onClick={disabled ? undefined : onToggle}
    className={`w-10 h-5 rounded-full transition-all duration-300 relative shrink-0 ${
      enabled ? 'bg-[#0099FF] shadow-[0_0_10px_rgba(0,153,255,0.3)]' : 'bg-gray-200'
    } ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[0.5]' : ''}`}
    disabled={disabled}
  >
    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
);

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: () => void; disabled?: boolean }> = ({ label, checked, onChange, disabled }) => (
  <label className={`flex items-center gap-2 group ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
    <div 
      onClick={disabled ? undefined : onChange}
      className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
        checked ? 'bg-[#0099FF] border-[#0099FF]' : 'bg-white border-gray-300 group-hover:border-blue-400'
      } ${disabled ? 'grayscale-[0.5]' : ''}`}
    >
      {checked && <CheckIcon size={12} className="text-white" strokeWidth={3} />}
    </div>
    <span className={`text-[12px] transition-colors ${checked ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{label}</span>
  </label>
);

const FeatureToggleItem: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, enabled, onToggle, disabled, children }) => (
  <div className={`space-y-3 ${disabled ? 'pointer-events-none' : ''}`}>
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          enabled ? 'bg-blue-50 text-[#0099FF] shadow-sm' : 'bg-gray-50 text-gray-400'
        }`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-gray-800 tracking-tight">{title}</div>
          <div className="text-[11px] text-gray-400 truncate w-full max-w-[200px]">{subtitle}</div>
        </div>
      </div>
      <Switch enabled={enabled} onToggle={onToggle} disabled={disabled} />
    </div>
    {enabled && children && (
      <div className="ml-12 p-3 bg-gray-50/80 rounded-xl border border-gray-100/50 space-y-3 animate-mac-fade">
        {children}
      </div>
    )}
  </div>
);

// --- Main Component ---

interface LobsterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: { report: boolean; contentManagement: boolean; fileManagement: boolean; welcomeGuide: boolean }) => void;
  onDisable?: () => void;
  isEdit?: boolean;
  initialConfig?: { report: boolean; contentManagement: boolean; fileManagement: boolean; welcomeGuide: boolean };
  isReadOnly?: boolean;
}

type TabType = 'basic' | 'personality' | 'scripts';
type DocType = 'Soul.md' | 'Memory.md' | 'Group.md';

const LobsterConfigModal: React.FC<LobsterConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onDisable, 
  isEdit = false,
  initialConfig,
  isReadOnly = false
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [activeDoc, setActiveDoc] = useState<DocType>('Soul.md');
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);

  // Stats for the branding area
  const [configs, setConfigs] = useState({
    report: true,
    contentManagement: true,
    fileManagement: false,
    welcomeGuide: false
  });

  // Sync with initialConfig when modal opens
  useEffect(() => {
    if (isOpen && initialConfig) {
      setConfigs(initialConfig);
    }
  }, [isOpen, initialConfig]);
  
  const [reportSettings, setReportSettings] = useState({
    freq: ['日报'],
    time: '09:00',
    selectedDay: '周一'
  });

  const [docs, setDocs] = useState<Record<DocType, string>>({
    'Soul.md': '',
    'Memory.md': '# 群记忆库\n1. 历史项目文档已同步\n2. 群主偏好：深度分析\n3. 核心关键词：效率、AI、B端产品',
    'Group.md': '# 兴趣爱好小组数据\n- 活动频率：每月一次\n- 核心讨论：徒步、装备、摄影'
  });

  const hasAdvancedFeatures =
    configs.report || configs.contentManagement || configs.fileManagement || configs.welcomeGuide;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isReadOnly) {
      onClose();
      return;
    }
    setLoading(true);
    setTimeout(() => {
      onConfirm(configs);
      setLoading(false);
    }, 1500);
  };

  const toggleFreq = (val: string) => {
    setReportSettings(prev => ({
      ...prev,
      freq: prev.freq.includes(val) 
        ? prev.freq.filter(f => f !== val) 
        : [...prev.freq, val]
    }));
  };

  const handleAiOptimize = () => {
    setIsAiOptimizing(true);
    setTimeout(() => {
      setDocs(prev => {
        const currentText = prev[activeDoc];
        let newText = '';
        if (!currentText.trim() || currentText === '') {
          newText = activeDoc === 'Soul.md' 
            ? '## 专家人格设定\n- 身份：资深产品经理/行业分析师\n- 语气：专业感、有前瞻性、客观中立\n- 核心逻辑：关注数据背后的趋势，剔除口水话\n- 口头禅：从底层逻辑来看、核心痛点在于...' 
            : '## 默认初始化文档\n正在构建结构化的群组上下文...';
        } else {
          newText = `## 优化后的 GroupClaw 文档\n${currentText}\n\n[GroupClaw AI 优化：优化了论证深度，精简了冗余表达，强化了行业专业术语的使用。]`;
        }
        return { ...prev, [activeDoc]: newText };
      });
      setIsAiOptimizing(false);
    }, 1200);
  };

  const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-mac-fade" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-[800px] bg-white/95 rounded-3xl shadow-[0_32px_96px_rgba(0,0,0,0.3)] border border-white/50 overflow-hidden flex animate-mac-fade h-[640px]">
        
        {/* Left: Branding Area */}
        <div className="w-[240px] bg-gradient-to-b from-blue-50/50 to-white flex flex-col items-center justify-center p-8 border-r border-gray-100 select-none shrink-0">
          <div className="relative group mb-8">
             <div className="w-24 h-24 rounded-[32px] bg-lobster-orange flex items-center justify-center shadow-2xl transform transition-all duration-500 border-4 border-white group-hover:rotate-6 group-hover:scale-110">
                <span className="text-5xl">🦞</span>
             </div>
             <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-4 border-white shadow-sm"></div>
          </div>
          
          <div className="text-center space-y-2 mb-10">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">群龙虾</h3>
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">GroupClaw</p>
            <div className="flex items-center justify-center gap-2">
              <span className="bg-blue-50 text-[#0099FF] px-2 py-0.5 rounded-lg text-[11px] font-black border border-blue-100 flex items-center gap-1 uppercase">
                <Bot size={12} /> AI 助手
              </span>
            </div>
          </div>

          <div className="w-full space-y-4">
             <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold group cursor-help transition-colors hover:text-blue-500">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                Llama-3 后端驱动
             </div>
             <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold group">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                实时监控在线
             </div>
          </div>

          <div className="mt-auto pt-6 w-full">
            <div className="p-3 bg-white/50 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5 group cursor-pointer hover:border-blue-200 transition-all">
               <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Lock size={16} />
               </div>
               <div className="min-w-0">
                  <div className="text-[10px] font-black text-gray-800">隐私沙盒</div>
                  <div className="text-[9px] text-gray-400 truncate tracking-tight">Privacy Sandbox v2</div>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Settings Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Tabs Bar */}
          <div className="px-8 pt-8 flex items-end justify-between border-b border-gray-100">
            <div className="flex gap-8">
              {(['basic', 'personality', 'scripts'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[14px] font-bold transition-all relative ${
                    activeTab === tab ? 'text-[#0099FF]' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab === 'basic' && '基础配置'}
                  {tab === 'personality' && '人格与记忆'}
                  {tab === 'scripts' && '高级脚本'}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0099FF] rounded-t-full animate-mac-fade" />
                  )}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="mb-3 text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          {/* Tab Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-hide bg-gray-50/20">
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-mac-fade">
                <div className="flex flex-col gap-3 mb-6">
                  {/* Perspective Notice Banner */}
                  {isReadOnly && (
                    <div className="flex items-center gap-2.5 rounded-lg bg-gray-50/50 px-3 py-2.5 animate-mac-fade">
                      <Lock size={18} className="text-amber-600 shrink-0" aria-hidden strokeWidth={2.25} />
                      <p className="text-xs text-gray-500 leading-snug">
                        仅管理员可编辑群龙虾的配置项
                      </p>
                    </div>
                  )}

                  {/* Mode Alert：未启用龙虾时不展示；启用后至少一项能力为绿条，否则为蓝条说明 */}
                  {isEdit && !hasAdvancedFeatures && (
                    <div className="flex items-center gap-2.5 rounded-lg bg-gray-50/50 px-3 py-2.5 animate-mac-fade">
                      <Info size={18} className="text-[#0099FF] shrink-0" aria-hidden strokeWidth={2.25} />
                      <p className="text-xs text-gray-500 leading-snug">
                        由于未开启任何高级功能，群龙虾将仅作为基础聊天机器人在群内工作。
                      </p>
                    </div>
                  )}
                  {hasAdvancedFeatures && (
                    <div className="flex items-center gap-2.5 rounded-lg bg-gray-50/50 px-3 py-2.5 animate-mac-fade">
                      <CheckCircle2 size={18} className="text-green-500 shrink-0" aria-hidden strokeWidth={2.25} />
                      <p className="text-xs text-gray-500 leading-snug">
                        已开启高级协作模式，群龙虾将根据下方配置主动介入群聊协助管理。
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <FeatureToggleItem 
                    icon={Calendar}
                    title="定时群报"
                    subtitle="自动生成群聊精华日报或周报"
                    enabled={configs.report}
                    onToggle={() => setConfigs(prev => ({ ...prev, report: !prev.report }))}
                    disabled={isReadOnly}
                  >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-gray-400 font-medium">推送周期</span>
                          <div className="flex gap-4">
                              <Checkbox label="日报" checked={reportSettings.freq.includes('日报')} onChange={() => toggleFreq('日报')} disabled={isReadOnly} />
                              <Checkbox label="周报" checked={reportSettings.freq.includes('周报')} onChange={() => toggleFreq('周报')} disabled={isReadOnly} />
                          </div>
                        </div>

                        {reportSettings.freq.includes('周报') && (
                          <div className="space-y-3 pt-2 border-t border-gray-200/50 animate-mac-fade">
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-gray-400 font-medium">周报推送日</span>
                              <div className="flex gap-1.5">
                                {WEEK_DAYS.map(day => (
                                  <button
                                    key={day}
                                    onClick={isReadOnly ? undefined : () => setReportSettings(prev => ({ ...prev, selectedDay: `周${day}` }))}
                                    className={`w-7 h-7 rounded-full text-[11px] font-black transition-all flex items-center justify-center border ${
                                      reportSettings.selectedDay === `周${day}`
                                        ? 'bg-[#0099FF] text-white border-[#0099FF] shadow-sm'
                                        : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'
                                    } ${isReadOnly ? 'cursor-default opacity-60' : ''}`}
                                  >
                                    {day}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100/50 flex items-center gap-2">
                               <Sparkles size={12} className="text-blue-400" />
                               <span className="text-[10px] text-blue-600 font-bold">📌 选定日当天，日报与周报将自动合并推送一份精华。</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-gray-400 font-medium">推送具体时间</span>
                          <input 
                            type="time" 
                            disabled={isReadOnly}
                            value={reportSettings.time}
                            onChange={(e) => setReportSettings(prev => ({ ...prev, time: e.target.value }))}
                            className={`bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-[12px] font-bold text-gray-800 outline-none focus:border-blue-300 transition-colors ${isReadOnly ? 'opacity-50' : ''}`}
                          />
                        </div>
                    </div>
                  </FeatureToggleItem>

                  <FeatureToggleItem 
                    icon={Database}
                    title="内容管理"
                    subtitle="基于群聊历史构建知识库，支持 @提问查询"
                    enabled={configs.contentManagement}
                    onToggle={() => setConfigs(prev => ({ ...prev, contentManagement: !prev.contentManagement }))}
                    disabled={isReadOnly}
                  />

                  <FeatureToggleItem 
                    icon={Folder}
                    title="文件管理"
                    subtitle="规范化整理群文件并提取核心信息至知识库"
                    enabled={configs.fileManagement}
                    onToggle={() => setConfigs(prev => ({ ...prev, fileManagement: !prev.fileManagement }))}
                    disabled={isReadOnly}
                  />

                  <FeatureToggleItem 
                    icon={UserPlus}
                    title="入群导读"
                    subtitle="新成员入群后自动推送群聊历史记录梗概"
                    enabled={configs.welcomeGuide}
                    onToggle={() => setConfigs(prev => ({ ...prev, welcomeGuide: !prev.welcomeGuide }))}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            )}

            {activeTab === 'personality' && (
              <div className="flex flex-col h-full animate-mac-fade space-y-4">
                <div className="flex items-center justify-between bg-white p-1 rounded-xl border border-gray-100 w-fit shrink-0">
                  {(['Soul.md', 'Memory.md', 'Group.md'] as DocType[]).map(doc => (
                    <button
                      key={doc}
                      onClick={() => setActiveDoc(doc)}
                      className={`px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
                        activeDoc === doc ? 'bg-blue-50 text-[#0099FF] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {doc}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-h-[300px] relative flex flex-col group">
                  {!isReadOnly && (
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                       <button 
                          onClick={handleAiOptimize}
                          disabled={isAiOptimizing}
                          className="bg-[#0099FF] text-white px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-600 transition disabled:opacity-50"
                       >
                          {isAiOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                          AI 辅助编写
                       </button>
                    </div>
                  )}
                  <textarea 
                    value={docs[activeDoc]}
                    readOnly={isReadOnly}
                    onChange={(e) => setDocs(prev => ({ ...prev, [activeDoc]: e.target.value }))}
                    placeholder={`${activeDoc} 正在等待写入...`}
                    className={`flex-1 w-full bg-slate-900 text-emerald-400 font-mono p-6 rounded-2xl text-[13px] leading-relaxed outline-none border-2 border-transparent focus:border-blue-400/30 transition-all resize-none shadow-2xl overflow-y-auto ${isReadOnly ? 'opacity-90' : ''}`}
                    spellCheck={false}
                  />
                  <div className="absolute bottom-4 left-6 flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                     <span className="flex items-center gap-1"><FileText size={10} /> {docs[activeDoc].length} chars</span>
                     <span className="flex items-center gap-1 text-emerald-500/50"><Cpu size={10} /> Markdown v2.0 Enabled</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-2">
                   <History size={12} /> 上次修改于: 今天 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            {activeTab === 'scripts' && (
              <div className="h-full flex flex-col items-center justify-center animate-mac-fade text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
                   <Terminal size={32} />
                </div>
                <div>
                   <h3 className="text-[16px] font-black text-gray-900">高级脚本插件 (Coming Soon)</h3>
                   <p className="text-[12px] text-gray-400 max-w-[280px] mx-auto mt-2 leading-relaxed">
                      开发者模式正在内部测试中，未来支持通过 Python 或 JS 脚本扩展群龙虾的业务逻辑。
                   </p>
                </div>
                {!isReadOnly && (
                  <button className="text-[#0099FF] text-[12px] font-bold border border-blue-100 px-4 py-1.5 rounded-full bg-blue-50/50">
                     申请内测资格
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="p-8 pt-4 bg-white border-t border-gray-100 flex gap-4">
            {!isReadOnly && isEdit && onDisable && (
              <button
                onClick={onDisable}
                className="h-12 px-6 rounded-2xl text-red-500 font-bold text-[14px] border border-red-50 hover:bg-red-50 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                停用并收回
              </button>
            )}
            <button 
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 h-12 rounded-2xl text-white font-black text-[15px] shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading ? 'bg-blue-400 shadow-blue-100' : 'bg-[#0099FF] shadow-blue-100 active:scale-[0.98] hover:bg-blue-600 hover:shadow-blue-200'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {isEdit ? '正在同步云端内核...' : '正在初始化群智库...'}
                </>
              ) : (
                <>
                  {isReadOnly ? '返回' : (isEdit ? '保存并同步内核' : '确认部署并立即激活')} {!isReadOnly && <Send size={18} />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobsterConfigModal;
