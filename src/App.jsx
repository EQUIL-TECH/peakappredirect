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
  
  // Detect specific browsers on iOS
  const isIOSChrome = isIOS && /CriOS/i.test(ua)
  const isIOSFirefox = isIOS && /FxiOS/i.test(ua)
  const isIOSEdge = isIOS && /EdgiOS/i.test(ua)
  const isIOSOpera = isIOS && /OPT/i.test(ua)
  const isIOSBrave = isIOS && /Brave/i.test(ua)
  const isIOSSafari = isIOS && /Safari/i.test(ua) && !isIOSChrome && !isIOSFirefox && !isIOSEdge && !isIOSOpera && !isIOSBrave
  
  // Detect specific browsers on Android
  const isAndroidChrome = isAndroid && /Chrome/i.test(ua) && !/Firefox|SamsungBrowser|OPR|Edge|Brave/i.test(ua)
  const isAndroidFirefox = isAndroid && /Firefox/i.test(ua)
  const isAndroidSamsung = isAndroid && /SamsungBrowser/i.test(ua)
  const isAndroidEdge = isAndroid && /Edge|EdgA/i.test(ua)
  const isAndroidOpera = isAndroid && /OPR/i.test(ua)
  const isAndroidBrave = isAndroid && /Brave/i.test(ua)
  
  // Detect in-app browsers
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

  // Is user in the "wrong" browser? (not Safari on iOS, not Chrome on Android)
  const isWrongIOSBrowser = isIOS && !isIOSSafari && !isInAppBrowser
  const isWrongAndroidBrowser = isAndroid && !isAndroidChrome && !isInAppBrowser

  // Get the name of the current browser
  let currentBrowser = 'browser'
  if (isIOSChrome || isAndroidChrome) currentBrowser = 'Chrome'
  else if (isIOSFirefox || isAndroidFirefox) currentBrowser = 'Firefox'
  else if (isIOSEdge || isAndroidEdge) currentBrowser = 'Edge'
  else if (isIOSOpera || isAndroidOpera) currentBrowser = 'Opera'
  else if (isIOSBrave || isAndroidBrave) currentBrowser = 'Brave'
  else if (isAndroidSamsung) currentBrowser = 'Samsung Browser'
  else if (isInstagram) currentBrowser = 'Instagram'
  else if (isFacebook) currentBrowser = 'Facebook'
  else if (isTwitter) currentBrowser = 'Twitter'
  else if (isTikTok) currentBrowser = 'TikTok'
  else if (isSnapchat) currentBrowser = 'Snapchat'
  else if (isMessenger) currentBrowser = 'Messenger'

  console.log('User Agent:', ua)
  console.log('Detection:', { 
    isIOS, isAndroid, isIOSSafari, isAndroidChrome,
    isWrongIOSBrowser, isWrongAndroidBrowser, isInAppBrowser,
    currentBrowser
  })

  return {
    isIOS,
    isAndroid,
    isInAppBrowser,
    isWrongBrowser: isWrongIOSBrowser || isWrongAndroidBrowser,
    isCorrectBrowser: (isIOS && isIOSSafari) || (isAndroid && isAndroidChrome),
    isMobile: isIOS || isAndroid,
    currentBrowser,
    targetBrowser: isIOS ? 'Safari' : 'Chrome'
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
function attemptAndroidChromeRedirect(targetHost) {
  console.log('Trying Android Chrome intent')
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

    // Case 1: In-app browser (Instagram, Facebook, etc.)
    // Case 2: Wrong browser (Chrome on iOS, Firefox on Android, etc.)
    // Both cases need redirect to correct browser
    if (detected.isMobile && (detected.isInAppBrowser || detected.isWrongBrowser)) {
      setTrying(true)
      
      if (detected.isIOS) {
        attemptIOSSafariRedirect(url, host, () => {
          setTrying(false)
          setShowManual(true)
        })
        
        const timer = setTimeout(() => {
          setTrying(false)
          setShowManual(true)
        }, 2000)
        
        return () => clearTimeout(timer)
      } else if (detected.isAndroid) {
        attemptAndroidChromeRedirect(host)
        
        const timer = setTimeout(() => {
          setTrying(false)
          setShowManual(true)
        }, 1500)

        return () => clearTimeout(timer)
      }
    } else {
      // Correct browser or desktop - redirect immediately
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

  const browserName = env?.targetBrowser || 'Safari'

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
              {env?.isInAppBrowser 
                ? <>{env?.currentBrowser}'s browser doesn't support all features. Open in <strong>{browserName}</strong> for the best experience.</>
                : <>{env?.currentBrowser} doesn't support all features. Open in <strong>{browserName}</strong> for the best experience.</>
              }
            </p>

            <div className="steps">
              {env?.isIOS ? (
                env?.isInAppBrowser ? (
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
                      <span>Copy the link below</span>
                    </div>
                    <div className="step">
                      <span className="step-num">2</span>
                      <span>Open <strong>Safari</strong> and paste the link</span>
                    </div>
                  </>
                )
              ) : (
                env?.isInAppBrowser ? (
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
                ) : (
                  <>
                    <div className="step">
                      <span className="step-num">1</span>
                      <span>Copy the link below</span>
                    </div>
                    <div className="step">
                      <span className="step-num">2</span>
                      <span>Open <strong>Chrome</strong> and paste the link</span>
                    </div>
                  </>
                )
              )}
            </div>

            <div className="divider">
              <span>copy link</span>
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
