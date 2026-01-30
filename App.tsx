import React, { useState, useRef, useCallback, useEffect } from 'react';
import LandingPage from './LandingPage';
import { MobileHeader, DesktopHeader } from './components/Header';
import { generateLinkedInPost, regeneratePostText, regenerateVisualField, PostLength } from './services/geminiService';
import { TemplateStyle, VisualState, HistoryItem } from './types';
import HowItWorks from './components/HowItWorks';
import VisualCard from './components/VisualCard';
import VoiceInput, { LanguageCode } from './components/VoiceInput';
import { toPng } from 'html-to-image';
import EditorControls from './components/EditorControls';
import Toast from './components/Toast';
import { useCredits } from './context/CreditContext';
import { GenerateButton } from './components/GenerateButton'; 
import { FeedbackModal } from './components/modals/FeedbackModal';
import { LimitModal } from './components/modals/LimitModal';
import { Analytics } from '@vercel/analytics/react';

const tplMinimal = "/templates/minimal.png";
const tplBottom = "/templates/bottom.png";
const tplTop = "/templates/top.png";

const DEFAULT_VISUAL_STATE: VisualState = {
  headline: "Don't be scared of LinkedIn",
  subHeadline: "",
  authorName: "Your name",
  authorHandle: "Role",
  backgroundImage: "https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=774&auto=format&fit=crop",
  authorImage: null,
  logoImage: null,
  imageScale: 1,
  imagePosition: { x: 0, y: 0 },
  headlineSettings: {
    fontSize: 56,
    lineHeight: 1,
    letterSpacing: -0.05,
    textAlign: 'center',
    fontFamily: 'sans',
    isItalic: false,
    isUnderline: false,
    color: '#FFFFFF',
    position: { x: 0, y: 0 }
  }
};

