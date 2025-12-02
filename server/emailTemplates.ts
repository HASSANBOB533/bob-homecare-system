interface PricingBreakdown {
  basePrice: number;
  addOns?: Array<{ name: string; price: number }>;
  packageDiscount?: { visits: number; discountPercentage: number; discountAmount: number };
  specialOffer?: { name: string; discountAmount: number };
  finalPrice: number;
}

interface BookingEmailData {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  address: string;
  pricingBreakdown: PricingBreakdown;
  bookingReference: string;
  language: "ar" | "en";
}

export function generateBookingConfirmationEmail(data: BookingEmailData): { subject: string; html: string; text: string } {
  const isArabic = data.language === "ar";
  
  const subject = isArabic
    ? `تأكيد الحجز - ${data.serviceName} - ${data.bookingReference}`
    : `Booking Confirmation - ${data.serviceName} - ${data.bookingReference}`;
  
  const html = `
<!DOCTYPE html>
<html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: ${isArabic ? 'Arial, sans-serif' : 'Helvetica, Arial, sans-serif'};
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      color: #1f2937;
      margin: 20px 0;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-value {
      color: #1f2937;
      font-weight: 500;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .price-label {
      color: #6b7280;
    }
    .price-value {
      font-weight: 500;
      color: #1f2937;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      margin-top: 10px;
      border-top: 2px solid #10b981;
      font-size: 20px;
      font-weight: bold;
    }
    .total-label {
      color: #1f2937;
    }
    .total-value {
      color: #10b981;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .reference {
      background-color: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
      margin: 20px 0;
    }
    .reference-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .reference-value {
      font-size: 20px;
      font-weight: bold;
      color: #10b981;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BOB Home Care</div>
      <div style="color: #6b7280;">${isArabic ? 'خدمات التنظيف المنزلي بمعايير الضيافة الدولية' : 'Home Cleaning Services with International Hospitality Standards'}</div>
    </div>
    
    <h2 class="title">${isArabic ? '✅ تم تأكيد حجزك!' : '✅ Booking Confirmed!'}</h2>
    
    <p>${isArabic ? `عزيزي/عزيزتي ${data.customerName}،` : `Dear ${data.customerName},`}</p>
    <p>${isArabic ? 'شكراً لاختيارك BOB Home Care. تم تأكيد حجزك بنجاح!' : 'Thank you for choosing BOB Home Care. Your booking has been confirmed!'}</p>
    
    <div class="reference">
      <div class="reference-label">${isArabic ? 'رقم الحجز' : 'Booking Reference'}</div>
      <div class="reference-value">${data.bookingReference}</div>
    </div>
    
    <div class="section">
      <div class="section-title">${isArabic ? '📋 تفاصيل الخدمة' : '📋 Service Details'}</div>
      <div class="info-row">
        <span class="info-label">${isArabic ? 'الخدمة' : 'Service'}</span>
        <span class="info-value">${data.serviceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">${isArabic ? 'التاريخ' : 'Date'}</span>
        <span class="info-value">${data.date}</span>
      </div>
      <div class="info-row">
        <span class="info-label">${isArabic ? 'الوقت' : 'Time'}</span>
        <span class="info-value">${data.time}</span>
      </div>
      <div class="info-row">
        <span class="info-label">${isArabic ? 'العنوان' : 'Address'}</span>
        <span class="info-value">${data.address}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">${isArabic ? '💰 تفاصيل السعر' : '💰 Price Breakdown'}</div>
      <div class="price-row">
        <span class="price-label">${isArabic ? 'السعر الأساسي' : 'Base Price'}</span>
        <span class="price-value">${(data.pricingBreakdown.basePrice / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</span>
      </div>
      
      ${data.pricingBreakdown.addOns && data.pricingBreakdown.addOns.length > 0 ? `
        <div style="margin-top: 15px;">
          <div style="font-weight: 600; color: #6b7280; margin-bottom: 8px;">${isArabic ? 'الإضافات' : 'Add-Ons'}</div>
          ${data.pricingBreakdown.addOns.map(addon => `
            <div class="price-row" style="padding-left: 20px;">
              <span class="price-label">${addon.name}</span>
              <span class="price-value">${(addon.price / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.pricingBreakdown.packageDiscount ? `
        <div class="price-row" style="color: #10b981;">
          <span class="price-label">${isArabic ? `خصم الباقة (${data.pricingBreakdown.packageDiscount.visits} زيارات - ${data.pricingBreakdown.packageDiscount.discountPercentage}%)` : `Package Discount (${data.pricingBreakdown.packageDiscount.visits} visits - ${data.pricingBreakdown.packageDiscount.discountPercentage}%)`}</span>
          <span class="price-value">-${(data.pricingBreakdown.packageDiscount.discountAmount / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</span>
        </div>
      ` : ''}
      
      ${data.pricingBreakdown.specialOffer ? `
        <div class="price-row" style="color: #10b981;">
          <span class="price-label">${data.pricingBreakdown.specialOffer.name}</span>
          <span class="price-value">-${(data.pricingBreakdown.specialOffer.discountAmount / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</span>
        </div>
      ` : ''}
      
      <div class="total-row">
        <span class="total-label">${isArabic ? 'المجموع النهائي' : 'Total Amount'}</span>
        <span class="total-value">${(data.pricingBreakdown.finalPrice / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>${isArabic ? 'سنرسل لك تذكيراً قبل موعدك بـ 24 ساعة.' : "We'll send you a reminder 24 hours before your appointment."}</p>
      <p>${isArabic ? 'شكراً لاختيارك BOB Home Care! 🌟' : 'Thank you for choosing BOB Home Care! 🌟'}</p>
      <p style="margin-top: 20px; font-size: 12px;">
        ${isArabic ? 'إذا كان لديك أي أسئلة، يرجى الاتصال بنا عبر واتساب.' : 'If you have any questions, please contact us via WhatsApp.'}
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  const text = `
${isArabic ? 'تأكيد الحجز - BOB Home Care' : 'Booking Confirmation - BOB Home Care'}

${isArabic ? `عزيزي/عزيزتي ${data.customerName}،` : `Dear ${data.customerName},`}

${isArabic ? 'شكراً لاختيارك BOB Home Care. تم تأكيد حجزك بنجاح!' : 'Thank you for choosing BOB Home Care. Your booking has been confirmed!'}

${isArabic ? 'رقم الحجز' : 'Booking Reference'}: ${data.bookingReference}

${isArabic ? 'تفاصيل الخدمة' : 'Service Details'}:
- ${isArabic ? 'الخدمة' : 'Service'}: ${data.serviceName}
- ${isArabic ? 'التاريخ' : 'Date'}: ${data.date}
- ${isArabic ? 'الوقت' : 'Time'}: ${data.time}
- ${isArabic ? 'العنوان' : 'Address'}: ${data.address}

${isArabic ? 'تفاصيل السعر' : 'Price Breakdown'}:
- ${isArabic ? 'السعر الأساسي' : 'Base Price'}: ${(data.pricingBreakdown.basePrice / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}
${data.pricingBreakdown.addOns ? data.pricingBreakdown.addOns.map(addon => `- ${addon.name}: ${(addon.price / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}`).join('\n') : ''}
${data.pricingBreakdown.packageDiscount ? `- ${isArabic ? 'خصم الباقة' : 'Package Discount'}: -${(data.pricingBreakdown.packageDiscount.discountAmount / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}` : ''}
${data.pricingBreakdown.specialOffer ? `- ${data.pricingBreakdown.specialOffer.name}: -${(data.pricingBreakdown.specialOffer.discountAmount / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}` : ''}
- ${isArabic ? 'المجموع النهائي' : 'Total Amount'}: ${(data.pricingBreakdown.finalPrice / 100).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}

${isArabic ? 'سنرسل لك تذكيراً قبل موعدك بـ 24 ساعة.' : "We'll send you a reminder 24 hours before your appointment."}
${isArabic ? 'شكراً لاختيارك BOB Home Care! 🌟' : 'Thank you for choosing BOB Home Care! 🌟'}
  `;
  
  return { subject, html, text };
}
