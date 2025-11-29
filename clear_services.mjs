import { drizzle } from "drizzle-orm/mysql2";
import { services } from "./drizzle/schema.ts";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

// Clear all existing services
await db.delete(services);

// Insert BOB Home Care services (no pricing)
await db.insert(services).values([
  {
    name: "تنظيف شقق Airbnb والشقق الفندقية",
    nameEn: "Airbnb and Hotel Apartments Cleaning",
    description: "اعداد العقارات بمعايير الضيافة العالمية، شامل تغيير الملاءات والغسيل الجاف",
    descriptionEn: "Preparing properties with international hospitality standards, including linen changing and dry cleaning",
    duration: 180
  },
  {
    name: "خدمة التنظيف الدورية",
    nameEn: "Regular Cleaning Service",
    description: "صيانة دورية للشقق والفيلات بجدولة مرنة (أسبوعية، نصف شهرية، شهرية)",
    descriptionEn: "Regular maintenance for apartments and villas with flexible scheduling (weekly, bi-weekly, monthly)",
    duration: 120
  },
  {
    name: "خدمة التنظيف العميق",
    nameEn: "Deep Cleaning Service",
    description: "تنظيف شامل ومفصل لجميع أجزاء المنزل بما في ذلك الأماكن الصعبة الوصول",
    descriptionEn: "Comprehensive and detailed cleaning of all parts of the home including hard-to-reach areas",
    duration: 240
  },
  {
    name: "تنظيف الانتقال، والفتح او الاغلاق",
    nameEn: "Move-in/Move-out Cleaning",
    description: "مثالي للعقارات الجديدة او الوحدات المصيفية",
    descriptionEn: "Ideal for new properties or seasonal units",
    duration: 180
  },
  {
    name: "التبخير والتعقيم",
    nameEn: "Fumigation and Sterilization",
    description: "خدمات تعقيم احترافية باستخدام أحدث تقنيات التبخير والتطهير",
    descriptionEn: "Professional disinfection services using the latest fumigation and sanitization techniques",
    duration: 90
  },
  {
    name: "تنظيف المفروشات",
    nameEn: "Upholstery Cleaning",
    description: "تنظيف متخصص للمراتب، طاولات الطعام، الكراسي، والأرائك",
    descriptionEn: "Specialized cleaning for mattresses, dining tables, chairs, and sofas",
    duration: 120
  }
]);

console.log("✅ Services updated successfully!");
process.exit(0);
