import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore"; 
import { db } from './firebase'; // 파이어베이스 창고(데이터베이스)를 가져옵니다.
import './index.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWord, setCurrentWord] = useState(null);
  const [studentSentence, setStudentSentence] = useState('');
  const [history, setHistory] = useState([]);

  // 화면이 처음 켜질 때, 파이어베이스 창고에서 데이터를 가져오는 마법의 주문입니다.
  useEffect(() => {
    // 'sentences'라는 이름의 폴더(컬렉션)에서 최신 순서대로 데이터를 가져오라는 뜻입니다.
    const q = query(collection(db, "sentences"), orderBy("createdAt", "desc"));
    
    // onSnapshot은 누군가 새 글을 쓰면 새로고침 없이 즉시 화면에 보여주는 기능입니다.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loadedHistory = [];
      querySnapshot.forEach((doc) => {
        loadedHistory.push({ id: doc.id, ...doc.data() });
      });
      setHistory(loadedHistory);
    });

    // 화면이 꺼질 때는 더 이상 데이터를 가져오지 않도록 약속을 해제합니다.
    return () => unsubscribe();
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // 임시 데이터
    const mockData = {
      word: searchQuery,
      hanja: '문해력 (文解力)',
      hanjaMeaning: '글월 문(文), 풀 해(解), 힘 력(力) - 글을 읽고 이해하는 힘',
      dictMeaning: '글을 읽고 이해하는 능력.',
      easyMeaning: '책이나 글을 읽었을 때, 그 내용이 무슨 뜻인지 정확하게 알아채고 이해하는 힘을 말해요!',
      example: '꾸준히 책을 읽으면 문해력이 쑥쑥 자라납니다.'
    };
    
    setCurrentWord(mockData);
  };

  // 학생이 쓴 예문을 파이어베이스 창고에 저장하는 함수입니다.
  const handleSaveSentence = async () => {
    if (!currentWord || !studentSentence.trim()) return;

    try {
      // 'sentences'라는 폴더에 새로운 문서를 추가(addDoc)합니다.
      await addDoc(collection(db, "sentences"), {
        word: currentWord.word,
        studentSentence: studentSentence,
        createdAt: serverTimestamp() // 지금 시간을 정확히 기록합니다.
      });
      
      setStudentSentence('');
      alert('참 잘했어요! 예문이 안전하게 데이터베이스에 저장되었습니다. 🌟');
    } catch (error) {
      console.error("저장 중 에러 발생: ", error);
      alert('앗, 저장에 실패했어요. 파이어베이스 데이터베이스 규칙 설정을 확인해주세요!');
    }
  };

  return (
    <div className="app-container animate-fade-in">
      <header className="glass-card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#ff9a9e', marginBottom: '0.5rem' }}>
          ✨ 친절한 초등 어휘 사전 ✨
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>
          어려운 교과서 낱말, 이제 쉽고 재미있게 알아보아요!
        </p>
      </header>

      <section className="glass-card">
        <h2 style={{ marginBottom: '1rem', color: '#88d8b0' }}>🔍 단어 찾기</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="궁금한 낱말을 입력해보세요!" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn" onClick={handleSearch}>검색</button>
        </div>
      </section>

      {currentWord && (
        <section className="glass-card animate-fade-in" style={{ borderLeft: '6px solid #ffb7b2' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#ff6f69' }}>
            {currentWord.word}
          </h2>
          <p style={{ color: '#7a7a7a', marginBottom: '1.5rem', fontWeight: 'bold' }}>
            {currentWord.hanja} <br/>
            <span style={{ fontSize: '0.9rem', color: '#999' }}>({currentWord.hanjaMeaning})</span>
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#4a4a4a', fontSize: '1.2rem' }}>📖 사전적 의미</h3>
            <p style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '10px', marginTop: '0.5rem' }}>
              {currentWord.dictMeaning}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#ff9a9e', fontSize: '1.2rem' }}>💖 쉬운 풀이</h3>
            <p style={{ background: '#fff0f0', padding: '1rem', borderRadius: '10px', marginTop: '0.5rem' }}>
              {currentWord.easyMeaning}
            </p>
          </div>

          <div>
            <h3 style={{ color: '#88d8b0', fontSize: '1.2rem' }}>💡 예시 문장</h3>
            <p style={{ background: '#f0fff4', padding: '1rem', borderRadius: '10px', marginTop: '0.5rem' }}>
              "{currentWord.example}"
            </p>
          </div>
        </section>
      )}

      {currentWord && (
        <section className="glass-card animate-fade-in" style={{ borderLeft: '6px solid #88d8b0' }}>
          <h2 style={{ marginBottom: '1rem', color: '#88d8b0' }}>✍️ 나만의 문장 만들기</h2>
          <p style={{ marginBottom: '1rem' }}>배운 낱말을 사용해서 직접 멋진 문장을 만들어볼까요?</p>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <textarea 
              className="input-field" 
              rows="3"
              placeholder={`${currentWord.word} (을)를 넣어서 문장을 완성해보세요!`}
              value={studentSentence}
              onChange={(e) => setStudentSentence(e.target.value)}
            ></textarea>
            <button className="btn" style={{ background: '#88d8b0', alignSelf: 'flex-end' }} onClick={handleSaveSentence}>
              내 단어장에 저장하기 💾
            </button>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="glass-card animate-fade-in" style={{ background: 'rgba(255,255,255,0.8)' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffb7b2' }}>📚 우리가 함께 만든 단어장 (Firebase 연동 중!)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((item) => (
              <div key={item.id} style={{ borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
                <h3 style={{ color: '#ff6f69', fontSize: '1.3rem' }}>{item.word}</h3>
                <p style={{ color: '#555', marginTop: '0.5rem' }}>
                  <strong>학생의 문장:</strong> {item.studentSentence}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
