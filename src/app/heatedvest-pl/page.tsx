'use client';

import { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Thermometer,
  Zap,
  Battery,
  Wind
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
      window.gtag('config', 'AW-17553726122');

      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17553726122';
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

  // Get client IP for tracking
  getClientIP: async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '';
    } catch (error) {
      console.error('Error getting IP:', error);
      return '';
    }
  },

  // Get Facebook Click ID
  getFbClickId: (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');

    if (fbclid) {
      const timestamp = typeof window !== 'undefined' ? Math.floor(Date.now() / 1000) : 1694880000;
      return `fb.1.${timestamp}.${fbclid}`;
    }

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === '_fbc') {
        return decodeURIComponent(value);
      }
    }
    return '';
  },

  // Set Facebook Click ID
  setFbClickId: (): void => {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');

    if (fbclid) {
      const timestamp = typeof window !== 'undefined' ? Math.floor(Date.now() / 1000) : 1694880000;
      const fbcValue = `fb.1.${timestamp}.${fbclid}`;

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 90);

      document.cookie = `_fbc=${encodeURIComponent(fbcValue)}; expires=${expirationDate.toUTCString()}; path=/; domain=${window.location.hostname}`;
    }
  },

  // Get Facebook Browser ID
  getFbBrowserId: (): string => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === '_fbp') return value;
    }
    return '';
  },

  // Hash data for PII compliance
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

// Color to Image mapping for heated vest
const COLOR_IMAGE_MAP = {
  'Niebieski': '/images/giacca/blu.jpg',
  'Czarny': '/images/giacca/nero.jpg',
  'Czerwony': '/images/giacca/rosso.jpg'
};

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
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);
      const difference = midnight.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    const timer = setTimeout(() => {
      calculateTimeLeft();
      const interval = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(interval);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-red-600 text-white text-center py-3 px-4 font-bold">
      <div className="flex items-center justify-center space-x-1 text-lg">
        <span>⏰ Oferta kończy się za:</span>
        <span className="bg-red-700 px-2 py-1 rounded mx-1">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-red-700 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-red-700 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

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

const FAQ = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
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
          <p className="text-gray-700">{answer}</p>
        </div>
      )}
    </div>
  );
};

const StockIndicator = () => {
  const [stock, setStock] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setStock(prev => {
        const change = Math.random() > 0.7 ? -1 : 0;
        const newStock = Math.max(8, Math.min(18, prev + change));
        return newStock;
      });
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 p-3 rounded-lg text-center font-bold">
      <div className="flex items-center justify-center space-x-2">
        <AlertCircle className="w-5 h-5" />
        <span>Tylko {stock} sztuk pozostało w magazynie!</span>
      </div>
    </div>
  );
};

const DeliveryTracking = () => {
  const [deliveryDates, setDeliveryDates] = useState({
    orderDate: '',
    shipDate: '',
    deliveryStart: '',
    deliveryEnd: ''
  });

  useEffect(() => {
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
      deliveryEnd: formatData(dataConsegnaFine)
    });
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-bold text-gray-900 mb-4 text-center">📅 Harmonogram Dostawy</h3>

      <div className="flex justify-between items-center text-sm">
        <div className="text-center">
          <div className="text-2xl mb-1">📦</div>
          <div className="font-medium">Zamówione</div>
          <div className="text-gray-500">{deliveryDates.orderDate}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">🚚</div>
          <div className="font-medium">Wysłane</div>
          <div className="text-gray-500">{deliveryDates.shipDate}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">📍</div>
          <div className="font-medium">Dostarczone</div>
          <div className="text-gray-500">{deliveryDates.deliveryStart} - {deliveryDates.deliveryEnd}</div>
        </div>
      </div>
    </div>
  );
};

