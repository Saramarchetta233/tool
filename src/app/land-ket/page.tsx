"use client";
import React, { useState, useEffect } from 'react';

const SuissenLabLanding: React.FC = () => {
  const [formData, setFormData] = useState({
    nome: '',
    telefono: '',
    indirizzo: '',
    URL: 'https://network.worldfilia.net/manager/inventory/buy/ntm_sixslim_2x49.json?api_key=5b4327289caa289c6117c469d70a13bd',
    source_id: '2da1cfad54d3',
    quantity: '2'
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
      window.location.href = '/ty-sixslim';

    } catch (error) {
      console.error('Errore:', error);
      // Reindirizza anche in caso di errore
      window.location.href = '/ty-sixslim';
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-white py-6 border-b border-yellow-400">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <img src="/images/six-slim/suisse-lab-logo.jpg" alt="SUISSENLAB+" className="h-10" />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-black mb-8 leading-tight">
                Brucia il <span className="text-yellow-400">GRASSO</span> su pancia,<br />
                fianchi e cosce.
              </h1>

              <p className="text-xl mb-10 text-gray-300 font-light">
                L'integratore STUDIATO SPECIFICATAMENTE per eliminare il<br />
                <span className="text-yellow-400 font-semibold">GRASSO VISCERALE</span>
              </p>

              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-black text-lg font-bold">✓</span>
                  </div>
                  <p className="text-sm font-medium">
                    <span className="text-yellow-400">FORMULA SCIENTIFICA BREVETTATA</span> DA SUISSELAB-® SPECIFICA PER IL GRASSO LOCALIZZATO
                  </p>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-black text-lg font-bold">✓</span>
                  </div>
                  <p className="text-sm font-medium">
                    <span className="text-yellow-400">ADATTO A UOMINI E DONNE</span> CHE NON HANNO LA POSSIBILITÀ DI PASSARE ORE IN PALESTRA
                  </p>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-black text-lg font-bold">✓</span>
                  </div>
                  <p className="text-sm font-medium">
                    <span className="text-yellow-400">MISURA LA TUA CIRCONFERENZA OGNI SETTIMANA!</span> RIDUZIONE DEL GRASSO ADDOMINALE GARANTITA O RIMBORSATA
                  </p>
                </div>
              </div>

              <div className="flex gap-8 mb-12">
                <div className="text-center">
                  <div className="p-4 rounded-2xl mb-3">
                    <img src="/images/six-slim/swiss-formula.png" alt="Swiss Flag" className="w-10 h-10" />
                  </div>
                  <p className="text-xs font-semibold">
                    <span className="text-yellow-400">SWISS</span><br />
                    FORMULA
                  </p>
                </div>

                <div className="text-center">
                  <div className="p-4 rounded-2xl mb-3">
                    <img src="/images/six-slim/soddisfatti-o-rimborsati.png" alt="Guarantee" className="w-10 h-10" />
                  </div>
                  <p className="text-xs font-semibold">
                    <span className="text-yellow-400">SODDISFATTI</span><br />
                    O RIMBORSATI
                  </p>
                </div>

                <div className="text-center">
                  <div className="p-4 rounded-2xl mb-3">
                    <img src="/images/six-slim/spedizione-gratis.png" alt="Free Shipping" className="w-10 h-10" />
                  </div>
                  <p className="text-xs font-semibold">
                    <span className="text-yellow-400">SPEDIZIONE</span><br />
                    GRATUITA
                  </p>
                </div>
              </div>

              <button
                onClick={() => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black py-5 px-10 rounded-2xl text-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                <span className="flex items-center gap-3">
                  📞 ORDINA SUBITO! (-30%)
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <img src="/images/six-slim/uomo-fatburner.jpg" alt="Fit man torso" className="max-w-full h-auto rounded-3xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embarrassing Situations Section */}
      <div className="bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-black text-center mb-16 text-white">
            QUANTE VOLTE TI E' CAPITATO DI <span className="text-yellow-400">VERGOGNARTI</span> PER:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-gray-900 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <div className="mb-6">
                <img src="/images/six-slim/maniglie-amore.jpg" alt="Love handles" className="w-full h-52 object-cover rounded-2xl" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-red-500 text-2xl">✗</span>
                <p className="font-bold text-red-400 text-lg">Quelle odiose MANIGLIE DELL'AMORE</p>
              </div>
              <p className="text-gray-300">
                un fastidiosissimo punto dove si vanno a formare cumuli di grasso.
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <div className="mb-6">
                <img src="/images/six-slim/pancia.jpg" alt="Beach belly" className="w-full h-52 object-cover rounded-2xl" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-red-500 text-2xl">✗</span>
                <p className="font-bold text-red-400 text-lg">Quell'imbarazzante pancia.</p>
              </div>
              <p className="text-gray-300">
                Impossibile da buttare giù anche stando attenti all'alimentazione e facendo sforzi.
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <div className="mb-6">
                <img src="/images/six-slim/uomo-donna.jpg" alt="Beach couple" className="w-full h-52 object-cover rounded-2xl" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-red-500 text-2xl">✗</span>
                <p className="font-bold text-red-400 text-lg">Non sentirti a tuo agio</p>
              </div>
              <p className="text-gray-300">
                in situazione particolari, a causa del tuo fisico che non ti valorizza!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-black text-center mb-6 text-white">
            QUANTO MIGLIOREREBBE LA TUA VITA, CON <span className="text-yellow-400">5-10-15 KG</span> DI
          </h2>
          <h2 className="text-4xl lg:text-5xl font-black text-center mb-16 text-white">
            GRASSO IN MENO SU ADDOMINALI E FIANCHI?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-lg font-bold">✓</span>
                </div>
                <p className="text-gray-200 font-medium">
                  IMMAGINA DI <span className="text-yellow-400 font-bold">AVERE GIÀ IL FISICO CHE DESIDERI</span>, CON GLI ADDOMINALI IN VISTA. QUANTO SARESTI SODDISFATTO DI TE STESSO?
                </p>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-lg font-bold">✓</span>
                </div>
                <p className="text-gray-200 font-medium">
                  IMMAGINA <span className="text-yellow-400 font-bold">COME TI GUARDEREBBERO LE ALTRE PERSONE</span>: AMICHE E AMICI
                </p>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-lg font-bold">✓</span>
                </div>
                <p className="text-gray-200 font-medium">
                  IMMAGINA DI <span className="text-yellow-400 font-bold">POTER INDOSSARE VESTITI CHE AL MOMENTO TI FAREBBERO SBIGARARE</span>
                </p>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-lg font-bold">✓</span>
                </div>
                <p className="text-gray-200 font-medium">
                  MIGLIORA LA TUA <span className="text-yellow-400 font-bold">SALUTE</span>
                </p>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-lg font-bold">✓</span>
                </div>
                <p className="text-gray-200 font-medium">
                  MIGLIORA LA TUA <span className="text-yellow-400 font-bold">ENERGIA E LA TUA VOGLIA DI VIVERE APPIENO</span>
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <img src="/images/six-slim/man-fisico-buono.jpg" alt="Fit couple" className="max-w-full h-auto rounded-3xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-3xl"></div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <button
              onClick={() => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black py-5 px-10 rounded-2xl text-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              <span className="flex items-center gap-3">
                📞 ORDINA SUBITO! (-30%)
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Full Width Image Placeholder */}
      <div className="w-full">
        <img
          src="/images/six-slim/bg-trasform.jpg"
          alt="Full width promotional image"
          className="w-full h-auto"
        />
      </div>

      {/* How it Works Section */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-black text-center mb-16 text-white">
            COME FUNZIONA <span className="text-yellow-400">SIX SLIM-FAST</span> ®?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <p className="text-xl mb-8 text-gray-200 font-medium">
                <span className="text-yellow-400 font-bold">SIX SLIM-FAST</span> contiene una formula <span className="text-yellow-400 font-bold">BREVETTATA</span> dai ricercatori di <span className="text-yellow-400 font-bold">SUISSELAB</span> per:
              </p>

              <div className="flex items-start gap-4 p-6 bg-gray-800 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-lg font-bold">✓</span>
                </div>
                <p className="text-gray-200 font-medium">
                  Aumentare il <span className="text-yellow-400 font-bold">METABOLISMO BASALE</span> e quindi <span className="text-yellow-400 font-bold">CONSUMARE PIÙ CALORIE</span> anche a riposo (entro <span className="text-yellow-400 font-bold">BRUCIA GRASSI</span>)
                </p>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-800 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-lg font-bold">✓</span>
                </div>
                <p className="text-gray-200 font-medium">
                  Stabilizzare i livelli di <span className="text-yellow-400 font-bold">GLICEMIA</span>. Ad ogni picco di glicemia corrisponde un picco di fame, controllando la glicemia avrai meno attacchi di fame.
                </p>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-800 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-lg font-bold">✓</span>
                </div>
                <p className="text-gray-200 font-medium">
                  Contiene un particolare ingrediente: <span className="text-yellow-400 font-bold">Deoxynojirimycin (DNJ)</span>.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <img src="/images/six-slim/picco-glicemico-compressor.jpg" alt="Metabolism Chart" className="max-w-full h-auto rounded-3xl border border-gray-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Before/After Gallery */}
      <div className="bg-black py-12 border-y border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <img
              src="/images/six-slim/bg-trasform.jpg"
              alt="Before and After Transformations Grid"
              className="max-w-full h-auto rounded-2xl border border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* How to Use Section */}
      <div className="bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-black mb-16 text-white">
            COME UTILIZZARE <span className="text-yellow-400">SIX-SLIM</span> ®?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex justify-center">
              <div className="relative">
                <img src="/images/six-slim/prodotto.png" alt="Rebody Slim Bottle" className="max-w-full h-auto" />
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-black px-4 py-2 rounded-xl font-bold text-sm">
                  60 COMPRESSE
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4 p-6 bg-gray-900 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black font-bold">●</span>
                </div>
                <p className="text-gray-200">
                  La confezione contiene ben <span className="text-yellow-400 font-bold">60 COMPRESSE, sufficienti per 2 MESI</span> di trattamento. Al termine dei due mesi vedrai una grossa differenza rispetto al punto di partenza.
                </p>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-900 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black font-bold">●</span>
                </div>
                <p className="text-gray-200">
                  Prima di iniziare il trattamento con <span className="text-yellow-400 font-bold">SIX-SLIM, scattati una foto</span> a torso nudo davanti alla specchio e prendi la misura delle tue circonferenze di vita e fianchi di partenza (è lì che si concentra l'azione di SIX-SLIM)
                </p>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-900 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black font-bold">●</span>
                </div>
                <p className="text-gray-200">
                  Dal giorno seguente, inizia ad assumere <span className="text-yellow-400 font-bold">1 compressa prima o dopo uno dei due pasti</span>. Già dai primi giorni inizierai a percepire un abbassamento del livello di fame e una riduzione degli attacchi di fame
                </p>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-900 rounded-2xl border border-gray-700">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black font-bold">●</span>
                </div>
                <p className="text-gray-200">
                  Dopo le prime <span className="text-yellow-400 font-bold">2 settimane di utilizzo riprendi le misure delle tue circonferenze e confrontale con quelle iniziali. Se non noti dei miglioramenti, CHIEDICI IL RIMBORSO!</span>
                </p>
              </div>

              <div className="mt-12 text-center">
                <button
                  onClick={() => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black py-5 px-10 rounded-2xl text-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <span className="flex items-center gap-3">
                    📞 ORDINA SUBITO! (-30%)
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-black py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-black text-center mb-16 text-white">
            PERCHE' SCEGLIERE <span className="text-yellow-400">SIX-SLIM</span> ®?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300 text-center">
              <div className="mb-8">
                <div className="bg-white p-6 rounded-3xl inline-block">
                  <img src="/images/six-slim/svizzera.jpg" alt="Swiss Flag" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">
                Formula Svizzera<br />
                <span className="text-yellow-400">BREVETTATA</span>
              </h3>
            </div>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300 text-center">
              <div className="mb-8">
                <div className="bg-white p-6 rounded-3xl inline-block">
                  <img src="/images/six-slim/sicuro.jpg" alt="Quality Certified" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">
                Qualità<br />
                <span className="text-yellow-400">Certificata</span>
              </h3>
            </div>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300 text-center">
              <div className="mb-8">
                <div className="bg-white p-6 rounded-3xl inline-block">
                  <img src="/images/six-slim/soddisfatto.jpg" alt="100% Satisfaction" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">
                100% <span className="text-yellow-400">SODDISFATTO</span><br />
                O RIMBORSATO
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300 text-center">
              <div className="mb-8">
                <div className="bg-white p-6 rounded-3xl inline-block">
                  <img src="/images/six-slim/consegna-gratis.jpg" alt="Free Shipping" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">
                Spedizione<br />
                <span className="text-yellow-400">Gratuita</span>
              </h3>
            </div>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300 text-center">
              <div className="mb-8">
                <div className="bg-white p-6 rounded-3xl inline-block">
                  <img src="/images/six-slim/pagamento-consegna.jpg" alt="Cash on Delivery" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">
                Paga alla<br />
                <span className="text-yellow-400">Consegna</span>
              </h3>
            </div>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300 text-center">
              <div className="mb-8">
                <div className="bg-white p-6 rounded-3xl inline-block">
                  <img src="/images/six-slim/piu-venduto.jpg" alt="Bestseller" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">
                Il Più<br />
                <span className="text-yellow-400">Venduto</span>
              </h3>
            </div>
          </div>
        </div>
      </div>



      {/* Order Section */}
      <div id="order-section" className="bg-black py-20 border-y-4 border-yellow-400">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-10 border border-gray-700">
            <div className="text-center mb-12">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-3 px-8 rounded-full inline-block mb-6 font-bold text-lg">
                🕒 Offerta Limitata - Solo per Oggi
              </div>
              <h2 className="text-4xl font-black mb-6 text-white">
                Pacchetto <span className="text-yellow-400">Trasformazione Completa</span>
              </h2>

              <div className="mb-8">
                <img src="/images/six-slim/prodotto.png" alt="2x Six Slim Bottles" className="w-full max-w-full mx-auto rounded-2xl object-contain" />
              </div>

              <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-2 md:gap-6">
                  <span className="text-yellow-400 text-4xl md:text-5xl font-black text-center md:order-2">€49,99</span>
                  <div className="flex items-center justify-center gap-4 md:order-1">
                    <span className="text-gray-400 line-through text-xl md:text-2xl">€99,96</span>
                    <span className="bg-red-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-lg md:text-xl font-bold">-50%</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 mb-12 text-xl">2 Confezioni di SIX SLIM + Bonus Gratuiti</p>
              <p className="text-gray-200 font-medium">Spedizione GRATUITA e pagamento alla consegna</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div>
                <h3 className="text-2xl font-bold mb-8 text-yellow-400">Cosa Ricevi:</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-2xl border border-gray-700">
                    <span className="text-yellow-400 text-2xl">✓</span>
                    <p className="text-gray-200 font-medium">2 Confezioni SIX SLIM (4 mesi di trattamento, valore 150€)</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-2xl border border-gray-700">
                    <span className="text-yellow-400 text-2xl">✓</span>
                    <p className="text-gray-200 font-medium">Guida Alimentare Bruciagrassi (valore €29)</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-2xl border border-gray-700">
                    <span className="text-yellow-400 text-2xl">✓</span>
                    <p className="text-gray-200 font-medium">Consulenza WhatsApp con specialista sempre disponibile per 4 mesi (valore 99€)</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-8 text-yellow-400">Garanzie:</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-2xl border border-gray-700">
                    <span className="text-blue-400 text-2xl">🛡</span>
                    <p className="text-gray-200 font-medium">Garanzia Soddisfatti o Rimborsati 365 giorni</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-2xl border border-gray-700">
                    <span className="text-yellow-400 text-2xl">🏆</span>
                    <p className="text-gray-200 font-medium">Certificazione Biologica Europea</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-2xl border border-gray-700">
                    <span className="text-red-400 text-2xl">❤</span>
                    <p className="text-gray-200 font-medium">Testato da oltre 3.000 persone</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700" style={{ padding: '0px', border: '0px' }}>
              <h3 className="text-3xl font-black text-center mb-10 text-white">Compila per Completare l'Ordine</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  name="nome"
                  placeholder="Nome e Cognome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full p-5 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white placeholder-gray-400 text-lg disabled:opacity-50"
                />
                <input
                  type="tel"
                  name="telefono"
                  placeholder="Telefono Cellulare"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full p-5 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white placeholder-gray-400 text-lg disabled:opacity-50"
                />
                <input
                  type="text"
                  name="indirizzo"
                  placeholder="Indirizzo e N. Civico"
                  value={formData.indirizzo}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full p-5 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white placeholder-gray-400 text-lg disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black py-6 px-8 rounded-2xl text-2xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? 'ELABORAZIONE...' : 'ORDINA ORA'}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-gray-300 font-medium">
                  🔒 Pagamento alla consegna - Spedizione gratuita in 24/48h
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-4xl font-black text-center mb-16 text-white">
            <span className="text-yellow-400">Domande</span> Frequenti
          </h2>

          <div className="space-y-8">
            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Quanto tempo ci vuole per vedere i primi risultati?</h3>
              <p className="text-gray-200 text-lg leading-relaxed">
                La maggior parte delle persone nota una riduzione del gonfiore già nei primi 5-7 giorni. I risultati sulla perdita di peso diventano evidenti dalla seconda settimana.
              </p>
            </div>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Ha delle controindicazioni?</h3>
              <p className="text-gray-200 text-lg leading-relaxed">
                Six Slim è assolutamente sicuro, è approvato dal Ministero della Salute Italiano.
              </p>
            </div>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Ci sono effetti collaterali?</h3>
              <p className="text-gray-200 text-lg leading-relaxed">
                Six Slim è composto da ingredienti naturali certificati biologici. Non sono stati riportati effetti collaterali nelle nostre ricerche cliniche.
              </p>
            </div>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Come funziona la garanzia?</h3>
              <p className="text-gray-200 text-lg leading-relaxed">
                Hai 365 giorni per provare il prodotto. Se non sei soddisfatto, invia una email e riceverai il rimborso completo senza dover restituire nulla.
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Final CTA Section */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 text-black py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
            Non Rimandare la Tua <span className="underline">Trasformazione</span>
          </h2>
          <p className="text-xl mb-12 font-medium max-w-4xl mx-auto leading-relaxed">
            Ogni giorno che passa è un giorno in più che il tuo metabolismo rimane bloccato. Inizia oggi stesso il tuo percorso verso una nuova te.
          </p>

          <button
            onClick={() => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative bg-black text-yellow-400 font-black py-6 px-12 rounded-3xl text-2xl hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-2xl border-4 border-black hover:border-gray-800"
          >
            <span className="flex items-center gap-4">
              SÌ, VOGLIO TRASFORMARE IL MIO CORPO
            </span>
          </button>

          <p className="text-lg mt-6 font-bold opacity-90">
            ⚡ Offerta limitata - Scade in poche ore
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-black py-12 border-t border-yellow-400">
        <div className="container mx-auto px-4 text-center">
          <button
            onClick={() => document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black py-5 px-10 rounded-2xl text-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <span className="flex items-center gap-3">
              📞 ORDINA SUBITO! (-30%)
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuissenLabLanding;