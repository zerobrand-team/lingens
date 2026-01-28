import React, { useState } from 'react';
import { useCredits } from '../../context/CreditContext';
import { supabase } from '../../supabaseClient';

export const FeedbackModal = () => {
  // 1. ИЗМЕНЕНИЕ: Добавили claimBonus
  const { isFeedbackModalOpen, claimBonus, closeFeedbackModal } = useCredits();
  
  // 0=Intro, 1=PMF, 2=Missing, 3=Pricing, 4=Success
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);

  const [answers, setAnswers] = useState({
    pmf: '',
    missing: '',
    pricing: '' 
  });

  const [customInput, setCustomInput] = useState('');

  if (!isFeedbackModalOpen) return null;

  const handleSelect = (key: string, value: string, nextStep?: number) => {
    if (key === 'missing' && value === '✏️ Other') {
        setAnswers(prev => ({ ...prev, [key]: 'Other' }));
        return; 
    }

    setAnswers(prev => ({ ...prev, [key]: value }));
    if (nextStep) {
      setTimeout(() => setStep(nextStep), 250); 
    }
  };

  const handleClaim = async () => {
    if (!answers.pricing) return;
    setLoading(true);

    const finalMissing = answers.missing === 'Other' 
        ? `Other: ${customInput}` 
        : answers.missing;

    const finalData = { 
        pmf: answers.pmf,
        missing: finalMissing,
        pricing: answers.pricing,
        submitted_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.rpc('submit_survey_and_claim', {
        payload: finalData
      });

      if (error) throw error;
      claimBonus(); 
      
      setStep(4); 

    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('Bonus already claimed')) {
        alert("You have already claimed this bonus 😉");
        closeFeedbackModal();
      } else {
        alert("Something went wrong. Let's try to claim again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const CloseButton = () => (
    <button 
      onClick={closeFeedbackModal} 
      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-black hover:bg-gray-200 transition-all"
    >
      ✕
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-300 px-4">

      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-gray-100 relative overflow-hidden flex flex-col p-6 md:p-8 transition-all duration-500">
        
        {step === 0 && (
          <div className="animate-in slide-in-from-bottom-4 duration-300 flex flex-col relative">
             <div className="absolute -top-2 -right-2"><CloseButton /></div>
             
{/* Хедер с аватаром и соцсетями */}
<div className="flex items-center gap-4 mb-6">
  <img 
    src="/avatar.png" 
    alt="Founder" 
    className="w-12 h-12 rounded-full object-cover bg-gray-100 border border-gray-100"
    onError={(e) => {
      e.currentTarget.src = 'https://api.dicebear.com/9.x/initials/svg?seed=Marianna&backgroundColor=E5E7EB&textColor=111827&fontWeight=600'
    }} 
  />
  <div className="flex flex-col text-left">
    <div className="flex items-center gap-2">
      <span className="font-bold text-black text-[15px] leading-tight">
        Marianna Kovalska
      </span>
      
      {/* LinkedIn */}
      <a 
        href="https://www.linkedin.com/in/voreio/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-400 hover:text-[#0A66C2] transition-colors leading-none"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      </a>

      {/* Telegram */}
      <a 
        href="https://t.me/voreio" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-400 hover:text-[#229ED9] transition-colors leading-none"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 7.021l-2.02 9.551c-.15.682-.557.85-1.126.531l-3.09-2.284-1.49 1.435c-.165.165-.303.302-.622.302l.221-3.142 5.719-5.166c.249-.221-.054-.344-.381-.127l-7.069 4.449-3.048-.953c-.663-.209-.676-.663.138-.981l11.915-4.591c.552-.201 1.035.13 1.035.811z"/>
        </svg>
      </a>
    </div>
    
    <span className="text-gray-400 text-xs">Founder Lingens</span>
  </div>
</div>

             <div className="mb-8">
                <h2 className="text-[20px] leading-snug text-black mb-2">
                  Hey-hey! I want to give you <br/>
                  <span className="font-bold">+20⚡ credits for free.</span>
                </h2>
                <p className="text-black text-[20px]">
                  Just answer <span className="font-bold">3 quick questions</span> to help me improve the platform.
                </p>
             </div>

             <button 
               onClick={() => setStep(1)}
               className="w-full py-4 bg-black text-white rounded-[18px] font-bold hover:scale-[1.02] active:scale-95 transition-all"
             >
                Start & Get +20 ⚡ Credits
             </button>
          </div>
        )}

        {step > 0 && step < 4 && (
          <div className="flex flex-col animate-in slide-in-from-right-8 duration-300">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex gap-1.5 w-24">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-black' : 'bg-gray-200'}`} />
                    ))}
                 </div>
                 <CloseButton />
             </div>

             {step === 1 && (
                <>
                  <h2 className="text-xl font-bold mb-6">How was the result so far?</h2>
                  <div className="space-y-3">
                    {['🔥 Perfect', '👍 Good', '😐 Okay', '👎 Bad'].map(opt => (
                      <button key={opt} onClick={() => handleSelect('pmf', opt, 2)} className="w-full p-4 text-left border border-gray-100 rounded-[18px] font-medium hover:border-black transition-all">{opt}</button>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button onClick={() => setStep(0)} className="text-sm font-bold text-gray-400 hover:text-black transition-colors">
                      ← Back to Intro
                  </button>
                </div>
                </>
             )}

             {step === 2 && (
                <>
                  <h2 className="text-xl font-bold mb-6">What was missing?</h2>
                  <div className="space-y-3">
                    {['🤖 Sounded too AI', '🗣 Wrong Tone', '🧩 Hard to use', '✏️ Other'].map(opt => (
                      <button key={opt} onClick={() => handleSelect('missing', opt, 3)} className={`w-full p-4 text-left border rounded-[18px] font-medium transition-all ${answers.missing === 'Other' && opt === '✏️ Other' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-black'}`}>{opt}</button>
                    ))}
                    {answers.missing === 'Other' && (
                        <input autoFocus type="text" placeholder="Specify..." value={customInput} onChange={(e) => setCustomInput(e.target.value)} className="w-full p-4 mt-2 border border-black rounded-[18px] outline-none" />
                    )}
                  </div>
                  <div className="flex justify-between mt-6">
                      <button onClick={() => setStep(1)} className="text-gray-400 font-bold">← Back</button>
                      {answers.missing === 'Other' && <button onClick={() => setStep(3)} disabled={!customInput.trim()} className="font-bold text-black disabled:opacity-30">Continue →</button>}
                  </div>
                </>
             )}

             {step === 3 && (
                <>
                  <h2 className="text-xl font-bold mb-6">Fair price for Unlimited?</h2>
                  <div className="space-y-3 mb-8">
                    {['☕️ $5-9', '🎬 $10-19', '🚀 $20-49', '🙅‍♂️ Not paying yet'].map(opt => (
                      <button key={opt} onClick={() => setAnswers(prev => ({...prev, pricing: opt}))} className={`w-full p-4 text-left border rounded-[18px] font-medium hover:border-black transition-all ${answers.pricing === opt ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-100'}`}>{opt}</button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                     <button onClick={() => setStep(2)} className="text-gray-400 font-bold">← Back</button>
                     <button onClick={handleClaim} disabled={!answers.pricing || loading} className="px-8 py-3 bg-black text-white rounded-[16px] font-bold disabled:bg-gray-200">
                        {loading ? 'Sending...' : 'Claim 20 ⚡'}
                     </button>
                  </div>
                </>
             )}
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="bg-white flex items-center justify-center mt-3 mb-3">
                <span className="text-4xl">⚡</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Awesome!</h2>
            <p className="text-gray-500 mb-8">20⚡ Credits have been added to your balance.</p>
            <button onClick={closeFeedbackModal} className="w-full py-4 bg-black text-white rounded-[18px] font-bold">Great, thanks!</button>
          </div>
        )}

      </div>
    </div>
  );
};
