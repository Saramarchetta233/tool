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
  ChevronLeft,
  ChevronRight,
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
      window.gtag('config', 'AW-17553726122');

      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17553726122';
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

        // Hash dei dati sensibili se abbiamo form data i
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
          content_name: 'VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem',
          content_category: 'Electronics & Sports',
          content_ids: 'voltcam-4k-pro-sportcam',
          content_type: 'product',
          value: eventData.value || 299.00,
          currency: 'PLN', // Currency dinamica
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
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
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
  }, [mounted]);

  if (!mounted) {
    return <span className="text-red-600 font-bold text-lg">00:00:00</span>;
  }

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
  const [mounted, setMounted] = useState(false);
  const [stock, setStock] = useState(15);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setStock(prev => {
        const change = Math.random() > 0.7 ? -1 : 0;
        return Math.max(9, prev + change);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 p-3 rounded-lg text-center font-bold">
      <div className="flex items-center justify-center space-x-2">
        <AlertCircle className="w-5 h-5" />
        <span>⚡ Tylko {stock} sztuk pozostało w magazynie!</span>
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
              src="/images/Camera/7.png"
              alt="Zadowalające rezultaty"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Przekształć Swoje Nagrania z Wyjątkowymi Rezultatami
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
                      strokeDasharray={`${94 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">94%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Oceniło jakość 4K i stabilizację EIS jako doskonałą!</p>
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
                      strokeDasharray={`${97 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">97%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Doceniło wodoodporność i kompletny zestaw akcesoriów!</p>
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
                <p className="text-sm font-medium text-gray-700">Poleca pilot i łatwość obsługi przez aplikację Wi-Fi!</p>
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
      const giorni = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
      const mesi = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
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
        if (giorno !== 0 && giorno !== 6) count++; // 0 = niedziela, 6 = sobota
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
        Zamów <strong>TERAZ</strong> i otrzymasz swoją paczkę między <strong>{deliveryDates.deliveryRange}</strong>
      </p>
      <div className="flex justify-between items-center text-sm">
        <div className="text-center">
          <div className="text-2xl mb-1">📦</div>
          <div className="font-medium">Zamówione</div>
          <div className="text-gray-500">{deliveryDates.orderDate}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">🚚</div>
          <div className="font-medium">Wysłane</div>
          <div className="text-gray-500">{deliveryDates.shipDate}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">📍</div>
          <div className="font-medium">Dostarczone</div>
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
              Najwyższej jakości produkty elektroniczne i sportowe.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Obsługa Klienta</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white">Kontakt</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
              <li><a href="/returns" target="_blank" rel="noopener noreferrer" className="hover:text-white">Zwroty</a></li>
              <li><a href="#" className="hover:text-white">Gwarancja</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Informacje Prawne</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white">Regulamin</a></li>
              <li><a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white">Polityka Prywatności</a></li>
              <li><a href="/cookies" target="_blank" rel="noopener noreferrer" className="hover:text-white">Polityka Cookies</a></li>
              <li><a href="/gdpr" target="_blank" rel="noopener noreferrer" className="hover:text-white">Prawa Konsumenta</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Firma</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/about" target="_blank" rel="noopener noreferrer" className="hover:text-white">O Nas</a></li>
              <li><a href="#" className="hover:text-white">Kariera</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Partnerzy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © 2025 Newheras. Wszystkie prawa zastrzeżone.
            </p>
            <div className="flex space-x-6">
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">Polityka Prywatności</a>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">Regulamin</a>
              <a href="/cookies" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">Cookies</a>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500 max-w-4xl mx-auto">
            <p className="mb-2">
              <strong>Informacje prawne:</strong> Wszystkie ceny zawierają podatek VAT. Prawo do odstąpienia od umowy w ciągu 14 dni zgodnie z prawem konsumenckim.
              Gwarancja 24 miesiące zgodnie z Kodeksem Cywilnym. Sprzedawca: Newheras Sp. z o.o.
            </p>
            <p>
              <strong>Ochrona danych:</strong> Przetwarzamy Twoje dane osobowe zgodnie z RODO. Szczegóły w Polityce Prywatności.
              Używamy plików cookies w celach analitycznych i marketingowych. Więcej informacji w Polityce Cookies.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Componente Carosello per Camera
const ProductCarousel = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Le immagini del prodotto VoltCam 4K Pro
  const images = [
    "/images/Camera/1.png",
    "/images/Camera/2.png",
    "/images/Camera/3.png",
    "/images/Camera/4.png",
    "/images/Camera/5.gif"
  ];

  // Auto-slide ogni 8 secondi
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [images.length]);

  // Gestione touch per mobile
  const handleTouchStart = (e: any) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: any) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
  };

  const nextImage = () => {
    setCurrentImage((prev: any) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev: any) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: any) => {
    setCurrentImage(index);
  };

  return (
    <div className="relative">
      {/* Container principale */}
      <div
        className="relative w-full h-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Badge sconto */}
        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
          -60% ZNIŻKI
        </div>

        {/* Immagini */}
        <div className="relative min-h-[300px] max-h-[600px]">
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem - Vista ${index + 1}`}
              className={`w-full h-auto max-h-[600px] object-contain mx-auto transition-opacity duration-500 rounded-lg shadow-lg ${index === currentImage ? 'opacity-100' : 'opacity-0'
                } ${index !== currentImage ? 'absolute top-0 left-0' : ''}`}
            />
          ))}
        </div>

        {/* Frecce desktop */}
        <button
          onClick={prevImage}
          className="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextImage}
          className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Dots indicatori */}
      <div className="flex justify-center space-x-2 mt-4">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImage
              ? 'bg-green-600 w-8'
              : 'bg-gray-300 hover:bg-gray-400'
              }`}
          />
        ))}
      </div>

      {/* Thumbnails desktop */}
      <div className="hidden md:flex justify-center space-x-2 mt-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImage
              ? 'border-green-600 opacity-100'
              : 'border-gray-200 opacity-70 hover:opacity-100'
              }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Component
