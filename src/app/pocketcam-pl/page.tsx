'use client';

import { useState, useEffect } from 'react';
import {
  Star,
  Check,
  Clock,
  Shield,
  Truck,
  Heart,
  AlertCircle,
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Play,
  Wifi,
  Monitor,
  Settings
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

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">PocketCam 4K Pro</h3>
            <p className="text-gray-400 text-sm">
              Kompaktowe kamery 4K z obrotowym obiektywem 270° do nagrań POV.
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
              © 2024 PocketCam 4K Pro. Wszelkie prawa zastrzeżone.
            </p>
            <div className="flex space-x-6">
              <a href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Polityka prywatności</a>
              <a href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Regulamin</a>
              <a href="/cookies" className="text-sm text-gray-400 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500 max-w-4xl mx-auto">
            PocketCam 4K Pro to marka kompaktowych kamer 4K z obrotowym obiektywem 270°.
            Wszystkie produkty objęte są gwarancją jakości i satysfakcji klienta.
          </div>
        </div>
      </div>
    </footer>
  );
};

// Reviews carousel component
const ReviewsCarousel = () => {
  const [currentReview, setCurrentReview] = useState(0);

  const reviews = [
    "/images/camera/rec/rec_1.jpg",
    "/images/camera/rec/rec_2.jpg",
    "/images/camera/rec/rec_3.jpg",
    "/images/camera/rec/rec_4.jpg",
    "/images/camera/rec/rec_5.jpg",
    "/images/camera/rec/rec_6.jpg",
    "/images/camera/rec/rec_7.jpg",
    "/images/camera/rec/rec_8.jpg"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview(prev => (prev + 1) % reviews.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(timer);
  }, []);

  const nextReview = () => {
    setCurrentReview(prev => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview(prev => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToReview = (index: number) => {
    setCurrentReview(index);
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Main Review Display */}
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-emerald-200">
        <div className="aspect-[4/3] relative">
          <img
            src={reviews[currentReview]}
            alt={`Opinia klienta ${currentReview + 1} - PocketCam 4K Pro`}
            className="w-full h-full object-contain bg-gray-50"
          />

          {/* Navigation Arrows */}
          <button
            onClick={prevReview}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
            aria-label="Poprzednia opinia"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextReview}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
            aria-label="Następna opinia"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Review Counter */}
          <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            📝 {currentReview + 1}/{reviews.length}
          </div>

          {/* Verified Badge */}
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
            <Check className="w-4 h-4" />
            <span>Zweryfikowany zakup</span>
          </div>
        </div>
      </div>

      {/* Thumbnails Navigation */}
      <div className="flex justify-center space-x-2 mt-6 overflow-x-auto pb-2">
        {reviews.map((_, index) => (
          <button
            key={index}
            onClick={() => goToReview(index)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentReview
              ? 'border-emerald-500 ring-2 ring-emerald-200'
              : 'border-gray-300 hover:border-emerald-300'
              }`}
            aria-label={`Zobacz opinię ${index + 1}`}
          >
            <img
              src={reviews[index]}
              alt={`Miniatura opinii ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center space-x-2 mt-4">
        {reviews.map((_, index) => (
          <button
            key={index}
            onClick={() => goToReview(index)}
            className={`w-3 h-3 rounded-full transition-colors ${index === currentReview ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            aria-label={`Przejdź do opinii ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// Product carousel for camera
const ProductCarousel = () => {
  const [selectedImage, setSelectedImage] = useState(0);

  // Camera images
  const images = [
    "/images/camera/1.jpg",
    "/images/camera/2.jpg",
    "/images/camera/3.jpg",
    "/images/camera/4.jpg",
    "/images/camera/5.jpg",
    "/images/camera/6.jpg"
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto bg-white rounded-2xl overflow-hidden shadow-xl">
      {/* Main Image Display */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={images[selectedImage]}
          alt={`PocketCam 4K Pro - kamera POV widok ${selectedImage + 1}`}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* Image Badge */}
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
          Zdjęcie {selectedImage + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="bg-gray-50 p-4">
        <div className="flex justify-center space-x-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === selectedImage
                ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                : 'border-gray-300 hover:border-blue-300'
                }`}
              aria-label={`Zobacz zdjęcie ${index + 1}`}
            >
              <img
                src={image}
                alt={`Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Image Description */}
        <div className="text-center mt-3">
          <p className="text-sm text-gray-600">
            Kliknij na miniaturę aby zobaczyć szczegóły
          </p>
        </div>
      </div>
    </div>
  );
};

export default function PocketCamLanding() {
  const [mounted, setMounted] = useState(false);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [reservationTimer, setReservationTimer] = useState({ minutes: 5, seconds: 0 });
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [bounceAnimation, setBounceAnimation] = useState(false);

  const [formData, setFormData] = useState({
    imie: '',
    telefon: '',
    adres: '',
    uid: '01980825-ae5a-7aca-8796-640a3c5ee3da',
    key: 'ad79469b31b0058f6ea72c',
    offer: '341',
    lp: '341'
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

  const handleOrderClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_type: 'product',
        content_ids: ['pocketcam-4k-pro'],
        content_name: 'PocketCam 4K Pro™ – Mini kamera POV z obrotowym obiektywem 270°',
        value: 299.00,
        currency: 'PLN',
        num_items: 1
      });
    }

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        event_category: 'ecommerce',
        event_label: 'PocketCam 4K Pro',
        value: 209.00
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

    if (!validateForm()) {
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
            content_ids: ['pocketcam-4k-pro'],
            content_name: 'PocketCam 4K Pro™ – Mini kamera POV z obrotowym obiektywem 270°',
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

            traffic_source: trackingUtils.getTrafficSource(),
            user_agent: navigator.userAgent,
            fbp: trackingUtils.getFbBrowserId(),
            fbc: trackingUtils.getFbClickId(),
            product_name: 'PocketCam 4K Pro™ – Mini kamera POV z obrotowym obiektywem 270°',
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
        offer: '25',
        lp: '25',
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
        product: 'PocketCam 4K Pro™ – Mini kamera POV z obrotowym obiektywem 270°',
        price: 299.00,
        currency: 'PLN',

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
        const orderId = typeof window !== 'undefined' ? `ANT${Date.now()}` : 'ANT1694880000000';

        // Store order data for thank you page
        localStorage.setItem('orderData', JSON.stringify({
          ...formData,
          orderId,
          product_name: 'PocketCam 4K Pro™ – Mini kamera POV z obrotowym obiektywem 270°',
          price: '299,00 PLN'
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
        window.location.href = '/ty-pocketcam-pl';
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

        {/* Hero Section */}
        <section className="bg-white py-8 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-1">
                <ProductCarousel />
              </div>

              <div className="order-2 space-y-6">
                <div className="flex items-center space-x-2">
                  <StarRating rating={5} size="w-5 h-5" />
                  <span className="text-yellow-600 font-medium">4.9</span>
                  <span className="text-gray-600">(347 opinii)</span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  PocketCam 4K Pro™ – Twoje wspomnienia i content w najlepszej jakości 4K
                </h1>

                <p className="text-lg text-gray-700 font-medium">
                  Od rodzinnych wspomnień po viral TikToki – zachowaj każdą ważną chwilę w jakości 4K. Mała, dyskretna, zawsze pod ręką!
                </p>

                <div className="space-y-3">

                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>4K Ultra HD + tryby slow motion/time-lapse</strong> – najwyższa jakość nagrania</span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Obrotowy obiektyw 270°</strong> – idealny kadr z każdej perspektywy</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Mikrofon zewnętrzny w zestawie</strong> – czysty dźwięk bez zakłóceń</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Karta pamięci 64 GB w komplecie</strong> – nagrywasz od razu po wyjęciu z pudełka</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Kieszonkowy rozmiar</strong> – przypinana klipsem do ubrania/plecaka</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Wielofunkcyjna</strong> – wesela, urodziny, wakacje + TikTok, Instagram, YouTube</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Podwójne zastosowanie</strong> – rodzinne wspomnienia i viral content w jednej kamerce</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Tryby nagrywania</strong> – zdjęcia seryjne, nagrywanie w pętli</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base"><strong>Lekka, kompaktowa</strong> – nowoczesny design i wysoka jakość</span>
                  </div>
                </div>

                {/* Pricing Section */}
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
                    -60% ZNIŻKI (oferta limitowana)
                  </div>
                  <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                    Darmowa dostawa • Płatność przy odbiorze
                  </p>

                  <StockIndicator />

                  <button
                    onClick={handleOrderClick}
                    className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg mt-4 ${bounceAnimation ? 'animate-bounce' : ''}`}
                  >
                    ZAMÓW POCKETCAM 4K PRO – Płatność przy odbiorze
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

        {/* Benefit Grid */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Dlaczego warto wybrać PocketCam 4K Pro?
              </h2>
              <p className="text-lg text-gray-600">
                Kompaktowa kamera 4K idealna na wakacje, uroczystości rodzinne i tworzenie contentu na TikTok, Instagram, YouTube
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
                    <Wifi className="w-8 h-8 text-white z-10" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">4K Ultra HD</h3>
                <p className="text-gray-600">
                  Najwyższa jakość nagrywania w rozdzielczości 4K, 2.7K, 1080p i 720p
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-40"></div>
                  <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-60"></div>
                  <div className="absolute inset-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-white z-10" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Obrotowy obiektyw 270°</h3>
                <p className="text-gray-600">
                  Dopasuj idealny kadr z każdej perspektywy – wesela, urodziny, wakacje
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-20"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-40"></div>
                  <div className="absolute inset-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-60"></div>
                  <div className="absolute inset-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Settings className="w-8 h-8 text-white z-10" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Kompaktowy rozmiar</h3>
                <p className="text-gray-600">
                  Mały, lekki, kieszonkowy – przypinany klipsem do ubrania lub plecaka
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-40"></div>
                  <div className="absolute inset-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-60"></div>
                  <div className="absolute inset-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-8 h-8 text-white z-10" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Zestaw kompletny</h3>
                <p className="text-gray-600">
                  Mikrofon zewnętrzny + klips + karta 64 GB – wszystko w pudełku
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full opacity-20"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full opacity-40"></div>
                  <div className="absolute inset-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full opacity-60"></div>
                  <div className="absolute inset-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white z-10" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Wielofunkcyjność</h3>
                <p className="text-gray-600">
                  Tryby: slow motion, time-lapse, zdjęcia seryjne, nagrywanie w pętli
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full opacity-20"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full opacity-40"></div>
                  <div className="absolute inset-4 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full opacity-60"></div>
                  <div className="absolute inset-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Truck className="w-8 h-8 text-white z-10" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Życie + Social Media</h3>
                <p className="text-gray-600">
                  Wesela, urodziny, wakacje + TikToki, Reels, vlogi – każda chwila w 4K Ultra HD
                </p>
              </div>
            </div>
          </div>
        </section>



        {/* Customer Reviews Images Section */}
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                📸 Prawdziwe Opinie Naszych Klientów
              </h2>
              <p className="text-xl text-gray-600">
                Zdjęcia i opinie od osób, które już używają PocketCam 4K Pro
              </p>
            </div>

            <ReviewsCarousel />

            {/* Summary Stats */}
            <div className="text-center mt-8">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-emerald-200 max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-2xl font-bold text-gray-900 ml-2">4.9/5</span>
                </div>
                <p className="text-gray-700 mb-2">
                  <strong>Ponad 350+ zweryfikowanych zakupów</strong>
                </p>
                <p className="text-gray-600 text-sm">
                  Wszystkie opinie pochodzą od rzeczywistych klientów, którzy zakupili i testują PocketCam 4K Pro w swoich domach
                </p>
              </div>
            </div>

            {/* Written Reviews Section */}
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
                💬 Co piszą nasi klienci
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Review 1 */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <StarRating rating={5} size="w-4 h-4" />
                    <span className="font-bold text-gray-900">Marek W.</span>
                    <span className="text-gray-500 text-sm">Warszawa</span>
                    <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ✓ Zweryfikowany zakup
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">
                    "Fantastyczna kamerka! Używam PocketCam do nagrywania moich wypraw z psem. Jakość 4K robi wrażenie, a mikrofon zewnętrzny świetnie radzi sobie z wiatrem. Klips trzyma mocno nawet podczas biegania."
                  </p>
                  <div className="text-xs text-gray-500">
                    📅 Zakupiono 3 tygodnie temu • 👍 Poleca znajomym
                  </div>
                </div>

                {/* Review 2 */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <StarRating rating={5} size="w-4 h-4" />
                    <span className="font-bold text-gray-900">Anna K.</span>
                    <span className="text-gray-500 text-sm">Kraków</span>
                    <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ✓ Zweryfikowany zakup
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">
                    "Kupiłam PocketCam na wakacje i to najlepszy zakup roku! Nagrałam wspaniałe wspomnienia z plaży I viral TikToki z wakacji które mają już 50k wyświetleń! Ta sama kamerka do wspomnień i content creation - genialne!"
                  </p>
                  <div className="text-xs text-gray-500">
                    📅 Zakupiono 2 tygodnie temu • 🏆 TOP recenzent
                  </div>
                </div>

                {/* Review 3 */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <StarRating rating={5} size="w-4 h-4" />
                    <span className="font-bold text-gray-900">Tomasz L.</span>
                    <span className="text-gray-500 text-sm">Gdańsk</span>
                    <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ✓ Zweryfikowany zakup
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">
                    "Używam PocketCam do nagrywania rowerowych przejażdżek. Mikrofon zewnętrzny to game changer - dźwięk krystalicznie czysty nawet przy wietrze. Klips trzyma mocno, a karta 64GB spokojnie wystarcza na całą wycieczkę!"
                  </p>
                  <div className="text-xs text-gray-500">
                    📅 Zakupiono miesiąc temu • ⭐ 5/5 gwiazdek
                  </div>
                </div>

                {/* Review 4 */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <StarRating rating={5} size="w-4 h-4" />
                    <span className="font-bold text-gray-900">Kasia M.</span>
                    <span className="text-gray-500 text-sm">Wrocław</span>
                    <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ✓ Zweryfikowany zakup
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">
                    "Początkowo myślałam, że to kolejny gadżet, ale PocketCam totalnie mnie zaskoczyła! Tryb slow motion i time-lapse to czysta magia. Nagrywam dzieci na podwórku i każdy moment jest jak z filmu. Prostota obsługi na 5+!"
                  </p>
                  <div className="text-xs text-gray-500">
                    📅 Zakupiono 10 dni temu • 🎯 Idealny zakup
                  </div>
                </div>

                {/* Review 5 */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <StarRating rating={5} size="w-4 h-4" />
                    <span className="font-bold text-gray-900">Piotr S.</span>
                    <span className="text-gray-500 text-sm">Poznań</span>
                    <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ✓ Zweryfikowany zakup
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">
                    "Używam PocketCam na wszystkich rodzinnych wydarzeniach. Na weselu córki nagrałam wspaniałe chwile z różnych perspektyw dzięki obrotowemu obiektywowi. Goście byli zachwyceni jakością nagrań. Teraz to must-have na każdej uroczystości!"
                  </p>
                  <div className="text-xs text-gray-500">
                    📅 Zakupiono 6 dni temu • 🚀 Błyskawiczna dostawa
                  </div>
                </div>

                {/* Review 6 */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <StarRating rating={5} size="w-4 h-4" />
                    <span className="font-bold text-gray-900">Michał D.</span>
                    <span className="text-gray-500 text-sm">Łódź</span>
                    <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ✓ Zweryfikowany zakup
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">
                    "Zamówiłem dla rodziców z małej miejscowości. Wcześniej mieli okropny odbiór przez stare anteny. Teraz mają wszystkie kanały HD plus dostęp do Player i Canal+ przez internet. Są zachwyceni, ja jestem bohaterem rodziny 😄"
                  </p>
                  <div className="text-xs text-gray-500">
                    📅 Zakupiono 2 tygodnie temu • 💝 Idealny prezent
                  </div>
                </div>
              </div>

              {/* Call to Action after reviews */}
              <div className="text-center mt-12">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-2xl shadow-xl">
                  <h4 className="text-xl font-bold mb-2">
                    🌟 Dołącz do 350+ zadowolonych klientów!
                  </h4>
                  <p className="mb-4 opacity-90">
                    Zamów PocketCam 4K Pro już dziś i zacznij tworzyć niesamowite treści w jakości 4K z każdej perspektywy
                  </p>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Streaming Capabilities Section */}
        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <img
                    src="/images/camera/2.jpg"
                    alt="PocketCam 4K Pro - nagrywanie w jakości 4K"
                    className="w-full rounded-2xl shadow-2xl"
                  />
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    4K READY
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-xs">
                    WSPOMNIENIA 4K
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="bg-gradient-to-br from-white to-indigo-50 p-8 rounded-2xl shadow-xl border border-indigo-100">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                    💕 Życie + Social Media w Jednej Kamerce
                  </h2>

                  <p className="text-lg text-gray-700 mb-6">
                    Dzięki PocketCam 4K Pro z obrotowym obiektywem 270° nagrasz <strong>każdą ważną chwilę</strong> — od wesela i wakacji po viral TikToki i Instagram Reels.
                  </p>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <Play className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold">TikTok + Instagram</h3>
                          <p className="text-sm opacity-90">Viral content w najlepszej jakości</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold">Wakacje + Podróże</h3>
                          <p className="text-sm opacity-90">Wspomnienia z wypraw na całe życie</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <Wifi className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold">YouTube + Vlogi</h3>
                          <p className="text-sm opacity-90">Profesjonalne nagrania w 4K</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm font-medium">
                      💡 <strong>Pro tip:</strong> PocketCam 4K Pro z obrotowym obiektywem 270° pozwala nagrywać z każdej perspektywy - idealne do wspomnień I viral content!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Superiority Section */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🚀 Technologia Przyszłości w Twoim Domu
              </h2>
              <p className="text-xl text-gray-600">
                Dlaczego PocketCam 4K Pro to najbardziej zaawansowana kamera kieszonkowa na rynku?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Advanced Signal Processing */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border-2 border-blue-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Zaawansowane Funkcje Nagrywania</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Stabilizacja obrazu:</strong> eliminuje drgania podczas nagrywania</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Auto-focus:</strong> zawsze ostre nagrania bez ręcznego ustawiania</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Redukcja szumów:</strong> czysty dźwięk nawet w głośnych miejscach</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-white/50 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">
                    Wynik: Profesjonalne nagrania nawet w trudnych warunkach
                  </p>
                </div>
              </div>

              {/* Future-Proof Technology */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border-2 border-purple-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Social Media + Wspomnienia</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>4K dla TikTok:</strong> najwyższa jakość na social media</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Tryb portretowy:</strong> idealny do Instagram Stories i Reels</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Automatyczne formaty:</strong> dostosowuje się do każdej platformy</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-white/50 rounded-lg">
                  <p className="text-xs text-purple-700 font-medium">
                    Idealna na lata — od rodzinnych wspomnień po viral content!
                  </p>
                </div>
              </div>

              {/* Universal Compatibility */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Wszechstronne Zastosowania</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Wakacje:</strong> plaża, góry, zwiedzanie miast</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Uroczystości:</strong> wesela, urodziny, chrzciny</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Codzienność:</strong> spacery z dziećmi, spotkania rodzinne</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-white/50 rounded-lg">
                  <p className="text-xs text-green-700 font-medium">
                    Kamera dla życia — wszędzie gdzie chcesz zachować wspomnienia!
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="mt-16 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <h3 className="text-2xl font-bold text-center">PocketCam 4K Pro vs. Zwykłe kamery</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-4 font-semibold">Funkcja</th>
                      <th className="text-center p-4 font-semibold text-green-600">PocketCam 4K Pro</th>
                      <th className="text-center p-4 font-semibold text-gray-500">Zwykłe kamery</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b">
                      <td className="p-4 font-medium">Nagrywanie 4K Ultra HD</td>
                      <td className="text-center p-4"><span className="text-green-600 font-bold text-lg">✓</span></td>
                      <td className="text-center p-4"><span className="text-red-500 font-bold text-lg">✗</span></td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="p-4 font-medium">Obrotowy obiektyw 270°</td>
                      <td className="text-center p-4"><span className="text-green-600 font-bold text-lg">✓</span></td>
                      <td className="text-center p-4"><span className="text-red-500 font-bold text-lg">✗</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Mikrofon zewnętrzny w zestawie</td>
                      <td className="text-center p-4"><span className="text-green-600 font-bold text-lg">✓</span></td>
                      <td className="text-center p-4"><span className="text-red-500 font-bold text-lg">✗</span></td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="p-4 font-medium">Karta pamięci 64 GB w komplecie</td>
                      <td className="text-center p-4"><span className="text-green-600 font-bold text-lg">✓</span></td>
                      <td className="text-center p-4"><span className="text-orange-500 font-bold">Osobno</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Kieszonkowy rozmiar + klips</td>
                      <td className="text-center p-4"><span className="text-green-600 font-bold text-lg">✓</span></td>
                      <td className="text-center p-4"><span className="text-orange-500 font-bold">Duże i ciężkie</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Complete Entertainment Ecosystem Section */}
        <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                📱 Kompletny System Tworzenia Treści
              </h2>
              <p className="text-xl text-gray-600">
                Jedna kamera, nieskończone możliwości nagrywania
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    Życie + Social Media
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <div className="font-bold text-red-600">Wesela</div>
                      <div className="text-xs text-gray-600">Najważniejszy dzień</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <div className="font-bold text-blue-600">TikTok</div>
                      <div className="text-xs text-gray-600">Viral videos</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                      <div className="font-bold text-purple-600">Wakacje</div>
                      <div className="text-xs text-gray-600">Wspomnienia na lata</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                      <div className="font-bold text-orange-600">Instagram</div>
                      <div className="text-xs text-gray-600">Reels + Stories</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <div className="font-bold text-green-600">Rodzina</div>
                      <div className="text-xs text-gray-600">Codzienne chwile</div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
                      <div className="font-bold text-indigo-600">YouTube</div>
                      <div className="text-xs text-gray-600">Vlogi + Content</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">🎬 Rodzaje Nagrań:</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="bg-white px-2 py-1 rounded text-center font-medium">Portret</span>
                      <span className="bg-white px-2 py-1 rounded text-center font-medium">9:16 TikTok</span>
                      <span className="bg-white px-2 py-1 rounded text-center font-medium">16:9 YouTube</span>
                      <span className="bg-white px-2 py-1 rounded text-center font-medium">Time-lapse</span>
                      <span className="bg-white px-2 py-1 rounded text-center font-medium">Slow motion</span>
                      <span className="bg-white px-2 py-1 rounded text-center font-medium">Selfie</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Monitor className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Tryby Nagrywania 4K (WSZYSTKIE W ZESTAWIE)</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          Wszystkie tryby nagrywania w jednej kompaktowej kamerce
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">4K 60fps</span>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">2.7K</span>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">1080p 120fps</span>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">720p</span>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">+Slow motion</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wifi className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Obrotowy obiektyw 270° = Wszystkie kąty</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          Połączenie kompaktowej kamery z obrotowym obiektywem daje pełną kontrolę nad kadrem
                        </p>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
                          <p className="text-purple-800 text-sm">
                            <strong>Efekt:</strong> Wspaniałe nagrania ślubne + urodzinowe + wakacyjne w jednej kamerce!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Details Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🔧 Specyfikacja Techniczna i Zastosowanie
              </h2>
              <p className="text-lg text-gray-600">
                4K Ultra HD, obrotowy obiektyw 270°, mikrofon, karta pamięci i wszechstronne zastosowania
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Specyfikacja techniczna:</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Rozdzielczość:</strong> 4K Ultra HD (3840x2160), 2.7K, 1080p, 720p</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Obiektyw:</strong> obrotowy 270° z regulacją kąta</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Audio:</strong> mikrofon zewnętrzny + wbudowany mikrofon</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Pamięć:</strong> karta microSD 64 GB w zestawie</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Bateria:</strong> 2-3h nagrywania 4K, ładowanie USB-C</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Montaż:</strong> klips do ubrania, magnes, opaska na głowę</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Dlaczego PocketCam 4K Pro?</h3>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-blue-800 font-medium mb-2">
                      ✨ Idealna dla każdej sytuacji
                    </p>
                    <p className="text-blue-700 text-sm mb-4">
                      PocketCam 4K Pro to połączenie najnowszej technologii nagrywania 4K z ultraporęcznym designem.
                      Idealna na wakacje, urodziny, wesela i codzienne chwile.
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
              Często zadawane pytania
            </h2>

            <div className="space-y-4">
              <FAQ
                question="Jak długo wytrzymuje bateria?"
                answer="Bateria wystarcza na około 2-3 godziny nagrywania w 4K lub 4-5 godzin w 1080p. W zestawie ładowarka USB-C."
              />
              <FAQ
                question="Czy kamera nagrywa w 4K 60 fps?"
                answer="Tak, PocketCam obsługuje nagrywanie w 4K przy 30 i 60 fps, a także w 2.7K, 1080p i 720p w różnych trybach."
              />
              <FAQ
                question="Czy mogę używać jej jako bodycam / kamerę POV?"
                answer="Absolutnie! Dzięki obrotowemu obiektywowi 270° i klipsowi montażowemu, PocketCam jest idealna do nagrań POV, bodycam, vlogów i sportowych aktywności."
              />
              <FAQ
                question="Czy karta 64 GB jest w zestawie?"
                answer="Tak, w komplecie otrzymujesz kartę microSD 64 GB, mikrofon zewnętrzny, klips montażowy i wszystkie niezbędne akcesoria."
              />
              <FAQ
                question="Czy działa w słabym oświetleniu?"
                answer="Tak, PocketCam ma zaawansowany sensor i funkcje nocne, które zapewniają dobre nagrania nawet w gorszych warunkach oświetleniowych."
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

            <div className="text-center mt-12">
              <button
                onClick={handleOrderClick}
                className={`bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${bounceAnimation ? 'animate-bounce' : ''}`}
              >
                ZAMÓW TERAZ – Promocja –60%
              </button>
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
                ZAMÓW TERAZ - 299,00 zł
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
                    src="/images/camera/1.jpg"
                    alt="PocketCam 4K Pro - Mini kamera POV 4K"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm md:text-base">🔥 PocketCam 4K Pro™ – Mini kamera POV z obrotowym obiektywem 270° (4K, mikrofon, karta 64GB)</div>
                    <div className="text-xs md:text-sm text-gray-600">4K Ultra HD, obrotowy obiektyw 270°, mikrofon + karta w zestawie</div>
                    <div className="text-xs md:text-sm text-green-600">✅ Darmowa dostawa</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg md:text-xl text-gray-900">299,00 zł</div>
                    <div className="text-xs text-gray-500 line-through">747,50 zł</div>
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

        <Footer />

        <CountdownTimer />
      </div>

    </>
  );
}