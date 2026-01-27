import { useEffect, useState } from 'react'
import './App.css'

const BASE_URL = 'https://peak.app/'
const BASE_HOST = 'peak.app/'

// Get target URL with code param if present
function getTargetUrl() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  
  if (code) {
    return `${BASE_URL}?code=${encodeURIComponent(code)}`
  }
  return BASE_URL
}

function getTargetHost() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  
  if (code) {
    return `${BASE_HOST}?code=${encodeURIComponent(code)}`
  }
  return BASE_HOST
}

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
  
  // Generic in-app browser detection
  const isWebView = /wv|WebView/i.test(ua)
  const isIOSWebView = isIOS && !/(Safari)/i.test(ua)
  const isIOSInApp = isIOS && /AppleWebKit.*Mobile/i.test(ua) && !/Safari/i.test(ua)
  
  const isInAppBrowser = isInstagram || isFacebook || isTwitter || isLinkedIn || 
                         isTikTok || isSnapchat || isPinterest || isLine || 
                         isWeChat || isMessenger || isWebView || isIOSWebView || isIOSInApp

  console.log('User Agent:', ua)
  console.log('Detection:', { isIOS, isAndroid, isInstagram, isFacebook, isInAppBrowser })

  return {
    isIOS,
    isAndroid,
    isInAppBrowser,
    isMobile: isIOS || isAndroid,
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

// iOS Safari-specific deep link attempts
function attemptIOSSafariRedirect(targetUrl, targetHost, onFail) {
  const methods = [
    // Method 1: x-safari-https scheme (deprecated but may work on some iOS versions)
    () => {
      console.log('Trying x-safari-https://')
      window.location.href = `x-safari-https://${targetHost}`
    },
    // Method 2: x-safari scheme with full URL
    () => {
      console.log('Trying x-safari://')
      window.location.href = `x-safari-${targetUrl}`
    },
    // Method 3: Try Shortcuts app to open URL in Safari
    // This creates a shortcut that opens the URL - may prompt user
    () => {
      console.log('Trying shortcuts://')
      window.location.href = `shortcuts://x-callback-url/run-shortcut?name=Open%20in%20Safari&input=text&text=${encodeURIComponent(targetUrl)}`
    },
    // Method 4: Try opening with _blank target (sometimes breaks out of WebView)
    () => {
      console.log('Trying _blank target')
      const link = document.createElement('a')
      link.href = targetUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    // Method 5: Try window.open with _system (works in some WebViews like Cordova)
    () => {
      console.log('Trying window.open _system')
      window.open(targetUrl, '_system')
    }
  ]

  let methodIndex = 0
  
  const tryNextMethod = () => {
    if (methodIndex < methods.length) {
      methods[methodIndex]()
      methodIndex++
      setTimeout(tryNextMethod, 250)
    } else {
      console.log('All Safari redirect methods exhausted')
      onFail()
    }
  }

  tryNextMethod()
}

// Android Chrome deep link
function attemptAndroidRedirect(targetHost) {
  window.location.href = `intent://${targetHost}#Intent;scheme=https;package=com.android.chrome;end`
}

function App() {
  const [env, setEnv] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [copied, setCopied] = useState(false)
  const [trying, setTrying] = useState(false)
  const [targetUrl, setTargetUrl] = useState(BASE_URL)

  useEffect(() => {
    const detected = detectEnvironment()
    setEnv(detected)
    
    const url = getTargetUrl()
    const host = getTargetHost()
    setTargetUrl(url)

    if (detected.isInAppBrowser && detected.isMobile) {
      setTrying(true)
      
      if (detected.isIOS) {
        attemptIOSSafariRedirect(url, host, () => {
          setTrying(false)
          setShowManual(true)
        })
        
        // Fallback timeout
        const timer = setTimeout(() => {
          setTrying(false)
          setShowManual(true)
        }, 2000)
        
        return () => clearTimeout(timer)
      } else if (detected.isAndroid) {
        attemptAndroidRedirect(host)
        
        const timer = setTimeout(() => {
          setTrying(false)
          setShowManual(true)
        }, 1500)

        return () => clearTimeout(timer)
      }
    } else {
      window.location.href = url
    }
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = targetUrl
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

        {trying && !showManual ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">Opening Peak...</p>
          </div>
        ) : showManual ? (
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
              <code>{targetUrl}</code>
              <button onClick={copyLink} className="copy-btn">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p className="hint">
              Paste in {browserName} to continue
            </p>
          </div>
        ) : (
          <p className="loading-text">Redirecting...</p>
        )}
      </div>
    </div>
  )
}

export default App
