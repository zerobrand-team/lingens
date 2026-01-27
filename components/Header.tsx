import React from 'react';
import { useCredits } from '../context/CreditContext';

// --- Внутренний компонент: Контролы кредитов (справа) ---
const CreditControls = () => {
  const { credits, openFeedbackModal } = useCredits();
  
  return (
    <div className="flex items-center gap-3">
        {/* Кнопка Get more (незаметная) */}
        <button
          onClick={openFeedbackModal}
          className="text-[11px] font-medium text-gray-400 border border-gray-300 rounded-full px-3 py-1 hover:border-black hover:text-black transition-colors">
            Get more
        </button>
        
        {/* Счетчик с молнией */}
        <div className="flex items-center gap-1 font-bold text-sm text-black select-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#FBBF24" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{credits}</span>
        </div>
    </div>
  );
};

// --- Компонент: Mobile Header ---
interface HeaderProps {
    generatedPost: string;
}

export const MobileHeader: React.FC<HeaderProps> = ({ generatedPost }) => {
  return (
    <>
        {/* Верхняя полоска: Лого + Кредиты */}
        <div className="w-full flex justify-between items-center px-5 py-4 z-20 sticky top-0 bg-[#FFFFFF] backdrop-blur-sm border-b border-black/[0.05]">
            <img src="/Lingens.svg" alt="Logo" className="h-5 w-auto" />
            <CreditControls />
        </div>

        {/* Шаги (Step 1 / Step 2) - показываем только если поста еще нет */}
        {!generatedPost && (
          <div className="w-full flex justify-center mt-6 pb-6 z-20 animate-in fade-in slide-in-from-top-2 duration-500 delay-100">
            <div className="flex items-start gap-3 select-none">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-[3px] rounded-full bg-black w-24"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black">Step 1: Text</span>
                </div>
                <div className="flex flex-col items-center gap-2 opacity-30">
                    <div className="h-[3px] rounded-full bg-black w-24"></div>
                    <span className="text-[10px] font-bold uppercase text-black">Step 2: Image</span>
                </div>
            </div>
          </div>
        )}
    </>
  );
};

// --- Компонент: Desktop Header ---
export const DesktopHeader: React.FC<HeaderProps> = ({ generatedPost }) => {
  return (
    <div className="w-full border-b border-black/[0.08] justify-center py-4 z-20 sticky top-0 flex bg-white/80 backdrop-blur-md transition-all relative">
        
        {/* Логотип (Остается на месте) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <img src="/Lingens.svg" alt="Lingens" className="h-6 w-auto" />
        </div>

        {/* Шаги (Рендерим ТОЛЬКО если пост еще не сгенерирован) */}
        {!generatedPost && (
            <div className="flex items-start gap-4 select-none animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-[4px] rounded-full bg-black w-32"></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-black">Step 1: Text</span>
                </div>
                {/* Здесь я оставил Step 2, но так как этот блок исчезнет 
                   сразу после генерации, пользователь увидит Step 2 активным 
                   только на долю секунды или не увидит вовсе.
                   Логически это верно для "первого экрана".
                */}
                <div className="flex flex-col items-center gap-2 opacity-30">
                    <div className="h-[4px] rounded-full bg-gray-300 w-32"></div>
                    <span className="text-[11px] font-bold uppercase">Step 2: Image</span>
                </div>
            </div>
        )}

        {/* Кредиты (Остаются справа) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <CreditControls />
        </div>
    </div>
  );
};