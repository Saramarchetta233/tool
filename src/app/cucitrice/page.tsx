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
      window.gtag('config', 'AW-17086993346');

      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17086993346';
      document.head.appendChild(script);
    }
  },

  // Track Facebook events with CAPI fallback
  trackFacebookEvent: async (eventName: string, eventData: any = {}): Promise<void> => {
    const clientEventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Client-side tracking
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

    // Server-side CAPI tracking
    try {
      const capiData = {
        data: [{
          event_name: eventName.toLowerCase(),
          event_time: Math.floor(Date.now() / 1000),
          event_id: clientEventId,
          action_source: 'website',
          event_source_url: window.location.href,
          user_data: {
            client_ip_address: await trackingUtils.getClientIP(),
            client_user_agent: navigator.userAgent,
            fbc: trackingUtils.getFbClickId(),
            fbp: trackingUtils.getFbBrowserId()
          },
          custom_data: {
            currency: 'EUR',
            value: eventData.value || 62.98,
            content_name: eventData.content_name || 'Macchina da Cucire Creativa',
            content_type: eventData.content_type || 'product',
            content_ids: eventData.content_ids || ['sewing-machine-creative']
          }
        }],
        test_event_code: 'TEST20028',
        access_token: 'EAAPYtpMdWREBOLjUOn7SdNOjxDb1RlZBVTfkvNCskiNhzm3hYAdfMFZBz34Xd13aF10XFnkAM1GicYwZAfszCO9gL3oWAdJtZCvTHIKeCuZBU3z8lp4I1w35hhDLZCd4xGONZA7ZAAdptDiNcc8g08enSnVZBfiHmQaZC3R0WnnKak8dIVvN76QCpnZBXCAOYShxQZDZD'
      };

      const response = await fetch(`https://graph.facebook.com/v18.0/763716602087140/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(capiData)
      });

      if (response.ok) {
        console.log(`✅ Facebook ${eventName} tracked (CAPI)`);
      } else {
        throw new Error(`CAPI request failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Facebook ${eventName} CAPI tracking error:`, error);
    }
  },

  // Track Google Ads events
  trackGoogleEvent: (eventName: string, eventData: any = {}): void => {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        if (eventName === 'Purchase') {
          window.gtag('event', 'conversion', {
            send_to: 'AW-17086993346/DJt3CMrUrPsaEMKn29M_',
            value: eventData.value || 62.98,
            currency: 'EUR',
            transaction_id: eventData.transaction_id || `MCU${Date.now()}`
          });
        } else {
          window.gtag('event', eventName, eventData);
        }
        console.log(`✅ Google Ads ${eventName} tracked`);
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
    return urlParams.get('fbclid') || '';
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
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center space-x-2 text-red-600 font-bold text-lg">
      <Clock className="w-5 h-5" />
      <span>
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
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

  const notifications = [
    { name: "Maria da Milano", action: "ha appena acquistato", time: "2 minuti fa" },
    { name: "Anna da Roma", action: "ha aggiunto al carrello", time: "4 minuti fa" },
    { name: "Lucia da Napoli", action: "ha appena acquistato", time: "6 minuti fa" },
    { name: "Sara da Torino", action: "sta visualizzando", time: "1 minuto fa" },
  ];

  useEffect(() => {
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
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-up">
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
        <span>⚡ Solo {stock} pezzi rimasti in magazzino!</span>
      </div>
    </div>
  );
};

// Main Component
export default function SewingMachineLanding() {
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [reservationTimer, setReservationTimer] = useState({ minutes: 5, seconds: 0 });
  const [formData, setFormData] = useState({
    nome: '',
    telefono: '',
    indirizzo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    nome: '',
    telefono: '',
    indirizzo: ''
  });

  // Initialize tracking on component mount
  useEffect(() => {
    // Initialize tracking systems
    trackingUtils.initFacebookPixel();
    trackingUtils.initGoogleAds();

    // Track PageView for both platforms
    trackingUtils.trackFacebookEvent('PageView');
    trackingUtils.trackGoogleEvent('page_view', {
      page_title: 'Macchina da Cucire Creativa - Landing Page',
      page_location: window.location.href
    });

    // Load fingerprinting script
    const script = document.createElement('script');
    script.src = 'https://offers.supertrendaffiliateprogram.com/forms/tmfp/';
    script.crossOrigin = 'anonymous';
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script might already be removed
      }
    };
  }, []);

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
    // Track ViewContent event
    trackingUtils.trackFacebookEvent('ViewContent', {
      content_type: 'product',
      content_ids: ['sewing-machine-creative'],
      content_name: 'Macchina da Cucire Creativa',
      value: 62.98,
      currency: 'EUR'
    });

    trackingUtils.trackGoogleEvent('view_item', {
      currency: 'EUR',
      value: 62.98,
      items: [{
        item_id: 'sewing-machine-creative',
        item_name: 'Macchina da Cucire Creativa',
        category: 'Sewing Machines',
        quantity: 1,
        price: 62.98
      }]
    });

    setShowOrderPopup(true);
    setReservationTimer({ minutes: 5, seconds: 0 });
    setFormErrors({ nome: '', telefono: '', indirizzo: '' });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = { nome: '', telefono: '', indirizzo: '' };
    let isValid = true;

    if (!formData.nome.trim()) {
      errors.nome = 'Il nome è obbligatorio';
      isValid = false;
    } else if (formData.nome.trim().length < 2) {
      errors.nome = 'Il nome deve contenere almeno 2 caratteri';
      isValid = false;
    }

    if (!formData.telefono.trim()) {
      errors.telefono = 'Il numero di telefono è obbligatorio';
      isValid = false;
    } else {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
      if (!phoneRegex.test(formData.telefono.trim())) {
        errors.telefono = 'Inserisci un numero di telefono valido';
        isValid = false;
      }
    }

    if (!formData.indirizzo.trim()) {
      errors.indirizzo = 'L\'indirizzo è obbligatorio';
      isValid = false;
    } else if (formData.indirizzo.trim().length < 10) {
      errors.indirizzo = 'L\'indirizzo deve essere più dettagliato (via, numero, città, CAP)';
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

    // Track InitiateCheckout event
    trackingUtils.trackFacebookEvent('InitiateCheckout', {
      content_type: 'product',
      content_ids: ['sewing-machine-creative'],
      content_name: 'Macchina da Cucire Creativa',
      value: 62.98,
      currency: 'EUR',
      num_items: 1
    });

    trackingUtils.trackGoogleEvent('begin_checkout', {
      currency: 'EUR',
      value: 62.98,
      items: [{
        item_id: 'sewing-machine-creative',
        item_name: 'Macchina da Cucire Creativa',
        category: 'Sewing Machines',
        quantity: 1,
        price: 62.98
      }]
    });

    try {
      const apiFormData = new FormData();

      apiFormData.append('uid', '01980825-ae5a-7aca-8796-640a3c5ee3da');
      apiFormData.append('key', 'ad79469b31b0058f6ea72c');
      apiFormData.append('offer', '236');
      apiFormData.append('lp', '236');
      apiFormData.append('name', formData.nome.trim());
      apiFormData.append('tel', formData.telefono.trim());
      apiFormData.append('street-address', formData.indirizzo.trim());

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
        const orderId = `MCU${Date.now()}`;

        // Track Purchase events
        trackingUtils.trackFacebookEvent('Purchase', {
          content_type: 'product',
          content_ids: ['sewing-machine-creative'],
          content_name: 'Macchina da Cucire Creativa',
          value: 62.98,
          currency: 'EUR',
          num_items: 1
        });

        trackingUtils.trackGoogleEvent('Purchase', {
          value: 62.98,
          currency: 'EUR',
          transaction_id: orderId,
          items: [{
            item_id: 'sewing-machine-creative',
            item_name: 'Macchina da Cucire Creativa',
            category: 'Sewing Machines',
            quantity: 1,
            price: 62.98
          }]
        });

        const orderData = {
          ...formData,
          orderId,
          product: 'Macchina da Cucire Creativa',
          price: 62.98,
          apiResponse: responseData
        };

        localStorage.setItem('orderData', JSON.stringify(orderData));
        window.location.href = '/ty-cucitrice';
      } else {
        console.error('API Error:', response.status, response.statusText);
        alert('Si è verificato un errore durante l\'invio dell\'ordine. Riprova più tardi.');
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Si è verificato un errore di connessione. Controlla la tua connessione internet e riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <input type="hidden" name="tmfp" />

      <SocialProofNotification />

      <div className="bg-red-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center space-x-4 text-sm font-medium">
          <span>🔥 OFFERTA LIMITATA - Scade tra:</span>
          <CountdownTimer />
        </div>
      </div>

      <section className="bg-white py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <div className="relative">
                <img
                  src="https://cosedicase.com/cdn/shop/files/12_7c7dad15-e9f3-458a-a4b4-4ee69d6424dc.jpg?v=1749044582&width=1000"
                  alt="Macchina da Cucire Creativa"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -52% OFF
                </div>
              </div>
            </div>

            <div className="order-2 space-y-6">
              <div className="flex items-center space-x-2">
                <StarRating rating={5} size="w-5 h-5" />
                <span className="text-yellow-600 font-medium">4.9</span>
                <span className="text-gray-600">(347 recensioni)</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                🧵 Macchina da Cucire Creativa – Compatta, Potente, Facilissima da Usare
              </h1>

              <p className="text-lg text-gray-700 font-medium">
                <strong>Facilita il cucito con opzioni automatiche e risultati precisi per progetti creativi.</strong>
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>🎯 <strong>Migliora precisione</strong> – Cuciture complesse senza errori</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>🎨 <strong>Aumenta creatività</strong> – Dai vita a progetti divertenti</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>⏱️ <strong>Riduce tempo</strong> – Infilatura automatica in un attimo</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>🤝 <strong>Supporto continuo</strong> – Assistenza sempre disponibile</span>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    🧵 Macchina da Cucire Creativa – Compatta, Potente, Facilissima da Usare
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>📅 Ampia varietà di punti: 165 programmi inclusi</span>
                      <span className="text-red-600 line-through font-bold">€129,99</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>✨ Infila ago automatico: Risparmia tempo e stress</span>
                      <span className="text-green-600 font-bold">✔ Incluso</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>🔢 Display LCD retroilluminato: Tutto sotto controllo</span>
                      <span className="text-green-600 font-bold">✔ Incluso</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>🛋 Accessori completi: Tavolo estensibile, piedini, DVD</span>
                      <span className="text-green-600 font-bold">✔ Incluso</span>
                    </div>
                  </div>

                  <div className="bg-green-100 p-3 rounded-lg space-y-2 text-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <Truck className="w-4 h-4" />
                      <span><strong>Spedizione Gratis</strong> in tutta Italia (3-4 giorni)</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span><strong>Pagamento alla consegna</strong> disponibile (+€2,99)</span>
                    </div>
                  </div>

                  <div className="bg-green-600 text-white p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm">Prezzo di listino:</div>
                      <div className="text-lg line-through text-red-200">€129,99</div>
                      <div className="text-sm">Oggi solo:</div>
                      <div className="text-3xl font-bold">€62,98</div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center">
                    <div className="text-red-800 font-bold text-sm">
                      ⏳ <strong>Offerta valida solo per pochi giorni!</strong><br />
                      Approfitta prima che torni a prezzo pieno.
                    </div>
                  </div>

                  <StockIndicator />
                </div>
              </div>

              <button
                onClick={handleOrderClick}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg"
              >
                🛒 ORDINA ORA - SPEDIZIONE GRATUITA
              </button>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-center text-gray-700 mb-4">
                  Ordina <strong>ORA</strong> e riceverai il tuo pacco tra <strong>venerdì 26 lug e lunedì 29 lug</strong>
                </p>
                <div className="flex justify-between items-center text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📦</div>
                    <div className="font-medium">Ordinato</div>
                    <div className="text-gray-500">gio, 25 lug</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🚚</div>
                    <div className="font-medium">Spedito</div>
                    <div className="text-gray-500">ven, 26 lug</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">📍</div>
                    <div className="font-medium">Consegnato</div>
                    <div className="text-gray-500">lun, 29 lug</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Truck className="w-4 h-4" />
                  <span>Spedizione veloce</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Pagamento sicuro</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>30 giorni garanzia</span>
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
                ✨ Scopri la Macchina da Cucire Creativa – La Tua Compagna Ideale per Ogni Progetto!
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                La <strong>Macchina da Cucire Creativa</strong> è progettata per liberare la tua creatività e semplificare ogni fase del cucito.
              </p>
              <p className="text-lg text-gray-700">
                Con <strong>165 punti incorporati</strong>, inclusi punti utili, decorativi e alfabetici, potrai realizzare qualsiasi progetto, dai capi d'abbigliamento alle decorazioni per la casa.
              </p>
            </div>
            <div>
              <img
                src="https://cosedicase.com/cdn/shop/files/18_f4cbe1da-c323-46aa-b30d-bec97a0bddf7.jpg?v=1749044582&width=600"
                alt="Macchina da Cucire in uso"
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
                src="https://cosedicase.com/cdn/shop/files/15_54387e19-bea6-45d3-b0d0-ce597a350b7e.jpg?v=1749044582&width=600"
                alt="Caratteristiche della macchina"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Caratteristiche principali
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Ampia varietà di punti:</strong> 165 punti incorporati, tra cui 110 punti utili e decorativi, 8 stili di asole automatiche e 55 caratteri alfanumerici.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Infila ago automatico:</strong> Risparmia tempo e fatica grazie al sistema di infilatura automatica dell'ago.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Display LCD intuitivo:</strong> Seleziona facilmente i punti e le impostazioni tramite il display retroilluminato.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Accessori inclusi:</strong> Viene fornita con una copertura rigida protettiva, tavolo estensibile, 8 piedini per cucito e quilting, DVD istruttivo e altro ancora.
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Supporto dedicato:</strong> Assistenza tecnica gratuita online, via chat o telefono per tutta la durata della macchina.
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
              Cucito Semplice e Creativo
            </h2>
            <p className="text-lg text-gray-700">
              Scopri come questa macchina semplifica il cucito, migliorando la precisione e la creatività nei tuoi progetti.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="https://cosedicase.com/cdn/shop/files/12.jpg?v=1749030210&width=600"
                alt="Macchina da cucire in azione"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">📏</div>
                  <h3 className="font-bold text-lg mb-2">Precisione</h3>
                  <p className="text-gray-600">Ottieni cuciture precise e uniformi facilmente.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🧵</div>
                  <h3 className="font-bold text-lg mb-2">Versatilità</h3>
                  <p className="text-gray-600">Scegli tra tanti punti decorativi e utili.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🕒</div>
                  <h3 className="font-bold text-lg mb-2">Risparmio Tempo</h3>
                  <p className="text-gray-600">Infilatura automatica per iniziare subito.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="font-bold text-lg mb-2">Supporto</h3>
                  <p className="text-gray-600">Assistenza tecnica a vita per la tua tranquillità.</p>
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
              Cosa Rende Unica la Macchina da Cucire Creativa
            </h2>
            <p className="text-lg text-gray-700">
              A differenza di altri, offre funzioni automatiche, un ampio tavolo e supporto tecnico a vita, migliorando l'esperienza di cucito e creatività.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 sm:p-8 overflow-x-auto">
            <div className="min-w-full">
              <div className="hidden md:grid md:grid-cols-3 gap-4 text-center mb-4">
                <div></div>
                <div className="font-bold text-lg">Macchina da Cucire Creativa</div>
                <div className="font-bold text-lg">Altri</div>
              </div>

              {[
                'Precisione',
                'Versatilità',
                'Automazione',
                'Supporto',
                'Conveniente'
              ].map((feature, index) => (
                <div key={index} className="border-b border-gray-200 py-4">
                  <div className="md:hidden">
                    <div className="font-medium text-lg mb-3">{feature}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="font-medium text-green-600 mb-1">Noi</div>
                        <Check className="w-6 h-6 text-green-600 mx-auto" />
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="font-medium text-red-600 mb-1">Altri</div>
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

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="https://cosedicase.com/cdn/shop/files/download_17_a3b5a2ba-dfd7-48bd-9cf6-cbaa230ed97c.gif?v=1749034197&width=600"
                alt="Risultati soddisfacenti"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Trasforma il Tuo Cucito con Risultati Eccezionali
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Cucito più semplice e veloce</span>
                    <span className="text-sm font-medium">97%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '97%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Aumento della creatività</span>
                    <span className="text-sm font-medium">98%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Risparmio di tempo</span>
                    <span className="text-sm font-medium">96%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Risposte alle Tue Domande Frequenti
            </h2>
            <p className="text-lg text-gray-700">
              Chiarezza e supporto per un acquisto sicuro.
            </p>
          </div>

          <div className="space-y-4">
            <FAQ
              question="Come facilita il cucito automatico?"
              answer="La macchina dispone di selezione automatica dei punti e infilatura per un cucito semplice e veloce."
            />
            <FAQ
              question="Quali accessori sono inclusi?"
              answer="Include tavolo ampio, copertura dura, piedi per cucito e un DVD istruttivo."
            />
            <FAQ
              question="È adatta per progetti di quilt?"
              answer="Sì, grazie al tavolo ampio e ai punti decorativi, è perfetta per quilt grandi."
            />
            <FAQ
              question="Come funziona il supporto tecnico?"
              answer="Offriamo supporto online e telefonico per la vita del prodotto, garantendo assistenza continua."
            />
            <FAQ
              question="La macchina è facile da usare per i principianti?"
              answer="Assolutamente, con funzioni intuitive e un display LCD, è ideale anche per chi è alle prime armi."
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
              Le opinioni dei clienti sulla macchina da cucire
            </h2>
            <p className="text-lg text-gray-700">
              Feedback autentici e affidabili
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Sara V.",
                rating: 5,
                review: "Questa macchina da cucire ha cambiato il mio modo di cucire! 😍 Le opzioni di punti sono incredibili e mi permettono di creare capolavori. Amo la facilità d'uso e il supporto tecnico è sempre disponibile."
              },
              {
                name: "Caterina D.",
                rating: 4,
                review: "Facile da usare, anche se alcune funzioni richiedono pratica. Nel complesso molto soddisfatta dell'acquisto."
              },
              {
                name: "Anna S.",
                rating: 5,
                review: "Perfetta per cucire! Non posso credere a quanto sia semplice creare abiti con questa macchina!"
              },
              {
                name: "Martina F.",
                rating: 4,
                review: "Le funzioni di questa macchina mi hanno permesso di esplorare nuovi orizzonti nel cucito. Consigliatissima!"
              },
              {
                name: "Valentina J.",
                rating: 5,
                review: "La macchina è fantastica ma il servizio clienti è ancora meglio. Mi hanno aiutato con ogni domanda."
              },
              {
                name: "Federica O.",
                rating: 5,
                review: "Un ottimo acquisto per chi cerca versatilità e qualità. La varietà di punti è perfetta per ogni progetto creativo!"
              },
              {
                name: "Chiara N.",
                rating: 4,
                review: "Veramente utile! Ho cucito tende, abiti e persino un quilt gigante! La tabella larga è indispensabile."
              },
              {
                name: "Laura P.",
                rating: 5,
                review: "Non posso fare a meno della funzione di infilatura automatica, un vero salvavita!"
              },
              {
                name: "Beatrice H.",
                rating: 5,
                review: "Ideale per chi ama cucire e creare capolavori unici. Dopo settimane di uso intenso, continua a funzionare perfettamente."
              }
            ].map((review, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center space-x-2 mb-3">
                  <StarRating rating={review.rating} />
                  <span className="text-sm text-gray-600">Acquirente Verificato</span>
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
                alt="Sara V."
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <StarRating rating={5} />
                  <span className="font-medium">Sara V.</span>
                  <span className="text-sm text-gray-600">Acquirente Verificato</span>
                </div>
                <p className="text-gray-700">
                  "Questa macchina da cucire ha cambiato il mio modo di cucire! 😍 Le opzioni di punti sono incredibili e mi permettono di creare capolavori. Amo la facilità d'uso e il supporto tecnico è sempre disponibile. Non potrei essere più felice con il mio acquisto!"
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
              Garanzia di Rimborso di 30 Giorni
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Prova la macchina da cucire in tutta sicurezza con la nostra garanzia di rimborso di 30 giorni. Sperimenta la facilità e la precisione del cucito senza rischi, e scopri come può trasformare la tua creatività.
            </p>
            <p className="text-xl font-bold text-green-600">
              Se non sei completamente soddisfatta, ti rimborsiamo l'intero importo.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perché acquistare da noi?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Numero di tracciabilità per ogni ordine</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Pagamenti direttamente alla consegna</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Assistenza 24 ore su 24, 7 giorni su 7</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Nessun costo nascosto!</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">SPEDIZIONE</h3>
              <p className="text-gray-700 mb-4">
                Spediamo in tutta Italia e se l'ordine viene effettuato prima delle 21:59, l'ordine verrà spedito entro il giorno lavorativo successivo.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Consegnato in 3-4 giorni lavorativi</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Compreso il numero di tracciabilità</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Venduto esclusivamente da <strong>LECOSEDICASE.COM</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            🔥 Non Perdere Questa Offerta Speciale!
          </h2>
          <p className="text-xl mb-8">
            Solo per oggi: <span className="line-through opacity-75">€129,99</span> <span className="text-5xl font-bold">€62,98</span>
          </p>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Users className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">2,847+</div>
                <div className="text-sm opacity-90">Clienti Soddisfatti</div>
              </div>
              <div>
                <Package className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">98.7%</div>
                <div className="text-sm opacity-90">Tasso di Soddisfazione</div>
              </div>
              <div>
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">24/7</div>
                <div className="text-sm opacity-90">Supporto Clienti</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleOrderClick}
            className="bg-white text-orange-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg mb-4 w-full md:w-auto"
          >
            🛒 ORDINA ORA - ULTIMI PEZZI DISPONIBILI
          </button>

          <p className="text-sm opacity-90">
            ⚡ Offerta limitata nel tempo • 🚚 Spedizione gratuita • 💯 Garanzia 30 giorni
          </p>
        </div>
      </section>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-orange-600 p-4 z-30">
        <button
          onClick={handleOrderClick}
          className="w-full bg-white text-orange-600 font-bold py-3 px-6 rounded-lg text-lg"
        >
          🛒 ORDINA ORA €62,98
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

            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 pr-8">Compila per ordinare</h3>
            <p className="text-gray-600 mb-4 md:mb-6">Pagamento alla consegna</p>

            <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Riepilogo ordine</h4>
              <div className="flex items-center gap-3">
                <img
                  src="https://cosedicase.com/cdn/shop/files/12_7c7dad15-e9f3-458a-a4b4-4ee69d6424dc.jpg?v=1749044582&width=1000"
                  alt="Macchina da Cucire"
                  className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm md:text-base">Macchina da Cucire Creativa</div>
                  <div className="text-xs md:text-sm text-gray-600">Compatta, Potente, Facilissima da Usare</div>
                  <div className="text-xs md:text-sm text-green-600">✅ Spedizione gratuita</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-lg md:text-xl text-gray-900">€62,98</div>
                  <div className="text-xs text-gray-500 line-through">€129,99</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 md:mb-6">
              <div className="text-center">
                <div className="text-xs text-red-600 mb-1">🔒 Stiamo riservando il tuo ordine</div>
                <div className="text-xl md:text-2xl font-mono font-bold text-red-700">
                  {reservationTimer.minutes.toString().padStart(2, '0')}:{reservationTimer.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Tempo rimanente per completare l'ordine
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleFormChange('nome', e.target.value)}
                  className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 text-base ${formErrors.nome
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                    }`}
                  placeholder="Il tuo nome completo"
                />
                {formErrors.nome && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero di Telefono *</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleFormChange('telefono', e.target.value)}
                  className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 text-base ${formErrors.telefono
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                    }`}
                  placeholder="Il tuo numero di telefono"
                />
                {formErrors.telefono && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.telefono}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo Completo *</label>
                <textarea
                  value={formData.indirizzo}
                  onChange={(e) => handleFormChange('indirizzo', e.target.value)}
                  className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 h-20 md:h-20 text-base resize-none ${formErrors.indirizzo
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                    }`}
                  placeholder="Via, numero civico, città, CAP"
                />
                {formErrors.indirizzo && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.indirizzo}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4 mt-4 text-gray-700">
              <Shield className="w-5 h-5" />
              <span className="font-medium text-sm md:text-base">Pagamento alla consegna</span>
            </div>

            <button
              onClick={handleOrderSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 text-base md:text-lg"
            >
              {isSubmitting ? 'ELABORANDO...' : 'CONFERMA ORDINE - €62,98'}
            </button>
          </div>
        </div>
      )}

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
      `}</style>
    </div>
  );
}