const App: React.FC = () => {
  // --- STATE ---
  const [showLanding, setShowLanding] = useState(true); 
  const [rawInput, setRawInput] = useState<string>('');
  const [systemInstruction, setSystemInstruction] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRegeneratingText, setIsRegeneratingText] = useState<boolean>(false);
  const [regeneratingFields, setRegeneratingFields] = useState({headline: false, subHeadline: false});
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDraftOpen, setIsDraftOpen] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [inputLang, setInputLang] = useState<LanguageCode>('en-US');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: 'copy' | 'download' }>({ show: false, type: 'copy' });
  const [selectedLength, setSelectedLength] = useState<PostLength>('Thoughtful');
  
  // Кредиты
  const {credits, spendCredit, openFeedbackModal, openLimitModal, hasClaimedBonus} = useCredits();

  // Визуал
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>(TemplateStyle.BOLD_TEXT_OVERLAY);
  const [visualData, setVisualData] = useState<VisualState>(DEFAULT_VISUAL_STATE);
  const [viewMode, setViewMode] = useState<'templates' | 'editor'>('templates');
  const [mobileTab, setMobileTab] = useState<'text' | 'image'>('text');

  // Refs
  const visualCardRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const generatedSectionRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTemplateSelect = (tId: TemplateStyle) => {
    setSelectedTemplate(tId);
    setViewMode('editor');

    setVisualData(prev => {
      const isMinimal = tId === TemplateStyle.MINIMAL_TYPOGRAPHY;

      let newData = {
        ...prev,
        headlineSettings: {
          ...prev.headlineSettings,
          textAlign: (isMinimal ? 'left' : 'center') as 'left' | 'center' | 'right'
        }
      };

      if (isMinimal) {
        newData.backgroundImage = null;
        newData.backgroundColor = null;
      } else {
        // Если выбрали другой шаблон и фона нет -> ВОЗВРАЩАЕМ картинку из констант
        if (!prev.backgroundImage && !prev.backgroundColor) {
          newData.backgroundImage = DEFAULT_VISUAL_STATE.backgroundImage;
        }
      }

      return newData;
    });
  };

  // --- LOGIC ---
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); 
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('zerobrand_history_v3');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [generatedPost, mobileTab]);

  // --- NAVIGATION ---
  const handleLogoClick = () => {
    setShowLanding(true);
  };

  // 2. Старт с лендинга
  const handleStartApp = () => {
    setShowLanding(false);
    
    const hasSeen = sessionStorage.getItem('has_seen_tutorial_v1');

    if (!hasSeen) {
      setShowHowItWorks(true);
      sessionStorage.setItem('has_seen_tutorial_v1', 'true');
    }
  };

  const saveToHistory = (post: string, visuals: VisualState, template: TemplateStyle) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      postText: post,
      visualData: visuals,
      template: template
    };
    const updated = [newItem, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('zerobrand_history_v3', JSON.stringify(updated));
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setRawInput(prev => {
        const prefix = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + prefix + text;
    });
  }, []);

  const handleGenerate = async () => {
    if (!rawInput.trim()) return;
    const isSpent = spendCredit();
    if (!isSpent) {
        if (!hasClaimedBonus) {
          openFeedbackModal();
        } else {
          openLimitModal();
        }
        return;
    }
    
    setIsGenerating(true);
    try {
      const content = await generateLinkedInPost(rawInput, selectedLength);
      setGeneratedPost(content.postText);
      const newVisuals = {
        ...visualData,
        headline: content.headline,
        subHeadline: content.subHeadline,
      };
      setVisualData(newVisuals);
      saveToHistory(content.postText, newVisuals, selectedTemplate);
      setIsDraftOpen(false);
      
      if (isMobile) {
        setMobileTab('text');
      }
      if (viewMode !== 'editor') {
         setViewMode('templates');
      }
    } catch (error) {
      alert("Error generating content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateText = async () => {
    if (!rawInput.trim()) return;
    const isSpent = spendCredit();
    if (!isSpent) {
        if (!hasClaimedBonus) {
          openFeedbackModal();
        } else {
          openLimitModal();
        }
        return;
    }
    setIsRegeneratingText(true);
    try {
        const newText = await regeneratePostText(rawInput, generatedPost, selectedLength);
        setGeneratedPost(newText);
    } catch (e) {
        console.error(e);
    } finally {
        setIsRegeneratingText(false);
    }
  };
  
  const handleRegenerateVisualField = async (field: 'headline' | 'subHeadline') => {
      const context = rawInput || generatedPost;
      if (!context) return;
      setRegeneratingFields(prev => ({ ...prev, [field]: true }));
      try {
          const newText = await regenerateVisualField(context, field);
          setVisualData(prev => ({ ...prev, [field]: newText }));
      } catch (error) {
          console.error(`Failed to regenerate ${field}`, error);
      } finally {
          setRegeneratingFields(prev => ({ ...prev, [field]: false }));
      }
   };

  const handleCopyPost = () => {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost);
    setIsCopied(true); 
    setTimeout(() => setIsCopied(false), 2000);
    setToast({ show: true, type: 'copy' });
  };

  const handleDownloadImage = useCallback(async () => {
    if (exportRef.current) {
      try {
        const dataUrl = await toPng(exportRef.current, {
            cacheBust: true,
            width: 500,
            height: 625,
            style: { transform: 'scale(1)', transformOrigin: 'top left' }
        });
        const link = document.createElement('a');
        link.download = `lingens-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        setIsDownloaded(true);
        setTimeout(() => setIsDownloaded(false), 2000);
      } catch (err) {
        console.error("Download failed", err);
        alert("Error saving image.");
      }
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'backgroundImage' | 'logoImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVisualData(p => ({ ...p, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  // =========================================================
  // RENDER: MOBILE
  // =========================================================
  const renderMobileLayout = () => {
    return (
      <div className={`min-h-screen w-full overflow-x-hidden flex flex-col bg-[#E8EBF0]`}>

        <MobileHeader 
            generatedPost={generatedPost} 
            onLogoClick={handleLogoClick} 
        />

        {/* Sticky Header with Tabs */}
        {generatedPost && (
          <div className="sticky top-0 z-50 bg-[#E8EBF0] pt-2">
             <div className="flex w-full border-b border-gray-300/50">
                <button 
                  onClick={() => setMobileTab('text')} 
                  className={`flex-1 pb-3 pt-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-[3px] ${
                    mobileTab === 'text' 
                      ? 'text-black border-black' 
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  Text
                </button>
                <button 
                  onClick={() => setMobileTab('image')} 
                  className={`flex-1 pb-3 pt-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-[3px] ${
                    mobileTab === 'image' 
                      ? 'text-black border-black' 
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  Image
                </button>
             </div>
          </div>
        )}

        {/* Content Area */}
        <div className={`px-4 pb-20 ${!generatedPost ? 'pt-10' : 'pt-6'}`}>
          
        {/* TAB: TEXT */}
            <div className={`animate-in fade-in duration-300 space-y-4 ${
              (mobileTab !== 'text' && generatedPost) ? 'hidden' : 'block'
            }`}>
              <div className="bg-white rounded-[32px] shadow-sm p-6 flex flex-col relative overflow-hidden">
                    
                    {/* ЗАГОЛОВОК + КНОПКИ */}
                    <div className="flex justify-between items-center pb-4 mb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-medium tracking-tight">
                            {generatedPost ? 'Your LinkedIn post' : 'Write your raw idea'}
                        </h2>
                        
                        <div className="flex items-center gap-3">
                           {/* КНОПКА ВОПРОСА */}
                           <button 
                             onClick={() => setShowHowItWorks(true)}
                             className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 hover:text-black hover:bg-gray-200 transition-colors flex items-center justify-center text-[10px] font-bold"
                           >
                             ?
                           </button>

                           {/* ИКОНКА ИСТОРИИ */}
                           {generatedPost && (
                                <button onClick={() => setShowHistory(!showHistory)} className="text-gray-400 hover:text-black transition-colors">
                                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                           )}
                        </div>
                    </div>

                    {/* БЛОК ЧЕРНОВИКА */}
                    <div className={`transition-all duration-300 ${generatedPost ? 'border-b border-gray-200 pb-6 mb-4 mt-4' : ''}`}>
                        {generatedPost && (
                            <button 
                                onClick={() => setIsDraftOpen(!isDraftOpen)}
                                className="flex items-center justify-between w-full text-left group"
                            >
                                <span className="text-xs font-bold text-black uppercase tracking-widest transition-colors">
                                    Your Draft
                                </span>
                                <svg 
                                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDraftOpen ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        )}

                        {(isDraftOpen || !generatedPost) && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-4">
                                <div className="bg-[#F5F7F9] rounded-[24px] p-4 mb-4 border border-transparent focus-within:bg-white focus-within:border-gray-200 transition-all">
                                    <textarea 
                                        className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 outline-none text-base placeholder:text-gray-400 leading-relaxed font-medium"
                                        placeholder="Messy thoughts are fine. Nobody will see this."
                                        value={rawInput}
                                        onChange={(e) => setRawInput(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex items-start justify-between w-full mt-4">
                                    <div className="flex-shrink-0 ">
                                       <VoiceInput 
                                            onTranscript={handleVoiceTranscript}
                                            selectedLang={inputLang}
                                            onLangChange={setInputLang}
                                       />
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <div className="h-[42px] min-w-[110px]">
                                           <GenerateButton 
                                                onGenerate={handleGenerate}
                                                isGenerating={isGenerating}
                                                disabled={!rawInput}
                                           />
                                        </div>

                                        <div className="relative group mr-1">
                                            <select
                                                value={selectedLength}
                                                onChange={(e) => setSelectedLength(e.target.value as PostLength)}
                                                className="appearance-none bg-transparent py-1 pl-2 pr-5 text-sm font-medium text-gray-400 hover:text-black cursor-pointer focus:outline-none transition-colors text-right"
                                            >
                                                <option value="Short">Short</option>
                                                <option value="Thoughtful">Thoughtful</option>
                                            </select>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div> 
                                </div>

                                {showHistory && (
                                    <div className="absolute inset-0 bg-white z-50 p-6 flex flex-col animate-in fade-in duration-200">
                                       <div className="flex justify-between items-center mb-6">
                                           <h3 className="text-2xl font-medium text-black">History</h3>
                                           <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-black text-sm font-bold">
                                               Close
                                           </button>
                                       </div>
                                       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                                            {history.map(item => (
                                                <button key={item.id} onClick={() => { setGeneratedPost(item.postText); setVisualData(item.visualData); setSelectedTemplate(item.template); setShowHistory(false); }} className="w-full p-4 bg-[#F5F7F9] rounded-[20px] hover:bg-gray-100 transition-all text-left">
                                                    <p className="text-sm font-bold truncate text-black">{item.visualData.headline || "Untitled"}</p>
                                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">{item.postText}</p>
                                                </button>
                                            ))}
                                       </div>
                                    </div>
                                )}
                            </div> 
                        )}
                    </div>

                    {/* БЛОК РЕЗУЛЬТАТА */}
                    {generatedPost && (
                        <div ref={generatedSectionRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-black uppercase tracking-widest">
                                    Generated Text
                                </span>
                                <div className="flex items-center">
                                    <div className="relative group mr-1">
                                        <select
                                            value={selectedLength}
                                            onChange={(e) => setSelectedLength(e.target.value as PostLength)}
                                            className="appearance-none bg-transparent py-1 pl-2 pr-5 text-[13px] font-medium text-gray-400 hover:text-black cursor-pointer focus:outline-none transition-colors text-right"
                                        >
                                            <option value="Short">Short</option>
                                            <option value="Thoughtful">Thoughtful</option>
                                        </select>
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="w-[1px] h-3 bg-gray-200 mx-2"></div>
                                    <div className="flex items-center gap-1 font-medium text-sm text-gray-400 select-none">
                                        <span>{credits}</span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#FBBF24" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="w-[1px] h-3 bg-gray-200 mx-2"></div>
                                    <button 
                                        onClick={handleRegenerateText} 
                                        disabled={isRegeneratingText}
                                        className="text-gray-400 hover:text-black transition-colors"
                                    >
                                        <svg className={`w-4 h-4 ${isRegeneratingText ? 'animate-spin text-black' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-[#F5F7F9] rounded-[24px] p-6 mb-6">
                                <textarea
                                    ref={textareaRef}
                                    value={generatedPost}
                                    onChange={(e) => setGeneratedPost(e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-gray-800 leading-relaxed text-base font-medium overflow-hidden min-h-[40px]"
                                    spellCheck="false"
                                    rows={1}
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <button 
                                    onClick={handleCopyPost} 
                                    className="h-[42px] w-full justify-center px-6 bg-black text-white rounded-[14px] font-bold text-sm transition-all active:scale-95 flex items-center gap-2
                                    border border-transparent bg-no-repeat bg-cover bg-center bg-origin-border hover:border-black/20 active:scale-[0.98]"
                                >
                                    {isCopied ? <span>Copied</span> : <span>Copy Text</span>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

          {/* TAB: IMAGE */}
          {generatedPost && mobileTab === 'image' && (
            <div className="animate-in fade-in duration-300">
               {viewMode === 'templates' ? (
                 <div className="pb-10">
                    <h2 className="text-2xl font-medium mb-6 px-1">Pick a visual</h2>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {[
                          { id: TemplateStyle.MINIMAL_TYPOGRAPHY, name: "Minimal Grid", thumbnail: tplMinimal },
                          { id: TemplateStyle.BOTTOM_TEXT_IMAGE, name: "Bottom Caption", thumbnail: tplBottom },
                          { id: TemplateStyle.BOLD_TEXT_OVERLAY, name: "Top Caption", thumbnail: tplTop }
                        ].map((t) => (
                          <button 
                              key={t.id} 
                              onClick={() => handleTemplateSelect(t.id)}
                              className="group text-left w-full flex flex-col gap-3"
                          >
                              <div className="w-full aspect-[4/5] rounded-[24px] overflow-hidden shadow-sm group-hover:shadow-xl transition-all ring-1 ring-black/5 bg-gray-100 relative">
                                  <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover relative z-10" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 group-hover:text-black">{t.name}</span>
                          </button>
                        ))}
                    </div>
                 </div>
               ) : (
                 <div className="bg-white rounded-[32px] shadow-sm p-4 border border-gray-100">
                    <div className="mb-4 flex items-center">
                        <button onClick={() => setViewMode('templates')} className="text-gray-400 hover:text-black font-medium text-sm transition-colors flex items-center gap-1.5">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                           Back
                        </button>
                    </div>

                    <div className="w-full bg-[#F2F4F7] rounded-[24px] flex items-center justify-center relative overflow-hidden ring-4 ring-black/5 aspect-[4/5] mb-8 pointer-events-none">
                        <div className="scale-[0.55] shadow-2xl origin-center bg-white relative z-10">
                            <VisualCard template={selectedTemplate} data={visualData} isEditable={false} />
                        </div>
                    </div>

                    <button 
                        onClick={handleDownloadImage} 
                        className="w-full bg-black text-white font-bold mb-8 h-[42px] rounded-[14px] hover:bg-gray-800 transition-all flex items-center justify-between px-6 active:scale-[0.98] shadow-lg"
                    >
                        {isDownloaded ? <span>Downloaded</span> : <span>Download image</span>}
                    </button>

                    <EditorControls 
                      visualData={visualData}
                      setVisualData={setVisualData}
                      selectedTemplate={selectedTemplate}
                      isRegeneratingText={isRegeneratingText}
                      handleRegenerateText={handleRegenerateText}
                      fileInputRef={fileInputRef}
                      logoInputRef={logoInputRef}
                      handleImageUpload={handleImageUpload}
                      onRegenerateField={handleRegenerateVisualField}
                      regeneratingFields={regeneratingFields}
                    />
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================
  // RENDER: DESKTOP
  // =========================================================
  const renderDesktopLayout = () => {
    return (
      <div className={`min-h-screen w-full text-[#111] font-sans flex flex-col items-center pb-20 bg-[#E8EBF0]`}>
        
        {/* ПЕРЕДАЕМ onLogoClick СЮДА */}
        <DesktopHeader 
            generatedPost={generatedPost} 
            onLogoClick={handleLogoClick}
        />

        <div className={`w-full max-w-[1700px] relative z-10 px-6 ${generatedPost ? 'py-8 grid grid-cols-12 gap-10 items-start' : 'min-h-[calc(100vh-100px)] flex items-center justify-center'}`}>
            
        {/* Left Column (Text Editor) */}
        <div className={`flex flex-col w-full transition-all duration-700 ${generatedPost ? 'col-span-5 sticky top-24 h-[calc(100vh-120px)]' : 'max-w-2xl h-auto'}`}>
            <div className="bg-white rounded-[40px] shadow-sm flex flex-col relative h-full overflow-hidden">
                
                  {/* Header */}
                  <div className="px-6 pt-5 pb-4 flex justify-between items-center bg-white z-10 border-b border-gray-100 sticky top-0">
                      <h2 className="text-[28px] font-medium tracking-tight">
                      {generatedPost ? 'Your LinkedIn post' : 'Write your raw idea'}
                      </h2>
                      
                      <div className="flex items-center gap-3">
                          <button 
                              onClick={() => setShowHowItWorks(true)}
                              className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:text-black hover:bg-gray-200 transition-colors flex items-center justify-center text-xs font-bold"
                          >
                              ?
                          </button>

                          {generatedPost && (
                              <button onClick={() => setShowHistory(!showHistory)} className="text-gray-400 hover:text-black transition-colors">
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                          )}
                      </div>
                  </div>
                
                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-6 pb-10">
                    
                    {/* 1. YOUR DRAFT SECTION */}
                    <div className={`transition-all duration-300 ${generatedPost ? 'border-b border-gray-200 pb-6 mb-6' : ''}`}>
                        
                        {generatedPost && (
                            <button 
                                onClick={() => setIsDraftOpen(!isDraftOpen)}
                                className="flex items-center justify-between w-full text-left group"
                            >
                                <span className="text-xs font-bold text-black uppercase tracking-widest mb-1 transition-colors">Your Draft</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDraftOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        )}

                        {(isDraftOpen || !generatedPost) && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="bg-[#F5F7F9] rounded-[24px] p-6 mb-4 border border-transparent focus-within:bg-white focus-within:border-gray-200 transition-all">
                                    <textarea 
                                        className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 outline-none text-[15px] font-medium placeholder:text-gray-400"
                                        placeholder="Messy thoughts are fine. Nobody will see this."
                                        value={rawInput}
                                        onChange={(e) => setRawInput(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex items-start justify-between w-full mt-4">
                                    <div className="flex-shrink-0 pt-1">
                                        <VoiceInput 
                                          onTranscript={handleVoiceTranscript}
                                          selectedLang={inputLang}
                                          onLangChange={setInputLang}
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="h-[42px] min-w-[140px]">
                                            <GenerateButton 
                                                onGenerate={handleGenerate}
                                                isGenerating={isGenerating}
                                                disabled={!rawInput}
                                            />
                                        </div>

                                        <div className="relative group mr-1">
                                            <select
                                                value={selectedLength}
                                                onChange={(e) => setSelectedLength(e.target.value as PostLength)}
                                                className="appearance-none bg-transparent py-1 pl-2 pr-5 text-[13px] font-medium text-gray-400 hover:text-black cursor-pointer focus:outline-none transition-colors text-right"
                                            >
                                                <option value="Short">Short</option>
                                                <option value="Thoughtful">Thoughtful</option>
                                            </select>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. GENERATED TEXT SECTION */}
                    {generatedPost && (
                    <div ref={generatedSectionRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-black uppercase tracking-widest">
                                Generated Text
                            </span>

                            <div className="flex items-center">
                                <div className="relative group mr-1">
                                    <select
                                        value={selectedLength}
                                        onChange={(e) => setSelectedLength(e.target.value as PostLength)}
                                        className="appearance-none bg-transparent py-1 pl-2 pr-5 text-[13px] font-medium text-gray-400 hover:text-black cursor-pointer focus:outline-none transition-colors text-right"
                                    >
                                        <option value="Short">Short</option>
                                        <option value="Thoughtful">Thoughtful</option>
                                    </select>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="w-[1px] h-3 bg-gray-200 mx-3"></div>

                                <div className="flex items-center gap-1 font-medium text-sm text-gray-400 select-none">
                                    <span>{credits}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#FBBF24" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>

                                <div className="w-[1px] h-3 bg-gray-200 mx-3"></div>

                                <button 
                                    onClick={handleRegenerateText} 
                                    disabled={isRegeneratingText}
                                    className="text-gray-400 hover:text-black transition-colors"
                                >
                                    <svg className={`w-4 h-4 ${isRegeneratingText ? 'animate-spin text-black' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                            
                            <div className="bg-[#F5F7F9] rounded-[24px] p-6 mb-4">
                                <textarea 
                                    ref={textareaRef} 
                                    value={generatedPost} 
                                    onChange={(e) => setGeneratedPost(e.target.value)} 
                                    className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-gray-800 text-base font-medium overflow-hidden min-h-[40px]" 
                                    spellCheck="false" 
                                    rows={1} 
                                />
                            </div>
                            <div className="flex justify-between items-center mt-6">
                                <button 
                                    onClick={handleCopyPost} 
                                    className="h-[42px] px-6 bg-black text-white rounded-[14px] font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {isCopied ? (
                                      <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Copied</span>
                                      </>
                                  ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span>Copy text</span>
                                    </>
                                  )}
                                </button>
                            </div>
                           </div>
                        )}
                    </div>

                    {/* History Panel */}
                    {showHistory && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 p-10 flex flex-col animate-in fade-in duration-200">
                           <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-medium text-black">History</h3><button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-black text-sm font-bold">Close</button></div>
                           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                               {history.length === 0 && (
                                   <div className="flex flex-col items-center justify-center mt-20 select-none">
                                        <div className="w-24 h-24 bg-white flex items-center justify-center mb-3">
                                             <svg className="w-20 h-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                             </svg>
                                        </div>
                                        <p className="text-sm font-medium text-gray-400">History is empty</p>
                                   </div>
                               )}
                               {history.map(item => (
                                   <button key={item.id} onClick={() => { setGeneratedPost(item.postText); setVisualData(item.visualData); setSelectedTemplate(item.template); setShowHistory(false); }} className="w-full p-4 bg-[#F5F7F9] rounded-[20px] hover:bg-gray-100 transition-all text-left">
                                        <p className="text-sm font-bold truncate text-black">{item.visualData.headline || "Untitled"}</p>
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{item.postText}</p>
                                   </button>
                               ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column (Image Editor) */}
            {generatedPost && (
                <div className="flex flex-col col-span-7 sticky top-24 h-[calc(100vh-120px)] animate-in slide-in-from-right-8 fade-in duration-700">
                    {viewMode === 'templates' ? (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-10">
                                <h2 className="text-[28px] font-medium mb-8 pl-1 tracking-tight">Pick a visual</h2>
                                <div className="flex gap-5 flex-wrap justify-start">
                                    {[
                                      { id: TemplateStyle.MINIMAL_TYPOGRAPHY, name: "Minimal Grid", thumbnail: tplMinimal },
                                      { id: TemplateStyle.BOTTOM_TEXT_IMAGE, name: "Bottom Caption", thumbnail: tplBottom },
                                      { id: TemplateStyle.BOLD_TEXT_OVERLAY, name: "Top Caption", thumbnail: tplTop }
                                    ].map((t) => (
                                      <button 
                                          key={t.id} 
                                          onClick={() => handleTemplateSelect(t.id)}
                                          className="group text-center w-[160px] flex flex-col gap-3"
                                      >
                                          <div className="w-full aspect-[4/5] rounded-[24px] overflow-hidden shadow-sm group-hover:shadow-xl transition-all group-hover:-translate-y-1 ring-1 ring-black/5 bg-gray-100 relative">
                                              <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover relative z-10" />
                                          </div>
                                          <span className="text-sm font-medium text-gray-900 group-hover:text-black">{t.name}</span>
                                      </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full w-full flex flex-col animate-in slide-in-from-right-4 duration-500">
                            <div className="w-full flex-1 bg-white rounded-[40px] shadow-sm overflow-hidden flex flex-col p-6 border border-gray-100 h-full">
                                <div className="mb-6 flex items-center flex-shrink-0">
                                    <button onClick={() => setViewMode('templates')} className="text-gray-400 hover:text-black font-medium text-sm transition-colors flex items-center gap-1.5"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Back</button>
                                </div>
                                <div className="flex-1 flex gap-6 overflow-hidden h-full">
                                    <div className="flex-1 bg-[#F2F4F7] rounded-[24px] flex items-center justify-center relative overflow-hidden ring-4 ring-black/5">
                                        <div className="scale-[0.65] shadow-2xl origin-center bg-white relative z-10">
                                            <VisualCard ref={visualCardRef} template={selectedTemplate} data={visualData} isEditable={true} onImageUpdate={(pos) => setVisualData(p => ({...p, imagePosition: pos}))} onTextDragUpdate={(pos) => setVisualData(p => ({...p, headlineSettings: {...p.headlineSettings, position: pos}}))} />
                                        </div>
                                    </div>
                                    <div className="w-[340px] flex flex-col h-full relative">
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 px-1">
                                            <EditorControls 
                                              visualData={visualData}
                                              setVisualData={setVisualData}
                                              selectedTemplate={selectedTemplate}
                                              isRegeneratingText={isRegeneratingText}
                                              handleRegenerateText={handleRegenerateText}
                                              fileInputRef={fileInputRef}
                                              logoInputRef={logoInputRef}
                                              handleImageUpload={handleImageUpload}
                                              onRegenerateField={handleRegenerateVisualField}
                                              regeneratingFields={regeneratingFields}
                                            />
                                        </div>
                                        <div className="pt-6 mt-auto bg-white sticky bottom-0 z-20 pb-0 border-t border-transparent">
                                            <button 
                                                onClick={handleDownloadImage} 
                                                className="w-full bg-black text-white text-sm font-bold h-[42px] rounded-[14px] hover:bg-gray-800 transition-all flex items-center justify-between px-6 active:scale-[0.98] shadow-lg"
                                            >
                                                {isDownloaded ? <span>Downloaded</span> : <span>Download image</span>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    );
  };

  // --- RENDER CONDITION ---
  
  if (showLanding) {
      return <LandingPage onStart={handleStartApp} />;
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
            body, html {
                overflow-y: scroll !important;
                -webkit-overflow-scrolling: touch !important;
                height: auto !important;
                position: relative !important;
            }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 20px;
        }
      `}</style>

      {/* Hidden Export Layer */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "500px", height: "625px", zIndex: -100, opacity: 0, pointerEvents: "none" }}>
          <div ref={exportRef}> 
             <VisualCard template={selectedTemplate} data={visualData} isEditable={false} />
          </div>
      </div>

      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      
      {showHowItWorks && (
        <HowItWorks onClose={() => setShowHowItWorks(false)} />
      )}
      
      <Toast 
        show={toast.show} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />

      <FeedbackModal />
      <LimitModal />
      <Analytics />

    </>
  );
};

export default App;
};

export default App;
