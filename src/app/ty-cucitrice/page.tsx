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

    // CAPI tracking via N8N
    if (orderData) {
      try {
        console.log(`📡 Sending Purchase to N8N webhook...`);

        // Hash dei dati sensibili
        const hashedPhone = orderData.telefono ? await advancedTrackingUtils.hashData(orderData.telefono.replace(/\D/g, '')) : null;
        const hashedFirstName = orderData.nome ? await advancedTrackingUtils.hashData(orderData.nome.split(' ')[0]) : null;
        const hashedLastName = orderData.nome && orderData.nome.split(' ').length > 1 ? await advancedTrackingUtils.hashData(orderData.nome.split(' ').slice(1).join(' ')) : null;

        const capiData = {
          event_name: 'Purchase',
          event_id: clientEventId,
          timestamp: Math.floor(Date.now() / 1000),
          event_source_url: window.location.href,

          // Token e Pixel ID dinamici
          token: 'EAAPYtpMdWREBPJH0W7LzwU2MuZA61clyQOfYg5C6E0vo9E5QYgJWl2n5XtO8Ur93YTZANcWYz3qsAbDOadffn10KbQZCOwkRS6DpM8bRjwX25NBn5d1lvVNQhFOCGY9eZARrjyCbJs1OtFk2BOc4ZBbaUjeD7dvkejyxZAZAEQdeb8AQzUKdAQitdhU0jVGywZDZD',
          pixel_id: '763716602087140', // Pixel ID dinamico

          // Dati hashati del form
          telefono_hash: hashedPhone,
          nome_hash: hashedFirstName,
          cognome_hash: hashedLastName,
          indirizzo: orderData.indirizzo || null,

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
          content_name: 'Macchina da Cucire Creativa',
          content_category: 'Sewing Machines',
          content_ids: 'sewing-machine-creative',
          content_type: 'product',
          value: 62.98,
          currency: 'EUR', // Currency dinamica
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

  // Google Ads Purchase tracking DISABILITATO - già tracciato nella landing
  trackGooglePurchase: async (orderData: any): Promise<void> => {
    console.log('ℹ️ Google Ads Purchase skipped - already tracked in landing page');
  },

  // Utility functions
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
    "Ordine Ricevuto",
    "Verifica Dati",
    "Preparazione",
    "Spedizione"
  ];

  // Fix hydration by ensuring component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate delivery dates
  useEffect(() => {
    if (!mounted) return;

    const formatData = (data: Date): string => {
      const giorni = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
      const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
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
      deliveryRange: `${formatData(dataConsegnaInizio)} e ${formatData(dataConsegnaFine)}`
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
    advancedTrackingUtils.initFacebookPixel();
    advancedTrackingUtils.initGoogleAds();

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
    if (!mounted || pixelFired || !orderData) return;

    console.log('🎯 Starting purchase tracking...');

    const trackPurchase = async () => {
      try {
        await advancedTrackingUtils.trackPurchaseEvent(orderData);
        setPixelFired(true);
        console.log('🎉 Purchase tracking completed!');
      } catch (error) {
        console.error('❌ Purchase tracking failed:', error);
      }
    };

    const trackingTimeout = setTimeout(trackPurchase, 1000);
    return () => clearTimeout(trackingTimeout);
  }, [mounted, orderData, pixelFired]);

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

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
              Ordina <strong>ORA</strong> e riceverai il tuo pacco tra <strong>{deliveryDates.deliveryRange}</strong>
            </p>
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <div className="text-4xl mb-2">📦</div>
                <div className="font-medium text-gray-800">Ordinato</div>
                <div className="text-gray-500 text-sm">{deliveryDates.orderDate}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-4xl mb-2">🚚</div>
                <div className="font-medium text-gray-800">Spedito</div>
                <div className="text-gray-500 text-sm">{deliveryDates.shipDate}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-4xl mb-2">📍</div>
                <div className="font-medium text-gray-800">Consegnato</div>
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
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
              <h4 className="font-bold text-lg text-purple-700 mb-4">📦 Macchina da Cucire Creativa</h4>
              <ul className="space-y-2 text-purple-600">
                <li>• 165 punti incorporati</li>
                <li>• Infilatura automatica dell'ago</li>
                <li>• Display LCD retroilluminato</li>
                <li>• Copertura rigida protettiva</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
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
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-200">
                <div className="text-2xl font-bold text-green-600">97%</div>
                <p className="text-green-700 text-sm">Cucito più semplice e veloce</p>
              </div>

              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-4 border-2 border-blue-200">
                <div className="text-2xl font-bold text-blue-600">98%</div>
                <p className="text-blue-700 text-sm">Aumento della creatività</p>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-200">
                <div className="text-2xl font-bold text-purple-600">96%</div>
                <p className="text-purple-700 text-sm">Lo consiglierebbe ad un'amica</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;