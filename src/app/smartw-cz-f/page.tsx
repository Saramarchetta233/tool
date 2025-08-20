'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,    // ← AGGIUNGI
  ChevronRight,  // ← AGGIUNGI
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
          hashedFirstName = userFormData.jmeno ? await trackingUtils.hashData(userFormData.jmeno.split(' ')[0]) : null;
          hashedLastName = userFormData.jmeno && userFormData.jmeno.split(' ').length > 1 ? await trackingUtils.hashData(userFormData.jmeno.split(' ').slice(1).join(' ')) : null;
        }

        // Prepara i dati per N8N
        // Calcola timestamp corretto (non più di 7 giorni fa, non nel futuro)
        const now = Math.floor(Date.now() / 1000);
        const maxPastTime = now - (7 * 24 * 60 * 60); // 7 giorni fa
        const eventTimestamp = Math.max(maxPastTime, now - 10); // Massimo 10 secondi fa

        const capiData = {
          event_name: 'Purchase', // o eventName per la landing
          event_id: clientEventId,
          timestamp: eventTimestamp, // <-- TIMESTAMP CORRETTO
          event_source_url: window.location.href,

          // AGGIUNGI ANCHE QUESTO
          action_source: 'website',
          event_time: eventTimestamp,

          // Token e Pixel ID dinamici
          token: 'EAAPYtpMdWREBPJH0W7LzwU2MuZA61clyQOfYg5C6E0vo9E5QYgJWl2n5XtO8Ur93YTZANcWYz3qsAbDOadffn10KbQZCOwkRS6DpM8bRjwX25NBn5d1lvVNQhFOCGY9eZARrjyCbJs1OtFk2BOc4ZBbaUjeD7dvkejyxZAZAEQdeb8AQzUKdAQitdhU0jVGywZDZD',
          pixel_id: '763716602087140', // Pixel ID dinamico

          // Dati hashati del form (se disponibili)
          telefono_hash: hashedPhone,
          nome_hash: hashedFirstName,
          cognome_hash: hashedLastName,
          indirizzo: userFormData?.adresa || null,

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
          content_name: 'Neničitelný Smartwatch',
          content_category: 'Electronics',
          content_ids: 'smartwatch-indestructible',
          content_type: 'product',
          value: eventData.value || 1249.00,
          currency: 'CZK', // Currency dinamica
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
    { name: "Jan z Prahy", action: "právě koupil", time: "před 2 minutami" },
    { name: "Petr z Brna", action: "přidal do košíku", time: "před 4 minutami" },
    { name: "Pavel z Ostravy", action: "právě koupil", time: "před 6 minutami" },
    { name: "Adam z Plzně", action: "právě prohlíží", time: "před 1 minutou" },
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
  const [stock, setStock] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setStock(prev => {
        const change = Math.random() > 0.7 ? -1 : 0;
        return Math.max(4, prev + change);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 p-3 rounded-lg text-center font-bold">
      <div className="flex items-center justify-center space-x-2">
        <AlertCircle className="w-5 h-5" />
        <span>⚡ Pouze {stock} kusů zůstává na skladě!</span>
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
      const giorni = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
      const mesi = ['led', 'úno', 'bře', 'dub', 'kvě', 'čer', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];
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
        if (giorno !== 0 && giorno !== 6) count++; // 0 = neděle, 6 = sobota
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
      deliveryRange: `${formatData(dataConsegnaInizio)} až ${formatData(dataConsegnaFine)}`
    });
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-center text-gray-700 mb-4">
        Objednejte <strong>NYNÍ</strong> a obdržíte balíček mezi <strong>{deliveryDates.deliveryRange}</strong>
      </p>
      <div className="flex justify-between items-center text-sm">
        <div className="text-center flex-1">
          <div className="text-2xl mb-1 text-center">📦</div>
          <div className="font-medium">Objednáno</div>
          <div className="text-gray-500">{deliveryDates.orderDate}</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-2xl mb-1 text-center">🚚</div>
          <div className="font-medium">Odesláno</div>
          <div className="text-gray-500">{deliveryDates.shipDate}</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-2xl mb-1 text-center">📍</div>
          <div className="font-medium">Doručeno</div>
          <div className="text-gray-500">{deliveryDates.deliveryStart} - {deliveryDates.deliveryEnd}</div>
        </div>
      </div>
    </div>
  );
};

