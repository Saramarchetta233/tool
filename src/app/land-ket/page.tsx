"use client";

import React, { useState, useEffect } from 'react';
import { Check, X, Star, Clock, Shield, Heart, Zap, TrendingDown, Award } from 'lucide-react';

const KetoBruciaLanding = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 45,
    seconds: 36
  });
  const [formData, setFormData] = useState({
    nome: '',
    telefono: '',
    indirizzo: '',
    URL: 'https://network.worldfilia.net/manager/inventory/buy/ntm_ketobrucia_4x49.json?api_key=5b4327289caa289c6117c469d70a13bd',
    source_id: '2da1cfad54d3',
    quantity: '4'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
        language: navigator.language
      };

      console.log('Invio dati:', completeData);

      const response = await fetch('https://primary-production-625c.up.railway.app/webhook/0b9ed794-a19e-4914-85fd-e4b3a401a489', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeData)
      });

      // Reindirizza sempre (per semplicità)
      window.location.href = '/ty-keto';

    } catch (error) {
      console.error('Errore:', error);
      // Reindirizza anche in caso di errore
      window.location.href = '/ty-keto';
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToPricing = () => {
    const element = document.getElementById('pricing-section');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    {
      name: "Elena M.",
      age: 45,
      city: "Milano",
      result: "-8 kg in 6 settimane",
      text: "Dopo la menopausa pensavo fosse impossibile perdere peso. Keto Brucia ha riattivato il mio metabolismo e ora mi sento come a 30 anni!",
      stars: 5,
      image: "/images/donna-1.webp"
    },
    {
      name: "Giulia R.",
      age: 42,
      city: "Roma",
      result: "-6 kg in 4 settimane",
      text: "Il gonfiore addominale che mi tormentava è completamente sparito. Finalmente posso indossare i miei vestiti preferiti!",
      stars: 5,
      image: "/images/donna-2.webp"
    },
    {
      name: "Francesca L.",
      age: 50,
      city: "Torino",
      result: "-10 kg in 8 settimane",
      text: "I miei valori ormonali si sono normalizzati e ho ritrovato l'energia che avevo perso. È stata una trasformazione incredibile!",
      stars: 5,
      image: "/images/donna-3.webp"
    }
  ];

  const benefits = [
    "Riattiva il metabolismo bloccato",
    "Elimina il gonfiore addominale",
    "Equilibra gli ormoni naturalmente",
    "Accelera la perdita di peso",
    "Aumenta i livelli di energia",
    "Migliora la digestione"
  ];

  const problems = [
    "Pancia gonfia che peggiora durante il giorno",
    "Bilancia bloccata nonostante la dieta",
    "Metabolismo rallentato dopo i 40",
    "Stanchezza cronica e mancanza di energia",
    "Difficoltà a perdere peso in menopausa",
    "Squilibri ormonali che sabotano i risultati"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header con countdown */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-4">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Offerta Limitata scade tra:</span>
            <div className="flex space-x-2">
              <div className="bg-white text-pink-600 px-2 py-1 rounded font-bold text-sm">
                {String(timeLeft.hours).padStart(2, '0')}h
              </div>
              <div className="bg-white text-pink-600 px-2 py-1 rounded font-bold text-sm">
                {String(timeLeft.minutes).padStart(2, '0')}m
              </div>
              <div className="bg-white text-pink-600 px-2 py-1 rounded font-bold text-sm">
                {String(timeLeft.seconds).padStart(2, '0')}s
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={scrollToPricing}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Inizia il Trattamento
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-rose-100 text-rose-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Star className="w-4 h-4 mr-2" />
            Oltre 2.847 donne hanno già trasformato il loro corpo
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Con i Bio-Estrogeni le Donne<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
              Over 40 Perdono Fino a 4kg
            </span><br />
            in 7 Giorni <span className="text-green-600">SENZA RIPRENDERLI</span><br />
            <span className="text-2xl md:text-3xl text-gray-600">senza Diete Estreme</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Il primo integratore naturale che riattiva il tuo metabolismo bloccato e
            riequilibra gli ormoni per una perdita di peso rapida e duratura dopo i 40 anni
          </p>
        </div>

        {/* Problems Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-gray-100">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Ti riconosci in questi problemi?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {problems.map((problem, index) => (
              <div key={index} className="flex items-start space-x-3">
                <X className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                <p className="text-gray-700 font-medium">{problem}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <div className="mb-6">
              <img
                src="images/donna-1.jpg"
                alt="Donna"
                className="rounded-2xl shadow-lg mx-auto max-w-md w-full"
              />
            </div>

            <p className="text-2xl font-bold text-rose-600 mb-4">
              Non è colpa tua!
            </p>
            <p className="text-gray-600 text-lg">
              Dopo i 40 anni, i tuoi recettori ormonali si "addormentano" e il metabolismo rallenta del 35%.
              Ecco perché tutto quello che hai provato finora non ha funzionato.
            </p>

            <div className="mt-8">
              <button
                onClick={scrollToPricing}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Inizia il Trattamento
              </button>
            </div>
          </div>
        </div>

        {/* Hormonal Circle Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 mb-12 border border-blue-200">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Il "Circolo Vizioso Ormonale" che Blocca il Tuo Dimagrimento Dopo i 40
          </h2>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
            <div>
              <p className="text-lg text-gray-700 mb-6">
                Dopo i 40 anni, i tuoi recettori ormonali iniziano a "spegnere il motore".
                È come avere un termostato metabolico che gradualmente smette di funzionare:
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <p className="text-gray-700">I recettori degli estrogeni perdono sensibilità</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <p className="text-gray-700">La produzione di estrogeni crolla del 67%</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <p className="text-gray-700">Il metabolismo rallenta fino al 35%</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <img
                src="images/infografica-1.jpg"
                alt="Grafico declino ormonale"
                className="rounded-xl shadow-lg mx-auto max-w-sm w-full"
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Perché gli Estrogeni Sono Fondamentali
              </h3>
              <p className="text-gray-600 mb-4">
                Non sono semplici ormoni riproduttivi, ma i veri "direttori d'orchestra" del tuo metabolismo:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Regolano dove si accumula il grasso nel corpo</li>
                <li>• Mantengono attivo il metabolismo 24/7</li>
                <li>• Controllano fame e sazietà</li>
                <li>• Equilibrano i livelli di insulina</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-red-800 mb-4">
              Ecco Perché Tutto Quello che Hai Provato NON Ha Funzionato:
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Diete Drastiche</p>
                  <p className="text-red-700 text-sm">Peggiorano il metabolismo e riducono ancora di più gli estrogeni</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Allenamenti Intensi</p>
                  <p className="text-red-700 text-sm">Senza equilibrio ormonale, il corpo non riesce a bruciare i grassi</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Brucia Grassi Tradizionali</p>
                  <p className="text-red-700 text-sm">Ignorano completamente il problema degli estrogeni inattivi</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Trattamenti Estetici</p>
                  <p className="text-red-700 text-sm">Effetti temporanei che non risolvono la causa ormonale</p>
                </div>
              </div>
            </div>

            <div className="bg-red-100 rounded-lg p-4 mt-6">
              <p className="text-red-800 font-semibold text-center">
                💡 La Verità: Senza riequilibrare gli estrogeni, ogni tentativo di dimagrire è destinato al fallimento.
                È come cercare di svuotare una barca che fa acqua senza prima riparare la falla.
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-green-800 mb-4 text-center">
              🌟 Ma C'è una Speranza! 🌟
            </h3>

            <p className="text-green-700 text-lg mb-4 text-center">
              Immagina di poter "risvegliare" dolcemente questi recettori addormentati.
              Di ritrovare quella comunicazione perfetta che il tuo corpo aveva a 30 anni.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-green-800 mb-3">Quando i Bio-Estrogeni si Riequilibrano:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">Il metabolismo si riattiva completamente</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">Il grasso si allontana dalla pancia</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">Il gonfiore persistente scompare</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">L'energia vitale ritorna</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-3">Il Segreto: Lignano-Complex™</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                    <p className="text-gray-700 text-sm">Si lega ai recettori degli estrogeni "addormentati"</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                    <p className="text-gray-700 text-sm">Biodisponibilità superiore del 312%</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                    <p className="text-gray-700 text-sm">Riattiva la sensibilità in 72 ore</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={scrollToPricing}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Inizia il Trattamento
            </button>
          </div>
        </div>

        {/* Scientific Formula Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-gray-100">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            La Formula Scientifica che Cambia Tutto
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
              <div className="text-center mb-4">
                <img
                  src="images/lino.webp"
                  alt="Semi di lino"
                  className="w-24 h-24 rounded-full mx-auto object-cover shadow-lg"
                />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-3 text-center">Lino Concentrato</h3>
              <p className="text-green-700 text-sm mb-3">
                <strong>Non il comune lino!</strong> Il nostro estratto è standardizzato al 40% in lignani attivi.
              </p>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  Lino comune: 0,5-1% lignani<br />
                  <span className="font-bold text-green-700">Nostro estratto: 40% lignani</span>
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl p-6 border border-emerald-200">
              <div className="text-center mb-4">
                <img
                  src="https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                  alt="Foglie di tè verde"
                  className="w-24 h-24 rounded-full mx-auto object-cover shadow-lg"
                />
              </div>
              <h3 className="text-xl font-bold text-emerald-800 mb-3 text-center">Tè Verde Premium</h3>
              <p className="text-emerald-700 text-sm mb-3">
                Concentrato al 98% in polifenoli attivi che accelerano la termogenesi.
              </p>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  Tè verde comune: 10-15%<br />
                  <span className="font-bold text-emerald-700">Nostro estratto: 98%</span>
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 border border-blue-200">
              <div className="text-center mb-4">
                <img
                  src="https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                  alt="Fagioli bianchi"
                  className="w-24 h-24 rounded-full mx-auto object-cover shadow-lg"
                />
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-3 text-center">Fagiolo Bianco</h3>
              <p className="text-blue-700 text-sm mb-3">
                Faseolamina concentrata 3000:1 per bloccare l'assorbimento dei carboidrati.
              </p>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <span className="font-bold text-blue-700">1 capsula = 1kg di fagioli</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mt-8 border border-purple-200">
            <h3 className="text-2xl font-bold text-center text-purple-900 mb-4">
              Oltre il Dimagrimento: Un Benessere Totale
            </h3>
            <p className="text-purple-800 text-center mb-6">
              Riequilibrare i bio-estrogeni non significa solo perdere peso.
              Significa ritrovare quella vitalità che pensavi perduta per sempre.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl mb-2">😴</div>
                <p className="text-sm font-semibold text-purple-800">Sonno Profondo</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">😊</div>
                <p className="text-sm font-semibold text-purple-800">Umore Stabile</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-sm font-semibold text-purple-800">Pelle Luminosa</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <p className="text-sm font-semibold text-purple-800">Energia Costante</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={scrollToPricing}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Inizia il Trattamento
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl text-white p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              La Soluzione Rivoluzionaria: Keto Brucia
            </h2>
            <p className="text-xl opacity-90">
              Formula brevettata con Lignano-Complex™ che risveglia i tuoi bio-estrogeni
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Riattiva il Metabolismo</h3>
              <p className="opacity-90">Risveglia i recettori ormonali "addormentati"</p>
            </div>

            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Elimina il Gonfiore</h3>
              <p className="opacity-90">Riduce l'infiammazione e migliora la digestione</p>
            </div>

            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Equilibra gli Ormoni</h3>
              <p className="opacity-90">Ripristina l'equilibrio ormonale naturale</p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            I Benefici che Otterrai
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start space-x-3">
                  <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 font-medium">{benefit}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={scrollToPricing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Inizia il Trattamento
            </button>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Storie di Successo Reali
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="mb-6" style={{ height: '300px' }}>

                  <img src={testimonial.image} alt={`Evoluzione ${testimonial.name}`}
                    style={{ height: '300px' }}
                    className="w-full h-48 rounded-xl object-cover shadow-lg" />

                  <div className="text-center mt-3">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {testimonial.result}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center mb-4" style={{ marginTop: '50px' }}>
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>

                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900 text-lg">
                    {testimonial.name}, {testimonial.age} anni
                  </p>
                  <p className="text-gray-500">{testimonial.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Showcase */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl text-white p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Keto Brucia</h2>
            <p className="text-xl opacity-90">
              Formula Avanzata con Lignano-Complex™ al 40%
            </p>

            <div className="mt-6">
              <img
                src="images/keto-brucia-1.jpg"
                alt="Keto Brucia integratore"
                className="mx-auto rounded-2xl shadow-xl max-w-xs"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl p-6 mb-6">
                <h3 className="text-2xl font-bold mb-4">Cosa Rende Keto Brucia Unico?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>Lignano-Complex™ standardizzato al 40%</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>Estratti vegetali certificati biologici</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>Formula scientificamente testata</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>Zero effetti collaterali</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white bg-opacity-10 rounded-2xl p-8">
                <div className="text-6xl mb-4">💊</div>
                <h3 className="text-2xl font-bold mb-2">120 Capsule</h3>
                <p className="opacity-90 mb-4">Fornitura per 4 mesi</p>
                <div className="bg-pink-600 text-white rounded-full py-2 px-4 inline-block">
                  <span className="text-sm">Dosaggio Base: 1 capsula x 1 volta al giorno</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing-section" className="bg-white rounded-2xl shadow-2xl p-8 mb-12 border-4 border-pink-200">
          <div className="text-center mb-8">
            <img
              src="images/keto-brucia-4x.jpg"
              alt="Pacchetto Keto Brucia"
              className="mx-auto rounded-2xl shadow-lg max-w-md w-full"
            />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Clock className="w-4 h-4 mr-2" />
              Offerta Limitata - Solo per Oggi
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pacchetto Trasformazione Completa
            </h2>

            <div className="flex items-center justify-center space-x-4 mb-6">
              <span className="text-2xl text-gray-500 line-through">€199,96</span>
              <span className="text-5xl font-bold text-pink-600">€49,99</span>
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                -75%
              </div>
            </div>

            <p className="text-gray-600 mb-8">
              4 Confezioni di Keto Brucia + Bonus Gratuiti
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cosa Ricevi:</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>4 Confezioni Keto Brucia (4 mesi di trattamento, valore 150€)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Guida Alimentare Keto-Friendly (valore €29)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Piano di Allenamento Metabolico (valore €39)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Consulenza WhatsApp con specialista sempre disponibile per 4 mesi (valore 99€)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Garanzie:</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span>Garanzia Soddisfatti o Rimborsati 365 giorni</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span>Certificazione Biologica Europea</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>Testato da oltre 3.000 donne</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 mb-6 border border-pink-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Compila per Completare l'Ordine
              </h3>

              <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                <div>
                  <input
                    type="text"
                    name="nome"
                    placeholder="Nome e Cognome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="Telefono Cellulare"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="indirizzo"
                    placeholder="Indirizzo e N. Civico"
                    value={formData.indirizzo}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold py-4 px-12 rounded-full text-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? 'ELABORAZIONE...' : 'ORDINA ORA'}
                </button>
              </form>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              🔒 Pagamento alla consegna - Spedizione gratuita in 24/48h
            </p>
          </div>
        </div>

        {/* Guarantee Section */}
        <div className="bg-green-50 rounded-2xl p-8 mb-12 border border-green-200">
          <div className="text-center">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              Garanzia Soddisfatti o Rimborsati al 100%
            </h2>
            <p className="text-green-700 text-lg mb-4">
              Hai 365 giorni per provare Keto Brucia. Se non ottieni i risultati promessi,
              ti rimborsiamo ogni centesimo senza domande.
            </p>
            <p className="text-green-600 font-semibold">
              Non dovrai nemmeno restituire il prodotto!
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Domande Frequenti
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Quanto tempo ci vuole per vedere i primi risultati?",
                a: "La maggior parte delle donne nota una riduzione del gonfiore già nei primi 3-5 giorni. I risultati sulla perdita di peso diventano evidenti dalla seconda settimana."
              },
              {
                q: "È sicuro per chi è in menopausa?",
                a: "Assolutamente sì. Keto Brucia è formulato specificamente per le donne dopo i 40 anni e durante la menopausa, con ingredienti naturali che supportano l'equilibrio ormonale."
              },
              {
                q: "Ci sono effetti collaterali?",
                a: "Keto Brucia è composto da ingredienti naturali certificati biologici. Non sono stati riportati effetti collaterali nelle nostre ricerche cliniche."
              },
              {
                q: "Come funziona la garanzia?",
                a: "Hai 365 giorni per provare il prodotto. Se non sei soddisfatta, invia una email e riceverai il rimborso completo senza dover restituire nulla."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl text-white p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Non Rimandare la Tua Trasformazione
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Ogni giorno che passa è un giorno in più che il tuo metabolismo rimane bloccato.
            Inizia oggi stesso il tuo percorso verso una nuova te.
          </p>

          <button
            onClick={scrollToPricing}
            className="bg-white text-pink-600 font-bold py-4 px-12 rounded-full text-xl shadow-lg transform hover:scale-105 transition-all duration-200 hover:bg-gray-50"
          >
            SÌ, VOGLIO TRASFORMARE IL MIO CORPO
          </button>

          <p className="text-sm mt-4 opacity-80">
            ⚡ Offerta limitata - Scade in poche ore
          </p>
        </div>
      </div>
    </div>
  );
};

export default KetoBruciaLanding;