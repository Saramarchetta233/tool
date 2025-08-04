"use client";

declare global {
  interface Window {
    fbq: any;
    gtag: any;
    dataLayer: any[];
  }
}

import React, { useState, useEffect } from 'react';
import { CheckCircle, Phone, Clock, Shield, Package, Star, Heart, Award, Truck } from 'lucide-react';

// Advanced tracking utilities for Thank You page
const advancedTrackingUtils = {
  // Initialize Facebook Pixel with enhanced configuration
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
    }
  },

  // Initialize Google Ads with enhanced ecommerce
  initGoogleAds: () => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', 'AW-17086993346', {
        send_page_view: false // We'll send it manually with purchase data
      });

      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17086993346';
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

  // Enhanced Purchase tracking with CAPI via N8N
  trackPurchaseEvent: async (orderData: any): Promise<boolean> => {
    const clientEventId = `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🎯 Starting Purchase tracking...`);

    try {
      // Facebook Client-Side + CAPI Tracking
      await advancedTrackingUtils.trackFacebookPurchase(orderData, clientEventId);

      // Google Ads Conversion Tracking
      await advancedTrackingUtils.trackGooglePurchase(orderData);

      console.log('✅ Purchase tracking completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Purchase tracking error:', error);
      return false;
    }
  },

  // Facebook Purchase with client-side + CAPI
  trackFacebookPurchase: async (orderData: any, clientEventId: string): Promise<void> => {
    const purchaseData = {
      content_type: 'product',
      content_ids: ['product-order'],
      content_name: 'Product Order',
      value: 299.00,
      currency: 'PLN',
      num_items: 1
    };

    // Client-side tracking
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq('track', 'Purchase', purchaseData, {
          eventID: clientEventId
        });
        console.log('✅ Facebook Purchase tracked (client-side)');
      } catch (error) {
        console.error('❌ Facebook client tracking error:', error);
      }
    }

    // Google Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'purchase', {
          event_category: 'Facebook',
          event_label: 'Purchase',
          value: 299.00
        });
      } catch (error) {
        console.error('❌ Google Analytics Purchase tracking error:', error);
      }
    }

    // CAPI tracking via N8N
    if (orderData) {
      try {
        console.log(`📡 Sending Purchase to N8N webhook...`);

        // Hash dei dati sensibili
        const hashedPhone = orderData.telefon ? await advancedTrackingUtils.hashData(orderData.telefon.replace(/\D/g, '')) : null;
        const hashedFirstName = orderData.imie ? await advancedTrackingUtils.hashData(orderData.imie.split(' ')[0]) : null;
        const hashedLastName = orderData.imie && orderData.imie.split(' ').length > 1 ? await advancedTrackingUtils.hashData(orderData.imie.split(' ').slice(1).join(' ')) : null;

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

          // Dati hashati del form
          telefono_hash: hashedPhone,
          nome_hash: hashedFirstName,
          cognome_hash: hashedLastName,
          indirizzo: orderData.adres || null,

          // Traffic source for analytics
          traffic_source: advancedTrackingUtils.getTrafficSource(),

          // Dati tecnici
          user_agent: navigator.userAgent,
          fbp: advancedTrackingUtils.getFbBrowserId(),
          fbc: advancedTrackingUtils.getFbClickId(),

          // Altri dati utili
          page_title: document.title,
          referrer: document.referrer,
          language: navigator.language,
          screen_resolution: `${screen.width}x${screen.height}`,

          // Dati custom per questo prodotto - DINAMICI
          content_name: 'Product Order',
          content_category: 'Products',
          content_ids: 'product-order',
          content_type: 'product',
          value: 299.00,
          currency: 'PLN', // Currency dinamica
          quantity: 1
        };

        const response = await fetch('https://primary-production-625c.up.railway.app/webhook/CAPI-Meta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(capiData)
        });

        const responseText = await response.text();
        console.log(`📥 Purchase webhook response:`, response.status, responseText);

        if (response.ok) {
          console.log(`✅ Facebook Purchase CAPI tracked via N8N`);
        } else {
          console.error(`❌ Facebook Purchase CAPI error:`, response.status, responseText);
        }
      } catch (error) {
        console.error(`❌ Facebook Purchase CAPI tracking error:`, error);
      }
    }
  },

  trackGooglePurchase: async (orderData: any): Promise<void> => {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        const transactionId = orderData?.orderId || `TY${Date.now()}`;

        // Track Google Ads conversion
        window.gtag('event', 'conversion', {
          send_to: 'AW-17086993346/DJt3CMrUrPsaEMKn29M_',
          value: 299.00,
          currency: 'PLN',
          transaction_id: transactionId
        });

        // Track Google Analytics purchase
        window.gtag('event', 'purchase', {
          transaction_id: transactionId,
          value: 299.00,
          currency: 'PLN',
          items: [{
            item_id: 'sewing-machine-creative',
            item_name: 'Maszyna do Szycia Kreatywna',
            category: 'Sewing Machines',
            quantity: 1,
            price: 299.00
          }]
        });

        console.log(`✅ Google Ads Purchase tracked in Thank You page with transaction ID: ${transactionId}`);
      } catch (error) {
        console.error(`❌ Google Ads Purchase tracking error:`, error);
      }
    } else {
      console.log(`❌ Google gtag not available for Purchase tracking`);
    }
  },

  // Utility functions
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

      console.log('✅ Facebook Click ID salvato (Thank You):', fbcValue);
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

  // Proper SHA-256 hashing for PII data
  hashData: async (data: string): Promise<string> => {
    if (!data || typeof data !== 'string') return '';

    try {
      const normalizedData = data.toLowerCase().trim();
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

const ThankYouPage = () => {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pixelFired, setPixelFired] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [deliveryDates, setDeliveryDates] = useState({
    orderDate: '',
    shipDate: '',
    deliveryStart: '',
    deliveryEnd: '',
    deliveryRange: ''
  });

  const steps = [
    "Zamówienie Otrzymane",
    "Weryfikacja Danych",
    "Przygotowanie",
    "Wysyłka"
  ];

  // Fix hydration by ensuring component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate delivery dates
  useEffect(() => {
    if (!mounted) return;

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
        if (giorno !== 0 && giorno !== 6) count++;
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
  }, [mounted]);

  // Load order data from localStorage
  useEffect(() => {
    if (!mounted) return;

    const savedOrderData = localStorage.getItem('orderData');
    if (savedOrderData) {
      try {
        const parsedOrderData = JSON.parse(savedOrderData);
        setOrderData(parsedOrderData);
      } catch (error) {
        console.error('Failed to parse order data:', error);
      }
    }
  }, [mounted]);

  // Initialize tracking systems
  useEffect(() => {
    if (!mounted) return;

    console.log('🎯 Thank You Page Tracking Initialized');

    // AGGIUNGI QUESTA LINEA QUI
    advancedTrackingUtils.setFbClickId();

    // Inizializzazione forzata del pixel
    advancedTrackingUtils.initFacebookPixel();
    advancedTrackingUtils.initGoogleAds();
    advancedTrackingUtils.initGoogleAnalytics();

    // FORZARE PageView dopo inizializzazione
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'PageView');
        console.log('✅ Thank You PageView tracked');
      } else {
        console.log('❌ Pixel not loaded for PageView');
      }
    }, 500);

    // Timer for step animation
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < 3 ? prev + 1 : 0));
    }, 2000);

    return () => {
      clearInterval(timer);
    };
  }, [mounted]);

  // Purchase tracking
  useEffect(() => {
    if (!mounted || pixelFired) return;

    console.log('🎯 Starting purchase tracking...');

    const trackPurchase = async () => {
      try {
        // FORZARE L'INIZIALIZZAZIONE del pixel se non è ancora caricato
        if (!window.fbq) {
          console.log('⚠️ Pixel not loaded, initializing...');
          advancedTrackingUtils.initFacebookPixel();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Usare dati di default se orderData manca
        const trackingData = orderData || {
          orderId: `TY${Date.now()}`,
          imie: 'Guest User',
          telefon: '',
          adres: ''
        };

        await advancedTrackingUtils.trackPurchaseEvent(trackingData);
        setPixelFired(true);
        console.log('🎉 Purchase tracking completed!');
      } catch (error) {
        console.error('❌ Purchase tracking failed:', error);
      }
    };

    const trackingTimeout = setTimeout(trackPurchase, 2000);
    return () => clearTimeout(trackingTimeout);
  }, [mounted, pixelFired]);

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Gwarancja 30 Dni",
      description: "Zadowoleni lub 100% zwrot pieniędzy"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Śledzona Wysyłka",
      description: "Otrzymasz numer śledzenia SMS-em"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Obsługa Klientów",
      description: "Dedykowana pomoc dla każdej Twojej potrzeby"
    }
  ];

  const nextSteps = [
    {
      step: "1",
      title: "Połączenie Weryfikacyjne",
      description: "Nasz operator skontaktuje się z Tobą w najbliższych godzinach, aby potwierdzić dane zamówienia",
      time: "Wkrótce"
    },
    {
      step: "2",
      title: "Przygotowanie Zamówienia",
      description: "Twój produkt zostanie starannie przygotowany i zapakowany w naszym magazynie",
      time: "24 godziny"
    },
    {
      step: "3",
      title: "Ekspresowa Wysyłka",
      description: "Darmowa wysyłka kurierem ekspresowym z numerem śledzenia w zestawie",
      time: "24-48 godzin"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50">
      {/* Header Success */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-bounce mb-4">
            <CheckCircle className="w-20 h-20 mx-auto text-green-100" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎉 Zamówienie Potwierdzone!
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Dziękujemy za wybór naszych produktów
          </p>
          {orderData?.orderId && (
            <p className="text-lg mt-2 opacity-80">
              Numer Zamówienia: <strong>{orderData.orderId}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Main Confirmation */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-green-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Twoje Zamówienie Zostało Otrzymane
            </h2>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border-2 border-green-200">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Phone className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <h3 className="text-xl font-bold text-green-700">
                    Nadchodzi Połączenie Weryfikacyjne
                  </h3>
                  <p className="text-green-600">
                    Nasz operator skontaktuje się z Tobą w najbliższych godzinach
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-300">
                <p className="text-gray-700 text-center">
                  <strong className="text-green-600">📞 Miej telefon pod ręką!</strong><br />
                  Operator zweryfikuje Twoje dane i potwierdzi wysyłkę, aby zagwarantować idealną dostawę.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-gray-200">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Co Dzieje Się Teraz?
          </h2>

          <div className="space-y-6">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                  {step.step}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold border border-green-300">
                      {step.time}
                    </span>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Reminder */}
        <div className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-2xl text-white p-8 mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 drop-shadow-lg">
            Twoje Gwarancje
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 drop-shadow">{benefit.title}</h3>
                <p className="opacity-90 drop-shadow-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Animation */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-gray-200">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Status Twojego Zamówienia
          </h3>

          <div className="flex items-center justify-between mb-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center min-w-0 flex-1 px-1">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-500 shadow-lg ${index <= currentStep
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gray-300 text-gray-600'
                  }`}>
                  {index + 1}
                </div>
                <p className={`text-xs md:text-sm mt-1 md:mt-2 font-semibold transition-all duration-500 text-center leading-tight ${index <= currentStep ? 'text-green-600' : 'text-gray-500'
                  }`}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(currentStep + 1) * 25}%` }}
            ></div>
          </div>
        </div>

        {/* Delivery Timeline */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-blue-200">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">
            📅 Harmonogram Dostawy
          </h3>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <p className="text-center text-gray-700 mb-6 text-lg">
              Zamówione <strong>DZIŚ</strong> i dostarczone między <strong>{deliveryDates.deliveryRange}</strong>
            </p>
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <div className="text-4xl mb-2">📦</div>
                <div className="font-medium text-gray-800">Zamówione</div>
                <div className="text-gray-500 text-sm">{deliveryDates.orderDate}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-4xl mb-2">🚚</div>
                <div className="font-medium text-gray-800">Wysłane</div>
                <div className="text-gray-500 text-sm">{deliveryDates.shipDate}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-4xl mb-2">📍</div>
                <div className="font-medium text-gray-800">Dostarczone</div>
                <div className="text-gray-500 text-sm">{deliveryDates.deliveryStart} - {deliveryDates.deliveryEnd}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Clock className="w-8 h-8 text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-yellow-700 mb-2">
                ⚠️ Ważne Informacje
              </h3>
              <ul className="space-y-2 text-yellow-700">
                <li>• <strong>Trzymaj telefon włączony</strong> - Zadzwonimy do Ciebie w najbliższych godzinach</li>
                <li>• <strong>Zweryfikuj swoje dane</strong> - Operator potwierdzi imię, telefon i adres</li>
                <li>• <strong>Brak płatności teraz</strong> - Zapłacisz przy odbiorze</li>
                <li>• <strong>Darmowa wysyłka</strong> - Bez dodatkowych kosztów</li>
                <li>• <strong>Gwarancja w zestawie</strong> - 30 dni zadowoleni lub zwrot pieniędzy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current drop-shadow" />
              ))}
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Dołączyłeś do Ponad 10.000 Zadowolonych Klientów
            </h3>

            <p className="text-gray-600 text-lg mb-6">
              Dokonałeś właściwego wyboru jakości i niezawodności naszych produktów.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-200">
                <div className="text-2xl font-bold text-green-600">98%</div>
                <p className="text-green-700 text-sm">Zadowolonych klientów</p>
              </div>

              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-4 border-2 border-blue-200">
                <div className="text-2xl font-bold text-blue-600">97%</div>
                <p className="text-blue-700 text-sm">Dostaw na czas</p>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-200">
                <div className="text-2xl font-bold text-purple-600">96%</div>
                <p className="text-purple-700 text-sm">Poleciłoby znajomemu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;