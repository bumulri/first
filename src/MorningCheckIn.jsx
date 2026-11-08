import React, { useState, useEffect } from 'react';
//import { db } from './firebase'; // firebase.js 위치에 맞게 설정 (같은 src 폴더 기준)
const db = null;
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

export default function MorningCheckIn() {
  const [studentNum, setStudentNum] = useState('');
  const [studentName, setStudentName] = useState('');
  const [feelingScore, setFeelingScore] = useState(7);
  const [message, setMessage] = useState('');
  const [checkInList, setCheckInList] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!db) return;
    try {
      const q = query(
        collection(db, 'morning_checkins'),
        where('date', '==', todayStr),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCheckInList(data);
      });

      return () => unsubscribe();
    } catch (err) {
      console.log("Firebase 로딩 중:", err);
    }
  }, [todayStr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentNum || !studentName) {
      alert('번호와 이름을 입력해 주세요!');
      return;
    }

    try {
      if (db) {
        await addDoc(collection(db, 'morning_checkins'), {
          studentNum: Number(studentNum),
          studentName,
          feelingScore: Number(feelingScore),
          message,
          date: todayStr,
          createdAt: serverTimestamp(),
        });
      } else {
        // Firebase가 아직 미연동된 경우 기본 로컬 상태 업데이트
        setCheckInList(prev => [{
          id: Date.now(),
          studentNum: Number(studentNum),
          studentName,
          feelingScore: Number(feelingScore),
          message,
          date: todayStr
        }, ...prev]);
      }

      setMessage('');
      alert(`${studentName} 학생, 등교 체크인 완료! 👋`);
    } catch (error) {
      console.error('체크인 저장 실패:', error);
      alert('체크인 중 오류가 발생했습니다.');
    }
  };

  const avgScore = checkInList.length
    ? (
        checkInList.reduce((acc, cur) => acc + cur.feelingScore, 0) /
        checkInList.length
      ).toFixed(1)
    : 0;

  const getEmoji = (score) => {
    if (score >= 8) return '😄 최고예요!';
    if (score >= 5) return '🙂 좋아요!';
    if (score >= 3) return '😐 그저 그래요';
    return '🌧 도움이 필요해요';
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🌅 버무리 교실 모닝 체크인</h1>
        <div style={styles.summaryCard}>
          <h2>오늘 우리 학급 감정 온도</h2>
          <div style={styles.scoreDisplay}>
            <span style={styles.avgNumber}>{avgScore}</span> / 10 점 
            <span style={styles.emojiTag}>{getEmoji(avgScore)}</span>
          </div>
          <p>참여 학생: {checkInList.length}명</p>
        </div>
      </header>

      <div style={styles.mainLayout}>
        <section style={styles.formSection}>
          <h3>👋 등교 체크인 하기</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label>번호</label>
              <input
                type="number"
                placeholder="예: 5"
                value={studentNum}
                onChange={(e) => setStudentNum(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label>이름</label>
              <input
                type="text"
                placeholder="이름 입력"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label>오늘 나의 기분 (0 ~ 10점): <strong>{feelingScore}점</strong></label>
              <input
                type="range"
                min="0"
                max="10"
                value={feelingScore}
                onChange={(e) => setFeelingScore(e.target.value)}
                style={styles.slider}
              />
              <div style={styles.sliderLabels}>
                <span>😭 0점</span>
                <span>😐 5점</span>
                <span>🔥 10점</span>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label>오늘의 한 줄 다짐이나 기분 이야기</label>
              <input
                type="text"
                placeholder="예: 오늘 피구 수업 기대돼요!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.submitBtn}>
              체크인 완료하기 ✨
            </button>
          </form>
        </section>

        <section style={styles.boardSection}>
          <h3>📌 오늘 등교한 친구들 ({checkInList.length})</h3>
          <div style={styles.cardGrid}>
            {checkInList.map((item) => (
              <div key={item.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.badge}>{item.studentNum}번</span>
                  <strong>{item.studentName}</strong>
                  <span style={styles.scoreBadge}>{item.feelingScore}점</span>
                </div>
                {item.message && <p style={styles.cardMsg}>"{item.message}"</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { textAlign: 'center', marginBottom: '32px' },
  summaryCard: { backgroundColor: '#eef6ff', padding: '16px', borderRadius: '12px', display: 'inline-block', marginTop: '12px' },
  scoreDisplay: { fontSize: '28px', fontWeight: 'bold', margin: '8px 0' },
  avgNumber: { color: '#0066ff', fontSize: '36px' },
  emojiTag: { marginLeft: '12px', fontSize: '20px' },
  mainLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  formSection: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  boardSection: { backgroundColor: '#f9f9f9', padding: '24px', borderRadius: '12px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' },
  slider: { width: '100%', margin: '8px 0' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' },
  submitBtn: { padding: '12px', backgroundColor: '#0066ff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
  cardGrid: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' },
  card: { backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #0066ff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', gap: '10px', alignItems: 'center' },
  badge: { backgroundColor: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' },
  scoreBadge: { marginLeft: 'auto', fontWeight: 'bold', color: '#0066ff' },
  cardMsg: { margin: '8px 0 0 0', color: '#555', fontSize: '14px' }
};
