import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const participationOptions = ['적극적으로 참여하였다', '일부 프로그램에 참여하였다', '관람 위주로 참여하였다', '참여 및 참석하지 않았다']
const reasonOptions = ['공연 및 무대 프로그램', '체험 및 이벤트', '친구들과의 즐거운 시간', '먹거리 및 부스', '기타']
const satisfactionOptions = ['매우 만족', '만족', '보통', '불만족', '매우 불만족']
const agreementOptions = ['매우 그렇다', '그렇다', '보통', '그렇지 않다', '전혀 그렇지 않다']
const intentOptions = ['적극적으로 참여하겠다', '참여할 의향이 있다', '보통이다', '참여하고 싶지 않다']

// 관리자 화면에는 일반 아이디만 표시하고, Supabase Auth 내부에서만 별칭 이메일을 사용합니다.
const ADMIN_AUTH_EMAIL = 'chajungsin@survey-admin.invalid'

const questions = [
  { key: 'q2_reason', title: '축제에서 가장 좋았던 점은 무엇인가요?', options: reasonOptions },
  { key: 'q3_satisfaction', title: '축제 전반에 대해 얼마나 만족하셨나요?', options: satisfactionOptions },
  { key: 'q4_diversity', title: '축제 프로그램은 다양하게 구성되었다고 생각하나요?', options: satisfactionOptions },
  { key: 'q5_operations', title: '축제 운영은 전반적으로 원활했다고 생각하나요?', options: agreementOptions },
  { key: 'q6_facilities', title: '축제 장소와 시설에 만족하셨나요?', options: satisfactionOptions },
  { key: 'q7_belonging', title: '축제를 통해 친구들과 교류하고 학교 소속감을 느꼈나요?', options: agreementOptions },
  { key: 'q8_future_intent', title: '향후 학교 축제에도 참여할 의향이 있나요?', options: intentOptions },
]

const emptyAnswers = {
  q1_participation: '', q2_reason: '', q3_satisfaction: '', q4_diversity: '',
  q5_operations: '', q6_facilities: '', q7_belonging: '', q8_future_intent: '',
  q9_best_program: '', q10_suggestions: '',
}

function getDeviceToken() {
  let id = localStorage.getItem('festival-survey-device')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('festival-survey-device', id)
  }
  return id
}

