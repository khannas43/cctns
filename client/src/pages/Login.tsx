import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    if (username === 'cctns_demo' && password === 'karnataka2025') {
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } else {
      alert('Invalid credentials. Use: cctns_demo / karnataka2025')
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: 380,
          padding: 40,
          backgroundColor: 'white',
          borderRadius: 10,
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          textAlign: 'center',
          border: '1px solid #e1e8ed',
        }}
      >
        <img
          src="https://www.digitalpolicecitizenservices.gov.in/centercitizen/asset/images/cctnsLogoNew.png"
          alt="CCTNS Logo"
          style={{ width: 80, height: 80, marginBottom: 20 }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/vite.svg'
          }}
        />
        <h2
          style={{
            margin: '0 0 30px 0',
            color: '#2c3e50',
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          CCTNS Analytics Suite
        </h2>
        <p style={{ margin: '0 0 30px 0', color: '#7f8c8d', fontSize: 14 }}>
          Drug Free Karnataka Initiative
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                height: 50,
                borderRadius: 6,
                border: '2px solid #e1e8ed',
                padding: '0 15px',
                fontSize: 16,
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3498db')}
              onBlur={(e) => (e.target.style.borderColor = '#e1e8ed')}
            />
          </div>

          <div style={{ marginBottom: 30, position: 'relative' as const }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                height: 50,
                borderRadius: 6,
                border: '2px solid #e1e8ed',
                padding: '0 44px 0 15px',
                fontSize: 16,
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3498db')}
              onBlur={(e) => (e.target.style.borderColor = '#e1e8ed')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                height: 32,
                width: 32,
                borderRadius: 4,
                border: '1px solid #e1e8ed',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              height: 50,
              backgroundColor: isLoading ? '#95a5a6' : '#2980b9',
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
              border: 'none',
              borderRadius: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s',
            }}
            onMouseOver={(e) => {
              if (!isLoading) (e.target as HTMLButtonElement).style.backgroundColor = '#3498db'
            }}
            onMouseOut={(e) => {
              if (!isLoading) (e.target as HTMLButtonElement).style.backgroundColor = '#2980b9'
            }}
          >
            {isLoading ? 'Authenticating...' : 'LOGIN'}
          </button>
        </form>

        <div
          style={{
            marginTop: 30,
            padding: 15,
            backgroundColor: '#f8f9fa',
            borderRadius: 6,
            border: '1px solid #e9ecef',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#6c757d' }}>
            <strong>Demo Credentials:</strong>
            <br /> Username: cctns_demo
            <br /> Password: karnataka2025
          </p>
        </div>
      </div>
    </div>
  )
}


