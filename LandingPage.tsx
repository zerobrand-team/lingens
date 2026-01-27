import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-cover bg-center bg-no-repeat font-sans"
         style={{
            backgroundImage: `url('https://i.postimg.cc/xJ9H1qQj/Frame-2131329607.png')`
         }}
    >
        <style>{`
            @media (min-width: 768px) {
                .bg-cover {
                    background-image: url('https://i.postimg.cc/hXc0SJYd/Desktop-18.jpg') !important;
                }
            }

            /* Кастомная анимация */
            @keyframes slideInUpScale {
              from {
                opacity: 0;
                transform: translateY(24px) scale(0.9);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            .animate-step {
              opacity: 0;
              animation: slideInUpScale 0.4s ease-out forwards;
            }

            .delay-1 { animation-delay: 0s; }
            .delay-2 { animation-delay: 0.2s; }
            .delay-3 { animation-delay: 0.4s; }
        `}</style>

      {/* 1. HEADER (LOGO) */}
      <header className="w-full flex justify-center pt-6 md:pt-4 pb-6 border-b border-black/[0.08] z-10">
        <div className="flex items-center gap-2">
            <img src="/Lingens.svg" alt="Lingens Logo" className="w-6 h-6" />
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 flex flex-col items-center text-center px-4 mt-12 md:mt-14 z-10 max-w-4xl mx-auto">
        
        {/* Шаг 1: Заголовок */}
        <h1 className="animate-step delay-1 text-[36px] md:text-[70px] leading-[1] font-regular tracking-[-0.07em] text-black mb-10">
          LinkedIn posts that
          <br />
          <span className="relative inline-block">
            sound like you
            <span className="absolute left-0 right-0 -bottom-1 md:-bottom-2 h-[3px] md:h-[5px] bg-black"></span>
          </span>
        </h1>

        {/* Шаг 2: Группа кнопки и текста доверия */}
        <div className="animate-step delay-2 flex flex-col items-center">
            <button 
                onClick={onStart}
                className="bg-black text-white px-6 py-3 md:px-8 md:py-3 rounded-2xl md:rounded-[14px] font-bold text-lg md:text-xl hover:bg-gray-800 active:scale-95 transition-all"
            >
                Try it for Free
            </button>

            <div className="flex items-center gap-3 mt-4 md:mt-6 opacity-80">
                <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <p className="text-xs md:text-sm font-medium text-black">
                    No credit card and login required.
                </p>
            </div>
        </div>
      </main>

      {/* Шаг 3: Картинки */}
      <div className="animate-step delay-3 w-full mt-auto flex justify-center px-4 z-10 pb-0 pt-12 md:pt-16">
          <img 
            src="https://i.postimg.cc/QxnGcLKz/mob.png" 
            alt="App Interface Mobile" 
            className="block md:hidden w-full max-w-[500px] object-contain drop-shadow-2xl translate-y-1" 
          />
          <img 
            src="https://i.postimg.cc/JtYsQm2g/bottom-image.png" 
            alt="App Interface Desktop" 
            className="hidden md:block w-full max-w-[1000px] object-contain drop-shadow-2xl translate-y-1" 
          />
      </div>
    </div>
  );
};

export default LandingPage;