async function hashDeviceToken() {
  const bytes = new TextEncoder().encode(getDeviceToken())
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function Field({ title, options, value, onChange, required = true }) {
  return <fieldset className="question">
    <legend>{title}{required && <span className="required"> *</span>}</legend>
    <div className="options">
      {options.map((option) => <label className={value === option ? 'option selected' : 'option'} key={option}>
        <input type="radio" name={title} value={option} checked={value === option} onChange={() => onChange(option)} />
        <span className="radio-mark" /><span>{option}</span>
      </label>)}
    </div>
  </fieldset>
}

function Survey({ onAdmin }) {
  const [answers, setAnswers] = useState(emptyAnswers)
  const [status, setStatus] = useState('form')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const nonParticipant = answers.q1_participation === '참여 및 참석하지 않았다'
  const set = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    if (!answers.q1_participation) return setMessage('1번 문항에 응답해 주세요.')
    if (!nonParticipant) {
      const missing = questions.find((q) => !answers[q.key])
      if (missing) return setMessage('모든 객관식 문항에 응답해 주세요.')
    }
    setBusy(true); setMessage('')
    try {
      const device_hash = await hashDeviceToken()
      const payload = nonParticipant
        ? { device_hash, participated: false, q1_participation: answers.q1_participation }
        : { device_hash, participated: true, ...answers }
      const { error } = await supabase.from('festival_survey_responses').insert(payload)
      if (error) {
        if (error.code === '23505') {
          setStatus('duplicate')
        } else {
          console.error(error)
          setMessage('응답 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
        }
      } else {
        setStatus('complete')
      }
    } catch (error) {
      console.error(error)
      setMessage('응답을 전송하지 못했습니다. 인터넷 연결을 확인해 주세요.')
    } finally { setBusy(false) }
  }

  if (status === 'complete') return <section className="result-card">
    <div className="result-icon">✓</div><h2>응답이 제출되었습니다.</h2>
    <p>소중한 의견 감사합니다. 보내주신 응답은 향후 축제 운영 개선을 위한 자료로 활용됩니다.</p>
  </section>
  if (status === 'duplicate') return <section className="result-card">
    <div className="result-icon">!</div><h2>이미 참여하셨습니다.</h2>
    <p>동일한 브라우저에서는 설문을 한 번만 제출할 수 있습니다.</p>
  </section>

  return <form className="survey-card" onSubmit={submit}>
    <div className="intro">
      <span className="eyebrow">ASIA AVIATION</span>
      <h1>2026학년도<br />축제 만족도 설문조사</h1>
      <p>축제 운영을 평가하고 향후 더 나은 프로그램을 마련하기 위한 설문입니다. 응답은 익명으로 처리되며 개인별 응답 내용은 공개되지 않습니다. 솔직한 의견을 부탁드립니다.</p>
      <div className="meta"><span>⏱ 약 2~3분</span><span>익명 설문</span><span>재학생 대상</span></div>
    </div>

    <div className="section-heading"><span>01</span><div><b>축제 참여 여부</b><small>참여 형태를 선택해 주세요.</small></div></div>
    <Field title="축제에 어떻게 참여하셨나요?" options={participationOptions} value={answers.q1_participation} onChange={(v) => set('q1_participation', v)} />
    {nonParticipant ? <div className="notice-box">참여하지 않으신 경우에도 응답해 주셔서 감사합니다. 제출하시면 설문이 종료됩니다.</div> : answers.q1_participation ? <>
      <div className="section-heading"><span>02</span><div><b>축제 만족도</b><small>각 문항에 가장 가까운 답변을 선택해 주세요.</small></div></div>
      {questions.map((q, i) => <Field key={q.key} title={q.title} options={q.options} value={answers[q.key]} onChange={(v) => set(q.key, v)} />)}
      <div className="section-heading"><span>03</span><div><b>자유 의견</b><small>더 나은 축제를 위한 의견을 들려주세요.</small></div></div>
      <div className="question text-question"><label htmlFor="best">가장 기억에 남는 프로그램이나 좋았던 점</label><textarea id="best" maxLength={2000} rows={3} value={answers.q9_best_program} onChange={(e) => set('q9_best_program', e.target.value)} placeholder="기억에 남는 프로그램을 자유롭게 작성해 주세요. (선택)" /></div>
      <div className="question text-question"><label htmlFor="suggestions">개선이 필요한 점이나 건의사항</label><textarea id="suggestions" maxLength={2000} rows={3} value={answers.q10_suggestions} onChange={(e) => set('q10_suggestions', e.target.value)} placeholder="개선 의견이나 건의사항을 자유롭게 작성해 주세요. (선택)" /></div>
    </> : <div className="notice-box">위 문항에서 참여 여부를 선택하면 다음 문항이 표시됩니다.</div>}
    {message && <p className="error-message" role="alert">{message}</p>}
    <button className="primary-button" type="submit" disabled={busy || !answers.q1_participation}>{busy ? '제출 중…' : '설문 제출하기'}</button>
    <p className="privacy-note">※ 이름, 전화번호 등 개인을 식별할 수 있는 정보는 작성하지 말아 주세요.<br />※ 중복 응답 방지를 위해 브라우저에 익명 식별값이 저장됩니다. 다른 브라우저·기기 사용 또는 저장정보 삭제 시 중복 제한을 우회할 수 있습니다.</p>
    <button className="admin-link" type="button" onClick={onAdmin}>관리자 페이지</button>
  </form>
}

function Admin({ onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.app_metadata?.role === 'admin') setSession(data.session)
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => {
      if (current?.user?.app_metadata?.role === 'admin') setSession(current)
      else setSession(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function login(e) {
    e.preventDefault(); setError('')
    if (username.trim() !== 'chajungsin') return setError('로그인 정보를 확인해 주세요.')
    const { data, error } = await supabase.auth.signInWithPassword({ email: ADMIN_AUTH_EMAIL, password })
    if (error) return setError('로그인 정보를 확인해 주세요.')
    if (data.user?.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut()
      return setError('관리자 권한이 부여된 계정이 아닙니다.')
    }
    setSession(data.session)
  }

  async function loadRows() {
    setLoading(true); setError('')
    const { data, error } = await supabase.from('festival_survey_responses').select('*').order('created_at', { ascending: false })
    if (error) setError('응답을 불러오지 못했습니다. 관리자 권한 및 데이터베이스 정책을 확인해 주세요.')
    else setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { if (session) loadRows() }, [session])

  const participants = rows.filter((r) => r.participated)
  const nonParticipants = rows.length - participants.length
  const csvCell = (v) => '"' + String(v ?? '').replaceAll('"', '""') + '"'
  function exportCsv() {
    const cols = ['created_at','participated','q1_participation','q2_reason','q3_satisfaction','q4_diversity','q5_operations','q6_facilities','q7_belonging','q8_future_intent','q9_best_program','q10_suggestions']
    const labels = ['제출일시','참여 여부','참여 형태','가장 좋았던 점','전반적 만족도','프로그램 다양성','운영 원활성','장소 및 시설','교류 및 소속감','향후 참여 의향','기억에 남는 점','개선 의견']
    const content = '\uFEFF' + [labels, ...rows.map((r) => cols.map((c) => r[c] ?? ''))].map((line) => line.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = '2026_축제_만족도_설문결과.csv'; a.click(); URL.revokeObjectURL(url)
  }

  if (!authChecked) return <div className="admin-card">관리자 인증 확인 중…</div>
  if (!session) return <form className="admin-card" onSubmit={login}>
    <button type="button" className="back-link" onClick={onBack}>← 설문으로 돌아가기</button>
    <span className="eyebrow">ADMIN</span><h1>관리자 로그인</h1>
    <p className="muted">관리자 아이디와 비밀번호를 입력해 주세요.</p>
    <label className="input-label">아이디<input type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="관리자 아이디" /></label>
    <label className="input-label">비밀번호<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    {error && <p className="error-message">{error}</p>}
    <button className="primary-button" type="submit">로그인</button>
  </form>

  const objective = [
    ['참여 형태','q1_participation',participationOptions.slice(0,3)],
    ['가장 좋았던 점','q2_reason',reasonOptions],
    ['전반적 만족도','q3_satisfaction',satisfactionOptions],
    ['프로그램 다양성','q4_diversity',satisfactionOptions],
    ['운영 원활성','q5_operations',agreementOptions],
    ['장소 및 시설','q6_facilities',satisfactionOptions],
    ['교류 및 소속감','q7_belonging',agreementOptions],
    ['향후 참여 의향','q8_future_intent',intentOptions],
  ]
  const pct = (n, total) => total ? Math.round(n / total * 100) : 0

  return <main className="admin-page">
    <div className="admin-top"><div><span className="eyebrow">ADMIN DASHBOARD</span><h1>축제 설문 결과</h1></div><div className="admin-actions"><button className="secondary-button" onClick={loadRows}>새로고침</button><button className="secondary-button" onClick={exportCsv} disabled={!rows.length}>엑셀용 CSV 저장</button><button className="secondary-button" onClick={async () => { await supabase.auth.signOut(); setSession(null) }}>로그아웃</button></div></div>
    {error && <p className="error-message">{error}</p>}
    <div className="stats-grid">
      <div className="stat-card"><small>전체 응답</small><strong>{rows.length}</strong><span>건</span></div>
      <div className="stat-card"><small>축제 참여 응답</small><strong>{participants.length}</strong><span>건</span></div>
      <div className="stat-card"><small>미참여 응답</small><strong>{nonParticipants}</strong><span>건</span></div>
    </div>
    {loading ? <p>응답을 불러오는 중입니다…</p> : <div className="report-grid">
      {objective.map(([title,key,opts]) => {
        const total = key === 'q1_participation' ? participants.length : participants.filter((r) => r[key]).length
        return <section className="report-card" key={key}><h2>{title}</h2>{opts.map((opt) => {
          const count = participants.filter((r) => r[key] === opt).length
          return <div className="bar-row" key={opt}><div className="bar-label"><span>{opt}</span><b>{count}명 · {pct(count,total)}%</b></div><div className="bar-track"><div className="bar-fill" style={{width: pct(count,total)+'%'}} /></div></div>
        })}</section>
      })}
    </div>}
    <section className="report-card free-answers"><h2>주관식 응답</h2>
      {participants.filter((r) => r.q9_best_program || r.q10_suggestions).length === 0 ? <p className="muted">등록된 주관식 응답이 없습니다.</p> : participants.filter((r) => r.q9_best_program || r.q10_suggestions).map((r) => <article className="answer-item" key={r.id}><small>{new Date(r.created_at).toLocaleString('ko-KR')}</small>{r.q9_best_program && <p><b>기억에 남는 점</b><br />{r.q9_best_program}</p>}{r.q10_suggestions && <p><b>개선 의견</b><br />{r.q10_suggestions}</p>}</article>)}
    </section>
    <button className="back-link bottom-back" onClick={onBack}>← 설문 화면</button>
  </main>
}

export default function App() {
  const [page, setPage] = useState('survey')
  return <div className="app-shell">
    <header className="site-header"><div className="brand-mark">AA</div><div><b>아세아항공직업전문학교</b><small>교육지원처</small></div></header>
    {page === 'survey' ? <Survey onAdmin={() => setPage('admin')} /> : <Admin onBack={() => setPage('survey')} />}
    <footer>© 2026 아세아항공직업전문학교 · 교육지원처</footer>
  </div>
}