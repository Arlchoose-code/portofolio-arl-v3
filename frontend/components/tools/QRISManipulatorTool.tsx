'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  UploadCloud,
  Camera,
  Copy,
  Check,
  Download,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
  Layers,
  Store,
  MapPin,
  Banknote,
  Percent,
  SlidersHorizontal,
  X,
  FileImage,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { ToolSetting } from '@/types';

interface QRISManipulatorToolProps {
  toolSetting?: ToolSetting | null;
}

// ==========================================
// 1. EMVCo QRIS CRC-16/CCITT-FALSE ENGINE
// ==========================================
function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Strict sequential TLV parser
interface TLVTag {
  tag: string;
  len: number;
  val: string;
}

function parseRootTLV(payload: string): TLVTag[] {
  const tags: TLVTag[] = [];
  let i = 0;
  while (i < payload.length) {
    if (i + 4 > payload.length) break;
    const tag = payload.substring(i, i + 2);
    const len = parseInt(payload.substring(i + 2, i + 4), 10);
    if (isNaN(len) || i + 4 + len > payload.length) break;
    const val = payload.substring(i + 4, i + 4 + len);
    tags.push({ tag, len, val });
    i += 4 + len;
  }
  return tags;
}

interface ParsedQRIS {
  isValid: boolean;
  raw: string;
  merchantName: string;
  merchantCity: string;
  postalCode?: string;
  acquirerName?: string;
  nmid?: string;
  initialAmount?: number;
  isDynamic: boolean;
  tags: TLVTag[];
}

function parseQRISData(rawPayload: string): ParsedQRIS {
  const cleaned = rawPayload.trim();
  if (!cleaned.startsWith('000201')) {
    return {
      isValid: false,
      raw: cleaned,
      merchantName: '',
      merchantCity: '',
      isDynamic: false,
      tags: [],
    };
  }

  const tags = parseRootTLV(cleaned);
  let merchantName = 'Merchant QRIS';
  let merchantCity = 'Indonesia';
  let postalCode = '';
  let initialAmount: number | undefined;
  let isDynamic = false;
  let acquirerName = '';
  let nmid = '';

  for (const t of tags) {
    if (t.tag === '01') {
      isDynamic = t.val === '12';
    } else if (t.tag === '59') {
      merchantName = t.val;
    } else if (t.tag === '60') {
      merchantCity = t.val;
    } else if (t.tag === '61') {
      postalCode = t.val;
    } else if (t.tag === '54') {
      initialAmount = parseFloat(t.val);
    } else if (t.tag === '26' || t.tag === '51') {
      if (t.val.includes('ID.CO.QRIS.WWW') || t.val.includes('ID1020') || t.val.includes('NMID')) {
        const matchNMID = t.val.match(/(?:ID|NMID)?(\d{9,18})/i);
        if (matchNMID) nmid = matchNMID[0];
      }
      if (t.val.toUpperCase().includes('DANA')) acquirerName = 'DANA';
      else if (t.val.toUpperCase().includes('GOPAY')) acquirerName = 'GoPay';
      else if (t.val.toUpperCase().includes('SHOPEEPAY') || t.val.toUpperCase().includes('AIRPAY')) acquirerName = 'ShopeePay';
      else if (t.val.toUpperCase().includes('OVO')) acquirerName = 'OVO';
      else if (t.val.toUpperCase().includes('BCA')) acquirerName = 'BCA';
      else if (t.val.toUpperCase().includes('MANDIRI')) acquirerName = 'Bank Mandiri';
      else if (t.val.toUpperCase().includes('BRI')) acquirerName = 'Bank BRI';
      else if (t.val.toUpperCase().includes('BNI')) acquirerName = 'Bank BNI';
      else if (t.val.toUpperCase().includes('NOBU')) acquirerName = 'Bank Nobu';
    }
  }

  return {
    isValid: true,
    raw: cleaned,
    merchantName,
    merchantCity,
    postalCode,
    acquirerName: acquirerName || 'QRIS Nasional (GPN)',
    nmid,
    initialAmount,
    isDynamic,
    tags,
  };
}

