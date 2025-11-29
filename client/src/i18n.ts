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
      "signIn": "Sign In",
      "signUp": "Sign Up",
      "myDashboard": "My Dashboard",
      "myProfile": "My Profile",
      "signOut": "Sign Out",
      "editProfile": "Edit Profile",
      "updateProfile": "Update Profile",
      "cancel": "Cancel",
      "saving": "Saving...",
      "profileUpdated": "Profile updated successfully!",
      "profileUpdateFailed": "Failed to update profile. Please try again.",
      
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
      "Your Information": "Your Information",
      "Full Name": "Full Name",
      "Phone Number": "Phone Number",
      "Email": "Email",
      "optional": "optional",
      "address": "Service Address",
      "notes": "Additional Notes",
      "Enter your full name": "Enter your full name",
      "Enter your full address": "Enter your complete service address",
      "Any special requests or notes": "Any special requests or instructions",
      "submit": "Submit Booking Request",
      "Back to Home": "Back to Home",
      "Fill in the form below to book your cleaning service": "Fill in the form below and we'll contact you to confirm your booking",
      "Your booking will be sent via WhatsApp for confirmation": "Your booking request will be sent via WhatsApp for quick confirmation",
      "Please fill in all required fields": "Please fill in all required fields",
      "Booking request prepared! Redirecting to WhatsApp...": "Booking request prepared! Redirecting to WhatsApp...",
      "bookingSuccess": "Booking created successfully!",
      "Booking created successfully! We will contact you soon to confirm and send payment link.": "Booking created successfully! We will contact you soon to confirm and send payment link.",
      "Booking Reference": "Booking Reference",
      "Failed to create booking. Please try again or contact us via WhatsApp.": "Failed to create booking. Please try again or contact us via WhatsApp.",
      "Check Booking Status": "Check Booking Status",
      "Enter your booking reference and phone number to check your booking status": "Enter your booking reference and phone number to check your booking status",
      "Checking...": "Checking...",
      "Check Status": "Check Status",
      "Booking Details": "Booking Details",
      "Customer Name": "Customer Name",
      "Service": "Service",
      "Date & Time": "Date & Time",
      "Not specified": "Not specified",
      "Pending": "Pending",
      "Confirmed": "Confirmed",
      "Completed": "Completed",
      "Cancelled": "Cancelled",
      "Your booking is pending confirmation. We will contact you soon to confirm and send the payment link.": "Your booking is pending confirmation. We will contact you soon to confirm and send the payment link.",
      "Booking not found. Please check your booking reference and phone number.": "Booking not found. Please check your booking reference and phone number.",
      "Failed to check booking status. Please try again.": "Failed to check booking status. Please try again.",
      "Please enter both booking reference and phone number": "Please enter both booking reference and phone number",
      
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
      "signIn": "تسجيل الدخول",
      "signUp": "إنشاء حساب",
      "myDashboard": "لوحة التحكم",
      "myProfile": "الملف الشخصي",
      "signOut": "تسجيل الخروج",
      "editProfile": "تحرير الملف الشخصي",
      "updateProfile": "تحديث الملف الشخصي",
      "cancel": "إلغاء",
      "saving": "جاري الحفظ...",
      "profileUpdated": "تم تحديث الملف الشخصي بنجاح!",
      "profileUpdateFailed": "فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.",
      
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
      "Your Information": "معلوماتك",
      "Full Name": "الاسم الكامل",
      "Phone Number": "رقم الهاتف",
      "Email": "البريد الإلكتروني",
      "optional": "اختياري",
      "address": "عنوان الخدمة",
      "notes": "ملاحظات إضافية",
      "Enter your full name": "أدخل اسمك الكامل",
      "Enter your full address": "أدخل عنوان الخدمة الكامل",
      "Any special requests or notes": "أي طلبات أو تعليمات خاصة",
      "submit": "إرسال طلب الحجز",
      "Back to Home": "العودة للرئيسية",
      "Fill in the form below to book your cleaning service": "املأ النموذج أدناه وسنتواصل معك لتأكيد حجزك",
      "Your booking will be sent via WhatsApp for confirmation": "سيتم إرسال طلب الحجز عبر واتساب للتأكيد السريع",
      "Please fill in all required fields": "يرجى ملء جميع الحقول المطلوبة",
      "Booking request prepared! Redirecting to WhatsApp...": "تم تحضير طلب الحجز! جاري التحويل إلى واتساب...",
      "bookingSuccess": "تم إنشاء الحجز بنجاح!",
      "Booking created successfully! We will contact you soon to confirm and send payment link.": "تم إنشاء الحجز بنجاح! سنتواصل معك قريبًا للتأكيد وإرسال رابط الدفع.",
      "Booking Reference": "رقم الحجز",
      "Failed to create booking. Please try again or contact us via WhatsApp.": "فشل إنشاء الحجز. يرجى المحاولة مرة أخرى أو التواصل معنا عبر واتساب.",
      "Check Booking Status": "تحقق من حالة الحجز",
      "Enter your booking reference and phone number to check your booking status": "أدخل رقم الحجز ورقم الهاتف للتحقق من حالة حجزك",
      "Checking...": "جاري التحقق...",
      "Check Status": "تحقق من الحالة",
      "Booking Details": "تفاصيل الحجز",
      "Customer Name": "اسم العميل",
      "Service": "الخدمة",
      "Date & Time": "التاريخ والوقت",
      "Not specified": "غير محدد",
      "Pending": "قيد الانتظار",
      "Confirmed": "مؤكد",
      "Completed": "مكتمل",
      "Cancelled": "ملغى",
      "Your booking is pending confirmation. We will contact you soon to confirm and send the payment link.": "حجزك قيد الانتظار. سنتواصل معك قريبًا للتأكيد وإرسال رابط الدفع.",
      "Booking not found. Please check your booking reference and phone number.": "لم يتم العثور على الحجز. يرجى التحقق من رقم الحجز ورقم الهاتف.",
      "Failed to check booking status. Please try again.": "فشل في التحقق من حالة الحجز. يرجى المحاولة مرة أخرى.",
      "Please enter both booking reference and phone number": "يرجى إدخال رقم الحجز ورقم الهاتف",
      
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
