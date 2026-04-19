import { useState, useEffect, useRef, useCallback } from 'react';
import LobsterConfigModal from './components/LobsterConfigModal';
import GroupFilesAlbumModal from './components/GroupFilesAlbumModal';
import KnowledgeBaseModal from './components/KnowledgeBaseModal';
import MVPChecklist from './components/MVPChecklist';
import { 
  MessageSquare, 
  Users, 
  Star, 
  Hash, 
  Folder,
  LayoutGrid,
  Mail,
  Phone,
  Menu as MenuIcon,
  Search,
  Plus,
  Video,
  MonitorUp,
  MoreHorizontal,
  Smile,
  Scissors,
  Image as ImageIcon,
  Bot,
  Mic,
  Monitor,
  Box,
  ChevronRight,
  BellOff,
  X,
  Sparkles,
  Clock,
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Zap,
  MapPin,
  Flame,
  User,
  BarChart2,
  BookOpen
} from 'lucide-react';

// --- Types ---
interface Message {
  id: number;
  sessionId: string | number;
  user: string;
  avatar: string;
  content: string;
  time: string;
  isSelf: boolean;
  isSystem?: boolean;
  isReport?: boolean;
  hasSuggestion?: string;
  tag?: string;
  tagType?: 'owner' | 'admin' | 'custom';
  image?: string;
  file?: {
    name: string;
    size: string;
  };
  isAIResponse?: boolean;
}

interface Session {
  id: string | number;
  name: string;
  lastMsg: string;
  time: string;
  avatar: string;
  unread?: number;
  muted?: boolean;
  isAssistant?: boolean;
}

/** 从入群导读 / 知识库进入「群龙虾」私聊后，用户采用默认引导语发送时的 MVP 模拟回复 */
function getDefaultPrivateLobsterMvpReply(userLine: string): string {
  if (/群规|玩法/.test(userLine)) {
    return '收到～在当前 MVP 演示里，我会按「入群导读」来对齐：本群的关键信息与玩法可先以群公告与入群卡片为准；日常协作上，建议把重要结论随时丢给我（或使用 @群龙虾），后续在知识库里更好检索。\n\n你也可以告诉我：更想先了解「定时群报/日报」「知识库怎么问」还是「群文件与相册」？我可以按你的节奏拆步骤。🦞';
  }
  if (/知识库|检索|@群龙虾|@龙虾/.test(userLine)) {
    return '好的。演示版里本群知识库已做过示例索引；你继续发具体关键词或贴一小段上下文，我会以「联想问答 + 引用片段」的方式回复（均为模拟数据）。🦞';
  }
  if (/大家好|新入群|自我介绍|感兴趣/.test(userLine)) {
    return '欢迎入群！这段自我介绍很清晰。MVP 里我可以帮你再润一版更短的开场白，或根据你的方向补几个适合在群里追问的话题；你也可以直接说说接下来想聊的业务场景。🦞';
  }
  return '收到～这是与本群绑定的私聊窗口（演示）。你这条我已记下，也可以继续补充：你最关心群里哪一块能力？我会尽量用群内上下文来对齐回答。🦞';
}

export interface GroupConfig {
  report: boolean;
  contentManagement: boolean;
  fileManagement: boolean;
  welcomeGuide: boolean;
}

/** 数字群 id / 订阅私聊 push_n / lobster_n 统一解析，用于读取 groupConfigs */
function parseGroupIdFromSessionId(sessionId: string | number): number | null {
  if (typeof sessionId === 'number') return sessionId;
  const m = String(sessionId).match(/^(?:push_|lobster_)(\d+)$/);
  return m ? Number(m[1]) : null;
}

/** 与群龙虾私聊（lobster_n）首次空会话时的开场白，按触点区分；同一会话只注入一次 */
function lobsterPrivateOpening(entry: 'onboarding' | 'knowledge'): string {
  return entry === 'knowledge'
    ? '你好，有什么可以为你解答的？'
    : '你好！有什么可以帮你的？';
}

interface Member {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isAI?: boolean;
  status?: string;
  tag?: string;
  tagType?: 'owner' | 'admin' | 'custom';
}

// --- Unified Components ---

interface DailyReportCardProps {
  message: Message;
  isAssistantSession: boolean;
  isSubscribed: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSubscribe: () => void;
}

const DailyReportCard: React.FC<DailyReportCardProps> = ({ 
  isAssistantSession, 
  isSubscribed, 
  isExpanded, 
  onToggleExpand, 
  onSubscribe 
}) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xl shadow-blue-500/5 flex flex-col max-w-[640px] w-full">
       <div className="report-header-gradient border-b border-blue-50 py-2.5 px-4 flex justify-between items-center shrink-0">
          <h4 className="text-[14px] font-semibold flex items-center gap-2 text-qq-blue">
             <Sparkles size={15} className="text-qq-blue" /> 群日报：行业资讯精选
          </h4>
          {!isAssistantSession && (
            <button 
              onClick={onSubscribe}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                isSubscribed
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white text-blue-500 border border-blue-100 hover:bg-blue-50'
              }`}
            >
              {isSubscribed ? <BellOff size={12} /> : <Bell size={12} />}
              {isSubscribed ? '已订阅' : '订阅日报'}
            </button>
          )}
       </div>
       
       <div className={`p-4 space-y-4 relative transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-40'}`}>
          <div className="flex gap-3 group translate-x-0 hover:translate-x-1 transition-transform cursor-pointer">
             <span className="text-blue-400 shrink-0">📌</span>
             <p className="text-[13px] text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-900">大模型就业前景：</span> 
                群友讨论认为 AI 并非替代人类，而是重塑岗位需求。建议关注 Prompt Engineering 与模型微调方向。<sup className="text-blue-500 font-bold ml-0.5">[1]</sup>
             </p>
          </div>
          <div className="flex gap-3 group translate-x-0 hover:translate-x-1 transition-transform cursor-pointer">
             <span className="text-blue-400 shrink-0">📌</span>
             <p className="text-[13px] text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-900">UI 设计趋势：</span> 
                简约风依然是主流，但 3D 拟态和磨砂玻璃效果（Vibrancy）在高端产品中回归。<sup className="text-blue-500 font-bold ml-0.5">[2]</sup>
             </p>
          </div>
          <div className="flex gap-3 group translate-x-0 hover:translate-x-1 transition-transform cursor-pointer">
             <span className="text-blue-400 shrink-0">📌</span>
             <p className="text-[13px] text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-900">产品方法论：</span> 
                群主推荐关注“MVP 最小可行性产品”的快速迭代逻辑，在本周行业交流中被多次提起。<sup className="text-blue-500 font-bold ml-0.5">[3]</sup>
             </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 bg-gray-50/30 p-3 rounded-xl space-y-1.5 anim-fade-in">
             <div className="text-[11px] font-bold text-gray-400 mb-1 flex items-center gap-1"><ExternalLink size={10} /> 引用来源</div>
             <div className="text-[11px] text-gray-500"><span className="text-blue-500 font-bold">[1]</span> 产品小王: 提到大模型落地难点与岗位重塑...</div>
             <div className="text-[11px] text-gray-500"><span className="text-blue-500 font-bold">[2]</span> UI设计师: 分享了最新的 Dribbble 趋势图...</div>
             <div className="text-[11px] text-gray-500"><span className="text-blue-500 font-bold">[3]</span> 产品小王: 推荐了《精益创业》中的 MVP 案例...</div>
          </div>

          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent flex items-end justify-center pb-2">
               <button onClick={onToggleExpand} className="bg-white/90 backdrop-blur-sm border border-gray-100 text-blue-500 px-4 py-1 rounded-full text-[12px] font-bold shadow-sm hover:bg-blue-50 transition flex items-center gap-1">阅读全文 <ChevronDown size={14} /></button>
            </div>
          )}
       </div>
       
       {isExpanded && (
         <div className="px-4 py-2 flex justify-center border-t border-gray-50">
            <button onClick={onToggleExpand} className="text-gray-400 text-[11px] hover:text-blue-500 transition flex items-center gap-1">收起全文 <ChevronUp size={14} /></button>
         </div>
       )}

       <div className="bg-gray-50/50 px-4 py-2 flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-100">
          <span>来自 GroupClaw（Llama-3 驱动）的群龙虾助手</span>
          <span className="flex items-center gap-1"><Clock size={10}/> 萃取完成</span>
       </div>
    </div>
  );
};

