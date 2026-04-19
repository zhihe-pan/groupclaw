import React, { useState } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Send, 
  MessageSquare,
  Bot,
  HelpingHand,
  Trophy,
  Target
} from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  icon?: React.ReactNode;
}

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPrivateChat: () => void;
  groupName: string;
  sessionId: string | number;
}

const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ 
  isOpen, 
  onClose, 
  onNavigateToPrivateChat,
  groupName,
  sessionId
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  // Session-specific FAQs
  const getFAQs = (): FAQ[] => {
    const common: FAQ[] = [
      { id: 101, question: "如何让群龙虾帮我整理日报？", answer: "群龙虾每天会自动萃取群聊精华。如果您想手动触发，可以通过在群里发送‘@群龙虾 萃取今日重点’来即时获取干货汇总。", icon: <Sparkles className="text-blue-500" size={16} /> },
    ];

    if (sessionId === 6) { // AI Co-creation Camp
      return [
        { id: 1, question: "如何参与 AI 产品共创投稿？", answer: "点击群日报卡片下方的‘参与共创’。提交您的想法后，群龙虾会为您初步评估可行性并打上‘潜力股’标签。", icon: <Target className="text-orange-500" size={16} /> },
        { id: 2, question: "共创激励规则是什么？", answer: "每次被收录进‘群精华’或被评为‘优秀案例’的想法都会获得积分。积分可在私聊群龙虾处查看，勋章等级越高，内测权权重越大。", icon: <Trophy className="text-amber-500" size={16} /> },
        ...common
      ];
    }

    if (sessionId === 5) { // Technical Community
      return [
        { id: 3, question: "如何定位技术方案的原文？", answer: "在群龙虾发送的‘技术解决方案’卡片列表项右侧，点击‘定位原文 ↗’即可快速跳转到当时的聊天气泡位置。", icon: <Search className="text-green-500" size={16} /> },
        { id: 4, question: "怎么更新我在本群的技术栈标签？", answer: "直接在群里讨论技术（如 Vue3, Rust 等）。群龙虾会根据聊天历史自动更新您的成员标签，无需手动操作。", icon: <Bot className="text-purple-500" size={16} /> },
        ...common
      ];
    }

    return [
      { id: 5, question: "欢迎来到群知识库", answer: "这里汇集了由群龙虾整理出的群聊共识与核心资料。您可以通过点击下方问题了解基本规则，或直接输入您的问题进行 AI 检索。", icon: <HelpingHand className="text-blue-400" size={16} /> },
      ...common
    ];
  };

  const faqs = getFAQs();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-mac-fade" onClick={onClose} />
      
      <div className="relative w-full max-w-[680px] h-[600px] bg-white rounded-2xl shadow-[0_32px_96px_rgba(0,0,0,0.3)] border border-white/50 overflow-hidden flex flex-col transition-all duration-300 animate-mac-slide-up">
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 bg-gray-50/30">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <BookOpen size={20} />
             </div>
             <div>
                <h3 className="text-[15px] font-black text-gray-900 tracking-tight">{groupName} 知识库</h3>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Group Intelligence Library</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1.5 hover:bg-gray-100 rounded-lg">
             <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-white/50">
           <div className="mb-6 flex items-center justify-between">
              <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-widest">常见问题 FAQ</h4>
              <button 
                onClick={onNavigateToPrivateChat}
                className="text-[12px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
              >
                <MessageSquare size={14} /> 去私聊群龙虾
              </button>
           </div>

           <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="group border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                   <button 
                     onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                     className="w-full flex items-center justify-between p-4 text-left"
                   >
                     <div className="flex items-center gap-3">
                        {faq.icon}
                        <span className="text-[13px] font-bold text-gray-800 tracking-tight">{faq.question}</span>
                     </div>
                     {expandedId === faq.id ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-gray-300 group-hover:text-blue-300" />}
                   </button>
                   {expandedId === faq.id && (
                     <div className="px-4 pb-4 animate-mac-fade">
                        <div className="h-[1px] bg-gray-50 mb-4 mx-2"></div>
                        <p className="px-7 text-[13px] text-gray-500 leading-relaxed font-medium">
                           {faq.answer}
                        </p>
                     </div>
                   )}
                </div>
              ))}
           </div>
           
           <div className="mt-10 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 flex items-center gap-4 animate-mac-fade">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                 <Bot className="text-blue-500" size={24} />
              </div>
              <div className="flex-1">
                 <h5 className="text-[13px] font-black text-gray-900">没找到想要的？</h5>
                 <p className="text-[12px] text-gray-500 font-medium">您可以直接在此对知识库提问，或通过私聊让龙虾进行深度研究。</p>
              </div>
           </div>
        </div>

        {/* Footer Question Area */}
        <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-xl shrink-0">
           <div className="relative flex items-center bg-gray-100/80 rounded-2xl px-4 py-3 border border-transparent focus-within:border-blue-200 transition-all shadow-inner">
              <Sparkles size={16} className="text-blue-500/60 mr-3 shrink-0" />
              <input 
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="输入您的问题，群龙虾将从知识库中为您解答..."
                className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium placeholder:text-gray-400"
                onKeyDown={e => e.key === 'Enter' && setInputText('')}
              />
              <button 
                onClick={() => setInputText('')}
                disabled={!inputText.trim()}
                className="ml-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:scale-95 transition-all shadow-md active:scale-90"
              >
                <Send size={16} />
              </button>
           </div>
           <div className="mt-2 text-center">
              <p className="text-[9px] text-gray-300 font-bold tracking-widest uppercase">Answers powered by GroupClaw Knowledge indexing</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseModal;
