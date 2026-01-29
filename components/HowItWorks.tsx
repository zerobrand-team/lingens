import React from 'react';

interface HowItWorksProps {
  onClose: () => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onClose }) => {
  return (
    // OVERLAY
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      <style>{`
        /* Анимации */
        @keyframes popupEnter {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .popup-anim { animation: popupEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes staggerUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .item-anim { opacity: 0; animation: staggerUp 0.6s ease-out forwards; }
        
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-btn { animation-delay: 0.4s; }
      `}</style>

      {/* POPUP CONTAINER */}
     <div className="popup-anim bg-[#F7F8FA] w-full max-w-[900px] rounded-[32px] shadow-2xl relative flex flex-col p-5 md:p-10 max-h-[95vh] overflow-y-auto">
        
        {/* CLOSE BUTTON (Top Right) */}
        <button 
            onClick={onClose} 
            className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-all z-50 shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {/* HEADER */}
        <div className="flex justify-center items-center mb-4 md:mb-6">
            <h2 className="text-[28px] md:text-[32px] font-medium text-black tracking-tight leading-none">
                How it works
            </h2>
        </div>

        {/* STEPS CONTAINER */}
        <div className="flex flex-col md:flex-row items-stretch gap-1 md:gap-1 relative">
          
          {/* --- STEP 1 --- */}
          <div className="item-anim delay-1 flex-1 bg-white rounded-[24px] border border-white/50 shadow-[0px_8px_16px_rgba(0,0,0,0.04)] relative overflow-hidden min-h-[180px] p-2 md:p-6 flex flex-col justify-between group">
             
             {/* Header */}
             <div className="flex justify-between items-start relative z-10">
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Step 1</span>
                {/* ICON */}
                <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
             </div>

             {/* Content */}
             <div className="relative z-10 mt-4">
                <h3 className="text-[17px] leading-[1.3] text-black mb-1">
                    <span className="font-semibold block">Dump whatever is</span> 
                    in your head
                </h3>
                <p className="text-[14px] text-gray-500 font-medium">voice, bullets, half-thoughts</p>
             </div>
          </div>

          {/* --- STEP 2 --- */}
          <div className="item-anim delay-2 flex-1 bg-white rounded-[24px] border border-white/50 shadow-[0px_8px_16px_rgba(0,0,0,0.04)] relative overflow-hidden min-h-[180px] p-2 md:p-6 flex flex-col justify-between group">

             <div className="flex justify-between items-start relative z-10">
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Step 2</span>
                <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
             </div>

             <div className="relative z-10 mt-4">
                <h3 className="text-[17px] leading-[1.3] text-black mb-1">
                    <span className="font-semibold block">We clean it up</span> 
                    without changing voice
                </h3>
                <p className="text-[14px] text-gray-500 font-medium">It feels like you.</p>
             </div>
          </div>

          {/* --- STEP 3 --- */}
          <div className="item-anim delay-3 flex-1 bg-white rounded-[24px] border border-white/50 shadow-[0px_8px_16px_rgba(0,0,0,0.04)] relative overflow-hidden min-h-[180px] p-2 md:p-6 flex flex-col justify-between group">

             <div className="flex justify-between items-start relative z-10">
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Step 3</span>
                <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
             </div>

             <div className="relative z-10 mt-4">
                <h3 className="text-[17px] leading-[1.3] text-black mb-1">
                    <span className="font-semibold block">Post it.</span> 
                    Or tweak it and post it.
                </h3>
                <p className="text-[14px] text-gray-500 font-medium">Ready to go.</p>
             </div>
          </div>

        </div>

        {/* BUTTON AREA */}
        <div className="item-anim delay-btn mt-4 flex justify-center">
            <button 
                onClick={onClose}
                className="w-full md:w-auto justify-center group relative overflow-hidden rounded-[16px] px-8 py-3.5 flex items-center gap-2 active:scale-95 bg-[linear-gradient(100deg,#ED8851_9%,#E7DFDD_41%,#D3EAFA_56%,#3BA4F5_89%)] transition-all border border-transparent bg-origin-border hover:border-black/20"
            >
                <span className="font-bold text-black text-[13px] relative z-10">Start writing</span>
                <svg className="w-4 h-4 text-black relative z-10 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </button>
        </div>

      </div>
    </div>
  );
};

export default HowItWorks;