// --- Mock Data ---

const INITIAL_SESSIONS: Session[] = [
  { id: 1, name: '产品经理交流群', lastMsg: '新成员：大家好，很高兴入群...', time: '22:51', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=A' },
  { id: 2, name: '行业资讯分享群', lastMsg: '群龙虾：[日报] 行业资讯精选', time: '09:00', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=B' },
  { id: 5, name: '技术交流社区', lastMsg: '赵六：@群龙虾 帮我搜索并总...', time: '14:06', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=E' },
  { id: 4, name: '兴趣爱好小组', lastMsg: '户外老持：[文件] 风景不错！顺便把下...', time: '17:45', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=D' },
  { id: 6, name: 'AI 产品共创营', lastMsg: '欢迎 @新成员 加入群聊！', time: '刚刚', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tech', unread: 1 },
];

const MOCK_MEMBERS_S1: Member[] = [
  { id: 'ai', name: '群龙虾', role: 'AI', isAI: true, status: '🟢 正在萃取今日干货...', avatar: '🦞' },
  { id: 'owner', name: '产品小王', role: '群主', tag: '群主', tagType: 'owner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
  { id: 'admin1', name: '资深开发', role: '管理员', tag: '管理员', tagType: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev' },
  { id: 'admin2', name: 'UI设计师', role: '管理员', tag: 'UI', tagType: 'custom', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=UI' },
  { id: 'member1', name: '新成员', role: '成员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ming' },
  { id: 'member2', name: '活跃分子', role: '成员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Active' },
];

const MOCK_MEMBERS_S2: Member[] = [
  { id: 'ai', name: '群龙虾', role: 'AI', isAI: true, status: '🟢 智库资讯更新中...', avatar: '🦞' },
  { id: 'owner', name: '资讯达人', role: '群主', tag: '资深', tagType: 'owner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=News' },
  { id: 'admin1', name: '数据专家', role: '管理员', tag: '数据', tagType: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Data' },
  { id: 'admin2', name: '快讯机器人', role: '管理员', tag: '爬虫', tagType: 'custom', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bot' },
  { id: 'member3', name: '观察员-老李', role: '成员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li' },
];

const MOCK_MEMBERS_S4: Member[] = [
  { id: 'ai', name: '群龙虾', role: 'AI', isAI: true, status: '🟢 爱好趋势分析中...', avatar: '🦞' },
  { id: 'owner', name: '户外老持', role: '群主', tag: '领队', tagType: 'owner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Old' },
  { id: 'admin1', name: '摄影小马', role: '管理员', tag: '摄影', tagType: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pony' },
  { id: 'member4', name: '徒步萌新', role: '成员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Newbie' },
  { id: 'member5', name: '装备党', role: '成员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gear' },
];

const MOCK_MEMBERS_S5: Member[] = [
  { id: 'ai', name: '群龙虾', role: 'AI', isAI: true, status: '🟢 专家级方案检索中...', avatar: '🦞' },
  { id: 'owner', name: '技术架构师', role: '群主', tag: '架构', tagType: 'owner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arch' },
  { id: 'admin1', name: '资深开发-老王', role: '管理员', tag: '专家', tagType: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang' },
  { id: 'member1', name: '前端螺丝钉', role: '成员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Screw' },
  { id: 'member2', name: '技术小白', role: '成员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Self' },
];

const MOCK_MEMBERS_S6: Member[] = [
  { id: 'ai', name: '群龙虾', role: 'AI', isAI: true, status: '🟢 正在萃取今日干货...', avatar: '🦞' },
  { id: 'owner', name: '产品小王', role: '群主', tag: '群主', tagType: 'owner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
  { id: 'admin1', name: '资深开发', role: '管理员', tag: '管理员', tagType: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev' },
  { id: 'member1', name: '新成员', role: '成员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ming' },
];

const INITIAL_MESSAGES: Message[] = [
  { 
    id: 1, sessionId: 1,
    user: '产品小王', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', 
    content: '欢迎大家加入本群！这里是产品经理的交流天地，欢迎分享工作中的心得。', 
    time: '22:05', isSelf: false, tag: '群主', tagType: 'owner'
  },
  { 
    id: 2, sessionId: 1,
    user: '新成员', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ming', 
    content: '大家好，很高兴加入本群！请多指教。', 
    time: '22:20', isSelf: false
  },
  {
    id: 201, sessionId: 2,
    user: '系统', avatar: '',
    content: '🎉 [群龙虾] 已被群主激活！大家可以 @群龙虾 尝试新功能。',
    time: '08:55', isSelf: false, isSystem: true
  },
  {
    id: 202, sessionId: 2,
    user: '群龙虾', avatar: '',
    content: '',
    time: '09:00', isSelf: false, isReport: true
  },
  {
    id: 601, sessionId: 6,
    user: '群龙虾', avatar: '',
    content: '欢迎 @新成员 加入群聊！',
    time: '刚刚', isSelf: false, tag: 'AI 助手', tagType: 'admin'
  },
  {
    id: 401, sessionId: 4,
    user: '摄影小马', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pony',
    content: '给大家看看上周末去山里拍的日出！这光影绝了。',
    time: '17:40', isSelf: false, tag: '摄影', tagType: 'admin',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 402, sessionId: 4,
    user: '装备党', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gear',
    content: '太好看了！这画质，带的哪个焦段的镜头？',
    time: '17:42', isSelf: false
  },
  {
    id: 403, sessionId: 4,
    user: '户外老持', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Old',
    content: '风景不错！顺便把下个月的徒步攻略整理出来了，大家下载看看。',
    time: '17:45', isSelf: false, tag: '领队', tagType: 'owner',
    file: { name: '5月徒步行程规划及装备清单.pdf', size: '2.4 MB' }
  },
  {
    id: 501, sessionId: 5,
    user: '技术小白', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Self',
    content: '大家遇到过解构 Props 导致 Vue3 响应式丢失的问题吗？这个 Bug 怎么解？我看了一上午没头绪。',
    time: '14:03', isSelf: true
  },
  {
    id: 502, sessionId: 5,
    user: '资深开发-老王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
    content: '这个问题上周群里刚激烈讨论过，出了好几个有效方案。你别去翻历史记录了，直接问群龙虾就行了，超方便。',
    time: '14:05', isSelf: false, tag: '专家', tagType: 'admin'
  }
];

export default function App() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  /** 每个会话独立的输入草稿，切换群聊不会互相覆盖 */
  const [inputBySession, setInputBySession] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | number>(1);
  const [enabledSessions, setEnabledSessions] = useState<number[]>([2, 4, 5, 6]);
  
  const [groupConfigs, setGroupConfigs] = useState<Record<number, GroupConfig>>({
    1: { report: false, contentManagement: false, fileManagement: false, welcomeGuide: false },
    2: { report: true, contentManagement: true, fileManagement: false, welcomeGuide: false },
    4: { report: false, contentManagement: true, fileManagement: true, welcomeGuide: true },
    5: { report: false, contentManagement: true, fileManagement: false, welcomeGuide: false },
    6: { report: true, contentManagement: true, fileManagement: false, welcomeGuide: true },
  });

  const [atMenuOpen, setAtMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean } | null>(null);
  
  const [subscribedGroups, setSubscribedGroups] = useState<Set<number>>(new Set());
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showOnboardingReport, setShowOnboardingReport] = useState(false);

  // AI File/Album management Modal state (Simplified)
  const [isFilesAlbumModalOpen, setIsFilesAlbumModalOpen] = useState(false);
  const [isKBModalOpen, setIsKBModalOpen] = useState(false);
  const [filesAlbumType, setFilesAlbumType] = useState<'files' | 'album'>('files');

  // Onboarding Interaction States
  const [showIntroPopover, setShowIntroPopover] = useState(false);
  const [generatedIntro, setGeneratedIntro] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const isCurrentLobsterEnabled = typeof activeSessionId === 'number' && enabledSessions.includes(activeSessionId);
  const activeMessages = messages.filter((m) => {
    if (m.sessionId !== activeSessionId) return false;
    if (!m.isReport) return true;
    const gid = parseGroupIdFromSessionId(activeSessionId);
    if (gid == null) return true;
    return !!groupConfigs[gid]?.report;
  });
  const currentUserNickname = activeSessionId === 5 ? '技术小白' : '我';
  
  const currentMembers = 
    activeSessionId === 1 ? MOCK_MEMBERS_S1 : 
    activeSessionId === 2 ? MOCK_MEMBERS_S2 : 
    activeSessionId === 4 ? MOCK_MEMBERS_S4 :
    activeSessionId === 5 ? MOCK_MEMBERS_S5 : 
    activeSessionId === 6 ? MOCK_MEMBERS_S6 :
    MOCK_MEMBERS_S1;

  const inputText = inputBySession[String(activeSessionId)] ?? '';

  const setInputText = useCallback((val: string | ((prev: string) => string)) => {
    const key = String(activeSessionId);
    setInputBySession((prev) => {
      const cur = prev[key] ?? '';
      const next = typeof val === 'function' ? (val as (p: string) => string)(cur) : val;
      return { ...prev, [key]: next };
    });
  }, [activeSessionId]);

  /** 切换会话时关闭仅属于上一会话的浮层，避免「串台」 */
  useEffect(() => {
    setShowIntroPopover(false);
    setAtMenuOpen(false);
    setContextMenu(null);
    setShowAppsMenu(false);
    setShowMoreMenu(false);
    setShowOnboardingReport(false);
    setExpandedReports(new Set());
  }, [activeSessionId]);

  /** 进入「AI 产品共创营」会话即视为已读，去掉左侧列表红点 */
  useEffect(() => {
    if (activeSessionId !== 6) return;
    setSessions((prev) => {
      const row = prev.find((s) => s.id === 6);
      if (!row?.unread) return prev;
      return prev.map((s) => (s.id === 6 ? { ...s, unread: undefined } : s));
    });
  }, [activeSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeSessionId]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (activeSession.isAssistant && inputText.includes('取消订阅')) {
       setSessions((prev) => prev.filter((s) => s.id !== activeSessionId));
       if (String(activeSessionId).startsWith('push_')) {
         const groupId = parseGroupIdFromSessionId(activeSessionId);
         if (groupId != null) {
           setSubscribedGroups((prev) => {
             const next = new Set(prev);
             next.delete(groupId);
             return next;
           });
         }
       }
       setActiveSessionId(1);
       setInputText('');
       return;
    }

    const isKeywordMsg = inputText.includes('攻略') || inputText.includes('怎么样');

    const newMsg: Message = {
      id: Date.now(),
      sessionId: activeSessionId,
      user: currentUserNickname,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Self',
      content: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      hasSuggestion: isKeywordMsg ? '群龙虾找到了 3 条相关经验，点击查看' : undefined
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setAtMenuOpen(false);

    if (isCurrentLobsterEnabled && (inputText.includes('@群龙虾') || inputText.includes('@龙虾'))) {
      const cleanInput = inputText.replace(/(@群龙虾|@龙虾)/g, '').trim();
      const hasQuestion = cleanInput.length > 0;
      const isVue3Question = cleanInput.includes('Vue3') || cleanInput.includes('响应式') || cleanInput.includes('Props');

      setTimeout(() => {
        if (!hasQuestion) {
          // Greeting Response
          const greetMsg: Message = {
            id: Date.now() + 1001,
            sessionId: activeSessionId,
            user: '群龙虾',
            avatar: '',
            content: '你好呀！我是你的群组 AI 助手群龙虾。你可以 @我 询问群聊总结、干货萃取或知识库搜索，很高兴为你服务！🦞',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf: false
          };
          setMessages(prev => [...prev, greetMsg]);
        } else {
          // Structured Card Response
          const aiResponse: Message = {
            id: Date.now() + 1002,
            sessionId: activeSessionId,
            user: '群龙虾',
            avatar: '',
            content: isVue3Question && activeSessionId === 5 ? 'VUE3_SOLUTION' : '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf: false,
            isAIResponse: true
          };
          setMessages(prev => [...prev, aiResponse]);
        }
      }, 700);
    }
  };

  const handleConfirmConfig = (newConfig: GroupConfig) => {
    setIsConfigModalOpen(false);
    if (typeof activeSessionId !== 'number') return;

    // Save config
    setGroupConfigs(prev => ({ ...prev, [activeSessionId]: newConfig }));

    // If already enabled, just return
    if (enabledSessions.includes(activeSessionId)) return;

    setEnabledSessions(prev => [...prev, activeSessionId]);
    const systemMsg: Message = {
      id: Date.now(),
      sessionId: activeSessionId,
      user: '系统',
      avatar: '',
      content: '🎉 [群龙虾] 已被群主激活！大家可以 @群龙虾 新功能。',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: false,
      isSystem: true
    };
    setMessages(prev => [...prev, systemMsg]);

    if (newConfig.report) {
      setTimeout(() => {
        const reportMsg: Message = {
          id: Date.now() + 1,
          sessionId: activeSessionId,
          user: '群龙虾',
          avatar: '',
          content: '',
          time: '09:00',
          isSelf: false,
          isReport: true
        };
        setMessages((prev) => [...prev, reportMsg]);
      }, 2000);
    }
  };

  const handleDisableLobster = () => {
    setIsConfigModalOpen(false);
    if (typeof activeSessionId !== 'number') return;
    
    setEnabledSessions(prev => prev.filter(id => id !== activeSessionId));
    const systemMsg: Message = {
      id: Date.now(),
      sessionId: activeSessionId,
      user: '系统',
      avatar: '',
      content: 'ℹ️ [群龙虾] 已被群主停用。',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: false,
      isSystem: true
    };
    setMessages(prev => [...prev, systemMsg]);
  };

  const toggleSubscription = (groupId: number, groupName: string) => {
    if (subscribedGroups.has(groupId)) return;

    const newSubscribed = new Set(subscribedGroups);
    newSubscribed.add(groupId);
    setSubscribedGroups(newSubscribed);
    
    // 订阅优先复用当前群已存在的群龙虾会话，避免与知识库私聊重复开窗
    const pushId = `push_${groupId}`;
    const assistantId = findExistingAssistantSessionId(sessions, groupId) ?? pushId;
    
    setSessions(prev => {
      if (prev.find((s) => s.id === assistantId)) {
        return prev.map((s) =>
          s.id === assistantId
            ? {
                ...s,
                name: `群龙虾 - ${groupName}`,
                lastMsg: '已为您开启订阅...',
                time: '刚刚',
                avatar: '',
              }
            : s
        );
      }
      return [
        {
          id: pushId,
          name: `群龙虾 - ${groupName}`,
          isAssistant: true,
          lastMsg: '已为您开启订阅...',
          time: '刚刚',
          avatar: '',
        },
        ...prev,
      ];
    });

    // AUTO SWITCH to the new session
    setActiveSessionId(assistantId);

    // Sequence Delivery
    const welcomeMsg: Message = {
      id: Date.now(),
      sessionId: assistantId,
      user: '系统',
      avatar: '',
      content: `你好！我是${groupName}群的群龙虾。我将向你同步推送${groupName}群的每日情报。如需取消订阅，请在该会话输入"取消订阅"。`,
      time: '刚刚',
      isSelf: false,
      isSystem: true
    };
    setMessages(prev => [...prev, welcomeMsg]);

    setTimeout(() => {
      if (!groupConfigs[groupId]?.report) return;
      const reportMsg: Message = {
        id: Date.now() + 500,
        sessionId: assistantId,
        user: '群龙虾',
        avatar: '',
        content: '',
        time: '09:00',
        isSelf: false,
        isReport: true
      };
      setMessages((prev) => [...prev, reportMsg]);
    }, 1500);
  };

  const toggleReportExpansion = (reportId: number) => {
    setExpandedReports(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) next.delete(reportId);
      else next.add(reportId);
      return next;
    });
  };

  /** 同一群只复用一个群龙虾会话，避免「订阅」与「私聊」各开一个窗口 */
  const findExistingAssistantSessionId = (
    list: Session[],
    groupNumId: number
  ): string | null => {
    const lobsterId = `lobster_${groupNumId}`;
    const pushId = `push_${groupNumId}`;
    if (list.some((s) => s.id === lobsterId)) return lobsterId;
    if (list.some((s) => s.id === pushId)) return pushId;
    return null;
  };

  /** 入群导读与群知识库共用同一私聊会话 id：lobster_{群数字 id} */
  const ensureLobsterPrivateSession = (
    groupNumId: number,
    groupNameShort: string,
    entry: 'onboarding' | 'knowledge'
  ) => {
    const lobsterId = `lobster_${groupNumId}`;
    const displayName = `群龙虾 - ${groupNameShort}`;
    const opening = lobsterPrivateOpening(entry);
    const targetAssistantId =
      findExistingAssistantSessionId(sessions, groupNumId) ?? lobsterId;
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === targetAssistantId);
      if (existing) {
        return prev.map((s) =>
          s.id === targetAssistantId
            ? { ...s, name: displayName, time: '刚刚' }
            : s
        );
      }
      return [
        {
          id: lobsterId,
          name: displayName,
          lastMsg: opening,
          time: '刚刚',
          avatar: '',
          isAssistant: true,
        },
        ...prev,
      ];
    });
    setMessages((prev) => {
      if (prev.some((m) => m.sessionId === targetAssistantId)) return prev;
      return [
        ...prev,
        {
          id: Date.now(),
          sessionId: targetAssistantId,
          user: '群龙虾',
          avatar: '',
          content: opening,
          time: '刚刚',
          isSelf: false,
        },
      ];
    });
    setActiveSessionId(targetAssistantId);
  };

  const currentUserRole = [1, 2, 4].includes(Number(activeSessionId)) ? 'owner' : 'member';

  /** 左侧列表「订」：仅当该群已开通定时群报，且会话为对应群的群龙虾私聊（lobster_n / push_n） */
  const sessionShowsSubscribeBadge = (s: Session) => {
    if (!s.isAssistant) return false;
    const gid = parseGroupIdFromSessionId(s.id);
    if (gid == null) return false;
    return !!groupConfigs[gid]?.report;
  };

  return (
    <div 
      className="flex min-h-screen w-full bg-gray-100/50 p-8 items-center justify-center gap-8 font-pingfang overflow-x-auto"
      onClick={() => { setContextMenu(null); setShowAppsMenu(false); }}
    >
      <div className="mac-vibrancy flex-1 min-w-[1000px] max-w-6xl h-[calc(100vh-4rem)] flex rounded-2xl overflow-hidden shadow-2xl relative border border-white/20">
        
        {/* Custom Context Menu */}
        {contextMenu && (
          <div 
            className="fixed z-[999] bg-white/90 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-xl py-2 w-48 text-[13px] animate-mac-fade"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={() => setContextMenu(null)}
          >
            <div className="px-3 py-1.5 hover:bg-qq-blue hover:text-white cursor-default transition-colors">复制</div>
            <div className="px-3 py-1.5 hover:bg-qq-blue hover:text-white cursor-default transition-colors">回复</div>
            <div className="px-3 py-1.5 hover:bg-qq-blue hover:text-white cursor-default transition-colors">转发</div>
            <div className="h-[1px] bg-gray-100 mx-2 my-1"></div>
            <div className="px-3 py-2 hover:bg-lobster-orange hover:text-white cursor-default transition-colors flex items-center justify-between group">
               <span>投喂给群龙虾</span>
               <span className="text-sm">🦞</span>
            </div>
            <div className="px-3 py-1.5 hover:bg-qq-blue hover:text-white cursor-default transition-colors">删除</div>
          </div>
        )}

        {/* Column 1: Navigation Bar */}
        <div className="w-[64px] bg-white/20 flex flex-col items-center py-6 border-r border-gray-200/40 shrink-0 select-none">
          <div className="relative mb-8">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white shadow-sm ring-1 ring-black/5">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          <div className="flex flex-col gap-6 items-center flex-1">
            <MessageSquare 
              className={`sidebar-icon ${activeTab === 'chat' ? 'sidebar-icon-active' : 'text-gray-500 hover:text-qq-blue'}`} 
              size={26} 
              strokeWidth={2.5}
              onClick={() => setActiveTab('chat')}
            />
            <Users className="sidebar-icon text-gray-500 hover:text-qq-blue" size={26} />
            <Star className="sidebar-icon text-gray-500 hover:text-qq-blue" size={26} />
            <Hash className="sidebar-icon text-gray-500 hover:text-qq-blue" size={26} />
            <LayoutGrid className="sidebar-icon text-gray-500 hover:text-qq-blue" size={26} />
          </div>
          
          <div className="flex flex-col gap-6 items-center text-gray-500 mb-2">
            <Mail className="hover:text-qq-blue cursor-pointer transition" size={24} />
            <Phone className="hover:text-qq-blue cursor-pointer transition" size={24} />
            <MenuIcon className="hover:text-qq-blue cursor-pointer transition" size={24} />
          </div>
        </div>

        {/* Column 2: Session List */}
        <div className="w-[280px] bg-white/30 border-r border-gray-200/40 flex flex-col shrink-0">
          <div className="p-4 flex gap-2">
            <div className="flex-1 relative bg-gray-200/60 rounded-lg flex items-center px-3 gap-2">
              <Search size={14} className="text-gray-500" />
              <input type="text" placeholder="搜索" className="bg-transparent border-none outline-none text-[13px] w-full placeholder:text-gray-400 py-1.5" />
            </div>
            <div className="w-8 h-8 flex items-center justify-center bg-gray-200/60 rounded-lg text-gray-500 cursor-pointer hover:bg-gray-200 transition">
              <Plus size={18} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {sessions.map(s => (
              <div 
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id);
                  setActiveTab('chat');
                }}
                className={`flex gap-3 px-4 py-3 cursor-default transition-colors ${s.id === activeSessionId ? 'bg-black/10' : 'hover:bg-black/5'}`}
              >
                <div className="relative shrink-0">
                   <div className="w-12 h-12 rounded-lg bg-gray-300 overflow-hidden shadow-sm">
                      {s.isAssistant ? (
                        <div className="w-full h-full bg-lobster-orange flex items-center justify-center">
                          <span className="text-xl leading-none select-none">🦞</span>
                        </div>
                      ) : s.avatar && s.avatar.startsWith('http') ? (
                        <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src={s.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sys'} alt={s.name} className="w-full h-full object-cover" />
                      )}
                   </div>
                   {sessionShowsSubscribeBadge(s) && (
                     <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 text-white flex items-center justify-center rounded-full text-[9px] font-bold border-2 border-white">订</div>
                   )}
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-[13px] font-medium truncate tracking-tight ${s.isAssistant ? 'text-[#0099FF] font-bold' : 'text-gray-900'}`}>{s.name}</span>
                    <span className="text-[10px] text-gray-400 font-light">{s.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[12px] text-gray-500 truncate">{s.lastMsg}</p>
                    {s.unread && <span className="bg-red-500 text-white text-[9px] px-1 rounded-full min-w-[16px] h-[16px] flex items-center justify-center">{s.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Workspace Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative min-w-0">
          
          {/* Unified Header - Spans Full Workspace */}
          <header className="h-16 px-6 border-b border-gray-200 flex justify-between items-center shrink-0">
            <div className="flex flex-col min-w-0 flex-1 mr-4">
               <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap truncate">{activeSession.name}</h2>
               {activeSession.isAssistant && (
                 <div className="flex items-center gap-1.5 text-[9px] text-green-500 font-bold">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    自动推送中
                 </div>
               )}
            </div>
            
            <div className="flex items-center gap-5 text-gray-600 shrink-0">
               {!activeSession.isAssistant && (
                 <>
                    <Phone size={20} className="hover:text-qq-blue cursor-pointer" />
                    <Video size={20} className="hover:text-qq-blue cursor-pointer" />
                    <MonitorUp size={20} className="hover:text-qq-blue cursor-pointer" />
                    <div className="relative">
                       <LayoutGrid 
                         size={20} 
                         className={`hover:text-qq-blue cursor-pointer transition-colors ${showAppsMenu ? 'text-qq-blue' : ''}`} 
                         onClick={(e) => { e.stopPropagation(); setShowAppsMenu(!showAppsMenu); }}
                       />
                       {showAppsMenu && (
                          <div className="absolute right-0 mt-2 w-40 bg-white shadow-2xl border border-gray-100 rounded-xl py-1.5 z-50 animate-mac-fade">
                             <div 
                               className="px-3 py-2 hover:bg-blue-50 hover:text-blue-500 cursor-pointer text-[13px] flex items-center gap-2"
                               onClick={() => { setIsFilesAlbumModalOpen(true); setFilesAlbumType('files'); }}
                             >
                                <Folder size={16} /> 群文件
                             </div>
                             <div 
                               className="px-3 py-2 hover:bg-blue-50 hover:text-blue-500 cursor-pointer text-[13px] flex items-center gap-2"
                               onClick={() => { setIsFilesAlbumModalOpen(true); setFilesAlbumType('album'); }}
                             >
                                <ImageIcon size={16} /> 群相册
                             </div>
                             {isCurrentLobsterEnabled &&
                               typeof activeSessionId === 'number' &&
                               groupConfigs[activeSessionId]?.contentManagement && (
                               <div 
                                 className="px-3 py-2 hover:bg-blue-50 hover:text-blue-500 cursor-pointer text-[13px] flex items-center gap-2 animate-mac-fade"
                                 onClick={() => { setIsKBModalOpen(true); setShowAppsMenu(false); }}
                               >
                                  <BookOpen size={16} /> 群知识库
                               </div>
                             )}
                          </div>
                       )}
                    </div>
                    {typeof activeSessionId === 'number' && (
                      !isCurrentLobsterEnabled ? (
                        <button 
                          onClick={() => setIsConfigModalOpen(true)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-qq-blue rounded-lg transition-all group"
                        >
                          {currentUserRole === 'owner' ? (
                            <>
                              <Bot size={18} className="group-hover:rotate-12 transition-transform" />
                              <span className="text-[12px] font-bold">开启 AI</span>
                            </>
                          ) : (
                            <>
                              <Eye size={16} className="text-gray-400" />
                              <span className="text-[12px] text-gray-500 font-bold">助手未开启</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="relative group">
                          <Bot 
                            size={20} 
                            className="text-lobster-orange hover:scale-110 transition-transform cursor-pointer" 
                            onClick={() => setIsConfigModalOpen(true)}
                          />
                          {activeSessionId === 1 && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white pointer-events-none" aria-hidden />
                          )}
                        </div>
                      )
                    )}
                    <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                    <Plus size={20} className="hover:text-qq-blue cursor-pointer" />
                    <Search size={20} className="hover:text-qq-blue cursor-pointer" />
                 </>
               )}
               <div className="relative">
                  <MoreHorizontal 
                    size={20} 
                    className={`hover:text-qq-blue cursor-pointer transition-colors ${showMoreMenu ? 'text-qq-blue' : ''}`} 
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                  />
                  {showMoreMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-mac-fade">
                       <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-700 font-medium">资料</div>
                       <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-700">查找聊天内容</div>
                       <div className="h-[1px] bg-gray-100 mx-2 my-1"></div>
                       <div 
                         className="px-3 py-2 hover:bg-red-50 cursor-pointer text-[13px] text-red-500 font-medium"
                         onClick={() => {
                            setSessions((prev) => prev.filter((s) => s.id !== activeSessionId));
                            if (String(activeSessionId).startsWith('push_')) {
                              const groupId = parseGroupIdFromSessionId(activeSessionId);
                              if (groupId != null) {
                                setSubscribedGroups((prev) => {
                                  const next = new Set(prev);
                                  next.delete(groupId);
                                  return next;
                                });
                              }
                            }
                            setActiveSessionId(1);
                         }}
                       >
                          {activeSession.isAssistant ? '取消订阅助手' : '退出群聊'}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </header>

          {/* Unified Content Area (Chat + Info Panel) */}
          <div className="flex flex-1 overflow-hidden">
            
            {/* Left Column: Chat Pane */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative border-r border-gray-100/50">
              {/* Messages Scroll Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth bg-gray-50/10">
                {activeMessages.map(m => (
                  m.isSystem ? (
                    <div key={m.id} className="flex justify-center my-4 animate-mac-fade">
                       <div className="bg-gray-200/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-[12px] text-gray-500 font-medium border border-gray-100/50 shadow-sm">
                          {m.content}
                       </div>
                    </div>
                  ) : m.isReport ? (
                    <div key={m.id} className="flex gap-3 animate-mac-fade my-4">
                       <div className="w-10 h-10 rounded-full bg-lobster-orange flex items-center justify-center shadow-lg transform rotate-6 border border-white shrink-0">
                          <span className="text-xl">🦞</span>
                       </div>
                       <div className="flex flex-col gap-2 max-w-[85%]">
                          <div className="flex items-center gap-2 px-1">
                             <span className="text-[11px] font-bold text-lobster-orange">群龙虾</span>
                             <span className="text-[9px] bg-blue-50 text-qq-blue px-1.5 py-0.5 rounded font-bold border border-blue-100">AI 助手</span>
                             <span className="text-[10px] text-gray-400">{m.time}</span>
                          </div>
                          
                          <DailyReportCard 
                            message={m}
                            isAssistantSession={!!activeSession.isAssistant}
                            isSubscribed={subscribedGroups.has(Number(activeSessionId))}
                            isExpanded={expandedReports.has(m.id)}
                            onToggleExpand={() => toggleReportExpansion(m.id)}
                            onSubscribe={() => toggleSubscription(Number(activeSessionId), activeSession.name)}
                          />
                       </div>
                    </div>
                  ) : m.isAIResponse ? (
                    <div key={m.id} className="flex gap-3 animate-mac-fade">
                      <div className="w-10 h-10 rounded-full bg-lobster-orange flex items-center justify-center shadow-lg transform rotate-6 border border-white shrink-0">
                         <span className="text-xl">🦞</span>
                      </div>
                      <div className="flex flex-col gap-1 max-w-[85%]">
                         <div className="flex items-center gap-2 px-1">
                            <span className="text-[11px] font-bold text-lobster-orange">群龙虾</span>
                            <span className="text-[9px] bg-blue-50 text-qq-blue px-1 rounded font-bold border border-blue-100">AI 助手</span>
                            <span className="text-[10px] text-gray-400">{m.time}</span>
                         </div>
                         <div className={`${(m.sessionId === 4 || m.content === 'VUE3_SOLUTION') ? 'bg-[#FFFBE6] border-[#FFE58F]' : 'bg-white border-gray-100'} p-4 rounded-xl rounded-tl-none border shadow-sm space-y-4`}>
                             {m.content === 'VUE3_SOLUTION' ? (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-qq-blue font-black text-[15px]">
                                   <Zap size={16} className="text-amber-500" /> 技术解决方案：Vue3 响应式丢失
                                </div>
                                <p className="text-[13px] text-gray-700 leading-relaxed italic">
                                   检测到您在讨论 Props 解构问题。Vue3 中直接解构 Props 会切断与父组件的响应式连接。
                                </p>
                                <div className="space-y-1 bg-white/50 p-2 rounded-xl border border-amber-100/50">
                                   <div className="flex items-center justify-between group text-[13px] hover:bg-white/60 p-1.5 rounded-lg transition-all cursor-default relative">
                                      <div className="flex gap-3">
                                         <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                                         <span className="text-gray-800"><span className="font-bold">方案 A (推荐)：</span>使用 <code className="bg-gray-100 px-1 rounded text-red-500">toRefs(props)</code> 进行解构。</span>
                                      </div>
                                      <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-qq-blue transition-all cursor-pointer whitespace-nowrap ml-2">定位原文 ↗</span>
                                   </div>
                                   <div className="flex items-center justify-between group text-[13px] hover:bg-white/60 p-1.5 rounded-lg transition-all cursor-default relative">
                                      <div className="flex gap-3">
                                         <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                                         <span className="text-gray-800"><span className="font-bold">方案 B：</span>在模板直接访问 <code className="bg-gray-100 px-1 rounded text-red-500">props.xxx</code>。</span>
                                      </div>
                                      <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-qq-blue transition-all cursor-pointer whitespace-nowrap ml-2">定位原文 ↗</span>
                                   </div>
                                   <div className="flex items-center justify-between group text-[13px] hover:bg-white/60 p-1.5 rounded-lg transition-all cursor-default relative">
                                      <div className="flex gap-3">
                                         <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                                         <span className="text-gray-800"><span className="font-bold">进阶：</span>利用 <code className="bg-gray-100 px-1 rounded text-red-500">computed</code> 重新映射需要的值。</span>
                                      </div>
                                      <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-qq-blue transition-all cursor-pointer whitespace-nowrap ml-2">定位原文 ↗</span>
                                   </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[14px] text-gray-800 leading-relaxed font-medium">
                                {m.sessionId === 4 
                                  ? "根据群友讨论，这份《周末徒步攻略》已帮大家整理：1. 路线选避雷针径；2. 建议携带 2L 水；3. 下午 2 点紫外线最强。" 
                                  : "针对该群近 24 小时的讨论，关于 AGI 发展的未来共识达成于：大模型赋能将极大提升业务产研效率。"}
                              </p>
                            )}
                            
                            <div className="space-y-2">
                               <div className="flex justify-between text-[10px] text-gray-400 font-bold px-0.5 uppercase tracking-tight">
                                  <span>{m.sessionId === 4 ? '观点支持率' : (m.content === 'VUE3_SOLUTION' ? '社区共识度' : '观点热力图')}</span>
                                  <span>基数: {m.sessionId === 4 ? '18' : (m.content === 'VUE3_SOLUTION' ? '24' : '142')} 互动</span>
                               </div>
                               <div className="h-3 w-full flex rounded-full overflow-hidden shadow-inner bg-gray-100/50 border border-gray-200/20">
                                  <div style={{ width: m.sessionId === 4 ? '88%' : (m.content === 'VUE3_SOLUTION' ? '85%' : '75%') }} className={`${m.sessionId === 4 ? 'bg-amber-400' : (m.content === 'VUE3_SOLUTION' ? 'bg-blue-500' : 'bg-green-400')} h-full transition`}></div>
                                  <div style={{ width: m.sessionId === 4 ? '12%' : (m.content === 'VUE3_SOLUTION' ? '15%' : '15%') }} className={`${m.sessionId === 4 ? 'bg-gray-200' : (m.content === 'VUE3_SOLUTION' ? 'bg-gray-200' : 'bg-red-400')} h-full transition`}></div>
                                  {(m.sessionId !== 4 && m.content !== 'VUE3_SOLUTION') && <div style={{ width: '10%' }} className="bg-gray-300 h-full transition" title="观望"></div>}
                               </div>
                               <div className="flex justify-between text-[9px] text-gray-400 font-medium px-1">
                                  <span className={m.sessionId === 4 ? 'text-amber-600' : (m.content === 'VUE3_SOLUTION' ? 'text-blue-600' : 'text-green-600')}>{m.sessionId === 4 ? '推荐路线 A (88%)' : (m.content === 'VUE3_SOLUTION' ? 'toRefs 方案 (85%)' : '看好 (75%)')}</span>
                                  <span className={m.sessionId === 4 ? 'text-gray-400' : (m.content === 'VUE3_SOLUTION' ? 'text-gray-400' : 'text-red-500')}>{m.sessionId === 4 ? '建议观望 (12%)' : (m.content === 'VUE3_SOLUTION' ? '其他建议 (15%)' : '质疑/犹豫 (25%)')}</span>
                               </div>
                            </div>
    
                               <div className="pt-2 border-t border-gray-50 flex flex-col gap-2">
                                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                                     <span className="font-bold font-pingfang">💡 {m.sessionId === 4 ? '来源: 驴友老周 & 户外小马' : (m.content === 'VUE3_SOLUTION' ? '参考文档: Vue3 Reactivity Docs & StackOverflow' : '观点共建者: @产品小王 @资深开发')}</span>
                                     <span className="italic opacity-60 font-black shrink-0">群龙虾出品</span>
                                  </div>
                                  {m.content === 'VUE3_SOLUTION' && (
                                    <div className="flex justify-end">
                                      <span className="text-[9px] text-qq-blue cursor-pointer hover:underline flex items-center gap-1 font-bold">
                                        📍 查看该话题完整历史讨论
                                      </span>
                                    </div>
                                  )}
                               </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className={`flex gap-3 ${m.isSelf ? 'flex-row-reverse' : ''} animate-mac-fade`}>
                      <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-sm ring-1 ring-black/5 ${m.user === '群龙虾' ? 'bg-lobster-orange flex items-center justify-center' : ''}`}>
                         {m.user === '群龙虾' ? (
                            <span className="text-xl">🦞</span>
                         ) : (
                            <img src={m.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sys'} alt={m.user} />
                         )}
                      </div>
                      <div className={`flex flex-col gap-1 max-w-[70%] ${m.isSelf ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[11px] text-gray-400">{m.user}</span>
                          {m.tag && <span className={m.tagType === 'owner' ? 'tag-owner' : (m.tagType === 'admin' ? 'tag-admin' : 'tag-custom')}>{m.tag}</span>}
                        </div>
                        <div 
                          className="relative"
                          onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, visible: true }); }}
                        >
                          <div className={`px-4 py-2 rounded-xl text-[14px] leading-relaxed shadow-sm border ${
                            m.isSelf 
                              ? 'bg-qq-blue text-white border-blue-400 rounded-tr-none' 
                              : `${activeSession.isAssistant ? 'bg-white' : 'bg-white'} text-gray-800 border-gray-100 rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.03)]`
                          }`}>
                            {m.content.split(/(@群龙虾|@龙虾)/).map((part, index) => 
                              (part === '@群龙虾' || part === '@龙虾') 
                                ? <span key={index} className="text-blue-500 font-bold">{part}</span> 
                                : part
                            )}
                            {m.image && (
                              <div className="mt-2 rounded-lg overflow-hidden border border-gray-100/50 cursor-zoom-in group/img transition-all hover:brightness-95 active:scale-[0.99]">
                                 <img src={m.image} alt="Attachment" className="max-w-full h-auto transition-transform duration-500 group-hover/img:scale-105" />
                              </div>
                            )}
                            {m.file && (
                              <div className="mt-2 bg-white/50 border border-gray-100 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-white transition-colors">
                                 <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                    <span className="text-red-500 font-bold text-xs">PDF</span>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-bold text-gray-800 truncate leading-tight mb-0.5">{m.file.name}</div>
                                    <div className="text-[11px] text-gray-400 flex items-center gap-2">
                                       <span>{m.file.size}</span>
                                       <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                       <span className="text-green-500 flex items-center gap-0.5">
                                          <Bot size={10} /> 已安全扫描
                                       </span>
                                    </div>
                                 </div>
                              </div>
                            )}
                            {m.hasSuggestion && (
                               <div className="mt-2 text-[11px] bg-blue-50/80 text-qq-blue px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2 cursor-pointer hover:bg-blue-100 transition animate-mac-fade">
                                  <Bot size={12} /><span>{m.hasSuggestion}</span><ChevronRight size={12} />
                               </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))}
    
                {activeSessionId === 6 && showOnboarding && (
                   <div className="mx-4 my-2 animate-mac-fade relative group">
                      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-blue-500/5 overflow-hidden flex flex-col">
                         {/* Card Header */}
                         <div className="p-5 flex justify-between items-start pb-0">
                            <div className="space-y-1">
                               <h3 className="text-[17px] font-black text-gray-900 tracking-tight flex items-center gap-2">
                                 👋 欢迎加入 AI 产品共创营！
                               </h3>
                               <p className="text-[12px] text-gray-400 font-medium">这里是 AI Agent 落地实践的前沿阵地</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg text-[10px] text-gray-400 font-bold border border-gray-100">
                               <Eye size={12} /> 仅对你可见
                            </div>
                         </div>
    
                         {/* Card Content Grid */}
                         <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Group Info */}
                            <div className="space-y-3">
                               <div className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-wider">
                                  <MapPin size={12} /> 群名片
                               </div>
                               <div className="bg-blue-50/30 border border-blue-100/50 p-3 rounded-xl">
                                  <p className="text-[13px] text-gray-700 leading-relaxed font-medium">
                                    本群专注于 <span className="text-blue-600">AI Agent</span> 落地场景探索与工程实践，氛围极客、开放、高效。
                                  </p>
                               </div>
                            </div>
    
                            {/* Trending Topics */}
                            <div className="space-y-3">
                               <div className="flex items-center gap-2 text-[11px] font-black text-orange-500 uppercase tracking-wider">
                                  <Flame size={12} /> 核心能力
                               </div>
                               <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-[12px] text-gray-600 bg-gray-50/80 px-3 py-1.5 rounded-lg border border-gray-100 cursor-default hover:bg-white hover:border-orange-200 transition-all">
                                     <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> AI 实时萃取今日技术干货
                                  </div>
                                  <div className="flex items-center gap-2 text-[12px] text-gray-600 bg-gray-50/80 px-3 py-1.5 rounded-lg border border-gray-100 cursor-default hover:bg-white hover:border-orange-200 transition-all">
                                     <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> @群龙虾 开启智能知识检索
                                  </div>
                               </div>
                            </div>
                         </div>
    
                         {/* Active Members Area */}
                         <div className="px-5 pb-5 space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-black text-gray-400 uppercase tracking-wider">
                               <div className="flex items-center gap-2"><User size={12} /> 活跃面孔 </div>
                               <span className="text-[10px] lowercase font-normal italic opacity-60">最近1小时内活跃</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="flex -space-x-2.5">
                                  {[1, 2, 3, 4].map(idx => (
                                     <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm relative group/avatar">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${idx + 10}`} alt=""/>
                                     </div>
                                  ))}
                               </div>
                               <div className="text-[11px] text-gray-400 font-medium">
                                  等 <span className="text-gray-900 font-black">122</span> 位群成员正在共创中
                               </div>
                            </div>
                         </div>
    
                         {/* Action Footer */}
                         <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between w-full mt-4">
                               <div className="flex items-center gap-2 min-w-0">
                                  <button 
                                     type="button"
                                     onClick={() => {
                                        setGeneratedIntro("大家好，我是新入群的产品经理，对 AI Agent 场景落地很感兴趣，希望在这里能和各位大佬多多交流学习，甚至一起搞点有趣的小项目！🚀");
                                        setShowIntroPopover(true);
                                     }}
                                     className="bg-qq-blue text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                                  >
                                     <Sparkles size={14} className="shrink-0" /> 一键生成自我介绍
                                  </button>
                                  <button 
                                     type="button"
                                     onClick={() => setShowOnboardingReport(true)}
                                     className="bg-white text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-blue-200 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                                  >
                                     <BarChart2 size={14} className="text-blue-500 shrink-0" /> 群活跃报告
                                  </button>
                               </div>
                               <button 
                                  type="button"
                                  onClick={() => {
                                     if (typeof activeSessionId !== 'number') return;
                                     const groupName = activeSession.name.split(' (')[0];
                                     ensureLobsterPrivateSession(activeSessionId, groupName, 'onboarding');
                                     setGeneratedIntro(`我想更深入了解一下“${groupName}”的群规和玩法。`);
                                     setShowIntroPopover(true);
                                  }}
                                  className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer flex-shrink-0 bg-transparent border-0 shadow-none py-1 px-1 transition-colors whitespace-nowrap"
                               >
                                  💬 私聊群龙虾
                               </button>
                         </div>
    
                         {/* Private AI Report UI - Integrated below Onboarding Card */}
                         {showOnboardingReport && (
                           <div className="mt-4 animate-mac-fade px-5 pb-5">
                             <div className="bg-[#FFFBE6] border border-[#FFE58F] p-5 rounded-2xl shadow-xl shadow-amber-500/5 space-y-4 relative">
                                {/* Privacy Badge */}
                                <div className="absolute top-4 right-5 flex items-center gap-1.5 px-2 py-1 bg-white/50 rounded-lg text-[10px] text-amber-600/60 font-bold border border-amber-200/50">
                                   <Eye size={12} /> 仅对你可见
                                </div>
                                
                                <div className="flex items-center gap-2 text-qq-blue font-black text-[15px]">
                                   <BarChart2 size={16} className="text-blue-500" /> 群龙虾谈：AI 产品共创营 · 活跃简报
                                </div>
                                
                                <div className="space-y-3">
                                   <p className="text-[13px] text-gray-700 leading-relaxed font-medium">
                                      本周核心：1. AI 助手共萃取核心 <span className="font-bold text-orange-600">技术干货 12 条</span>；2. 知识库覆盖 <span className="font-bold text-blue-600">85%</span> 的高频产研问题；3. 智能回复命中率保持在 90% 以上。
                                   </p>
                                   <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 flex items-start gap-2.5">
                                      <Sparkles size={14} className="text-blue-400 mt-1 shrink-0" />
                                      <div className="text-[11px] text-blue-800 leading-relaxed font-medium">
                                         <span className="font-black">深度建议</span>：您可以尝试 <span className="font-bold text-blue-600">@群龙虾 针对特定问题提问</span>，系统将自动定位群内历史精华讨论。
                                      </div>
                                   </div>
                                </div>
                                
                                <div className="pt-4 border-t border-amber-200/30 space-y-3">
                                  <div className="flex justify-between text-[10px] text-amber-700/60 font-bold px-0.5 uppercase tracking-tight">
                                     <span>核心能力覆盖指数</span>
                                     <span>基数: 产研全场景</span>
                                  </div>
                                  <div className="h-3 w-full flex rounded-full overflow-hidden shadow-inner bg-amber-100/30 border border-amber-200/20">
                                     <div style={{ width: '92%' }} className="bg-orange-500 h-full transition-all duration-1000"></div>
                                     <div style={{ width: '8%' }} className="bg-orange-100 h-full transition-all duration-1000"></div>
                                  </div>
                                  <div className="flex justify-between text-[10px] font-bold px-1">
                                     <span className="text-orange-600">AI 萃取 & 智能检索 (85%)</span>
                                     <span className="text-amber-700/40">持续接入 (15%)</span>
                                  </div>
                                </div>
                                
                                <div className="pt-2 flex justify-between items-center text-[10px] text-amber-700/60">
                                   <span className="font-bold">来源: 开发者社区 & 本群共创精华</span>
                                   <span className="italic opacity-60 font-black">群龙虾出品</span>
                                </div>
                             </div>
                           </div>
                         )}
                      </div>
                   </div>
                )}
              </div>
    
              {/* Input Area */}
              <div className="border-t border-gray-200/30 flex flex-col p-4 bg-white shrink-0">
                 <div className="flex gap-5 mb-4 px-2 text-gray-500">
                    <Smile size={20} className="hover:text-qq-blue cursor-pointer" />
                    <Scissors size={20} className="hover:text-qq-blue cursor-pointer" />
                    <Folder size={20} className="hover:text-qq-blue cursor-pointer" />
                    <ImageIcon size={20} className="hover:text-qq-blue cursor-pointer" />
                    <Mic size={20} className="hover:text-qq-blue cursor-pointer" />
                    <Monitor size={20} className="hover:text-qq-blue cursor-pointer" />
                    <Box size={20} className="hover:text-qq-blue cursor-pointer" />
                 </div>
                  <div className="flex gap-2 relative">
                    {showIntroPopover && (
                      <div className="absolute -top-32 left-0 right-0 mx-2 bg-white border border-blue-100 rounded-2xl shadow-2xl p-4 animate-mac-fade z-50 flex flex-col gap-3">
                        <div className="flex justify-between items-center px-1">
                          <div className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-wider">
                            <Sparkles size={12} /> {activeSession.isAssistant ? 'AI 咨询建议' : 'AI 破冰建议'}
                          </div>
                          <X size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setShowIntroPopover(false)} />
                        </div>
                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/30 text-[13px] text-gray-700 leading-relaxed italic">
                          “{generatedIntro}”
                        </div>
                        <div className="flex justify-end gap-2 mt-1">
                           <button 
                             onClick={() => setShowIntroPopover(false)}
                             className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-gray-500 hover:bg-gray-100 transition"
                           >
                             重新生成
                           </button>
                           <button 
                             onClick={() => {
                               const sid = activeSessionId;
                               const inAssistantPrivate = activeSession.isAssistant === true;
                               const introBody = generatedIntro;
                               const introMsg: Message = {
                                 id: Date.now(),
                                 sessionId: sid,
                                 user: currentUserNickname,
                                 avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Self',
                                 content: introBody,
                                 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                 isSelf: true
                               };
                               setMessages(prev => [...prev, introMsg]);
                               setShowIntroPopover(false);
                               setShowOnboarding(false); // Close onboarding after intro
                               if (inAssistantPrivate) {
                                 const replyText = getDefaultPrivateLobsterMvpReply(introBody);
                                 window.setTimeout(() => {
                                   const lobsterMsg: Message = {
                                     id: Date.now() + 800,
                                     sessionId: sid,
                                     user: '群龙虾',
                                     avatar: '',
                                     content: replyText,
                                     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                     isSelf: false
                                   };
                                   setMessages(prev => [...prev, lobsterMsg]);
                                 }, 650);
                               }
                             }}
                             className="bg-qq-blue text-white px-4 py-1.5 rounded-lg text-[12px] font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 hover:scale-105 transition"
                           >
                             <Bot size={14} /> 确认并发送
                           </button>
                        </div>
                      </div>
                    )}
    
                    {activeSessionId === 5 && !inputText && (
                      <div 
                        onClick={() => setInputText('@群龙虾 帮我搜索并总结一下上周群里关于 Vue3 响应式丢失的解决方案。')}
                        className="absolute -top-11 left-0 bg-white/80 backdrop-blur-md border border-blue-200 text-blue-500 text-[12px] px-3.5 py-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-50 transition-all flex items-center gap-1.5 animate-bounce-subtle select-none whitespace-nowrap z-50 hover:scale-105 active:scale-95"
                      >
                         <Sparkles size={12} className="text-[#0099FF]" />
                         <span className="font-bold">点击快捷追问：帮我总结 Vue3 响应式方案...</span>
                      </div>
                    )}
                    {atMenuOpen && !activeSession.isAssistant && (
                      <div className="at-suggestion-menu shadow-2xl">
                        <div className="px-4 py-2 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100/50">选择提醒的人</div>
                        {isCurrentLobsterEnabled && (
                          <div className="at-suggestion-item group" onClick={() => { setInputText(prev => prev + '群龙虾 '); setAtMenuOpen(false); }}>
                            <div className="w-8 h-8 rounded-full bg-lobster-orange flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform flex-shrink-0">🦞</div>
                            <div className="flex flex-col min-w-0"><div className="flex items-center gap-1.5"><span className="at-suggestion-name">群龙虾</span><span className="ai-badge-sm">AI</span></div><div className="at-suggestion-desc truncate">智能摘要与知识库检索</div></div>
                          </div>
                        )}
                        {currentMembers.filter(m => !m.isAI).map(m => (
                          <div key={m.id} className="at-suggestion-item group" onClick={() => { setInputText(prev => prev + m.name + ' '); setAtMenuOpen(false); }}>
                            <img src={m.avatar} className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" alt=""/><div className="flex flex-col min-w-0"><span className="at-suggestion-name">{m.name}</span><div className="at-suggestion-desc truncate text-gray-400">{m.tag || '活跃成员'}</div></div>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea 
                      value={inputText}
                      onChange={e => {
                        const val = e.target.value;
                        setInputText(val);
                        if (activeSession.isAssistant) {
                          if (atMenuOpen) setAtMenuOpen(false);
                          return;
                        }
                        if (val.endsWith('@')) setAtMenuOpen(true);
                        else if (atMenuOpen && !val.includes('@')) setAtMenuOpen(false);
                      }}
                      placeholder="说点什么吧..."
                      className="flex-1 h-14 bg-transparent border-none outline-none resize-none text-[14px] leading-relaxed text-gray-800 placeholder:text-gray-300"
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    />
                 </div>
                 <div className="flex justify-end pt-2"><button onClick={handleSend} className="bg-qq-blue hover:bg-blue-600 text-white px-5 py-1.5 rounded-md text-[13px] font-bold shadow-sm active:scale-95 transition">发送</button></div>
              </div>
            </div>

            {/* Right Column: Info Drawer */}
            {!activeSession.isAssistant && (
              <div className="w-60 bg-white border-l border-gray-200 flex flex-col shrink-0 select-none animate-mac-fade">
                 <div className="p-4 border-b border-gray-200/30">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-[12px] font-bold text-gray-900">群公告</h3><ChevronRight size={14} className="text-gray-400 cursor-pointer" /></div>
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 italic"><p className="text-[12px] text-gray-500 leading-relaxed font-light">“欢迎来到{activeSession.name}，本群旨在分享行业动态...”</p></div>
                 </div>
                 <div className="flex-1 flex flex-col pt-4 overflow-hidden">
                    <div className="px-4 mb-3 flex justify-between items-center"><h3 className="text-[12px] font-bold text-gray-900 uppercase">群聊成员 {activeMessages.length > 50 ? '536' : '15'}</h3><Search size={14} className="text-gray-400 cursor-pointer" /></div>
                    <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                        {isCurrentLobsterEnabled && (
                          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-lobster-orange/5 transition">
                            <div className="w-9 h-9 rounded-full bg-lobster-orange flex items-center justify-center shadow-md border-2 border-white relative">
                              <span className="text-lg">🦞</span>
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="text-[13px] font-bold text-lobster-orange">群龙虾</span><span className="text-[9px] bg-blue-50 text-qq-blue px-1.5 py-0.5 rounded font-bold border border-blue-100">AI</span></div><div className="text-[10px] text-gray-400 truncate mt-0.5">🟢 正在萃取今日干货...</div></div>
                          </div>
                        )}
                        {currentMembers.filter(m => !m.isAI).map(m => (
                          <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100/50 transition">
                             <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm ring-1 ring-black/5">
                                {m.avatar.includes('http') ? <img src={m.avatar} alt=""/> : <span className="text-xl flex items-center justify-center h-full bg-orange-100">{m.avatar}</span>}
                             </div>
                             <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="text-[13px] font-medium text-gray-800 truncate">{m.name}</span>{m.tag && <span className={m.tagType === 'owner' ? 'tag-owner' : 'tag-admin'}>{m.tag}</span>}</div><p className="text-[10px] text-gray-400 truncate mt-0.5">活跃讨论中</p></div>
                          </div>
                        ))}
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 置于主窗口之后，避免被 mac-vibrancy/backdrop 层挡住导致无法点击与拖拽 */}
      <MVPChecklist />

      <LobsterConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        onConfirm={handleConfirmConfig} 
        onDisable={handleDisableLobster} 
        isEdit={isCurrentLobsterEnabled}
        initialConfig={typeof activeSessionId === 'number' ? groupConfigs[activeSessionId] : undefined}
        isReadOnly={currentUserRole === 'member'}
      />
      
      <GroupFilesAlbumModal 
        isOpen={isFilesAlbumModalOpen} 
        onClose={() => setIsFilesAlbumModalOpen(false)} 
        type={filesAlbumType}
        hasContentManagement={typeof activeSessionId === 'number' ? groupConfigs[activeSessionId]?.contentManagement : false}
        hasFileManagement={typeof activeSessionId === 'number' ? groupConfigs[activeSessionId]?.fileManagement : false}
      />

      <KnowledgeBaseModal 
        isOpen={isKBModalOpen} 
        onClose={() => setIsKBModalOpen(false)} 
        groupName={activeSession.name}
        sessionId={activeSessionId}
        onNavigateToPrivateChat={() => {
           if (typeof activeSessionId !== 'number') {
             setIsKBModalOpen(false);
             return;
           }
           const groupName = activeSession.name.split(' (')[0];
           ensureLobsterPrivateSession(activeSessionId, groupName, 'knowledge');
           setIsKBModalOpen(false);
           setGeneratedIntro(`我想更深入了解一下「${groupName}」的群规和玩法。`);
           setShowIntroPopover(true);
        }}
      />
    </div>
  );
}
