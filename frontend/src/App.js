import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Heart, 
  User, 
  MessageCircle, 
  FileText, 
  Shield, 
  Brain,
  ChevronRight,
  Languages,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Activity,
  X,
  Check
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Validation schemas
const profileSchema = z.object({
  eta: z.string().optional(),
  genere: z.string().optional(), 
  sintomo_principale: z.string().min(2, 'Inserisci un sintomo valido').optional(),
  durata: z.string().optional(),
  intensita: z.number().min(1).max(10).optional(),
  sintomi_associati: z.array(z.string()).optional(),
  condizioni_note: z.array(z.string()).optional(),
  familiarita: z.string().optional()
});

// Language context
const LanguageContext = React.createContext();

const translations = {
  it: {
    title: 'MEDAGENTbyTREBLA',
    subtitle: 'Assistente sanitario intelligente per la tua salute',
    startEvaluation: 'Inizia la valutazione',
    heroTitle: 'Un assistente digitale per capire meglio come stai',
    heroSubtitle: 'Tecnologia avanzata al servizio della tua salute e del tuo benessere',
    intelligentAdaptive: 'Intelligenza Adattiva',
    intelligentAdaptiveDesc: 'Sistema AI che si adatta alle tue esigenze specifiche',
    empatheticApproach: 'Approccio Empatico', 
    empatheticApproachDesc: 'Interazione naturale e comprensiva per ogni situazione',
    guaranteedPrivacy: 'Privacy Garantita',
    guaranteedPrivacyDesc: 'Dati protetti secondo le normative GDPR europee',
    dualOutput: 'Output Duale',
    dualOutputDesc: 'Risposte semplici per te, tecniche per i professionisti',
    about: 'Chi siamo',
    privacy: 'Privacy',
    disclaimer: 'Disclaimer medico',
    poweredBy: 'Creato con',
    age: 'Età',
    gender: 'Genere',
    mainSymptom: 'Sintomo principale',
    duration: 'Durata',
    intensity: 'Intensità',
    associatedSymptoms: 'Sintomi associati',
    knownConditions: 'Condizioni mediche note',
    familyHistory: 'Anamnesi familiare',
    startConsultation: 'Inizia consultazione',
    male: 'Maschio',
    female: 'Femmina',
    other: 'Altro',
    preferNotToSay: 'Preferisco non dire',
    oneDay: '1 giorno',
    twoDays: '2-3 giorni',
    moreThanThreeDays: 'Più di 3 giorni',
    chronic: 'Cronico',
    mild: 'Lieve',
    severe: 'Grave',
    results: 'Risultati',
    userFriendly: 'Per te',
    technical: 'Tecnico',
    urgencyLevel: 'Livello di urgenza',
    recommendations: 'Raccomandazioni',
    sessionSummary: 'Riassunto sessione',
    exportPDF: 'Esporta PDF',
    shareResults: 'Condividi risultati',
    newEvaluation: 'Nuova valutazione',
    medicalDisclaimer: '⚠️ Questo strumento non sostituisce il parere medico professionale. In caso di emergenza, contatta immediatamente il 118.',
    language: 'Lingua',
    evaluationForm: 'Valutazione iniziale',
    selectAge: 'Seleziona età',
    selectGender: 'Seleziona genere',
    selectDuration: 'Seleziona durata',
    symptomPlaceholder: 'Es: mal di testa, febbre, dolore addominale...',
    familyHistoryPlaceholder: 'Descrivi eventuali malattie familiari rilevanti...',
    processing: 'Elaborazione...',
    profile: 'Profilo',
    notSpecified: 'Non specificato',
    symptom: 'Sintomo',
    consultation: 'Consultazione MedAgent',
    seeResults: 'Vedi risultati',
    loadingResults: 'Caricamento risultati...',
    consultationDuration: 'Durata consultazione',
    exchangedMessages: 'Messaggi scambiati',
    sessionData: 'Dati della sessione',
    sessionId: 'Session ID',
    sessionStart: 'Inizio sessione',
    sessionDuration: 'Durata',
    sessionStatus: 'Status',
    conversationStats: 'Statistiche conversazione',
    userMessages: 'Messaggi utente',
    assistantMessages: 'Risposte assistente',
    maxUrgencyLevel: 'Livello urgenza massimo',
    patientProfile: 'Profilo paziente',
    thinking: 'MedAgent sta pensando...',
    writeMessage: 'Scrivi il tuo messaggio...',
    gdprConsent: 'Consenso GDPR',
    gdprTitle: 'Consenso al trattamento dei dati personali',
    gdprText: 'Prima di procedere, devi accettare i nostri termini per il trattamento dei dati secondo il GDPR. I tuoi dati saranno trattati in modo anonimo e sicuro, non verranno mai condivisi con terze parti e potrai cancellarli in qualsiasi momento.',
    iAccept: 'Accetto',
    readPrivacy: 'Leggi l\'informativa privacy completa',
    acceptTerms: 'Accetto i termini e condizioni',
    acceptPrivacy: 'Accetto l\'informativa sulla privacy',
    acceptGdpr: 'Accetto il trattamento dei dati secondo GDPR',
    consentRequired: 'Devi accettare tutti i consensi per procedere',
    aboutUsTitle: 'Chi siamo',
    privacyTitle: 'Privacy e Sicurezza'
  },
  en: {
    title: 'MEDAGENTbyTREBLA',
    subtitle: 'Intelligent health assistant for your wellbeing',
    startEvaluation: 'Start evaluation',
    heroTitle: 'A digital assistant to better understand how you feel',
    heroSubtitle: 'Advanced technology at the service of your health and wellbeing',
    intelligentAdaptive: 'Adaptive Intelligence',
    intelligentAdaptiveDesc: 'AI system that adapts to your specific needs',
    empatheticApproach: 'Empathetic Approach',
    empatheticApproachDesc: 'Natural and understanding interaction for every situation',
    guaranteedPrivacy: 'Privacy Guaranteed',
    guaranteedPrivacyDesc: 'Data protected according to European GDPR regulations',
    dualOutput: 'Dual Output',
    dualOutputDesc: 'Simple answers for you, technical for professionals',
    about: 'About us',
    privacy: 'Privacy',
    disclaimer: 'Medical disclaimer',
    poweredBy: 'Powered by',
    age: 'Age',
    gender: 'Gender',
    mainSymptom: 'Main symptom',
    duration: 'Duration',
    intensity: 'Intensity',
    associatedSymptoms: 'Associated symptoms',
    knownConditions: 'Known medical conditions',
    familyHistory: 'Family history',
    startConsultation: 'Start consultation',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    preferNotToSay: 'Prefer not to say',
    oneDay: '1 day',
    twoDays: '2-3 days',
    moreThanThreeDays: 'More than 3 days',
    chronic: 'Chronic',
    mild: 'Mild',
    severe: 'Severe',
    results: 'Results',
    userFriendly: 'For you',
    technical: 'Technical',
    urgencyLevel: 'Urgency level',
    recommendations: 'Recommendations',
    sessionSummary: 'Session summary',
    exportPDF: 'Export PDF',
    shareResults: 'Share results',
    newEvaluation: 'New evaluation',
    medicalDisclaimer: '⚠️ This tool does not replace professional medical advice. In case of emergency, immediately contact emergency services.',
    language: 'Language',
    evaluationForm: 'Initial evaluation',
    selectAge: 'Select age',
    selectGender: 'Select gender',
    selectDuration: 'Select duration',
    symptomPlaceholder: 'E.g.: headache, fever, abdominal pain...',
    familyHistoryPlaceholder: 'Describe any relevant family medical conditions...',
    processing: 'Processing...',
    profile: 'Profile',
    notSpecified: 'Not specified',
    symptom: 'Symptom',
    consultation: 'MedAgent Consultation',
    seeResults: 'View results',
    loadingResults: 'Loading results...',
    consultationDuration: 'Consultation duration',
    exchangedMessages: 'Messages exchanged',
    sessionData: 'Session data',
    sessionId: 'Session ID',
    sessionStart: 'Session start',
    sessionDuration: 'Duration',
    sessionStatus: 'Status',
    conversationStats: 'Conversation statistics',
    userMessages: 'User messages',
    assistantMessages: 'Assistant responses',
    maxUrgencyLevel: 'Maximum urgency level',
    patientProfile: 'Patient profile',
    thinking: 'MedAgent is thinking...',
    writeMessage: 'Write your message...',
    gdprConsent: 'GDPR Consent',
    gdprTitle: 'Personal Data Processing Consent',
    gdprText: 'Before proceeding, you must accept our terms for data processing according to GDPR. Your data will be processed anonymously and securely, never shared with third parties, and you can delete it at any time.',
    iAccept: 'I Accept',
    readPrivacy: 'Read full privacy policy',
    acceptTerms: 'I accept the terms and conditions',
    acceptPrivacy: 'I accept the privacy policy',
    acceptGdpr: 'I accept GDPR data processing',
    consentRequired: 'You must accept all consents to proceed',
    aboutUsTitle: 'About Us',
    privacyTitle: 'Privacy & Data Protection'
  }
};

