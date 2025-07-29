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

  // Enhanced Purchase tracking with retry mechanism and CAPI (FIXED)
  trackPurchaseEvent: async (orderData: any, retries = 3): Promise<boolean> => {
    const clientEventId = `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🎯 Starting Purchase tracking (${retries} retries left)...`);

    try {
      // Facebook Client-Side + CAPI Tracking
      await advancedTrackingUtils.trackFacebookPurchase(orderData, clientEventId);

      // Google Ads Conversion Tracking
      await advancedTrackingUtils.trackGooglePurchase(orderData);

      console.log('✅ Purchase tracking completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Purchase tracking error:', error);
      if (retries > 0) {
        console.log(`⏰ Retrying purchase tracking... (${retries - 1} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return advancedTrackingUtils.trackPurchaseEvent(orderData, retries - 1);
      }
      throw error;
    }
  },

  // Facebook Purchase with CAPI fallback (FIXED)
  trackFacebookPurchase: async (orderData: any, clientEventId: string): Promise<void> => {
    const purchaseData = {
      content_type: 'product',
      content_ids: ['sewing-machine-creative'],
      content_name: 'Macchina da Cucire Creativa',
      value: 62.98,
      currency: 'EUR',
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

    // CAPI tracking (single attempt)
    try {
      const userIP = await advancedTrackingUtils.getClientIP();

      const capiData = {
        data: [{
          event_name: 'purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: clientEventId,
          action_source: 'website',
          event_source_url: window.location.href,
          user_data: {
            client_ip_address: userIP,
            client_user_agent: navigator.userAgent,
            fbc: advancedTrackingUtils.getFbClickId(),
            fbp: advancedTrackingUtils.getFbBrowserId(),
            // Add order data if available (properly hashed)
            em: orderData?.email ? [await advancedTrackingUtils.hashData(orderData.email)] : undefined,
            ph: orderData?.telefono ? [await advancedTrackingUtils.hashData(orderData.telefono)] : undefined,
            fn: orderData?.nome ? [await advancedTrackingUtils.hashData(orderData.nome.split(' ')[0])] : undefined,
            ln: orderData?.nome && orderData.nome.split(' ').length > 1 ? [await advancedTrackingUtils.hashData(orderData.nome.split(' ').slice(1).join(' '))] : undefined
          },
          custom_data: {
            currency: 'EUR',
            value: 62.98,
            content_name: 'Macchina da Cucire Creativa',
            content_type: 'product',
            content_ids: ['sewing-machine-creative'],
            order_id: orderData?.orderId || `MCU${Date.now()}`
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
        const result = await response.json();
        console.log('✅ Facebook Purchase tracked (CAPI)', result);
      } else {
        console.error(`❌ CAPI request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Facebook CAPI tracking error:', error);
    }
  },

  // Google Ads Purchase tracking (FIXED)
  trackGooglePurchase: async (orderData: any): Promise<void> => {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        // Enhanced ecommerce tracking
        window.gtag('event', 'purchase', {
          transaction_id: orderData?.orderId || `MCU${Date.now()}`,
          value: 62.98,
          currency: 'EUR',
          items: [{
            item_id: 'sewing-machine-creative',
            item_name: 'Macchina da Cucire Creativa',
            category: 'Sewing Machines',
            quantity: 1,
            price: 62.98
          }]
        });

        // Conversion tracking
        window.gtag('event', 'conversion', {
          send_to: 'AW-17086993346/DJt3CMrUrPsaEMKn29M_',
          value: 62.98,
          currency: 'EUR',
          transaction_id: orderData?.orderId || `MCU${Date.now()}`
        });

        // Page view with purchase context
        window.gtag('config', 'AW-17086993346', {
          page_title: 'Thank You - Order Confirmed',
          page_location: window.location.href,
          custom_map: {
            'purchase_value': 62.98,
            'purchase_currency': 'EUR'
          }
        });

        console.log('✅ Google Ads Purchase & Conversion tracked');
      } catch (error) {
        console.error('❌ Google Ads tracking error:', error);
      }
    } else {
      console.log('⏰ Google gtag not available');
    }
  },

  // Utility functions
  getClientIP: async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get client IP:', error);
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
  },

  // Track additional events for remarketing (FIXED - no infinite loops)
  trackEngagementEvents: (): (() => void) => {
    let engagementTracked = false;
    let scrollTracked = false;

    // Track that user stayed on thank you page (ONLY ONCE)
    const engagementTimeout = setTimeout(() => {
      if (!engagementTracked) {
        engagementTracked = true;
        if (window.fbq) {
          window.fbq('trackCustom', 'ThankYouPageEngagement', {
            engagement_time: 10,
            page_type: 'thank_you'
          });
        }

        if (window.gtag) {
          window.gtag('event', 'engagement', {
            engagement_time_msec: 10000
          });
        }
        console.log('✅ Engagement event tracked (10s)');
      }
    }, 10000);

    // Track scroll engagement (ONLY ONCE)
    const handleScroll = () => {
      if (!scrollTracked && window.scrollY > 500) {
        scrollTracked = true;
        if (window.fbq) {
          window.fbq('trackCustom', 'ThankYouPageScroll');
        }
        if (window.gtag) {
          window.gtag('event', 'scroll', {
            page_location: window.location.href
          });
        }
        console.log('✅ Scroll event tracked');
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function
    return () => {
      clearTimeout(engagementTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }
};

const ThankYouPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [pixelFired, setPixelFired] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const steps = [
    "Ordine Ricevuto",
    "Verifica Dati",
    "Preparazione",
    "Spedizione"
  ];

  useEffect(() => {
    // Load order data from localStorage
    const savedOrderData = localStorage.getItem('orderData');
    if (savedOrderData) {
      try {
        const parsedOrderData = JSON.parse(savedOrderData);
        setOrderData(parsedOrderData);
      } catch (error) {
        console.error('Failed to parse order data:', error);
      }
    }

    // Initialize tracking systems
    advancedTrackingUtils.initFacebookPixel();
    advancedTrackingUtils.initGoogleAds();

    // Timer for step animation
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < 3 ? prev + 1 : 0));
    }, 2000);

    // Enhanced Purchase tracking with multiple retry attempts (FIXED)
    const trackPurchaseWithRetry = async (attempt = 1, maxAttempts = 3) => {
      if (pixelFired) {
        console.log('🎉 Purchase already tracked, skipping...');
        return;
      }

      console.log(`🎯 Purchase tracking attempt ${attempt}/${maxAttempts}`);

      try {
        await advancedTrackingUtils.trackPurchaseEvent(orderData || {});
        setPixelFired(true);
        console.log('🎉 All purchase tracking completed successfully!');
      } catch (error) {
        console.error(`❌ Purchase tracking attempt ${attempt} failed:`, error);

        if (attempt < maxAttempts) {
          const delay = 2000 * attempt; // Linear backoff: 2s, 4s, 6s
          console.log(`⏰ Retrying in ${delay / 1000}s...`);
          setTimeout(() => {
            trackPurchaseWithRetry(attempt + 1, maxAttempts);
          }, delay);
        } else {
          console.log('❌ All tracking attempts failed');
        }
      }
    };

    // Single tracking attempt with delay
    const initialTrackingTimeout = setTimeout(() => {
      if (!pixelFired) {
        trackPurchaseWithRetry(1, 3);
      }
    }, 1000);

    // Page load completion tracking (SINGLE ATTEMPT)
    const handleLoad = () => {
      if (!pixelFired) {
        setTimeout(() => trackPurchaseWithRetry(1, 3), 500);
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad, { once: true });
    }

    // Track engagement events (with cleanup)
    const cleanupEngagement = advancedTrackingUtils.trackEngagementEvents();

    // Cleanup
    return () => {
      clearInterval(timer);
      clearTimeout(initialTrackingTimeout);
      window.removeEventListener('load', handleLoad);
      if (cleanupEngagement) cleanupEngagement();
    };
  }, [pixelFired, orderData]);

  // Track additional events when user interacts with page
  const handleUserInteraction = (eventName: string) => {
    if (window.fbq) {
      window.fbq('trackCustom', `ThankYou_${eventName}`);
    }
    if (window.gtag) {
      window.gtag('event', 'interaction', {
        interaction_type: eventName,
        page_location: window.location.href
      });
    }
  };

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Garanzia 30 Giorni",
      description: "Soddisfatti o rimborsati al 100%"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Spedizione Tracciata",
      description: "Riceverai il tracking via SMS"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Supporto Tecnico a Vita",
      description: "Assistenza per tutta la durata della macchina"
    }
  ];

  const nextSteps = [
    {
      step: "1",
      title: "Chiamata di Verifica",
      description: "Un nostro operatore ti contatterà entro 2 ore per confermare i dati dell'ordine",
      time: "Entro 2 ore"
    },
    {
      step: "2",
      title: "Preparazione Ordine",
      description: "La tua macchina da cucire verrà preparata e imballata con cura nel nostro magazzino",
      time: "24 ore"
    },
    {
      step: "3",
      title: "Spedizione Express",
      description: "Spedizione gratuita con corriere espresso e numero di tracking incluso",
      time: "24-48 ore"
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
            🎉 Ordine Confermato!
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Grazie per aver scelto la Macchina da Cucire Creativa
          </p>
          {orderData?.orderId && (
            <p className="text-lg mt-2 opacity-80">
              Numero Ordine: <strong>{orderData.orderId}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Main Confirmation */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-green-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Il Tuo Ordine è Stato Ricevuto
            </h2>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border-2 border-green-200">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Phone className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <h3 className="text-xl font-bold text-green-700">
                    Chiamata di Verifica in Arrivo
                  </h3>
                  <p className="text-green-600">
                    Un nostro operatore ti contatterà entro 2 ore
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-300">
                <p className="text-gray-700 text-center">
                  <strong className="text-green-600">📞 Tieni il telefono a portata di mano!</strong><br />
                  L'operatore verificherà i tuoi dati e confermerà la spedizione per garantire una consegna perfetta.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">
              Riepilogo Ordine
            </h3>

            <div className="bg-white rounded-lg p-6 shadow-md border border-blue-200">
              <h4 className="font-bold text-gray-800 mb-4">Prodotto Ordinato:</h4>

              <div className="flex items-center space-x-4">
                <img
                  src="https://cosedicase.com/cdn/shop/files/12_7c7dad15-e9f3-458a-a4b4-4ee69d6424dc.jpg?v=1749044582&width=1000"
                  alt="Macchina da Cucire Creativa"
                  className="w-20 h-20 rounded-lg border-2 border-gray-300 object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-lg">🧵 Macchina da Cucire Creativa</p>
                  <p className="text-sm text-gray-600 mb-2">Compatta, Potente, Facilissima da Usare</p>
                  <p className="text-green-600 font-bold text-xl">€62,98</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-blue-600 font-semibold">💳 Pagamento alla Consegna</p>
                    <p className="text-sm text-green-600 font-semibold">🚚 Spedizione Gratuita</p>
                    <p className="text-sm text-purple-600 font-semibold">🎁 Accessori Inclusi</p>
                  </div>
                </div>
              </div>

              {/* Customer Data */}
              {orderData && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-3">Dati di Spedizione:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nome:</span>
                      <span className="ml-2 font-medium">{orderData.nome}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Telefono:</span>
                      <span className="ml-2 font-medium">{orderData.telefono}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Indirizzo:</span>
                      <span className="ml-2 font-medium">{orderData.indirizzo}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-gray-200">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Cosa Succede Ora?
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
            Le Tue Garanzie
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center" onClick={() => handleUserInteraction('benefit_click')}>
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg cursor-pointer hover:bg-white/30 transition-all">
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
            Stato del Tuo Ordine
          </h3>

          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-lg ${index <= currentStep
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gray-300 text-gray-600'
                  }`}>
                  {index + 1}
                </div>
                <p className={`text-sm mt-2 font-semibold transition-all duration-500 ${index <= currentStep ? 'text-green-600' : 'text-gray-500'
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
            📅 Timeline di Consegna
          </h3>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <p className="text-center text-gray-700 mb-6 text-lg">
              Ordina <strong>ORA</strong> e riceverai il tuo pacco tra <strong>venerdì 1 ago e lunedì 4 ago</strong>
            </p>
            <div className="flex justify-between items-center">
              <div className="text-center flex-1" onClick={() => handleUserInteraction('timeline_click')}>
                <div className="text-4xl mb-2 cursor-pointer">📦</div>
                <div className="font-medium text-gray-800">Ordinato</div>
                <div className="text-gray-500 text-sm">gio, 31 lug</div>
              </div>
              <div className="text-center flex-1" onClick={() => handleUserInteraction('timeline_click')}>
                <div className="text-4xl mb-2 cursor-pointer">🚚</div>
                <div className="font-medium text-gray-800">Spedito</div>
                <div className="text-gray-500 text-sm">ven, 1 ago</div>
              </div>
              <div className="text-center flex-1" onClick={() => handleUserInteraction('timeline_click')}>
                <div className="text-4xl mb-2 cursor-pointer">📍</div>
                <div className="font-medium text-gray-800">Consegnato</div>
                <div className="text-gray-500 text-sm">lun, 4 ago</div>
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
                ⚠️ Informazioni Importanti
              </h3>
              <ul className="space-y-2 text-yellow-700">
                <li>• <strong>Mantieni il telefono acceso</strong> - Ti chiameremo entro 2 ore</li>
                <li>• <strong>Verifica i tuoi dati</strong> - L'operatore confermerà nome, telefono e indirizzo</li>
                <li>• <strong>Nessun pagamento ora</strong> - Pagherai alla consegna</li>
                <li>• <strong>Spedizione gratuita</strong> - Nessun costo aggiuntivo</li>
                <li>• <strong>Accessori inclusi</strong> - Tavolo estensibile, DVD e piedini speciali</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-gray-200">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">
            🎁 Cosa Riceverai nel Pacchetto
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200" onClick={() => handleUserInteraction('package_details')}>
              <h4 className="font-bold text-lg text-purple-700 mb-4">📦 Macchina da Cucire Creativa</h4>
              <ul className="space-y-2 text-purple-600">
                <li>• 165 punti incorporati</li>
                <li>• Infilatura automatica dell'ago</li>
                <li>• Display LCD retroilluminato</li>
                <li>• Copertura rigida protettiva</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200" onClick={() => handleUserInteraction('accessories_details')}>
              <h4 className="font-bold text-lg text-blue-700 mb-4">🛠️ Accessori Inclusi</h4>
              <ul className="space-y-2 text-blue-600">
                <li>• Tavolo estensibile per quilt</li>
                <li>• 8 piedini specializzati</li>
                <li>• DVD istruttivo completo</li>
                <li>• Kit di manutenzione</li>
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
              Ti Sei Unita a Oltre 2.800 Appassionate di Cucito Soddisfatte
            </h3>

            <p className="text-gray-600 text-lg mb-6">
              Hai fatto la scelta giusta per trasformare la tua passione per il cucito in capolavori unici.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-200" onClick={() => handleUserInteraction('stats_view')}>
                <div className="text-2xl font-bold text-green-600">97%</div>
                <p className="text-green-700 text-sm">Cucito più semplice e veloce</p>
              </div>

              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-4 border-2 border-blue-200" onClick={() => handleUserInteraction('stats_view')}>
                <div className="text-2xl font-bold text-blue-600">98%</div>
                <p className="text-blue-700 text-sm">Aumento della creatività</p>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-200" onClick={() => handleUserInteraction('stats_view')}>
                <div className="text-2xl font-bold text-purple-600">96%</div>
                <p className="text-purple-700 text-sm">Lo consiglierebbe ad un'amica</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Status Debug (only visible when needed) */}
        {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-8">
            <h4 className="font-bold mb-2">🔧 Tracking Debug Info</h4>
            <div className="space-y-1 text-sm">
              <p>Facebook Pixel Fired: <span className={pixelFired ? 'text-green-600' : 'text-red-600'}>{pixelFired ? 'Yes' : 'No'}</span></p>
              <p>Order Data: <span className={orderData ? 'text-green-600' : 'text-red-600'}>{orderData ? 'Loaded' : 'Missing'}</span></p>
              <p>Page Load: <span className="text-blue-600">{typeof document !== 'undefined' ? document.readyState : 'Unknown'}</span></p>
              <p>User Agent: <span className="text-gray-600 text-xs">{typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'Unknown'}</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced tracking scripts */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Additional tracking verification
            (function() {
              console.log('🎯 Thank You Page Tracking Initialized');
              
              // Monitor for successful tracking
              window.addEventListener('beforeunload', function() {
                if (window.fbq && window.gtag) {
                  try {
                    // Final tracking attempt on page unload
                    window.fbq('trackCustom', 'ThankYouPageUnload');
                    window.gtag('event', 'page_unload', {
                      page_location: window.location.href
                    });
                  } catch(e) {
                    console.error('Final tracking error:', e);
                  }
                }
              });

              // Track visibility changes
              document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible' && window.fbq) {
                  window.fbq('trackCustom', 'ThankYouPageVisible');
                }
              });
            })();
          `
        }}
      />
    </div>
  );
};

export default ThankYouPage;