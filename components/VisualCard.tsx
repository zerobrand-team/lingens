import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { TemplateStyle, VisualState } from '../types.ts';

// Ссылка на дефолтный фон из App.tsx. 
// Мы используем её, чтобы понять: это пользователь загрузил фото или это просто "заглушка".
const DEFAULT_BG_URL = "https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop";

interface VisualCardProps {
  template: TemplateStyle;
  data: VisualState;
  onImageUpdate?: (updates: { x: number; y: number }) => void;
  onTextDragUpdate?: (updates: { x: number; y: number }) => void;
  isEditable?: boolean;
}

const VisualCard = forwardRef<HTMLDivElement, VisualCardProps>(({ 
  template, 
  data, 
  onImageUpdate, 
  onTextDragUpdate, 
  isEditable = false 
}, ref) => {
  const [dragTarget, setDragTarget] = useState<'background' | 'text' | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    setDragTarget('background');
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: data.imagePosition.x, y: data.imagePosition.y };
  };

  const handleTextMouseDown = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    setDragTarget('text');
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: data.headlineSettings.position.x, y: data.headlineSettings.position.y };
  };

  useEffect(() => {
    if (!dragTarget) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      if (dragTarget === 'background' && onImageUpdate) {
        onImageUpdate({
          x: initialPos.current.x + dx,
          y: initialPos.current.y + dy
        });
      } else if (dragTarget === 'text' && onTextDragUpdate) {
        onTextDragUpdate({
          x: initialPos.current.x + dx,
          y: initialPos.current.y + dy
        });
      }
    };

    const handleMouseUp = () => {
      setDragTarget(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragTarget, onImageUpdate, onTextDragUpdate]);

  const renderRichText = (text: string, overrides?: { color?: string, textAlign?: any, fontSize?: number }) => {
    if (!text) return null;
    const { fontSize, lineHeight, letterSpacing, textAlign, fontFamily, isItalic, isUnderline, color, position } = data.headlineSettings;

    const parts = text.split('*');
    
    const finalColor = overrides?.color || color;
    const finalAlign = overrides?.textAlign || textAlign;
    const finalSize = overrides?.fontSize || fontSize;

    const style: React.CSSProperties = {
        fontSize: `${finalSize}px`,
        lineHeight: lineHeight,
        letterSpacing: `${letterSpacing}em`,
        textAlign: finalAlign,
        fontFamily: fontFamily === 'sans' ? '"Inter", sans-serif' : fontFamily,
        fontStyle: isItalic ? 'italic' : 'normal',
        textDecoration: isUnderline ? 'underline' : 'none',
        color: finalColor,
        transform: overrides ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        cursor: isEditable ? (dragTarget === 'text' ? 'grabbing' : 'grab') : 'default',
        width: '100%',
        position: 'relative', 
        userSelect: 'none', 
        fontWeight: (overrides as any)?.fontWeight || data.headlineSettings.fontWeight || 600,
        display: 'block',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
    };

    return (
      <div 
        onMouseDown={!overrides ? handleTextMouseDown : undefined}
        style={style}
        className="antialiased"
      >
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
                <span key={index} className="border-b-[0.1em] border-current box-decoration-clone pb-[0.02em]">
                    {part}
                </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  const Logo = ({ colorClass = "text-black" }: { colorClass?: string }) => (
    <div className={`flex items-center justify-start gap-2 font-bold tracking-tight text-base ${colorClass} antialiased h-8`}>
      {data.logoImage ? (
        <img src={data.logoImage} alt="Logo" className="h-5 w-auto object-contain" crossOrigin="anonymous" />
      ) : (
        <div className="flex items-center gap-2">
            <span>Logo</span>
        </div>
      )}
    </div>
  );

  const AuthorHeader = ({ dark = false }: { dark?: boolean }) => (
    <div className="flex items-center gap-3 z-10 antialiased">
        <div className={`w-12 h-12 rounded-full overflow-hidden border ${dark ? 'border-gray-800' : 'border-gray-200'} bg-gray-100 flex-shrink-0`}>
           {data.authorImage ? (
               <img src={data.authorImage} alt={data.authorName} className="w-full h-full object-cover" crossOrigin="anonymous" />
           ) : (
               <div className="w-full h-full bg-gray-300"></div>
           )}
        </div>
        <div className="flex flex-col min-w-0 text-left">
           <span className={`font-bold text-base leading-tight truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{data.authorName}</span>
           <span className={`text-xs truncate mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
             {data.authorHandle}
           </span>
        </div>
    </div>
  );

  const BackgroundLayer = () => (
    <div 
      className={`absolute inset-0 w-full h-full overflow-hidden bg-gray-200 ${isEditable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onMouseDown={handleBgMouseDown}
    >
      {data.backgroundImage ? (
        <img 
          src={data.backgroundImage} 
          alt="bg" 
          className="absolute max-w-none origin-center pointer-events-none select-none"
          crossOrigin="anonymous"
          style={{
            transform: `translate(${data.imagePosition.x}px, ${data.imagePosition.y}px) scale(${data.imageScale})`,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-700" />
      )}
    </div>
  );

// === ИСПРАВЛЕННЫЙ ШАБЛОН MINIMAL GRID ===
if (template === TemplateStyle.MINIMAL_TYPOGRAPHY) {
  const showImage = data.backgroundImage && data.backgroundImage !== DEFAULT_BG_URL;
  const showColor = !showImage && data.backgroundColor;

  return (
    <div 
      ref={ref}
      style={{ 
          width: '500px', 
          height: '625px',
          backgroundColor: showColor ? data.backgroundColor! : '#F9FAFB' 
      }}
      className="relative flex flex-col px-14 py-12 overflow-hidden text-slate-900 antialiased transition-colors duration-300"
    >
      {/* СЛОЙ ФОНА */}
      {showImage ? (
           <div className="absolute inset-0 z-0">
              <img src={data.backgroundImage!} alt="bg" className="w-full h-full object-cover" crossOrigin="anonymous" />
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div> 
           </div>
      ) : !showColor && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" style={{
              backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
              backgroundSize: '20px 20px'
          }}></div>
      )}

      {/* 1. ВЕРХ: Логотип (Рендерим только если есть image) */}
      {data.logoImage && (
          <div className="flex-none z-10 pt-2 mb-4">
              <img src={data.logoImage} alt="Brand" className="h-6 w-auto object-contain" />
          </div>
      )}

      {/* 2. ЦЕНТР/НИЗ: Контент */}
      {/* Если логотипа нет — используем justify-end, чтобы всё упало вниз */}
      <div className={`flex-1 flex flex-col z-10 w-full justify-center`}>
           <div className="mb-10 flex items-center gap-4"> 
              <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                 {data.authorImage ? (
                     <img src={data.authorImage} alt={data.authorName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                 ) : (
                     <div className="w-full h-full bg-gray-300"></div>
                 )}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                 <span className="font-bold text-xl text-gray-900 leading-tight truncate">{data.authorName}</span>
                 <span className="text-sm text-gray-500 truncate mt-0.5">{data.authorHandle}</span>
              </div>
           </div>

           <div className="w-full">
              {renderRichText(data.headline, { color: '#111111' })}
           </div>
      </div>

      {data.subHeadline && (
          <div className="flex-none relative z-10 pt-6">
             <p className="text-gray-500 text-base font-normal leading-relaxed text-left">
               {data.subHeadline}
             </p>
          </div>
      )}
    </div>
  );
}

// === ШАБЛОН BOLD TEXT OVERLAY (Верхний) ===
if (template === TemplateStyle.BOLD_TEXT_OVERLAY) {
  return (
    <div 
      ref={ref}
      style={{ width: '500px', height: '625px' }}
      className="bg-slate-900 relative flex flex-col items-center overflow-hidden antialiased"
    >
      <BackgroundLayer />
      <div className="absolute top-0 left-0 w-full h-[70%] z-0 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.24) 50%, rgba(0,0,0,0) 100%)' }} />
      
      {/* Если логотипа нет, уменьшаем pt-12 до pt-8, чтобы текст был выше */}
      <div className={`relative z-10 w-full flex flex-col items-center px-8 text-center pointer-events-none ${data.logoImage ? 'pt-12' : 'pt-16'}`}>
         {data.logoImage && (
             <div className="mb-6">
                 <img src={data.logoImage} className="h-6 w-auto" alt="logo"/>
             </div>
         )}

         {data.subHeadline && (
           <span className="text-white/90 text-sm font-medium tracking-wide uppercase mb-3">
             {data.subHeadline}
           </span>
         )}
         
         <div className="pointer-events-auto w-full">
           {renderRichText(data.headline)}
         </div>
      </div>
    </div>
  );
}

// === ШАБЛОН BOTTOM TEXT IMAGE (Нижний) ===
return (
  <div 
    ref={ref}
    style={{ width: '500px', height: '625px' }}
    className="bg-gray-900 relative flex flex-col justify-end overflow-hidden antialiased"
  >
      <BackgroundLayer />
      <div className="absolute bottom-0 left-0 w-full h-[60%] z-0 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)' }} />

      <div className="relative z-10 w-full flex flex-col pb-5 px-8 pointer-events-none items-center text-center">
          <div className="pointer-events-auto w-full">
              {renderRichText(data.headline)}
          </div>
         
         {/* Если есть логотип — рисуем линию и лого, если нет — пустота (текст прижмется ниже) */}
         {data.logoImage && (
            <>
              <div className="w-full h-px bg-white/30 my-3"></div>
              <div className="flex justify-center items-center h-8">
                  <img src={data.logoImage} className="h-6 w-auto object-contain" alt="logo"/>
              </div>
            </>
         )}
      </div>
  </div>
);
});

VisualCard.displayName = "VisualCard";
export default VisualCard;
