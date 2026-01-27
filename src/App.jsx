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

  let inAppBrowserName = 'in-app browser'
  if (isInstagram) inAppBrowserName = 'Instagram'
  else if (isFacebook) inAppBrowserName = 'Facebook'
  else if (isTwitter) inAppBrowserName = 'Twitter/X'
  else if (isLinkedIn) inAppBrowserName = 'LinkedIn'
  else if (isTikTok) inAppBrowserName = 'TikTok'
  else if (isSnapchat) inAppBrowserName = 'Snapchat'
  else if (isPinterest) inAppBrowserName = 'Pinterest'
  else if (isLine) inAppBrowserName = 'LINE'
  else if (isWeChat) inAppBrowserName = 'WeChat'
  else if (isMessenger) inAppBrowserName = 'Messenger'

  return {
    isIOS,
    isAndroid,
    isInAppBrowser,
    inAppBrowserName,
    isMobile: isIOS || isAndroid
  }
}

// Generate the appropriate deep link
function getDeepLink(env) {
  const encodedUrl = encodeURIComponent(TARGET_URL)
  
  if (env.isAndroid) {
    // Intent URL for Android Chrome
    return `intent://${TARGET_URL.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
  } else if (env.isIOS) {
    // For iOS, we use x-safari scheme or just open in Safari
    // Safari doesn't have a custom scheme, but we can try googlechrome for Chrome
    // The most reliable is to just use the regular URL which opens in Safari
    return TARGET_URL
  }
  
  return TARGET_URL
}

function App() {
  const [env, setEnv] = useState(null)
  const [redirectStatus, setRedirectStatus] = useState('detecting')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const detected = detectEnvironment()
    setEnv(detected)

    if (detected.isInAppBrowser && detected.isMobile) {
      setRedirectStatus('redirecting')
      
      // Countdown before redirect attempt
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            attemptRedirect(detected)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(countdownInterval)
    } else if (!detected.isInAppBrowser) {
      // Already in a regular browser, redirect immediately
      setRedirectStatus('success')
      window.location.href = TARGET_URL
    } else {
      setRedirectStatus('desktop')
    }
  }, [])

  const attemptRedirect = (detected) => {
    const deepLink = getDeepLink(detected)
    
    // Try to open the deep link
    window.location.href = deepLink
    
    // After a short delay, show manual instructions if still on page
    setTimeout(() => {
      setRedirectStatus('manual')
    }, 2500)
  }

  const handleManualRedirect = () => {
    if (env?.isAndroid) {
      // Try Chrome intent
      window.location.href = getDeepLink(env)
    } else {
      // Copy link to clipboard
      navigator.clipboard?.writeText(TARGET_URL)
      alert('Link copied! Paste it in Safari.')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(TARGET_URL)
      alert('Link copied to clipboard!')
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = TARGET_URL
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="container">
      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>
      <div className="glow glow-3"></div>
      
      <div className="card">
        <div className="logo">
          <svg viewBox="0 0 100 100" className="peak-icon">
            <polygon points="50,10 90,85 10,85" fill="url(#peakGradient)" />
            <defs>
              <linearGradient id="peakGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00d4aa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <h1>Peak</h1>
        </div>

        {redirectStatus === 'detecting' && (
          <div className="status">
            <div className="spinner"></div>
            <p>Detecting your browser...</p>
          </div>
        )}

        {redirectStatus === 'redirecting' && (
          <div className="status">
            <div className="countdown-ring">
              <span>{countdown}</span>
            </div>
            <p>
              Opening in {env?.isIOS ? 'Safari' : 'Chrome'}...
            </p>
            <p className="subtitle">
              Detected: {env?.inAppBrowserName} browser
            </p>
          </div>
        )}

        {redirectStatus === 'success' && (
          <div className="status">
            <div className="checkmark">✓</div>
            <p>Redirecting to Peak...</p>
          </div>
        )}

        {redirectStatus === 'manual' && (
          <div className="manual-section">
            <div className="alert-icon">⚠️</div>
            <h2>Almost there!</h2>
            <p className="detected-text">
              You're viewing this in <strong>{env?.inAppBrowserName}</strong>
            </p>
            <p>
              For the best experience, please open this link in {env?.isIOS ? 'Safari' : 'Chrome'}.
            </p>

            <div className="instructions">
              <h3>How to open in {env?.isIOS ? 'Safari' : 'Chrome'}:</h3>
              
              {env?.isIOS ? (
                <ol>
                  <li>
                    <span className="step-icon">⋮</span>
                    Tap the <strong>three dots</strong> (•••) or <strong>share icon</strong> at the bottom
                  </li>
                  <li>
                    <span className="step-icon">🧭</span>
                    Select <strong>"Open in Safari"</strong> or <strong>"Open in Browser"</strong>
                  </li>
                </ol>
              ) : (
                <ol>
                  <li>
                    <span className="step-icon">⋮</span>
                    Tap the <strong>three dots</strong> (⋮) menu in the top right
                  </li>
                  <li>
                    <span className="step-icon">🌐</span>
                    Select <strong>"Open in Chrome"</strong> or <strong>"Open in Browser"</strong>
                  </li>
                </ol>
              )}

              <div className="alt-method">
                <h4>Alternative method:</h4>
                <ol>
                  <li>Copy the link below</li>
                  <li>Open {env?.isIOS ? 'Safari' : 'Chrome'} manually</li>
                  <li>Paste the link in the address bar</li>
                </ol>
              </div>
            </div>

            <div className="link-box">
              <code>{TARGET_URL}</code>
              <button onClick={copyLink} className="copy-btn">
                📋 Copy Link
              </button>
            </div>

            <button onClick={handleManualRedirect} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {redirectStatus === 'desktop' && (
          <div className="status">
            <p>Redirecting to Peak...</p>
            <a href={TARGET_URL} className="direct-link">
              Click here if not redirected
            </a>
          </div>
        )}
      </div>

      <footer>
        <p>Powered by Peak</p>
      </footer>
    </div>
  )
}

export default App
