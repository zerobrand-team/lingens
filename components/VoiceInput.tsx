// src/components/VoiceInput.tsx
import React, { useState, useEffect, useRef } from 'react';

// Типизация для браузерного API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// Экспортируем тип для языков, чтобы использовать в App.tsx
export type LanguageCode = 'en-US' | 'ru-RU' | 'uk-UA' | 'es-ES' | 'fr-FR' | 'de-DE';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  selectedLang: LanguageCode;         // Текущий выбранный язык
  onLangChange: (lang: LanguageCode) => void; // Функция для смены языка
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, selectedLang, onLangChange }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Проверка поддержки браузером
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    // КРИТИЧНО: Устанавливаем язык распознавания из пропса
    recog.lang = selectedLang;

    recog.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      // Добавляем пробел после каждой фразы
      if (finalTranscript) onTranscript(finalTranscript + ' ');
    };

    recog.onend = () => setIsListening(false);
    recognitionRef.current = recog;

    // Останавливаем распознавание при размонтировании или смене языка
    return () => recog.stop();
  }, [onTranscript, selectedLang]); // Перезапускаем эффект, если изменился язык

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    // ГЛАВНЫЙ КОНТЕЙНЕР: Единая кнопка-капсула
    <div className={`flex items-center h-[42px] bg-white border ${isListening ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-800'} rounded-[14px] overflow-hidden transition-all`}>
      
      {/* ЛЕВАЯ ЧАСТЬ: Кнопка записи */}
      <button
        onClick={toggleListening}
        className="flex items-center gap-2 pl-4 pr-3 h-full group focus:outline-none"
        type="button"
      >
        {/* Иконка микрофона */}
        <div className={`relative flex items-center justify-center w-5 h-5 ${isListening ? 'text-red-500' : 'text-gray-700 group-hover:text-black'}`}>
          {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </div>
        {/* Текст */}
        <span className={`text-sm font-bold ${isListening ? 'text-red-500' : 'text-gray-700 group-hover:text-black'}`}>
          {isListening ? 'Stop' : 'Record'}
        </span>
      </button>

      {/* РАЗДЕЛИТЕЛЬ */}
      <div className="h-5 border-l border-gray-200"></div>

      {/* ПРАВАЯ ЧАСТЬ: Селектор языка */}
      <div className="relative h-full group">
        <select
          value={selectedLang}
          onChange={(e) => onLangChange(e.target.value as LanguageCode)}
          className="appearance-none h-full bg-transparent pl-3 pr-9 text-sm font-bold text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none rounded-r-full outline-none"
        >
          <option value="en-US">EN</option>
          <option value="ru-RU">RU</option>
          <option value="uk-UA">UA</option>
          <option value="es-ES">ES</option>
          <option value="fr-FR">FR</option>
          <option value="de-DE">DE</option>
        </select>
        
        {/* Кастомная стрелочка */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default VoiceInput;