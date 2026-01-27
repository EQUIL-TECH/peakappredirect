import { useEffect, useState } from 'react'
import './App.css'

const TARGET_URL = 'https://peak.app/'

// Detect device and browser type
function detectEnvironment() {
  const ua = navigator.userAgent || navigator.vendor || window.opera

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const isAndroid = /android/i.test(ua)
  
  // Detect in-app browsers - expanded patterns for better detection
  const isInstagram = /Instagram|IGWC/i.test(ua)
  const isFacebook = /FBAN|FBAV|FB_IAB|FBIOS|FBSS/i.test(ua)
  const isTwitter = /Twitter/i.test(ua)
  const isLinkedIn = /LinkedInApp/i.test(ua)
  const isTikTok = /BytedanceWebview|TikTok|musical_ly/i.test(ua)
  const isSnapchat = /Snapchat/i.test(ua)
  const isPinterest = /Pinterest/i.test(ua)
  const isLine = /Line\//i.test(ua)
  const isWeChat = /MicroMessenger/i.test(ua)
  const isMessenger = /FBAV.*Messenger|MessengerForiOS|MessengerLiteForiOS|Messenger/i.test(ua)
  
  // Generic in-app browser detection (catches WebView-based browsers)
  const isWebView = /wv|WebView/i.test(ua)
  // iOS-specific: check for missing Safari identifier in mobile Safari-like UA
  const isIOSWebView = isIOS && !/(Safari)/i.test(ua)
  // Additional iOS in-app detection
  const isIOSInApp = isIOS && /AppleWebKit.*Mobile/i.test(ua) && !/Safari/i.test(ua)
  
  const isInAppBrowser = isInstagram || isFacebook || isTwitter || isLinkedIn || 
                         isTikTok || isSnapchat || isPinterest || isLine || 
                         isWeChat || isMessenger || isWebView || isIOSWebView || isIOSInApp

  // Debug info
  console.log('User Agent:', ua)
  console.log('Detection:', { isIOS, isAndroid, isInstagram, isFacebook, isInAppBrowser, isIOSWebView })

  return {
    isIOS,
    isAndroid,
    isInAppBrowser,
    isMobile: isIOS || isAndroid,
    // For display purposes
    appName: isInstagram ? 'Instagram' : 
             isFacebook ? 'Facebook' : 
             isTwitter ? 'Twitter' : 
             isLinkedIn ? 'LinkedIn' :
             isTikTok ? 'TikTok' :
             isSnapchat ? 'Snapchat' :
             isMessenger ? 'Messenger' :
             'this app'
  }
}

// Attempt redirect to native browser (Android only - iOS can't be forced)
function attemptAndroidRedirect() {
  // Intent URL for Android Chrome
  window.location.href = `intent://${TARGET_URL.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
}

function App() {
  const [env, setEnv] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const detected = detectEnvironment()
    setEnv(detected)

    if (detected.isInAppBrowser && detected.isMobile) {
      if (detected.isIOS) {
        // iOS: Can't programmatically open Safari from in-app browser
        // Show instructions immediately
        setShowManual(true)
      } else if (detected.isAndroid) {
        // Android: Try Chrome intent
        attemptAndroidRedirect()
        
        // Show manual instructions after delay if still on page
        const timer = setTimeout(() => {
          setShowManual(true)
        }, 1500)

        return () => clearTimeout(timer)
      }
    } else {
      // Already in regular browser - redirect immediately
      window.location.href = TARGET_URL
    }
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(TARGET_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = TARGET_URL
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const browserName = env?.isIOS ? 'Safari' : 'Chrome'

  return (
    <div className="container">
      <div className="content">
        <svg className="logo" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L22 28H2L12 4Z" fill="#1a1a1a"/>
          <text x="30" y="23" fill="#1a1a1a" fontSize="21" fontWeight="700" fontFamily="Inter, -apple-system, sans-serif">peak</text>
        </svg>

        {!showManual ? (
          <p className="loading-text">Opening Peak...</p>
        ) : (
          <div className="manual">
            <p className="tagline">One more step</p>
            <h1>Open in <span className="accent">{browserName}</span></h1>
            <p className="subtitle">
              {env?.appName !== 'this app' 
                ? <>{env?.appName}'s browser doesn't support all features. Open in <strong>{browserName}</strong> for the best experience.</>
                : <>This browser doesn't support all features. Open in <strong>{browserName}</strong> for the best experience.</>
              }
            </p>

            <div className="steps">
              {env?.isIOS ? (
                <>
                  <div className="step">
                    <span className="step-num">1</span>
                    <span>Tap the <strong>•••</strong> or <strong>Share</strong> button</span>
                  </div>
                  <div className="step">
                    <span className="step-num">2</span>
                    <span>Select <strong>"Open in Safari"</strong></span>
                  </div>
                </>
              ) : (
                <>
                  <div className="step">
                    <span className="step-num">1</span>
                    <span>Tap <strong>⋮</strong> in the top right corner</span>
                  </div>
                  <div className="step">
                    <span className="step-num">2</span>
                    <span>Select <strong>"Open in Chrome"</strong></span>
                  </div>
                </>
              )}
            </div>

            <div className="divider">
              <span>or copy link</span>
            </div>

            <div className="link-row">
              <code>{TARGET_URL}</code>
              <button onClick={copyLink} className="copy-btn">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p className="hint">
              Paste in {browserName} to continue
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
