'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  Check,
  Clock,
  Shield,
  Truck,
  Heart,
  Users,
  AlertCircle,
  Package,
  MapPin,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';

// Declare global tracking functions
declare global {
  interface Window {
    fbq: any;
    gtag: any;
    dataLayer: any[];
  }
}

// Tracking utilities
const trackingUtils = {
  // Initialize Facebook Pixel
  initFacebookPixel: () => {
    if (typeof window !== 'undefined') {
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('init', '763716602087140', {}, {
        test_event_code: 'TEST20028'
      });
      window.fbq('track', 'PageView');
    }
  },

  // Initialize Google Ads
  initGoogleAds: () => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', 'AW-17122800574');

      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17122800574';
      document.head.appendChild(script);
    }
  },

  // Initialize Google Analytics
  initGoogleAnalytics: () => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', 'GA_MEASUREMENT_ID'); // Replace with your GA4 measurement ID

      // Load gtag script for Analytics
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID'; // Replace with your GA4 measurement ID
      document.head.appendChild(script);
    }
  },

  // Get traffic source for N8N
  getTrafficSource: (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const fbclid = urlParams.get('fbclid');
    const gclid = urlParams.get('gclid');

    if (gclid || utmSource === 'google') return 'google_ads';
    if (fbclid || utmSource === 'facebook') return 'facebook';
    return utmSource || 'direct';
  },

  // Track Facebook events - CLIENT SIDE + CAPI via N8N
  trackFacebookEvent: async (eventName: string, eventData: any = {}, userFormData: any = null): Promise<void> => {
    const clientEventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. CLIENT-SIDE TRACKING (Pixel)
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq('track', eventName, eventData, {
          eventID: clientEventId
        });
        console.log(`✅ Facebook ${eventName} tracked (client-side)`);
      } catch (error) {
        console.error(`❌ Facebook ${eventName} client tracking error:`, error);
      }
    }

    // Track in Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', eventName.toLowerCase(), {
          event_category: 'Facebook',
          event_label: eventName,
          value: eventData.value || 0
        });
      } catch (error) {
        console.error(`❌ Google Analytics ${eventName} tracking error:`, error);
      }
    }

    // 2. SERVER-SIDE TRACKING (CAPI) via N8N - Always track major events
    const majorEvents = ['InitiateCheckout', 'Purchase', 'Lead', 'CompleteRegistration'];
    if (majorEvents.includes(eventName) || userFormData) {
      try {
        console.log(`📡 Sending ${eventName} to N8N webhook...`);

        // Hash dei dati sensibili se abbiamo form data
        let hashedPhone = null;
        let hashedFirstName = null;
        let hashedLastName = null;

        if (userFormData) {
          hashedPhone = userFormData.telefon ? await trackingUtils.hashData(userFormData.telefon.replace(/\D/g, '')) : null;
          hashedFirstName = userFormData.imie ? await trackingUtils.hashData(userFormData.imie.split(' ')[0]) : null;
          hashedLastName = userFormData.imie && userFormData.imie.split(' ').length > 1 ? await trackingUtils.hashData(userFormData.imie.split(' ').slice(1).join(' ')) : null;
        }

        // Prepara i dati per N8N
        // Calcola timestamp corretto (non più di 7 giorni fa, non nel futuro)
        const now = Math.floor(Date.now() / 1000);
        const maxPastTime = now - (7 * 24 * 60 * 60); // 7 giorni fa
        const eventTimestamp = Math.max(maxPastTime, now - 10); // Massimo 10 secondi fa

        const capiData = {
          event_name: 'Purchase', // o 'InitiateCheckout'
          event_id: clientEventId,
          timestamp: eventTimestamp, // <-- TIMESTAMP CORRETTO
          event_source_url: window.location.href,

          // AGGIUNGI ANCHE QUESTO per maggiore precisione
          action_source: 'website',
          event_time: eventTimestamp, // Doppio controllo

          // Token e Pixel ID dinamici
          token: 'EAAPYtpMdWREBPJH0W7LzwU2MuZA61clyQOfYg5C6E0vo9E5QYgJWl2n5XtO8Ur93YTZANcWYz3qsAbDOadffn10KbQZCOwkRS6DpM8bRjwX25NBn5d1lvVNQhFOCGY9eZARrjyCbJs1OtFk2BOc4ZBbaUjeD7dvkejyxZAZAEQdeb8AQzUKdAQitdhU0jVGywZDZD',
          pixel_id: '763716602087140', // Pixel ID dinamico

          // Dati hashati del form (se disponibili)
          telefono_hash: hashedPhone,
          nome_hash: hashedFirstName,
          cognome_hash: hashedLastName,
          indirizzo: userFormData?.adres || null,

          // Traffic source for analytics
          traffic_source: trackingUtils.getTrafficSource(),

          // Dati tecnici
          user_agent: navigator.userAgent,
          fbp: trackingUtils.getFbBrowserId(),
          fbc: trackingUtils.getFbClickId(),

          // Parametri UTM
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          utm_content: new URLSearchParams(window.location.search).get('utm_content'),
          utm_term: new URLSearchParams(window.location.search).get('utm_term'),

          // Altri dati utili
          page_title: document.title,
          referrer: document.referrer,
          language: navigator.language,
          screen_resolution: `${screen.width}x${screen.height}`,

          // Dati custom per questo prodotto - DINAMICI
          content_name: 'Kreativni Šivalni Stroj',
          content_category: 'Sewing Machines',
          content_ids: 'sewing-machine-creative',
          content_type: 'product',
          value: eventData.value || 69.99,
          currency: 'EUR', // Currency dinamica
          quantity: eventData.num_items || 1
        };

        console.log(`📤 Sending to webhook:`, capiData);

        // Invia a N8N webhook
        const response = await fetch('https://primary-production-625c.up.railway.app/webhook/CAPI-Meta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(capiData)
        });

        const responseText = await response.text();
        console.log(`📥 Webhook response:`, response.status, responseText);

        if (response.ok) {
          console.log(`✅ Facebook ${eventName} CAPI tracked via N8N`);
        } else {
          console.error(`❌ Facebook ${eventName} CAPI error:`, response.status, responseText);
        }
      } catch (error) {
        console.error(`❌ Facebook ${eventName} CAPI tracking error:`, error);
      }
    } else {
      console.log(`ℹ️ ${eventName} not configured for CAPI tracking`);
    }
  },

  // Track Google Ads events
  trackGoogleEvent: (eventName: string, eventData: any = {}): void => {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        if (eventName !== 'Purchase') {
          window.gtag('event', eventName, eventData);
          console.log(`✅ Google Ads ${eventName} tracked`);
        } else {
          console.log(`ℹ️ Google Ads Purchase skipped - will be tracked in Thank You page`);
        }
      } catch (error) {
        console.error(`❌ Google Ads ${eventName} tracking error:`, error);
      }
    }
  },

  // Utility functions
  getClientIP: async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '';
    }
  },

  getFbClickId: (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');

    if (fbclid) {
      // Formato corretto per fbc secondo Meta: fb.1.timestamp.fbclid
      // Il timestamp deve essere in SECONDI, non millisecondi
      const timestamp = Math.floor(Date.now() / 1000);
      return `fb.1.${timestamp}.${fbclid}`;
    }

    // Se non c'è fbclid, prova a recuperare da cookie esistenti
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === '_fbc') {
        return decodeURIComponent(value);
      }
    }

    return '';
  },

  // AGGIUNGI QUESTA NUOVA FUNZIONE SUBITO DOPO getFbClickId
  setFbClickId: (): void => {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');

    if (fbclid) {
      const timestamp = Math.floor(Date.now() / 1000);
      const fbcValue = `fb.1.${timestamp}.${fbclid}`;

      // Salva nei cookie per 90 giorni (standard Facebook)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 90);

      document.cookie = `_fbc=${encodeURIComponent(fbcValue)}; expires=${expirationDate.toUTCString()}; path=/; domain=${window.location.hostname}`;

      console.log('✅ Facebook Click ID salvato:', fbcValue);
    }
  },

  getFbBrowserId: (): string => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === '_fbp') return value;
    }
    return '';
  },

  // Proper SHA-256 hashing for PII data (Facebook requirement)
  hashData: async (data: string): Promise<string> => {
    if (!data || typeof data !== 'string') return '';

    try {
      // Normalize data (lowercase, trim spaces)
      const normalizedData = data.toLowerCase().trim();

      // Use Web Crypto API for SHA-256 hashing
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(normalizedData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return hashHex;
    } catch (error) {
      console.error('Error hashing data:', error);
      return '';
    }
  }
};

