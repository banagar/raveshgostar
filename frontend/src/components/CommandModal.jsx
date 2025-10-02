import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postCommand } from '../services/api';
import './CommandModal.css';
import { FaTimes, FaMicrophone, FaPaperPlane } from 'react-icons/fa';

// چک کردن وجود API در مرورگر
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.lang = 'fa-IR'; // زبان را فارسی تنظیم می‌کنیم
  recognition.interimResults = false;
}

const CommandModal = ({ isOpen, onClose }) => {
  const [commandText, setCommandText] = useState('');
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false); // State برای وضعیت میکروفون
  const navigate = useNavigate();

  // useEffect برای مدیریت رویدادهای تشخیص گفتار
useEffect(() => {
    if (!recognition || !isOpen) return;

    // وقتی نتیجه‌ای آماده شد
    recognition.onresult = (event) => {
      let final_transcript = '';
      // تمام نتایج نهایی رو به هم می‌چسبونیم
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        }
      }
      // متن جدید را به متن قبلی اضافه می‌کنیم (برای دیکته طولانی)
      setCommandText(prevText => prevText + final_transcript);
      // در حالت ممتد، اینجا شنیدن را متوقف نمی‌کنیم
    };

    // در صورت بروز خطا
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError("خطا در تشخیص گفتار. آیا دسترسی به میکروفون داده‌اید؟");
      setIsListening(false);
    };

    // وقتی شنیدن تمام شد
    recognition.onend = () => {
      setIsListening(false);
    };

  }, [isOpen]); // این افکت با باز و بسته شدن مودال اجرا می‌شود

  const handleClose = () => {
    if (isListening) recognition.stop();
    setCommandText('');
    setError('');
    onClose();
  };

  // 4. تابع برای ارسال دستور
  const handleSubmit = async () => {
    if (commandText.trim() === '') return;
    setError('');
    try {
      const token = localStorage.getItem('userToken');
      const result = await postCommand(commandText, token);
      
      // 5. در صورت موفقیت، به صفحه بازبینی برو و نتیجه را پاس بده
      navigate('/review', { state: { reviewData: result } });
      handleClose();

    } catch (err) {
      setError(err.detail || 'پردازش با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    }
  };

    // تابع جدید برای کنترل میکروفون
  const handleMicClick = () => {
    if (!recognition) {
      setError("مرورگر شما از قابلیت تشخیص گفتار پشتیبانی نمی‌کند.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}><FaTimes /></button>
        <h3>دستور خود را وارد کنید</h3>
        <p>مثال: "یک قهوه برای آقای رضایی ثبت کن به قیمت ۲۰ هزار تومان"</p>
        <div className="command-input-wrapper">
          <textarea 
            className="command-textarea" 
            placeholder="دستور خود را تایپ کنید یا روی میکروفون کلیک کنید..."
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            autoFocus
          ></textarea>
          <button 
            className={`submit-command-button ${isListening ? 'listening' : ''}`} 
            onClick={commandText.trim() === '' ? handleMicClick : handleSubmit}
            title={commandText.trim() === '' ? 'شروع ضبط صدا' : 'ارسال دستور'}
          >
            {commandText.trim() === '' ? <FaMicrophone /> : <FaPaperPlane />}
          </button>
        </div>
        {error && <p className="modal-error-message">{error}</p>}
      </div>
    </div>
  );
};

export default CommandModal;