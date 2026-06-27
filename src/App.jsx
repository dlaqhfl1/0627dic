import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from './firebase'; // 파이어베이스 데이터베이스 설정 가져오기
import './index.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWord, setCurrentWord] = useState(null);
  const [studentSentence, setStudentSentence] = useState('');
  const [history, setHistory] = useState([]);
  
  // 로딩 상태와 에러 상태를 관리하기 위한 상태 변수입니다.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 화면이 처음 켜질 때 파이어베이스에서 저장된 단어장을 실시간으로 가져옵니다.
  useEffect(() => {
    const q = query(collection(db, "sentences"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loadedHistory = [];
      querySnapshot.forEach((doc) => {
        loadedHistory.push({ id: doc.id, ...doc.data() });
      });
      setHistory(loadedHistory);
    }, (err) => {
      console.error("실시간 데이터 가져오기 오류: ", err);
    });

    return () => unsubscribe();
  }, []);

  // 구글 Gemini 인공지능 API를 사용하여 실시간으로 단어를 분석하는 함수입니다.
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentWord(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key가 등록되지 않았습니다.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
        너는 초등학생에게 문해력과 어휘력을 길러주는 다정한 초등 교사야.
        학생이 교과서에서 찾은 어려운 낱말의 뜻을 검색했어.
        입력된 단어에 대해 아래의 규칙을 준수하여 JSON 형태로 응답해줘.

        규칙:
        1. 반드시 한국어로 답변해줘.
        2. 말투는 매우 다정하고 친근하게 (~해요, ~랍니다 등) 작성해줘.
        3. 결과는 반드시 다음과 같은 JSON 구조를 지켜야 해:
        {
          "word": "검색된 단어",
          "hanja": "한자어인 경우 한자와 음 (예: 門解力). 한자어가 아니면 빈 문자열",
          "hanjaMeaning": "한자의 뜻 풀이 (예: 글월 문, 풀 해, 힘 력 - 글을 읽고 이해하는 힘). 한자어가 아니면 빈 문자열",
          "dictMeaning": "표준국어대사전 기준의 정확한 뜻풀이",
          "easyMeaning": "초등학생 수준(초등학교 3~4학년)으로 쉽게 풀어쓴 다정한 뜻풀이",
          "example": "이 단어를 사용한 초등학생 맞춤형 예시 문장"
        }

        단어: ${searchQuery}
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsedData = JSON.parse(responseText);
      
      setCurrentWord(parsedData);
    } catch (err) {
      console.error(err);
      setError("낱말을 검색하는 중에 문제가 발생했어요. API 키를 확인해 주시거나, 잠시 후 다시 시도해 주세요!");
    } finally {
      setLoading(false);
    }
  };

  // 학생이 만든 문장과 함께 단어의 '쉬운 뜻풀이'도 함께 데이터베이스에 저장합니다.
  const handleSaveSentence = async () => {
    if (!currentWord || !studentSentence.trim()) return;

    try {
      await addDoc(collection(db, "sentences"), {
        word: currentWord.word,
        studentSentence: studentSentence,
        easyMeaning: currentWord.easyMeaning, // [수정] 단어의 뜻풀이도 함께 저장합니다!
        createdAt: serverTimestamp()
      });
      
      setStudentSentence('');
      alert('참 잘했어요! 선생님도 깜짝 놀랄 만한 멋진 문장이네요! 단어장에 안전하게 저장되었습니다. 🌟');
    } catch (error) {
      console.error("저장 오류: ", error);
      alert('앗! 데이터베이스에 저장하지 못했어요. 파이어베이스 규칙 설정을 다시 확인해 주세요.');
    }
  };

  return (
    <div className="app-container animate-fade-in">
      {/* 헤더 */}
      <header className="glass-card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#ff9a9e', marginBottom: '0.5rem' }}>
          ✨ 친절한 초등 어휘 사전 ✨
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>
          어려운 교과서 낱말, 이제 쉽고 재미있게 알아보아요!
        </p>
      </header>

      {/* 2단 레이아웃 본문 영역 */}
      <div className="layout-wrapper">
        
        {/* 왼쪽 영역: 단어 검색 및 카드 화면 */}
        <div className="main-content">
          
          {/* 검색창 */}
          <section className="glass-card">
            <h2 style={{ marginBottom: '1rem', color: '#88d8b0' }}>🔍 단어 찾기</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="궁금한 낱말을 입력해보세요! (예: 배려, 과학, 식물)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={loading}
              />
              <button className="btn" onClick={handleSearch} disabled={loading}>
                {loading ? '찾는 중...' : '검색'}
              </button>
            </div>
          </section>

          {/* 로딩 표시 */}
          {loading && (
            <div className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{
                display: 'inline-block',
                width: '50px',
                height: '50px',
                border: '5px solid rgba(255, 183, 178, 0.3)',
                borderRadius: '50%',
                borderTopColor: '#ffb7b2',
                animation: 'spin 1s ease-in-out infinite',
                marginBottom: '1rem'
              }}></div>
              <h3 style={{ color: 'var(--text-light)' }}>인공지능 선생님이 사전에서 열심히 찾는 중이에요... 🧑‍🏫</h3>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="glass-card animate-fade-in" style={{ background: '#ffebeb', borderLeft: '6px solid #ff6f69', color: '#d9534f' }}>
              <h3>⚠️ 문제가 생겼어요!</h3>
              <p style={{ marginTop: '0.5rem' }}>{error}</p>
            </div>
          )}

          {/* 뜻풀이 결과 카드 */}
          {currentWord && (
            <section className="glass-card animate-fade-in" style={{ borderLeft: '6px solid #ffb7b2' }}>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: '#ff6f69' }}>
                {currentWord.word}
              </h2>
              
              {currentWord.hanja && (
                <p style={{ color: '#7a7a7a', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                  {currentWord.hanja} <br/>
                  <span style={{ fontSize: '0.95rem', color: '#e57373', fontWeight: 'normal' }}>
                    💡 한자 풀이: {currentWord.hanjaMeaning}
                  </span>
                </p>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#4a4a4a', fontSize: '1.2rem' }}>📖 사전 뜻 (표준국어대사전)</h3>
                <p style={{ background: 'rgba(255,255,255,0.6)', padding: '1rem', borderRadius: '10px', marginTop: '0.5rem', lineHeight: '1.6' }}>
                  {currentWord.dictMeaning}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#ff9a9e', fontSize: '1.2rem' }}>💖 초등학생을 위한 쉬운 풀이</h3>
                <p style={{ background: '#fff3f3', padding: '1.2rem', borderRadius: '10px', marginTop: '0.5rem', lineHeight: '1.6', fontSize: '1.1rem', fontWeight: '500' }}>
                  {currentWord.easyMeaning}
                </p>
              </div>

              <div>
                <h3 style={{ color: '#88d8b0', fontSize: '1.2rem' }}>💡 이렇게 쓰여요 (예문)</h3>
                <p style={{ background: '#f0fff4', padding: '1rem', borderRadius: '10px', marginTop: '0.5rem', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "{currentWord.example}"
                </p>
              </div>
            </section>
          )}

          {/* 나만의 문장 만들기 */}
          {currentWord && (
            <section className="glass-card animate-fade-in" style={{ borderLeft: '6px solid #88d8b0' }}>
              <h2 style={{ marginBottom: '1rem', color: '#88d8b0' }}>✍️ 나만의 문장 만들기</h2>
              <p style={{ marginBottom: '1rem' }}>배운 낱말 <strong>"{currentWord.word}"</strong>을(를) 넣어서 멋진 문장을 만들어볼까요?</p>
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <textarea 
                  className="input-field" 
                  rows="3"
                  placeholder={`여기에 직접 문장을 지어보세요!`}
                  value={studentSentence}
                  onChange={(e) => setStudentSentence(e.target.value)}
                ></textarea>
                <button className="btn" style={{ background: '#88d8b0', alignSelf: 'flex-end' }} onClick={handleSaveSentence}>
                  내 단어장에 저장하기 💾
                </button>
              </div>
            </section>
          )}

        </div>

        {/* 오른쪽 영역: 실시간 단어장 사이드바 */}
        <div className="sidebar-content">
          <section className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem', color: '#ff9a9e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📚 내가 모은 단어장
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              지금까지 배운 단어들과 내가 만든 문장이 저장되는 공간이에요!
            </p>
            
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#bbb', padding: '2rem 0' }}>
                아직 저장된 단어가 없어요. 첫 단어를 등록해 보세요! ✏️
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: '650px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      background: 'white', 
                      borderRadius: '15px', 
                      padding: '1rem', 
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                      borderLeft: '5px solid #ffb7b2',
                      animation: 'fadeIn 0.3s ease'
                    }}
                  >
                    <h3 style={{ color: '#ff6f69', fontSize: '1.2rem', marginBottom: '0.3rem' }}>{item.word}</h3>
                    
                    {/* 단어의 쉬운 뜻풀이 함께 표시 */}
                    {item.easyMeaning && (
                      <p style={{ fontSize: '0.9rem', color: '#666', background: '#fff9f9', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                        💡 {item.easyMeaning}
                      </p>
                    )}
                    
                    <p style={{ color: '#4a4a4a', fontSize: '0.95rem', borderTop: '1px dashed #f0f0f0', paddingTop: '0.5rem' }}>
                      <strong>✍️ 지은 문장:</strong> {item.studentSentence}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}

export default App;
