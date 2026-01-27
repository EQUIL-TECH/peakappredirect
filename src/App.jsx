import { useEffect, useState } from 'react'
import './App.css'

const TARGET_URL = 'https://peak.app/'

// Detect device and browser type
function detectEnvironment() {
  const ua = navigator.userAgent || navigator.vendor || window.opera

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const isAndroid = /android/i.test(ua)
  
  // Detect in-app browsers
  const isInstagram = /Instagram/i.test(ua)
  const isFacebook = /FBAN|FBAV|FB_IAB/i.test(ua)
  const isTwitter = /Twitter/i.test(ua)
  const isLinkedIn = /LinkedInApp/i.test(ua)
  const isTikTok = /BytedanceWebview|TikTok/i.test(ua)
  const isSnapchat = /Snapchat/i.test(ua)
  const isPinterest = /Pinterest/i.test(ua)
  const isLine = /Line\//i.test(ua)
  const isWeChat = /MicroMessenger/i.test(ua)
  const isMessenger = /FBAV.*Messenger|MessengerForiOS|MessengerLiteForiOS/i.test(ua)
  
  const isInAppBrowser = isInstagram || isFacebook || isTwitter || isLinkedIn || 
                         isTikTok || isSnapchat || isPinterest || isLine || 
                         isWeChat || isMessenger

  return {
    isIOS,
    isAndroid,
    isInAppBrowser,
    isMobile: isIOS || isAndroid
  }
}

// Attempt redirect to native browser
function attemptRedirect(env) {
  if (env.isAndroid) {
    // Intent URL for Android Chrome
    window.location.href = `intent://${TARGET_URL.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
  } else if (env.isIOS) {
    // iOS - try to open in Safari
    window.location.href = TARGET_URL
  } else {
    window.location.href = TARGET_URL
  }
}

function App() {
  const [env, setEnv] = useState(null)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    const detected = detectEnvironment()
    setEnv(detected)

    if (detected.isInAppBrowser && detected.isMobile) {
      // Attempt redirect immediately
      attemptRedirect(detected)
      
      // Show manual instructions after delay if still on page
      const timer = setTimeout(() => {
        setShowManual(true)
      }, 2000)

      return () => clearTimeout(timer)
    } else {
      // Already in regular browser - redirect immediately
      window.location.href = TARGET_URL
    }
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(TARGET_URL)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = TARGET_URL
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const browserName = env?.isIOS ? 'Safari' : 'Chrome'

  return (
    <div className="container">
      <div className="content">
        <svg className="logo" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L22 28H2L12 4Z" fill="white"/>
          <text x="32" y="24" fill="white" fontSize="22" fontWeight="600" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">peak</text>
        </svg>

        {!showManual ? (
          <p className="loading-text">Opening...</p>
        ) : (
          <div className="manual">
            <h1>Open in {browserName}</h1>
            <p className="subtitle">
              For the best experience, open this link in {browserName}.
            </p>

            <div className="steps">
              <div className="step">
                <span className="step-num">1</span>
                <span>Tap the menu icon <strong>{env?.isIOS ? '(···)' : '(⋮)'}</strong> above</span>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <span>Select <strong>"Open in {browserName}"</strong></span>
              </div>
            </div>

            <div className="divider">
              <span>or copy the link</span>
            </div>

            <div className="link-row">
              <code>{TARGET_URL}</code>
              <button onClick={copyLink} className="copy-btn">Copy</button>
            </div>

            <a href={TARGET_URL} className="continue-btn">
              Continue anyway →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
