import Image from 'next/image';

// Helper for DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB').replace(/\//g, '-'); 
}

// Helper for "Month Year"
function formatMonth(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function numberToWords(num) {
  if (num === 0) return 'Zero Rupees Only';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertLessThanOneThousand(n) {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
  }
  
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];
  let words = [];
  let scaleIndex = 0;
  if (num < 0) { words.push('Negative'); num = Math.abs(num); }
  
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      let chunkWords = convertLessThanOneThousand(chunk);
      if (scaleIndex > 0) chunkWords += ' ' + scales[scaleIndex];
      words.unshift(chunkWords);
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }
  const result = words.join(' ') + ' Rupees Only';
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function getPublicImage(imagePath: string): string {
  const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `/${normalizedPath}`;
}

export function ChurchReceipt(invoice: any) {
  const tailwindScript = '/scripts/tailwind-4.js';
  const imageUrl = getPublicImage('images/methodist.png');
  
  const ref_id = invoice.payment_reference || "";
  
  let effective = "";
  if (invoice.effective_from && invoice.effective_to) {
    const fromMonthStr = formatMonth(invoice.effective_from);
    const toMonthStr = formatMonth(invoice.effective_to);
    
    if (fromMonthStr === toMonthStr) {
      effective = fromMonthStr;
    } else {
      effective = `${fromMonthStr} to ${toMonthStr}`;
    }
  } else if (invoice.effective_from) {
    effective = formatMonth(invoice.effective_from);
  }

  const renderSection = (copyLabel: string) => `
<div class="receipt-page bg-white p-6">
  <div class="items-center justify-center mb-4 flex">
    <img alt="Logo" src="${imageUrl}" class="w-10 h-10 mr-4">
    <div class="text-center">
      <p class="text-red-600 font-bold text-lg leading-tight uppercase">Methodist Marathi Church</p>
      <p class="text-gray-700 text-xs">East Street, Pune - 411 001.</p>
      <p class="text-gray-500 text-[10px]">(Regd. Public Trust No. D. 47, Pune)</p>
    </div>
  </div>

  <div class="space-y-4">
    <div class="justify-between flex text-xs">
      <div>
        <span class="text-gray-700">No.:</span>
        <span class="text-gray-900 font-bold border-b border-gray-300 px-2 ml-1">${invoice.id_short}</span>
      </div>
      <div>
        <span class="text-gray-700">Date:</span>
        <span class="text-blue-600 font-bold border-b border-gray-300 px-2 ml-1">${formatDate(invoice.created_at)}</span>
      </div>
    </div>

    <div class="flex items-end">
      <span class="text-gray-700 text-sm w-44 pb-0.5">Received with thanks from</span>
      <span class="text-blue-600 font-medium text-base border-b border-blue-400 flex-1 px-2 pb-0.5">${invoice.name}</span>
    </div>

    <div class="flex items-end">
      <span class="text-gray-700 text-sm w-24 pb-0.5">Residing at</span>
      <span class="text-blue-600 font-medium text-base border-b border-blue-400 flex-1 px-2 pb-0.5">${invoice.address}</span>
    </div>

    <div class="flex items-end">
      <span class="text-gray-700 text-sm w-16 pb-0.5">Rupees</span>
      <span class="text-blue-600 font-medium text-base border-b border-blue-400 flex-1 px-2 pb-0.5">${numberToWords(invoice.amount)}</span>
    </div>

    <div class="flex gap-6">
      <div class="flex flex-1 items-end">
        <span class="text-gray-700 text-sm pb-0.5 whitespace-nowrap">UPI / Cheque No</span>
        <span class="text-blue-600 font-medium text-base border-b border-blue-400 flex-1 px-2 pb-0.5 ml-2">${ref_id}</span>
      </div>
      <div class="flex w-1/3 items-end">
        <span class="text-gray-700 text-sm pb-0.5">Date</span>
        <span class="text-blue-600 font-medium text-base border-b border-blue-400 flex-1 px-2 pb-0.5 ml-2">${formatDate(invoice.date)}</span>
      </div>
    </div>

    <div class="flex items-end">
      <span class="text-gray-700 text-sm pb-0.5">being Tithe from</span>
      <span class="text-blue-600 font-medium text-base border-b border-blue-400 flex-1 px-2 pb-0.5 ml-2">${effective}</span>
    </div>

    <div class="flex justify-between items-end pt-4">
      <div>
        <div class="flex items-center">
          <span class="text-gray-700 text-sm">Rs.</span>
          <span class="text-blue-600 font-bold text-xl ml-2 px-5 py-1.5 border-2 border-blue-400 rounded-lg bg-blue-50/30">
            ${invoice.amount}/-
          </span>
        </div>
        <p class="text-gray-500 text-[10px] mt-2 italic">Subject to realization of Cheque</p>
      </div>
      
      <div class="text-right">
        <div class="w-36 border-b-2 border-blue-400 mb-1 h-10"></div>
        <p class="text-gray-800 font-bold text-sm mr-2">Hon. Treasurer</p>
      </div>
    </div>
    
    <div class="pt-2 text-right">
       <span class="text-[9px] uppercase tracking-tighter text-gray-400 border border-gray-200 px-2 py-0.5 rounded">${copyLabel}</span>
    </div>
  </div>
</div>
`;

  return `
<html>
<head>
  <title>Receipt_${invoice.id_short}</title>
  <script src="${tailwindScript}"></script>
  <style>
    @page {
      size: auto;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background: #f3f4f6;
      -webkit-print-color-adjust: exact;
    }
    .receipt-page {
      width: 210mm;
      height: 148mm;
      margin: 0 auto;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }
    @media print {
      body { background: white; }
      .receipt-page {
        margin: 0;
      }
    }
  </style>
</head>
<body>
  ${renderSection('Member Copy')}
  ${renderSection('Church Copy')}
</body>
</html>
`;
}