// Strict EMVCo QRIS TLV Reconstruction & Dynamic Inserter
function generateModifiedQRIS(
  parsed: ParsedQRIS,
  newAmount: number,
  feeType: 'none' | 'fixed' | 'percentage',
  feeValue: number,
  customName?: string,
  customCity?: string,
  customPostalCode?: string
): string {
  if (!parsed.isValid || !parsed.raw) return '';

  const clean = parsed.raw.trim();
  const rootTags = parseRootTLV(clean);
  if (!rootTags.length) return '';

  // Filter out existing CRC (Tag 63), old Amount (Tag 54), old Tip/Fee (Tag 55, 56, 57)
  const tags = rootTags.filter((t) => !['63', '54', '55', '56', '57'].includes(t.tag));

  // Change Tag 01 to '12' (Dynamic QR) if amount > 0, or '11' (Static QR) if amount == 0
  const tag01 = tags.find((t) => t.tag === '01');
  if (tag01) {
    tag01.val = newAmount > 0 ? '12' : '11';
    tag01.len = tag01.val.length;
  }

  // Build amount & fee tags to insert
  const tagsToInsert: TLVTag[] = [];
  if (newAmount > 0) {
    const amtStr = Math.round(newAmount).toString();
    tagsToInsert.push({
      tag: '54',
      len: amtStr.length,
      val: amtStr,
    });

    if (feeValue > 0) {
      if (feeType === 'fixed') {
        const feeStr = Math.round(feeValue).toString();
        tagsToInsert.push({ tag: '55', len: 2, val: '02' }); // Fixed fee indicator
        tagsToInsert.push({ tag: '56', len: feeStr.length, val: feeStr });
      } else if (feeType === 'percentage') {
        const feeStr = feeValue.toFixed(2);
        tagsToInsert.push({ tag: '55', len: 2, val: '03' }); // Percentage fee indicator
        tagsToInsert.push({ tag: '57', len: feeStr.length, val: feeStr });
      }
    }
  }

  // Insert tags right after Tag 53 (Currency) or before Tag 58 (Country Code)
  const idx53 = tags.findIndex((t) => t.tag === '53');
  const idx58 = tags.findIndex((t) => t.tag === '58');

  let insertionIndex = -1;
  if (idx53 !== -1) {
    insertionIndex = idx53 + 1;
  } else if (idx58 !== -1) {
    insertionIndex = idx58;
  } else {
    insertionIndex = tags.length;
  }

  tags.splice(insertionIndex, 0, ...tagsToInsert);

  // Update Merchant Name (Tag 59) if customName provided
  if (customName && customName.trim()) {
    const cleanName = customName.trim().substring(0, 25);
    const tag59 = tags.find((t) => t.tag === '59');
    if (tag59) {
      tag59.val = cleanName;
      tag59.len = cleanName.length;
    } else {
      tags.push({ tag: '59', len: cleanName.length, val: cleanName });
    }
  }

  // Update Merchant City (Tag 60) if customCity provided
  if (customCity && customCity.trim()) {
    const cleanCity = customCity.trim().substring(0, 15);
    const tag60 = tags.find((t) => t.tag === '60');
    if (tag60) {
      tag60.val = cleanCity;
      tag60.len = cleanCity.length;
    } else {
      tags.push({ tag: '60', len: cleanCity.length, val: cleanCity });
    }
  }

  // Update Postal Code (Tag 61) if customPostalCode provided
  if (customPostalCode && customPostalCode.trim()) {
    const cleanPostal = customPostalCode.trim().substring(0, 10);
    const tag61 = tags.find((t) => t.tag === '61');
    if (tag61) {
      tag61.val = cleanPostal;
      tag61.len = cleanPostal.length;
    } else {
      // Place after Tag 60 if exists
      const idx60 = tags.findIndex((t) => t.tag === '60');
      if (idx60 !== -1) {
        tags.splice(idx60 + 1, 0, { tag: '61', len: cleanPostal.length, val: cleanPostal });
      } else {
        tags.push({ tag: '61', len: cleanPostal.length, val: cleanPostal });
      }
    }
  }

  // Reconstruct exact string without CRC
  let payloadWithoutCRC = '';
  for (const t of tags) {
    const lenStr = t.val.length.toString().padStart(2, '0');
    payloadWithoutCRC += `${t.tag}${lenStr}${t.val}`;
  }

  // Append 6304 and calculate CRC16
  const payloadToCRC = payloadWithoutCRC + '6304';
  const newCRC = calculateCRC16(payloadToCRC);
  return payloadToCRC + newCRC;
}

