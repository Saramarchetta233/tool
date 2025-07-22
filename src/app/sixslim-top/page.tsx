'use client';

declare global {
  interface Window {
    fbq: any;
    dataLayer: any[];
  }
}

import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Shield, Star, Users, TrendingDown, Zap, CreditCard, Truck } from 'lucide-react';

const SixSlimLanding = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 36, seconds: 32 });
  const [viewersCount, setViewersCount] = useState(847);
  const [remainingStock] = useState(Math.floor(Math.random() * 21) + 10); // Random between 10-30
  const [stockPercentage, setStockPercentage] = useState(75); // Start at 75%
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [reservationTimer, setReservationTimer] = useState({ minutes: 5, seconds: 0 });
  const [formData, setFormData] = useState({
    nome: '',
    telefono: '',
    indirizzo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {

    // Google Tag Manager initialization
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });

      // Load GTM script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-WCVD5W8K';
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      }

      // Add noscript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WCVD5W8K" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
      document.body.appendChild(noscript);
    }



    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    const viewersTimer = setInterval(() => {
      setViewersCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);

    // Stock percentage animation
    const stockTimer = setInterval(() => {
      setStockPercentage(prev => {
        const increase = Math.random() > 0.7; // 30% chance to increase
        if (increase && prev < 95) {
          return Math.min(95, prev + Math.floor(Math.random() * 3) + 1); // Increase by 1-3%
        }
        return prev;
      });
    }, 8000); // Every 8 seconds

    return () => {
      clearInterval(timer);
      clearInterval(viewersTimer);
      clearInterval(stockTimer);
    };
  }, []);

  useEffect(() => {
    let reservationInterval: NodeJS.Timeout;
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

  const scrollToOffer = () => {
    const offerSection = document.getElementById('limited-offer');
    if (offerSection) {
      offerSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Funzione per tracciare l'inizio checkout
  const trackInitiateCheckout = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq('track', 'InitiateCheckout', {
          value: 49.99,
          currency: 'EUR',
          content_type: 'product',
          content_name: 'SIX SLIM - Pacchetto Trasformazione Completa',
          content_ids: ['six-slim-complete'],
          num_items: 2
        });
        console.log('✅ InitiateCheckout event tracked');
      } catch (error) {
        console.error('❌ Error tracking InitiateCheckout event:', error);
      }
    }
  };

  const handleOrderClick = () => {
    // Traccia l'evento di inizio checkout
    trackInitiateCheckout();

    setShowOrderPopup(true);
    setReservationTimer({ minutes: 5, seconds: 0 });
  };

  // Funzione per ottenere i cookie di Facebook
  const getCookieValue = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  // Funzione per creare hash SHA256
  const hashData = async (data: string): Promise<string | null> => {
    if (!data) return null;

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Errore durante l\'hashing:', error);
      return null;
    }
  };

  // Funzione per pulire il numero di telefono
  const cleanPhone = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('39')) return cleaned;
    if (cleaned.startsWith('3')) return '39' + cleaned;
    return cleaned;
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOrderSubmit = async () => {
    if (!formData.nome || !formData.telefono || !formData.indirizzo) {
      alert('Per favore, compila tutti i campi obbligatori.');
      return;
    }

    // Previeni invii multipli
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Prepara i dati per Meta con hashing
      const cleanedPhone = cleanPhone(formData.telefono);
      const firstName = formData.nome.split(' ')[0];
      const lastName = formData.nome.split(' ').length > 1 ? formData.nome.split(' ').slice(1).join(' ') : '';

      const completeData = {
        // Dati del form originali
        ...formData,

        // Dati Meta
        fbp: getCookieValue('_fbp'),
        fbc: getCookieValue('_fbc'),
        user_agent: navigator.userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        event_source_url: window.location.href,
        referrer: document.referrer,
        event_name: 'Lead',
        event_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

        // Dati hashati
        nome_hash: await hashData(firstName),
        telefono_hash: await hashData(cleanedPhone),
        cognome_hash: lastName ? await hashData(lastName) : null,

        // Parametri UTM
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        utm_content: new URLSearchParams(window.location.search).get('utm_content'),
        utm_term: new URLSearchParams(window.location.search).get('utm_term'),

        // Altri dati
        page_title: document.title,
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language,

        // Dati prodotto
        product: 'SIX SLIM - Pacchetto Trasformazione Completa',
        price: 49.99,

        // Dati API Worldfilia
        URL: 'https://network.worldfilia.net/manager/inventory/buy/ntm_sixslimglp_2x49.json?api_key=5b4327289caa289c6117c469d70a13bd',
        source_id: '2da1cfad54d3',
        quantity: 2,
        api_key: '5b4327289caa289c6117c469d70a13bd',
        product_code: 'ntm_sixslim_2x49'
      };

      // Invia dati all'API
      const response = await fetch('https://primary-production-625c.up.railway.app/webhook/0b9ed794-a19e-4914-85fd-e4b3a401a489', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeData)
      });

      if (response.ok) {
        // Salva i dati nel localStorage per la thank you page
        localStorage.setItem('orderData', JSON.stringify({
          ...formData,
          orderId: `SIX${Date.now()}`,
          product: 'SIX SLIM - Formula Avanzata',
          price: 49.99
        }));

        // Redirect alla thank you page
        window.location.href = '/ty-sixslim';
      } else {
        throw new Error('Errore nell\'invio dell\'ordine');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Si è verificato un errore. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funzione per i pulsanti CTA che aprono il popup
  const handleDirectOrder = () => {
    // Traccia l'evento di inizio checkout
    trackInitiateCheckout();

    // Apre il popup
    setShowOrderPopup(true);
    setReservationTimer({ minutes: 5, seconds: 0 });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breaking News Banner */}
      <div className="bg-red-600 text-white py-2 px-4 text-center text-sm font-semibold">
        <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>BREAKING NEWS • {viewersCount} persone stanno leggendo questo articolo
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            IL FARMACO DA 100 MILIARDI CHE HA FATTO DIMAGRIRE HOLLYWOOD È STATO "COPIATO"
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-600 mb-6">
            Ricercatori svizzeri rivelano la formula segreta dietro il fenomeno Ozempic®:
            <span className="text-red-600 font-semibold"> ora disponibile come integratore naturale</span>
          </h2>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>📅 29 Giugno 2025</span>
            <span>👁️ 948 463 visualizzazioni</span>
            <span>⏱️ 4 min di lettura</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4">
        {/* News Article Intro */}
        <section className="mb-8">
          <img
            src="images/oz/azioni.jpg"
            alt="Ricerca scientifica integratori"
            className="w-full h-auto object-contain rounded-lg mb-6"

          />
          <div className="prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed mb-4">
              È la storia farmaceutica del secolo. <strong>Ozempic®, originariamente sviluppato per il diabete</strong>, si è
              trasformato nel fenomeno più dirompente dell'industria della perdita di peso. Kim Kardashian, Elon Musk,
              Sharon Osbourne: <strong>centinaia di celebrità hanno ammesso di usarlo</strong>, scatenando una corsa globale
              che ha reso Novo Nordisk l'azienda più preziosa d'Europa, con un valore di mercato di oltre 400 miliardi di dollari.
            </p>

            <p className="text-lg leading-relaxed mb-4">
              <strong>Il problema:</strong> Ozempic® costa oltre €300 al mese, può essere venduto solo su ricetta medica, richiede iniezioni settimanali e ha effetti
              collaterali significativi. Liste d'attesa di mesi. Carenza globale.
              <strong>Il "miracolo" era riservato solo ai ricchi.</strong>
            </p>

            <p className="text-lg leading-relaxed mb-4">
              Fino ad oggi. <strong>un team di ricercatori svizzeri
                avrebbe finalmente "decifrato" il meccanismo molecolare alla base di Ozempic®</strong> facendo cosi crollare le azioni in borsa della casa farmaceutica. La scoperta?
              <strong> È possibile ottenere gli stessi effetti attraverso una combinazione specifica di composti naturali</strong>
              che agiscono sugli identici recettori GLP-1.
            </p>

            <p className="text-lg leading-relaxed mb-4">
              Il risultato di questa ricerca è <strong>Six Slim</strong>, il primo integratore che replica il meccanismo d'azione
              di Ozempic senza iniezioni, senza prescrizione medica e a una frazione del costo.
              <strong>Si ipotizza che questa rivoluzione abbia contribuito al recente crollo del 70% delle azioni Novo Nordisk</strong>,
              dopo anni di crescita ininterrotta.
            </p>

            <p className="text-lg leading-relaxed mb-6 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <strong>⚠️ ATTENZIONE:</strong> Non stiamo parlando del solito "integratore brucia-grassi" che hai già provato.
              Six Slim utilizza una tecnologia completamente diversa, basata sulla modulazione degli ormoni della sazietà.
              <strong>È la prima vera alternativa scientifica a Ozempic®.</strong>
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">Perché Ozempic® Funziona (E Perché Tutti Lo Vogliono)</h3>

            <p className="text-lg leading-relaxed mb-4">
              <strong>Ozempic® non è un normale farmaco per dimagrire.</strong> Agisce sui recettori GLP-1 nel cervello,
              "spegnendo" letteralmente la fame. I pazienti riferiscono di dimenticarsi di mangiare, di <strong>provare disgusto
                per il cibo spazzatura, di sentirsi sazi dopo pochi bocconi.</strong>
            </p>

            <p className="text-lg leading-relaxed mb-6">
              I risultati sono stati <strong>devastanti per l'industria del fitness:</strong> palestre vuote, vendite di
              integratori tradizionali crollate del 40%.
              <strong>Per la prima volta nella storia, esisteva qualcosa che funzionava davvero.</strong>
            </p>

            <img
              src="/images/oz/vs-oz.jpg"
              alt="Impatto industria fitness"
              className="w-full h-auto object-contain rounded-lg mb-6"
            />

            <p className="text-lg leading-relaxed mb-6">
              Ma c'era un problema: <strong>Ozempic® costa €3.600 all'anno</strong>.
            </p>

            <div className="text-center my-8">
              <button
                onClick={handleDirectOrder}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Inizia il Trattamento
              </button>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">La Svolta: Come Six Slim Replica il "Miracolo"</h3>

            <p className="text-lg leading-relaxed mb-6">
              I ricercatori svizzeri hanno identificato una combinazione di <strong>7 composti naturali</strong> che,
              assunti insieme nella giusta proporzione e biodisponibilità, <strong>attivano gli stessi recettori GLP-1 di Ozempic®.</strong>
            </p>

            <p className="text-lg leading-relaxed mb-6">
              La differenza? <strong>Nessuna iniezione. Nessuna prescrizione. Nessun effetto collaterale grave.</strong>
              Solo capsule da assumere prima dei pasti principali. Il costo? Meno di €0.83 al giorno invece di €10.
            </p>
          </div>
        </section>


        {/* Benefits Section */}
        <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 mb-8">
          <img
            src="/images/oz/glp1.webp"
            alt="Six Slim formula"
            className="w-full h-auto object-contain rounded-lg mb-6"
          />
          <h3 className="text-3xl font-bold text-center mb-2">Perché Six Slim È Diverso Da Qualsiasi Cosa Tu Abbia Mai Provato</h3>
          <p className="text-center text-gray-600 mb-8 text-lg">
            Non è un altro "brucia-grassi". È la prima replica naturale della tecnologia Ozempic®
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-3xl mb-3">🧠</div>
              <h4 className="font-bold text-gray-900 mb-2">Blocca la Fame a Livello Cerebrale</h4>
              <p className="text-gray-600 text-sm">Agisce sui recettori GLP-1 come Ozempic®, non sui soliti termogenici</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-bold text-gray-900 mb-2">Risultati Visibili in 72 Ore</h4>
              <p className="text-gray-600 text-sm">Riduzione immediata dell'appetito, non promesse vaghe</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-3xl mb-3">🏆</div>
              <h4 className="font-bold text-gray-900 mb-2">Formula Brevettata 7-in-1</h4>
              <p className="text-gray-600 text-sm">Combinazione unica mai vista prima in commercio</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-3xl mb-3">💉</div>
              <h4 className="font-bold text-gray-900 mb-2">Zero Iniezioni</h4>
              <p className="text-gray-600 text-sm">Stessi meccanismi di Ozempic® senza aghi o prescrizioni</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-3xl mb-3">💰</div>
              <h4 className="font-bold text-gray-900 mb-2">1/10 del Costo di Ozempic®</h4>
              <p className="text-gray-600 text-sm">€1,70/giorno vs €10/giorno del farmaco originale</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-3xl mb-3">🔬</div>
              <h4 className="font-bold text-gray-900 mb-2">Testato su 1.200+ Persone</h4>
              <p className="text-gray-600 text-sm">94% di successo nei test preliminari svizzeri</p>
            </div>
          </div>

          <div className="mt-8 bg-red-100 border border-red-300 rounded-lg p-6">
            <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
              <span>⚠️</span> IMPORTANTE: Questo Non È Un Normale Integratore
            </h4>
            <p className="text-red-700">
              <strong>Six Slim utilizza la stessa via metabolica di un farmaco da miliardi di dollari.</strong>
              Se hai provato altri integratori senza successo, non significa che questo non funzionerà.
              È completamente diverso da tutto quello che hai provato finora.
            </p>
          </div>
        </section>

        {/* Call to Action Button */}
        <div className="text-center my-8">
          <button
            onClick={handleDirectOrder}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Inizia il Trattamento
          </button>
        </div>

        {/* Testimonials */}
        <section className="mb-8">
          <h3 className="text-3xl font-bold text-center mb-2">I Risultati Parlano Chiaro</h3>
          <p className="text-center text-gray-600 mb-8 text-lg">
            Oltre 3.500 europei hanno già provato Six Slim nei test preliminari
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-blue-100 rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="images/donna-1.webp"
                  alt="Maria R."
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Maria R., 45 anni</div>
                  <div className="text-gray-500 text-sm">Milano</div>
                  <div className="flex mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Prima</div>
                  <div className="font-bold text-red-600">92 kg</div>
                  <div className="text-xs text-gray-500 mt-1">Dopo</div>
                  <div className="font-bold text-green-600">83 kg</div>
                </div>
              </div>
              <p className="text-gray-700 italic">"Ho buttato €2.000 in integratori inutili. Six Slim è diverso: in 3 giorni ho smesso di pensare al cibo continuamente. Ho perso 9 kg in 7 settimane senza soffrire."</p>
              <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                ✅ Risultato verificato • Testimonianza autentica
              </div>
            </div>

            <div className="bg-white border-2 border-blue-100 rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="/images/testimonial/marco.webp"
                  alt="Giuseppe T."
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Giuseppe T., 52 anni</div>
                  <div className="text-gray-500 text-sm">Roma</div>
                  <div className="flex mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Prima</div>
                  <div className="font-bold text-red-600">78 kg</div>
                  <div className="text-xs text-gray-500 mt-1">Dopo</div>
                  <div className="font-bold text-green-600">71 kg</div>
                </div>
              </div>
              <p className="text-gray-700 italic">"Mia moglie prendeva Ozempic® ma aveva troppi effetti collaterali. Six Slim le ha dato gli stessi risultati senza nausea. Il nostro medico è rimasto scioccato."</p>
              <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                ✅ Risultato verificato • Testimonianza autentica
              </div>
            </div>

            <div className="bg-white border-2 border-blue-100 rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="/images/testimonial/federica.png"
                  alt="Francesca M."
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Francesca M., 38 anni</div>
                  <div className="text-gray-500 text-sm">Napoli</div>
                  <div className="flex mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Prima</div>
                  <div className="font-bold text-red-600">85 kg</div>
                  <div className="text-xs text-gray-500 mt-1">Dopo</div>
                  <div className="font-bold text-green-600">76 kg</div>
                </div>
              </div>
              <p className="text-gray-700 italic">"Sono un'infermiera, conosco bene Ozempic®. Non credevo che un integratore potesse funzionare così. I miei colleghi mi chiedono cosa sto prendendo."</p>
              <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                ✅ Risultato verificato • Testimonianza autentica
              </div>
            </div>

            <div className="bg-white border-2 border-blue-100 rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="images/donna-2.webp"
                  alt="Laura L."
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Laura L., 41 anni</div>
                  <div className="text-gray-500 text-sm">Torino</div>
                  <div className="flex mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Prima</div>
                  <div className="font-bold text-red-600">103 kg</div>
                  <div className="text-xs text-gray-500 mt-1">Dopo</div>
                  <div className="font-bold text-green-600">91 kg</div>
                </div>
              </div>
              <p className="text-gray-700 italic">"Dovevo perdere peso per motivi di salute ma Ozempic® costava troppo. Six Slim mi ha salvato: -12 kg in 2 mesi, glicemia perfetta, mai più fame nervosa."</p>
              <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                ✅ Risultato verificato • Testimonianza autentica
              </div>
            </div>
          </div>

          <div className="mt-8 text-center bg-blue-50 rounded-lg p-6">
            <h4 className="font-bold text-xl mb-2">📊 Risultati del Test Clinico</h4>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">94%</div>
                <div className="text-sm text-gray-600">Ha perso peso significativo</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">87%</div>
                <div className="text-sm text-gray-600">Ha ridotto l'appetito</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600">96%</div>
                <div className="text-sm text-gray-600">Lo consiglierebbe</div>
              </div>
            </div>
          </div>
        </section>

        {/* Limited Offer */}
        <section id="limited-offer" className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-8 mb-8 text-center">
          <div className="mb-6">
            <div className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-sm mb-4">
              🚨 FORNITURE LIMITATE
            </div>
            <h3 className="text-3xl font-bold mb-2">ATTENZIONE: Stock Quasi Esaurito</h3>
            <p className="text-red-100 text-lg">
              A causa dell'enorme richiesta dopo la diffusione della notizia,
              le scorte si stanno esaurendo rapidamente
            </p>
          </div>

          <img
            src="images/oz/product.png"
            alt="Offerta Six Slim"
            className="w-full h-auto object-contain rounded-lg mb-6"
          />

          <div className="bg-white/10 rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-5xl font-bold mb-2">€49,90</div>

                <div className="text-xl">2 Confezioni = 2 Mesi Completi</div>
                <div className="text-sm text-red-100 mt-2">
                  Invece di €4,33/giorno di Ozempic® → Solo €0,83/giorno
                </div>
              </div>

              <div>
                <div className="bg-black/20 rounded-lg p-4 mb-4">
                  <div className="text-xs text-red-100 mb-2">LE VENDITE CHIUDONO IN:</div>
                  <div className="flex justify-center gap-2 text-3xl font-mono">
                    <div className="bg-white/20 px-2 py-1 rounded">
                      {timeLeft.hours.toString().padStart(2, '0')}
                    </div>
                    <span>:</span>
                    <div className="bg-white/20 px-2 py-1 rounded">
                      {timeLeft.minutes.toString().padStart(2, '0')}
                    </div>
                    <span>:</span>
                    <div className="bg-white/20 px-2 py-1 rounded">
                      {timeLeft.seconds.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="text-xs text-red-100 mt-2">ore : min : sec</div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold">
                    🔥 Rimangono solo {remainingStock} confezioni
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 h-full rounded-full animate-pulse shadow-lg transition-all duration-1000 ease-out"
                      style={{ width: `${stockPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-red-200">
                    ⚠️ Disponibilità quasi terminata
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleOrderClick}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-6 px-8 rounded-lg text-2xl transition-all duration-200 transform hover:scale-105 shadow-2xl"
            >
              ORDINA ORA
            </button>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Garanzia 30 Giorni
              </div>
              <div className="flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" />
                Spedizione Gratuita
              </div>
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pagamento alla Consegna
              </div>
            </div>

            <div className="text-xs text-red-100 mt-4">
              ⚠️ Una volta esaurite le scorte, la prossima produzione sarà disponibile solo tra 4-6 settimane
            </div>
          </div>
        </section>

        {/* Order Popup */}
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

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Riepilogo ordine</h4>
                <div className="flex items-center gap-3">
                  <img
                    src="images/oz/product.png"
                    alt="Six Slim"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm md:text-base">Six Slim - Formula Avanzata</div>
                    <div className="text-xs md:text-sm text-gray-600">Quantità: 2 confezioni</div>
                    <div className="text-xs md:text-sm text-green-600">✅ Spedizione gratuita</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg md:text-xl text-gray-900">€49,90</div>
                    <div className="text-xs text-gray-500 line-through">€129,90</div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome e Cognome</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleFormChange('nome', e.target.value)}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                    placeholder="Il tuo nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numero di Telefono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleFormChange('telefono', e.target.value)}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                    placeholder="Il tuo numero di telefono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo Completo</label>
                  <textarea
                    value={formData.indirizzo}
                    onChange={(e) => handleFormChange('indirizzo', e.target.value)}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-20 md:h-20 text-base resize-none"
                    placeholder="Via, numero civico, città, CAP"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4 mt-4 text-gray-700">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium text-sm md:text-base">Pagamento alla consegna</span>
              </div>

              <button
                onClick={handleOrderSubmit}
                disabled={!formData.nome || !formData.telefono || !formData.indirizzo || isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 text-base md:text-lg"
              >
                {isSubmitting ? 'ELABORANDO...' : 'CONFERMA ORDINE - €49,90'}
              </button>
            </div>
          </div>
        )}

        {/* FAQ */}
        <section className="mb-8">
          <h3 className="text-3xl font-bold text-center mb-6">Le Domande Più Frequenti</h3>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Six Slim funziona davvero come Ozempic®?</h4>
              <p className="text-gray-700 leading-relaxed">Six Slim agisce sugli stessi recettori GLP-1 di Ozempic®, ma attraverso una via naturale. I test preliminari su 1.200+ persone mostrano una riduzione dell'appetito del 70-80%, paragonabile al farmaco originale. La differenza principale è il metodo di somministrazione: orale invece che per iniezione.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">È sicuro? Ci sono effetti collaterali?</h4>
              <p className="text-gray-700 leading-relaxed">Six Slim è formulato con ingredienti naturali certificati e prodotto in stabilimenti GMP. A differenza di Ozempic®, non causa nausea grave o problemi gastrointestinali significativi. Tuttavia, come per qualsiasi integratore, è consigliabile consultare il medico, specialmente se si assumono altri farmaci.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Quanto tempo serve per vedere i risultati?</h4>
              <p className="text-gray-700 leading-relaxed">La maggior parte degli utilizzatori riferisce una riduzione dell'appetito entro 72-96 ore. La perdita di peso visibile inizia generalmente dalla seconda settimana. I risultati ottimali si ottengono con un utilizzo costante di 8-12 settimane.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Cosa succede se non funziona per me?</h4>
              <p className="text-gray-700 leading-relaxed">Offriamo una garanzia totale di rimborso entro 30 giorni. Se non sei completamente soddisfatto dei risultati, ti rimborsiamo l'intero importo senza domande. Il nostro tasso di successo è del 94%, ma comprendiamo che ogni persona è diversa.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-8 text-center">
            <h3 className="text-3xl font-bold mb-4">⚠️ ULTIMA POSSIBILITÀ</h3>
            <p className="text-xl mb-6">
              Le scorte si stanno esaurendo. Non aspettare settembre per la prossima produzione.
            </p>
            <button onClick={handleOrderClick} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-6 px-12 rounded-lg text-2xl transition-all duration-200 transform hover:scale-105 shadow-2xl mb-4">
              ORDINA ORA - ULTIME CONFEZIONI
            </button>
            <div className="text-sm">
              ✅ Garanzia 30 giorni • ✅ Spedizione gratuita • ✅ Pagamento alla consegna
            </div>
          </div>
        </section>

        {/* Legal Disclaimer */}
        <section className="bg-gray-50 rounded-lg p-6 text-xs text-gray-600">
          <h4 className="font-semibold mb-3 text-sm">Informazioni Legali e Disclaimer:</h4>

          <div className="space-y-3">
            <p>
              <strong>Natura del Prodotto:</strong> Six Slim è un integratore alimentare notificato al Ministero della Salute e non un farmaco.
              Non è destinato a diagnosticare, trattare, curare o prevenire alcuna malattia. Le informazioni contenute in questa pagina
              sono solo a scopo informativo e non sostituiscono il parere di un medico qualificato.
            </p>

            <p>
              <strong>Risultati Individuali:</strong> I risultati possono variare significativamente da persona a persona in base a età,
              sesso, condizioni di salute, stile di vita, dieta e altri fattori. Le testimonianze riportate sono esperienze individuali
              autentiche ma non garantiscono risultati identici per tutti gli utilizzatori.
            </p>

            <p>
              <strong>Riferimenti a Ozempic®:</strong> Tutti i riferimenti a Ozempic® (semaglutide) sono utilizzati esclusivamente a
              scopo comparativo e informativo. Six Slim non è prodotto, approvato o affiliato con Novo Nordisk. Ozempic® è un marchio
              registrato di Novo Nordisk A/S. Six Slim agisce su meccanismi simili ma attraverso ingredienti completamente diversi.
            </p>

            <p>
              <strong>Uso e Dosaggio:</strong> Non superare la dose giornaliera consigliata di 2 capsule. Tenere fuori dalla portata
              dei bambini sotto i 3 anni di età. Il prodotto non deve essere considerato un sostituto di una dieta variata ed equilibrata
              e di uno stile di vita sano.
            </p>

            <p>
              <strong>Controindicazioni:</strong> Non utilizzare in caso di gravidanza, allattamento, diabete di tipo 1, disturbi
              alimentari gravi, o se si stanno assumendo farmaci per il diabete senza supervisione medica. Consultare sempre il medico
              prima dell'uso se si hanno condizioni mediche preesistenti o si assumono farmaci.
            </p>

            <p>
              <strong>Responsabilità:</strong> L'utilizzo di Six Slim è sotto la responsabilità dell'utilizzatore. Si consiglia vivamente
              di consultare un medico prima dell'uso, specialmente in presenza di condizioni mediche preesistenti. Non siamo responsabili
              per un uso improprio del prodotto o per la mancata consultazione medica preliminare.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-300">
            <p className="text-center font-semibold">
              Per ulteriori informazioni: info@sixslim.com
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm">© 2025 Six Slim Italia. Tutti i diritti riservati.</p>
          <div className="mt-4 space-x-4 text-sm">
            <a href="#" className="hover:text-gray-300">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300">Termini di Servizio</a>
            <a href="#" className="hover:text-gray-300">Contatti</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SixSlimLanding;