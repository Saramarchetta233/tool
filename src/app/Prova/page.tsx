'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle, Shield, Truck, Heart, Star, ArrowRight, Menu, X } from 'lucide-react';

export default function SandaliLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  // Countdown timer
  useEffect(() => {
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

    return () => clearInterval(timer);
  }, []);

  const benefits = [
    {
      icon: '🦶',
      title: 'Corregge la Postura',
      description: 'Allineamento naturale del piede in pochi giorni'
    },
    {
      icon: '💧',
      title: 'Tecnologia FreshGel',
      description: 'Gel ammortizzante che riduce la pressione sui talloni'
    },
    {
      icon: '🌬️',
      title: 'Anti-Sudore',
      description: 'Materiali traspiranti che neutralizzano odori e umidità'
    },
    {
      icon: '🏥',
      title: 'Adatto ai Diabetici',
      description: 'Design medico approvato per piedi sensibili'
    }
  ];

  const problems = [
    {
      icon: '😣',
      title: 'Niente più piedi gonfi',
      description: 'Calzata larga e regolabile con materiali flessibili',
      image: '/api/placeholder/300/200'
    },
    {
      icon: '🦵',
      title: 'Sollievo per le gambe',
      description: 'Alleviano pressione e pesantezza alle gambe',
      image: '/api/placeholder/300/200'
    },
    {
      icon: '⚡',
      title: 'Basta dolori ai piedi',
      description: 'Supporto mirato all\'arco plantare e protezione del tallone',
      image: '/api/placeholder/300/200'
    },
    {
      icon: '👍',
      title: 'Miglioramento alluce',
      description: 'Punta larga che non comprime con design ergonomico',
      image: '/api/placeholder/300/200'
    }
  ];

  const testimonials = [
    {
      name: 'Maria Rossi',
      age: 52,
      text: 'Dopo anni di dolori ai piedi, finalmente posso camminare senza problemi. Li consiglio a tutti!',
      rating: 5
    },
    {
      name: 'Giuseppe Bianchi',
      age: 67,
      text: 'Perfetti per chi ha problemi di diabete. Comfort eccezionale e qualità italiana.',
      rating: 5
    },
    {
      name: 'Anna Verdi',
      age: 45,
      text: 'Li uso tutto il giorno al lavoro. I miei piedi non si gonfiano più e non sento dolore.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/50 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 bg-clip-text text-transparent">
              FreshStep™
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#benefici" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">Benefici</a>
              <a href="#testimonianze" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">Reviews</a>
              <a href="#garanzia" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">Garanzia</a>
            </nav>
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="px-4 py-4 space-y-4">
              <a href="#benefici" className="block text-gray-700">Benefici</a>
              <a href="#testimonianze" className="block text-gray-700">Reviews</a>
              <a href="#garanzia" className="block text-gray-700">Garanzia</a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold border border-emerald-200">
                🇮🇹 100% Made in Italy
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 bg-clip-text text-transparent">
                  FreshStep™
                </span>
                <br />
                <span className="text-4xl lg:text-5xl font-semibold text-slate-600">
                  Sandali Ortopedici Estivi
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed font-light max-w-2xl">
                Dì addio ai dolori ai piedi grazie al supporto ergonomico che trasforma
                ogni passo in un piacere. <span className="font-medium text-slate-800">Comfort garantito tutto il giorno.</span>
              </p>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="group flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white/90 hover:shadow-lg transition-all duration-300 border border-white/20">
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300">{benefit.icon}</div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{benefit.title}</h3>
                      <p className="text-sm text-slate-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Countdown Timer */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-6 animate-pulse hover:animate-none hover:scale-105 transition-transform duration-300 shadow-xl">
                <p className="text-sm font-medium mb-3 flex items-center">
                  <span className="mr-2 text-lg animate-bounce">⏰</span>
                  OFFERTA LIMITATA - Approfitta prima che torni a prezzo pieno
                </p>
                <div className="flex justify-center space-x-6 text-2xl font-bold">
                  <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <div className="tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</div>
                    <div className="text-xs font-normal opacity-90">ORE</div>
                  </div>
                  <div className="self-center text-3xl animate-pulse">:</div>
                  <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <div className="tabular-nums">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-xs font-normal opacity-90">MIN</div>
                  </div>
                  <div className="self-center text-3xl animate-pulse">:</div>
                  <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <div className="tabular-nums">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                    <div className="text-xs font-normal opacity-90">SEC</div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="space-y-4">
                <button className="group w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 text-white font-bold py-5 px-8 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-xl hover:shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center space-x-2">
                    <span>ORDINA ORA - Spedizione in 24/48h</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <div className="flex items-center justify-center space-x-6 text-sm text-slate-600">
                  <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-2 rounded-full">
                    <Truck size={16} className="text-blue-600" />
                    <span className="font-medium">Consegna 2-3 giorni</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-2 rounded-full">
                    <Shield size={16} className="text-emerald-600" />
                    <span className="font-medium">30 giorni soddisfatti</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl transform -rotate-6 animate-pulse"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform hover:rotate-1 hover:scale-105 transition-all duration-500 group">
                <div className="relative aspect-[5/4] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-300">👡</div>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-slate-700 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                    Sandali FreshStep™
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-bold text-sm transform rotate-12 hover:rotate-6 hover:scale-110 transition-all duration-300 shadow-lg animate-bounce">
                  SCONTO 50%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Solutions */}
      <section id="benefici" className="py-20 px-4 bg-slate-50/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Rivoluziona il Comfort dei Tuoi Piedi
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 font-light max-w-3xl mx-auto">
              Scopri come i nostri sandali risolvono i problemi più comuni dei piedi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {problems.map((problem, index) => (
              <div key={index} className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-slate-100">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{problem.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{problem.title}</h3>
                <p className="text-slate-600 mb-4">{problem.description}</p>
                <div className="relative w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-3xl opacity-30 group-hover:opacity-50 transition-opacity">{problem.icon}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-8 tracking-tight">
                Tecnologia <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">FreshGel</span> Avanzata
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="text-green-500 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Gel Ammortizzante</h3>
                    <p className="text-gray-600">Allevia la pressione sui talloni e riduce il dolore ai piedi</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="text-green-500 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Suola Antiscivolo</h3>
                    <p className="text-gray-600">Garantisce aderenza su ogni superficie ed evita scivolamenti</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="text-green-500 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Materiali Traspiranti</h3>
                    <p className="text-gray-600">Mantengono i piedi asciutti e freschi tutto il giorno</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="text-green-500 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Design Ergonomico</h3>
                    <p className="text-gray-600">Supporto mirato all'arco plantare e protezione del tallone</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 hover:from-blue-200 hover:to-indigo-200 transition-all duration-500 group">
              <div className="relative aspect-[3/2] bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg overflow-hidden group-hover:shadow-inner transition-all duration-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500">🧪</div>
                </div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-blue-700 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                  Tecnologia FreshGel
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 group-hover:to-white/20 transition-all duration-300"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonianze" className="py-16 px-4 bg-slate-50/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Quello che Dicono i Nostri Clienti
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 font-light max-w-3xl mx-auto">
              Migliaia di persone hanno già trasformato il comfort dei loro piedi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-200" size={20} style={{animationDelay: `${i * 50}ms`}} />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic text-base leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.age} anni</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Domande Frequenti
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Sono adatti per camminate lunghe?",
                a: "Sì, grazie alla talloniera ammortizzante e alla suola ergonomica, offrono comfort anche per lunghe camminate."
              },
              {
                q: "Posso usarli per lavorare in piedi?",
                a: "Assolutamente! Offrono supporto continuo, riducendo il dolore anche dopo ore in piedi."
              },
              {
                q: "Come scelgo la misura giusta?",
                a: "Consigliamo di ordinare la tua misura abituale. Se sei indecisa, scegli una taglia più grande per maggiore comfort."
              },
              {
                q: "Sono adatti per piedi larghi?",
                a: "Sì, la forma ampia e flessibile garantisce spazio e comfort anche per piedi larghi."
              }
            ].map((faq, index) => (
              <div key={index} className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{faq.q}</h3>
                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section id="garanzia" className="py-16 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 text-white">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <Shield size={64} className="mx-auto mb-6" />
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 tracking-tight">
              Garanzia Soddisfatti o Rimborsati
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Prova i Sandali FreshStep™ senza rischi con la nostra garanzia di rimborso entro 30 giorni.
              Se non sei completamente soddisfatta, restituiscili per un rimborso totale.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="font-semibold mb-2">Prova 30 Giorni</h3>
                <p className="opacity-90">Tempo sufficiente per testare il comfort</p>
              </div>
              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">↩️</span>
                </div>
                <h3 className="font-semibold mb-2">Reso Facile</h3>
                <p className="opacity-90">Processo di reso semplice e veloce</p>
              </div>
              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="font-semibold mb-2">Rimborso Completo</h3>
                <p className="opacity-90">100% del denaro restituito</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            Non Aspettare, i Tuoi Piedi Ti Ringrazieranno
          </h2>
          <p className="text-xl lg:text-2xl mb-8 opacity-90 font-light">
            Unisciti a migliaia di persone che hanno già scelto il comfort FreshStep™
          </p>

          <div className="max-w-md mx-auto space-y-4">
            <button className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 text-white font-bold py-4 px-8 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-xl hover:shadow-2xl">
              ORDINA ORA - Spedizione Gratuita
            </button>

            <div className="flex items-center justify-center space-x-6 text-sm opacity-90">
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} />
                <span>Spedizione in 24/48h</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart size={16} />
                <span>Made in Italy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">FreshStep™</h3>
              <p className="text-slate-400">
                Il comfort ortopedico Made in Italy per i tuoi piedi.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-slate-400">
                <li className="hover:text-white transition-colors cursor-pointer">Caratteristiche</li>
                <li className="hover:text-white transition-colors cursor-pointer">Tecnologia FreshGel</li>
                <li className="hover:text-white transition-colors cursor-pointer">Taglie disponibili</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Supporto</h4>
              <ul className="space-y-2 text-slate-400">
                <li className="hover:text-white transition-colors cursor-pointer">FAQ</li>
                <li className="hover:text-white transition-colors cursor-pointer">Spedizioni</li>
                <li className="hover:text-white transition-colors cursor-pointer">Resi e rimborsi</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contatti</h4>
              <ul className="space-y-2 text-slate-400">
                <li className="hover:text-white transition-colors cursor-pointer">info@freshstep.it</li>
                <li className="hover:text-white transition-colors cursor-pointer">+39 02 1234 5678</li>
                <li className="hover:text-white transition-colors cursor-pointer">Lun-Ven 9:00-18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 FreshStep™. Tutti i diritti riservati. Made with ❤️ in Italy.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}