export function QRISManipulatorTool({ toolSetting }: QRISManipulatorToolProps = {}) {
  // Input states (Default empty for clean user experience)
  const [rawInput, setRawInput] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [customMerchantName, setCustomMerchantName] = useState<string>('');
  const [customMerchantCity, setCustomMerchantCity] = useState<string>('');
  const [customPostalCode, setCustomPostalCode] = useState<string>('');
  const [feeType, setFeeType] = useState<'none' | 'fixed' | 'percentage'>('none');
  const [feeValue, setFeeValue] = useState<number | ''>('');

  // Scanner modal state
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Output states
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parse QRIS whenever raw input changes
  const parsedQRIS = useMemo(() => {
    return parseQRISData(rawInput);
  }, [rawInput]);

  // Active Merchant Name, City & Postal Code (Custom or Original)
  const activeMerchantName = useMemo(() => {
    return customMerchantName.trim() || parsedQRIS.merchantName || 'MERCHANT';
  }, [customMerchantName, parsedQRIS.merchantName]);

  const activeMerchantCity = useMemo(() => {
    return customMerchantCity.trim() || parsedQRIS.merchantCity || 'INDONESIA';
  }, [customMerchantCity, parsedQRIS.merchantCity]);

  const activePostalCode = useMemo(() => {
    return customPostalCode.trim() || parsedQRIS.postalCode || '';
  }, [customPostalCode, parsedQRIS.postalCode]);

  // Calculate final total
  const calculatedTotal = useMemo(() => {
    const base = typeof targetAmount === 'number' ? targetAmount : 0;
    const fee = typeof feeValue === 'number' ? feeValue : 0;
    if (feeType === 'fixed') {
      return base + fee;
    }
    if (feeType === 'percentage') {
      const percentAmt = (base * fee) / 100;
      return Math.round(base + percentAmt);
    }
    return base;
  }, [targetAmount, feeType, feeValue]);

  // Generate modified QRIS string
  const modifiedPayload = useMemo(() => {
    const amt = typeof targetAmount === 'number' ? targetAmount : 0;
    const fee = typeof feeValue === 'number' ? feeValue : 0;
    return generateModifiedQRIS(
      parsedQRIS,
      amt,
      feeType,
      fee,
      customMerchantName,
      customMerchantCity,
      customPostalCode
    );
  }, [
    parsedQRIS,
    targetAmount,
    feeType,
    feeValue,
    customMerchantName,
    customMerchantCity,
    customPostalCode,
  ]);

  // Generate QR Code image data URL
  useEffect(() => {
    if (!modifiedPayload) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(modifiedPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code', err));
  }, [modifiedPayload]);

  // Handle Image Upload & decode with jsQR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode && qrCode.data) {
          setRawInput(qrCode.data);
          toast.success('QRIS berhasil dibaca dari gambar!');
        } else {
          toast.error('Tidak dapat mendeteksi kode QRIS pada gambar ini. Pastikan gambar jelas.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Camera scanner
  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        scanCameraFrame();
      }
    } catch (err) {
      toast.error('Gagal mengakses kamera peramban.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const scanCameraFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data && code.data.startsWith('000201')) {
          setRawInput(code.data);
          toast.success('QRIS berhasil dipindai melalui kamera!');
          stopCamera();
          return;
        }
      }
    }
    animFrameRef.current = requestAnimationFrame(scanCameraFrame);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCopyPayload = () => {
    if (!modifiedPayload) return;
    navigator.clipboard.writeText(modifiedPayload);
    setCopied(true);
    toast.success('String QRIS termodifikasi berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Download High-Resolution QRIS Card Image
  const handleDownloadCard = () => {
    if (!qrDataUrl || !parsedQRIS.isValid) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1120;

    // Background Card
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(0, 0, canvas.width, canvas.height, 36);
    ctx.fill();

    // Red Header Bar
    ctx.fillStyle = '#ee2737';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, 160, [36, 36, 0, 0]);
    ctx.fill();

    // QRIS Brand Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QRIS', canvas.width / 2, 70);

    ctx.font = '600 18px sans-serif';
    ctx.fillText('PEMBAYARAN DIGITAL NASIONAL', canvas.width / 2, 115);

    // Merchant Name & City
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(activeMerchantName.toUpperCase(), canvas.width / 2, 230);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 18px sans-serif';
    ctx.fillText(
      `${parsedQRIS.nmid ? `NMID: ${parsedQRIS.nmid} • ` : ''}${activeMerchantCity.toUpperCase()}${activePostalCode ? ` (${activePostalCode})` : ''}`,
      canvas.width / 2,
      268
    );

    // Draw QR Code
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = 460;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 310;

      // Draw QR border frame
      ctx.fillStyle = '#f8fafc';
      ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 24);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Amount Box
      const boxY = 820;
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(60, boxY, canvas.width - 120, 130, 20);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('TOTAL PEMBAYARAN', canvas.width / 2, boxY + 40);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(`Rp ${calculatedTotal.toLocaleString('id-ID')}`, canvas.width / 2, boxY + 95);

      // Footer Supported Partners
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 15px sans-serif';
      ctx.fillText('Dapat di-scan dengan: BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, dll.', canvas.width / 2, 1020);

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`CRC: ${modifiedPayload.slice(-4)} • DICETAK VIA PORTOFOLIO ARL`, canvas.width / 2, 1065);

      // Trigger download
      const link = document.createElement('a');
      link.download = `QRIS_${activeMerchantName.replace(/\s+/g, '_')}_Rp${calculatedTotal}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Kartu QRIS berhasil diunduh dalam format gambar!');
    };
    qrImg.src = qrDataUrl;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-5xl mx-auto space-y-10"
    >
      {/* Top Banner Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent dark:from-red-500/15 dark:via-rose-500/10 border border-red-500/20 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-red-500/25 flex-shrink-0">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Standar Nasional EMVCo QRIS
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                {toolSetting?.name || 'QRIS Dynamic & Price Manipulator'}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
                {toolSetting?.description ||
                  'Ubah QRIS Statis menjadi QRIS Dinamis dengan menyuntikkan nominal harga kustom & biaya layanan otomatis tanpa perlu mesin EDC.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] hover:border-lime-500/50 cursor-pointer shadow-2xs transition-all">
              <UploadCloud className="w-4 h-4 text-red-500" />
              <span>Upload Gambar</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={startCamera}
              className="gap-2 text-xs font-bold rounded-2xl"
            >
              <Camera className="w-4 h-4 text-red-500" />
              <span>Scan Kamera</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main 2-Column Grid: Left Controls & Right Real-Time Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Input QRIS String */}
          <div className="rounded-3xl p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Store className="w-4 h-4 text-red-500" />
                <span>String / Kode QRIS Asal</span>
              </label>
              {rawInput && (
                <button
                  type="button"
                  onClick={() => setRawInput('')}
                  className="text-[11px] font-bold text-slate-400 hover:text-red-500 hover:underline"
                >
                  Bersihkan
                </button>
              )}
            </div>

            <textarea
              rows={3}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Tempel string QRIS di sini (contoh: 000201010211265...)"
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />

            {/* Merchant Details Info Card or Guide */}
            {rawInput.trim() ? (
              parsedQRIS.isValid ? (
                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      QRIS Valid Terdeteksi
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                      {parsedQRIS.isDynamic ? 'QRIS Dinamis' : 'QRIS Statis'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-slate-600 dark:text-slate-300 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nama Asli:</span>
                      <strong className="text-slate-900 dark:text-white truncate block">{parsedQRIS.merchantName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kota Asli:</span>
                      <strong className="text-slate-900 dark:text-white truncate block">{parsedQRIS.merchantCity}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kode Pos Asli:</span>
                      <strong className="text-slate-900 dark:text-white truncate block">{parsedQRIS.postalCode || '-'}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Format QRIS tidak valid. Pastikan string QRIS diawali dengan kode standar <strong>000201</strong>.</span>
                </div>
              )
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  Silakan tempel string QRIS Anda di atas, atau klik tombol <strong>Upload Gambar QRIS</strong> / <strong>Scan Kamera</strong> untuk membaca QRIS otomatis.
                </span>
              </div>
            )}
          </div>

          {/* Card 2: Merchant Identity Manipulation (Name, City & Postal Code) */}
          <div className="rounded-3xl p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Store className="w-4 h-4 text-red-500" />
                <span>Kustomisasi Nama & Wilayah Merchant</span>
              </label>
              {(customMerchantName || customMerchantCity || customPostalCode) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomMerchantName('');
                    setCustomMerchantCity('');
                    setCustomPostalCode('');
                  }}
                  className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline"
                >
                  Reset Data Asli
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Nama Toko / Merchant (Maks 25 Karakter)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(customMerchantName || parsedQRIS.merchantName).length}/25
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={25}
                  value={customMerchantName}
                  onChange={(e) => setCustomMerchantName(e.target.value)}
                  placeholder={parsedQRIS.merchantName || 'Contoh: TOKO BERKAH JAYA'}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Kota / Wilayah (Maks 15 Karakter)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(customMerchantCity || parsedQRIS.merchantCity).length}/15
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={15}
                    value={customMerchantCity}
                    onChange={(e) => setCustomMerchantCity(e.target.value)}
                    placeholder={parsedQRIS.merchantCity || 'Contoh: JAKARTA'}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Kode Pos (Maks 10 Karakter)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(customPostalCode || parsedQRIS.postalCode || '').length}/10
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    value={customPostalCode}
                    onChange={(e) => setCustomPostalCode(e.target.value)}
                    placeholder={parsedQRIS.postalCode || 'Contoh: 16151'}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Price Manipulation Settings */}
          <div className="rounded-3xl p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-red-500" />
                <span>Pengaturan Nominal & Biaya</span>
              </label>
              <span className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">
                Rp {calculatedTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Target Amount Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Nominal Transaksi (Rupiah)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-bold text-slate-400 text-sm">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={targetAmount === '' ? '' : targetAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTargetAmount(val === '' ? '' : Number(val));
                  }}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                {[10000, 25000, 50000, 100000, 250000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTargetAmount(amt)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      targetAmount === amt
                        ? 'bg-lime-600 dark:bg-brand text-white dark:text-[#0a0a0a] shadow-xs'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                    }`}
                  >
                    Rp {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Fee Settings */}
            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                Biaya Layanan / MDR (Convenience Fee)
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'Tanpa Biaya' },
                  { id: 'fixed', label: 'Biaya Tetap (Rp)' },
                  { id: 'percentage', label: 'Persentase (%)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFeeType(f.id as any);
                      if (f.id === 'none') setFeeValue(0);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      feeType === f.id
                        ? 'bg-lime-500/10 border-lime-500 text-lime-700 dark:text-brand'
                        : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {feeType !== 'none' && (
                <div className="pt-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-bold text-[var(--text-muted)] text-xs">
                      {feeType === 'fixed' ? 'Rp' : '%'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step={feeType === 'percentage' ? '0.1' : '100'}
                      value={feeValue || ''}
                      onChange={(e) => setFeeValue(Number(e.target.value))}
                      placeholder={feeType === 'fixed' ? 'Contoh: 1000' : 'Contoh: 0.7'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-lime-500/50 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable QRIS Template Card / Empty State */}
        <div className="lg:col-span-5 space-y-4">
          {rawInput.trim() && parsedQRIS.isValid ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="rounded-3xl p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl relative overflow-hidden flex flex-col items-center text-center"
            >
              {/* Red Authentic QRIS Header */}
              <div className="w-full bg-[#ee2737] rounded-2xl py-3 px-4 text-white mb-6 shadow-md">
                <h3 className="text-2xl font-black tracking-wider leading-none">QRIS</h3>
                <p className="text-[10px] font-bold tracking-widest mt-1 opacity-90">
                  PEMBAYARAN DIGITAL NASIONAL
                </p>
              </div>

              {/* Merchant Name */}
              <h4 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight line-clamp-1">
                {activeMerchantName}
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                {parsedQRIS.nmid ? `NMID: ${parsedQRIS.nmid} • ` : ''}{activeMerchantCity.toUpperCase()}{activePostalCode ? ` (${activePostalCode})` : ''}
              </p>

              {/* Rendered QR Code */}
              <div className="my-6 p-4 rounded-2xl bg-white border-2 border-slate-100 shadow-inner inline-block">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Modified QRIS"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-slate-300">
                    <RefreshCw className="w-8 h-8 animate-spin text-lime-600" />
                  </div>
                )}
              </div>

              {/* Price Box */}
              <div className="w-full p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  Total Pembayaran
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mt-0.5">
                  Rp {calculatedTotal.toLocaleString('id-ID')}
                </div>
                {typeof feeValue === 'number' && feeValue > 0 && (
                  <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                    (Termasuk biaya: {feeType === 'fixed' ? `Rp ${feeValue.toLocaleString('id-ID')}` : `${feeValue}%`})
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5">
                <Button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={!qrDataUrl || !parsedQRIS.isValid}
                  className="w-full py-3.5 rounded-2xl bg-lime-600 hover:bg-lime-500 text-white dark:bg-brand dark:hover:bg-brand/90 dark:text-[#0a0a0a] font-bold shadow-lg shadow-lime-500/20 dark:shadow-brand/20 text-xs gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh Kartu Gambar QRIS (PNG)
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyPayload}
                    disabled={!modifiedPayload}
                    className="flex-1 text-xs rounded-2xl gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-lime-700 dark:text-brand" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin String'}</span>
                  </Button>
                  {qrDataUrl && (
                    <a
                      href={qrDataUrl}
                      download={`QRIS_${parsedQRIS.merchantName.replace(/\s+/g, '_')}.png`}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      QR Saja
                    </a>
                  )}
                </div>
              </div>

              {/* Footer Supported Wallets */}
              <p className="text-[10px] text-[var(--text-muted)] mt-4 leading-relaxed">
                Mendukung: BCA, Mandiri, BRI, BNI, BSI, GoPay, OVO, DANA, ShopeePay, LinkAja, & semua aplikasi e-wallet berstandar QRIS.
              </p>
            </motion.div>
          ) : (
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center min-h-[500px]">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-5">
                <QrCode className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Pratinjau Kartu QRIS
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
                Silakan tempel string QRIS, upload foto QRIS, atau scan dengan kamera di sebelah kiri untuk melihat kartu dan menyuntikkan nominal harga.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 w-full">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Kompatibel Dengan
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  BCA • Mandiri • BRI • BNI • GoPay • OVO • DANA • ShopeePay • Nobu • Semua QRIS Bank & E-Wallet
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Scanner Modal */}
      <AnimatePresence>
        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-800 shadow-2xl relative text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-red-500" />
                  Arahkan Kamera ke QRIS
                </h3>
                <button
                  onClick={stopCamera}
                  className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-square bg-black mb-4">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-red-500/50 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-red-500 rounded-xl" />
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Posisikan barcode QRIS di dalam kotak merah untuk memindai otomatis.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
