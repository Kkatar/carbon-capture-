import React, { useState, useEffect, useRef } from 'react'

const API_BASE = import.meta.env.PROD ? '/_/backend/api' : '/api'

// ============================================================================
// 1. LANDING PAGE COMPONENT
// ============================================================================
function LandingPage({ onGetStarted, onTryDemo }) {
  const [activeFaq, setActiveFaq] = useState(null)
  const [coachInput, setCoachInput] = useState('')
  const [coachMessages, setCoachMessages] = useState([
    { sender: 'ai', message: "Hi! I'm your AI Sustainability Coach. Ask me how to reduce your carbon footprint today!" }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = 450)
    let height = (canvas.height = 450)

    const particles = []
    const particleCount = 65
    const center = { x: width / 2, y: height / 2 }
    const radius = 150

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      particles.push({
        x3d: radius * Math.sin(phi) * Math.cos(theta),
        y3d: radius * Math.sin(phi) * Math.sin(theta),
        z3d: radius * Math.cos(phi),
        baseSize: Math.random() * 2 + 1,
        color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#a7f3d0' : '#ffffff'
      })
    }

    let angleY = 0.003
    let angleX = 0.001

    const rotate = () => {
      ctx.clearRect(0, 0, width, height)
      
      const glow = ctx.createRadialGradient(center.x, center.y, radius - 40, center.x, center.y, radius + 20)
      glow.addColorStop(0, 'rgba(16, 185, 129, 0.01)')
      glow.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)')
      glow.addColorStop(1, 'rgba(16, 185, 129, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(center.x, center.y, radius + 20, 0, Math.PI * 2)
      ctx.fill()

      const sinY = Math.sin(angleY)
      const cosY = Math.cos(angleY)
      const sinX = Math.sin(angleX)
      const cosX = Math.cos(angleX)

      particles.forEach((p) => {
        let x1 = p.x3d * cosY - p.z3d * sinY
        let z1 = p.x3d * sinY + p.z3d * cosY
        let y2 = p.y3d * cosX - z1 * sinX
        let z2 = p.y3d * sinX + z1 * cosX

        p.x3d = x1
        p.y3d = y2
        p.z3d = z2

        const scale = 300 / (300 + z2)
        const x2d = center.x + x1 * scale
        const y2d = center.y + y2 * scale
        const size = p.baseSize * scale

        if (z2 > -150) {
          ctx.beginPath()
          ctx.arc(x2d, y2d, size, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.globalAlpha = (z2 + radius) / (radius * 2) + 0.2
          ctx.fill()
        }
      })
      
      ctx.globalAlpha = 1.0
      animationFrameId = requestAnimationFrame(rotate)
    }

    rotate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  const handleCoachSubmit = (e) => {
    e.preventDefault()
    if (!coachInput.trim()) return

    const userMsg = coachInput
    setCoachMessages(prev => [...prev, { sender: 'user', message: userMsg }])
    setCoachInput('')
    setIsTyping(true)

    setTimeout(() => {
      let aiResponse = "That's a great question! Swooping down commutes by cycling saves up to 8kg carbon. Let's analyze details!"
      const lower = userMsg.toLowerCase()
      if (lower.includes('car') || lower.includes('drive')) {
        aiResponse = "To reduce transport emissions: swap short commutes with public rails, saving up to 24kg monthly."
      } else if (lower.includes('eat') || lower.includes('food') || lower.includes('diet')) {
        aiResponse = "Meals play a key role. Adopting a vegetarian diet twice a week cuts food footprints by 30%."
      } else if (lower.includes('electricity') || lower.includes('energy')) {
        aiResponse = "Energy optimization: shift to LED light bulbs and eliminate vampiric standby loads."
      }

      setCoachMessages(prev => [...prev, { sender: 'ai', message: aiResponse }])
      setIsTyping(false)
    }, 800)
  }

  const faqData = [
    { q: "How does EcoTrack AI calculate my carbon score?", a: "We apply verified emission factor tables (EPA/DEFRA) for miles traveled, utility kWh consumption, and food selections. Graded 0-100." },
    { q: "Can I use the app offline or without registering?", a: "Yes! EcoTrack AI supports a full browser-level Demo Mode to preview all metrics, tracking, and charts locally without a backend connection." },
    { q: "How does the AI Coach work?", a: "Our AI coach links to the Gemini API using your lifestyle parameters and logs to formulate contextualized carbon-reduction plans." }
  ]

  return (
    <div className="landing-page animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 5%', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.4rem' }}>
          <span style={{ fontSize: '1.8rem' }}>🌱</span>
          <span style={{ fontFamily: 'var(--font-display)', background: 'linear-gradient(90deg, #10b981, #a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EcoTrack AI</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onTryDemo} className="glass-button secondary">Try Demo</button>
          <button onClick={onGetStarted} className="glass-button primary">Get Started</button>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', padding: '5rem 5%', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div>
          <span style={{ background: 'hsla(var(--primary-emerald) / 0.15)', color: 'hsl(var(--primary-emerald))', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid hsla(var(--primary-emerald) / 0.3)' }}>Eco-Friendly Futuristic Dashboard</span>
          <h1 style={{ fontSize: '3.5rem', marginTop: '1.5rem', lineHeight: 1.1, fontFamily: 'var(--font-display)' }}>
            Track Your Carbon Footprint. <br />
            <span style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Change Your Future.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', marginTop: '1.5rem', lineHeight: 1.6, maxWidth: '500px' }}>
            EcoTrack AI is a premium dashboard combining game elements, receipt scans, and an AI Sustainability Coach to make carbon footprint tracking simple and engaging.
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2.5rem' }}>
            <button onClick={onGetStarted} className="glass-button primary" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>Get Started Now</button>
            <button onClick={onTryDemo} className="glass-button secondary" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>Explore Demo Mode</button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      </section>

      {/* Live AI Coach Interactive Preview */}
      <section style={{ padding: '5rem 5%', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)' }}>Meet Your Personal Climate Coach</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.6 }}>
            Ask questions, check standard carbon calculations, or generate customized meal and travel plans.
            Our smart coach reads your dashboard metrics to provide tailored, localized support.
          </p>
        </div>
        <div className="glass-panel" style={{ height: '360px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
            AI Coach Sandbox
          </div>
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {coachMessages.map((msg, index) => (
              <div key={index} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'user' ? 'linear-gradient(135deg, #0b9e6f, #042e23)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                maxWidth: '80%',
                fontSize: '0.9rem'
              }}>
                {msg.message}
              </div>
            ))}
            {isTyping && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Coach is thinking...</div>}
          </div>
          <form onSubmit={handleCoachSubmit} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
            <input type="text" placeholder="Ask: 'How to save car emissions?'" value={coachInput} onChange={(e) => setCoachInput(e.target.value)} className="glass-input" style={{ padding: '0.6rem' }} />
            <button type="submit" className="glass-button primary" style={{ padding: '0.6rem 1.2rem' }}>Send</button>
          </form>
        </div>
      </section>

      {/* FAQ Accordions */}
      <section style={{ padding: '5rem 5%', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.2rem', fontFamily: 'var(--font-display)', marginBottom: '3rem' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqData.map((item, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                <span>{item.q}</span>
                <span>{activeFaq === idx ? '-' : '+'}</span>
              </div>
              {activeFaq === idx && <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '0.95rem' }}>{item.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ============================================================================
// 2. SIDEBAR COMPONENT
// ============================================================================
function Sidebar({ currentView, onViewChange, user, onLogout, isDarkMode, onToggleTheme }) {
  const menuItems = [
    { id: 'dashboard', label: 'Personal Dashboard', icon: '📊' },
    { id: 'calculator', label: 'Carbon Calculator', icon: '🧮' },
    { id: 'tracker', label: 'Activity Tracker', icon: '⚡' },
    { id: 'coach', label: 'AI Eco Coach', icon: '🤖' },
    { id: 'analytics', label: 'Carbon Analytics', icon: '📈' },
    { id: 'gamification', label: 'Rewards & Leaderboard', icon: '🏆' }
  ]

  if (user && user.is_admin) {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: '⚙️' })
  }

  return (
    <aside className="glass-panel" style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 'var(--sidebar-width)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem 1rem', borderRadius: 0, zIndex: 100
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.2rem', marginBottom: '2.5rem' }}>
          <span>🌱</span>
          <span style={{ fontFamily: 'var(--font-display)', background: 'linear-gradient(90deg, #10b981, #a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EcoTrack AI</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem', width: '100%', padding: '0.85rem 1rem', fontSize: '0.92rem', borderRadius: '8px', cursor: 'pointer',
                background: currentView === item.id ? 'hsla(var(--primary-emerald) / 0.15)' : 'transparent',
                color: currentView === item.id ? 'hsl(var(--primary-emerald))' : 'var(--text-main)'
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '0.5rem 0.75rem', borderRadius: '30px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Theme Mode</span>
          <button onClick={onToggleTheme} style={{ background: 'hsl(var(--primary-emerald))', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'hsl(var(--primary-emerald))', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifycontent: 'center', fontSize: '1rem', lineHeight: '38px', textAlign: 'center' }}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user.username}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level {user.level} &bull; 🔥 {user.streak}d</p>
            </div>
            <button onClick={onLogout} style={{ fontSize: '1.15rem', cursor: 'pointer' }}>🚪</button>
          </div>
        )}
      </div>
    </aside>
  )
}

// ============================================================================
// 3. DASHBOARD COMPONENT
// ============================================================================
function Dashboard({ user, stats, onNavigate }) {
  const carbonScore = stats?.carbon_score ?? 78
  const monthlyEmissions = stats?.total_co2_produced ?? 350.5
  const totalSaved = stats?.total_co2_saved ?? 85.2
  const currentStreak = user?.streak ?? 0
  const userLevel = user?.level ?? 1
  const userXp = user?.xp ?? 0
  const xpNeeded = userLevel * 500
  const xpPercentage = Math.min(100, Math.floor((userXp / xpNeeded) * 100))

  const radius = 55
  const stroke = 8
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (xpPercentage / 100) * circumference

  return (
    <div className="dashboard-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome back, {user?.username || 'Eco Pioneer'}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here is your environmental impact status for today.</p>
        </div>
        <button onClick={() => onNavigate('tracker')} className="glass-button primary">+ Log Daily Activity</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--primary-emerald))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>CARBON SCORE</span>
            <span>🌱</span>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0', color: 'hsl(var(--primary-emerald))' }}>{carbonScore}</p>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>MONTHLY CO₂</span>
            <span>🚗</span>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>{monthlyEmissions} <span style={{ fontSize: '1rem' }}>kg</span></p>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>CO₂ SAVED</span>
            <span>♻️</span>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0', color: '#60a5fa' }}>{totalSaved} <span style={{ fontSize: '1rem' }}>kg</span></p>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #f97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>HABIT STREAK</span>
            <span>🔥</span>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0', color: '#fb923c' }}>{currentStreak} <span style={{ fontSize: '1rem' }}>days</span></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
          <div style={{ position: 'relative', width: '110px', height: '110px' }}>
            <svg height={radius * 2} width={radius * 2}>
              <circle stroke="rgba(255, 255, 255, 0.05)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
              <circle stroke="hsl(var(--primary-emerald))" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} className="progress-ring-circle" />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{userLevel}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LEVEL</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--primary-emerald))', fontWeight: 700 }}>ECO LEVEL PROGRESS</span>
            <h2 style={{ fontSize: '1.4rem', marginTop: '0.25rem' }}>Active Explorer</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.75rem' }}>
              <span>{userXp} / {xpNeeded} XP</span>
              <span>{xpPercentage}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginTop: '0.35rem' }}>
              <div style={{ width: `${xpPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #a7f3d0)', borderRadius: '10px' }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifycontent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>🌱 AI Recommendations</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {stats?.prediction?.message || "Swapping just two short drives per week with walking offsets up to 16kg CO₂ monthly!"}
            </p>
          </div>
          <button onClick={() => onNavigate('coach')} className="glass-button secondary" style={{ width: '100%', marginTop: '1rem' }}>Ask Climate Coach</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 4. CALCULATOR COMPONENT
// ============================================================================
function Calculator({ user, onCalculationComplete, isDemoMode }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    transport_type: 'car_petrol', transport_distance: '500', electricity_kwh: '250', water_liters: '3000',
    meat_consumption: 'moderate', shopping_frequency: 'moderate', waste_recycled: 30
  })
  
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isDemoMode) {
      setTimeout(() => {
        const transDist = parseFloat(formData.transport_distance || 0)
        const elecKwh = parseFloat(formData.electricity_kwh || 0)
        const waterLit = parseFloat(formData.water_liters || 0)
        
        const factors = { car_petrol: 0.18, car_diesel: 0.17, car_electric: 0.05, motorcycle: 0.10, bus: 0.08, train: 0.04, walk: 0, bike: 0 }
        const trans_co2 = transDist * (factors[formData.transport_type] || 0.18)
        const elec_co2 = elecKwh * 0.4
        const water_co2 = waterLit * 0.0003
        
        const food_f = { high: 300, moderate: 180, low: 120, vegetarian: 80, vegan: 45 }
        const food_co2 = food_f[formData.meat_consumption] || 180
        
        const shop_f = { high: 200, moderate: 100, low: 50, minimal: 15 }
        const shop_co2 = shop_f[formData.shopping_frequency] || 100
        const waste_co2 = 80 * (1 - (formData.waste_recycled / 100) * 0.5)
        
        const monthly = trans_co2 + elec_co2 + water_co2 + food_co2 + shop_co2 + waste_co2
        const res = {
          daily_co2: Math.round((monthly / 30.4) * 100) / 100,
          monthly_co2: Math.round(monthly * 100) / 100,
          annual_co2: Math.round((monthly * 12) * 100) / 100,
          carbon_score: Math.max(0, Math.min(100, Math.round(100 - (monthly - 100) / 14))),
          breakdown: { transport: trans_co2, electricity: elec_co2, water: water_co2, food: food_co2, shopping: shop_co2, waste: waste_co2 },
          equivalents: { trees: Math.round(monthly / 1.67), car_km: Math.round(monthly / 0.18), description: `Emissions equal driving ${Math.round(monthly / 0.18)} km or require ${Math.round(monthly / 1.67)} trees to absorb.` }
        }
        setResults(res)
        setLoading(false)
        onCalculationComplete(res)
      }, 800)
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/calculator/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      if (!response.ok) throw new Error("Calculation validation failed.")
      const res = await response.json()
      setResults(res)
      onCalculationComplete(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="calculator-view animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2>Smart Carbon Calculator</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Answer a few quick questions to compile your environmental scores.</p>
      
      {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      {!results ? (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
          {step === 1 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>Commute Transit Type</label>
              <select className="glass-input" value={formData.transport_type} onChange={e => handleInputChange('transport_type', e.target.value)}>
                <option value="car_petrol">Gasoline Passenger Car</option>
                <option value="car_electric">Electric Vehicle (EV)</option>
                <option value="train">Subway / Rail Train</option>
                <option value="walk">Walk or Bicycle</option>
              </select>
              <label>Commute Distance monthly (km)</label>
              <input type="number" className="glass-input" value={formData.transport_distance} onChange={e => handleInputChange('transport_distance', e.target.value)} required />
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>Utility Power Usage (kWh)</label>
              <input type="number" className="glass-input" value={formData.electricity_kwh} onChange={e => handleInputChange('electricity_kwh', e.target.value)} required />
              <label>Water Usage (Liters)</label>
              <input type="number" className="glass-input" value={formData.water_liters} onChange={e => handleInputChange('water_liters', e.target.value)} required />
            </div>
          )}

          {step === 3 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>Dietary Selections</label>
              <select className="glass-input" value={formData.meat_consumption} onChange={e => handleInputChange('meat_consumption', e.target.value)}>
                <option value="high">Heavy Meat Eater</option>
                <option value="moderate">Moderate Meat Eater</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>
          )}

          {step === 4 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>Recycling Density (%)</label>
              <input type="range" min="0" max="100" value={formData.waste_recycled} onChange={e => handleInputChange('waste_recycled', parseInt(e.target.value))} />
              <div style={{ textAlign: 'right', fontWeight: 600 }}>{formData.waste_recycled}%</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            {step > 1 ? <button type="button" onClick={() => setStep(step - 1)} className="glass-button secondary">Back</button> : <div />}
            {step < 4 ? <button type="button" onClick={() => setStep(step + 1)} className="glass-button primary">Next</button> : <button type="submit" className="glass-button primary">{loading ? 'Analyzing...' : 'Audit Footprint'}</button>}
          </div>
        </form>
      ) : (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h3>Footprint Audit Compiled!</h3>
          <p style={{ color: 'var(--text-muted)' }}>Score: <span style={{ color: 'hsl(var(--primary-emerald))', fontWeight: 800 }}>{results.carbon_score}</span></p>
          <p style={{ margin: '1rem 0' }}>Emissions: <b>{results.monthly_co2} kg</b> monthly</p>
          <div className="glass-card" style={{ background: 'rgba(16,185,129,0.05)', marginTop: '1rem' }}>{results.equivalents.description}</div>
          <button onClick={() => setResults(null)} className="glass-button primary" style={{ marginTop: '2rem' }}>Reset Calculator</button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 5. TRACKER COMPONENT
// ============================================================================
function Tracker({ user, onLogSubmitted, isDemoMode }) {
  const [category, setCategory] = useState('transport')
  const [amount, setAmount] = useState('')
  const [details, setDetails] = useState('walking')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    if (isDemoMode) {
      setLogs([
        { id: 1, category: 'transport', amount: 12, details: 'walking', co2_produced: 0, co2_saved: 2.16, timestamp: new Date().toISOString() }
      ])
      return
    }
    try {
      const response = await fetch(`${API_BASE}/tracker/logs`, { headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` } })
      if (response.ok) setLogs(await response.json())
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchLogs() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const payload = { category, amount: parseFloat(amount), details }

    if (isDemoMode) {
      setTimeout(() => {
        const logged = { id: Date.now(), category, amount: parseFloat(amount), details, co2_produced: 0.2, co2_saved: 1.5, timestamp: new Date().toISOString() }
        setLogs(prev => [logged, ...prev])
        setAmount('')
        setLoading(false)
        onLogSubmitted(logged)
      }, 500)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/tracker/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        setLogs(prev => [logged, ...prev])
        setAmount('')
        onLogSubmitted(await response.json())
        fetchLogs()
      }
    } catch (err) { alert(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="tracker-view animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3>Log Daily Activity</h3>
        <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
          {['transport', 'energy', 'food', 'recycling'].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`glass-button ${category === cat ? 'primary' : 'secondary'}`} style={{ padding: '0.5rem' }}>
              {cat}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="number" className="glass-input" placeholder="Amount (km / kWh / items)" value={amount} onChange={e => setAmount(e.target.value)} required />
          <select className="glass-input" value={details} onChange={e => setDetails(e.target.value)}>
            {category === 'transport' && <><option value="walking">Walk/Bike</option><option value="electric_car">EV Car</option><option value="gas_car">Gas Car</option></>}
            {category === 'energy' && <><option value="solar">Solar power</option><option value="grid">Grid power</option></>}
            {category === 'food' && <><option value="vegan">Vegan meal</option><option value="meat">Meat meal</option></>}
            {category === 'recycling' && <><option value="plastic">Plastics/Paper</option></>}
          </select>
          <button type="submit" className="glass-button primary">{loading ? 'Logging...' : 'Record Activity'}</button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3>Recent Timeline</h3>
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {logs.map(log => (
            <div key={log.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem' }}>
              <div>
                <b style={{ textTransform: 'capitalize' }}>{log.category}</b> ({log.amount} - {log.details})
              </div>
              <span style={{ color: log.co2_saved > 0 ? '#10b981' : '#ef4444' }}>
                {log.co2_saved > 0 ? `-${log.co2_saved} kg` : `+${log.co2_produced} kg`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 6. AI COACH COMPONENT
// ============================================================================
function AICoach({ user, isDemoMode }) {
  const [messages, setMessages] = useState([{ sender: 'ai', message: "Hi! I'm your AI Sustainability Coach. Ask me how to reduce your carbon footprint!" }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [receiptResult, setReceiptResult] = useState(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input
    if (!text.trim()) return
    if (!textToSend) setInput('')
    setMessages(prev => [...prev, { sender: 'user', message: text }])
    setLoading(true)

    if (isDemoMode) {
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'ai', message: "Based on climate metrics, switching to renewable solar energy saves ~112kg CO₂ monthly!" }])
        setLoading(false)
      }, 800)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/ai/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ message: text, chat_history: [] })
      })
      if (response.ok) {
        const res = await response.json()
        setMessages(prev => [...prev, { sender: 'ai', message: res.response }])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setReceiptLoading(true)

    if (isDemoMode) {
      setTimeout(() => {
        setReceiptResult({ store_name: "Supermarket", items: ["Organic Tofu", "Oat Milk"], category: "food", estimated_co2: 4.5, sustainability_note: "Sustainable plant items." })
        setReceiptLoading(false)
      }, 1000)
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    try {
      const response = await fetch(`${API_BASE}/ai/scan-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` },
        body: formData
      })
      if (response.ok) setReceiptResult(await response.json())
    } catch (err) { alert(err.message) }
    finally { setReceiptLoading(false) }
  }

  const downloadReport = async () => {
    if (isDemoMode) {
      alert("Report downloading simulated.")
      return
    }
    try {
      const response = await fetch(`${API_BASE}/ai/report`, { headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` } })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = "Report.pdf"
        a.click()
      }
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="coach-view animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
          <h4>AI Coach Chat</h4>
          <button onClick={downloadReport} className="glass-button secondary" style={{ padding: '0.2rem 0.5rem' }}>Export PDF</button>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? 'hsl(var(--primary-emerald))' : 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
              {m.message}
            </div>
          ))}
          {loading && <div>Thinking...</div>}
        </div>
        <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input type="text" className="glass-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Query carbon offsets..." />
          <button onClick={() => handleSendMessage()} className="glass-button primary">Send</button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h4>AI Receipt Scanner</h4>
        <button onClick={() => fileInputRef.current.click()} className="glass-button primary">Select Receipt Image</button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        {receiptLoading && <div>Scanning...</div>}
        {receiptResult && (
          <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--primary-emerald))' }}>
            <h5>{receiptResult.store_name}</h5>
            <p>Emissions: {receiptResult.estimated_co2} kg</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{receiptResult.sustainability_note}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 7. ANALYTICS COMPONENT
// ============================================================================
function Analytics({ stats }) {
  const categories = ['transport', 'electricity', 'food', 'water', 'shopping']
  const values = stats?.breakdown ?? { transport: 110, electricity: 80, food: 45, water: 12, shopping: 55 }
  const total = Object.values(values).reduce((a, b) => a + b, 0)

  return (
    <div className="analytics-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2>Emissions Projections</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4>Emissions Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {categories.map(cat => {
              const val = values[cat] || 0
              const pct = total > 0 ? Math.round((val / total) * 100) : 0
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                    <span>{val} kg ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'hsl(var(--primary-emerald))' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifycontent: 'center', alignItems: 'center' }}>
          <h4>Emissions Grid Density</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem', marginTop: '1.5rem' }}>
            {Array.from({ length: 28 }).map((_, idx) => (
              <div key={idx} style={{ width: '25px', height: '25px', borderRadius: '4px', background: idx % 3 === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 8. GAMIFICATION COMPONENT
// ============================================================================
function Gamification({ user, isDemoMode }) {
  const [challenges, setChallenges] = useState([])
  const [badges, setBadges] = useState([])

  const fetchDetails = async () => {
    if (isDemoMode) {
      setChallenges([{ id: 1, title: "No Car Week", description: "Walk/Cycle 30km.", target_value: 30, progress: 12, joined: true, completed: false }])
      setBadges([{ title: "First Carbon Check", description: "Audit completed.", unlocked: true }])
      return
    }
    try {
      const h = { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
      const resC = await fetch(`${API_BASE}/gamification/challenges/available`, { headers: h })
      if (resC.ok) setChallenges(await resC.ok ? await resC.json() : [])
      const resB = await fetch(`${API_BASE}/gamification/badges`, { headers: h })
      if (resB.ok) setBadges(await resB.json())
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchDetails() }, [])

  const joinChallenge = async (id) => {
    if (isDemoMode) {
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, joined: true } : c))
      return
    }
    try {
      const response = await fetch(`${API_BASE}/gamification/challenges/join/${id}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
      })
      if (response.ok) fetchDetails()
    } catch (e) { alert(e.message) }
  }

  const downloadCert = async () => {
    if (user && user.level < 3) {
      alert("Eco Level 3 required to verify certificates.")
      return
    }
    if (isDemoMode) {
      alert("Certificate generated in mock container.")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/gamification/certificate`, { headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` } })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = "Certificate.pdf"
        a.click()
      }
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="gamification-view animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h4>Active Challenges</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {challenges.map(c => (
            <div key={c.id} className="glass-card" style={{ padding: '1rem' }}>
              <h5>{c.title}</h5>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.description}</p>
              {c.joined ? (
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Progress: {c.progress} / {c.target_value}</div>
              ) : (
                <button onClick={() => joinChallenge(c.id)} className="glass-button primary" style={{ marginTop: '0.5rem', padding: '0.4rem' }}>Join</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4>Unlocked Badges</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {badges.map((b, idx) => (
              <span key={idx} className={b.unlocked ? 'badge-emerald' : 'badge-silver'} style={{ padding: '0.4rem', borderRadius: '4px', fontSize: '0.78rem', opacity: b.unlocked ? 1 : 0.3 }}>
                {b.title}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--primary-emerald))' }}>
          <h4>verified Certificate</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>Download printable verified achievement certificate.</p>
          <button onClick={downloadCert} className="glass-button primary" style={{ width: '100%' }}>Download PDF</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 9. ADMIN DASHBOARD COMPONENT
// ============================================================================
function AdminDashboard({ user, isDemoMode }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetValue, setTargetValue] = useState('')

  const fetchAdminData = async () => {
    if (isDemoMode) {
      setStats({ total_users: 48, total_logs: 250, total_co2_saved: 560 })
      setUsers([{ id: 1, username: 'admin', email: 'admin@ecotrack.ai', level: 8, streak: 12, is_admin: true }])
      return
    }
    try {
      const h = { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
      const resS = await fetch(`${API_BASE}/admin/stats`, { headers: h })
      if (resS.ok) setStats(await resS.json())
      const resU = await fetch(`${API_BASE}/admin/users`, { headers: h })
      if (resU.ok) setUsers(await resU.json())
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchAdminData() }, [])

  const handlePublish = async (e) => {
    e.preventDefault()
    const payload = { title, description, category: "transport", target_value: parseFloat(targetValue), xp_reward: 200 }
    if (isDemoMode) {
      alert("Simulated challenge publication.")
      setTitle(''); setDescription(''); setTargetValue('')
      return
    }
    try {
      const response = await fetch(`${API_BASE}/admin/challenges`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        setTitle(''); setDescription(''); setTargetValue('')
        fetchAdminData()
      }
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="admin-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2>Admin Control Center</h2>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="glass-card">Users: {stats.total_users}</div>
          <div className="glass-card">Logs: {stats.total_logs}</div>
          <div className="glass-card">Offsets: {stats.total_co2_saved} kg</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4>User Registry</h4>
          <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th>User</th>
                <th>Email</th>
                <th>Level</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.5rem 0' }}><b>{u.username}</b></td>
                  <td>{u.email}</td>
                  <td>Lvl {u.level}</td>
                  <td>{u.is_admin ? 'Admin' : 'User'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handlePublish} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4>Publish Challenge</h4>
          <input type="text" className="glass-input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea className="glass-input" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required />
          <input type="number" className="glass-input" placeholder="Target" value={targetValue} onChange={e => setTargetValue(e.target.value)} required />
          <button type="submit" className="glass-button primary">Publish</button>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// 10. MAIN APP MASTER CONTAINER
// ============================================================================
export default function App() {
  const [view, setView] = useState('landing')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  const [user, setUser] = useState(null)
  const [authModal, setAuthModal] = useState(null)
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [stats, setStats] = useState({
    carbon_score: 75, total_co2_produced: 280.4, total_co2_saved: 45.2,
    breakdown: { transport: 110.2, electricity: 95.0, food: 40.0, water: 10.2, shopping: 25.0 },
    trends: [
      { date: 'June 08', emissions: 8.5 }, { date: 'June 09', emissions: 10.2 }, { date: 'June 10', emissions: 6.8 },
      { date: 'June 11', emissions: 7.9 }, { date: 'June 12', emissions: 5.5 }, { date: 'June 13', emissions: 12.0 },
      { date: 'June 14', emissions: 4.5 }
    ],
    prediction: { predicted_monthly: 245.5, confidence_score: 80, message: "Recycling papers offsets up to 12kg carbon. Keep logging commutes!" }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) fetchUserProfile(token)
  }, [])

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (response.ok) {
        const profile = await response.json()
        setUser(profile)
        setIsDemoMode(false)
        setView('dashboard')
        fetchCarbonStats(token)
      } else {
        localStorage.removeItem("token")
      }
    } catch (e) {
      console.warn("Could not reach backend API. Ready for Demo fallback.")
    }
  }

  const fetchCarbonStats = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/tracker/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (response.ok) setStats(await response.json())
    } catch (e) {
      console.warn("Error retrieving carbon statistics from API backend.")
    }
  }

  const startDemo = () => {
    setIsDemoMode(true)
    setUser({ username: 'DemoPilot', email: 'pilot@ecotrack.ai', level: 2, xp: 680, streak: 3, is_admin: true })
    setView('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
    setIsDemoMode(false)
    setView('landing')
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const isLogin = authModal === 'login'
    const endpoint = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`

    try {
      let response
      if (isLogin) {
        const params = new URLSearchParams()
        params.append('username', authForm.email)
        params.append('password', authForm.password)

        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        })
      } else {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: authForm.username, email: authForm.email, password: authForm.password })
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Authentication request failed.")
      }

      if (isLogin) {
        const tokenData = await response.json()
        localStorage.setItem("token", tokenData.access_token)
        fetchUserProfile(tokenData.access_token)
        setAuthModal(null)
        setAuthForm({ username: '', email: '', password: '' })
      } else {
        setAuthModal('login')
        setAuthForm(prev => ({ ...prev, password: '' }))
        alert("Registration complete! Please log in with your credentials.")
      }
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const updateStatsLocal = (newLog) => {
    const co2Saved = newLog.co2_saved
    const co2Produced = newLog.co2_produced
    const cat = newLog.category

    setStats(prev => {
      const updatedBreakdown = { ...prev.breakdown }
      if (updatedBreakdown[cat] !== undefined) updatedBreakdown[cat] += co2Produced
      const newTotalSaved = prev.total_co2_saved + co2Saved
      const newTotalProduced = Math.max(0, prev.total_co2_produced + co2Produced - co2Saved)
      const newScore = Math.max(0, Math.min(100, Math.round(100 - (newTotalProduced - 100) / 14)))

      return {
        ...prev,
        carbon_score: newScore,
        total_co2_produced: Math.round(newTotalProduced * 100) / 100,
        total_co2_saved: Math.round(newTotalSaved * 100) / 100,
        breakdown: updatedBreakdown
      }
    })

    setUser(prev => {
      if (!prev) return null
      let newXp = prev.xp + 20
      let newLevel = prev.level
      if (newXp >= newLevel * 500) newLevel += 1
      return { ...prev, xp: newXp, level: newLevel, streak: prev.streak + 1 }
    })
  }

  return (
    <div className="app-container">
      {view !== 'landing' && (
        <Sidebar
          currentView={view}
          onViewChange={setView}
          user={user}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      )}

      <main className={view === 'landing' ? 'landing-content' : 'main-content'}>
        {view === 'landing' && <LandingPage onGetStarted={() => setAuthModal('register')} onTryDemo={startDemo} />}
        {view === 'dashboard' && <Dashboard user={user} stats={stats} onNavigate={setView} />}
        {view === 'calculator' && (
          <Calculator 
            user={user} 
            isDemoMode={isDemoMode}
            onCalculationComplete={(res) => {
              setStats(prev => ({ ...prev, carbon_score: res.carbon_score, total_co2_produced: res.monthly_co2, breakdown: res.breakdown }))
              if (isDemoMode) setUser(prev => prev ? { ...prev, xp: prev.xp + 150, level: res.new_level } : null)
            }}
          />
        )}
        {view === 'tracker' && (
          <Tracker 
            user={user} 
            isDemoMode={isDemoMode}
            onLogSubmitted={(newLog) => {
              if (isDemoMode) updateStatsLocal(newLog)
              else {
                fetchCarbonStats(localStorage.getItem("token"))
                fetchUserProfile(localStorage.getItem("token"))
              }
            }}
          />
        )}
        {view === 'coach' && <AICoach user={user} isDemoMode={isDemoMode} />}
        {view === 'analytics' && <Analytics stats={stats} />}
        {view === 'gamification' && <Gamification user={user} isDemoMode={isDemoMode} />}
        {view === 'admin' && <AdminDashboard user={user} isDemoMode={isDemoMode} />}
      </main>

      {authModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', width: '90%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setAuthModal(null)} style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
              {authModal === 'login' ? 'Welcome Back' : 'Join EcoTrack AI'}
            </h3>
            {authError && <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{authError}</p>}
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {authModal === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Username</label>
                  <input type="text" className="glass-input" placeholder="e.g. eco_commuter" value={authForm.username} onChange={e => setAuthForm(prev => ({ ...prev, username: e.target.value }))} required />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Email or Username</label>
                <input type={authModal === 'login' ? 'text' : 'email'} className="glass-input" placeholder="eco_commuter or name@domain.com" value={authForm.email} onChange={e => setAuthForm(prev => ({ ...prev, email: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Password</label>
                <input type="password" className="glass-input" value={authForm.password} onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))} required />
              </div>
              <button type="submit" className="glass-button primary" disabled={authLoading}>{authLoading ? 'Authorizing...' : authModal === 'login' ? 'Login' : 'Create'}</button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem' }}>
              {authModal === 'login' ? (
                <p>Don't have an account? <span onClick={() => setAuthModal('register')} style={{ color: 'hsl(var(--primary-emerald))', cursor: 'pointer' }}>Sign Up</span></p>
              ) : (
                <p>Already registered? <span onClick={() => setAuthModal('login')} style={{ color: 'hsl(var(--primary-emerald))', cursor: 'pointer' }}>Login</span></p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button type="button" onClick={startDemo} className="glass-button secondary">🚀 Bypass with Demo Mode</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
