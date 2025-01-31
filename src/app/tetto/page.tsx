'use client';

import Image from 'next/image';
import { useState } from 'react';

import RegionMap from '../components/RegionMap';

export default function Home() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    // Qui puoi aggiungere la logica per gestire la selezione della provincia
  };

  return (
    <main className='max-w-4xl mx-auto px-4 py-8 bg-white'>
      {/* Header */}
      <div className='text-center text-yellow-500 text-sm mb-4'>
        ADVERTORIAL
      </div>

      {/* Title */}
      <h1 className='text-3xl md:text-4xl font-bold text-gray-800 mb-6'>
        Riparazione Tetto: Oggi i proprietari di casa possono risparmiare fino
        al 70% grazie a questa nuova tecnologia (se idonei)
      </h1>

      {/* Author and Date */}
      <div className='flex gap-2 text-gray-500 text-sm mb-8'>
        <span>31/01/2025</span>
        <span>|</span>
        <span>Andrea Giulioni</span>
      </div>

      {/* Comparison Images */}
      <div className='grid md:grid-cols-1 gap-4 mb-8'>
        <div className='relative'>
          <Image
            src='https://vivingreen.it/wp-content/uploads/2024/05/Copy-of-Add-a-heading-scaled-2-768x384.jpg'
            alt='Vecchio Metodo'
            width={800}
            height={440}
            className='w-full rounded-lg'
          />
        </div>
      </div>

      {/* Content */}
      <div className='space-y-6 text-lg'>
        <p>
          Più di 1000 proprietari di casa italiani hanno risparmiato oltre il
          70% sulla riparazione del loro tetto.
        </p>

        <p>
          Come? Grazie a una nuova tecnologia brevettata che permette di
          eseguire i lavori in meno di 48 ore (invece di un mese)...
        </p>

        <p>Il tutto a ⅓ del costo rispetto ai lavori "vecchio stampo"!</p>

        <p>
          La maggior parte delle riparazioni "vecchio stampo" possono arrivare a{' '}
          <strong>costare da €30.000 a €150.000</strong> in base alle dimensioni
          della tua abitazione...
        </p>

        <p>
          E necessitano diversi permessi edilizi, settimane di cantieri rumorosi
          e ponteggi brutti da vedere.
        </p>

        <p>
          Fortunatamente, oggi esiste un nuovo sistema brevettato chiamato{' '}
          <strong>"Riparazione con Linee Vita"</strong> che ti permette di
          riparare il tetto:
        </p>

        <ul className='list-disc pl-6 space-y-2'>
          <li>Senza dover affrontare pratiche burocratiche</li>
          <li>Senza alcun tipo di ponteggio</li>
          <li>In meno di 48 ore di intervento</li>
          <li>Risparmiando oltre il 70% rispetto ai metodi tradizionali</li>
        </ul>

        <p>
          {' '}
          Questo significa che, per esempio, per un tetto sotto i 100m2…
          L’intervento arriva a costare solo <b>€12.000</b> invece che più di{' '}
          <b>€30.000</b>.{' '}
        </p>

        <h2>
          Ma come sapere se sei idoneo per questo tipo di riparazione
          innovativa?
        </h2>

        <p>
          Per aiutarti a scoprire se sei idoneo, abbiamo creato il Calcolatore
          Tetti Gratuito di Vivingreen.it, Ti aiuterà a scoprire: – Quanto può
          costare una riparazione per le tue esigenze specifiche; – Qual è
          l’azienda migliore nella tua zona alla quale affidarsi, attentamente
          selezionata in base alla loro esperienza e professionalità
        </p>
        <h2>
          Scopri subito se puoi risparmiare il 70% sulla riparazione del tetto
        </h2>
        <p>
          1) Seleziona la tua regione di residenza 2) Compila i campi che
          troverai successivamente per aiutarci a determinare quanto costa una
          riparazione in base alla metratura della tua casa 3) Ti metteremo in
          contatto con il miglior fornitore della tua zona che ti darà maggiori
          informazioni sul prezzo e come prenotare un eventuale sopralluogo
          gratuito per analizzare il tuo tetto
        </p>
        <h2>
          Puoi risparmiare oltre il 70% sulla riparazione del tetto? Scoprilo
          subito
        </h2>

        {/* Interactive Map Section */}
        <div className='my-8'>
          <RegionMap onProvinceSelect={handleProvinceSelect} />
          {selectedProvince && (
            <div className='mt-4 p-4 bg-green-50 rounded-lg text-center'>
              <p className='text-green-700'>
                Grazie per aver selezionato {selectedProvince}! Ti contatteremo
                presto per una consulenza gratuita.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Author Bio */}
      <div className='mt-12 pt-8 border-t border-gray-200'>
        <p className='font-medium mb-4'>Autore: Andrea Giulioni</p>
        <p className='text-gray-600 mb-4'>
          Laureato in Ingegneria Elettronica presso l'Università di Pisa,
          appassionato delle nuove frontiere tecnologiche in ambito di
          ecosostenibilità e transizione green.
        </p>
        <p className='text-gray-600 mb-8'>
          Gestisce questo blog per aiutare gli italiani a risparmiare sui propri
          consumi attraverso suggerimenti, novità tecnologiche e "trucchi" del
          mestiere.
        </p>
      </div>

      {/* References */}
      <div className='text-sm text-gray-500 space-y-1 mb-8'>
        <p className='font-medium mb-2'>Referenze:</p>
        <p>[1] https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7703265/</p>
        <p>[2] https://pubmed.ncbi.nlm.nih.gov/32178235/</p>
        <p>[3] https://pubmed.ncbi.nlm.nih.gov/20347536/</p>
        <p>
          [4]
          https://www.fondazionevg.org/studi/metalli-antibiotici-nelle-acque-destinate-al-consumo-umano-2/
        </p>
        <p>[5] https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7596186/</p>
        <p>[6] https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5731620/</p>
      </div>

      {/* Footer */}
      <div className='mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500'>
        <p className='mb-4'>
          2024 Tutti i Diritti Riservati –{' '}
          <a href='#' className='underline'>
            Privacy & Cookie Policy
          </a>{' '}
          – info@vivingreen.it
        </p>
        <p className='text-xs uppercase leading-tight'>
          QUESTA PAGINA WEB NON RAPPRESENTA UNA TESTATA GIORNALISTICA, UN SITO
          DI INFORMAZIONE O UN BLOG. SI TRATTA DI UNA PAGINA WEB FINALIZZATA
          ALLE PUBBLICAZIONI PROMOZIONALI CHE IMPIEGANO LA TECNICA DELLO STORY
          TELLING PER ILLUSTRARE LA PORTATA DEI SERVIZI E DEI PRODOTTI PROPOSTI.
          LA STORIA RACCONTATA IN QUESTA PAGINA PERTANTO COSTITUISCE UN
          ADVERTORIAL O PUBBLICITÀ CON SCOPO INFORMATIVO, FUNZIONALE A FAR
          COMPRENDERE IL POTENZIALE DI QUANTO PROPOSTO.
        </p>
      </div>
    </main>
  );
}