// Countdown Timer Component
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const difference = midnight.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-red-600 font-bold text-lg">
      {String(timeLeft.hours).padStart(2, '0')}:
      {String(timeLeft.minutes).padStart(2, '0')}:
      {String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
};

// Star Rating Component
const StarRating = ({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

// Social Proof Notification
const SocialProofNotification = () => {
  const [visible, setVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const notifications = [
    { name: "Ana iz Ljubljane", action: "ravnokar kupila", time: "pred 2 min" },
    { name: "Maja iz Maribora", action: "dodala v košarico", time: "pred 4 min" },
    { name: "Petra iz Kranja", action: "ravnokar kupila", time: "pred 6 min" },
    { name: "Nina iz Celja", action: "trenutno gleda", time: "pred 1 min" },
  ];

  useEffect(() => {
    // Aspetta 10 secondi prima di iniziare a mostrare le notifiche
    const initialDelay = setTimeout(() => {
      setHasStarted(true);
    }, 10000);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const showNotification = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
      setTimeout(() => {
        setCurrentNotification((prev) => (prev + 1) % notifications.length);
      }, 5000);
    };

    const interval = setInterval(showNotification, 8000);
    showNotification();

    return () => clearInterval(interval);
  }, [hasStarted]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-up">
      <div className="flex items-center space-x-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {notifications[currentNotification].name}
          </p>
          <p className="text-xs text-gray-600">
            {notifications[currentNotification].action} • {notifications[currentNotification].time}
          </p>
        </div>
      </div>
    </div>
  );
};

// FAQ Component
const FAQ = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
};

// Stock Indicator
const StockIndicator = () => {
  const [stock, setStock] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setStock(prev => {
        const change = Math.random() > 0.7 ? -1 : 0;
        return Math.max(8, prev + change);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 p-3 rounded-lg text-center font-bold">
      <div className="flex items-center justify-center space-x-2">
        <AlertCircle className="w-5 h-5" />
        <span>⚡ Na zalogi je samo še {stock} kosov!</span>
      </div>
    </div>
  );
};

// Results Section with Progress Bars
const ResultsSection = () => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <img
              src="/images/Cuc_pl15.jpg"
              alt="Zadovoljivi rezultati"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Spremenite svoje šivanje z izjemnimi rezultati
            </h2>

            <div className="space-y-8">
              {/* Progress bar 1 */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#16a34a"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${97 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">97%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Ugotovili ste, da je šivanje postalo enostavnejše in hitrejše!</p>
              </div>

              {/* Progress bar 2 */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#16a34a"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${98 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">98%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Opazili ste rast kreativnosti pri svojih projektih!</p>
              </div>

              {/* Progress bar 3 */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#16a34a"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${96 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">96%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Prihranili ste čas zahvaljujoč avtomatskim funkcijam!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delivery Tracking Component
const DeliveryTracking = () => {
  const [deliveryDates, setDeliveryDates] = useState({
    orderDate: '',
    shipDate: '',
    deliveryStart: '',
    deliveryEnd: '',
    deliveryRange: ''
  });

  useEffect(() => {
    const formatData = (data: Date): string => {
      const giorni = ['ned', 'pon', 'tor', 'sre', 'čet', 'pet', 'sob'];
      const mesi = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
      const giornoSettimana = giorni[data.getDay()];
      const giorno = String(data.getDate()).padStart(2, '0');
      const mese = mesi[data.getMonth()];
      return `${giornoSettimana}, ${giorno} ${mese}`;
    };

    const aggiungiGiorniLavorativi = (data: Date, giorni: number): Date => {
      let count = 0;
      const nuovaData = new Date(data);
      while (count < giorni) {
        nuovaData.setDate(nuovaData.getDate() + 1);
        const giorno = nuovaData.getDay();
        if (giorno !== 0 && giorno !== 6) count++; // 0 = nedelja, 6 = sobota
      }
      return nuovaData;
    };

    const oggi = new Date();
    const dataOrdine = oggi;
    const dataSpedizione = aggiungiGiorniLavorativi(dataOrdine, 1);
    const dataConsegnaInizio = aggiungiGiorniLavorativi(dataSpedizione, 2);
    const dataConsegnaFine = aggiungiGiorniLavorativi(dataSpedizione, 3);

    setDeliveryDates({
      orderDate: formatData(dataOrdine),
      shipDate: formatData(dataSpedizione),
      deliveryStart: formatData(dataConsegnaInizio),
      deliveryEnd: formatData(dataConsegnaFine),
      deliveryRange: `${formatData(dataConsegnaInizio)} a ${formatData(dataConsegnaFine)}`
    });
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-center text-gray-700 mb-4">
        Naročite <strong>ZDAJ</strong> in prejeli boste paket med <strong>{deliveryDates.deliveryRange}</strong>
      </p>
      <div className="flex justify-between items-center text-sm">
        <div className="text-center">
          <div className="text-2xl mb-1">📦</div>
          <div className="font-medium">Naročeno</div>
          <div className="text-gray-500">{deliveryDates.orderDate}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">🚚</div>
          <div className="font-medium">Poslano</div>
          <div className="text-gray-500">{deliveryDates.shipDate}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">📍</div>
          <div className="font-medium">Dostavljeno</div>
          <div className="text-gray-500">{deliveryDates.deliveryStart} - {deliveryDates.deliveryEnd}</div>
        </div>
      </div>
    </div>
  );
};

// Footer Component - LINK APRONO IN NUOVA SCHEDA
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Newheras</h3>
            <p className="text-gray-300 text-sm">
              Najkvalitetnejši šivalni stroji za vašo ustvarjalnost.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Služba za stranke</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white">Kontakt</a></li>
              <li><a href="#" className="hover:text-white">Pogosta vprašanja</a></li>
              <li><a href="/returns" target="_blank" rel="noopener noreferrer" className="hover:text-white">Vračilo</a></li>
              <li><a href="#" className="hover:text-white">Garancija</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Pravne informacije</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white">Pogoji poslovanja</a></li>
              <li><a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white">Varstvo zasebnosti</a></li>
              <li><a href="/cookies" target="_blank" rel="noopener noreferrer" className="hover:text-white">Piškotki</a></li>
              <li><a href="/gdpr" target="_blank" rel="noopener noreferrer" className="hover:text-white">Potrošniške pravice</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Podjetje</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/about" target="_blank" rel="noopener noreferrer" className="hover:text-white">O nas</a></li>
              <li><a href="#" className="hover:text-white">Kariera</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Partnerji</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © 2025 Newheras. Vse pravice pridržane.
            </p>
            <div className="flex space-x-6">
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">Varstvo zasebnosti</a>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">Pogoji</a>
              <a href="/cookies" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">Piškotki</a>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500 max-w-4xl mx-auto">
            <p className="mb-2">
              <strong>Pravne informacije:</strong> Vse cene vključujejo DDV. Pravica do odstopa od pogodbe v 14 dneh v skladu z zakonodajo o varstvu potrošnikov.
              24-mesečna garancija v skladu z Obligacijskim zakonikom. Prodajalec: Newheras d.o.o.
            </p>
            <p>
              <strong>Varstvo podatkov:</strong> Vaše osebne podatke obdelujemo v skladu z GDPR. Podrobnosti v Pravilih o varstvu zasebnosti.
              Uporabljamo piškotke za analitične in trženjske namene. Več informacij v Pravilih o piškotkih.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Component
export default function SewingMachineLanding() {
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [reservationTimer, setReservationTimer] = useState({ minutes: 5, seconds: 0 });
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [bounceAnimation, setBounceAnimation] = useState(false);
  const [formData, setFormData] = useState({
    imie: '',
    telefon: '',
    adres: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    imie: '',
    telefon: '',
    adres: ''
  });

  // Initialize tracking on component mount
  useEffect(() => {
    // AGGIUNGI QUESTA LINEA QUI
    trackingUtils.setFbClickId();
    // Initialize tracking systems
    trackingUtils.initFacebookPixel();
    trackingUtils.initGoogleAds();
    trackingUtils.initGoogleAnalytics();

    // Track PageView for all platforms
    trackingUtils.trackFacebookEvent('PageView');
    trackingUtils.trackGoogleEvent('page_view', {
      page_title: 'Kreativni Šivalni Stroj - Glavna stran',
      page_location: window.location.href
    });

    // Load fingerprinting script
    const script = document.createElement('script');
    script.src = 'https://offers.supertrendaffiliateprogram.com/forms/tmfp/';
    script.crossOrigin = 'anonymous';
    script.defer = true;
    document.head.appendChild(script);

    // Scroll listener per sticky button
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercentage = (scrollY / (documentHeight - windowHeight)) * 100;

      // Mostra il pulsante sticky dopo aver scrollato il 20%
      setShowStickyButton(scrollPercentage > 15);
    };

    window.addEventListener('scroll', handleScroll);

    // Bounce animation ogni 8 secondi per il pulsante sticky
    const bounceInterval = setInterval(() => {
      if (showStickyButton) {
        setBounceAnimation(true);
        setTimeout(() => setBounceAnimation(false), 1000);
      }
    }, 8000);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script might already be removed
      }
      window.removeEventListener('scroll', handleScroll);
      clearInterval(bounceInterval);
    };
  }, [showStickyButton]);

  useEffect(() => {
    let reservationInterval: NodeJS.Timeout | undefined;
    if (showOrderPopup) {
      reservationInterval = setInterval(() => {
        setReservationTimer(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { minutes: prev.minutes - 1, seconds: 59 };
          }
          return { minutes: 0, seconds: 0 };
        });
      }, 1000);
    }

    return () => {
      if (reservationInterval) clearInterval(reservationInterval);
    };
  }, [showOrderPopup]);

  const handleOrderClick = () => {
    console.log('🎯 Order button clicked - tracking InitiateCheckout');

    // Track InitiateCheckout event (inizio processo acquisto)
    trackingUtils.trackFacebookEvent('InitiateCheckout', {
      content_type: 'product',
      content_ids: ['sewing-machine-creative'],
      content_name: 'Kreativni Šivalni Stroj',
      value: 69.99,
      currency: 'EUR',
      num_items: 1
    });

    trackingUtils.trackGoogleEvent('view_item', {
      currency: 'EUR',
      value: 69.99,
      items: [{
        item_id: 'sewing-machine-creative',
        item_name: 'Kreativni Šivalni Stroj',
        category: 'Sewing Machines',
        quantity: 1,
        price: 69.99
      }]
    });

    setShowOrderPopup(true);
    setReservationTimer({ minutes: 5, seconds: 0 });
    setFormErrors({ imie: '', telefon: '', adres: '' });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = { imie: '', telefon: '', adres: '' };
    let isValid = true;

    if (!formData.imie.trim()) {
      errors.imie = 'Ime in priimek sta obvezna';
      isValid = false;
    } else if (formData.imie.trim().length < 2) {
      errors.imie = 'Ime mora vsebovati vsaj 2 znaka';
      isValid = false;
    }

    if (!formData.telefon.trim()) {
      errors.telefon = 'Telefonska številka je obvezna';
      isValid = false;
    } else {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
      if (!phoneRegex.test(formData.telefon.trim())) {
        errors.telefon = 'Prosimo, vnesite veljavno telefonsko številko';
        isValid = false;
      }
    }

    if (!formData.adres.trim()) {
      errors.adres = 'Naslov je obvezen';
      isValid = false;
    } else if (formData.adres.trim().length < 10) {
      errors.adres = 'Naslov mora biti podrobnejši (ulica, hišna številka, mesto, poštna številka)';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleOrderSubmit = async () => {
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    console.log('🎯 Form submitted, tracking Purchase with form data:', formData);

    // 🚨 ESSENTIAL: Track Purchase event con CAPI PRIMA dell'invio API
    // Questo garantisce che i dati arrivino sempre a N8N
    try {
      await trackingUtils.trackFacebookEvent('Purchase', {
        content_type: 'product',
        content_ids: ['sewing-machine-creative'],
        content_name: 'Kreativni Šivalni Stroj',
        value: 69.99,
        currency: 'EUR',
        num_items: 1
      }, formData);
      console.log('✅ Purchase tracking completato con successo');
    } catch (trackingError) {
      console.error('❌ Purchase tracking fallito, ma continuiamo:', trackingError);
    }

    try {
      const apiFormData = new FormData();

      apiFormData.append('uid', '01980825-ae5a-7aca-8796-640a3c5ee3da');
      apiFormData.append('key', 'ad79469b31b0058f6ea72c');
      apiFormData.append('offer', '236');
      apiFormData.append('lp', '236');
      apiFormData.append('name', formData.imie.trim());
      apiFormData.append('tel', formData.telefon.trim());
      apiFormData.append('street-address', formData.adres.trim());

      const tmfpInput = document.querySelector('input[name="tmfp"]') as HTMLInputElement | null;
      if (!tmfpInput || !tmfpInput.value) {
        apiFormData.append('ua', navigator.userAgent);
      }

      const response = await fetch('https://offers.supertrendaffiliateprogram.com/forms/api/', {
        method: 'POST',
        body: apiFormData,
      });

      if (response.ok) {
        const responseData = await response.text();
        const orderId = `MSK${Date.now()}`;

        console.log('✅ API response OK, order ID:', orderId);

        const orderData = {
          ...formData,
          orderId,
          product: 'Kreativni Šivalni Stroj',
          price: 69.99,
          apiResponse: responseData
        };

        localStorage.setItem('orderData', JSON.stringify(orderData));
        console.log('✅ Order data saved to localStorage:', orderData);

        window.location.href = '/ty-cuc-sl';
      } else {
        console.error('API Error:', response.status, response.statusText);
        alert('Pri pošiljanju naročila je prišlo do napake. Prosimo, poskusite znova pozneje.');
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Prišlo je do napake pri povezavi. Preverite internetno povezavo in poskusite znova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <input type="hidden" name="tmfp" />



      <div className="bg-red-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center space-x-4 text-sm font-medium">
          <span>🔥 OMEJENA PONUDBA - Samo danes po posebni ceni!</span>
        </div>
      </div>

      <section className="bg-white py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <div className="relative">
                <img
                  src="/images/cuc-sl/Cuc_pl20.jpg"
                  alt="Kreativni Šivalni Stroj"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -60% CENEJE
                </div>
              </div>
            </div>

            <div className="order-2 space-y-6">
              <div className="flex items-center space-x-2">
                <StarRating rating={5} size="w-5 h-5" />
                <span className="text-yellow-600 font-medium">4.9</span>
                <span className="text-gray-600">(347 mnenj)</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                🧵 Kreativni Šivalni Stroj
              </h1>

              <p className="text-lg text-gray-700 font-medium">
                <strong>Olajša šivanje z avtomatskimi funkcijami in natančnimi rezultati za kreativne projekte.</strong>
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🎯 <strong>Poveča natančnost</strong> – Zapleteni šivi brez napak</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🎨 <strong>Spodbuja kreativnost</strong> – Oživite zabavne projekte</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">⏱️ <strong>Prihrani čas</strong> – Avtomatsko navlekanje niti v trenutku</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🤝 <strong>Stalna podpora</strong> – Pomoč je vedno na voljo</span>
                </div>
              </div>

              {/* NOWY BOX OFERTY */}
              <div style={{
                fontFamily: 'sans-serif',
                background: '#fff',
                padding: '20px',
                borderRadius: '10px',
                maxWidth: '650px',
                margin: 'auto',
                textAlign: 'left',
                boxShadow: '0 0 10px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{
                  color: '#1c1917',
                  fontSize: '20px',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  🧵 Kreativni Šivalni Stroj – Kompakten, Močden, Zelo Enostaven za Uporabo
                </h2>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #eee',
                  fontSize: '16px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ flex: '1 1 70%' }}>📅 Širok izbor šivov: 165 programov v paketu (okrasni, uporabni in alfanumerični)</span>
                  <span style={{
                    color: 'red',
                    textDecoration: 'line-through',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>174,98 €</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #eee',
                  fontSize: '16px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ flex: '1 1 70%' }}>✨ Avtomatsko navlekanje niti: Prihrani čas in stres</span>
                  <span style={{
                    color: '#16a34a',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>✔ Csomagban</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #eee',
                  fontSize: '16px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ flex: '1 1 70%' }}>🔢 Osvetljen LCD zaslon: Vse pod nadzorom</span>
                  <span style={{
                    color: '#16a34a',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>✔ Csomagban</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #eee',
                  fontSize: '16px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ flex: '1 1 70%' }}>🛋 Popolna oprema: Razširljiva miza, stopala, DVD in še veliko več</span>
                  <span style={{
                    color: '#16a34a',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>✔ Csomagban</span>
                </div>

                <div style={{
                  background: '#ecfdf5',
                  borderLeft: '4px solid #10b981',
                  padding: '10px 12px',
                  margin: '10px 0',
                  fontSize: '15px'
                }}>
                  🚚 <strong>Brezplačna dostava</strong> po celotni Sloveniji (dostava 3-4 delovni dnevi)
                </div>

                <div style={{
                  background: '#ecfdf5',
                  borderLeft: '4px solid #10b981',
                  padding: '10px 12px',
                  margin: '10px 0',
                  fontSize: '15px'
                }}>
                  💶 <strong>Plačilo ob prevzemu</strong> na voljo
                </div>

                <div style={{
                  background: '#f0fdf4',
                  padding: '15px',
                  margin: '20px 0',
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontSize: '22px',
                  color: '#16a34a',
                  fontWeight: 'bold'
                }}>
                  Kataložna cena: <span style={{ textDecoration: 'line-through', color: 'red' }}>174,98 €</span><br />
                  <div style={{ marginTop: '10px' }}>
                    Danes samo: <span style={{ fontSize: '26px' }}>69,99 €</span>
                  </div>
                </div>

                <div style={{
                  textAlign: 'center',
                  color: '#7f1d1d',
                  fontWeight: '500',
                  background: '#fef2f2',
                  padding: '8px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '14px'
                }}>
                  ⏳ <strong>Ponudba velja le nekaj dni!</strong><br />
                  Izkoristite, preden se cena vrne na polno vrednost.
                </div>

                <div style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#dc2626',
                  fontWeight: 'bold',
                  marginTop: '8px'
                }}>
                  <CountdownTimer />
                </div>

                <div style={{
                  background: 'repeating-linear-gradient(45deg, #facc15, #facc15 10px, #fde68a 10px, #fde68a 20px)',
                  color: '#1f2937',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  padding: '10px',
                  borderRadius: '8px',
                  margin: '10px 0',
                  fontSize: '15px'
                }}>
                  ⚡ Zadnji kosi na voljo na zalogi
                </div>

                <p style={{ textAlign: 'center', fontSize: '14px', color: '#555' }}>
                  📦 Dostava v 24/48 urah – Dostava zagotovljena v 3-4 dneh
                </p>
              </div>

              <button
                onClick={handleOrderClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg animate-pulse-button"
              >
                🔥 NAROČITE ZDAJ - Plačilo ob prevzemu
              </button>

              <DeliveryTracking />

              {/* Recensione evidenziata */}
              <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                {/* Layout con foto centrata verticalmente rispetto al testo */}
                <div className="flex items-center space-x-4">
                  <img
                    src="images/testim2.jpg"
                    alt="Katalin M."
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />

                  <div className="flex-1">
                    {/* Stelle sopra il testo, allineate a sinistra */}
                    <div className="mb-3">
                      <StarRating rating={5} size="w-4 h-4" />
                    </div>

                    <p className="text-gray-800 text-sm leading-relaxed mb-3">
                      "Pred 3 tedni sem kupila ta stroj in sem očarana! 🌟 Avtomatsko navlekanje niti je pravi preboj - prihrani toliko časa! Že sem šila nekaj oblačil in vzglavnikov. Kakovost šivov je neverjeten a, upravljanje z LCD pa zelo intuitivno. Najboljnji nakup leta!"
                    </p>

                    {/* Nome con checkmark blu */}
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">Maja K. - Ljubljana</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                ✨ Odkrijte Kreativni Šivalni Stroj – Popolnega Partnerja za Vse Projekte!
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                <strong>Kreativni Šivalni Stroj</strong> je zasnovan tako, da osvobodi vašo kreativnost in poenostavi vsak korak šivanja.
              </p>
              <p className="text-lg text-gray-700">
                S <strong>165 vgrajenimi šivi</strong>, vključno s koristnimi, okrasnimi in alfanumeričnimi šivi, lahko uresničite kateri koli projekt, od oblačil do opreme za dom.
              </p>
            </div>
            <div>
              <img
                src="https://cosedicase.com/cdn/shop/files/download_17_a3b5a2ba-dfd7-48bd-9cf6-cbaa230ed97c.gif?v=1749034197&width=600"
                alt="Šivalni stroj v uporabi"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="/images/cuc-sl/Cuc_pl19.jpg"
                alt="Cechy maszyny"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Glavne značilnosti
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Širok izbor šivov:</strong> 165 vgrajenih šivov, vključno s 110 koristnimi in okrasnimi šivi, 8 avtomatskimi slogi za gumbne luknje in 55 alfanumeričnimi znaki.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Avtomatsko navlekanje niti:</strong> Prihrani čas in trud z avtomatskim sistemom za navlekanje niti.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Intuitiven LCD zaslon:</strong> Enostavno izbiranje šivov in nastavitev na osvetljenem zaslonu.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Dodatki v paketu:</strong> Dostava s trdo zaščitno pokrovom, razširljivo mizo, 8 šivalnimi in quilt stopali, učnim DVD-jem in še veliko več.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Namenjena podpora:</strong> Brezplačna tehnična pomoč online, v klepetalnici ali po telefonu skozi celotno življenjsko dobo stroja.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Enostavno in kreativno šivanje
            </h2>
            <p className="text-lg text-gray-700">
              Odkrijte, kako ta stroj poenostavi šivanje, izboljša natančnost in kreativnost pri vaših projektih.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="/images/cuc-sl/Cuc_pl18.jpg"
                alt="Maszyna do szycia w akcji"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">📏</div>
                  <h3 className="font-bold text-lg mb-2">Natančnost</h3>
                  <p className="text-gray-600">Enostavno doseganje natančnih in enakomern ih šivov.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🧵</div>
                  <h3 className="font-bold text-lg mb-2">Vsestranstvo</h3>
                  <p className="text-gray-600">Izbira med številnimi okrasnimi in koristnimi šivi.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🕒</div>
                  <h3 className="font-bold text-lg mb-2">Prihranek časa</h3>
                  <p className="text-gray-600">Avtomatsko navlekanje niti za takojnjen začetek.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="font-bold text-lg mb-2">Podpora</h3>
                  <p className="text-gray-600">Tehnična pomoč življenjsko za vaš mir.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Kaj dela Kreativni Šivalni Stroj posebnega
            </h2>
            <p className="text-lg text-gray-700">
              Za razliko od drugih ponuja avtomatske funkcije, široko mizo in doživljenjsko tehnično podporo, kar izboljša izkušnjo šivanja in kreativnost.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 sm:p-8 overflow-x-auto">
            <div className="min-w-full">
              <div className="hidden md:grid md:grid-cols-3 gap-4 text-center mb-4">
                <div></div>
                <div className="font-bold text-lg">Kreativni Šivalni Stroj</div>
                <div className="font-bold text-lg">Inne</div>
              </div>

              {[
                'Natančnost',
                'Vsestranstvo',
                'Avtomatizacija',
                'Podpora',
                'Vrednost za denar'
              ].map((feature, index) => (
                <div key={index} className="border-b border-gray-200 py-4">
                  <div className="md:hidden">
                    <div className="font-medium text-lg mb-3">{feature}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="font-medium text-green-600 mb-1">Mi</div>
                        <Check className="w-6 h-6 text-green-600 mx-auto" />
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="font-medium text-red-600 mb-1">Inne</div>
                        <span className="text-red-600 text-xl">✗</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:grid md:grid-cols-3 gap-4 py-3">
                    <div className="font-medium">{feature}</div>
                    <div className="text-center">
                      <Check className="w-6 h-6 text-green-600 mx-auto" />
                    </div>
                    <div className="text-center">
                      <span className="text-red-600 text-xl">✗</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ResultsSection />

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Odgovori na pogosto zastavljena vprašanja
            </h2>
            <p className="text-lg text-gray-700">
              Transparentnost in podpora za varno nakupovanje.
            </p>
          </div>

          <div className="space-y-4">
            <FAQ
              question="Kako olajša avtomatsko šivanje?"
              answer="Stroj ima avtomatsko izbiro šivov in navlekanje niti za enostavno in hitro šivanje."
            />
            <FAQ
              question="Kateri dodatki so vključeni v paket?"
              answer="Vsebuje široko mizo, trdo pokrivalo, šivalna stopala in učni DVD."
            />
            <FAQ
              question="Je primeren za quilting projekte?"
              answer="Da, zahvaljujoč široki mizi in okrasnim šivom je idealen za velike quilting projekte."
            />
            <FAQ
              question="Kako deluje tehnična podpora?"
              answer="Ponujamo spletno in telefonsko podporo skozi celotno življenjsko dobo izdelka, kar zagotavlja neprekinjeno pomoč."
            />
            <FAQ
              question="Je stroj enostaven za uporabo za začetnike?"
              answer="Absolutno da, z intuitivnimi funkcijami in LCD zaslonom je idealen tudi za začetnike."
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <StarRating rating={5} size="w-6 h-6" />
              <span className="text-2xl font-bold">4.9/5</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Mnenja strank o šivalnem stroju
            </h2>
            <p className="text-lg text-gray-700">
              Pristna in zanesljiva mnenja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Ana M. - Ljubljana",
                rating: 5,
                review: "Ta šivalni stroj je spremenil moj način šivanja! 😍 Izbor šivov je popoln in mi omogoča ustvarjanje um etniških del. Obožujem njegovo enostavno uporabo, tehnična podpora pa je vedno na voljo."
              },
              {
                name: "Katja R. - Maribor",
                rating: 4,
                review: "Enostaven za uporabo, čeprav nekatere funkcije zahtevajo vajo. Na splošno sem z nakupom zelo zadovoljna."
              },
              {
                name: "Maja S. - Kranj",
                rating: 5,
                review: "Popoln za šivanje! Ne morem verjeti, kako enostavno je šiti oblačila s tem strojem!"
              },
              {
                name: "Judita F. - Celje",
                rating: 4,
                review: "Funkcije tega stroja so mi omogočile odkrivanje novih obzorij pri šivanju. Toplo priporočam!"
              },
              {
                name: "Eva J. - Koper",
                rating: 5,
                review: "Stroj je fantastičen, vendar je služba za stranke še boljša. Pomagali so mi pri vseh vprašanjih."
              },
              {
                name: "Žofija O. - Novo mesto",
                rating: 5,
                review: "Popoln nakup za tiste, ki iščejo vsestranstvo in kakovost. Izbor šivov je popoln za vse kreativne projekte!"
              },
              {
                name: "Barbara N. - Ptuj",
                rating: 4,
                review: "Resnično koristen! Šila sem zavese, oblačila, celo ogromno blazino! Široka miza je nepogreljiva."
              },
              {
                name: "Lara P. - Velenje",
                rating: 5,
                review: "Ne morem živeti brez funkcije avtomatskega navlekanja niti, resniti prihranjić življenja!"
              },
              {
                name: "Beata H. - Domžale",
                rating: 5,
                review: "Idealen za tiste, ki radi šijejo in ustvarjajo edinstvena umetnila. Tudi po tednih intenzivne uporabe še vedno popolno deluje."
              }
            ].map((review, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center space-x-2 mb-3">
                  <StarRating rating={review.rating} />
                  <span className="text-sm text-gray-600">Preverjeni kupec</span>
                </div>
                <p className="text-gray-700 mb-3">{review.review}</p>
                <p className="font-medium text-gray-900">- {review.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white p-8 rounded-lg shadow-lg border-l-4 border-yellow-400">
            <div className="flex items-start space-x-4">
              <img
                src="https://cosedicase.com/cdn/shop/files/e76d708b-f0b3-4c06-a0db-d2f9f235e260.webp?v=1749027133&width=70"
                alt="Ana K."
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <StarRating rating={5} />
                  <span className="font-medium">Ana K. - Ljubljana</span>
                  <span className="text-sm text-gray-600">Preverjeni kupec</span>
                </div>
                <p className="text-gray-700">
                  "Ta šivalni stroj je spremenil moj način šivanja! 😍 Izbor šivov je popoln in mi omogoča ustvarjanje umetniških del. Obožujem njegovo enostavno uporabo, tehnična podpora pa je vedno na voljo. Ne morem biti bolj zadovoljna s svojim nakupom!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              30-dnevna garancija vračila denarja
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Preizkusite šivalni stroj popolnoma varno z našo 30-dnevno garancijo vračila denarja. Doživite enostavnost in natančnost šivanja brez tveganja ter odkrijte, kako lahko spremenite svojo kreativnost.
            </p>
            <p className="text-xl font-bold text-green-600">
              Če niste popolnoma zadovoljni, vrnemo celoten znesek.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Zakaj kupiti pri nas?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Številka za sledenje za vsako naročilo</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Plačilo neposredno ob prevzemu</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Pomoč 24 ur na dan, 7 dni v tednu</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Brez skritih stroškov!</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">DOSTAVA</h3>
              <p className="text-gray-700 mb-4">
                Dostavljamo po celotni Sloveniji, in če je naročilo oddano pred 21:59, ga pošljemo naslednji delovni dan.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Dostavljeno v 3-4 delovnih dneh</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Številka za sledenje priložena</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Izključno prodaja <strong>NEWHERAS</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            🔥 Ne zamudite te posebne ponudbe!
          </h2>
          <p className="text-xl mb-8">
            Samo danes: <span className="line-through opacity-75">174,98 €</span> <span className="text-5xl font-bold">69,99 €</span>
          </p>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Users className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">2,847+</div>
                <div className="text-sm opacity-90">Zadovoljna stranka</div>
              </div>
              <div>
                <Package className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">98.7%</div>
                <div className="text-sm opacity-90">Stopnja zadovoljstva</div>
              </div>
              <div>
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">24/7</div>
                <div className="text-sm opacity-90">Služba za stranke</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleOrderClick}
            className="bg-white text-orange-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg mb-4 w-full md:w-auto"
          >
            🛒 NAROČITE ZDAJ - NA VOLJO SO ZADNJI KOSI
          </button>

          <p className="text-sm opacity-90">
            ⚡ Časovno omejena ponudba • 🚚 Brezplačna dostava • 💯 30-dnevna garancija
          </p>
        </div>
      </section>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30" style={{
        transform: showStickyButton ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-in-out'
      }}>
        <button
          onClick={handleOrderClick}
          className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-200 shadow-lg ${bounceAnimation ? 'animate-bounce' : ''
            }`}
        >
          🔥 NAROČITE ZDAJ - Plačilo ob prevzemu
        </button>
      </div>

      {showOrderPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full relative my-4 md:my-8 min-h-0">
            <button
              onClick={() => setShowOrderPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-10"
            >
              ×
            </button>

            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 pr-8">Izpolnite za naročilo</h3>
            <p className="text-gray-600 mb-4 md:mb-6">Plačilo ob prevzemu</p>

            <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Povzetek naročila</h4>
              <div className="flex items-center gap-3">
                <img
                  src="/images/cuc-sl/Cuc_pl20.jpg"
                  alt="Šivalni stroj"
                  className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm md:text-base">Kreativni Šivalni Stroj</div>
                  <div className="text-xs md:text-sm text-gray-600">Kompakten, Močen, Zelo Enostaven za Uporabo</div>
                  <div className="text-xs md:text-sm text-green-600">✅ Brezplačna dostava</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-lg md:text-xl text-gray-900">69,99 €</div>
                  <div className="text-xs text-gray-500 line-through">174,98 €</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 md:mb-6">
              <div className="text-center">
                <div className="text-xs text-red-600 mb-1">🔒 Rezerviramo vaše naročilo</div>
                <div className="text-xl md:text-2xl font-mono font-bold text-red-700">
                  {reservationTimer.minutes.toString().padStart(2, '0')}:{reservationTimer.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Preostali čas za potrditev naročila
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ime in priimek *</label>
                <input
                  type="text"
                  value={formData.imie}
                  onChange={(e) => handleFormChange('imie', e.target.value)}
                  className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 text-base ${formErrors.imie
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                    }`}
                  placeholder="Vaše polno ime"
                />
                {formErrors.imie && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.imie}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefonska številka *</label>
                <input
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => handleFormChange('telefon', e.target.value)}
                  className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 text-base ${formErrors.telefon
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                    }`}
                  placeholder="Vaša telefonska številka"
                />
                {formErrors.telefon && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.telefon}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popoln naslov *</label>
                <textarea
                  value={formData.adres}
                  onChange={(e) => handleFormChange('adres', e.target.value)}
                  className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 h-20 md:h-20 text-base resize-none ${formErrors.adres
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                    }`}
                  placeholder="Ulica, hišna številka, mesto, poštna številka"
                />
                {formErrors.adres && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.adres}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4 mt-4 text-gray-700">
              <Shield className="w-5 h-5" />
              <span className="font-medium text-sm md:text-base">Plačilo ob prevzemu</span>
            </div>

            <button
              onClick={handleOrderSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 text-base md:text-lg"
            >
              {isSubmitting ? 'OBDELAVA...' : 'POTRDI NAROČILO - 69,99 €'}
            </button>
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  
  @keyframes pulse-button {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  .animate-pulse-button {
    animation: pulse-button 2s ease-in-out infinite;
  }
`}</style>
    </div>
  );
}