import React, { createContext, useContext, useState, useEffect } from 'react';

interface CreditContextType {
  credits: number;
  spendCredit: () => boolean;
  addCredits: (amount: number) => void;
  // --- НОВОЕ ---
  hasClaimedBonus: boolean;      // Забрал ли бонус?
  claimBonus: () => void;        // Функция, чтобы забрать бонус (+10)
  // -------------
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
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('user_credits');
    return saved !== null ? parseInt(saved, 10) : 30;
  });

  // --- НОВОЕ СОСТОЯНИЕ ---
  // Проверяем в localStorage, забирал ли он уже бонус
  const [hasClaimedBonus, setHasClaimedBonus] = useState<boolean>(() => {
    return localStorage.getItem('user_bonus_claimed') === 'true';
  });
  // -----------------------

  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isSecretModalOpen, setSecretModalOpen] = useState(false);
  const [isLimitModalOpen, setLimitModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('user_credits', credits.toString());
  }, [credits]);

  // Сохраняем флаг бонуса при изменении
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

  // --- НОВАЯ ФУНКЦИЯ ---
  // Вызывай её, когда юзер успешно отправил опрос!
  const claimBonus = () => {
    addCredits(10);            // Даем 10 кредитов
    setHasClaimedBonus(true);  // Ставим галочку "Бонус получен"
  };
  // ---------------------

  return (
    <CreditContext.Provider value={{ 
      credits, 
      spendCredit, 
      addCredits,
      
      // Передаем новые значения
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
