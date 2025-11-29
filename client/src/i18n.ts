import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Header & Navigation
      "services": "Services",
      "whyUs": "Why Us",
      "adminDashboard": "Admin Dashboard",
      "userDashboard": "User Dashboard",
      "logout": "Logout",
      
      // Hero Section
      "heroTitle": "BOB Home Care",
      "heroSubtitle": "Home Cleaning Services with International Hospitality Standards",
      "bookNow": "Book Now",
      "viewServices": "View Services",
      
      // Features
      "licensedInsured": "Licensed & Insured",
      "ecoFriendly": "Eco-Friendly Products",
      "satisfaction": "Satisfaction Guaranteed",
      
      // Services Section
      "ourServices": "Our Services",
      "servicesDescription": "Professional cleaning services tailored to your needs",
      
      // Why Choose Us
      "whyChooseUs": "Why Choose BOB Home Care?",
      "whyDescription": "We're committed to providing exceptional service and peace of mind",
      "experiencedTeam": "Experienced Team",
      "experiencedDesc": "Our trained professionals bring hotel-standard expertise to your home",
      "qualityGuarantee": "Quality Guarantee",
      "qualityDesc": "We stand behind our work with a 100% satisfaction guarantee",
      "flexibleScheduling": "Flexible Scheduling",
      "flexibleDesc": "Book services at your convenience with our easy online system",
      
      // CTA Section
      "readyForClean": "Ready for a Spotless Home?",
      "joinCustomers": "Join thousands of satisfied customers who trust BOB Home Care for their housekeeping needs",
      "getStarted": "Get Started Today",
      
      // Footer
      "copyright": "© 2025 BOB Home Care. All rights reserved.",
      
      // Booking Form
      "selectService": "Select a service",
      "selectDate": "Select date",
      "selectTime": "Select time",
      "address": "Address",
      "notes": "Special notes",
      "submit": "Submit Booking",
      "bookingSuccess": "Booking created successfully!",
      
      // WhatsApp
      "bookViaWhatsApp": "Book via WhatsApp",
      "whatsappDesc": "Chat with us directly on WhatsApp for instant booking",
    }
  },
  ar: {
    translation: {
      // Header & Navigation
      "services": "خدماتنا",
      "whyUs": "لماذا نحن",
      "adminDashboard": "لوحة الإدارة",
      "userDashboard": "لوحة المستخدم",
      "logout": "تسجيل الخروج",
      
      // Hero Section
      "heroTitle": "BOB Home Care",
      "heroSubtitle": "خدمات التنظيف المنزلي بمعايير الضيافة العالمية",
      "bookNow": "احجز الآن",
      "viewServices": "عرض الخدمات",
      
      // Features
      "licensedInsured": "مرخص ومؤمن",
      "ecoFriendly": "منتجات صديقة للبيئة",
      "satisfaction": "ضمان الجودة",
      
      // Services Section
      "ourServices": "خدماتنا المتخصصة",
      "servicesDescription": "خدمات تنظيف احترافية مصممة خصيصاً لاحتياجاتك",
      
      // Why Choose Us
      "whyChooseUs": "لماذا تختار BOB Home Care؟",
      "whyDescription": "نحن ملتزمون بتقديم خدمة استثنائية وراحة البال",
      "experiencedTeam": "فريق محترف",
      "experiencedDesc": "فريقنا المدرب يجلب خبرة معايير الفنادق إلى منزلك",
      "qualityGuarantee": "ضمان الجودة",
      "qualityDesc": "نقف وراء عملنا بضمان رضا 100٪",
      "flexibleScheduling": "جدولة مرنة",
      "flexibleDesc": "احجز الخدمات في الوقت المناسب لك من خلال نظامنا السهل عبر الإنترنت",
      
      // CTA Section
      "readyForClean": "هل أنت مستعد لمنزل نظيف؟",
      "joinCustomers": "انضم إلى آلاف العملاء الراضين الذين يثقون في BOB Home Care لاحتياجات التنظيف المنزلي",
      "getStarted": "ابدأ اليوم",
      
      // Footer
      "copyright": "© 2025 BOB Home Care. جميع الحقوق محفوظة.",
      
      // Booking Form
      "selectService": "اختر الخدمة",
      "selectDate": "اختر التاريخ",
      "selectTime": "اختر الوقت",
      "address": "العنوان",
      "notes": "ملاحظات خاصة",
      "submit": "إرسال الحجز",
      "bookingSuccess": "تم إنشاء الحجز بنجاح!",
      
      // WhatsApp
      "bookViaWhatsApp": "احجز عبر واتساب",
      "whatsappDesc": "تحدث معنا مباشرة على واتساب للحجز الفوري",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
