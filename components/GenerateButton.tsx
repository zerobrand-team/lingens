import React from 'react';
import { useCredits } from '../context/CreditContext';

interface GenerateButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
  className?: string;
  showCredits?: boolean;
}

const LightningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#FBBF24" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GenerateButton: React.FC<GenerateButtonProps> = ({ 
  onGenerate, 
  isGenerating, 
  disabled,
  className = '',
  showCredits = false 
}) => {
  // Достаем новые поля
  const { credits, openFeedbackModal, openLimitModal, hasClaimedBonus } = useCredits();

  const figmaGradient = "bg-[linear-gradient(100deg,#ED8851_9%,#E7DFDD_41%,#D3EAFA_56%,#3BA4F5_89%)]";

  const handleClick = () => {
    // ЛОГИКА ПРИ 0 КРЕДИТАХ
    if (credits === 0) {
      if (!hasClaimedBonus) {
        // 1. Если бонус НЕ получен -> Открываем опрос
        openFeedbackModal();
      } else {
        // 2. Если бонус УЖЕ был получен -> Открываем финал ("Пиши в личку")
        openLimitModal();
      }
      return;
    }
    
    onGenerate(); 
  };

  // ВАРИАНТ 1: Кредитов 0
  if (credits === 0) {
    // Сценарий А: Предлагаем бонус +10 (Опрос)
    if (!hasClaimedBonus) {
      return (
        <button 
          onClick={handleClick}
          className={`relative overflow-hidden w-full h-full rounded-[14px] font-bold text-sm transition-all flex items-center justify-center tracking-tight shadow-lg animate-pulse text-black hover:scale-[1.02] active:scale-95 ${figmaGradient} ${className}`}
        >
          Get +10 <span className="mx-1"><LightningIcon /></span> free
        </button>
      );
    }

    // Сценарий Б: Бонус уже потрачен (Финал)
    return (
      <button 
        onClick={handleClick}
        className={`relative overflow-hidden w-full h-full rounded-[14px] font-bold text-sm transition-all flex items-center justify-center tracking-tight shadow-md bg-black text-white hover:bg-gray-800 active:scale-95 ${className}`}
      >
        <span>Unlock Unlimited</span>
        <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button>
    );
  }

  // ВАРИАНТ 2: Обычная кнопка (Есть кредиты)
  return (
    <button 
      onClick={handleClick}
      disabled={disabled || isGenerating}
      className={`
        relative overflow-hidden w-full h-full rounded-[14px] font-bold text-[13px] transition-all flex items-center justify-center tracking-tight
        border border-transparent bg-no-repeat bg-cover bg-center bg-origin-border
        ${isGenerating ? 'bg-[#E5E5EA] cursor-default' : figmaGradient}
        ${(disabled && !isGenerating) ? ' cursor-not-allowed' : ''}
        ${(!disabled && !isGenerating) ? `hover:border-black/20 active:scale-[0.98]` : ''}
        ${className}
      `}
    >
      <div 
        className={`absolute left-0 top-0 bottom-0 z-0 ${figmaGradient}`}
        style={{ 
          width: isGenerating ? '100%' : '0%', 
          transition: isGenerating ? 'width 10s ease-out' : 'width 0s' 
        }} 
      />
      
      <span className="relative z-10 flex items-center gap-1.5 text-[#111] tracking-tight">
         {isGenerating ? (
            'Working hard...' 
         ) : (
            <>
              Generate
              {showCredits && (
                 <div className="flex items-center gap-0.5 ml-1 opacity-80">
                    <span className="text-base">(</span>
                    <LightningIcon />
                    <span className="text-base">{credits}</span>
                    <span className="text-base">)</span>
                 </div>
              )}
            </>
         )}
      </span>
    </button>
  );
};