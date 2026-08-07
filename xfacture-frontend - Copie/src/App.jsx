import React, { useState, useEffect, useRef } from 'react';
import { Zap, UploadCloud, CheckCircle, AlertTriangle, Loader2, Copy, FileText, Check, Download } from 'lucide-react';

function App() {
  const webhookUrl = import.meta.env.VITE_WEBHOOK_URL || 'https://n8n.greenhustle.space/webhook/invoice'; // Configure this to point to your backend endpoint
  
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'error', 'success'
  const [file, setFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);
  
  const fileInputRef = useRef(null);
  const [isCopied, setIsCopied] = useState(false);

  const processFile = async (selectedFile) => {
    setFile(selectedFile);
    setStatus('loading');
    setValidationErrors([]);
    setInvoiceData(null);

    const formData = new FormData();
    formData.append('data', selectedFile);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const json = JSON.parse(text);
          if (json.errors) errMsg = json.errors.join(", ");
        } catch(e) {}
        throw new Error(errMsg);
      }

      // Parse JSON response from webhook
      try {
        let jsonRes = JSON.parse(text);
        let dataObj = Array.isArray(jsonRes) ? jsonRes[0] : jsonRes;

        if (dataObj.isValid === false || dataObj.status === 'Error' || dataObj.status === 'error') {
          setValidationErrors(dataObj.errors || ["Validation failed on server."]);
          setStatus('error');
          return;
        }

        if ((dataObj.status === 'Success' || dataObj.status === 'success') && dataObj.data) {
          const { data } = dataObj;
          
          const items = data.items ? data.items.map(item => ({
            description: item.description || 'Unknown Item',
            qty: item.quantity !== undefined ? item.quantity : 'N/A',
            unitPrice: item.unit_price !== undefined ? item.unit_price : 'N/A',
            discount: item.discount_percent !== undefined ? item.discount_percent : 'N/A',
            totalHt: item.total !== undefined ? item.total : 'N/A'
          })) : [];

          setInvoiceData({
            vendorName: data.vendor_name || 'Vendor Not Found',
            vendorIce: data.vendor_ice || 'N/A',
            clientName: data.client_name || 'Client Not Found',
            clientIce: data.client_ice || 'N/A',
            amountTtc: data.amount_ttc !== undefined ? data.amount_ttc : '0.00',
            xmlOutput: data.ubl_xml || '',
            items: items
          });
          setStatus('success');
        } else {
           throw new Error("Unexpected response structure.");
        }
      } catch (e) {
        throw new Error(e.message === "Unexpected response structure." ? e.message : "Received unexpected response format from webhook (Expected JSON).");
      }
    } catch (error) {
      setValidationErrors(["Failed to connect to the xFacture AI pipeline.", error.message]);
      setStatus('error');
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const copyToClipboard = () => {
    if (invoiceData?.xmlOutput) {
      navigator.clipboard.writeText(invoiceData.xmlOutput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadXML = () => {
    if (invoiceData?.xmlOutput) {
      const blob = new Blob([invoiceData.xmlOutput], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const safeVendorName = invoiceData.vendorName ? invoiceData.vendorName.replace(/\s+/g, '-') : 'invoice';
      a.download = `invoice-${safeVendorName}.xml`;
      
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#FAFAFA] text-slate-800 relative overflow-hidden flex flex-col">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 border-white/50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)]">
              <Zap size={24} className="fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              xFacture
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200 text-sm font-medium shadow-sm">
            <CheckCircle size={16} />
            <span className="hidden sm:inline">DGI Clearance Ready</span>
            <span className="sm:hidden">Ready</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12 flex-grow relative z-10 w-full">
        
        {/* Explanatory Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto mt-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-2">
            Automated Invoice Processing
          </h1>
          <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
            Upload your invoice (PDF, scan, or photo). Our system will automatically read the details, verify the amounts, and prepare everything for the Moroccan tax portal—saving you time and preventing errors.
          </p>
        </section>

        {/* Upload Zone */}
        {status === 'idle' && (
          <section 
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer glass-panel rounded-3xl p-16 transition-all duration-300 hover:border-blue-400 hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)] flex flex-col items-center justify-center text-center relative overflow-hidden bg-white/80"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 rounded-full" />
              <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 text-blue-600 p-5 rounded-2xl mb-8 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 relative z-10 shadow-sm">
                <UploadCloud size={56} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Drop your invoice here</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
              Click to browse or drag and drop a document to begin AI extraction.
            </p>
            <div className="flex gap-3 justify-center">
              {['PDF', 'JPG', 'PNG'].map(ext => (
                <span key={ext} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold tracking-widest border border-slate-200">
                  {ext}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Loading State */}
        {status === 'loading' && (
          <section className="glass-panel bg-white/80 rounded-3xl p-20 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#FFF_10%,transparent_100%)]" />
            <div className="relative mb-8">
              <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-[spin_2s_linear_infinite] w-20 h-20 -left-2 -top-2" />
              <div className="absolute inset-0 border-r-2 border-purple-500 rounded-full animate-[spin_3s_linear_infinite_reverse] w-20 h-20 -left-2 -top-2" />
              <div className="bg-white p-4 rounded-full relative z-10 border border-slate-100 shadow-[0_4px_20px_rgba(59,130,246,0.15)]">
                <Zap size={32} className="text-blue-500 animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Analyzing Document...</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-lg">
              Extracting structured data and verifying tax rules via the xFacture Vision Pipeline.
            </p>
          </section>
        )}

        {/* Error State */}
        {status === 'error' && (
          <section className="bg-red-50/80 border border-red-200 backdrop-blur-md rounded-3xl p-10 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-400/10 blur-[100px] rounded-full" />
            <div className="flex items-start gap-6 mb-8 relative z-10">
              <div className="bg-white text-red-500 p-4 rounded-2xl border border-red-100 shadow-[0_4px_15px_rgba(239,68,68,0.1)]">
                <AlertTriangle size={36} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-red-800 mb-2">Validation Failed</h2>
                <p className="text-red-600/90 text-lg">
                  The invoice was rejected before reaching the government API to prevent penalties.
                </p>
              </div>
            </div>
            <div className="bg-white/60 border border-red-100 rounded-2xl p-6 mb-10 font-mono text-sm text-red-700 overflow-x-auto relative z-10 shadow-sm">
              <ul className="list-disc list-inside space-y-2">
                {validationErrors.map((err, idx) => (
                  <li key={idx} className="leading-relaxed">{err}</li>
                ))}
              </ul>
            </div>
            <button 
              onClick={() => setStatus('idle')}
              className="relative z-10 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-[0_4px_15px_rgba(220,38,38,0.3)] hover:-translate-y-0.5"
            >
              Try Another Document
            </button>
          </section>
        )}

        {/* Success State */}
        {status === 'success' && invoiceData && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Success Banner */}
            <div className="glass-panel border-emerald-200 bg-white/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <div className="flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-full border border-emerald-100">
                  <CheckCircle size={28} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Validation Passed</h3>
                  <p className="text-emerald-700/80 mt-1">ICE verified, Math verified, UBL 2.1 Generated successfully.</p>
                </div>
              </div>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-all shadow-md whitespace-nowrap"
              >
                Process New Invoice
              </button>
            </div>

            {/* Data Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Vendor Card */}
              <div className="glass-card bg-white/90 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-200 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 blur-[40px] rounded-full group-hover:bg-blue-200/50 transition-colors" />
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Vendor Details
                </div>
                <div className="font-bold text-xl text-slate-800 mb-4 truncate" title={invoiceData.vendorName}>
                  {invoiceData.vendorName}
                </div>
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-mono text-sm">
                  ICE: {invoiceData.vendorIce}
                </div>
              </div>

              {/* Client Card */}
              <div className="glass-card bg-white/90 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-200 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/50 blur-[40px] rounded-full group-hover:bg-purple-200/50 transition-colors" />
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Client Details
                </div>
                <div className="font-bold text-xl text-slate-800 mb-4 truncate" title={invoiceData.clientName}>
                  {invoiceData.clientName}
                </div>
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-mono text-sm">
                  ICE: {invoiceData.clientIce}
                </div>
              </div>

              {/* Total Card */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 border-none shadow-[0_10px_30px_rgba(37,99,235,0.2)]">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-[50px] rounded-full" />
                <div className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-3">
                  Total Amount (TTC)
                </div>
                <div className="font-black text-4xl text-white flex items-baseline gap-2 mt-2">
                  <span>{Number(invoiceData.amountTtc).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-xl font-bold text-blue-200">MAD</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="glass-card bg-white/90 rounded-2xl overflow-hidden border border-slate-200">
              <div className="flex items-center gap-3 px-6 py-4 bg-slate-50/80 border-b border-slate-200">
                <div className="bg-white p-2 rounded-lg text-slate-500 shadow-sm border border-slate-100">
                  <FileText size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Extracted Line Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Qty</th>
                      <th className="px-6 py-4 text-right">Unit Price</th>
                      <th className="px-6 py-4 text-right">Discount</th>
                      <th className="px-6 py-4 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceData.items && invoiceData.items.length > 0 ? (
                      invoiceData.items.map((item, idx) => {
                        const discountVal = parseFloat(item.discount || item.discount_percent);
                        const displayDiscount = (discountVal && discountVal > 0) ? discountVal + '%' : '-';
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-semibold text-slate-800">{item.description}</td>
                            <td className="px-6 py-4 text-right text-slate-600 font-medium">{item.qty !== 'N/A' ? item.qty : '-'}</td>
                            <td className="px-6 py-4 text-right text-slate-600 font-mono">
                              {item.unitPrice !== 'N/A' && !isNaN(item.unitPrice) ? `${Number(item.unitPrice).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD` : (item.unitPrice !== 'N/A' ? item.unitPrice + ' MAD' : '-')}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {displayDiscount !== '-' ? (
                                <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-bold text-xs border border-emerald-100">
                                  {displayDiscount}
                                </span>
                              ) : <span className="text-slate-400">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono group-hover:text-blue-600 transition-colors">
                              {item.totalHt !== 'N/A' && !isNaN(item.totalHt) ? `${Number(item.totalHt).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD` : (item.totalHt !== 'N/A' ? item.totalHt + ' MAD' : '-')}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <FileText size={24} className="opacity-50" />
                            <span>No line items could be extracted.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* XML Terminal */}
            <div className="glass-panel bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 ml-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <div className="text-slate-400 text-xs font-mono font-medium ml-2">
                    invoice_ubl_2.1.xml
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-all px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
                  >
                    {isCopied ? (
                      <><Check size={14} className="text-emerald-400" /> Copied!</>
                    ) : (
                      <><Copy size={14} /> Copy XML</>
                    )}
                  </button>
                  <button 
                    onClick={handleDownloadXML}
                    className="flex items-center gap-1.5 text-xs font-bold text-white transition-all px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                  >
                    <Download size={14} /> Download XML
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-x-auto bg-slate-900/50">
                <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
                  <code>{invoiceData.xmlOutput}</code>
                </pre>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

export default App;
