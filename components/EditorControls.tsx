import React, { useRef } from 'react';
import { TemplateStyle, VisualState } from '../types';

interface EditorControlsProps {
  visualData: VisualState;
  setVisualData: React.Dispatch<React.SetStateAction<VisualState>>;
  selectedTemplate: TemplateStyle;
  isRegeneratingText: boolean;
  handleRegenerateText: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  logoInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'backgroundImage' | 'logoImage') => void;
  // 👇 Новые пропсы
  onRegenerateField: (field: 'headline' | 'subHeadline') => void;
  regeneratingFields: { headline: boolean; subHeadline: boolean };
}

const EditorControls: React.FC<EditorControlsProps> = ({
  visualData,
  setVisualData,
  selectedTemplate,
  isRegeneratingText, // Больше не используется для полей визуала
  handleRegenerateText,
  fileInputRef,
  logoInputRef,
  handleImageUpload,
  onRegenerateField,     // Используем это
  regeneratingFields     // И это
}) => {
  
  // Ref для локальной загрузки аватарки автора
  const authorInputRef = useRef<HTMLInputElement>(null);

  const handleAuthorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVisualData(prev => ({
          ...prev,
          authorImage: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-5 pb-8">
        {/* ================= 0. TITLE (С кнопкой регенерации) ================= */}
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-900">Title</label>
                {/* 👇 Кнопка для Title */}
                <button 
                    onClick={() => onRegenerateField('headline')} 
                    disabled={regeneratingFields.headline} 
                    className="text-gray-400 hover:text-black transition-colors p-1 rounded hover:bg-gray-100"
                    title="Regenerate Title"
                >
                    <svg className={`w-4 h-4 ${regeneratingFields.headline ? 'animate-spin text-black' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
            </div>
            <textarea 
                rows={2}
                value={visualData.headline} 
                onChange={(e) => setVisualData(p => ({...p, headline: e.target.value}))} 
                className="w-full bg-[#F5F7F9] rounded-xl p-4 text-sm focus:ring-1 focus:ring-black/10 font-medium outline-none transition-all placeholder:text-gray-400 resize-none" 
                placeholder="Enter title" 
            />
        </div>

        {/* ================= 1. DESCRIPTION (С кнопкой регенерации) ================= */}
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-900">Description</label>
                {/* 👇 Кнопка для Description (SubHeadline) */}
                <button 
                    onClick={() => onRegenerateField('subHeadline')} 
                    disabled={regeneratingFields.subHeadline} 
                    className="text-gray-400 hover:text-black transition-colors p-1 rounded hover:bg-gray-100"
                    title="Regenerate Description"
                >
                    <svg className={`w-4 h-4 ${regeneratingFields.subHeadline ? 'animate-spin text-black' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
            </div>
            <textarea 
                rows={4} 
                value={visualData.subHeadline} 
                onChange={(e) => setVisualData(p => ({...p, subHeadline: e.target.value}))} 
                className="w-full bg-[#F5F7F9] rounded-xl p-4 text-sm focus:ring-1 focus:ring-black/10 font-medium outline-none resize-none transition-all placeholder:text-gray-400" 
                placeholder="Write or speak your drafts" 
            />
        </div>

        {/* ================= 2. AUTHOR PROFILE (Только для Minimal) ================= */}
        {selectedTemplate === TemplateStyle.MINIMAL_TYPOGRAPHY && (
            <div className="space-y-3 pt-2">
                <label className="text-sm font-bold text-gray-900">Author Profile</label>
                <div className="flex items-start gap-3">
                    {/* Аватарка */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <input 
                            type="file" 
                            ref={authorInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAuthorUpload}
                        />
                        <button 
                            onClick={() => authorInputRef.current?.click()}
                            className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 overflow-hidden hover:border-black transition-all relative group shadow-sm"
                        >
                            {visualData.authorImage ? (
                                <img src={visualData.authorImage} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v16m8-8H4"/></svg>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 4v16m8-8H4"/></svg>
                            </div>
                        </button>
                    </div>

                    {/* Поля */}
                    <div className="flex-1 space-y-2">
                        <input 
                            type="text"
                            value={visualData.authorName || ''}
                            onChange={(e) => setVisualData(prev => ({ ...prev, authorName: e.target.value }))}
                            className="w-full bg-[#F5F7F9] rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-black/10"
                            placeholder="Name"
                        />
                        <input 
                            type="text"
                            value={visualData.authorHandle || ''}
                            onChange={(e) => setVisualData(prev => ({ ...prev, authorHandle: e.target.value }))}
                            className="w-full bg-[#F5F7F9] rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-black/10"
                            placeholder="Handle (@...)"
                        />
                    </div>
                </div>
            </div>
        )}

{/* ================= 3. BACKGROUND ================= */}
        <div className="space-y-3 pt-2">
            <label className="text-sm font-bold text-gray-900">Background</label>
            {selectedTemplate === TemplateStyle.MINIMAL_TYPOGRAPHY ? (
                <div className="flex flex-col gap-3">
                    <div className="flex bg-[#F5F7F9] p-1 rounded-xl h-10">
                        <button onClick={() => setVisualData(p => ({...p, backgroundImage: null, backgroundColor: null}))} className={`flex-1 rounded-[8px] text-xs font-bold transition-all ${!visualData.backgroundImage && !visualData.backgroundColor ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>Grid</button>
                        <button onClick={() => fileInputRef.current?.click()} className={`flex-1 rounded-[8px] text-xs font-bold transition-all ${visualData.backgroundImage ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>Image</button>
                        <button onClick={() => setVisualData(p => ({...p, backgroundImage: null, backgroundColor: '#FFFFFF'}))} className={`flex-1 rounded-[8px] text-xs font-bold transition-all ${visualData.backgroundColor ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>Color</button>
                    </div>
                    {visualData.backgroundColor && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-300 p-1">
                            {['#FFFFFF', '#F5F5F7', '#E0F2FE', '#FCE7F3', '#FEF3C7', '#D1FAE5', '#EEEBFF'].map((color) => (
                                <button key={color} onClick={() => setVisualData(p => ({...p, backgroundColor: color}))} className={`w-8 h-8 rounded-full border border-black/5 shadow-sm transition-transform hover:scale-110 ${visualData.backgroundColor === color ? 'ring-2 ring-offset-2 ring-black' : ''}`} style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3.5 px-4 border border-gray-200 rounded-xl flex items-center gap-3 hover:bg-gray-50 transition-all text-sm font-bold text-gray-700 group bg-white">
                    <div className="w-5 h-5 flex items-center justify-center text-gray-900"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    <span>Add background</span>
                </button>
            )}
           
            {/* Компактный ZOOM слайдер (только если выбрана картинка) */}
            {visualData.backgroundImage && (
                <div className="mt-2 flex items-center gap-3 px-2 py-1 animate-in fade-in slide-in-from-top-1">
                    {/* Иконка лупы */}
                    <div className="text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                    </div>

                    {/* Слайдер */}
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={visualData.imageScale || 1}
                        onChange={(e) => setVisualData(prev => ({ 
                            ...prev, 
                            imageScale: parseFloat(e.target.value) 
                        }))}
                        className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black hover:accent-gray-800 transition-all"
                    />

                    {/* Проценты */}
                    <span className="text-xs font-medium text-gray-500 w-9 text-right tabular-nums">
                        {Math.round((visualData.imageScale || 1) * 100)}%
                    </span>
                </div>
            )}
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'backgroundImage')} />
        </div>
{/* ================= 4. LOGO ================= */}
<div className="space-y-3">
    <label className="text-sm font-bold text-gray-900">Logo</label>
    <div className="flex gap-2">
        {/* Основная кнопка загрузки/изменения */}
        <button 
            onClick={() => logoInputRef.current?.click()} 
            className="flex-1 py-3.5 px-4 border border-gray-200 rounded-xl flex items-center gap-3 hover:bg-gray-50 transition-all text-sm font-bold text-gray-700 group bg-white"
        >
            <div className="w-5 h-5 flex items-center justify-center text-gray-900">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </div>
            <span>{visualData.logoImage ? "Change logo" : "Add brand logo"}</span>
        </button>

        {/* Кнопка удаления (появляется, только если логотип загружен) */}
        {visualData.logoImage && (
            <button 
                onClick={() => setVisualData(prev => ({ ...prev, logoImage: null }))}
                className="w-12 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-all bg-white"
                title="Remove logo"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
    </div>
    
    <input 
        type="file" 
        ref={logoInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleImageUpload(e, 'logoImage')} 
    />
</div>

        {/* ================= 5. TYPOGRAPHY ================= */}
        <div className="space-y-3">
            <label className="text-sm font-bold text-gray-900">Typography</label>
            <div className="flex flex-col gap-3">
                <div className="flex gap-3 h-12">
                    <div className="flex-[3] relative group">
                        <select value={visualData.headlineSettings.fontFamily} onChange={(e) => setVisualData(p => ({...p, headlineSettings: {...p.headlineSettings, fontFamily: e.target.value}}))} className="w-full h-full appearance-none bg-white border border-gray-200 rounded-xl px-3 pr-8 text-sm font-medium text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer truncate">
                          <option value="sans">Inter (Default)</option>
                          <option value="'Plus Jakarta Sans', sans-serif">Google Sans</option>
                          <option value="'Encode Sans Expanded', sans-serif">Zalando Sans</option>
                          <option value="'Kode Mono', monospace">Kode Mono</option>
                          <option value="'Nunito', sans-serif">Nunito</option>
                          <option value="'DM Sans', sans-serif">DM Sans</option>
                          <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                          <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                          <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                    <div className="flex-[2] relative group">
                        <select value={visualData.headlineSettings.fontWeight || 700} onChange={(e) => setVisualData(p => ({...p, headlineSettings: {...p.headlineSettings, fontWeight: Number(e.target.value)}}))} className="w-full h-full appearance-none bg-white border border-gray-200 rounded-xl px-3 pr-8 text-sm font-medium text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer">
                          <option value="400">Regular</option>
                          <option value="500">Medium</option>
                          <option value="600">Semibold</option>
                          <option value="700">Bold</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                </div>
                <div className="flex gap-3 h-12">
                    <div className="flex-[2] relative group min-w-[80px]">
                        <input type="number" min="10" max="200" value={visualData.headlineSettings.fontSize} onChange={(e) => setVisualData(p => ({...p, headlineSettings: {...p.headlineSettings, fontSize: Number(e.target.value)}}))} className="w-full h-full bg-white border border-gray-200 rounded-xl pl-3 pr-8 text-sm font-medium text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-center" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">px</span>
                    </div>
                    <div className="flex-[2] relative group min-w-[80px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold tracking-widest pointer-events-none">AV</span>
                        <input type="number" step="1" value={Math.round(visualData.headlineSettings.letterSpacing * 100)} onChange={(e) => { const val = Number(e.target.value); setVisualData(p => ({...p, headlineSettings: {...p.headlineSettings, letterSpacing: val / 100}})); }} className="w-full h-full bg-white border border-gray-200 rounded-xl pl-9 pr-6 text-sm font-medium text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-center" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">%</span>
                    </div>
                    <div className="flex-[3] flex bg-white border border-gray-200 rounded-xl overflow-hidden divide-x divide-gray-100">
                        {['left', 'center', 'right'].map((align) => (
                             <button 
                                key={align} 
                                onClick={() => setVisualData(p => ({...p, headlineSettings: {...p.headlineSettings, textAlign: align as any}}))} 
                                className={`flex-1 flex items-center justify-center hover:bg-gray-50 transition-colors ${visualData.headlineSettings.textAlign === align ? 'text-black bg-gray-50' : 'text-gray-400'}`}
                             >
                                 {align === 'left' && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h12M3 18h18"/></svg>}
                                 {align === 'center' && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M3 18h18"/></svg>}
                                 {align === 'right' && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M9 12h12M3 18h18"/></svg>}
                             </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default EditorControls;
