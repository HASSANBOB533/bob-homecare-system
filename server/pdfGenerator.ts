import PDFDocument from "pdfkit";

interface ChecklistItem {
  text: string;
  textEn?: string;
}

interface ServiceChecklistData {
  serviceName: string;
  serviceNameEn?: string;
  checklist: ChecklistItem[];
  language?: "ar" | "en";
}

export async function generateChecklistPDF(data: ServiceChecklistData): Promise<Buffer> {
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
    const serviceName = isArabic ? data.serviceName : (data.serviceNameEn || data.serviceName);

    // Header
    doc.fontSize(24).font("Helvetica-Bold").text("BOB Home Care", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(18).font("Helvetica").text("Service Checklist", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).font("Helvetica-Bold").text(serviceName, { align: "center" });
    doc.moveDown(1.5);

    // Checklist items
    doc.fontSize(12).font("Helvetica");
    
    data.checklist.forEach((item, index) => {
      const itemText = isArabic ? item.text : (item.textEn || item.text);
      
      // Checkbox
      doc.rect(doc.x, doc.y, 12, 12).stroke();
      
      // Item text
      doc.text(itemText, doc.x + 20, doc.y - 12, {
        width: doc.page.width - 120,
        align: "left",
      });
      
      doc.moveDown(0.8);
      
      // Add page break if needed
      if (doc.y > doc.page.height - 100 && index < data.checklist.length - 1) {
        doc.addPage();
      }
    });

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).font("Helvetica").fillColor("#666")
      .text("BOB Home Care - Professional Cleaning Services", { align: "center" });
    doc.text("International Hospitality Standards", { align: "center" });

    doc.end();
  });
}
