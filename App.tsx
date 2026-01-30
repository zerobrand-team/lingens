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
  
  const {credits, spendCredit, openFeedbackModal, openLimitModal, hasClaimedBonus} = useCredits();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>(TemplateStyle.BOLD_TEXT_OVERLAY);
  const [visualData, setVisualData] = useState<VisualState>(DEFAULT_VISUAL_STATE);
  const [viewMode, setViewMode] = useState<'templates' | 'editor'>('templates');
  const [mobileTab, setMobileTab] = useState<'text' | 'image'>('text');

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
      } else if (!prev.backgroundImage && !prev.backgroundColor) {
        newData.backgroundImage = DEFAULT_VISUAL_STATE.backgroundImage;
      }
      return newData;
    });
  };

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

  const handleLogoClick = () => setShowLanding(true);

  const handleStartApp = () => {
    setShowLanding(false);
    if (!sessionStorage.getItem('has_seen_tutorial_v1')) {
      setShowHowItWorks(true);
      sessionStorage.setItem('has_seen_tutorial_v1', 'true');
    }
  };

  const saveToHistory = (post: string, visuals: VisualState, template: TemplateStyle) => {
    const updated = [{ id: Date.now().toString(), timestamp: Date.now(), postText: post, visualData: visuals, template }, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('zerobrand_history_v3', JSON.stringify(updated));
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setRawInput(prev => (prev && !prev.endsWith(' ') ? prev + ' ' + text : prev + text));
  }, []);

  const handleGenerate = async () => {
    if (!rawInput.trim()) return;
    if (!spendCredit()) {
      hasClaimedBonus ? openLimitModal() : openFeedbackModal();
      return;
    }
    setIsGenerating(true);
    try {
      const content = await generateLinkedInPost(rawInput, selectedLength);
      setGeneratedPost(content.postText);
      const newVisuals = { ...visualData, headline: content.headline, subHeadline: content.subHeadline };
      setVisualData(newVisuals);
      saveToHistory(content.postText, newVisuals, selectedTemplate);
      setIsDraftOpen(false);
      if (isMobile) setMobileTab('text');
      if (viewMode !== 'editor') setViewMode('templates');
    } catch (error) {
      alert("Error generating content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateText = async () => {
    if (!rawInput.trim() || !spendCredit()) {
      !rawInput.trim() ? null : (hasClaimedBonus ? openLimitModal() : openFeedbackModal());
      return;
    }
    setIsRegeneratingText(true);
    try {
      const newText = await regeneratePostText(rawInput, generatedPost, selectedLength);
      setGeneratedPost(newText);
    } catch (e) { console.error(e); } finally { setIsRegeneratingText(false); }
  };
  
  const handleRegenerateVisualField = async (field: 'headline' | 'subHeadline') => {
    const context = rawInput || generatedPost;
    if (!context) return;
    setRegeneratingFields(prev => ({ ...prev, [field]: true }));
    try {
      const newText = await regenerateVisualField(context, field);
      setVisualData(prev => ({ ...prev, [field]: newText }));
    } catch (error) { console.error(error); } finally { setRegeneratingFields(prev => ({ ...prev, [field]: false })); }
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
        const dataUrl = await toPng(exportRef.current, { cacheBust: true, width: 500, height: 625 });
        const link = document.createElement('a');
        link.download = `lingens-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        setIsDownloaded(true);
        setTimeout(() => setIsDownloaded(false), 2000);
      } catch (err) { alert("Error saving image."); }
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

  const renderMobileLayout = () => (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-[#E8EBF0]">
      <MobileHeader generatedPost={generatedPost} onLogoClick={handleLogoClick} />
      {generatedPost && (
        <div className="sticky top-0 z-50 bg-[#E8EBF0] pt-2">
          <div className="flex w-full border-b border-gray-300/50">
            {['text', 'image'].map((tab) => (
              <button key={tab} onClick={() => setMobileTab(tab as any)} className={`flex-1 pb-3 pt-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-[3px] ${mobileTab === tab ? 'text-black border-black' : 'text-gray-400 border-transparent'}`}>{tab}</button>
            ))}
          </div>
        </div>
      )}
      <div className={`px-4 pb-20 ${!generatedPost ? 'pt-10' : 'pt-6'}`}>
        <div className={`animate-in fade-in duration-300 space-y-4 ${(mobileTab !== 'text' && generatedPost) ? 'hidden' : 'block'}`}>
          <div className="bg-white rounded-[32px] shadow-sm p-6 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center pb-4 mb-2 border-b border-gray-200">
              <h2 className="text-2xl font-medium tracking-tight">{generatedPost ? 'Your LinkedIn post' : 'Write your raw idea'}</h2>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowHowItWorks(true)} className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 hover:text-black flex items-center justify-center text-[10px] font-bold">?</button>
                {generatedPost && <button onClick={() => setShowHistory(!showHistory)} className="text-gray-400 hover:text-black"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>}
              </div>
            </div>
            <div className={generatedPost ? 'border-b border-gray-200 pb-6 mb-4 mt-4' : ''}>
              {generatedPost && (
                <button onClick={() => setIsDraftOpen(!isDraftOpen)} className="flex items-center justify-between w-full text-left">
                  <span className="text-xs font-bold text-black uppercase tracking-widest">Your Draft</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDraftOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
              {(isDraftOpen || !generatedPost) && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-4">
                  <div className="bg-[#F5F7F9] rounded-[24px] p-4 mb-4 border border-transparent focus-within:bg-white focus-within:border-gray-200 transition-all">
                    <textarea className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 outline-none text-base placeholder:text-gray-400 leading-relaxed font-medium" placeholder="e.g. i don't know how to share my journey..." value={rawInput} onChange={(e) => setRawInput(e.target.value)} />
                    <div className="flex justify-end mt-1">
                      <span onClick={() => { setRawInput("I’m building a startup and constantly learning things the hard way.\nI want to share this on LinkedIn, but every time it sounds awkward or forced."); setTimeout(handleGenerate, 0); }} className="text-[12px] text-gray-400 underline cursor-pointer hover:text-black">Start with sample</span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between w-full mt-4">
                    <VoiceInput onTranscript={handleVoiceTranscript} selectedLang={inputLang} onLangChange={setInputLang} />
                    <div className="flex flex-col items-end gap-1">
                      <div className="h-[42px] min-w-[110px]"><GenerateButton onGenerate={handleGenerate} isGenerating={isGenerating} disabled={!rawInput} /></div>
                      <div className="relative group mr-1">
                        <select value={selectedLength} onChange={(e) => setSelectedLength(e.target.value as any)} className="appearance-none bg-transparent py-1 pl-2 pr-5 text-sm font-medium text-gray-400 focus:outline-none text-right">
                          <option value="Short">Short</option>
                          <option value="Thoughtful">Thoughtful</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {generatedPost && (
              <div ref={generatedSectionRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold text-black uppercase tracking-widest">Generated Text</span></div>
                <div className="bg-[#F5F7F9] rounded-[24px] p-6 mb-6">
                  <textarea ref={textareaRef} value={generatedPost} onChange={(e) => setGeneratedPost(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-gray-800 leading-relaxed text-base font-medium overflow-hidden min-h-[40px]" spellCheck="false" rows={1} />
                </div>
                <button onClick={handleCopyPost} className="h-[42px] w-full justify-center px-6 bg-black text-white rounded-[14px] font-bold text-sm flex items-center gap-2">{isCopied ? 'Copied' : 'Copy Text'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="min-h-screen w-full text-[#111] font-sans flex flex-col items-center pb-20 bg-[#E8EBF0]">
      <DesktopHeader generatedPost={generatedPost} onLogoClick={handleLogoClick} />
      <div className={`w-full max-w-[1700px] relative z-10 px-6 ${generatedPost ? 'py-8 grid grid-cols-12 gap-10 items-start' : 'min-h-[calc(100vh-100px)] flex items-center justify-center'}`}>
        <div className={`flex flex-col w-full transition-all duration-700 ${generatedPost ? 'col-span-5 sticky top-24 h-[calc(100vh-120px)]' : 'max-w-2xl h-auto'}`}>
          <div className="bg-white rounded-[40px] shadow-sm flex flex-col relative h-full overflow-hidden">
            <div className="px-6 pt-5 pb-4 flex justify-between items-center bg-white z-10 border-b border-gray-100 sticky top-0">
              <h2 className="text-[28px] font-medium tracking-tight">{generatedPost ? 'Your LinkedIn post' : 'Write your raw idea'}</h2>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowHowItWorks(true)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:text-black flex items-center justify-center text-xs font-bold">?</button>
                {generatedPost && <button onClick={() => setShowHistory(!showHistory)} className="text-gray-400 hover:text-black"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-6 pb-10">
              <div className={generatedPost ? 'border-b border-gray-200 pb-6 mb-6' : ''}>
                {generatedPost && (
                  <button onClick={() => setIsDraftOpen(!isDraftOpen)} className="flex items-center justify-between w-full text-left mb-4">
                    <span className="text-xs font-bold text-black uppercase tracking-widest">Your Draft</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDraftOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" /></svg>
                  </button>
                )}
                {(isDraftOpen || !generatedPost) && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="bg-[#F5F7F9] rounded-[24px] p-6 mb-4 border border-transparent focus-within:bg-white focus-within:border-gray-200 transition-all">
                      <textarea className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 outline-none text-[15px] font-medium placeholder:text-gray-400" placeholder="e.g. i don't know how to share..." value={rawInput} onChange={(e) => setRawInput(e.target.value)} />
                      <div className="flex justify-end mt-1">
                        <span onClick={() => { setRawInput("I’m building a startup and constantly learning things the hard way.\nI want to share this on LinkedIn, but every time it sounds awkward or forced."); setTimeout(handleGenerate, 0); }} className="text-[12px] text-gray-400 underline cursor-pointer hover:text-black">Start with sample</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between w-full mt-4">
                      <VoiceInput onTranscript={handleVoiceTranscript} selectedLang={inputLang} onLangChange={setInputLang} />
                      <div className="flex flex-col items-end gap-1">
                        <div className="h-[42px] min-w-[140px]"><GenerateButton onGenerate={handleGenerate} isGenerating={isGenerating} disabled={!rawInput} /></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {generatedPost && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <span className="text-xs font-bold text-black uppercase tracking-widest mb-4 block">Generated Text</span>
                  <div className="bg-[#F5F7F9] rounded-[24px] p-6 mb-4">
                    <textarea ref={textareaRef} value={generatedPost} onChange={(e) => setGeneratedPost(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-gray-800 text-base font-medium overflow-hidden min-h-[40px]" spellCheck="false" rows={1} />
                  </div>
                  <button onClick={handleCopyPost} className="h-[42px] px-6 bg-black text-white rounded-[14px] font-bold text-sm flex items-center gap-2">{isCopied ? 'Copied' : 'Copy Text'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {generatedPost && (
          <div className="flex flex-col col-span-7 sticky top-24 h-[calc(100vh-120px)] animate-in slide-in-from-right-8 fade-in duration-700">
            {viewMode === 'templates' ? (
              <div className="h-full flex flex-col overflow-y-auto custom-scrollbar pt-2 pb-10">
                <h2 className="text-[28px] font-medium mb-8 pl-1 tracking-tight">Pick a visual</h2>
                <div className="flex gap-5 flex-wrap">
                  {[TemplateStyle.MINIMAL_TYPOGRAPHY, TemplateStyle.BOTTOM_TEXT_IMAGE, TemplateStyle.BOLD_TEXT_OVERLAY].map((id) => (
                    <button key={id} onClick={() => handleTemplateSelect(id)} className="group text-center w-[160px] flex flex-col gap-3">
                      <div className="w-full aspect-[4/5] rounded-[24px] overflow-hidden shadow-sm group-hover:shadow-xl transition-all bg-gray-100 relative">
                        <img src={id === TemplateStyle.MINIMAL_TYPOGRAPHY ? tplMinimal : (id === TemplateStyle.BOTTOM_TEXT_IMAGE ? tplBottom : tplTop)} className="w-full h-full object-cover" alt="" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full flex-1 bg-white rounded-[40px] shadow-sm flex flex-col p-6 border border-gray-100 h-full">
                <button onClick={() => setViewMode('templates')} className="text-gray-400 hover:text-black font-medium text-sm flex items-center gap-1.5 mb-6">Back</button>
                <div className="flex-1 flex gap-6 overflow-hidden">
                  <div className="flex-1 bg-[#F2F4F7] rounded-[24px] flex items-center justify-center relative ring-4 ring-black/5">
                    <div className="scale-[0.65] origin-center bg-white"><VisualCard template={selectedTemplate} data={visualData} isEditable={true} /></div>
                  </div>
                  <div className="w-[340px] flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
                      <EditorControls visualData={visualData} setVisualData={setVisualData} selectedTemplate={selectedTemplate} isRegeneratingText={isRegeneratingText} handleRegenerateText={handleRegenerateText} fileInputRef={fileInputRef} logoInputRef={logoInputRef} handleImageUpload={handleImageUpload} onRegenerateField={handleRegenerateVisualField} regeneratingFields={regeneratingFields} />
                    </div>
                    <button onClick={handleDownloadImage} className="w-full bg-black text-white text-sm font-bold h-[42px] rounded-[14px] mt-6">{isDownloaded ? 'Downloaded' : 'Download image'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (showLanding) return <LandingPage onStart={handleStartApp} />;

  return (
    <>
      <style>{`
        @media (max-width: 768px) { body, html { overflow-y: scroll !important; height: auto !important; } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 20px; }
      `}</style>
      <div style={{ position: "fixed", top: 0, left: 0, width: "500px", height: "625px", zIndex: -100, opacity: 0, pointerEvents: "none" }}>
          <div ref={exportRef}><VisualCard template={selectedTemplate} data={visualData} isEditable={false} /></div>
      </div>
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      {showHowItWorks && <HowItWorks onClose={() => setShowHowItWorks(false)} />}
      <Toast show={toast.show} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
      <FeedbackModal /><LimitModal /><Analytics />
    </>
  );
};

export default App;
