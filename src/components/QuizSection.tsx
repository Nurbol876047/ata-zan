"use client";
import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const QUIZ_QUESTIONS = [
  {
    question: "Жеті жарғы қай ханның тұсында қабылданды?",
    image: "/museum/zhety-zhargy/1_tauke.png",
    options: ["Абылай хан", "Кенесары хан", "Тәуке хан", "Қасым хан"],
    correct: 2,
  },
  {
    question: "Жеті жарғыны жасауға қатысқан үш ұлы биді атаңыз.",
    image: "/museum/zhety-zhargy/2_biys.png",
    options: ["Төле, Қазыбек, Әйтеке", "Бұқар, Үмбетей, Ақтамберді", "Құнанбай, Абай, Шәкәрім", "Әлихан, Ахмет, Міржақып"],
    correct: 0,
  },
  {
    question: "Жеті жарғыда кісі өлтіргені үшін төленетін толық \"құн\" көлемі қандай болды?",
    image: "/museum/zhety-zhargy/3_steppe.png",
    options: ["100 жылқы", "500 жылқы", "1000 жылқы", "10000 жылқы"],
    correct: 2,
  },
  {
    question: "Қазақ КСР-інің алғашқы Конституциясы қай жылы қабылданды?",
    image: "/images/kazssr_2.png",
    options: ["1920", "1937", "1978", "1991"],
    correct: 1,
  },
  {
    question: "1937 жылғы Конституцияда қай тілге мемлекеттік мәртебе берілді?",
    image: "/images/kazssr_3.jpg",
    options: ["Тек қазақ тіліне", "Тек орыс тіліне", "Орыс тілімен қатар қазақ тіліне", "Қазақ, орыс және ағылшын тілдеріне"],
    correct: 2,
  },
  {
    question: "\"Дамыған социализм\" кезеңінің Конституциясы қашан қабылданды?",
    image: "/images/kazssr_4.jpg",
    options: ["1937", "1978", "1990", "1993"],
    correct: 1,
  },
  {
    question: "Тәуелсіз Қазақстанның бірінші Конституциясы қай жылы қабылданды?",
    image: "/images/epoch_1993.png",
    options: ["1990 ж. 25 қазан", "1991 ж. 16 желтоқсан", "1993 ж. 28 қаңтар", "1995 ж. 30 тамыз"],
    correct: 2,
  },
  {
    question: "1993 жылғы Конституция бойынша басқару жүйесі қандай болды?",
    image: "/images/epoch_1993.png",
    options: ["Президенттік", "Парламенттік-президенттік", "Парламенттік", "Монархиялық"],
    correct: 1,
  },
  {
    question: "1993 жылғы Конституция қанша уақыт қолданыста болды?",
    image: "/images/epoch_1993.png",
    options: ["Бір жылдан аз", "5 жыл", "10 жыл", "Әлі де қолданыста"],
    correct: 0,
  },
  {
    question: "Қазақстанның қолданыстағы Конституциясы қашан қабылданды?",
    image: "/images/epoch_1995.png",
    options: ["1991 ж. 16 желтоқсан", "1993 ж. 28 қаңтар", "1995 ж. 30 тамыз", "2022 ж. 5 маусым"],
    correct: 2,
  },
  {
    question: "1995 жылғы Конституция бойынша Қазақстан қандай мемлекет болып табылады?",
    image: "/images/epoch_1995.png",
    options: ["Социалистік", "Демократиялық, зайырлы, құқықтық, әлеуметтік", "Демократиялық, исламдық", "Федеративтік"],
    correct: 1,
  },
  {
    question: "1995 жылғы Конституция Парламенттің қандай жүйесін бекітті?",
    image: "/images/epoch_1995_2.png",
    options: ["Бір палаталы", "Екі палаталы (Сенат және Мәжіліс)", "Үш палаталы", "Парламент мүлдем жойылды"],
    correct: 1,
  },
  {
    question: "Заңдардың Конституцияға сәйкестігін бақылайтын орган (1995 ж. нұсқасы бойынша)?",
    image: "/images/epoch_1995_4.png",
    options: ["Жоғарғы Сот", "Конституциялық Кеңес", "Әділет министрлігі", "Прокуратура"],
    correct: 1,
  },
  {
    question: "2022 жылғы конституциялық реформа қандай ұранмен өтті?",
    image: "/images/epoch_2022.png",
    options: ["Мәңгілік Ел", "Нұрлы Жол", "Жаңа Қазақстан", "Рухани Жаңғыру"],
    correct: 2,
  },
  {
    question: "2022 жылғы реформа бойынша Президент лауазымында қанша мерзім бола алады (мәтіндегі шектеу қалпына келтірілуіне сай)?",
    image: "/images/epoch_2022_2.png",
    options: ["3 мерзім", "Шектеусіз", "Қатарынан екі мерзімнен артық емес", "Өмір бойы"],
    correct: 2,
  },
  {
    question: "2022 жылы құрылған, азаматтар тікелей шағымдана алатын орган?",
    image: "/images/epoch_2022_3.png",
    options: ["Конституциялық Кеңес", "Жоғарғы Сот", "Конституциялық Сот", "Адам құқықтары жөніндегі уәкіл"],
    correct: 2,
  },
  {
    question: "Мәжіліс депутаттарын сайлаудың қандай жаңа жүйесі енгізілді (2022 ж.)?",
    image: "/images/epoch_2022_4.png",
    options: ["Тек мажоритарлық", "Тек пропорционалды", "Аралас сайлау жүйесі", "Жанама сайлау"],
    correct: 2,
  },
  {
    question: "Аудан және қала әкімдерін тағайындау жүйесі қалай өзгерді (2022 ж.)?",
    image: "/images/epoch_2022_5.png",
    options: ["Президент тікелей тағайындайды", "Парламент сайлайды", "Тікелей халық сайлайтын жүйе", "Мәслихат тағайындайды"],
    correct: 2,
  },
  {
    question: "2026 жылғы Конституциялық талқылауларда басты назар аударылып отырған заманауи мәселе?",
    image: "/images/epoch_2026_5.png",
    options: ["Ғарышты игеру", "Жасанды интеллектті реттеу және цифрлық құқықтар", "Ауыл шаруашылығын субсидиялау", "Жаңа астана салу"],
    correct: 1,
  },
  {
    question: "Болашақ заңнамада азаматтардың қандай қауіпсіздік құқығы конституциялық деңгейде нығаюы мүмкін?",
    image: "/images/epoch_2026_6.png",
    options: ["Экологиялық қауіпсіздік", "Экономикалық монополия", "Монархиялық басқару", "Цензура орнату"],
    correct: 0,
  }
];

