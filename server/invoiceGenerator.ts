import PDFDocument from "pdfkit";

interface InvoiceData {
  bookingReference: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  address: string;
  pricingBreakdown?: {
    basePrice: number;
    addOns?: Array<{ name: string; price: number }>;
    packageDiscount?: {
      visits: number;
      discountPercentage: number;
      discountAmount: number;
    };
    specialOffer?: {
      name: string;
      discountAmount: number;
    };
    finalPrice: number;
  };
  totalAmount: number;
  language: "ar" | "en";
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on("error", reject);

    const isArabic = data.language === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    // Header
    doc.fontSize(24).font("Helvetica-Bold").fillColor("#000")
      .text("BOB Home Care", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).font("Helvetica").fillColor("#666")
      .text(t("Professional Cleaning Services", "خدمات التنظيف الاحترافية"), { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor("#666")
      .text(t("International Hospitality Standards", "معايير الضيافة الدولية"), { align: "center" });
    
    doc.moveDown(1.5);

    // Invoice Title
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#000")
      .text(t("INVOICE", "فاتورة"), { align: "center" });
    
    doc.moveDown(1);

    // Invoice Details
    doc.fontSize(12).font("Helvetica");
    
    const leftX = 50;
    const rightX = 300;
    let currentY = doc.y;

    // Left Column
    doc.text(t("Invoice Number:", "رقم الفاتورة:"), leftX, currentY, { continued: true });
    doc.font("Helvetica-Bold").text(` ${data.bookingReference}`);
    doc.font("Helvetica");
    
    currentY += 20;
    doc.text(t("Date:", "التاريخ:"), leftX, currentY, { continued: true });
    doc.font("Helvetica-Bold").text(` ${data.date}`);
    doc.font("Helvetica");
    
    currentY += 20;
    doc.text(t("Time:", "الوقت:"), leftX, currentY, { continued: true });
    doc.font("Helvetica-Bold").text(` ${data.time}`);
    doc.font("Helvetica");

    // Right Column
    currentY = doc.y - 60;
    doc.text(t("Customer:", "العميل:"), rightX, currentY, { continued: true });
    doc.font("Helvetica-Bold").text(` ${data.customerName}`);
    doc.font("Helvetica");
    
    currentY += 20;
    doc.text(t("Service:", "الخدمة:"), rightX, currentY, { continued: true });
    doc.font("Helvetica-Bold").text(` ${data.serviceName}`);
    doc.font("Helvetica");

    doc.moveDown(3);

    // Address
    doc.fontSize(11).fillColor("#666")
      .text(t("Service Address:", "عنوان الخدمة:"), { continued: true });
    doc.fillColor("#000").text(` ${data.address}`);

    doc.moveDown(2);

    // Pricing Table
    const tableTop = doc.y;
    const col1X = 50;
    const col2X = 400;
    const rowHeight = 25;

    // Table Header
    doc.rect(col1X, tableTop, 495, rowHeight).fillAndStroke("#f0f0f0", "#ccc");
    doc.fillColor("#000").fontSize(12).font("Helvetica-Bold")
      .text(t("Description", "الوصف"), col1X + 10, tableTop + 8)
      .text(t("Amount", "المبلغ"), col2X + 10, tableTop + 8);

    let currentRow = tableTop + rowHeight;

    // Base Price
    doc.font("Helvetica").fontSize(11);
    doc.text(t("Base Price", "السعر الأساسي"), col1X + 10, currentRow + 8);
    doc.text(`${(data.pricingBreakdown?.basePrice || data.totalAmount) / 100} ${t("EGP", "ج.م")}`, 
      col2X + 10, currentRow + 8);
    doc.moveTo(col1X, currentRow + rowHeight).lineTo(col1X + 495, currentRow + rowHeight).stroke("#eee");
    currentRow += rowHeight;

    // Add-ons
    if (data.pricingBreakdown?.addOns && data.pricingBreakdown.addOns.length > 0) {
      data.pricingBreakdown.addOns.forEach((addon) => {
        doc.text(addon.name, col1X + 20, currentRow + 8);
        doc.text(`${addon.price / 100} ${t("EGP", "ج.م")}`, col2X + 10, currentRow + 8);
        doc.moveTo(col1X, currentRow + rowHeight).lineTo(col1X + 495, currentRow + rowHeight).stroke("#eee");
        currentRow += rowHeight;
      });
    }

    // Package Discount
    if (data.pricingBreakdown?.packageDiscount) {
      doc.fillColor("#16a34a");
      doc.text(
        t(`Package Discount (${data.pricingBreakdown.packageDiscount.visits} visits)`, 
          `خصم الباقة (${data.pricingBreakdown.packageDiscount.visits} زيارات)`),
        col1X + 10, currentRow + 8
      );
      doc.text(`-${data.pricingBreakdown.packageDiscount.discountAmount / 100} ${t("EGP", "ج.م")}`, 
        col2X + 10, currentRow + 8);
      doc.fillColor("#000");
      doc.moveTo(col1X, currentRow + rowHeight).lineTo(col1X + 495, currentRow + rowHeight).stroke("#eee");
      currentRow += rowHeight;
    }

    // Special Offer
    if (data.pricingBreakdown?.specialOffer) {
      doc.fillColor("#16a34a");
      doc.text(data.pricingBreakdown.specialOffer.name, col1X + 10, currentRow + 8);
      doc.text(`-${data.pricingBreakdown.specialOffer.discountAmount / 100} ${t("EGP", "ج.م")}`, 
        col2X + 10, currentRow + 8);
      doc.fillColor("#000");
      doc.moveTo(col1X, currentRow + rowHeight).lineTo(col1X + 495, currentRow + rowHeight).stroke("#eee");
      currentRow += rowHeight;
    }

    // Total
    doc.rect(col1X, currentRow, 495, rowHeight).fillAndStroke("#f9fafb", "#ccc");
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#000")
      .text(t("Total Amount", "المبلغ الإجمالي"), col1X + 10, currentRow + 8);
    doc.fontSize(14).fillColor("#16a34a")
      .text(`${data.totalAmount / 100} ${t("EGP", "ج.م")}`, col2X + 10, currentRow + 8);

    // Footer
    doc.moveDown(4);
    doc.fontSize(10).font("Helvetica").fillColor("#666")
      .text(t("Thank you for choosing BOB Home Care!", "شكراً لاختيارك BOB Home Care!"), 
        { align: "center" });
    doc.text(t("For any inquiries, please contact us via WhatsApp", 
      "لأي استفسارات، يرجى التواصل معنا عبر واتساب"), 
      { align: "center" });

    doc.end();
  });
}