// Language Provider
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('it'); // Default to Italian
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// GDPR Consent Modal
const GDPRConsent = ({ isOpen, onAccept }) => {
  const { t, language } = useLanguage();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptGdpr, setAcceptGdpr] = useState(false);

  const handleAccept = () => {
    if (acceptTerms && acceptPrivacy && acceptGdpr) {
      localStorage.setItem('medagent_gdpr_consent', 'true');
      onAccept();
    } else {
      alert(t.consentRequired);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            {t.gdprTitle}
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <p>{t.gdprText}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">{t.medicalDisclaimer}</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{t.acceptTerms}</span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  {t.acceptPrivacy} - <Link to="/privacy" className="text-blue-600 hover:underline">{t.readPrivacy}</Link>
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptGdpr}
                  onChange={(e) => setAcceptGdpr(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{t.acceptGdpr}</span>
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={handleAccept}
                disabled={!acceptTerms || !acceptPrivacy || !acceptGdpr}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                {t.iAccept}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Language Switcher Component
const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <div className="flex items-center space-x-2">
      <Languages className="w-4 h-4 text-blue-600" />
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent border border-blue-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="it">Italiano</option>
        <option value="en">English</option>
      </select>
    </div>
  );
};

// Home Page Component
const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showGDPRModal, setShowGDPRModal] = useState(false);
  
  const features = [
    {
      icon: Brain,
      title: t.intelligentAdaptive,
      description: t.intelligentAdaptiveDesc
    },
    {
      icon: Heart,
      title: t.empatheticApproach,
      description: t.empatheticApproachDesc
    },
    {
      icon: Shield,
      title: t.guaranteedPrivacy,
      description: t.guaranteedPrivacyDesc
    },
    {
      icon: FileText,
      title: t.dualOutput,
      description: t.dualOutputDesc
    }
  ];

  const handleStartEvaluation = () => {
    const consent = localStorage.getItem('medagent_gdpr_consent');
    if (!consent) {
      setShowGDPRModal(true);
    } else {
      navigate('/valutazione');
    }
  };

  const handleGDPRAccept = () => {
    setShowGDPRModal(false);
    navigate('/valutazione');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t.heroSubtitle}
            </p>
            <button
              onClick={handleStartEvaluation}
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center mx-auto"
            >
              {t.startEvaluation}
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-blue-100">
              <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-3 w-fit mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <p className="text-amber-800 font-medium">{t.medicalDisclaimer}</p>
          </div>
        </div>
      </div>

      <GDPRConsent isOpen={showGDPRModal} onAccept={handleGDPRAccept} />
    </div>
  );
};