export default function CameraLanding() {
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      page_title: 'VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem - Strona Główna',
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
      content_ids: ['voltcam-4k-pro-sportcam'],
      content_name: 'VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem',
      value: 299.00,
      currency: 'PLN',
      num_items: 1
    });

    trackingUtils.trackGoogleEvent('view_item', {
      currency: 'PLN',
      value: 299.00,
      items: [{
        item_id: 'voltcam-4k-pro-sportcam',
        item_name: 'VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem',
        category: 'Electronics & Sports',
        quantity: 1,
        price: 299.00
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
      errors.imie = 'Imię i nazwisko jest wymagane';
      isValid = false;
    } else if (formData.imie.trim().length < 2) {
      errors.imie = 'Imię musi zawierać co najmniej 2 znaki';
      isValid = false;
    }

    if (!formData.telefon.trim()) {
      errors.telefon = 'Numer telefonu jest wymagany';
      isValid = false;
    } else {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
      if (!phoneRegex.test(formData.telefon.trim())) {
        errors.telefon = 'Wprowadź prawidłowy numer telefonu';
        isValid = false;
      }
    }

    if (!formData.adres.trim()) {
      errors.adres = 'Adres jest wymagany';
      isValid = false;
    } else if (formData.adres.trim().length < 10) {
      errors.adres = 'Adres musi być bardziej szczegółowy (ulica, numer, miasto, kod pocztowy)';
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

    console.log('🎯 Form submitted with form data:', formData);

    // Send notification to N8N for Telegram (without Facebook tracking)
    try {
      console.log('📡 Sending Purchase notification to N8N webhook...');

      const hashedPhone = formData.telefon ? await trackingUtils.hashData(formData.telefon.replace(/\D/g, '')) : null;
      const hashedFirstName = formData.imie ? await trackingUtils.hashData(formData.imie.split(' ')[0]) : null;
      const hashedLastName = formData.imie && formData.imie.split(' ').length > 1 ? await trackingUtils.hashData(formData.imie.split(' ').slice(1).join(' ')) : null;

      const now = Math.floor(Date.now() / 1000);
      const eventTimestamp = now - 10;

      const notificationData = {
        event_name: 'Purchase',
        event_id: (() => {
          const uniqueEventId = `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('fbEventId', uniqueEventId);
          return uniqueEventId;
        })(),
        timestamp: eventTimestamp,
        event_source_url: window.location.href,
        action_source: 'website',
        event_time: eventTimestamp,

        token: 'EAAPYtpMdWREBPJH0W7LzwU2MuZA61clyQOfYg5C6E0vo9E5QYgJWl2n5XtO8Ur93YTZANcWYz3qsAbDOadffn10KbQZCOwkRS6DpM8bRjwX25NBn5d1lvVNQhFOCGY9eZARrjyCbJs1OtFk2BOc4ZBbaUjeD7dvkejyxZAZAEQdeb8AQzUKdAQitdhU0jVGywZDZD',
        pixel_id: '763716602087140',

        telefono_hash: hashedPhone,
        nome_hash: hashedFirstName,
        cognome_hash: hashedLastName,
        indirizzo: formData.adres || null,

        traffic_source: trackingUtils.getTrafficSource(),
        user_agent: navigator.userAgent,
        fbp: trackingUtils.getFbBrowserId(),
        fbc: trackingUtils.getFbClickId(),

        content_name: 'VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem',
        content_category: 'Electronics & Sports',
        content_ids: 'voltcam-4k-pro-sportcam',
        content_type: 'product',
        value: 299.00,
        currency: 'PLN',
        quantity: 1
      };

      const n8nResponse = await fetch('https://primary-production-625c.up.railway.app/webhook/CAPI-Meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData)
      });

      if (n8nResponse.ok) {
        console.log('✅ Purchase notification sent to N8N successfully');
      } else {
        console.error('❌ N8N notification error:', n8nResponse.status);
      }
    } catch (error) {
      console.error('❌ N8N notification failed:', error);
    }

    try {
      // Ottieni click_id dai parametri URL
      const urlParams = new URLSearchParams(window.location.search);
      const clickId = urlParams.get('click_id');

      // Ottieni il fingerprint TMFP se disponibile
      const tmfpInput = document.querySelector('input[name="tmfp"]') as HTMLInputElement | null;
      const tmfpValue = tmfpInput?.value || '';

      // Prepara i dati per il Cloudflare Worker
      const leadData = {
        // Campi esistenti - preservati
        uid: '01980825-ae5a-7aca-8796-640a3c5ee3da',
        key: 'ad79469b31b0058f6ea72c',
        offer: '341',
        lp: '341',
        name: formData.imie.trim(),
        tel: formData.telefon.trim(),
        'street-address': formData.adres.trim(),
        tmfp: tmfpValue,
        ua: navigator.userAgent,

        // Nuovi campi richiesti
        network_type: 'traffic',
        url_network: 'https://offers.supertrendaffiliateprogram.com/forms/api/',
        click_id: clickId,

        // Dati del prodotto
        product: 'VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem',
        price: 299.00,
        currency: 'PLN',

        // Dati di tracking
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,

        // Parametri UTM
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_content: urlParams.get('utm_content'),
        utm_term: urlParams.get('utm_term'),

        // Timestamp
        timestamp: new Date().toISOString(),

        // Identificatori Facebook
        fbp: trackingUtils.getFbBrowserId(),
        fbc: trackingUtils.getFbClickId(),

        // Altri dati utili
        language: navigator.language,
        screen_resolution: `${screen.width}x${screen.height}`,
        page_title: document.title
      };

      console.log('📡 Sending data to Cloudflare Worker:', leadData);

      const response = await fetch('https://leads-ingest.hidden-rain-9c8e.workers.dev/', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer Y60kgTRvJUTTVEsMytKhcFAo1dxDl6Iom2oL8QqxaRVb7RM1O6jx9D3gJsx1l0A1',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      });

      console.log('📥 Response status:', response.status);

      if (response.status === 202) {
        // Successo - il worker ha accettato i dati
        const result = await response.json();
        const orderId = `VTO${Date.now()}`;

        console.log('✅ Lead successfully sent to Cloudflare Worker:', result);

        const orderData = {
          ...formData,
          orderId,
          product: 'VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem',
          price: 299.00,
          apiResponse: result
        };

        localStorage.setItem('orderData', JSON.stringify(orderData));
        console.log('✅ Order data saved to localStorage:', orderData);

        window.location.href = '/ty-camera-pl';
      } else if (response.status === 401) {
        console.error('❌ Unauthorized: Invalid token');
        alert('Błąd autoryzacji. Skontaktuj się z obsługą klienta.');
      } else if (response.status === 429) {
        console.error('❌ Rate limit exceeded');
        alert('Zbyt wiele żądań. Spróbuj ponownie za chwilę.');
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        alert(`Wystąpił błąd podczas wysyłania zamówienia (${response.status}). Spróbuj ponownie później.`);
      }
    } catch (error: unknown) {
      console.error('Network Error:', error);
      alert('Wystąpił błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Ładowanie strony...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <input type="hidden" name="tmfp" />


      <div className="bg-red-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center space-x-4 text-sm font-medium">
          <span>🔥 OFERTA LIMITOWANA – Zniżka -60% tylko dziś!</span>
        </div>
      </div>

      <section className="bg-white py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <ProductCarousel />
            </div>

            <div className="order-2 space-y-6">
              <div className="flex items-center space-x-2">
                <StarRating rating={5} size="w-5 h-5" />
                <span className="text-yellow-600 font-medium">4.9</span>
                <span className="text-gray-600">(287 opinii)</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                📹 VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem
              </h1>

              <p className="text-lg text-gray-700 font-medium">
                <strong>4K Ultra HD + Stabilizacja EIS</strong><br />
                Wodoodporna do 30 m, pilot nadgarstkowy, Wi-Fi + aplikacja
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">📹 <strong>4K/30fps • 20MP</strong> – Najwyższa jakość nagrań i zdjęć</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">⚡ <strong>EIS</strong> – Elektroniczna stabilizacja obrazu bez drgań</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🌊 <strong>Wodoszczelna 30 m</strong> – Obudowa wodoodporna w zestawie</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">📱 <strong>Pilot</strong> – Start/stop bez dotykania kamery</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">📐 <strong>Szeroki kąt 170°</strong> – Regulowany (70°/110°/170°)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">📲 <strong>Wi-Fi + App</strong> – Podgląd/transfer/udostępnianie</span>
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
                  📹 VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem
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
                  <span style={{ flex: '1 1 70%' }}>📹 Kamera 4K/30fps, 20MP, EIS, wodoszczelna 30 m</span>
                  <span style={{
                    color: 'red',
                    textDecoration: 'line-through',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>749,99 zł</span>
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
                  <span style={{ flex: '1 1 70%' }}>📱 Pilot nadgarstkowy i aplikacja Wi-Fi</span>
                  <span style={{
                    color: '#16a34a',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>✔ W zestawie</span>
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
                  <span style={{ flex: '1 1 70%' }}>🔧 Kompletny zestaw akcesoriów montażowych</span>
                  <span style={{
                    color: '#16a34a',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>✔ W zestawie</span>
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
                  <span style={{ flex: '1 1 70%' }}>🔋 2× akumulator + ładowarka</span>
                  <span style={{
                    color: '#16a34a',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>✔ W zestawie</span>
                </div>

                <div style={{
                  background: '#ecfdf5',
                  borderLeft: '4px solid #10b981',
                  padding: '10px 12px',
                  margin: '10px 0',
                  fontSize: '15px'
                }}>
                  🚚 <strong>Darmowa dostawa</strong> w całej Polsce (dostawa w 3-4 dni robocze)
                </div>

                <div style={{
                  background: '#ecfdf5',
                  borderLeft: '4px solid #10b981',
                  padding: '10px 12px',
                  margin: '10px 0',
                  fontSize: '15px'
                }}>
                  💶 <strong>Płatność przy odbiorze</strong> dostępna
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
                  Cena katalogowa: <span style={{ textDecoration: 'line-through', color: 'red' }}>749,99 zł</span><br />
                  <div style={{ marginTop: '10px' }}>
                    Dziś tylko: <span style={{ fontSize: '26px' }}>299,00 zł</span>
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
                  ⏳ <strong>Oferta ważna tylko przez kilka dni!</strong><br />
                  Skorzystaj zanim wróci do pełnej ceny.
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
                  ⚡ Ostatnie sztuki dostępne w magazynie
                </div>

                <p style={{ textAlign: 'center', fontSize: '14px', color: '#555' }}>
                  📦 Wysyłka w 24/48h – Dostawa gwarantowana w 3-4 dni
                </p>
              </div>

              <button
                onClick={handleOrderClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg animate-pulse-button"
              >
                🔥 ZAMÓW TERAZ - Płatność przy Odbiorze
              </button>

              <DeliveryTracking />

              {/* Recensione evidenziata */}
              <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                {/* Layout con foto centrata verticalmente rispetto al testo */}
                <div className="flex items-center space-x-4">
                  <img
                    src="images/michal.jpg"
                    alt="Michał K."
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />

                  <div className="flex-1">
                    {/* Stelle sopra il testo, allineate a sinistra */}
                    <div className="mb-3">
                      <StarRating rating={5} size="w-4 h-4" />
                    </div>

                    <p className="text-gray-800 text-sm leading-relaxed mb-3">
                      "Kupiłem VoltCam 4K Pro na urlop w górach i jestem zachwycony! 📹 Jakość 4K to czysta perfekcja, a EIS sprawia, że nagrania są płynne jak masło. Wodoodporna obudowa przeszła test w potoku, pilot to prawdziwa wygoda. Aplikacja działa świetnie przez Wi-Fi. Najlepsza kamera sportowa jaką testowałem!"
                    </p>

                    {/* Nome con checkmark blu */}
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">Michał K. - Kraków</span>
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
                📹 VoltCam™ 4K Pro – Kamera Sportowa Nowej Generacji!
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                <strong>VoltCam™ 4K Pro z EIS i pilotem</strong> to rewolucyjna kamera sportowa, zaprojektowana dla miłośników sportu i przygód, którzy wymagają najwyższej jakości.
              </p>
              <p className="text-lg text-gray-700">
                <strong>Stabilizacja EIS</strong> gwarantuje płynne ujęcia bez drgań, a <strong>pilot nadgarstkowy</strong> pozwala na start/stop bez dotykania kamery.
              </p>
            </div>
            <div>
              <img
                src="/images/Camera/5.gif"
                alt="Kamera w użyciu"
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
                src="/images/Camera/3.png"
                alt="Cechy kamery"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Cechy Premium VoltCam™ 4K Pro
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Wideo 4K/30fps + 20MP:</strong> Najwyższa jakość nagrań i zdjęć dla profesjonalnych rezultatów.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Stabilizacja EIS:</strong> Elektroniczna eliminacja drgań - płynne ujęcia nawet w ruchu.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Wodoszczelność 30 m:</strong> Obudowa wodoodporna w zestawie - idealna do nurkowania i sportu.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Pilot zdalnego sterowania:</strong> Start/stop bez dotykania - nadgarstkowy pilot w zestawie.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Wi-Fi + aplikacja:</strong> Podgląd na żywo, transfer i udostępnianie przez smartfona.
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
              Kompletny Zestaw VoltCam™ 4K Pro
            </h2>
            <p className="text-lg text-gray-700">
              Wszystko czego potrzebujesz do profesjonalnych nagrań sportowych - w jednym zestawie.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="/images/Camera/4.png"
                alt="Zestaw kamery"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">📹</div>
                  <h3 className="font-bold text-lg mb-2">Kamera 4K Pro</h3>
                  <p className="text-gray-600">EIS, 20MP, regulowany kąt 170°.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🌊</div>
                  <h3 className="font-bold text-lg mb-2">Obudowa 30m</h3>
                  <p className="text-gray-600">Wodoodporna do 30 metrów głębokości.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">📱</div>
                  <h3 className="font-bold text-lg mb-2">Pilot + Wi-Fi</h3>
                  <p className="text-gray-600">Nadgarstkowy pilot i aplikacja mobilna.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🔧</div>
                  <h3 className="font-bold text-lg mb-2">Akcesoria</h3>
                  <p className="text-gray-600">Uchwyty, klamry, 2× bateria, etui.</p>
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
              Co Czyni VoltCam™ 4K Pro Kamerą Sportową #1
            </h2>
            <p className="text-lg text-gray-700">
              W przeciwieństwie do zwykłych kamer sportowych, VoltCam™ 4K Pro oferuje prawdziwą stabilizację EIS, pilot i kompletny zestaw.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 sm:p-8 overflow-x-auto">
            <div className="min-w-full">
              <div className="hidden md:grid md:grid-cols-3 gap-4 text-center mb-4">
                <div></div>
                <div className="font-bold text-lg">VoltCam™ 4K Pro</div>
                <div className="font-bold text-lg">Inne</div>
              </div>

              {[
                'Prawdziwe 4K/30fps (nie interpolowane)',
                'Stabilizacja EIS elektroniczna',
                'Wodoszczelność 30 m z obudową',
                'Pilot zdalnego sterowania w zestawie',
                'Wi-Fi + aplikacja mobilna',
                'Kompletny zestaw akcesoriów'
              ].map((feature, index) => (
                <div key={index} className="border-b border-gray-200 py-4">
                  <div className="md:hidden">
                    <div className="font-medium text-lg mb-3">{feature}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="font-medium text-green-600 mb-1">VoltCam™ 4K Pro</div>
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
              Odpowiedzi na Twoje Najczęściej Zadawane Pytania
            </h2>
            <p className="text-lg text-gray-700">
              Jasność i wsparcie dla bezpiecznego zakupu.
            </p>
          </div>

          <div className="space-y-4">
            <FAQ
              question="Czy to prawdziwe 4K/30fps?"
              answer="Tak! VoltCam™ 4K Pro nagrywa w rzeczywistym 4K/30fps (3840×2160), nie jest to interpolowane. Można również nagrywać w 2.7K/30 i 1080p/60fps."
            />
            <FAQ
              question="Jak działa stabilizacja EIS?"
              answer="Elektroniczna stabilizacja obrazu EIS analizuje ruch w czasie rzeczywistym i koryguje drgania cyfrowo, zapewniając płynne ujęcia nawet podczas intensywnego sportu."
            />
            <FAQ
              question="Do ilu metrów jest wodoszczelna?"
              answer="Kamera jest wodoszczelna do 30 metrów głębokości w dołączonej obudowie wodoodpornej - idealna do nurkowania, surfingu i sportów wodnych."
            />
            <FAQ
              question="Czy w zestawie są 2 baterie i pilot?"
              answer="Tak! W zestawie znajdziesz: 2× wymienną baterię, ładowarkę USB, pilot nadgarstkowy, obudowę wodoodporną, uchwyty i etui ochronne."
            />
            <FAQ
              question="Jaką kartę microSD polecacie?"
              answer="Polecamy kartę microSD klasy 10 lub wyższej, minimum 32GB (obsługa do 128GB). Do nagrań 4K najlepsze są karty UHS-I U3."
            />
            <FAQ
              question="Jak działa aplikacja i Wi-Fi?"
              answer="Aplikacja mobilna pozwala na podgląd na żywo, sterowanie kamerą, transfer plików i udostępnianie w mediach społecznościowych. Zasięg Wi-Fi: do 10m."
            />
            <FAQ
              question="Jak wygląda dostawa i zwroty?"
              answer="Darmowa dostawa w 3-4 dni robocze. 30-dniowa gwarancja zwrotu pieniędzy i 24-miesięczna gwarancja producenta na wady fabryczne."
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
              Opinie klientów o VoltCam™ 4K Pro
            </h2>
            <p className="text-lg text-gray-700">
              Autentyczne i wiarygodne opinie użytkowników
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Michał K. - Kraków",
                rating: 5,
                review: "VoltCam 4K Pro to najlepsza kamera sportowa jaką testowałem! 📹 Jakość 4K jest niesamowita, a stabilizacja EIS działa perfekcyjnie. Wodoodporna obudowa przeszła test w górskim potoku. Pilot to prawdziwa wygoda!"
              },
              {
                name: "Ania M. - Warszawa",
                rating: 5,
                review: "Kupiłam na wakacje nad morzem. Stabilizacja EIS to game-changer - nagrania są płynne jak masło! Aplikacja Wi-Fi działa świetnie, łatwo przesyłam filmy na Instagram. Polecam każdemu miłośnikowi sportu!"
              },
              {
                name: "Paweł S. - Wrocław",
                rating: 5,
                review: "Jako instruktor narciarstwa potrzebowałem profesjonalnej kamery. VoltCam 4K Pro spełnia wszystkie oczekiwania! Pilot pozwala na start/stop bez zdejmowania rękawic. Montaż na kasku super łatwy!"
              },
              {
                name: "Kasia F. - Gdańsk",
                rating: 5,
                review: "Używam do kitesurfingu. Obudowa wodoodporna to solidny sprzęt - kamera przetrwała upadek do wody z 5m wysokości. Jakość nagrań pod wodą również doskonała. Warto zainwestować!"
              },
              {
                name: "Tomek J. - Poznań",
                rating: 5,
                review: "Najlepsza kamera w tej cenie! Prawdziwe 4K, nie jak u konkurencji. EIS eliminuje wszystkie drgania. Baterie wystarczają na długie sesje. Kompletny zestaw akcesoriów - nic więcej nie trzeba kupować!"
              },
              {
                name: "Ewelina K. - Łódź",
                rating: 5,
                review: "Świetny zakup! Aplikacja mobilna jest intuicyjna, podgląd na żywo działa bez opóźnień. Zestaw uchwytów pozwala na montaż wszędzie. Jakość zdjęć 20MP również imponująca. Polecam!"
              },
              {
                name: "Robert N. - Szczecin",
                rating: 4,
                review: "Solidny sprzęt! Używam już 6 miesięcy do mountain bike'a. Wytrzymałość na najwyższym poziomie. Jedyny minus - mógłby być w zestawie drugi pilot. Poza tym - rewelacja! 😊"
              },
              {
                name: "Magda P. - Lublin",
                rating: 5,
                review: "To nie jest zwykła kamera sportowa - to profesjonalne narzędzie! EIS rzeczywiście działa, kąt 170° pozwala na spektakularne ujęcia. Instrukcja po polsku bardzo pomocna!"
              },
              {
                name: "Adam H. - Białystok",
                rating: 5,
                review: "Używam już rok do różnych sportów. Jakość pozostaje na tym samym wysokim poziomie. Pilot nadal działa bezawaryjnie, baterie trzymają długo. Najlepsza inwestycja sportowa!"
              }
            ].map((review, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center space-x-2 mb-3">
                  <StarRating rating={review.rating} />
                  <span className="text-sm text-gray-600">Zweryfikowany Kupujący</span>
                </div>
                <p className="text-gray-700 mb-3">{review.review}</p>
                <p className="font-medium text-gray-900">- {review.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white p-8 rounded-lg shadow-lg border-l-4 border-yellow-400">
            <div className="flex items-start space-x-4">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=70&h=70&fit=crop&crop=face"
                alt="Łukasz M."
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <StarRating rating={5} />
                  <span className="font-medium">Łukasz M. - Rzeszów</span>
                  <span className="text-sm text-gray-600">Zweryfikowany Kupujący</span>
                </div>
                <p className="text-gray-700">
                  "Fantastyczna VoltCam 4K Pro! 📹 Stabilizacja EIS to prawdziwa rewolucja - nagrania płynne jak z profesjonalnego gimbal'a! Pilot nadgarstkowy pozwala na start/stop bez dotykania kamery - idealne podczas jazdy na rowerze. Wodoodporna obudowa przetrwała ekstremalne testy. Aplikacja Wi-Fi działa bez zarzutu. To najlepsza kamera sportowa na rynku!"
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
              30-Dniowa Gwarancja Zwrotu Pieniędzy
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Wypróbuj kamerę VoltCam™ 4K Pro z całkowitym bezpieczeństwem dzięki naszej 30-dniowej gwarancji zwrotu pieniędzy. Doświadcz jakości 4K i stabilizacji EIS bez ryzyka.
            </p>
            <p className="text-xl font-bold text-green-600">
              Jeśli nie jesteś całkowicie zadowolony, zwrócimy Ci całą kwotę.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dlaczego kupować od nas?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Numer śledzenia dla każdego zamówienia</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Płatności bezpośrednio przy odbiorze</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Pomoc 24 godziny na dobę, 7 dni w tygodniu</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Brak ukrytych kosztów!</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">DOSTAWA</h3>
              <p className="text-gray-700 mb-4">
                Wysyłamy w całej Polsce, a jeśli zamówienie zostanie złożone przed 21:59, zostanie wysłane następnego dnia roboczego.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Dostarczone w 3-4 dni robocze</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">W zestawie numer śledzenia</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Sprzedawane wyłącznie przez <strong>NEWHERAS</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            🔥 Nie Przegap Tej Specjalnej Oferty!
          </h2>
          <p className="text-xl mb-8">
            Tylko na dziś: <span className="line-through opacity-75">749,99 zł</span> <span className="text-5xl font-bold">299,00 zł</span>
          </p>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Users className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">1,890+</div>
                <div className="text-sm opacity-90">Zadowolonych Klientów</div>
              </div>
              <div>
                <Package className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">97.8%</div>
                <div className="text-sm opacity-90">Wskaźnik Zadowolenia</div>
              </div>
              <div>
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">24/7</div>
                <div className="text-sm opacity-90">Obsługa Klientów</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleOrderClick}
            className="bg-white text-orange-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg mb-4 w-full md:w-auto"
          >
            🛒 ZAMÓW TERAZ - OSTATNIE SZTUKI DOSTĘPNE
          </button>

          <p className="text-sm opacity-90">
            ⚡ Oferta ograniczona w czasie • 🚚 Darmowa dostawa • 💯 Gwarancja 30 dni
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
          🔥 ZAMÓW TERAZ - Płatność przy Odbiorze
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

            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 pr-8">Wypełnij aby zamówić</h3>
            <p className="text-gray-600 mb-4 md:mb-6">Płatność przy odbiorze</p>

            <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Podsumowanie zamówienia</h4>
              <div className="flex items-center gap-3">
                <img
                  src="/images/Camera/2.png"
                  alt="Kamera sportowa"
                  className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm md:text-base">📹 VoltCam™ 4K Pro – Kamera Sportowa z EIS i Pilotem</div>
                  <div className="text-xs md:text-sm text-gray-600">4K, EIS, Wodoszczelna 30m, Pilot, Akcesoria</div>
                  <div className="text-xs md:text-sm text-green-600">✅ Darmowa dostawa</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-lg md:text-xl text-gray-900">299,00 zł</div>
                  <div className="text-xs text-gray-500 line-through">749,99 zł</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 md:mb-6">
              <div className="text-center">
                <div className="text-xs text-red-600 mb-1">🔒 Rezerwujemy Twoje zamówienie</div>
                <div className="text-xl md:text-2xl font-mono font-bold text-red-700">
                  {reservationTimer.minutes.toString().padStart(2, '0')}:{reservationTimer.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Pozostały czas na sfinalizowanie zamówienia
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko *</label>
                <input
                  type="text"
                  value={formData.imie}
                  onChange={(e) => handleFormChange('imie', e.target.value)}
                  className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 text-base ${formErrors.imie
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                    }`}
                  placeholder="Twoje pełne imię i nazwisko"
                />
                {formErrors.imie && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.imie}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numer Telefonu *</label>
                <input
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => handleFormChange('telefon', e.target.value)}
                  className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 text-base ${formErrors.telefon
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                    }`}
                  placeholder="Twój numer telefonu"
                />
                {formErrors.telefon && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.telefon}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pełny Adres *</label>
                <textarea
                  value={formData.adres}
                  onChange={(e) => handleFormChange('adres', e.target.value)}
                  className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 h-20 md:h-20 text-base resize-none ${formErrors.adres
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                    }`}
                  placeholder="Ulica, numer domu, miasto, kod pocztowy"
                />
                {formErrors.adres && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.adres}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4 mt-4 text-gray-700">
              <Shield className="w-5 h-5" />
              <span className="font-medium text-sm md:text-base">Płatność przy odbiorze</span>
            </div>

            <button
              onClick={handleOrderSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 text-base md:text-lg"
            >
              {isSubmitting ? 'PRZETWARZANIE...' : 'POTWIERDŹ ZAMÓWIENIE - 299,00 zł'}
            </button>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
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