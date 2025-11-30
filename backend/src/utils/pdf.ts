import puppeteer from 'puppeteer';
import { format } from 'date-fns';

export const generateInvoicePDF = async (invoiceData: any): Promise<Buffer> => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { text-align: right; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>INVOICE</h1>
        <p>Invoice #: ${invoiceData.invoiceNumber}</p>
      </div>
      
      <div class="invoice-details">
        <p><strong>Date:</strong> ${format(new Date(invoiceData.date), 'MMM dd, yyyy')}</p>
        <p><strong>Due Date:</strong> ${format(new Date(invoiceData.dueDate), 'MMM dd, yyyy')}</p>
        <p><strong>Customer:</strong> ${invoiceData.customer.name}</p>
        ${invoiceData.customer.address ? `<p><strong>Address:</strong> ${invoiceData.customer.address}</p>` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Tax</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items.map((item: any) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>$${item.unitPrice.toFixed(2)}</td>
              <td>$${item.taxAmount.toFixed(2)}</td>
              <td>$${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total">
        <p>Subtotal: $${invoiceData.subtotal.toFixed(2)}</p>
        <p>Tax: $${invoiceData.taxAmount.toFixed(2)}</p>
        <p><strong>Total: $${invoiceData.total.toFixed(2)}</strong></p>
        <p>Paid: $${invoiceData.paidAmount.toFixed(2)}</p>
        <p><strong>Balance Due: $${invoiceData.balanceDue.toFixed(2)}</strong></p>
      </div>

      ${invoiceData.notes ? `<div class="footer"><p>${invoiceData.notes}</p></div>` : ''}
    </body>
    </html>
  `;

    await page.setContent(html);
    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();
    return pdf;
};

export const generateReportPDF = async (
    title: string,
    data: any[],
    columns: string[],
    totals?: any
): Promise<Buffer> => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .number { text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => `<td class="${typeof row[col] === 'number' ? 'number' : ''}">${row[col]}</td>`).join('')}
            </tr>
          `).join('')}
          ${totals ? `
            <tr class="total-row">
              ${columns.map(col => `<td class="${typeof totals[col] === 'number' ? 'number' : ''}">${totals[col] || ''}</td>`).join('')}
            </tr>
          ` : ''}
        </tbody>
      </table>
    </body>
    </html>
  `;

    await page.setContent(html);
    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        landscape: columns.length > 6,
    });

    await browser.close();
    return pdf;
};