// Evaluation Form Page
const EvaluationPage = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      sintomi_associati: [],
      condizioni_note: []
    }
  });

  // Check GDPR consent
  useEffect(() => {
    const consent = localStorage.getItem('medagent_gdpr_consent');
    if (!consent) {
      navigate('/');
    }
  }, [navigate]);

  const sintomiAssociati = language === 'it' ? [
    'Febbre', 'Mal di testa', 'Nausea', 'Vomito', 'Vertigini', 
    'Debolezza', 'Dolore addominale', 'Difficoltà respiratorie', 
    'Tosse', 'Mal di gola', 'Diarrea', 'Stitichezza',
    'Dolore muscolare', 'Dolore articolare', 'Perdita appetito',
    'Insonnia', 'Ansia', 'Palpitazioni', 'Sudorazione'
  ] : [
    'Fever', 'Headache', 'Nausea', 'Vomiting', 'Dizziness',
    'Weakness', 'Abdominal pain', 'Breathing difficulties',
    'Cough', 'Sore throat', 'Diarrhea', 'Constipation',
    'Muscle pain', 'Joint pain', 'Loss of appetite',
    'Insomnia', 'Anxiety', 'Palpitations', 'Sweating'
  ];

  const condizioniNote = language === 'it' ? [
    'Diabete', 'Ipertensione', 'Asma', 'Allergie', 'Ipotiroidismo',
    'Ipertiroidismo', 'Malattie cardiache', 'Depressione', 'Ansia',
    'Artrite', 'Osteoporosi', 'Nessuna condizione nota'
  ] : [
    'Diabetes', 'Hypertension', 'Asthma', 'Allergies', 'Hypothyroidism',
    'Hyperthyroidism', 'Heart disease', 'Depression', 'Anxiety',
    'Arthritis', 'Osteoporosis', 'No known conditions'
  ];

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Create session
      const sessionResponse = await axios.post(`${API}/chat/session`);
      const sessionId = sessionResponse.data.session_id;
      
      // Create profile
      await axios.post(`${API}/chat/profile/${sessionId}`, data);
      
      // Navigate to chat
      navigate(`/chat/${sessionId}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert(language === 'it' ? 'Errore nella creazione della sessione. Riprova.' : 'Error creating session. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t.evaluationForm}
          </h1>
          
          {/* Medical Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm">{t.medicalDisclaimer}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Demographics */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.age} *
                </label>
                <select {...register('eta')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{t.selectAge}</option>
                  <option value="<12">{language === 'it' ? 'Meno di 12 anni' : 'Under 12 years'}</option>
                  <option value="12-18">{language === 'it' ? '12-18 anni' : '12-18 years'}</option>
                  <option value="19-30">{language === 'it' ? '19-30 anni' : '19-30 years'}</option>
                  <option value="31-50">{language === 'it' ? '31-50 anni' : '31-50 years'}</option>
                  <option value="51-70">{language === 'it' ? '51-70 anni' : '51-70 years'}</option>
                  <option value=">70">{language === 'it' ? 'Oltre 70 anni' : 'Over 70 years'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.gender}
                </label>
                <select {...register('genere')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{t.selectGender}</option>
                  <option value="maschio">{t.male}</option>
                  <option value="femmina">{t.female}</option>
                  <option value="altro">{t.other}</option>
                  <option value="non_specificato">{t.preferNotToSay}</option>
                </select>
              </div>
            </div>

            {/* Main Symptom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.mainSymptom} *
              </label>
              <input
                {...register('sintomo_principale')}
                type="text"
                placeholder={t.symptomPlaceholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.sintomo_principale && (
                <p className="text-red-500 text-sm mt-1">{errors.sintomo_principale.message}</p>
              )}
            </div>

            {/* Duration and Intensity */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.duration}
                </label>
                <select {...register('durata')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{t.selectDuration}</option>
                  <option value="1_giorno">{t.oneDay}</option>
                  <option value="2-3_giorni">{t.twoDays}</option> 
                  <option value="3+_giorni">{t.moreThanThreeDays}</option>
                  <option value="cronico">{t.chronic}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.intensity} (1-10)
                </label>
                <input
                  {...register('intensita', { valueAsNumber: true })}
                  type="range"
                  min="1"
                  max="10"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{t.mild}</span>
                  <span>{t.severe}</span>
                </div>
              </div>
            </div>

            {/* Associated Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.associatedSymptoms}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sintomiAssociati.map((sintomo) => (
                  <label key={sintomo} className="flex items-center space-x-2 text-sm">
                    <input
                      {...register('sintomi_associati')}
                      type="checkbox"
                      value={sintomo}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{sintomo}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Known Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.knownConditions}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {condizioniNote.map((condizione) => (
                  <label key={condizione} className="flex items-center space-x-2 text-sm">
                    <input
                      {...register('condizioni_note')}
                      type="checkbox"
                      value={condizione}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{condizione}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Family History */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.familyHistory}
              </label>
              <textarea
                {...register('familiarita')}
                rows="3"
                placeholder={t.familyHistoryPlaceholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-5 h-5" />
                    {t.processing}
                  </>
                ) : (
                  <>
                    {t.startConsultation}
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Chat Interface Component
const ChatPage = () => {
  const { sessionId } = window.location.pathname.split('/').pop() ? { sessionId: window.location.pathname.split('/').pop() } : {};
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [currentUrgencyLevel, setCurrentUrgencyLevel] = useState('low');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        // Get session and profile
        const sessionResponse = await axios.get(`${API}/chat/session/${sessionId}`);
        setProfile(sessionResponse.data.profile);
        
        // Get welcome message
        const welcomeResponse = await axios.post(`${API}/chat/welcome/${sessionId}`);
        
        setMessages([{
          id: Date.now(),
          type: 'assistant',
          content: welcomeResponse.data.message,
          urgency_level: welcomeResponse.data.urgency_level,
          next_questions: welcomeResponse.data.next_questions,
          timestamp: new Date()
        }]);
        
      } catch (error) {
        console.error('Error loading session:', error);
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat/message`, {
        session_id: sessionId,
        message: inputMessage
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        urgency_level: response.data.urgency_level,
        next_questions: response.data.next_questions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentUrgencyLevel(response.data.urgency_level);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Riprova tra poco.',
        urgency_level: 'low',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getUrgencyIcon = (level) => {
    switch (level) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                {t.profile}
              </h3>
              
              {profile && (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{t.age}:</span>
                    <span className="text-gray-600 ml-2">{profile.eta || t.notSpecified}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t.gender}:</span>
                    <span className="text-gray-600 ml-2">{profile.genere || t.notSpecified}</span>
                  </div>
                  {profile.sintomo_principale && (
                    <div>
                      <span className="font-medium text-gray-700">{t.symptom}:</span>
                      <span className="text-gray-600 ml-2">{profile.sintomo_principale}</span>
                    </div>
                  )}
                  {profile.durata && (
                    <div>
                      <span className="font-medium text-gray-700">{t.duration}:</span>
                      <span className="text-gray-600 ml-2">{profile.durata}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Urgency Level */}
              <div className="mt-6">
                <div className={`rounded-lg border p-3 text-center ${getUrgencyColor(currentUrgencyLevel)}`}>
                  <div className="flex items-center justify-center mb-1">
                    {getUrgencyIcon(currentUrgencyLevel)}
                    <span className="ml-2 font-medium text-sm">
                      {t.urgencyLevel}: {currentUrgencyLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => navigate(`/risultato/${sessionId}`)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t.seeResults}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  {t.newEvaluation}
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                  {t.consultation}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900 border border-gray-200'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Quick reply questions */}
                      {message.type === 'assistant' && message.next_questions && (
                        <div className="mt-3 space-y-1">
                          {message.next_questions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => setInputMessage(question)}
                              className="block w-full text-left text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-gray-600 text-sm">{t.thinking}</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.writeMessage}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Results Page Component  
const ResultsPage = () => {
  const { sessionId } = window.location.pathname.split('/').pop() ? { sessionId: window.location.pathname.split('/').pop() } : {};
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('user');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await axios.get(`${API}/chat/summary/${sessionId}`);
        setSummary(response.data);
      } catch (error) {
        console.error('Error loading summary:', error);
      }
      setLoading(false);
    };

    if (sessionId) {
      loadSummary();
    }
  }, [sessionId]);

  const exportToPDF = () => {
    // Simple implementation - would need a proper PDF library in production
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${language === 'it' ? 'Risultati MedAgent' : 'MedAgent Results'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .section { margin-bottom: 30px; }
            .urgency-high { color: #dc2626; }
            .urgency-medium { color: #d97706; }
            .urgency-low { color: #059669; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${language === 'it' ? 'Risultati MedAgent' : 'MedAgent Results'}</h1>
            <p>Session ID: ${sessionId}</p>
          </div>
          ${summary ? `
            <div class="section">
              <h2>${t.sessionSummary}</h2>
              <p><strong>${t.sessionDuration}:</strong> ${Math.round(summary.session_info.duration_minutes)} ${language === 'it' ? 'minuti' : 'minutes'}</p>
              <p><strong>${t.exchangedMessages}:</strong> ${summary.conversation_stats.total_messages}</p>
              <p><strong>${t.urgencyLevel}:</strong> <span class="urgency-${summary.recommendations.urgency_level}">${summary.recommendations.urgency_level.toUpperCase()}</span></p>
            </div>
            <div class="section">
              <h2>${t.recommendations}</h2>
              <p>${summary.recommendations.next_steps}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const shareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: language === 'it' ? 'Risultati MedAgent' : 'MedAgent Results',
          text: `${language === 'it' ? 'Risultati della consultazione MedAgent - Livello urgenza:' : 'MedAgent consultation results - Urgency level:'} ${summary?.recommendations.urgency_level}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert(language === 'it' ? 'Link copiato negli appunti!' : 'Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">{t.loadingResults}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center">
            <Star className="w-8 h-8 mr-3 text-yellow-500" />
            {t.results}
          </h1>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('user')}
              className={`pb-2 px-1 font-medium text-sm ${
                activeTab === 'user' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.userFriendly}
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              className={`pb-2 px-1 font-medium text-sm ${
                activeTab === 'technical' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.technical}
            </button>
          </div>

          {/* Content */}
          {activeTab === 'user' && summary && (
            <div className="space-y-6">
              {/* Urgency Level */}
              <div className={`rounded-lg border p-4 ${
                summary.recommendations.urgency_level === 'high' ? 'bg-red-50 border-red-200' :
                summary.recommendations.urgency_level === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center mb-2">
                  <Activity className="w-5 h-5 mr-2" />
                  <h3 className="font-semibold">{t.urgencyLevel}</h3>
                </div>
                <p className="text-lg font-medium">
                  {summary.recommendations.urgency_level.toUpperCase()}
                </p>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">{t.recommendations}</h3>
                <p className="text-blue-800">{summary.recommendations.next_steps}</p>
              </div>

              {/* Session Summary */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{t.consultationDuration}</h4>
                  <p className="text-2xl font-bold text-gray-700">
                    {Math.round(summary.session_info.duration_minutes)} {language === 'it' ? 'min' : 'min'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{t.exchangedMessages}</h4>
                  <p className="text-2xl font-bold text-gray-700">
                    {summary.conversation_stats.total_messages}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'technical' && summary && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t.sessionData}</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>{t.sessionId}:</strong> {summary.session_info.session_id}</div>
                  <div><strong>{t.sessionStart}:</strong> {new Date(summary.session_info.start_time).toLocaleString()}</div>
                  <div><strong>{t.sessionDuration}:</strong> {Math.round(summary.session_info.duration_minutes)} {language === 'it' ? 'minuti' : 'minutes'}</div>
                  <div><strong>{t.sessionStatus}:</strong> {summary.session_info.status}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t.conversationStats}</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>{t.userMessages}:</strong> {summary.conversation_stats.user_messages}</div>
                  <div><strong>{t.assistantMessages}:</strong> {summary.conversation_stats.assistant_messages}</div>
                  <div><strong>{t.maxUrgencyLevel}:</strong> {summary.conversation_stats.max_urgency_level}</div>
                </div>
              </div>

              {summary.profile_summary && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t.patientProfile}</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>{t.age}:</strong> {summary.profile_summary.eta || t.notSpecified}</div>
                    <div><strong>{t.gender}:</strong> {summary.profile_summary.genere || t.notSpecified}</div>
                    <div><strong>{t.mainSymptom}:</strong> {summary.profile_summary.sintomo_principale || t.notSpecified}</div>
                    {summary.profile_summary.condizioni_note?.length > 0 && (
                      <div><strong>{t.knownConditions}:</strong> {summary.profile_summary.condizioni_note.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mt-8 justify-center">
            <button
              onClick={exportToPDF}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t.exportPDF}
            </button>
            <button
              onClick={shareResults}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {t.shareResults}
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              {t.newEvaluation}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// About Us Page
const AboutPage = () => {
  const { t, language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t.aboutUsTitle}
          </h1>
          
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            {language === 'it' ? (
              <div>
                <p>Nel quadro attuale, segnato da una convergenza di criticità che mettono sotto pressione i sistemi sanitari – dall'invecchiamento demografico all'aumento della complessità clinica e alla disomogeneità dei servizi – emerge l'urgenza di strumenti digitali semplici ma efficaci.</p>
                
                <p>MedAgent nasce proprio per rispondere a questa necessità. Non è un sintomi checker generico, ma un assistente conversazionale AI, progettato per accompagnare l'utente in un processo di autovalutazione strutturato, guidato e contestuale.</p>
                
                <p>È pensato per chi non ha risposte immediate: studenti, lavoratori, migranti, famiglie. MedAgent fonde intelligenza artificiale, design etico e accessibilità reale per restituire orientamento e comprensione, senza offrire diagnosi, ma strumenti utili per leggere i segnali del proprio corpo con più lucidità e meno ansia.</p>
              </div>
            ) : (
              <div>
                <p>In today's healthcare landscape – shaped by growing demographic pressures, rising chronic conditions, and fragmented access to care – there's a clear need for intelligent, accessible tools that help people navigate uncertainty.</p>
                
                <p>MedAgent was built to meet this need. It's not a generic symptom checker, but a new kind of conversational assistant powered by AI, designed to guide users through structured, responsive self-assessment experiences.</p>
                
                <p>It's built for students, workers, parents, migrants—anyone who feels lost when trying to understand their own symptoms. MedAgent combines artificial intelligence, ethical design, and real-world usability to deliver clarity without pretending to diagnose. Just support, insight, and a way forward.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Privacy Page
const PrivacyPage = () => {
  const { t, language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t.privacyTitle}
          </h1>
          
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            {language === 'it' ? (
              <div>
                <p>MedAgent è progettato con un approccio "privacy by design". Non raccogliamo dati personali identificativi. Tutte le informazioni inserite durante l'uso restano temporanee, pseudonimizzate e non vengono associate a nomi, email o identità.</p>
                
                <p>Le sessioni sono anonime, criptate e gestite in locale o su server sicuri. Puoi cancellare i dati in qualsiasi momento, e nessuna informazione viene condivisa con terze parti per fini commerciali.</p>
                
                <p>MedAgent rispetta pienamente il GDPR e non utilizza cookie di tracciamento.</p>
              </div>
            ) : (
              <div>
                <p>MedAgent is built with a strict privacy-first approach. No personal identifiers are collected. All data is temporary, pseudonymized, and never linked to names, emails, or accounts.</p>
                
                <p>Sessions are anonymous, encrypted, and handled locally or via secure servers. Users can delete their data anytime, and no information is shared with third parties for advertising.</p>
                
                <p>MedAgent is fully GDPR-compliant and uses no tracking cookies.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const { t } = useLanguage();
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">{t.title}</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <LanguageSwitcher />
            <Link to="/about" className="text-gray-600 hover:text-gray-900">{t.about}</Link>
            <Link to="/privacy" className="text-gray-600 hover:text-gray-900">{t.privacy}</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Footer Component
const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Heart className="w-6 h-6 text-blue-400" />
            <span className="font-semibold">{t.title}</span>
          </div>
          
          <div className="text-sm text-gray-400 text-center md:text-right">
            <p>{t.poweredBy} <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">bolt.new</a></p>
            <p className="mt-1">&copy; 2025 MedAgent. {t.disclaimer}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
const App = () => {
  return (
    <LanguageProvider>
      <div className="App min-h-screen flex flex-col">
        <BrowserRouter>
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/valutazione" element={<EvaluationPage />} />
              <Route path="/chat/:sessionId" element={<ChatPage />} />
              <Route path="/risultato/:sessionId" element={<ResultsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </div>
    </LanguageProvider>
  );
};

export default App;