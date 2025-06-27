"use client";

declare global {
  interface Window {
    fbq: any;
  }
}

import React, { useState, useEffect } from 'react';
import { CheckCircle, Phone, Clock, Shield, Package, Star, Heart, Award } from 'lucide-react';

const ThankYouPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [pixelFired, setPixelFired] = useState(false);

  const steps = [
    "Ordine Ricevuto",
    "Verifica Dati",
    "Preparazione",
    "Spedizione"
  ];

  useEffect(() => {
    // Timer esistente
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < 3 ? prev + 1 : 0));
    }, 2000);

    // Funzione per tracciare l'evento Purchase con retry
    const trackPurchaseEvent = (retries = 5, delay = 500) => {
      if (pixelFired) return; // Evita duplicati

      if (typeof window !== 'undefined' && window.fbq) {
        try {
          window.fbq('track', 'Purchase', {
            value: 49.99,
            currency: 'EUR',
            content_type: 'product',
            content_name: 'SIX SLIM - Pacchetto Trasformazione Completa',
            content_ids: ['six-slim-complete'],
            num_items: 2
          });
          setPixelFired(true);
          console.log('✅ Purchase event successfully tracked');
        } catch (error) {
          console.error('❌ Error tracking Purchase event:', error);
          if (retries > 0) {
            setTimeout(() => trackPurchaseEvent(retries - 1, delay * 1.5), delay);
          }
        }
      } else {
        console.log(`⏳ Facebook Pixel not ready, retrying... (${retries} attempts left)`);
        if (retries > 0) {
          setTimeout(() => trackPurchaseEvent(retries - 1, delay * 1.2), delay);
        } else {
          console.error('❌ Facebook Pixel not available after all retries');
        }
      }
    };

    // Avvia il tracking con un delay iniziale
    const pixelTimeout = setTimeout(() => {
      trackPurchaseEvent();
    }, 1000);

    // Listener per quando la pagina è completamente caricata
    const handleLoad = () => {
      if (!pixelFired) {
        setTimeout(() => trackPurchaseEvent(), 500);
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(pixelTimeout);
      window.removeEventListener('load', handleLoad);
    };
  }, [pixelFired]);

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Garanzia 365 Giorni",
      description: "Soddisfatti o rimborsati al 100%"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Spedizione Tracciata",
      description: "Riceverai il tracking via SMS"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Supporto Dedicato",
      description: "Assistenza personalizzata inclusa"
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
      description: "Il tuo pacchetto SIX SLIM verrà preparato nel nostro laboratorio certificato",
      time: "24 ore"
    },
    {
      step: "3",
      title: "Spedizione Express",
      description: "Spedizione gratuita con corriere espresso e numero di tracking",
      time: "24-48 ore"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Header Success */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-bounce mb-4">
            <CheckCircle className="w-20 h-20 mx-auto text-green-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎉 Ordine Confermato!
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Grazie per aver scelto SIX SLIM
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Main Confirmation */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-900 rounded-2xl shadow-2xl p-8 mb-8 border border-amber-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
          <div className="text-center mb-8 relative z-10">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full p-4 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Il Tuo Ordine è Stato Ricevuto
            </h2>

            <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-xl p-6 mb-6 border border-amber-500/50 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Phone className="w-8 h-8 text-amber-400" />
                <div className="text-left">
                  <h3 className="text-xl font-bold text-amber-300">
                    Chiamata di Verifica in Arrivo
                  </h3>
                  <p className="text-amber-200">
                    Un nostro operatore ti contatterà entro 2 ore
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/80 rounded-lg p-4 border border-amber-500/30">
                <p className="text-gray-200 text-center">
                  <strong className="text-amber-300">📞 Tieni il telefono a portata di mano!</strong><br />
                  L'operatore verificherà i tuoi dati e confermerà la spedizione per garantire una consegna perfetta.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-r from-slate-800/80 to-gray-800/80 rounded-xl p-6 mb-8 border border-amber-500/30 backdrop-blur-sm relative z-10">
            <h3 className="text-2xl font-bold text-center text-white mb-4">
              Riepilogo Ordine
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 rounded-lg p-4 shadow-md border border-amber-500/20">
                <h4 className="font-bold text-white mb-3">Prodotto Ordinato:</h4>
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">💊</div>
                  <div>
                    <p className="font-semibold text-white">SIX SLIM - Pacchetto Trasformazione Completa</p>
                    <p className="text-sm text-gray-300">2 Confezioni + Bonus Gratuiti</p>
                    <p className="text-amber-400 font-bold">€49,99 invece di €99,96</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-blue-400 font-semibold">💳 Pagamento alla Consegna</p>
                      <p className="text-sm text-green-400 font-semibold">🚚 Spedizione Gratuita</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-lg p-4 shadow-md border border-amber-500/20">
                <h4 className="font-bold text-white mb-3">Bonus Inclusi:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-gray-300">Guida Alimentare Bruciagrassi</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-gray-300">Piano Allenamento Six Pack</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-gray-300">Consulenza WhatsApp 24/7 con Specialista</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-amber-500/30">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Cosa Succede Ora?
          </h2>

          <div className="space-y-6">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/40 backdrop-blur-sm">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                  {step.step}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-sm font-semibold border border-amber-500/30">
                      {step.time}
                    </span>
                  </div>
                  <p className="text-gray-300">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Reminder */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 rounded-2xl text-white p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="relative z-10">
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
        </div>

        {/* Progress Animation */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-amber-500/30">
          <h3 className="text-2xl font-bold text-center text-white mb-6">
            Stato del Tuo Ordine
          </h3>

          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-lg ${index <= currentStep
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                  : 'bg-gray-600 text-gray-300'
                  }`}>
                  {index + 1}
                </div>
                <p className={`text-sm mt-2 font-semibold transition-all duration-500 ${index <= currentStep ? 'text-amber-400' : 'text-gray-500'
                  }`}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(currentStep + 1) * 25}%` }}
            ></div>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-500/50 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <Clock className="w-8 h-8 text-yellow-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-yellow-300 mb-2">
                ⚠️ Informazioni Importanti
              </h3>
              <ul className="space-y-2 text-yellow-200">
                <li>• <strong>Mantieni il telefono acceso</strong> - Ti chiameremo entro 2 ore</li>
                <li>• <strong>Verifica i tuoi dati</strong> - L'operatore confermerà nome, telefono e indirizzo</li>
                <li>• <strong>Nessun pagamento ora</strong> - Pagherai alla consegna</li>
                <li>• <strong>Spedizione gratuita</strong> - Nessun costo aggiuntivo</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-900 rounded-2xl shadow-xl p-8 border border-amber-500/30">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-amber-400 fill-current drop-shadow" />
              ))}
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Ti Sei Unito a Oltre 3.000 Uomini e Donne Soddisfatti
            </h3>

            <p className="text-gray-300 text-lg mb-6">
              Hai fatto la scelta giusta per scolpire il tuo fisico e raggiungere i tuoi obiettivi.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-900/50 to-orange-900/50 rounded-lg p-4 border border-amber-500/30 backdrop-blur-sm">
                <div className="text-2xl font-bold text-amber-400">96%</div>
                <p className="text-amber-200 text-sm">Riduzione grasso addominale</p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-lg p-4 border border-blue-500/30 backdrop-blur-sm">
                <div className="text-2xl font-bold text-blue-400">91%</div>
                <p className="text-blue-200 text-sm">Aumento massa muscolare</p>
              </div>

              <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-lg p-4 border border-green-500/30 backdrop-blur-sm">
                <div className="text-2xl font-bold text-green-400">98%</div>
                <p className="text-green-200 text-sm">Consiglierebbe ad un amico</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;