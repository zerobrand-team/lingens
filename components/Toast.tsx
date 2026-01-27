import React, { useEffect } from 'react';

interface ToastProps {
  show: boolean;
  type: 'copy' | 'download';
  onClose: () => void;
}

export default function Toast({ show, type, onClose }: ToastProps) {
  
  // Таймер авто-закрытия (5 секунд)
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const isCopy = type === 'copy';
  const title = isCopy ? "Copied" : "Downloaded";
  const btnText = "Open LinkedIn";
  
  return (
    <div className={`fixed bottom-[8px] left-[8px] right-[8px] md:left-auto md:bottom-[8px] md:right-[8px] z-[9999] transition-all duration-500 ease-out transform flex justify-center ${
      show ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
    }`}>
      {/* Карточка тоста */}
      <div className="bg-white rounded-[24px] shadow-2xl p-3 md:p-4 pr-8 md:pr-10 flex items-center gap-3 md:gap-4 relative w-full max-w-sm md:max-w-none md:min-w-[350px] border border-gray-100 font-sans">
        
        {/* Кнопка закрытия (Крестик) */}
        <button 
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-black transition-colors p-1"
        >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
        </button>

        {/* Левая часть: Зеленый блок */}
        <div className="w-[54px] h-[54px] md:w-[67px] md:h-[67px] bg-[#E6F4EA] rounded-[18px] flex items-center justify-center flex-shrink-0 text-[#1E8E3E]">
            {/* ИСПРАВЛЕНИЕ ТУТ: Размеры перенесены в className */}
            <svg 
              className="w-[26px] h-[26px] md:w-[32px] md:h-[32px]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>

        {/* Правая часть: Контент */}
        <div className="flex flex-col items-start justify-center pt-1">
            {/* Заголовок */}
            <h3 className="text-[22px] md:text-[24px] font-bold text-black leading-tight mb-1">
                {title}
            </h3>
            
            {/* Кнопка действия с подчеркиванием */}
            <a 
              href="https://www.linkedin.com/feed/" 
              target="_blank" 
              rel="noreferrer"
              className="text-[13px] md:text-[16px] font-bold text-black hover:opacity-70 transition-opacity flex items-center underline underline-offset-4 group"
            >
              {btnText}
              <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform no-underline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
        </div>

      </div>
    </div>
  );
}