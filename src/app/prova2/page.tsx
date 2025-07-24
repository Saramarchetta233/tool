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
    showNotification(); // Show immediately

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
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
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
  const [showTerms, setShowTerms] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Social Proof Notification */}
      <SocialProofNotification />

      {/* Header with Urgency Banner */}
      <div className="bg-red-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center space-x-4 text-sm font-medium">
          <span>🔥 OFFERTA LIMITATA - Scade tra:</span>
          <CountdownTimer />
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Product Image */}
            <div className="order-2 lg:order-1">
              <div className="relative">
                <img
                  src="/api/placeholder/600/600"
                  alt="Macchina da Cucire Creativa"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -52% OFF
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="order-1 lg:order-2 space-y-6">
              {/* Reviews */}
              <div className="flex items-center space-x-2">
                <StarRating rating={5} size="w-5 h-5" />
                <span className="text-yellow-600 font-medium">4.9</span>
                <span className="text-gray-600">(347 recensioni)</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                🧵 Macchina da Cucire Creativa – Compatta, Potente, Facilissima da Usare
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-gray-700 font-medium">
                <strong>Facilita il cucito con opzioni automatiche e risultati precisi per progetti creativi.</strong>
              </p>

              {/* Benefits */}
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

              {/* Pricing Box */}
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

              {/* CTA Button */}
              <button
                onClick={scrollToTop}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg"
              >
                🛒 ORDINA ORA - SPEDIZIONE GRATUITA
              </button>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-2 text-sm">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-gray-600">
                  Accetto i{' '}
                  <button
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Termini e Condizioni
                  </button>
                </label>
              </div>

              {/* Delivery Timeline */}
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

              {/* Trust Indicators */}
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

      {/* Product Features Section */}
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
                src="/api/placeholder/600/400"
                alt="Macchina da Cucire in uso"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="/api/placeholder/600/400"
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

      {/* Benefits Section */}
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
                src="/api/placeholder/600/400"
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

      {/* Comparison Section */}
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

          <div className="bg-gray-50 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-4">
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
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 border-b border-gray-200">
                <div className="font-medium">{feature}</div>
                <div className="text-center">
                  <Check className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <div className="text-center">
                  <span className="text-red-600 text-xl">✗</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="/api/placeholder/600/400"
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

      {/* FAQ Section */}
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

      {/* Reviews Section */}
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

          {/* Featured Review */}
          <div className="mt-12 bg-white p-8 rounded-lg shadow-lg border-l-4 border-yellow-400">
            <div className="flex items-start space-x-4">
              <img
                src="/api/placeholder/80/80"
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

      {/* Guarantee Section */}
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

      {/* Why Buy From Us */}
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

      {/* Final CTA Section */}
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
            onClick={scrollToTop}
            className="bg-white text-orange-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg mb-4 w-full md:w-auto"
          >
            🛒 ORDINA ORA - ULTIMI PEZZI DISPONIBILI
          </button>

          <p className="text-sm opacity-90">
            ⚡ Offerta limitata nel tempo • 🚚 Spedizione gratuita • 💯 Garanzia 30 giorni
          </p>
        </div>
      </section>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowTerms(false)}></div>
            <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto p-6">
              <button
                onClick={() => setShowTerms(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ✖
              </button>
              <h3 className="text-xl font-bold mb-4">Termini e Condizioni</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  Questo sito web è gestito da LeCoseDiCase. In tutto il sito, i termini "noi", "ci" e "nostro" si riferiscono a LeCoseDiCase.
                </p>
                <p>
                  LeCoseDiCase offre questo sito web, comprese tutte le informazioni, gli strumenti e i servizi disponibili da questo sito a voi, l'utente, a condizione che accettiate tutti i termini, le condizioni, le politiche e le comunicazioni qui indicate.
                </p>
                <p>
                  Visitando il nostro sito e/o acquistando qualcosa da noi, vi impegnate a usufruire del nostro "Servizio" e accettate di essere vincolati dai seguenti termini e condizioni.
                </p>
                <p>
                  I prodotti in vendita sono destinati esclusivamente all'uso personale e non commerciale, salvo diversa autorizzazione scritta. Ogni ordine è soggetto alla nostra accettazione e può essere annullato o limitato a nostra discrezione.
                </p>
                <p>
                  Le immagini presenti sul sito hanno scopo puramente illustrativo. I prodotti consegnati potrebbero differire per colore, forma, confezione o altre caratteristiche, in base alla disponibilità di magazzino al momento della spedizione.
                </p>
                <p>
                  In caso di controversie, si applicherà la legge italiana e sarà competente il foro di residenza del consumatore.
                </p>
                <p className="font-bold">
                  LeCoseDiCasa - Tutti i diritti riservati.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <button className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors duration-200">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
        </button>
      </div>

      {/* Sticky Bottom Bar - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-orange-600 p-4 z-30">
        <button
          onClick={scrollToTop}
          className="w-full bg-white text-orange-600 font-bold py-3 px-6 rounded-lg text-lg"
        >
          🛒 ORDINA ORA €62,98
        </button>
      </div>

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