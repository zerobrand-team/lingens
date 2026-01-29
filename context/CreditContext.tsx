import React, { createContext, useContext, useState, useEffect } from 'react';

interface CreditContextType {
  credits: number;
  spendCredit: () => boolean;
  addCredits: (amount: number) => void;
  
  hasClaimedBonus: boolean;
  claimBonus: () => void;
  
  isFeedbackModalOpen: boolean;
  openFeedbackModal: () => void;
  closeFeedbackModal: () => void;
  isSecretModalOpen: boolean;
  openSecretModal: () => void;
  closeSecretModal: () => void;
  isLimitModalOpen: boolean;
  openLimitModal: () => void;
  closeLimitModal: () => void;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const CreditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Кредиты из кэша
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('user_credits');
    return saved !== null ? parseInt(saved, 10) : 10;
  });

  // 2. Статус бонуса из кэша
  const [hasClaimedBonus, setHasClaimedBonus] = useState<boolean>(() => {
    return localStorage.getItem('user_bonus_claimed') === 'true';
  });

  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isSecretModalOpen, setSecretModalOpen] = useState(false);
  const [isLimitModalOpen, setLimitModalOpen] = useState(false);

  // Сохраняем состояния при изменениях
  useEffect(() => {
    localStorage.setItem('user_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('user_bonus_claimed', hasClaimedBonus.toString());
  }, [hasClaimedBonus]);

  const spendCredit = () => {
    if (credits > 0) {
      setCredits(prev => prev - 1);
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    setCredits((prev) => prev + amount);
  };

  // --- ЛОГИКА ПОЛУЧЕНИЯ БОНУСА ---
  const claimBonus = () => {
    // Если уже забирали — показываем лимиты
    if (hasClaimedBonus) {
        setLimitModalOpen(true); // Открываем модалку
        return;
    }

    // Если нет — даем кредиты и запоминаем
    addCredits(20);
    setHasClaimedBonus(true);
    
    // Опционально: закрыть модалку, где была кнопка бонуса
    // setFeedbackModalOpen(false); 
  };
  // -------------------------------

  return (
    <CreditContext.Provider value={{ 
      credits, 
      spendCredit, 
      addCredits,
      
      hasClaimedBonus,
      claimBonus,

      isFeedbackModalOpen,
      openFeedbackModal: () => setFeedbackModalOpen(true),
      closeFeedbackModal: () => setFeedbackModalOpen(false),
      isSecretModalOpen,
      openSecretModal: () => setSecretModalOpen(true),
      closeSecretModal: () => setSecretModalOpen(false),
      isLimitModalOpen,
      openLimitModal: () => setLimitModalOpen(true),
      closeLimitModal: () => setLimitModalOpen(false)
    }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (!context) throw new Error('useCredits must be used within a CreditProvider');
  return context;
};
