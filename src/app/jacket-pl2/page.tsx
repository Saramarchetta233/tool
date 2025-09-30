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
    // Generate deterministic ID that will be the same on server and client
    const clientEventId = typeof window !== 'undefined' ?
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` :
      `static-${eventName.toLowerCase()}-${Math.floor(Math.random() * 1000)}`;

    console.debug(`[FB] trackFacebookEvent called: ${eventName}, eventID: ${clientEventId}`);

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
        const now = typeof window !== 'undefined' ? Math.floor(Date.now() / 1000) : 1694880000;
        const maxPastTime = now - (7 * 24 * 60 * 60); // 7 giorni fa
        const eventTimestamp = Math.max(maxPastTime, now - 10); // Massimo 10 secondi fa

        const capiData = {
          event_name: eventName,
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
          content_name: 'SportArmor™ Pro – Sportowa Kurtka Motocyklowa z Ochraniaczami CE i Zaawansowaną Membranami',
          content_category: 'Motorcycle & Safety Gear',
          content_ids: 'roadshield-4seasons-motorcycle-jacket',
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
      const timestamp = typeof window !== 'undefined' ? Math.floor(Date.now() / 1000) : 1694880000;
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
      const timestamp = typeof window !== 'undefined' ? Math.floor(Date.now() / 1000) : 1694880000;
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

// Color to Image mapping
const COLOR_IMAGE_MAP = {
  'Czarny': '/images/jacket2/1.jpg',
  'Szary': '/images/jacket2/2.jpg',
  'Czerwony': '/images/jacket2/3.jpg',
} as const;

// Countdown Timer Component
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
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

    // Start calculation only after component mounts
    const timer = setTimeout(() => {
      calculateTimeLeft();
      const interval = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(interval);
    }, 100);

    return () => clearTimeout(timer);
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
  const [stock, setStock] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setStock(prev => {
        const change = Math.random() > 0.7 ? -1 : 0;
        return Math.max(9, prev + change);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
              src="/images/jacket2/3.jpg"
              alt="Zadowalające rezultaty"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Przekształć Swoją Jazdę z Wyjątkowym Bezpieczeństwem
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
                <p className="text-sm font-medium text-gray-700">Stwierdziło znacznie lepsze bezpieczeństwo dzięki ochraniacom CE!</p>
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
                      strokeDasharray={`${95 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">95%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Zauważyło komfort w każdych warunkach pogodowych!</p>
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
                      strokeDasharray={`${98 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">98%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Doceniło jakość materiałów i trwałość kurtki!</p>
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
    orderDate: 'pon, 16 wrz',
    shipDate: 'wt, 17 wrz',
    deliveryStart: 'cz, 19 wrz',
    deliveryEnd: 'pt, 20 wrz',
    deliveryRange: 'cz, 19 wrz a pt, 20 wrz'
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

    // Calculate dates only after component mounts
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
              Najwyższej jakości produkty dla bezpiecznej i komfortowej jazdy motocyklowej.
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

// Componente Carosello per Kurtka Motocyklowa
const ProductCarousel = ({ selectedColor }: { selectedColor: 'Czarny' | 'Szary' | 'Czerwony' }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Le immagini del prodotto RoadShield 4-Seasons Jacket
  // La prima immagine cambia in base al colore selezionato
  const images = [
    COLOR_IMAGE_MAP[selectedColor], // Immagine principale basata sul colore
    "/images/jacket2/1.jpg",
    "/images/jacket2/2.jpg",
    "/images/jacket2/3.jpg",
    "/images/jacket2/4.jpg",
    "/images/jacket2/5.jpg",
    "/images/jacket2/6.jpg"
  ];

  // Auto-slide ogni 8 secondi
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [images.length]);

  // Reset al primo slide quando cambia colore
  useEffect(() => {
    setCurrentImage(0);
  }, [selectedColor]);

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
              alt={`SportArmor™ Pro – Kurtka Motocyklowa CE - Vista ${index + 1}`}
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
            className={`p-2 transition-all duration-300`}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImage
                ? 'bg-green-600 w-8'
                : 'bg-gray-300 hover:bg-gray-400'
                }`}
            />
          </button>
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
export default function JacketLanding() {
  const [mounted, setMounted] = useState(false);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [reservationTimer, setReservationTimer] = useState({ minutes: 5, seconds: 0 });
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [bounceAnimation, setBounceAnimation] = useState(false);

  // Global state for color and size (hoisted outside form)
  const [color, setColor] = useState<'Czarny' | 'Szary' | 'Czerwony'>('Czarny');
  const [size, setSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL'>('S');

  const [formData, setFormData] = useState({
    imie: '',
    telefon: '',
    adres: '',
    colorlo: '',
    taglia: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    imie: '',
    telefon: '',
    adres: '',
    colorlo: '',
    taglia: ''
  });

  // Fix hydration mismatch
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
      page_title: 'SportArmor™ Pro – Kurtka Motocyklowa CE - Strona Główna',
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

  const validateVariantSelection = () => {
    if (!color || !size) {
      alert('Wybierz kolor i rozmiar.');
      return false;
    }
    return true;
  };

  // Size guide tab switching function
  const showSizeTab = (key: string) => {
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.sizeguide-tabs button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Remove active class from all content
    const contents = document.querySelectorAll('.sizeguide-content');
    contents.forEach(tab => tab.classList.remove('active'));

    // Add active class to target button and content
    const targetButton = document.querySelector(`.sizeguide-tabs button[data-target="${key}"]`);
    const targetContent = document.getElementById(`tab-${key}`);

    if (targetButton) targetButton.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
  };

  // Expose function to window for script access
  React.useEffect(() => {
    (window as any).showSizeTab = showSizeTab;
    return () => {
      delete (window as any).showSizeTab;
    };
  }, []);

  const handleOrderClick = () => {
    console.log('🎯 Order button clicked - tracking InitiateCheckout');
    console.debug('[FB] CTA click - will track InitiateCheckout (NOT Purchase)');

    // Track InitiateCheckout event (inizio processo acquisto)
    trackingUtils.trackFacebookEvent('InitiateCheckout', {
      content_type: 'product',
      content_ids: ['roadshield-4seasons-motorcycle-jacket'],
      content_name: 'SportArmor™ Pro – Sportowa Kurtka Motocyklowa z Ochraniaczami CE i Zaawansowaną Membranami',
      value: 299.00,
      currency: 'PLN',
      num_items: 1
    });

    trackingUtils.trackGoogleEvent('view_item', {
      currency: 'PLN',
      value: 299.00,
      items: [{
        item_id: 'roadshield-4seasons-motorcycle-jacket',
        item_name: 'SportArmor™ Pro – Sportowa Kurtka Motocyklowa z Ochraniaczami CE i Zaawansowaną Membranami',
        category: 'Motorcycle & Safety Gear',
        quantity: 1,
        price: 299.00
      }]
    });

    // Sync global state with form data when opening popup
    setFormData(prev => ({
      ...prev,
      colorlo: color,
      taglia: size
    }));

    setShowOrderPopup(true);
    setReservationTimer({ minutes: 5, seconds: 0 });
    setFormErrors({ imie: '', telefon: '', adres: '', colorlo: '', taglia: '' });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = { imie: '', telefon: '', adres: '', colorlo: '', taglia: '' };
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

    if (!formData.colorlo.trim()) {
      errors.colorlo = 'Wybierz color kurtki';
      isValid = false;
    }

    if (!formData.taglia.trim()) {
      errors.taglia = 'Wybierz rozmiar';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleOrderSubmit = async () => {
    if (isSubmitting) return;

    if (!validateVariantSelection() || !validateForm()) {
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

      const now = typeof window !== 'undefined' ? Math.floor(Date.now() / 1000) : 1694880000;
      const eventTimestamp = now - 10;

      const notificationData = {
        event_name: 'Purchase',
        event_id: (() => {
          if (typeof window === 'undefined') return 'static-purchase-ssr';
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

        // Varianti prodotto
        color: color,
        size: size,
        color_image: COLOR_IMAGE_MAP[color],

        traffic_source: trackingUtils.getTrafficSource(),
        user_agent: navigator.userAgent,
        fbp: trackingUtils.getFbBrowserId(),
        fbc: trackingUtils.getFbClickId(),

        content_name: 'SportArmor™ Pro – Sportowa Kurtka Motocyklowa z Ochraniaczami CE i Zaawansowaną Membranami',
        content_category: 'Motorcycle & Safety Gear',
        content_ids: 'roadshield-4seasons-motorcycle-jacket',
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
        offer: '463',
        lp: '463',
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
        product: 'SportArmor™ Pro – Sportowa Kurtka Motocyklowa z Ochraniaczami CE i Zaawansowaną Membranami',
        price: 299.00,
        currency: 'PLN',
        colorlo: color,
        taglia: size,
        color_image: COLOR_IMAGE_MAP[color],

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
        timestamp: typeof window !== 'undefined' ? new Date().toISOString() : '2023-09-16T12:00:00.000Z',

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
        const orderId = typeof window !== 'undefined' ? `JKT${Date.now()}` : 'JKT1694880000000';

        console.log('✅ Lead successfully sent to Cloudflare Worker:', result);

        const orderData = {
          ...formData,
          orderId,
          product: 'SportArmor™ Pro – Sportowa Kurtka Motocyklowa z Ochraniaczami CE i Zaawansowaną Membranami',
          price: 299.00,
          apiResponse: result
        };

        localStorage.setItem('orderData', JSON.stringify(orderData));
        console.log('✅ Order data saved to localStorage:', orderData);

        window.location.href = '/ty-jacket-pl';
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

  // Prevent hydration mismatch
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
    <>
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
                <ProductCarousel selectedColor={color} />
              </div>

              <div className="order-2 space-y-6">
                <div className="flex items-center space-x-2">
                  <StarRating rating={5} size="w-5 h-5" />
                  <span className="text-yellow-600 font-medium">4.9</span>
                  <span className="text-gray-600">(478 opinii)</span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  🏍️ SportArmor™ Pro – Sportowa Kurtka Motocyklowa z Ochraniaczami CE i Zaawansowaną Membranami
                </h1>

                <p className="text-lg text-gray-700 font-medium">
                  <strong>Kurtka 4-sezonowa z ochraniaczyami CE, wodoodporną membraną i systemem wentylacji – bezpieczeństwo i komfort w każdych warunkach.</strong>
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">🛡️ Ochraniacze CE</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">💧 Wodoodporna</span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">🌬️ Oddychająca</span>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">🔥 Podszewka termo</span>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">✨ Odblaski 360°</span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">📏 Rozmiary S-3XL</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base">🛡️ <strong>Maksymalne Bezpieczeństwo CE</strong> – Zaawansowane ochraniacze barki/łokcie/plecy poziom 1 + ochrona kręgosłupa</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base">🌦️ <strong>Perfekcyjny Komfort w Każdą Pogodę</strong> – Zaawansowana membrana 3-warstwowa + system kontroli wilgoci</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base">🌬️ <strong>Inteligentny System Wentylacji</strong> – 12 regulowanych otworów wentylacyjnych dla optymalnej cyrkulacji</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base">🔥 <strong>Zaawansowana Podszewka Termo</strong> – Technologia Thinsulate 3M + regulacja 4 poziomów ciepła</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base">⚡ <strong>Sportowy Design Racing</strong> – Aerodynamiczny krój + elementy odblaskowe 360°</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base">💪 <strong>Wzmocnione Szwy Kevlar</strong> – Podwójne przeszycia + odporność na przetarcie</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base">🎯 <strong>Precyzyjne Dopasowanie</strong> – 15 punktów regulacji + ergonomiczny krój sportowy</span>
                  </div>
                </div>

                {/* MINIMAL BRAND SELECTORS - POLISH */}
                <section
                  aria-labelledby="variantsTitle"
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}
                >
                  <h3
                    id="variantsTitle"
                    style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111',
                      margin: '0 0 8px',
                      letterSpacing: '0'
                    }}
                  >
                    Wybierz kolor i rozmiar
                  </h3>

                  {/* Color Selection */}
                  <div style={{ margin: '10px 0' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111',
                      marginBottom: '6px'
                    }}>
                      Kolor *
                    </div>
                    <div
                      role="radiogroup"
                      aria-label="Kolor"
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={color === 'Czarny'}
                        tabIndex={0}
                        onClick={() => setColor('Czarny')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setColor('Czarny');
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '42px',
                          padding: '0 14px',
                          fontSize: '14px',
                          fontWeight: color === 'Czarny' ? '600' : '500',
                          color: '#111',
                          background: color === 'Czarny' ? '#F3F4F6' : '#fff',
                          border: `1px solid ${color === 'Czarny' ? '#111' : '#D1D5DB'}`,
                          borderRadius: '8px',
                          transition: 'background .15s, border-color .15s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (color !== 'Czarny') {
                            (e.target as HTMLElement).style.background = '#F9FAFB';
                            (e.target as HTMLElement).style.borderColor = '#9CA3AF';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (color !== 'Czarny') {
                            (e.target as HTMLElement).style.background = '#fff';
                            (e.target as HTMLElement).style.borderColor = '#D1D5DB';
                          }
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLElement).style.outline = '2px solid #111';
                          (e.target as HTMLElement).style.outlineOffset = '1px';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLElement).style.outline = 'none';
                        }}
                      >
                        Czarny
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={color === 'Szary'}
                        tabIndex={0}
                        onClick={() => setColor('Szary')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setColor('Szary');
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '42px',
                          padding: '0 14px',
                          fontSize: '14px',
                          fontWeight: color === 'Szary' ? '600' : '500',
                          color: '#111',
                          background: color === 'Szary' ? '#F3F4F6' : '#fff',
                          border: `1px solid ${color === 'Szary' ? '#111' : '#D1D5DB'}`,
                          borderRadius: '8px',
                          transition: 'background .15s, border-color .15s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (color !== 'Szary') {
                            (e.target as HTMLElement).style.background = '#F9FAFB';
                            (e.target as HTMLElement).style.borderColor = '#9CA3AF';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (color !== 'Szary') {
                            (e.target as HTMLElement).style.background = '#fff';
                            (e.target as HTMLElement).style.borderColor = '#D1D5DB';
                          }
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLElement).style.outline = '2px solid #111';
                          (e.target as HTMLElement).style.outlineOffset = '1px';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLElement).style.outline = 'none';
                        }}
                      >
                        Szary
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={color === 'Czerwony'}
                        tabIndex={0}
                        onClick={() => setColor('Czerwony')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setColor('Czerwony');
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '42px',
                          padding: '0 14px',
                          fontSize: '14px',
                          fontWeight: color === 'Czerwony' ? '600' : '500',
                          color: '#111',
                          background: color === 'Czerwony' ? '#F3F4F6' : '#fff',
                          border: `1px solid ${color === 'Czerwony' ? '#111' : '#D1D5DB'}`,
                          borderRadius: '8px',
                          transition: 'background .15s, border-color .15s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (color !== 'Czerwony') {
                            (e.target as HTMLElement).style.background = '#F9FAFB';
                            (e.target as HTMLElement).style.borderColor = '#9CA3AF';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (color !== 'Czerwony') {
                            (e.target as HTMLElement).style.background = '#fff';
                            (e.target as HTMLElement).style.borderColor = '#D1D5DB';
                          }
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLElement).style.outline = '2px solid #111';
                          (e.target as HTMLElement).style.outlineOffset = '1px';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLElement).style.outline = 'none';
                        }}
                      >
                        Czerwony
                      </button>
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div style={{ margin: '10px 0' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111',
                      marginBottom: '6px'
                    }}>
                      Rozmiar *
                    </div>
                    <div
                      role="radiogroup"
                      aria-label="Rozmiar"
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}
                    >
                      {(['S', 'M', 'L', 'XL', 'XXL', '3XL'] as const).map((sizeOption) => (
                        <button
                          key={sizeOption}
                          type="button"
                          role="radio"
                          aria-checked={size === sizeOption}
                          tabIndex={0}
                          onClick={() => setSize(sizeOption)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSize(sizeOption);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '42px',
                            padding: '0 14px',
                            fontSize: '14px',
                            fontWeight: size === sizeOption ? '600' : '500',
                            color: '#111',
                            background: size === sizeOption ? '#F3F4F6' : '#fff',
                            border: `1px solid ${size === sizeOption ? '#111' : '#D1D5DB'}`,
                            borderRadius: '8px',
                            transition: 'background .15s, border-color .15s',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            if (size !== sizeOption) {
                              (e.target as HTMLElement).style.background = '#F9FAFB';
                              (e.target as HTMLElement).style.borderColor = '#9CA3AF';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (size !== sizeOption) {
                              (e.target as HTMLElement).style.background = '#fff';
                              (e.target as HTMLElement).style.borderColor = '#D1D5DB';
                            }
                          }}
                          onFocus={(e) => {
                            (e.target as HTMLElement).style.outline = '2px solid #111';
                            (e.target as HTMLElement).style.outlineOffset = '1px';
                          }}
                          onBlur={(e) => {
                            (e.target as HTMLElement).style.outline = 'none';
                          }}
                        >
                          {sizeOption}
                        </button>
                      ))}
                    </div>

                  </div>

                  {/* Minimal Choice Summary */}
                  <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Twój wybór: <strong>{color}</strong>, <strong>Rozmiar {size}</strong>
                  </div>
                </section>

                {/* Simplified Pricing Section */}
                <div style={{
                  textAlign: 'center',
                  margin: '20px 0',
                  padding: '20px',
                  background: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{
                      color: 'red',
                      textDecoration: 'line-through',
                      fontSize: '20px',
                      marginRight: '15px'
                    }}>747,50 zł</span>
                    <span style={{
                      color: '#16a34a',
                      fontSize: '32px',
                      fontWeight: 'bold'
                    }}>299 zł</span>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    color: '#7f1d1d',
                    fontWeight: '500',
                    background: '#fef2f2',
                    padding: '8px',
                    borderRadius: '6px',
                    marginTop: '15px',
                    fontSize: '14px'
                  }}>
                    ⏳ <strong>Oferta ważna tylko przez kilka dni!</strong>
                  </div>
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
                      src="images/marcin.jpg"
                      alt="Marcin K."
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                    />

                    <div className="flex-1">
                      {/* Stelle sopra il testo, allineate a sinistra */}
                      <div className="mb-3">
                        <StarRating rating={5} size="w-4 h-4" />
                      </div>

                      <p className="text-gray-800 text-sm leading-relaxed mb-3">
                        "Kupiłem RoadShield 4-Seasons miesiąc temu i jestem zachwycony! 🛡️ Ochraniacze CE dają pełne bezpieczeństwo, membrana wodoodporna trzyma sucho w deszczu. System wentylacji ratuje latem, a podszewka termo świetnie sprawdza się zimą. Najlepsza kurtka motocyklowa jaką miałem!"
                      </p>

                      {/* Nome con checkmark blu */}
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">Marcin K. - Kraków</span>
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
                  🏍️ SportArmor™ Pro – Bezpieczeństwo na Każdym Kilometrze!
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  <strong>SportArmor™ Pro z ochraniaczyami CE</strong> to rewolucyjna kurtka motocyklowa, zaprojektowana dla motocyklistów, którzy wymagają najwyższego poziomu ochrony.
                </p>
                <p className="text-lg text-gray-700">
                  <strong>Ochraniacze CE poziom 1</strong> gwarantują ochronę barków, łokci i pleców, a <strong>wodoodporna membrana</strong> zapewnia komfort w każdych warunkach pogodowych.
                </p>
              </div>
              <div>
                <img
                  src="/images/jacket2/4.jpg"
                  alt="Kurtka w użyciu"
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
                  src="/images/jacket2/5.jpg"
                  alt="Cechy kurtki"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Dlaczego SportArmor™ Pro?
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-lg">
                      <strong>Bezpieczeństwo CE:</strong> Ochraniacze barki/łokcie/plecy poziom 1 – pełna ochrona w razie upadku.
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-lg">
                      <strong>Komfort w każdą pogodę:</strong> Membrana wodoodporna + oddychająca – sucho i komfortowo zawsze.
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-lg">
                      <strong>Wentylacja:</strong> Otwory pod pachami i na plecach z zamkami – regulacja temperatury.
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-lg">
                      <strong>Podszewka termo:</strong> Wypinana na zimę – jedna kurtka na 4 sezony.
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-lg">
                      <strong>Widoczność 360°:</strong> Odblaski na ramionach i plecach – bezpieczeństwo w nocy.
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
                4 Sezony Wykorzystania – Jedna Kurtka na Cały Rok
              </h2>
              <p className="text-lg text-gray-700">
                SportArmor™ Pro to jedyna kurtka motocyklowa, która doskonale sprawdza się w każdych warunkach pogodowych.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <img
                  src="/images/jacket2/6.jpg"
                  alt="Kurtka 4 sezony"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-white rounded-lg shadow-md">
                    <div className="text-4xl mb-4">❄️</div>
                    <h3 className="font-bold text-lg mb-2">ZIMA</h3>
                    <p className="text-gray-600">Z podszewką termo + warstwa bazowa = ciepło i ochrona.</p>
                  </div>
                  <div className="text-center p-6 bg-white rounded-lg shadow-md">
                    <div className="text-4xl mb-4">🌸</div>
                    <h3 className="font-bold text-lg mb-2">WIOSNA/JESIEŃ</h3>
                    <p className="text-gray-600">Bez podszewki, wentylacja zamknięta = idealny komfort.</p>
                  </div>
                  <div className="text-center p-6 bg-white rounded-lg shadow-md">
                    <div className="text-4xl mb-4">☀️</div>
                    <h3 className="font-bold text-lg mb-2">LATO</h3>
                    <p className="text-gray-600">Wszystkie wentylacje otwarte, oddychająca membrana.</p>
                  </div>
                  <div className="text-center p-6 bg-white rounded-lg shadow-md">
                    <div className="text-4xl mb-4">🌧️</div>
                    <h3 className="font-bold text-lg mb-2">DESZCZ</h3>
                    <p className="text-gray-600">Wodoodporna membrana chroni w każdych warunkach.</p>
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
                Zestaw W Komplecie
              </h2>
              <p className="text-lg text-gray-700">
                Wszystko czego potrzebujesz do bezpiecznej i komfortowej jazdy w każdych warunkach.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="text-4xl mb-4">🏍️</div>
                  <h3 className="font-bold text-lg mb-2">Kurtka SportArmor™ Pro</h3>
                  <p className="text-gray-600">Główna kurtka z membraną wodoodporną i systemem wentylacji</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="text-4xl mb-4">🛡️</div>
                  <h3 className="font-bold text-lg mb-2">Komplet Ochraniaczy CE</h3>
                  <p className="text-gray-600">Barki, łokcie i plecy - poziom ochrony 1</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="text-4xl mb-4">🔥</div>
                  <h3 className="font-bold text-lg mb-2">Wypinana Podszewka Termiczna</h3>
                  <p className="text-gray-600">Ciepło na zimę, chłód na lato</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="font-bold text-lg mb-2">Instrukcja w Języku Polskim</h3>
                  <p className="text-gray-600">Szczegółowe instrukcje użytkowania i pielęgnacji</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="font-bold text-lg mb-2">Certyfikat CE</h3>
                  <p className="text-gray-600">Potwierdzenie jakości i bezpieczeństwa</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="text-4xl mb-4">📏</div>
                  <h3 className="font-bold text-lg mb-2">Tabela Rozmiarów</h3>
                  <p className="text-gray-600">S, M, L, XL, XXL, 3XL - idealny rozmiar dla każdego</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Specyfikacja Techniczna
              </h2>
              <p className="text-lg text-gray-700">
                Najważniejsze parametry techniczne kurtki SportArmor™ Pro
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800">Materiał:</h4>
                    <p className="text-gray-600">Oxford 600D/900D z wzmocnieniami</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800">Membrana:</h4>
                    <p className="text-gray-600">Wodoodporna + oddychająca</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800">Ochraniacze:</h4>
                    <p className="text-gray-600">CE Level 1 (barki, łokcie, plecy)</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800">Wentylacja:</h4>
                    <p className="text-gray-600">Otwory pod pachami i na plecach z zamkami</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800">Odblaski:</h4>
                    <p className="text-gray-600">Na ramionach, plecach i mankietach</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800">Zamki:</h4>
                    <p className="text-gray-600">YKK (główny + kieszenie)</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800">Podszewka:</h4>
                    <p className="text-gray-600">Termo, wypinana</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800">Rozmiary:</h4>
                    <p className="text-gray-600">S, M, L, XL, XXL, 3XL</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabella Rozmiarów */}
            <div className="mt-12 bg-white rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Tabela Rozmiarów</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Rozmiar</th>
                      <th className="px-4 py-3 text-left font-semibold">Klatka Piersiowa</th>
                      <th className="px-4 py-3 text-left font-semibold">Talia</th>
                      <th className="px-4 py-3 text-left font-semibold">Długość Rękawa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium">S</td>
                      <td className="px-4 py-3">96-104 cm</td>
                      <td className="px-4 py-3">76-84 cm</td>
                      <td className="px-4 py-3">61 cm</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">M</td>
                      <td className="px-4 py-3">104-112 cm</td>
                      <td className="px-4 py-3">84-92 cm</td>
                      <td className="px-4 py-3">63 cm</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">L</td>
                      <td className="px-4 py-3">112-120 cm</td>
                      <td className="px-4 py-3">92-100 cm</td>
                      <td className="px-4 py-3">65 cm</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">XL</td>
                      <td className="px-4 py-3">120-128 cm</td>
                      <td className="px-4 py-3">100-108 cm</td>
                      <td className="px-4 py-3">67 cm</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">XXL</td>
                      <td className="px-4 py-3">128-136 cm</td>
                      <td className="px-4 py-3">108-116 cm</td>
                      <td className="px-4 py-3">69 cm</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">3XL</td>
                      <td className="px-4 py-3">136-144 cm</td>
                      <td className="px-4 py-3">116-124 cm</td>
                      <td className="px-4 py-3">71 cm</td>
                    </tr>
                  </tbody>
                </table>
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
                question="Czy ochraniacze są certyfikowane CE?"
                answer="Tak, wszystkie ochraniacze (barki, łokcie, plecy) posiadają certyfikat CE poziom 1, co gwarantuje najwyższy standard bezpieczeństwa zgodny z normami europejskimi."
              />
              <FAQ
                question="Jak działa membrana wodoodporna?"
                answer="Membrana jest w 100% wodoodporna i jednocześnie oddychająca. Zapobiega przedostawaniu się wody z zewnątrz, a jednocześnie odprowadza wilgoć z wnętrza kurtki."
              />
              <FAQ
                question="Czy można regulować wentylację?"
                answer="Tak, kurtka posiada otwory wentylacyjne pod pachami i na plecach z zamkami YKK. Możesz je otwierać i zamykać w zależności od warunków pogodowych."
              />
              <FAQ
                question="Jak wybrać odpowiedni rozmiar?"
                answer="Skorzystaj z naszej tabeli rozmiarów. Zmierz obwód klatki piersiowej i talii, a następnie dopasuj do tabeli. W razie wątpliwości wybierz większy rozmiar."
              />
              <FAQ
                question="Jak pielęgnować kurtkę?"
                answer="Kurtkę można prać w pralce w temp. 30°C z delikatnym detergentem. Nie używaj płynu do płukania ani wybielacza. Suszyć w pozycji wiszącej."
              />
              <FAQ
                question="Jakie są czasy dostawy?"
                answer="Standardowa dostawa w Polsce trwa 3-4 dni robocze. Wysyłka następuje w ciągu 24-48h od złożenia zamówienia."
              />
              <FAQ
                question="Czy są zwroty i gwarancja?"
                answer="Oferujemy 30-dniową gwarancję zwrotu pieniędzy oraz 24-miesięczną gwarancję producenta na wszystkie wady fabryczne."
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
                Opinie klientów o kurtce SportArmor™ Pro
              </h2>
              <p className="text-lg text-gray-700">
                Autentyczne i wiarygodne opinie motocyklistów
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "Kamil K. - Kraków",
                  rating: 5,
                  review: "Jeżdżę od 3 lat na różnych kurtkach, ale RoadShield to prawdziwa rewolucja! 🛡️ Ochraniacze CE dają pełne bezpieczeństwo, a membrana wodoodporna trzyma sucho nawet w największy deszcz. Polecam każdemu motocykliście!"
                },
                {
                  name: "Ania M. - Warszawa",
                  rating: 5,
                  review: "Wreszcie kurtka na każdą pogodę! 🌦️ Latem otwieramy wentylacje i jest komfortowo, zimą wkładamy podszewkę termo i ciepło. Świetna jakość materiałów i wykonania. Najlepsza inwestycja w bezpieczeństwo!"
                },
                {
                  name: "Marek P. - Wrocław",
                  rating: 5,
                  review: "System wentylacji to strzał w dziesiątkę! 🌬️ Latem, gdy jest upał, otwieram wszystkie otwory i czuję się komfortowo. Odblaski świetnie widać w nocy - bezpieczeństwo na najwyższym poziomie."
                },
                {
                  name: "Kasia L. - Gdańsk",
                  rating: 5,
                  review: "Wodoodporność na poziomie! 💧 Jeździłam w ulewnym deszczu i zostałam kompletnie sucha. Membrana oddycha, więc nie pocę się. Idealna kurtka dla każdego motocyklisty, niezależnie od doświadczenia."
                },
                {
                  name: "Tomek S. - Poznań",
                  rating: 5,
                  review: "Podszewka termo to strzał w dziesiątkę! 🔥 Zimą z nią jest ciepło, latem bez niej jest chłodno. Jedna kurtka na cały rok - to się nazywa praktyczność! Jakość materiałów rewelacyjna."
                },
                {
                  name: "Ewelina K. - Łódź",
                  rating: 5,
                  review: "Odblaski świetnie widać w nocy! ✨ Bezpieczeństwo to podstawa, a ta kurtka ma odblaski na ramionach, plecach i mankietach. Czuję się bezpiecznie jeżdżąc po zmroku. Bardzo polecam!"
                },
                {
                  name: "Paweł J. - Katowice",
                  rating: 5,
                  review: "Materiał 600D/900D jest bardzo trwały! 💪 Używam kurtki od roku, jeżdżę codziennie i nie ma żadnych śladów zużycia. Zamki YKK działają płynnie, ochraniacze świetnie się trzymają."
                },
                {
                  name: "Magda R. - Lublin",
                  rating: 4,
                  review: "Idealnie dopasowana, rozmiar M jak ulał! 📏 Tabela rozmiarów bardzo precyzyjna. Kurtka nie ogranicza ruchów, można swobodnie jeździć. Jedyny minus - mogłaby mieć więcej kieszeni. Poza tym super!"
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
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=70&h=70&fit=crop&crop=face"
                  alt="Rafał D."
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <StarRating rating={5} />
                    <span className="font-medium">Rafał D. - Szczecin</span>
                    <span className="text-sm text-gray-600">Zweryfikowany Kupujący</span>
                  </div>
                  <p className="text-gray-700">
                    "Fantastyczna kurtka RoadShield 4-Seasons! 🏍️ Ochraniacze CE poziom 1 to prawdziwa ochrona - sprawdziłem już kilka razy w praktyce. Membrana wodoodporna trzyma sucho w każdych warunkach, a system wentylacji ratuje latem. Podszewka termo świetnie sprawdza się zimą. To nie jest zwykła kurtka - to profesjonalny sprzęt dla każdego motocyklisty. Najlepsza kurtka jaką miałem!"
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
                Wypróbuj kurtkę SportArmor™ Pro z całkowitym bezpieczeństwem dzięki naszej 30-dniowej gwarancji zwrotu pieniędzy. Doświadcz bezpieczeństwa i komfortu jazdy bez ryzyka.
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
              Tylko na dziś: <span className="line-through opacity-75">747,50 zł</span> <span className="text-5xl font-bold">299 zł</span>
            </p>

            <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-bold">1,847+</div>
                  <div className="text-sm opacity-90">Zadowolonych Motocyklistów</div>
                </div>
                <div>
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-bold">99.2%</div>
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
                    src={COLOR_IMAGE_MAP[color]}
                    alt={`Wybrany kolor: ${color}`}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm md:text-base">🏍️ SportArmor™ Pro – Kurtka Motocyklowa CE</div>
                    <div className="text-xs md:text-sm text-gray-600">Wodoodporna, Oddychająca, Ochraniacze CE</div>
                    <div className="text-xs md:text-sm text-green-600">✅ Darmowa dostawa</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg md:text-xl text-gray-900">299 zł</div>
                    <div className="text-xs text-gray-500 line-through">747,50 zł</div>
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

                {/* Hidden inputs for external selection sync */}
                <input type="hidden" name="color" value={color} />
                <input type="hidden" name="size" value={size} />
                <input type="hidden" name="color_image" value={COLOR_IMAGE_MAP[color]} />

                {/* Order Summary - Selected Variants */}
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111',
                    marginBottom: '6px'
                  }}>
                    Twój wybór:
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <img
                      src={COLOR_IMAGE_MAP[color]}
                      alt={`Kurtka - ${color}`}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #E5E7EB'
                      }}
                    />
                    <div style={{
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <strong>{color}</strong>, <strong>Rozmiar {size}</strong>
                    </div>
                  </div>
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
                {isSubmitting ? 'PRZETWARZANIE...' : 'POTWIERDŹ ZAMÓWIENIE - 299 zł'}
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
    </>
  );
}
