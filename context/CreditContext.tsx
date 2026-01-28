import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Убедитесь, что путь правильный

interface CreditContextType {
  credits: number;
  refreshCredits: () => Promise<void>; // Функция для обновления баланса с сервера
  
  hasClaimedBonus: boolean;
  // checkBonusStatus удалили, так как refreshCredits обновляет всё сразу

  // Модалки
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
  // 1. Начальное состояние теперь 0 (пока не загрузимся)
  const [credits, setCredits] = useState<number>(0);
  const [hasClaimedBonus, setHasClaimedBonus] = useState<boolean>(false);

  // Модалки
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isSecretModalOpen, setSecretModalOpen] = useState(false);
  const [isLimitModalOpen, setLimitModalOpen] = useState(false);

  // 2. Главная функция: Загрузка данных из Supabase
  const refreshCredits = async () => {
    // Получаем текущего юзера
    const { data: { user } } = await supabase.auth.getUser();
    
    // Если юзер не залогинен — выходим (или ставим 0)
    if (!user) return; 

    // Делаем запрос в таблицу profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('credits, has_claimed_survey')
      .eq('id', user.id)
      .single();

    if (data) {
      setCredits(data.credits);
      setHasClaimedBonus(data.has_claimed_survey);
    }
  };

  // 3. Загружаем данные при старте приложения
  useEffect(() => {
    refreshCredits();

    // (Опционально) Подписка на изменения в реальном времени
    // Если вы что-то измените в базе, цифра обновится сама
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        refreshCredits();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <CreditContext.Provider value={{ 
      credits, 
      refreshCredits, // Теперь мы экспортируем эту функцию вместо spendCredit
      
      hasClaimedBonus,

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
