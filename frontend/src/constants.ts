
import { SupportedLanguage, Translations } from './types';
import { API_BASE_URL } from './config/api';

export const APP_VERSION = "v3.5.0 (Parallel ZIP)";
// API_BASE_URL is now imported from config/api.ts
// It automatically switches between dev (localhost) and prod (Railway)
export { API_BASE_URL };

const BASE_TRANSLATIONS: Translations = {
  heroTitle: "Batch Download. Simplified.",
  heroSubtitle: "High-speed parallel engine. No ads. Just content.",
  searchPlaceholder: "Search keywords or paste YouTube link...",
  searchButton: "Search",
  pasteLink: "Paste Link",
  singleDownload: "Download",
  addToBatch: "Select",
  selected: "Selected",
  itemsSelected: "Videos Selected",
  clearAll: "Clear",
  downloadZip: "Download ZIP",
  formatLabel: "Format",
  viewList: "View List",
  readyToProcess: "Ready to Process",
  downloading: "Downloading...",
  processing: "Creating ZIP...",
  completed: "Ready for Download",
  failed: "Operation Failed",
  saveFile: "Save File",
  preparing: "Preparing...",
  terms: "Terms of Use",
  privacy: "Privacy Policy",
  cookies: "Cookie Policy",
  legal: "Legal Notice",
  close: "Close",
  acceptCookies: "Accept",
  cookieMessage: "We use cookies to ensure the best experience on our website.",
  cookie: {
    message: "BatchTube uses cookies only for site functionality and ad display.",
    accept: "Accept",
    reject: "Reject",
    essential: "Essential Only",
    reset: "Reset Cookie Preferences"
  }
};

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: BASE_TRANSLATIONS,
  es: {
    ...BASE_TRANSLATIONS,
    heroTitle: "Descarga por Lotes. Simplificada.",
    heroSubtitle: "Motor paralelo de alta velocidad. Sin anuncios.",
    searchPlaceholder: "Buscar palabras clave o pegar enlace...",
    searchButton: "Buscar",
    pasteLink: "Pegar Enlace",
    singleDownload: "Descargar",
    addToBatch: "Seleccionar",
    selected: "Seleccionado",
    itemsSelected: "Videos Seleccionados",
    clearAll: "Borrar",
    downloadZip: "Descargar ZIP",
    viewList: "Ver Lista",
    readyToProcess: "Listo para Procesar",
    processing: "Creando ZIP...",
    completed: "Listo para Descargar",
    saveFile: "Guardar Archivo",
    terms: "Términos de Uso",
    privacy: "Política de Privacidad",
    cookies: "Política de Cookies",
    legal: "Aviso Legal",
    cookieMessage: "Usamos cookies para asegurar la mejor experiencia.",
    cookie: {
      message: "BatchTube usa cookies solo para funcionalidad del sitio y visualización de anuncios.",
      accept: "Aceptar",
      reject: "Rechazar",
      essential: "Solo Esenciales",
      reset: "Restablecer Preferencias de Cookies"
    }
  },
  fr: {
    ...BASE_TRANSLATIONS,
    heroTitle: "Téléchargement par Lot. Simplifié.",
    heroSubtitle: "Moteur parallèle haute vitesse. Pas de pubs.",
    searchPlaceholder: "Rechercher ou coller un lien...",
    searchButton: "Chercher",
    itemsSelected: "Vidéos sélectionnées",
    downloadZip: "Télécharger ZIP",
    viewList: "Voir la Liste",
    readyToProcess: "Prêt à Traiter",
    processing: "Création du ZIP...",
    completed: "Prêt à télécharger",
    saveFile: "Enregistrer",
    terms: "Conditions d'utilisation",
    privacy: "Politique de confidentialité",
    cookies: "Politique de cookies",
    legal: "Mentions légales",
    cookieMessage: "Nous utilisons des cookies pour garantir la meilleure expérience.",
    cookie: {
      message: "BatchTube utilise des cookies uniquement pour la fonctionnalité du site et l'affichage des publicités.",
      accept: "Accepter",
      reject: "Refuser",
      essential: "Essentiels Seulement",
      reset: "Réinitialiser les Préférences de Cookies"
    }
  },
  de: {
    ...BASE_TRANSLATIONS,
    heroTitle: "Batch-Download. Vereinfacht.",
    heroSubtitle: "Hochgeschwindigkeits-Parallel-Engine.",
    searchPlaceholder: "Suchen oder Link einfügen...",
    searchButton: "Suchen",
    itemsSelected: "Videos ausgewählt",
    downloadZip: "ZIP herunterladen",
    viewList: "Liste Anzeigen",
    readyToProcess: "Bereit zur Verarbeitung",
    processing: "Erstelle ZIP...",
    completed: "Bereit zum Download",
    saveFile: "Datei speichern",
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutz",
    cookies: "Cookie-Richtlinie",
    legal: "Rechtliche Hinweise",
    cookieMessage: "Wir verwenden Cookies, um das beste Erlebnis zu gewährleisten.",
    cookie: {
      message: "BatchTube verwendet Cookies nur für Website-Funktionalität und Anzeigen.",
      accept: "Akzeptieren",
      reject: "Ablehnen",
      essential: "Nur Notwendige",
      reset: "Cookie-Einstellungen Zurücksetzen"
    }
  },
  tr: {
    ...BASE_TRANSLATIONS,
    heroTitle: "Toplu İndirme. Basitleştirildi.",
    heroSubtitle: "Yüksek hızlı paralel motor. Reklamsız.",
    searchPlaceholder: "Anahtar kelime ara veya link yapıştır...",
    searchButton: "Ara",
    pasteLink: "Link Yapıştır",
    singleDownload: "İndir",
    addToBatch: "Seç",
    selected: "Seçildi",
    itemsSelected: "Video Seçildi",
    clearAll: "Temizle",
    downloadZip: "ZIP İndir",
    viewList: "Listeyi Gör",
    readyToProcess: "İşleme hazır",
    processing: "ZIP Oluşturuluyor...",
    completed: "İndirme Hazır",
    saveFile: "Cihaza Kaydet",
    terms: "Kullanım Şartları",
    privacy: "Gizlilik Politikası",
    cookies: "Çerez Politikası",
    legal: "Yasal Uyarı",
    cookieMessage: "En iyi deneyimi sağlamak için çerezleri kullanıyoruz.",
    cookie: {
      message: "BatchTube çerezleri yalnızca site işlevselliği ve reklam gösterimi için kullanır.",
      accept: "Kabul Et",
      reject: "Reddet",
      essential: "Sadece Gerekli",
      reset: "Çerez Tercihlerini Sıfırla"
    }
  },
  pt: {
    ...BASE_TRANSLATIONS,
    heroTitle: "Download em Lote. Simplificado.",
    heroSubtitle: "Motor paralelo de alta velocidade.",
    searchPlaceholder: "Pesquisar ou colar link...",
    searchButton: "Buscar",
    itemsSelected: "Vídeos Selecionados",
    downloadZip: "Baixar ZIP",
    viewList: "Ver Lista",
    readyToProcess: "Pronto para Processar",
    processing: "Criando ZIP...",
    completed: "Pronto para Baixar",
    saveFile: "Salvar Arquivo",
    terms: "Termos de Uso",
    privacy: "Privacidade",
    cookies: "Cookies",
    legal: "Aviso Legal",
    cookieMessage: "Usamos cookies para garantir a melhor experiência.",
    cookie: {
      message: "BatchTube usa cookies apenas para funcionalidade do site e exibição de anúncios.",
      accept: "Aceitar",
      reject: "Rejeitar",
      essential: "Apenas Essenciais",
      reset: "Redefinir Preferências de Cookies"
    }
  },
  ar: {
    ...BASE_TRANSLATIONS,
    heroTitle: "تحميل جماعي. مبسط.",
    heroSubtitle: "محرك متوازي عالي السرعة. بدون إعلانات.",
    searchPlaceholder: "بحث أو لصق الرابط...",
    searchButton: "بحث",
    pasteLink: "لصق الرابط",
    singleDownload: "تحميل",
    addToBatch: "تحديد",
    selected: "محدد",
    itemsSelected: "فيديو محدد",
    clearAll: "مسح",
    downloadZip: "تحميل ZIP",
    viewList: "عرض القائمة",
    readyToProcess: "جاهز للمعالجة",
    processing: "جاري إنشاء ZIP...",
    completed: "جاهز للتحميل",
    saveFile: "حفظ الملف",
    terms: "شروط الاستخدام",
    privacy: "سياسة الخصوصية",
    cookies: "سياسة ملفات تعريف الارتباط",
    legal: "إشعار قانوني",
    cookieMessage: "نحن نستخدم ملفات تعريف الارتباط لضمان أفضل تجربة.",
    cookie: {
      message: "BatchTube يستخدم ملفات تعريف الارتباط فقط لوظائف الموقع وعرض الإعلانات.",
      accept: "قبول",
      reject: "رفض",
      essential: "الأساسية فقط",
      reset: "إعادة تعيين تفضيلات ملفات تعريف الارتباط"
    }
  }
};

export const LEGAL_TEXTS: Record<string, string> = {
  terms: "BatchTube Terms of Service\n\n1. Acceptance\nBy using BatchTube, you agree to these terms.\n\n2. Usage\nThis tool is for personal, educational use only. You must comply with YouTube's Terms of Service.\n\n3. Liability\nBatchTube is not responsible for copyright infringement caused by users.",
  privacy: "Privacy Policy\n\n1. Data Collection\nWe do not store user data permanently. Download logs are cleared hourly.\n\n2. Third Parties\nWe use Google AdSense which may collect anonymous usage data.",
  cookies: "Cookie Policy\n\nWe use essential cookies to manage your session and preferences. AdSense uses cookies to serve relevant ads.",
  legal: "Legal Notice\n\nBatchTube is not affiliated with Google LLC or YouTube. All trademarks belong to their respective owners."
};
