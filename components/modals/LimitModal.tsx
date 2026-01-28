import React from 'react';
import { useCredits } from '../../context/CreditContext';

export const LimitModal: React.FC = () => {
  const { isLimitModalOpen, closeLimitModal } = useCredits();

  if (!isLimitModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Затемнение фона */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={closeLimitModal}
      />

      {/* Контент модалки */}
      <div className="relative bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Кнопка закрытия */}
        <button 
          onClick={closeLimitModal}
          className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          {/* Иконка / Эмодзи */}
          <div className="text-6xl mb-6">🔥</div>

          <h3 className="text-2xl font-bold text-black mb-3">
            Wow, you are on fire!
          </h3>
          
          <p className="text-gray-500 mb-8 leading-relaxed">
            You've used all your free credits. It seems you really like the tool!
            <br/><br/>
            I want to give you <strong>Unlimited Access</strong> manually. Just DM me "I want more", and I'll send you a secret link.
          </p>

          <div className="space-y-3">
            {/* Кнопка LinkedIn */}
            <a 
              href="https://www.linkedin.com/in/YOUR_PROFILE" // <--- Вставь свою ссылку
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-[50px] bg-[#0A66C2] text-white font-bold rounded-[16px] hover:bg-[#004182] transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              DM on LinkedIn
            </a>

            {/* Кнопка Telegram */}
            <a 
              href="https://t.me/YOUR_USERNAME" // <--- Вставь свой юзернейм
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-[50px] bg-[#24A1DE] text-white font-bold rounded-[16px] hover:bg-[#1A8LB0] transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              DM on Telegram
            </a>
          </div>

          <div className="mt-6 text-xs text-gray-400">
            I usually reply within 1-2 hours.
          </div>
        </div>
      </div>
    </div>
  );
};
