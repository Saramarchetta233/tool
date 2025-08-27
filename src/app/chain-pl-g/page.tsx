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
          content_name: 'Titan Pro Saw - Piła Łańcuchowa Profesjonalna z Ostrzem Tytanowym',
          content_category: 'Professional Power Tools',
          content_ids: 'titan-pro-saw-titanium',
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
              src="/images/Chain/1.png"
              alt="Zadowalające rezultaty"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Przekształć Swoją Pracę z Wyjątkowymi Rezultatami
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
                      strokeDasharray={`${95 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">95%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Stwierdziło, że cięcie stało się szybsze i bardziej precyzyjne!</p>
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
                      strokeDasharray={`${96 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">96%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Zauważyło zwiększenie wydajności w swoich projektach!</p>
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
                      strokeDasharray={`${94 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">94%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Zaoszczędziło czas dzięki długiej żywotności baterii!</p>
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
              Najwyższej jakości narzędzia elektryczne dla każdej pracy.
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

// Main Component
export default function ChainsawLanding() {
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
      page_title: 'Titan Pro Saw - Piła Łańcuchowa Profesjonalna z Ostrzem Tytanowym - Strona Główna',
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
      content_ids: ['titan-pro-saw-titanium'],
      content_name: 'Titan Pro Saw - Piła Łańcuchowa Profesjonalna z Ostrzem Tytanowym',
      value: 299.00,
      currency: 'PLN',
      num_items: 1
    });

    trackingUtils.trackGoogleEvent('view_item', {
      currency: 'PLN',
      value: 299.00,
      items: [{
        item_id: 'titan-pro-saw-titanium',
        item_name: 'Titan Pro Saw - Piła Łańcuchowa Profesjonalna z Ostrzem Tytanowym',
        category: 'Professional Power Tools',
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

    console.log('🎯 Form submitted, tracking Purchase with form data:', formData);

    // 🚨 ESSENTIAL: Track Purchase event con CAPI PRIMA dell'invio API
    // Questo garantisce che i dati arrivino sempre a N8N
    try {
      await trackingUtils.trackFacebookEvent('Purchase', {
        content_type: 'product',
        content_ids: ['titan-pro-saw-titanium'],
        content_name: 'Titan Pro Saw - Piła Łańcuchowa Profesjonalna z Ostrzem Tytanowym',
        value: 299.00,
        currency: 'PLN',
        num_items: 1
      }, formData);
      console.log('✅ Purchase tracking completato con successo');
    } catch (trackingError: unknown) {
      console.error('❌ Purchase tracking fallito, ma continuiamo:', trackingError);
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
        offer: '34',
        lp: '34',
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
        product: 'Titan Pro Saw - Piła Łańcuchowa Profesjonalna z Ostrzem Tytanowym',
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
        const orderId = `MTO${Date.now()}`;

        console.log('✅ Lead successfully sent to Cloudflare Worker:', result);

        const orderData = {
          ...formData,
          orderId,
          product: 'Titan Pro Saw - Piła Łańcuchowa Profesjonalna z Ostrzem Tytanowym',
          price: 299.00,
          apiResponse: result
        };

        localStorage.setItem('orderData', JSON.stringify(orderData));
        console.log('✅ Order data saved to localStorage:', orderData);

        window.location.href = '/ty-chain-pl';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <input type="hidden" name="tmfp" />


      <div className="bg-red-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center space-x-4 text-sm font-medium">
          <span>🔥 OFERTA LIMITOWANA - Sconto -60% solo oggi!</span>
        </div>
      </div>

      <section className="bg-white py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <div className="relative">
                <img
                  src="/images/Chain/1.png"
                  alt="Piła Łańcuchowa Akumulatorowa"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -60% SCONTO
                </div>
              </div>
            </div>

            <div className="order-2 space-y-6">
              <div className="flex items-center space-x-2">
                <StarRating rating={5} size="w-5 h-5" />
                <span className="text-yellow-600 font-medium">4.8</span>
                <span className="text-gray-600">(289 opinii)</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                💎 Titan Pro Saw – Piła Łańcuchowa Profesjonalna
              </h1>

              <p className="text-lg text-gray-700 font-medium">
                <strong>Profesjonalna piła łańcuchowa z 40-cm ostrzem tytanowym i 2 bateriami – najwyższa jakość cięcia dla wymagających specjalistów.</strong>
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🔪 <strong>Ostrze tytanowe 40 cm</strong> – Super wytrzymałe do cięć szybkich i precyzyjnych</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🔋 <strong>2 baterie w zestawie</strong> – Ponad 4 godziny ciągłej pracy</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🛠️ <strong>Pełne wyposażenie</strong> – Łańcuch zapasowy, zestaw konserwacyjny, ładowarka</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🛡️ <strong>System bezpieczeństwa</strong> – Zaawansowana ochrona i design ergonomiczny</span>
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
                  💎 Titan Pro Saw – Piła łańcuchowa z 40-cm ostrzem tytanowym, profesjonalna jakość
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
                  <span style={{ flex: '1 1 70%' }}>💎 Ostrze tytanowe 40 cm, super wytrzymałe + 2 baterie w zestawie</span>
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
                  <span style={{ flex: '1 1 70%' }}>🔋 2 baterie w zestawie: Ponad 4 godziny ciągłej pracy</span>
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
                  <span style={{ flex: '1 1 70%' }}>🛠️ Akcesoria w zestawie: Łańcuch zapasowy, zestaw konserwacyjny</span>
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
                  <span style={{ flex: '1 1 70%' }}>🛡️ Design ergonomiczny: System zabezpieczeń i łatwość użycia</span>
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
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                    alt="Marek T."
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />

                  <div className="flex-1">
                    {/* Stelle sopra il testo, allineate a sinistra */}
                    <div className="mb-3">
                      <StarRating rating={5} size="w-4 h-4" />
                    </div>

                    <p className="text-gray-800 text-sm leading-relaxed mb-3">
                      "Kupiłem Titan Pro Saw miesiąc temu i jestem zachwycony! 💎 Ostrze tytanowe to prawdziwa rewolucja – cięcie jest niesamowicie precyzyjne i szybkie. Dwie baterie pozwalają mi pracować przez cały dzień bez przerwy. Przeciąłem grube gałęzie dębu, deski sosnowe i małe pnie. To najlepsza piła łańcuchowa, jaką miałem!"
                    </p>

                    {/* Nome con checkmark blu */}
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">Marek T. - Kraków</span>
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
                💎 Titan Pro Saw – Profesjonalna Piła Łańcuchowa dla Najbardziej Wymagających Projektów!
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                <strong>Titan Pro Saw z ostrzem tytanowym</strong> to rewolucyjna piła łańcuchowa profesjonalna, zaprojektowana dla specjalistów, którzy wymagają najwyższej jakości cięcia.
              </p>
              <p className="text-lg text-gray-700">
                Ostrze z <strong>tytanu super wytrzymałego</strong> gwarantuje szybkie i precyzyjne cięcie, a <strong>dwie baterie akumulatorowe</strong> zapewniają ponad 4 godziny nieprzerwanej pracy.
              </p>
            </div>
            <div>
              <img
                src="/images/Chain/2.gif"
                alt="Piła łańcuchowa w użyciu"
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
                src="/images/Chain/3.png"
                alt="Cechy piły łańcuchowej"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Cechy Profesjonalne Titan Pro Saw
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Ostrze tytanowe:</strong> Super wytrzymałe ostrze z tytanu do cięć szybkich, precyzyjnych i trwałych.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>2 Baterie w zestawie:</strong> Ponad 4 godziny ciągłej pracy dzięki dwom bateriom akumulatorowym.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Akcesoria w zestawie:</strong> Łańcuch zapasowy, zestaw konserwacyjny, ładowarka szybka w zestawie.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Design ergonomiczny i bezpieczny:</strong> System zaawansowanych zabezpieczeń z ergonomiczną konstrukcją.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Jakość profesjonalna:</strong> Zaprojektowana dla specjalistów wymagających najwyższej jakości i niezawodności.
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
              Ostrze Tytanowe - Cięcia Szybkie i Ultra-Precyzyjne
            </h2>
            <p className="text-lg text-gray-700">
              Odkryj moc ostrza tytanowego Titan Pro Saw - rewolucyjną technologię, która zmienia standard cięcia profesjonalnego.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="/images/Chain/4.png"
                alt="Piła łańcuchowa w akcji"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="font-bold text-lg mb-2">Ostrze Tytanowe</h3>
                  <p className="text-gray-600">Ostrze z tytanu super wytrzymałego do profesjonalnych cięć.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🔋</div>
                  <h3 className="font-bold text-lg mb-2">Długa Praca</h3>
                  <p className="text-gray-600">2 baterie akumulatorowe - ponad 4 godziny ciągłej pracy.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🛡️</div>
                  <h3 className="font-bold text-lg mb-2">Zaawansowana Ochrona</h3>
                  <p className="text-gray-600">System zabezpieczeń profesjonalnych i design ergonomiczny.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🔧</div>
                  <h3 className="font-bold text-lg mb-2">Pełne Wyposażenie</h3>
                  <p className="text-gray-600">Łańcuch zapasowy, zestaw konserwacyjny, ładowarka szybka.</p>
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
              Co Czyni Titan Pro Saw Piłą Łańcuchową Profesjonalną #1
            </h2>
            <p className="text-lg text-gray-700">
              W przeciwieństwie do zwykłych pił łańcuchowych, Titan Pro Saw oferuje ostrze tytanowe, 2 baterie akumulatorowe i pełne wyposażenie profesjonalne.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 sm:p-8 overflow-x-auto">
            <div className="min-w-full">
              <div className="hidden md:grid md:grid-cols-3 gap-4 text-center mb-4">
                <div></div>
                <div className="font-bold text-lg">Titan Pro Saw</div>
                <div className="font-bold text-lg">Inne</div>
              </div>

              {[
                'Ostrze tytanowe super wytrzymałe',
                '2 baterie akumulatorowe w zestawie',
                'Design ergonomiczny i bezpieczny',
                'Pełne wyposażenie profesjonalne',
                'Jakość i gwarancja profesjonalna'
              ].map((feature, index) => (
                <div key={index} className="border-b border-gray-200 py-4">
                  <div className="md:hidden">
                    <div className="font-medium text-lg mb-3">{feature}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="font-medium text-green-600 mb-1">Titan Pro Saw</div>
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
              question="Jak długo działają baterie?"
              answer="Dwie baterie litowo-jonowe zapewniają do 4 godzin nieprzerwanycj pracy w normalnych warunkach."
            />
            <FAQ
              question="Jakie akcesoria są w zestawie?"
              answer="Zawiera ładowarkę, instrukcję obsługi, futerał ochronny, zapasowy łańcuch i narzędzia do konserwacji."
            />
            <FAQ
              question="Czy nadaje się do ciężkich prac?"
              answer="Tak, dzięki potężnemu silnikowi bezprzewodowemu radzi sobie z gałęziami, deskami i małymi pniami."
            />
            <FAQ
              question="Jak działa system bezpieczeństwa?"
              answer="Piła łańcuchowa posiada blokadę przeciw przypadkowemu uruchomieniu i dodatkowe zabezpieczenia dla maksymalnego bezpieczeństwa."
            />
            <FAQ
              question="Czy piła łańcuchowa jest łatwa w użyciu?"
              answer="Absolutnie, dzięki ergonomicznej konstrukcji i lekkiej wadze jest wygodna nawet podczas długotrwałej pracy."
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <StarRating rating={5} size="w-6 h-6" />
              <span className="text-2xl font-bold">4.8/5</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Opinie klientów o pile łańcuchowej
            </h2>
            <p className="text-lg text-gray-700">
              Autentyczne i wiarygodne opinie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Piotr K. - Warszawa",
                rating: 5,
                review: "Titan Pro Saw to prawdziwa rewolucja! 💎 Ostrze tytanowe tnie jak masło - przeciąłem grube gałęzie dębu bez wysiłku. 2 baterie pozwalają pracować cały dzień. Najlepsza inwestycja tego roku!"
              },
              {
                name: "Anna M. - Gdańsk",
                rating: 5,
                review: "Jako kobieta obawiałam się, czy dam radę, ale Titan Pro Saw jest lekka i bardzo bezpieczna! Ostrze tytanowe to przyszłość - cięcie jest błyskawiczne i precyzyjne."
              },
              {
                name: "Tomasz S. - Katowice",
                rating: 5,
                review: "Profesjonalne wykonanie! Ostrze tytanowe jest niesamowicie ostre i wytrzymałe. Po 3 miesiącach intensywnej pracy nadal cięcie jak nowe. Warto każdej złotówki!"
              },
              {
                name: "Marek F. - Poznań",
                rating: 5,
                review: "Remont całego ogrodu zrobiłem w połowie czasu! System zabezpieczeń działa perfekcyjnie, a ergonomia na najwyższym poziomie. Polecam!"
              },
              {
                name: "Jakub J. - Lublin",
                rating: 5,
                review: "Obsługa klienta na 5+! Pomogli mi wybrać odpowiednie akcesoria. Titan Pro Saw spełnia wszystkie moje oczekiwania profesjonalne."
              },
              {
                name: "Robert K. - Wrocław",
                rating: 5,
                review: "Jako stolarz potrzebuję najlepszych narzędzi. Ostrze tytanowe Titan Pro Saw to przyszłość - precyzja cięcia na poziomie profesjonalnym!"
              },
              {
                name: "Paweł N. - Łódź",
                rating: 4,
                review: "Solidne wykonanie! Przeciąłem konary, deski bukowe i małe pnie sosny. Jedynym minusem jest że inni sąsiedzi też chcą pożyczyć! 😄"
              },
              {
                name: "Krzysztof P. - Szczecin",
                rating: 5,
                review: "To nie jest zwykła piła łańcuchowa - to profesjonalne narzędzie! Ostrze tytanowe i 2 baterie to kombinacja idealna dla każdego projektu."
              },
              {
                name: "Marcin H. - Białystok",
                rating: 5,
                review: "Używam już 6 miesięcy i nadal jestem zachwycony! Ostrze tytanowe ciągle ostre, a baterie wytrzymują naprawdę długo. Najlepszy zakup!"
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
                alt="Krzysztof M."
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <StarRating rating={5} />
                  <span className="font-medium">Krzysztof M. - Rzeszów</span>
                  <span className="text-sm text-gray-600">Zweryfikowany Kupujący</span>
                </div>
                <p className="text-gray-700">
                  "Świetny Titan Pro Saw! 💎 Ostrze tytanowe to prawdziwa przyszłość - cięcie jest niesamowicie precyzyjne i błyskawiczne! Przeciąłem gałęzie świerku, deski dębowe i drewno opałowe bez wysiłku. 2 baterie to ogromna wygoda - pracuję cały dzień bez przerw. Najlepsza piła łańcuchowa profesjonalna na rynku!"
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
              Wypróbuj piłę łańcuchową z całkowitym bezpieczeństwem dzięki naszej 30-dniowej gwarancji zwrotu pieniędzy. Doświadcz mocy i wygody bezprzewodowego cięcia bez ryzyka i odkryj, jak może przekształcić Twoją pracę.
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
                <div className="font-bold">1,847+</div>
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
                  src="/images/Chain/1.png"
                  alt="Piła łańcuchowa"
                  className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm md:text-base">💎 Titan Pro Saw – Piła Łańcuchowa Profesjonalna</div>
                  <div className="text-xs md:text-sm text-gray-600">Potężna, Bezprzewodowa, Gotowa do Pracy</div>
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