export function QuizSection() {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const sectionRef = useRef<HTMLElement>(null);
  const qCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      );
    }
  }, []);

  const handleOptionClick = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    if (idx === QUIZ_QUESTIONS[currentQ].correct) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentQ < QUIZ_QUESTIONS.length - 1) {
        gsap.to(qCardRef.current, {
          opacity: 0, x: -20, duration: 0.3, onComplete: () => {
            setCurrentQ(q => q + 1);
            setSelectedOpt(null);
            setIsAnswered(false);
            gsap.fromTo(qCardRef.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3 });
          }
        });
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setScore(0);
    setShowResult(false);
    setSelectedOpt(null);
    setIsAnswered(false);
  };

  return (
    <section ref={sectionRef} className="quiz-section" aria-label="Біліміңізді тексеріңіз">
      <div className="quiz-container">
        <div className="section-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span className="section-label">Тест</span>
          <h2 className="section-title">Ата заң тарихы бойынша біліміңізді тексеріңіз</h2>
        </div>

        {!showResult ? (
          <div className="quiz-card" ref={qCardRef}>
            <div className="quiz-progress">
              Сұрақ {currentQ + 1} / {QUIZ_QUESTIONS.length}
            </div>
            
            <div className="quiz-content">
              <div 
                className="quiz-image" 
                style={{ backgroundImage: `url('${QUIZ_QUESTIONS[currentQ].image}')` }}
              />
              <div className="quiz-body">
                <h3 className="quiz-question">{QUIZ_QUESTIONS[currentQ].question}</h3>
                <div className="quiz-options">
                  {QUIZ_QUESTIONS[currentQ].options.map((opt, idx) => {
                    let btnClass = "quiz-btn";
                    if (isAnswered) {
                      if (idx === QUIZ_QUESTIONS[currentQ].correct) btnClass += " correct";
                      else if (idx === selectedOpt) btnClass += " wrong";
                    }
                    return (
                      <button 
                        key={idx} 
                        className={btnClass}
                        onClick={() => handleOptionClick(idx)}
                        disabled={isAnswered}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="quiz-result">
            <h3>Тест аяқталды!</h3>
            <div className="quiz-score">Сіздің нәтижеңіз: {score} / {QUIZ_QUESTIONS.length}</div>
            <p>
              {score === 20 ? "Керемет! Сіз Қазақстанның конституциялық тарихын өте жақсы білесіз!" : 
               score >= 15 ? "Жақсы нәтиже! Біліміңіз жоғары деңгейде." : 
               "Тарихты қайталау артықтық етпейді. Сайттағы материалдарды қайта оқып шығыңыз."}
            </p>
            <button className="quiz-restart-btn" onClick={resetQuiz}>Қайта бастау</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .quiz-section {
          padding: 6rem 1.5rem;
          background: var(--bg);
          position: relative;
          z-index: 10;
        }
        .quiz-container {
          max-width: 900px;
          margin: 0 auto;
        }
        .quiz-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
        }
        .quiz-progress {
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          font-family: var(--font-mono);
          font-size: 0.9rem;
          color: var(--text-secondary);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .quiz-content {
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .quiz-content {
            flex-direction: row;
          }
        }
        .quiz-image {
          height: 250px;
          background-size: cover;
          background-position: center;
          flex: 1;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        @media (min-width: 768px) {
          .quiz-image {
            height: auto;
            border-bottom: none;
            border-right: 1px solid rgba(255,255,255,0.05);
          }
        }
        .quiz-body {
          flex: 1.5;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .quiz-question {
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          line-height: 1.4;
          font-family: 'Playfair Display', serif;
        }
        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .quiz-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 8px;
          color: var(--text);
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }
        .quiz-btn:not(:disabled):hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .quiz-btn.correct {
          background: rgba(46, 204, 113, 0.2);
          border-color: #2ecc71;
          color: #2ecc71;
        }
        .quiz-btn.wrong {
          background: rgba(231, 76, 60, 0.2);
          border-color: #e74c3c;
          color: #e74c3c;
        }
        .quiz-result {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
        }
        .quiz-result h3 {
          font-size: 2rem;
          font-family: 'Playfair Display', serif;
          margin-bottom: 1rem;
        }
        .quiz-score {
          font-size: 3rem;
          font-weight: bold;
          color: var(--accent);
          margin-bottom: 1.5rem;
        }
        .quiz-result p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }
        .quiz-restart-btn {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 1rem 2rem;
          border-radius: 30px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }
        .quiz-restart-btn:hover {
          transform: scale(1.05);
          background: rgba(var(--accent-rgb), 0.8);
        }
      `}</style>
    </section>
  );
}