// Product Carousel Component
const ProductCarousel = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const images = [
    '/images/smartw-cz/smartwatch-1.png',
    '/images/smartw-cz/smartwatch-2.jpg',
    '/images/smartw-cz/smartwatch-3.jpg',
    '/images/smartw-cz/smartwatch-4.png',
    '/images/smartw-cz/smartwatch-5.png'
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
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
          -60% LEVNĚJI
        </div>

        {/* Immagini */}
        <div className="relative min-h-[300px] max-h-[600px]">
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Neničitelný Smartwatch - Pohled ${index + 1}`}
              className={`w-full h-auto max-h-[600px] object-contain mx-auto transition-opacity duration-500 ${index === currentImage ? 'opacity-100' : 'opacity-0'
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
              alt={`Náhled ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};


const AutoplayVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Forza l'autoplay su mobile
      video.play().catch((error: any) => {
        console.log('Autoplay selhalo:', error);
      });
    }
  }, []);

  return (
    <div className="relative rounded-lg shadow-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-auto"
        autoPlay
        muted
        loop
        playsInline // Importante per iOS
        preload="auto"
        style={{
          maxHeight: '500px',
          objectFit: 'cover'
        }}
      >
        {/* Sostituisci con il tuo video */}
        <source src="/video/smartwatch-demo.mp4" type="video/mp4" />
        <source src="/video/smartwatch-demo.webm" type="video/webm" />

        {/* Fallback per browser che non supportano video */}
        <img
          src="/images/smartw-cz/smartwatch-1.png"
          alt="Smartwatch v akci - Záložní obrázek"
          className="w-full h-auto"
        />
      </video>

      {/* Overlay opzionale */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
        📹 Smartwatch v Akci
      </div>
    </div>
  );
};

// Main Component
export default function SmartwatchLanding() {
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [reservationTimer, setReservationTimer] = useState({ minutes: 5, seconds: 0 });
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [bounceAnimation, setBounceAnimation] = useState(false);
  const [formData, setFormData] = useState({
    jmeno: '',
    telefon: '',
    adresa: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    jmeno: '',
    telefon: '',
    adresa: ''
  });

  // Initialize tracking on component mount
  useEffect(() => {
    // AGGIUNGI QUESTA LINEA QUI
    trackingUtils.setFbClickId();
    // Initialize tracking systems
    trackingUtils.initGoogleAds();
    trackingUtils.initGoogleAnalytics();

    // Track PageView for all platforms
    trackingUtils.trackGoogleEvent('page_view', {
      page_title: 'Neničitelný Smartwatch - Hlavní stránka',
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
      content_ids: ['smartwatch-indestructible'],
      content_name: 'Neničitelný Smartwatch',
      value: 1249.00,
      currency: 'CZK',
      num_items: 1
    });

    trackingUtils.trackGoogleEvent('view_item', {
      currency: 'CZK',
      value: 1249.00,
      items: [{
        item_id: 'smartwatch-indestructible',
        item_name: 'Neničitelný Smartwatch',
        category: 'Electronics',
        quantity: 1,
        price: 1249.00
      }]
    });

    setShowOrderPopup(true);
    setReservationTimer({ minutes: 5, seconds: 0 });
    setFormErrors({ jmeno: '', telefon: '', adresa: '' });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = { jmeno: '', telefon: '', adresa: '' };
    let isValid = true;

    if (!formData.jmeno.trim()) {
      errors.jmeno = 'Jméno a příjmení je povinné';
      isValid = false;
    } else if (formData.jmeno.trim().length < 2) {
      errors.jmeno = 'Jméno musí obsahovat nejméně 2 znaky';
      isValid = false;
    }

    if (!formData.telefon.trim()) {
      errors.telefon = 'Telefonní číslo je povinné';
      isValid = false;
    } else {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
      if (!phoneRegex.test(formData.telefon.trim())) {
        errors.telefon = 'Zadejte platné telefonní číslo';
        isValid = false;
      }
    }

    if (!formData.adresa.trim()) {
      errors.adresa = 'Adresa je povinná';
      isValid = false;
    } else if (formData.adresa.trim().length < 10) {
      errors.adresa = 'Zadejte úplnou adresu (ulice, město, PSČ)';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      console.log('🎯 Purchase initiated - tracking Purchase event');

      // Track Purchase event for Facebook
      await trackingUtils.trackFacebookEvent('Purchase', {
        content_type: 'product',
        content_ids: ['smartwatch-indestructible'],
        content_name: 'Neničitelný Smartwatch',
        value: 1249.00,
        currency: 'CZK',
        num_items: 1
      }, formData);

      // Track for Google Ads
      trackingUtils.trackGoogleEvent('purchase', {
        transaction_id: `cz-${Date.now()}`,
        value: 1249.00,
        currency: 'CZK',
        items: [{
          item_id: 'smartwatch-indestructible',
          item_name: 'Neničitelný Smartwatch',
          category: 'Electronics',
          quantity: 1,
          price: 1249.00
        }]
      });

      console.log('📋 Submitting order:', formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirect to thank you page
      window.location.href = '/ty-cz-smartw';

    } catch (error) {
      console.error('❌ Order submission error:', error);
      alert('Chyba při odesílání objednávky. Zkuste to prosím znovu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <input type="hidden" name="tmfp" />


      <div className="bg-red-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center space-x-4 text-sm font-medium">
          <span>🔥 OMEZENÁ NABÍDKA - Dnes pouze se slevou 60%!</span>
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
                <span className="text-yellow-600 font-medium">4.8</span>
                <span className="text-gray-600">(1,247 recenzí)</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                ⌚ Neničitelný Smartwatch
              </h1>

              <p className="text-lg text-gray-700 font-medium">
                <strong>Hodinky, které přežijí všechno. Odolné proti vodě, nárazům a extrémním podmínkám. Vojenský styl pro skutečné bojovníky.</strong>
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">📞 <strong>Přijímejte hovory</strong> – Vestavěný reproduktor - mluvte bez telefonu</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🛰️ <strong>Vojenský GPS</strong> – Přesnost na úrovni 3 metrů - nikdy se neztratíte</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">🏃 <strong>100+ sportovních režimů</strong> – Každá aktivita přesně monitorována</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">📱 <strong>Všechny chytré funkce</strong> – Hovory, SMS, GPS, fitness</span>
                </div>
              </div>

              {/* NOVÝ BOX OFERTY */}
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
                  ⌚ Neničitelný Smartwatch – Vojenský, Vodotěsný, Neprůstřelný
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
                  <span style={{ flex: '1 1 70%' }}>💧 Vodotěsnost IP68: Plavání, potápění, extrémní podmínky</span>
                  <span style={{
                    color: 'red',
                    textDecoration: 'line-through',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>3 122,50 Kč</span>
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
                  <span style={{ flex: '1 1 70%' }}>🛡️ Pancířový design: Vydrží všechno, co na něj hodíte</span>
                  <span style={{
                    color: '#16a34a',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>✔ V sadě</span>
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
                  <span style={{ flex: '1 1 70%' }}>🔋 Baterie na 30 dní: Jedno nabití na celý měsíc</span>
                  <span style={{
                    color: '#16a34a',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>✔ V sadě</span>
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
                  <span style={{ flex: '1 1 70%' }}>📱 Chytré funkce: GPS, krokoměr, pulsometr, notifikace</span>
                  <span style={{
                    color: '#16a34a',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>✔ V sadě</span>
                </div>

                <div style={{
                  background: '#ecfdf5',
                  borderLeft: '4px solid #10b981',
                  padding: '10px 12px',
                  margin: '10px 0',
                  fontSize: '15px'
                }}>
                  🚚 <strong>Doručení zdarma</strong> po celé České republice (doručení za 3-4 pracovní dny)
                </div>

                <div style={{
                  background: '#ecfdf5',
                  borderLeft: '4px solid #10b981',
                  padding: '10px 12px',
                  margin: '10px 0',
                  fontSize: '15px'
                }}>
                  💶 <strong>Platba na dobírku</strong> k dispozici
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
                  Katalogová cena: <span style={{ textDecoration: 'line-through', color: 'red' }}>3 122,50 Kč</span><br />
                  <div style={{ marginTop: '10px' }}>
                    Dnes pouze: <span style={{ fontSize: '26px' }}>1 249,00 Kč</span>
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
                  ⏳ <strong>Nabídka platí pouze několik dní!</strong><br />
                  Využijte ji předtím, než se vrátí na plnou cenu.
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
                  ⚡ Poslední kusy k dispozici na skladě
                </div>

                <p style={{ textAlign: 'center', fontSize: '14px', color: '#555' }}>
                  📦 Odeslání za 24/48h – Doručení garantováno za 3-4 dny
                </p>
              </div>

              <button
                onClick={handleOrderClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg animate-pulse-button"
              >
                🔥 OBJEDNAT NYNÍ - Platba na Dobírku
              </button>

              <DeliveryTracking />

              {/* Recensione evidenziata */}
              <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                {/* Layout con foto centrata verticalmente rispetto al testo */}
                <div className="flex items-center space-x-4">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                    alt="Jan K."
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />

                  <div className="flex-1">
                    {/* Stelle sopra il testo, allineate a sinistra */}
                    <div className="mb-3">
                      <StarRating rating={5} size="w-4 h-4" />
                    </div>

                    <p className="text-gray-800 text-sm leading-relaxed mb-3">
                      "Tyto hodinky jsou skutečný bojovník! 💪 Spadly mi ze 3 metrů na beton - ani škrábanec! Plavat s nimi, běhám v dešti, pracuji na stavbě. Baterie skutečně vydrží měsíc. Nejlepší nákup v životě!"
                    </p>

                    {/* Nome con checkmark blu */}
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">Jan K.</span>
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
                ⚔️ Vytvořeno pro Extrémní Výzvy – Váš Neničitelný Společník!
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                <strong>Neničitelný Smartwatch</strong> byl navržen pro lidi, kteří neznají kompromisy. Ať už jste voják, hasič, dělník nebo extrémní sportovec.
              </p>
              <p className="text-lg text-gray-700">
                S <strong>certifikátem IP68</strong>, <strong>pancířovým krytem</strong> a <strong>baterií na 30 dní</strong>, tyto hodinky přežijí každou misi, kterou před nimi postavíte.
              </p>
            </div>
            <div>
              <AutoplayVideo />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="/images/smartw-cz/smartwatch-2.jpg"
                alt="Vlastnosti smartwatch"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Hlavní vlastnosti
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Vodotěsnost IP68:</strong> Úplná ochrana před vodou do hloubky 50 metrů. Ideální na plavání, potápění a vodní sporty.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Pancířový design:</strong> Odolný kryt z leteckého hliníku a gorilla glass sklo. Vydrží pády z 5 metrů.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Baterie na 30 dní:</strong> Mocná baterie 2000mAh zajišťuje měsíc používání na jedno nabití.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Plné chytré funkce:</strong> GPS, pulsometr, krokoměr, notifikace, hovory, 100+ sportovních režimů.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <strong>Extrémní dosah:</strong> Funguje v teplotách od -40°C do +70°C. Odolné proti prachu, písku a sněhu.
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
              Neničitelný a Funkční
            </h2>
            <p className="text-lg text-gray-700">
              Objevte, jak tyto smartwatch kombinují vojenskou odolnost s moderními chytrými funkcemi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="/images/smartw-cz/smartwatch-3.jpg"
                alt="Smartwatch v akci"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🛡️</div>
                  <h3 className="font-bold text-lg mb-2">Odolnost</h3>
                  <p className="text-gray-600">Pancířový design vydrží každou výzvu.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">💧</div>
                  <h3 className="font-bold text-lg mb-2">Vodotěsnost</h3>
                  <p className="text-gray-600">IP68 - plavání, potápění, déšť.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🔋</div>
                  <h3 className="font-bold text-lg mb-2">Dlouhá Baterie</h3>
                  <p className="text-gray-600">30 dní provozu na jedno nabití.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">📱</div>
                  <h3 className="font-bold text-lg mb-2">Chytré Funkce</h3>
                  <p className="text-gray-600">GPS, fitness, notifikace, hovory.</p>
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
              Co Činí Neničitelný Smartwatch Výjimečným
            </h2>
            <p className="text-lg text-gray-700">
              Na rozdíl od běžných smartwatch náš model kombinuje vojenskou odolnost s moderními funkcemi, zajišťuje spolehlivost za všech podmínek.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 sm:p-8 overflow-x-auto">
            <div className="min-w-full">
              <div className="hidden md:grid md:grid-cols-3 gap-4 text-center mb-4">
                <div></div>
                <div className="font-bold text-lg text-gray-900">Běžné Smartwatch</div>
                <div className="font-bold text-lg text-green-600">Neničitelný Smartwatch</div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg">
                  <div className="font-medium text-gray-900">Odolnost proti vodě</div>
                  <div className="text-center text-red-600">❌ Základní (sprška)</div>
                  <div className="text-center text-green-600">✅ IP68 (50m hloubka)</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg">
                  <div className="font-medium text-gray-900">Odolnost proti nárazům</div>
                  <div className="text-center text-red-600">❌ Křehké</div>
                  <div className="text-center text-green-600">✅ Vojenský standard</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg">
                  <div className="font-medium text-gray-900">Výdrž baterie</div>
                  <div className="text-center text-red-600">❌ 1-2 dny</div>
                  <div className="text-center text-green-600">✅ 30 dní</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg">
                  <div className="font-medium text-gray-900">Operační teplota</div>
                  <div className="text-center text-red-600">❌ 0°C až 40°C</div>
                  <div className="text-center text-green-600">✅ -40°C až +70°C</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg">
                  <div className="font-medium text-gray-900">Cena</div>
                  <div className="text-center text-red-600">3000+ Kč</div>
                  <div className="text-center text-green-600 font-bold">1249 Kč</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Více než 1,247 Spokojených Zákazníků
            </h2>
            <p className="text-lg text-gray-700">
              Zjistěte, proč čeští zákazníci milují Neničitelný Smartwatch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                  alt="Petr M."
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">Petr M.</span>
                  </div>
                  <p className="text-xs text-gray-600">Praha</p>
                </div>
              </div>
              <div className="mb-3">
                <StarRating rating={5} size="w-4 h-4" />
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">
                "Konečně hodinky, které vydrží! Jsem hasič a potřeboval jsem něco opravdu odolného. Po 6 měsících intenzivního používání stále vypadají jako nové. Nejlepší investice!"
              </p>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                  alt="Anna K."
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">Anna K.</span>
                  </div>
                  <p className="text-xs text-gray-600">Brno</p>
                </div>
              </div>
              <div className="mb-3">
                <StarRating rating={5} size="w-4 h-4" />
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">
                "Úžasná výdrž baterie! Nabíjím je jen jednou za měsíc. GPS funguje dokonale při běhání v horách. Design je krásný a funkce jsou úplné. Doporučuji!"
              </p>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                  alt="Martin S."
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">Martin S.</span>
                  </div>
                  <p className="text-xs text-gray-600">Ostrava</p>
                </div>
              </div>
              <div className="mb-3">
                <StarRating rating={5} size="w-4 h-4" />
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">
                "Pracuji na stavbě a potřeboval jsem odolné hodinky. Spadly mi ze 4. patra, ani škrábanec! Voděodolnost je také fantastická. Worth každou korunu!"
              </p>
            </div>

            {/* Review 4 */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                  alt="Marie H."
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">Marie H.</span>
                  </div>
                  <p className="text-xs text-gray-600">Plzeň</p>
                </div>
              </div>
              <div className="mb-3">
                <StarRating rating={5} size="w-4 h-4" />
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">
                "Miluji sportovní funkce! 100+ režimů je úžasné. Sleduje perfektně každé cvičení. Design je elegantní, ale zároveň robustní. Doporučujem všem sportovcům!"
              </p>
            </div>

            {/* Review 5 */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                  alt="Pavel T."
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">Pavel T.</span>
                  </div>
                  <p className="text-xs text-gray-600">České Budějovice</p>
                </div>
              </div>
              <div className="mb-3">
                <StarRating rating={5} size="w-4 h-4" />
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">
                "Jsem vojenský důstojník a potřeboval jsem něco odolného. Tyto hodinky překonaly všechna očekávání. GPS přesnost je neuvěřitelná. Vojenský standard skutečně!"
              </p>
            </div>

            {/* Review 6 */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                  alt="Zuzana L."
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">Zuzana L.</span>
                  </div>
                  <p className="text-xs text-gray-600">Hradec Králové</p>
                </div>
              </div>
              <div className="mb-3">
                <StarRating rating={5} size="w-4 h-4" />
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">
                "Fantastické hodinky! Poměr cena/výkon je neuvěřitelný. Za 1249 Kč dostanete funkce hodinek za 5000+ Kč. Doručení bylo rychlé, doporučuji!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Často Kladené Otázky
            </h2>
            <p className="text-lg text-gray-700">
              Odpovědi na nejčastější otázky o Neničitelném Smartwatch
            </p>
          </div>

          <div className="space-y-4">
            <FAQ
              question="Je Neničitelný Smartwatch skutečně odolný proti vodě?"
              answer="Ano! Má certifikaci IP68, což znamená úplnou ochranu před vodou až do hloubky 50 metrů. Můžete s ním plavat, potápět se nebo pracovat za deště bez obav."
            />
            <FAQ
              question="Jak dlouho vydrží baterie?"
              answer="Naše mocná baterie 2000mAh vydrží až 30 dní při normálním používání. V úsporném režimu může vydržet ještě déle. To je 15x déle než běžné smartwatch!"
            />
            <FAQ
              question="Jsou hodinky kompatibilní s mým telefonem?"
              answer="Ano! Neničitelný Smartwatch je kompatibilní s telefony Android i iPhone. Jednoduše se připojuje přes Bluetooth a funguje s naší bezplatnou aplikací."
            />
            <FAQ
              question="Jaká je záruka na hodinky?"
              answer="Poskytujeme 24měsíční záruku na všechny naše smartwatch. Pokud máte jakýkoli problém, náš zákaznický servis vám pomůže do 24 hodin."
            />
            <FAQ
              question="Jak rychlé je doručení?"
              answer="Odesíláme během 24-48 hodin po objednávce. Doručení po celé České republice trvá 3-4 pracovní dny. Doručení je zcela zdarma!"
            />
            <FAQ
              question="Můžu platit při převzetí?"
              answer="Ano! Nabízíme platbu na dobírku (platba při doručení). Můžete také platit kartou online nebo bankovním převodem."
            />
            <FAQ
              question="Jaké sportovní režimy jsou k dispozici?"
              answer="Máme více než 100 sportovních režimů včetně běhání, cyklistiky, plavání, turistiky, posilování, jógy a mnoha dalších. Všechny vaše aktivity budou přesně sledovány."
            />
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🚚</div>
              <h3 className="font-bold text-sm text-gray-900">Doručení Zdarma</h3>
              <p className="text-xs text-gray-600">Po celé ČR</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🔒</div>
              <h3 className="font-bold text-sm text-gray-900">Bezpečná Platba</h3>
              <p className="text-xs text-gray-600">SSL šifrování</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">↩️</div>
              <h3 className="font-bold text-sm text-gray-900">14 Dní na Vrácení</h3>
              <p className="text-xs text-gray-600">Bez ptaní</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🛡️</div>
              <h3 className="font-bold text-sm text-gray-900">2 Roky Záruka</h3>
              <p className="text-xs text-gray-600">Plná ochrana</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stock Counter */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <StockIndicator />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Získejte Svůj Neničitelný Smartwatch Dnes!
          </h2>
          <p className="text-xl mb-8">
            Pouze <span className="text-yellow-300 font-bold">1 249 Kč</span> místo 3 122,50 Kč - Úspora 60%!
          </p>
          <button
            onClick={handleOrderClick}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
          >
            🔥 OBJEDNAT NYNÍ SE SLEVOU 60%
          </button>
          <p className="text-sm mt-4 opacity-90">
            ⏰ Omezená nabídka - Pouze několik dní! 📦 Doručení zdarma po celé ČR
          </p>
        </div>
      </section>

      {/* Sticky Bottom Button */}
      {showStickyButton && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleOrderClick}
              className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-200 shadow-lg ${bounceAnimation ? 'animate-bounce' : ''
                }`}
            >
              🔥 OBJEDNAT ZA 1 249 Kč
            </button>
          </div>
        </div>
      )}

      {/* Order Popup */}
      {showOrderPopup && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowOrderPopup(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  🎉 Gratulujeme k Výběru!
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Rezervovali jste si <strong>Neničitelný Smartwatch</strong> za speciální cenu <span className="text-green-600 font-bold">1 249 Kč</span>
                </p>

                {/* Reservation Timer */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-medium mb-2">
                    ⏰ Vaše rezervace vyprší za:
                  </p>
                  <div className="text-3xl font-bold text-red-600">
                    {String(reservationTimer.minutes).padStart(2, '0')}:
                    {String(reservationTimer.seconds).padStart(2, '0')}
                  </div>
                </div>

                {/* Order Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-2">
                      Jméno a příjmení *
                    </label>
                    <input
                      type="text"
                      value={formData.jmeno}
                      onChange={(e) => handleFormChange('jmeno', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.jmeno ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Jan Novák"
                      disabled={isSubmitting}
                    />
                    {formErrors.jmeno && (
                      <p className="text-red-600 text-xs mt-1 text-left">{formErrors.jmeno}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-2">
                      Telefonní číslo *
                    </label>
                    <input
                      type="tel"
                      value={formData.telefon}
                      onChange={(e) => handleFormChange('telefon', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.telefon ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="+420 123 456 789"
                      disabled={isSubmitting}
                    />
                    {formErrors.telefon && (
                      <p className="text-red-600 text-xs mt-1 text-left">{formErrors.telefon}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-2">
                      Adresa pro doručení *
                    </label>
                    <textarea
                      value={formData.adresa}
                      onChange={(e) => handleFormChange('adresa', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.adresa ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Ulice 123, Praha 1, 110 00"
                      disabled={isSubmitting}
                    />
                    {formErrors.adresa && (
                      <p className="text-red-600 text-xs mt-1 text-left">{formErrors.adresa}</p>
                    )}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                    <h4 className="font-bold text-green-900 mb-2">📦 Shrnutí objednávky:</h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>• Neničitelný Smartwatch</p>
                      <p>• Doručení zdarma (3-4 dny)</p>
                      <p>• 2 roky záruky</p>
                      <p>• Platba na dobírku</p>
                      <div className="border-t border-green-200 pt-2 mt-2">
                        <p className="font-bold text-lg">Celkem: 1 249 Kč</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowOrderPopup(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                      disabled={isSubmitting}
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '⏳ Odesílání...' : '✅ Dokončit Objednávku'}
                    </button>
                  </div>
                </form>

                <p className="text-xs text-gray-500 mt-4">
                  Odesláním objednávky souhlasíte s našimi obchodními podmínkami a zpracováním osobních údajů.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideUp {
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
          animation: slideUp 0.5s ease-out;
        }
        
        @keyframes pulseButton {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        
        .animate-pulse-button {
          animation: pulseButton 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}