// Size Guide Modal Component
const SizeGuideModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [chestSize, setChestSize] = useState('');
  const [units, setUnits] = useState('cm');
  const [fit, setFit] = useState('normal');
  const [result, setResult] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const calculateSize = () => {
    if (!chestSize) return;

    let chest = parseFloat(chestSize);
    if (units === 'in') chest *= 2.54;

    let recommended = '';
    const adjustment = fit === 'tight' ? -2 : fit === 'loose' ? 4 : 0;

    if (chest + adjustment <= 88) recommended = 'S';
    else if (chest + adjustment <= 96) recommended = 'M';
    else if (chest + adjustment <= 104) recommended = 'L';
    else if (chest + adjustment <= 112) recommended = 'XL';
    else if (chest + adjustment <= 120) recommended = '2XL';
    else recommended = '3XL';

    setResult(recommended);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full relative my-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Tabela rozmiarów — ThermoVest Pro™ Unisex</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="Zamknij tabelę"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick advice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Większość klientów wybiera swój standardowy rozmiar.</strong>
              <br />
              Jeśli jesteś pomiędzy rozmiarami lub planujesz warstwę pod spodem, wybierz większy.
            </p>
          </div>

          {/* How to measure */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">🧵 Jak zmierzyć obwód klatki piersiowej</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>1️⃣ Stań prosto z rozluźnionymi rękami.</p>
              <p>2️⃣ Owiń miarkę wokół <strong>najszerszego miejsca klatki</strong> — tuż pod pachami i przez łopatki.</p>
              <p>3️⃣ Miarka powinna przylegać, ale nie uciskać.</p>
              <p>4️⃣ Tę wartość potraktuj jako <strong>obwód klatki ciała</strong> do kalkulatora poniżej.</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 <strong>Wskazówka:</strong> ThermoVest Pro – Unisex kurtka grzewcza z zasilaniem USB + Powerbank w cenie!
            </p>
          </div>

          {/* Calculator */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">🧮 Kalkulator rozmiaru</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Obwód klatki piersiowej:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={chestSize}
                    onChange={(e) => setChestSize(e.target.value)}
                    placeholder="np. 96"
                    min="60"
                    max="160"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="units"
                        value="cm"
                        checked={units === 'cm'}
                        onChange={(e) => setUnits(e.target.value)}
                        className="mr-1"
                      />
                      cm
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="units"
                        value="in"
                        checked={units === 'in'}
                        onChange={(e) => setUnits(e.target.value)}
                        className="mr-1"
                      />
                      in
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferowany luz:</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fit"
                      value="tight"
                      checked={fit === 'tight'}
                      onChange={(e) => setFit(e.target.value)}
                      className="mr-2"
                    />
                    Przylegający
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fit"
                      value="normal"
                      checked={fit === 'normal'}
                      onChange={(e) => setFit(e.target.value)}
                      className="mr-2"
                    />
                    Standardowy
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fit"
                      value="loose"
                      checked={fit === 'loose'}
                      onChange={(e) => setFit(e.target.value)}
                      className="mr-2"
                    />
                    Luźny
                  </label>
                </div>
              </div>

              <button
                onClick={calculateSize}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Oblicz rozmiar
              </button>

              {result && (
                <div className="bg-white border border-green-300 rounded-md p-3 text-center">
                  <p className="font-bold text-green-700">Zalecany rozmiar: {result}</p>
                  <p className="text-sm text-gray-600">Sprawdź tabelę poniżej dla szczegółów.</p>
                </div>
              )}
            </div>
          </div>

          {/* Size Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rozmiar</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Obwód klatki<br />(kamizelki)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Długość</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Szerokość barków</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { size: 'S', chest: '88-92 cm', length: '58-60 cm', shoulders: '40-42 cm' },
                  { size: 'M', chest: '92-96 cm', length: '60-62 cm', shoulders: '42-44 cm' },
                  { size: 'L', chest: '96-104 cm', length: '62-64 cm', shoulders: '44-46 cm' },
                  { size: 'XL', chest: '104-112 cm', length: '64-66 cm', shoulders: '46-48 cm' },
                  { size: '2XL', chest: '112-120 cm', length: '66-68 cm', shoulders: '48-50 cm' },
                  { size: '3XL', chest: '120-128 cm', length: '68-70 cm', shoulders: '50-52 cm' }
                ].map((row, index) => (
                  <tr key={index} className={result === row.size ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.size}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{row.chest}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{row.length}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{row.shoulders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            💡 <strong>Wskazówka:</strong> Wszystkie wymiary dotyczą kamizelki (nie ciała). Jeśli planujesz nosić grube warstwy pod spodem, wybierz większy rozmiar.
          </p>
        </div>
      </div>
    </div>
  );
};

// Product carousel for heated vest
const ProductCarousel = ({ selectedColor }: { selectedColor: 'Niebieski' | 'Czarny' | 'Czerwony' }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Heated vest images - main image changes based on selected color
  const images = [
    COLOR_IMAGE_MAP[selectedColor], // Main image based on color
    "/images/giacca/4.jpg",
    "/images/giacca/5.jpg",
    "/images/giacca/7.jpg",
    "/images/giacca/9.jpg",
    "/images/giacca/10.jpg",
    "/images/giacca/11.jpg"
  ];

  useEffect(() => {
    setCurrentImage(0);
  }, [selectedColor]);

  // Touch handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentImage(prev => (prev + 1) % images.length);
    }
    if (isRightSwipe) {
      setCurrentImage(prev => (prev - 1 + images.length) % images.length);
    }
  };

  const nextImage = () => {
    setCurrentImage(prev => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage(prev => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImage(index);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-white rounded-2xl overflow-hidden shadow-xl">
      <div
        className="relative aspect-square overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentImage]}
          alt={`ThermoVest Pro ${selectedColor} - widok ${currentImage + 1}`}
          className="w-full h-full object-cover transition-transform duration-300"
        />

        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
          aria-label="Poprzednie zdjęcie"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
          aria-label="Następne zdjęcie"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-center space-x-2 p-4 bg-gray-50">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-3 h-3 rounded-full transition-colors ${index === currentImage ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            aria-label={`Zdjęcie ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">ThermoVest Pro</h3>
            <p className="text-gray-400 text-sm">
              Nowoczesne kamizelki grzewcze USB dla aktywnych ludzi.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Obsługa Klienta</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/contact" className="hover:text-white transition-colors">Kontakt</a></li>
              <li><a href="/shipping" className="hover:text-white transition-colors">Dostawa</a></li>
              <li><a href="/returns" className="hover:text-white transition-colors">Zwroty</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Informacje</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/about" className="hover:text-white transition-colors">O nas</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Polityka prywatności</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Regulamin</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Śledź nas</h4>
            <div className="flex space-x-4 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Facebook</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © 2024 ThermoVest Pro. Wszelkie prawa zastrzeżone.
            </p>
            <div className="flex space-x-6">
              <a href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Polityka prywatności</a>
              <a href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Regulamin</a>
              <a href="/cookies" className="text-sm text-gray-400 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500 max-w-4xl mx-auto">
            ThermoVest Pro to innowacyjna marka kamizelki grzewczej z nowoczesną technologią USB.
            Wszystkie produkty objęte są gwarancją jakości i satysfakcji klienta.
          </div>
        </div>
      </div>
    </footer>
  );
};

const BenefitGrid = () => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Dlaczego warto wybrać ThermoVest Pro?
          </h2>
          <p className="text-lg text-gray-600">
            5 stref grzewczych, 3 poziomy temperatury i szybkie nagrzewanie
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-full opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-red-500 to-orange-600 rounded-full opacity-40"></div>
              <div className="absolute inset-4 bg-gradient-to-r from-red-500 to-orange-600 rounded-full opacity-60"></div>
              <div className="absolute inset-6 bg-gradient-to-r from-red-500 to-orange-600 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Thermometer className="w-8 h-8 text-white z-10" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">5 stref grzewczych</h3>
            <p className="text-gray-600">
              Plecy, kark, przód i lędźwia - równomierne nagrzewanie całego torsu
            </p>
          </div>

          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-40"></div>
              <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-60"></div>
              <div className="absolute inset-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white z-10" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start w &lt;10 s</h3>
            <p className="text-gray-600">
              Szybkie nagrzewanie - ciepło błyskawicznie po włączeniu
            </p>
          </div>

          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-40"></div>
              <div className="absolute inset-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-60"></div>
              <div className="absolute inset-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Battery className="w-8 h-8 text-white z-10" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Zasilanie USB 5V/2A</h3>
            <p className="text-gray-600">
              Działa z każdą powerbanką - do 8 godzin komfortu w ruchu
            </p>
          </div>

          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-40"></div>
              <div className="absolute inset-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-60"></div>
              <div className="absolute inset-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Wind className="w-8 h-8 text-white z-10" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Lekka, oddychająca</h3>
            <p className="text-gray-600">
              Wodoodporna tkanina - idealna pod kurtkę lub samodzielnie
            </p>
          </div>

          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full opacity-40"></div>
              <div className="absolute inset-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full opacity-60"></div>
              <div className="absolute inset-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white z-10" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bezpieczne wyłączanie</h3>
            <p className="text-gray-600">
              System automatycznego wyłączania - ochrona przed przegrzaniem
            </p>
          </div>

          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full opacity-40"></div>
              <div className="absolute inset-4 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full opacity-60"></div>
              <div className="absolute inset-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-8 h-8 text-white z-10" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Możliwość prania</h3>
            <p className="text-gray-600">
              Po odłączeniu przewodu USB - delikatne pranie, szybkie schnięcie
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HeatedVestLanding() {
  const [mounted, setMounted] = useState(false);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [reservationTimer, setReservationTimer] = useState({ minutes: 5, seconds: 0 });
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [bounceAnimation, setBounceAnimation] = useState(false);

  // Global state for color and size (hoisted outside form)
  const [color, setColor] = useState<'Niebieski' | 'Czarny' | 'Czerwony'>('Niebieski');
  const [size, setSize] = useState<'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'>('L');

  const [formData, setFormData] = useState({
    imie: '',
    telefon: '',
    adres: '',
    uid: '01980825-ae5a-7aca-8796-640a3c5ee3da',
    key: 'ad79469b31b0058f6ea72c',
    offer: '463',
    lp: '463'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    imie: '',
    telefon: '',
    adres: ''
  });

  useEffect(() => {
    setMounted(true);

    // Initialize tracking
    trackingUtils.setFbClickId();
    trackingUtils.initFacebookPixel();
    trackingUtils.initGoogleAds();
    trackingUtils.initGoogleAnalytics();

    // Load external script
    const script = document.createElement('script');
    script.src = 'https://cdn.trackingmore.com/js/load.js';
    script.async = true;
    document.head.appendChild(script);

    // Load fingerprinting script
    const fingerprintScript = document.createElement('script');
    fingerprintScript.src = 'https://offers.supertrendaffiliateprogram.com/forms/tmfp/';
    fingerprintScript.crossOrigin = 'anonymous';
    fingerprintScript.defer = true;
    document.head.appendChild(fingerprintScript);

    // Scroll handler for sticky button
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;

      const scrollPercentage = (scrollY / (documentHeight - windowHeight)) * 100;

      setShowStickyButton(scrollPercentage > 20);
    };

    window.addEventListener('scroll', handleScroll);

    // Bounce animation
    const bounceInterval = setInterval(() => {
      setBounceAnimation(true);
      setTimeout(() => setBounceAnimation(false), 1000);
    }, 8000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(bounceInterval);
    };
  }, []);

  useEffect(() => {
    if (!showOrderPopup) return;

    const timer = setInterval(() => {
      setReservationTimer(prev => {
        if (prev.minutes === 0 && prev.seconds === 0) {
          setShowOrderPopup(false);
          return { minutes: 5, seconds: 0 };
        }

        if (prev.seconds === 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }

        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showOrderPopup]);

  const validateVariantSelection = () => {
    if (!color || !size) {
      alert('Wybierz kolor i rozmiar.');
      return false;
    }
    return true;
  };

  const handleOrderClick = () => {
    if (!validateVariantSelection()) {
      return;
    }

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_type: 'product',
        content_ids: ['thermovest-pro-heated-vest'],
        content_name: 'ThermoVest Pro — Unisex kamizelka grzewcza USB (5 stref, 3 poziomy)',
        value: 299.00,
        currency: 'PLN',
        num_items: 1
      });
    }

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        event_category: 'ecommerce',
        event_label: 'ThermoVest Pro',
        value: 299.00
      });
    }

    setShowOrderPopup(true);
    setReservationTimer({ minutes: 5, seconds: 0 });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = { imie: '', telefon: '', adres: '' };
    let isValid = true;

    if (!formData.imie.trim()) {
      errors.imie = 'Imię i nazwisko jest wymagane';
      isValid = false;
    } else if (formData.imie.trim().length < 2) {
      errors.imie = 'Imię musi zawierać co najmniej 2 znaki';
      isValid = false;
    }

    if (!formData.telefon.trim()) {
      errors.telefon = 'Numer telefonu jest wymagany';
      isValid = false;
    } else {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
      if (!phoneRegex.test(formData.telefon.trim())) {
        errors.telefon = 'Wprowadź prawidłowy numer telefonu';
        isValid = false;
      }
    }

    if (!formData.adres.trim()) {
      errors.adres = 'Adres jest wymagany';
      isValid = false;
    } else if (formData.adres.trim().length < 10) {
      errors.adres = 'Adres musi być bardziej szczegółowy (ulica, numer, miasto, kod pocztowy)';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleOrderSubmit = async () => {
    if (isSubmitting) return;

    if (!validateVariantSelection() || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    console.log('🎯 Form submitted with form data:', formData);

    try {
      // Hash sensitive data for Facebook CAPI
      const hashedPhone = formData.telefon ? await trackingUtils.hashData(formData.telefon.replace(/\D/g, '')) : null;
      const hashedFirstName = formData.imie ? await trackingUtils.hashData(formData.imie.split(' ')[0]) : null;
      const hashedLastName = formData.imie && formData.imie.split(' ').length > 1 ? await trackingUtils.hashData(formData.imie.split(' ').slice(1).join(' ')) : null;

      const now = typeof window !== 'undefined' ? Math.floor(Date.now() / 1000) : 1694880000;

      // Facebook Purchase tracking
      if (typeof window !== 'undefined' && window.fbq) {
        try {
          const uniqueEventId = `purchase-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

          window.fbq('track', 'Purchase', {
            content_type: 'product',
            content_ids: ['thermovest-pro-heated-vest'],
            content_name: 'ThermoVest Pro — Unisex kamizelka grzewcza USB (5 stref, 3 poziomy)',
            value: 299.00,
            currency: 'PLN',
            num_items: 1
          }, {
            eventID: uniqueEventId
          });
        } catch (error) {
          console.error('Facebook tracking error:', error);
        }
      }

      // N8N webhook call for Facebook CAPI
      try {
        await fetch('https://primary-production-625c.up.railway.app/webhook/CAPI-Meta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_name: 'Purchase',
            event_id: `purchase-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timestamp: now,
            event_source_url: window.location.href,
            action_source: 'website',
            telefono_hash: hashedPhone,
            nome_hash: hashedFirstName,
            cognome_hash: hashedLastName,
            indirizzo: formData.adres || null,

            // Product variants
            color: color,
            size: size,
            color_image: COLOR_IMAGE_MAP[color],

            traffic_source: trackingUtils.getTrafficSource(),
            user_agent: navigator.userAgent,
            fbp: trackingUtils.getFbBrowserId(),
            fbc: trackingUtils.getFbClickId(),
            product_name: 'ThermoVest Pro — Unisex kamizelka grzewcza USB (5 stref, 3 poziomy)',
            value: 299.00,
            currency: 'PLN'
          })
        });
      } catch (error) {
        console.error('N8N CAPI webhook error:', error);
      }

      // Get URL parameters and tmfp fingerprint
      const urlParams = new URLSearchParams(window.location.search);
      const clickId = urlParams.get('click_id');

      // Ottieni il fingerprint TMFP se disponibile
      const tmfpInput = document.querySelector('input[name="tmfp"]') as HTMLInputElement | null;
      const tmfpValue = tmfpInput?.value || '';

      // Prepara i dati per il Cloudflare Worker
      const leadData = {
        // Campi esistenti - preservati
        uid: '01980825-ae5a-7aca-8796-640a3c5ee3da',
        key: 'ad79469b31b0058f6ea72c',
        offer: '463',
        lp: '463',
        name: formData.imie.trim(),
        tel: formData.telefon.trim(),
        'street-address': formData.adres.trim(),
        tmfp: tmfpValue,
        ua: navigator.userAgent,

        // Nuovi campi richiesti
        network_type: 'traffic',
        url_network: 'https://offers.supertrendaffiliateprogram.com/forms/api/',
        click_id: clickId,

        // Dati del prodotto
        product: 'ThermoVest Pro — Unisex kamizelka grzewcza USB (5 stref, 3 poziomy)',
        price: 299.00,
        currency: 'PLN',
        colorlo: color,
        taglia: size,
        color_image: COLOR_IMAGE_MAP[color],

        // Parametri UTM se presenti
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_term: urlParams.get('utm_term'),
        utm_content: urlParams.get('utm_content'),

        // Subid parameters se presenti
        subid: urlParams.get('subid'),
        subid2: urlParams.get('subid2'),
        subid3: urlParams.get('subid3'),
        subid4: urlParams.get('subid4'),
        pubid: urlParams.get('pubid'),

        // Tracking data
        page_url: window.location.href,
        ip_address: await trackingUtils.getClientIP(),
        timestamp: now,
        user_agent: navigator.userAgent
      };

      console.log('📤 Sending data to Cloudflare Worker:', leadData);

      const response = await fetch('https://leads-ingest.hidden-rain-9c8e.workers.dev/', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer Y60kgTRvJUTTVEsMytKhcFAo1dxDl6Iom2oL8QqxaRVb7RM1O6jx9D3gJsx1l0A1',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        await response.json();
        const orderId = typeof window !== 'undefined' ? `HVP${Date.now()}` : 'HVP1694880000000';

        // Store order data for thank you page
        localStorage.setItem('orderData', JSON.stringify({
          ...formData,
          orderId,
          product_name: 'ThermoVest Pro — Unisex kamizelka grzewcza USB (5 stref, 3 poziomy)',
          price: '299,00 zł',
          color: color,
          size: size
        }));

        // Google Ads conversion tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'conversion', {
            send_to: 'AW-17553726122/conversion_label',
            value: 299.00,
            currency: 'PLN',
            transaction_id: orderId
          });
        }

        // Redirect to thank you page
        window.location.href = '/ty-heatedvest-pl';
      } else {
        const errorText = await response.text();
        console.error('Order submission failed:', errorText);
        alert('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <input type="hidden" name="tmfp" />

        <div className="bg-red-600 text-white text-center py-2 px-4">
          <div className="flex items-center justify-center space-x-4 text-sm font-medium">
            <span>🔥 PROMOCJA –60% tylko dziś!</span>
          </div>
        </div>

        <section className="bg-white py-8 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-1">
                <ProductCarousel selectedColor={color} />
              </div>

              <div className="order-2 space-y-6">
                <div className="flex items-center space-x-2">
                  <StarRating rating={5} size="w-5 h-5" />
                  <span className="text-yellow-600 font-medium">4.9</span>
                  <span className="text-gray-600">(281 opinii)</span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  ThermoVest Pro – Unisex kurtka grzewcza z zasilaniem USB + Powerbank w cenie!
                </h1>

                <p className="text-lg text-gray-700 font-medium">
                  5 stref ogrzewania, 3 poziomy temperatury i szybkie nagrzewanie. Ciepło, komfort i swoboda ruchów na co dzień.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Zasilanie USB 5V/2A</strong> – powerbank w zestawie!</span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>5 stref grzewczych</strong> (plecy/kark/przód/lędźwia)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>3 poziomy temperatury</strong> (LED) – do ~55°C</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Start w &lt;10 s</strong> – szybkie nagrzewanie</span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Lekka, oddychająca</strong> i wodoodporna tkanina</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Bezpieczne wyłączanie</strong> automatyczne</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Idealna pod kurtkę</strong> lub jako warstwa wierzchnia</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Możliwość prania</strong> po odłączeniu przewodu</span>
                  </div>
                </div>

                {/* MINIMAL BRAND SELECTORS - POLISH */}
                <section
                  aria-labelledby="variantsTitle"
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '16px',
                    background: '#F9FAFB'
                  }}
                >
                  <h3
                    id="variantsTitle"
                    style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: '#111827'
                    }}
                  >
                    Wybierz wariant
                  </h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#374151'
                    }}>
                      Kolor
                    </label>

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {(['Niebieski', 'Czarny', 'Czerwony'] as const).map((colorOption) => (
                        <button
                          key={colorOption}
                          onClick={() => setColor(colorOption)}
                          style={{
                            padding: '8px 16px',
                            border: color === colorOption ? '2px solid #2563EB' : '1px solid #D1D5DB',
                            borderRadius: '8px',
                            background: color === colorOption ? '#EFF6FF' : '#FFFFFF',
                            color: color === colorOption ? '#1D4ED8' : '#374151',
                            fontSize: '14px',
                            fontWeight: color === colorOption ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {colorOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#374151'
                    }}>
                      Rozmiar
                    </label>

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {(['S', 'M', 'L', 'XL', '2XL', '3XL'] as const).map((sizeOption) => (
                        <button
                          key={sizeOption}
                          onClick={() => setSize(sizeOption)}
                          style={{
                            padding: '8px 12px',
                            border: size === sizeOption ? '2px solid #2563EB' : '1px solid #D1D5DB',
                            borderRadius: '8px',
                            background: size === sizeOption ? '#EFF6FF' : '#FFFFFF',
                            color: size === sizeOption ? '#1D4ED8' : '#374151',
                            fontSize: '14px',
                            fontWeight: size === sizeOption ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '44px'
                          }}
                        >
                          {sizeOption}
                        </button>
                      ))}
                    </div>

                    {/* Size Guide */}
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="text-blue-600 underline text-sm cursor-pointer inline-block mt-2 hover:text-blue-800"
                    >
                      📏 Tabela rozmiarów
                    </button>

                  </div>

                  {/* Minimal Choice Summary */}
                  <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Twój wybór: <strong>{color}</strong>, <strong>Rozmiar {size}</strong>
                  </div>
                </section>

                {/* Simplified Pricing Section */}
                <div style={{
                  textAlign: 'center',
                  margin: '20px 0',
                  padding: '20px',
                  background: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{
                      color: 'red',
                      textDecoration: 'line-through',
                      fontSize: '20px',
                      marginRight: '10px'
                    }}>747,50 zł</span>
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#2563eb',
                    marginBottom: '10px'
                  }}>
                    299,00 zł
                  </div>
                  <div style={{
                    color: '#dc2626',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    marginBottom: '15px'
                  }}>
                    Promocja –60% tylko dziś!
                  </div>
                  <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                    Darmowa dostawa • Płatność przy odbiorze
                  </p>

                  <StockIndicator />

                  <button
                    onClick={handleOrderClick}
                    className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg mt-4 ${bounceAnimation ? 'animate-bounce' : ''}`}
                  >
                    🛒 ZAMÓW TERAZ – Płatność przy odbiorze
                  </button>

                  <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span>Gwarancja 30 dni</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Truck className="w-4 h-4" />
                      <span>Darmowa dostawa</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Package className="w-4 h-4" />
                      <span>Płatność przy odbiorze</span>
                    </div>
                  </div>

                  <DeliveryTracking />
                </div>
              </div>
            </div>
          </div>
        </section>

        <BenefitGrid />

        {/* Detailed Product Features Section 1 - How it works */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <img
                    src="/images/giacca/5.jpg"
                    alt="ThermoVest Pro - technologia grzewcza w akcji"
                    className="w-full rounded-2xl shadow-2xl"
                  />
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    🔥 Do 55°C
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                    Jak działa technologia ThermoVest Pro?
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Włączenie i wybór trybu</h3>
                        <p className="text-gray-700">Jeden przycisk, trzy poziomy ciepła. Kontrolka LED pokazuje aktualny tryb - niebieski (niski), zielony (średni), czerwony (wysoki).</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Błyskawiczne nagrzewanie</h3>
                        <p className="text-gray-700">Innowacyjne włókna węglowe nagrzewają się w mniej niż 10 sekund. Już po chwili czujesz przyjemne ciepło na plecach, karku i brzuchu.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Równomierne rozprowadzanie</h3>
                        <p className="text-gray-700">5 strategicznie rozmieszczonych stref grzewczych zapewnia optymalne rozprowadzenie ciepła po całym torsie.</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Bezpieczeństwo przede wszystkim</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        System automatycznego wyłączania chroni przed przegrzaniem. Certyfikat CE i RoHS gwarantuje najwyższe standardy bezpieczeństwa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Product Features Section 2 - Versatility */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-1">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-2xl">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                    Jeden produkt, nieskończone możliwości
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900">Dla każdego</h3>
                      </div>
                      <p className="text-gray-700 text-sm">Model unisex pasuje idealnie zarówno kobietom jak i mężczyznom. Rozmiary od S do 3XL.</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900">Wszędzie</h3>
                      </div>
                      <p className="text-gray-700 text-sm">Praca, spacery, sport, podróże, dom. Idealna pod kurtkę zimową lub jako samodzielna warstwa.</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900">Przez cały dzień</h3>
                      </div>
                      <p className="text-gray-700 text-sm">Powerbank 10.000 mAh zapewnia do 8 godzin ciągłego ciepła. Wystarczy na cały dzień pracy czy całodniową wycieczkę.</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-green-600 text-white rounded-lg">
                    <h4 className="font-bold mb-2">💡 Profesjonalna wskazówka</h4>
                    <p className="text-sm">Noś ThermoVest Pro pod luźną bluzą lub kurtkę - ciepło będzie się lepiej rozprowadzać i dłużej utrzymywać. Idealny na chłodne biura, warsztaty czy długie spacery z psem!</p>
                  </div>
                </div>
              </div>

              <div className="order-2">
                <div className="grid grid-cols-2 gap-4">
                  <img
                    src="/images/giacca/7.jpg"
                    alt="ThermoVest Pro podczas pracy biurowej"
                    className="rounded-lg shadow-lg"
                  />
                  <img
                    src="/images/giacca/9.jpg"
                    alt="ThermoVest Pro na spacerze z psem"
                    className="rounded-lg shadow-lg mt-6"
                  />
                  <img
                    src="/images/giacca/10.jpg"
                    alt="ThermoVest Pro podczas jazdy na rowerze"
                    className="rounded-lg shadow-lg -mt-6"
                  />
                  <img
                    src="/images/giacca/11.jpg"
                    alt="ThermoVest Pro pod kurtką zimową"
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Recenzje
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <StarRating rating={5} />
                  <span className="font-medium text-gray-900">Krzysztof P.</span>
                  <span className="text-gray-500 text-sm">Warszawa</span>
                </div>
                <p className="text-gray-700">
                  "Grzeje szybko i równo. Świetna na zimowe spacery i do pracy."
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <StarRating rating={5} />
                  <span className="font-medium text-gray-900">Ewa M.</span>
                  <span className="text-gray-500 text-sm">Kraków</span>
                </div>
                <p className="text-gray-700">
                  "Lekka i naprawdę ciepła. Działa idealnie pod kurtką. Polecam!"
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <StarRating rating={5} />
                  <span className="font-medium text-gray-900">Marek L.</span>
                  <span className="text-gray-500 text-sm">Gdańsk</span>
                </div>
                <p className="text-gray-700">
                  "Trzy poziomy ciepła i powerbank – super wygodne rozwiązanie."
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <StarRating rating={5} />
                  <span className="font-medium text-gray-900">Anna K.</span>
                  <span className="text-gray-500 text-sm">Poznań</span>
                </div>
                <p className="text-gray-700">
                  "Idealna na rower i z psem. Komfort od pierwszych sekund."
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">4.9</div>
                  <div className="text-sm text-gray-600">Średnia ocen</div>
                  <StarRating rating={5} size="w-4 h-4" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">97%</div>
                  <div className="text-sm text-gray-600">Zadowolonych klientów</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">281</div>
                  <div className="text-sm text-gray-600">Opinii</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Photos Section */}
        <section className="bg-gradient-to-br from-red-50 to-orange-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                📸 Nasi Klienci w Akcji
              </h2>
              <p className="text-xl text-gray-600">
                Prawdziwe zdjęcia od osób korzystających z ThermoVest Pro
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12">
              <div className="order-1">
                <div className="relative">
                  <img
                    src="/images/giacca/10.gif"
                    alt="Klient używający ThermoVest Pro"
                    className="w-full rounded-2xl shadow-2xl"
                  />
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ✓ Zweryfikowany klient
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-xs">
                    Zdjęcie od klienta
                  </div>
                </div>
              </div>

              <div className="order-2">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    💬 Co mówią nasi klienci
                  </h3>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <StarRating rating={5} size="w-4 h-4" />
                        <span className="font-bold text-gray-900">Katarzyna M.</span>
                        <span className="text-gray-500 text-sm">Kraków</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        "Niesamowite! Pracuję na budowie i ThermoVest Pro uratowała mnie przed mrozem. Wzmacniacz robi robotę - ciepło przez 8 godzin na jednym ładowaniu!"
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <StarRating rating={5} size="w-4 h-4" />
                        <span className="font-bold text-gray-900">Marcin K.</span>
                        <span className="text-gray-500 text-sm">Warszawa</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        "Używam podczas biegania zimą. Wreszcie mogę trenować bez grubych kurtek! Lekka, elastyczna i mega skuteczna."
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <StarRating rating={5} size="w-4 h-4" />
                        <span className="font-bold text-gray-900">Anna T.</span>
                        <span className="text-gray-500 text-sm">Gdańsk</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        "Idealna na spacery z psem o 6 rano. Trzy tryby ciepła to strzał w dziesiątkę - dostosowuję do pogody."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    🎯 Dlaczego wybierają ThermoVest Pro?
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Natychmiastowe ciepło</h4>
                        <p className="text-gray-600 text-sm">Nagrzewa się w mniej niż 10 sekund</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Długa praca na baterii</h4>
                        <p className="text-gray-600 text-sm">Do 8 godzin ciągłego działania</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Możliwość prania</h4>
                        <p className="text-gray-600 text-sm">Bezpieczne po odłączeniu kabla USB</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Uniwersalny rozmiar</h4>
                        <p className="text-gray-600 text-sm">Dopasowuje się do każdej sylwetki</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-red-600">98%</span>
                        <div className="text-sm text-gray-600">Zadowolonych klientów</div>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-orange-600">280+</span>
                        <div className="text-sm text-gray-600">Pozytywnych opinii</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="relative">
                  <img
                    src="/images/giacca/11.jpg"
                    alt="ThermoVest Pro w rzeczywistym użytkowaniu"
                    className="w-full rounded-2xl shadow-2xl"
                  />
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    🏆 Najczęściej kupowane
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-xs">
                    Efekt po 3 tygodniach użytkowania
                  </div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-2xl shadow-xl max-w-2xl mx-auto">
                <h4 className="text-xl font-bold mb-2">
                  🔥 Dołącz do grona zadowolonych klientów!
                </h4>
                <p className="mb-4 opacity-90">
                  Zamów ThermoVest Pro już dziś i poczuj różnicę od pierwszego użycia
                </p>

              </div>
            </div>
          </div>
        </section>

        {/* Detailed Product Features Section 3 - Technology & Materials */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Zaawansowana technologia w każdym szczególe
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                ThermoVest Pro to rezultat lat badań nad optymalnym rozprowadzaniem ciepła i komfortem użytkowania w każdych warunkach
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

              {/* Technology Feature 1 */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Thermometer className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Włókna węglowe nowej generacji</h3>
                <p className="text-gray-700 mb-4">
                  Nanotechnologia włókien węglowych zapewnia równomierne nagrzewanie przy minimalnym zużyciu energii.
                  Elastyczne i trwałe - wytrzymują tysiące cykli włączania.
                </p>
                <div className="bg-white rounded-lg p-3">
                  <span className="text-2xl font-bold text-purple-600">99%</span>
                  <div className="text-sm text-gray-600">Sprawność konwersji energii</div>
                </div>
              </div>

              {/* Technology Feature 2 */}
              <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Battery className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Inteligentne zarządzanie energią</h3>
                <p className="text-gray-700 mb-4">
                  Mikrokontroler automatycznie dostosowuje pobór mocy do wybranego trybu.
                  Optymalizuje zużycie baterii dla maksymalnego czasu pracy.
                </p>
                <div className="bg-white rounded-lg p-3">
                  <span className="text-2xl font-bold text-orange-600">8h</span>
                  <div className="text-sm text-gray-600">Czas pracy ciągłej</div>
                </div>
              </div>

              {/* Technology Feature 3 */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wind className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Materiały premium</h3>
                <p className="text-gray-700 mb-4">
                  Tkanina z mikrofibry poliestrowej z membraną oddychającą.
                  Wodoodporna (IPX4), wiatroszczelna, ale przepuszcza parę wodną.
                </p>
                <div className="bg-white rounded-lg p-3">
                  <span className="text-2xl font-bold text-cyan-600">IPX4</span>
                  <div className="text-sm text-gray-600">Odporność na warunki atmosferyczne</div>
                </div>
              </div>
            </div>

            {/* Detailed Infographic Section */}
            <div className="bg-gray-900 rounded-3xl p-8 lg:p-12 text-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-6">Mapowanie stref grzewczych</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span><strong>Strefa 1 & 2:</strong> Plecy górne i dolne - główny obszar nagrzewania</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span><strong>Strefa 3:</strong> Kark i ramiona - przeciwdziałanie utracie ciepła</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span><strong>Strefa 4 & 5:</strong> Brzuch i okolice nerek - ochrona organów wewnętrznych</span>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-bold mb-2">🧪 Dane techniczne</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Moc maksymalna:</span><br />
                        <span className="font-bold">45W (9W na strefę)</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Napięcie:</span><br />
                        <span className="font-bold">5V DC ±0.5V</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Temperatura max:</span><br />
                        <span className="font-bold">55°C ±3°C</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Czas rozgrzewki:</span><br />
                        <span className="font-bold">&lt; 10 sekund</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <img
                    src="/images/giacca/4.jpg"
                    alt="Schemat rozmieszczenia stref grzewczych ThermoVest Pro"
                    className="w-full rounded-2xl shadow-2xl"
                  />
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    5 STREF
                  </div>

                  {/* Heat zone indicators */}
                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
                    <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="absolute top-32 left-8">
                    <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="absolute top-32 right-8">
                    <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="absolute bottom-32 left-12">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="absolute bottom-32 right-12">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison with traditional heating */}
            <div className="mt-16">
              <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Dlaczego ThermoVest Pro vs tradycyjne rozwiązania?
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold">Cecha</th>
                      <th className="px-6 py-4 text-center font-bold">ThermoVest Pro</th>
                      <th className="px-6 py-4 text-center font-bold">Tradycyjne ogrzewanie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Czas rozgrzewania</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          &lt; 10 sekund
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          5-15 minut
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Mobilność</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Pełna swoboda
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Ograniczona
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Zużycie energii</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          45W max
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          1000-2000W
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Precyzja temperatury</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          3 poziomy LED
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          Podstawowa
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Product Details Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Sekcja opis/specyfikacja
              </h2>
              <p className="text-lg text-gray-600">
                Materiał, zasilanie, tryby, bezpieczeństwo i pielęgnacja
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Specyfikacja techniczna:</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Materiał:</strong> lekki, szybkoschnący, odporny na wilgoć</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Zasilanie:</strong> USB 5V/2A (powerbank w zestawie)</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Czas pracy:</strong> do 8 h (z powerbankiem 10.000 mAh)</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Tryby:</strong> niski/średni/wysoki – kontrolka LED</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Bezpieczeństwo:</strong> ochrona przed przegrzaniem, auto-off</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Pielęgnacja:</strong> odłącz kabel, delikatne pranie, szybkie schnięcie</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Dlaczego ThermoVest Pro?</h3>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-blue-800 font-medium mb-2">
                      ✨ Idealna dla osób aktywnych
                    </p>
                    <p className="text-blue-700 text-sm">
                      ThermoVest Pro to połączenie nowoczesnej technologii grzewczej z wygodą i stylem.
                      Idealna dla osób, które nie lubią marznąć zimą – od sportowców po kierowców i spacerowiczów.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              FAQ
            </h2>

            <div className="space-y-4">
              <FAQ
                question="Czy powerbank jest w zestawie?"
                answer="Tak! W komplecie znajduje się powerbank 10 000 mAh, gotowy do użycia od razu po wyjęciu z pudełka."
              />
              <FAQ
                question="Jak długo działa?"
                answer="Do 8 godzin, zależnie od trybu i pojemności powerbanku."
              />
              <FAQ
                question="Czy można prać?"
                answer="Tak, po odłączeniu przewodu USB. Zalecamy delikatny program."
              />
              <FAQ
                question="Dla kogo?"
                answer="Model unisex – dla kobiet i mężczyzn, na co dzień i do aktywności."
              />
            </div>
          </div>
        </section>

        {/* Delivery & Returns Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Dostawa/zwrot + CTA finale
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Darmowa dostawa</h3>
                <p className="text-gray-600 text-sm">Darmowa dostawa (3–4 dni) • Wysyłka 24/48 h • 30 dni na zwrot</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Wysyłka 24/48h</h3>
                <p className="text-gray-600 text-sm">Ekspresowe przygotowanie • Śledzenie przesyłki SMS • Dostawa door-to-door</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">30 dni na zwrot</h3>
                <p className="text-gray-600 text-sm">Gwarancja satysfakcji • Prosty proces zwrotu • Pełen zwrot kosztów</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Order Button */}
        {showStickyButton && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
            <div className="max-w-md mx-auto">
              <button
                onClick={handleOrderClick}
                className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${bounceAnimation ? 'animate-bounce' : ''}`}
              >
                🛒 ZAMÓW TERAZ - 299,00 zł
              </button>
            </div>
          </div>
        )}

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

              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 pr-8">Wypełnij aby zamówić</h3>
              <p className="text-gray-600 mb-4 md:mb-6">Płatność przy odbiorze</p>

              <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Podsumowanie zamówienia</h4>
                <div className="flex items-center gap-3">
                  <img
                    src={COLOR_IMAGE_MAP[color]}
                    alt={`Wybrany kolor: ${color}`}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm md:text-base">🔥 ThermoVest Pro – Unisex kurtka grzewcza z zasilaniem USB + Powerbank w cenie!</div>
                    <div className="text-xs md:text-sm text-gray-600">{color} • Rozmiar {size}</div>
                    <div className="text-xs md:text-sm text-green-600">✅ Darmowa dostawa</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg md:text-xl text-gray-900">299,00 zł</div>
                    <div className="text-xs text-gray-500 line-through">747,50 zł</div>
                  </div>
                </div>

                {/* Hidden inputs for external selection sync */}
                <input type="hidden" name="color" value={color} />
                <input type="hidden" name="size" value={size} />
                <input type="hidden" name="color_image" value={COLOR_IMAGE_MAP[color]} />

                {/* Order Summary - Selected Variants */}
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px',
                  marginTop: '12px',
                  fontSize: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#6B7280' }}>Twój wybór:</span>
                    <span style={{ fontWeight: 'bold', color: '#111827' }}>{color} • {size}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 md:mb-6">
                <div className="text-center">
                  <div className="text-xs text-red-600 mb-1">🔒 Rezerwujemy Twoje zamówienie</div>
                  <div className="text-xl md:text-2xl font-mono font-bold text-red-700">
                    {reservationTimer.minutes.toString().padStart(2, '0')}:{reservationTimer.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    Pozostały czas na sfinalizowanie zamówienia
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko *</label>
                  <input
                    type="text"
                    value={formData.imie}
                    onChange={(e) => handleFormChange('imie', e.target.value)}
                    className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 text-base ${formErrors.imie
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                      }`}
                    placeholder="Twoje pełne imię i nazwisko"
                  />
                  {formErrors.imie && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.imie}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numer Telefonu *</label>
                  <input
                    type="tel"
                    value={formData.telefon}
                    onChange={(e) => handleFormChange('telefon', e.target.value)}
                    className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 text-base ${formErrors.telefon
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                      }`}
                    placeholder="Twój numer telefonu"
                  />
                  {formErrors.telefon && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.telefon}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pełny Adres *</label>
                  <textarea
                    value={formData.adres}
                    onChange={(e) => handleFormChange('adres', e.target.value)}
                    className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 h-20 md:h-20 text-base resize-none ${formErrors.adres
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                      }`}
                    placeholder="Ulica, numer domu, miasto, kod pocztowy"
                  />
                  {formErrors.adres && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.adres}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4 mt-4 text-gray-700">
                <Shield className="w-5 h-5" />
                <span className="font-medium text-sm md:text-base">Płatność przy odbiorze</span>
              </div>

              <button
                onClick={handleOrderSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 text-base md:text-lg"
              >
                {isSubmitting ? 'PRZETWARZANIE...' : 'POTWIERDŹ ZAMÓWIENIE - 299,00 zł'}
              </button>
            </div>
          </div>
        )}

        {/* Size Guide Modal */}
        <SizeGuideModal
          isOpen={showSizeGuide}
          onClose={() => setShowSizeGuide(false)}
        />

        <Footer />

        <CountdownTimer />
      </div>

    </>
  );
}