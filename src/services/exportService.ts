import { InventoryRecord, RACIValue } from '../types';
import { SABIT_BIRIMLER, POZISYON_HAVUZU } from '../data/initialData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper: Convert array or raw string into clean bullet points or lines
function formatContentList(value: string | string[] | undefined): string {
  if (!value) return 'Belirtilmemiş';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Belirtilmemiş';
    return value.join('; ');
  }
  return value.trim() || 'Belirtilmemiş';
}

// --------------------------------------------------------------------------
// 1. VERTICAL TEXT GENERATOR (Ana başlıklar üstte, içerikler altta)
// --------------------------------------------------------------------------
export function generateVerticalTextReport(record: InventoryRecord): string {
  const dateStr = new Date().toLocaleDateString('tr-TR');
  const roles = [...(record.selectedPositions || [])].reverse();

  let text = '';
  text += '================================================================================\n';
  text += 'KVKK GÖREV TANIMI VE VERİ SAKLAMA-İMHA ENVANTER RAPORU (37 MADDE)\n';
  text += '6698 Sayılı Kişisel Verilerin Korunması Kanunu Uyum Dökümanı\n';
  text += '================================================================================\n';
  text += `Şirket Unvanı   : ${record.unvan || 'İsimsiz Şirket'}\n`;
  text += `Proje Kodu      : ${record.projectCode || 'PRJ-KVK'} | Versiyon: ${record.version || 'v1.0'}\n`;
  text += `Rapor Tarihi    : ${dateStr}\n`;
  text += `Yetkili Temsilci: ${record.yetkili || '-'}\n`;
  text += `Veri Sorumlusu  : ${record.veriSorumlusu || '-'}\n`;
  text += `İrtibat Kişisi  : ${record.irtibat || '-'}\n`;
  text += '================================================================================\n\n';

  // BÖLÜM 1
  text += 'BÖLÜM 1: KURUMSAL VE FİRMA BİLGİLERİ (1-9)\n';
  text += '--------------------------------------------------------------------------------\n';
  text += '1. ŞİRKET UNVANI\n';
  text += `${record.unvan || '-'}\n\n`;

  text += '2. ŞİRKET ADRESİ\n';
  text += `${record.adres || '-'}\n\n`;

  text += '3. VERGİ NUMARASI (VKN)\n';
  text += `${record.vergiNo || '-'}\n\n`;

  text += '4. VERGİ DAİRESİ\n';
  text += `${record.vergiDairesi || '-'}\n\n`;

  text += '5. MERSİS / TİCARET SİCİL NO\n';
  text += `${record.mersisNo || '-'}\n\n`;

  text += '6. KURUMSAL TELEFON & SANTRAL\n';
  text += `${record.telefon || '-'}\n\n`;

  text += '7. KURUMSAL E-POSTA & KEP ADRESİ\n';
  text += `${record.eposta || '-'}\n\n`;

  text += '8. FAALİYET KONUSU VE SEKTÖR\n';
  text += `${record.faaliyet || '-'}\n\n`;

  text += '9. DEPARTMANLAR VE BİRİMLER\n';
  text += `${record.departmanlar || '-'}\n\n\n`;

  // BÖLÜM 2
  text += 'BÖLÜM 2: ORGANİZASYON ŞEMASI VE KVK KOMİTESİ (10-14)\n';
  text += '--------------------------------------------------------------------------------\n';
  text += '10. ORGANİZASYON ŞEMASI (ŞEMSİYE MODELİ POZİSYON SEÇİMİ)\n';
  if (record.selectedPositions && record.selectedPositions.length > 0) {
    record.selectedPositions.forEach(p => {
      text += `  • ${p}\n`;
    });
  } else {
    text += 'Belirtilmemiş\n';
  }
  text += '\n';

  text += '11. KOMİTE YAPISI (BAŞKAN VE ÜYELER)\n';
  text += `  • Komite Başkanı: ${record.komiteBaskani || 'Genel Müdür / CEO'}\n`;
  text += `  • Komite Üyeleri: ${(record.komiteUyeleri || []).join(', ') || 'Belirtilmemiş'}\n\n`;

  text += '12. İMZA YETKİLİSİ / ŞİRKET TEMSİLCİSİ\n';
  text += `${record.yetkili || '-'}\n\n`;

  text += '13. VERİ SORUMLUSU UNVANI\n';
  text += `${record.veriSorumlusu || '-'}\n\n`;

  text += '14. İRTİBAT KİŞİSİ (VERBİS GÖREVLİSİ)\n';
  text += `${record.irtibat || '-'}\n\n\n`;

  // BÖLÜM 3
  text += 'BÖLÜM 3: BİRİM GÖREV VE YETKİ DAĞILIMI (15-19)\n';
  text += '--------------------------------------------------------------------------------\n';
  SABIT_BIRIMLER.forEach((b, idx) => {
    text += `${15 + idx}. ${b.unvan.toUpperCase()} GÖREVLERİ (${b.birim})\n`;
    const tasks = record.birimSecilenGorevler?.[b.key] || [];
    if (tasks.length > 0) {
      tasks.forEach(t => {
        text += `  • ${t}\n`;
      });
    } else {
      text += '  • Görev tanımlanmamış\n';
    }
    text += '\n';
  });
  text += '\n';

  // RACI MATRIX
  text += 'TERS ŞEMSİYE RACI GÖREV MATRİSİ (TABANDAN TAVANA)\n';
  text += '--------------------------------------------------------------------------------\n';
  (record.raciTasks || []).forEach((task, idx) => {
    text += `GÖREV ${idx + 1}: ${task}\n`;
    roles.forEach(role => {
      const val = record.raciValues[`${idx}_${role}`] || '-';
      const label = val === 'R' ? 'Sorumlu (R)' : val === 'A' ? 'Hesap Verebilir (A)' : val === 'C' ? 'Danışılan (C)' : val === 'I' ? 'Bilgilendirilen (I)' : '-';
      text += `  • ${role}: ${label}\n`;
    });
    text += '\n';
  });
  text += '\n';

  // BÖLÜM 4
  text += 'BÖLÜM 4: VERİ KAYIT ORTAMLARI (20-24)\n';
  text += '--------------------------------------------------------------------------------\n';
  text += '20. ELEKTRONİK VERİ KAYIT ORTAMI - DONANIM\n';
  text += `${record.donanim || '-'}\n\n`;

  text += '21. ELEKTRONİK VERİ KAYIT ORTAMI - YAZILIM & VERİTABANI\n';
  text += `${record.yazilim || '-'}\n\n`;

  text += '22. ELEKTRONİK VERİ KAYIT ORTAMI - GÜVENLİK ALTYAPISI\n';
  text += `${record.guvenlik || '-'}\n\n`;

  text += '23. ELEKTRONİK OLMAYAN (FİZİKSEL) VERİ KAYIT ORTAMI\n';
  text += `${record.elektronikOlmayan || '-'}\n\n`;

  text += '24. BULUT DEPOLAMA VE UZAK SUNUCU SİSTEMLERİ\n';
  text += `${record.bulutSistemleri || '-'}\n\n\n`;

  // BÖLÜM 5
  text += 'BÖLÜM 5: VERİ GÜVENLİĞİ VE ALINAN TEDBİRLER (25-27)\n';
  text += '--------------------------------------------------------------------------------\n';
  text += '25. VERİ GÜVENLİĞİ – İDARİ TEDBİRLER\n';
  text += `${record.idariTedbirler || '-'}\n\n`;

  text += '26. VERİ GÜVENLİĞİ – TEKNİK TEDBİRLER\n';
  text += `${record.teknikTedbirler || '-'}\n\n`;

  text += '27. GENEL VERİ GÜVENLİĞİ ÖNLEMLERİ\n';
  text += `${record.veriGuvenligi || '-'}\n\n\n`;

  // BÖLÜM 6
  text += 'BÖLÜM 6: KİŞİSEL VERİ KATEGORİLERİ VE İŞLEME AMAÇLARI (28-33)\n';
  text += '--------------------------------------------------------------------------------\n';
  text += '28. KİŞİSEL VERİ KATEGORİLERİ (GENEL)\n';
  text += `${record.kisiselVeriKategorileri || '-'}\n\n`;

  text += '29. ÖZEL NİTELİKLİ KİŞİSEL VERİ KATEGORİLERİ\n';
  text += `${record.ozelNitelikliVeriler || '-'}\n\n`;

  text += '30. KİŞİSEL VERİ ELDE ETME YÖNTEMLERİ\n';
  text += `${record.veriToplamaYontemleri || '-'}\n\n`;

  text += '31. SAKLAMAYI GEREKTİREN İŞLEME AMAÇLARI\n';
  text += `${record.saklamaAmaclari || '-'}\n\n`;

  text += '32. SAKLAMAYI GEREKTİREN HUKUKİ SEBEPLER\n';
  text += `${record.hukukiSebepler || '-'}\n\n`;

  text += '33. VERİ AKTARILAN ALICI GRUPLARI\n';
  text += `${record.aliciGruplari || '-'}\n\n\n`;

  // BÖLÜM 7
  text += 'BÖLÜM 7: İMHA, SÜRELER VE PERİYODİK DENETİM (34-37)\n';
  text += '--------------------------------------------------------------------------------\n';
  text += '34. İMHAYI GEREKTİREN SEBEPLER\n';
  text += `${record.imhaSebep || '-'}\n\n`;

  text += '35. İMHA YÖNTEMLERİ (SİLME, YOK ETME, ANONİMLEŞTİRME)\n';
  text += `${record.imhaYontem || '-'}\n\n`;

  text += '36. SAKLAMA VE İMHA SÜRELERİ\n';
  text += `${record.saklamaSureleri || '-'}\n\n`;

  text += '37. PERİYODİK İMHA SÜRESİ VE GÜNCELLEME TAKVİMİ\n';
  text += `${record.periyodikImhaSuresi || '-'}\n\n`;

  text += '================================================================================\n';
  text += 'Rapor Sonu - 6698 Sayılı KVKK Uyarınca Hazırlanmıştır.\n';
  text += '================================================================================\n';

  return text;
}

// --------------------------------------------------------------------------
// 2. VERTICAL HTML BUILDER (Başlıklar Üstte, İçerikler Altta)
// --------------------------------------------------------------------------
function generateRecordVerticalHtml(record: InventoryRecord): string {
  const roles = [...(record.selectedPositions || [])].reverse();

  let birimHtml = '';
  SABIT_BIRIMLER.forEach((b, idx) => {
    const tasks = record.birimSecilenGorevler?.[b.key] || [];
    const taskItems = tasks.length > 0 
      ? tasks.map(t => `<li style="margin-bottom: 4px;">${t}</li>`).join('') 
      : '<li>Belirtilmemiş</li>';

    birimHtml += `
      <div class="item-block">
        <div class="item-title">${15 + idx}. ${b.unvan} Görevleri (${b.birim})</div>
        <div class="item-content">
          <ul style="margin: 4px 0 0 18px; padding: 0;">${taskItems}</ul>
        </div>
      </div>
    `;
  });

  let raciRows = '';
  (record.raciTasks || []).forEach((task, idx) => {
    let cells = '';
    roles.forEach(role => {
      const val = record.raciValues[`${idx}_${role}`] || '-';
      let bgColor = '#ffffff';
      if (val === 'R') bgColor = '#dbeafe';
      if (val === 'A') bgColor = '#fef3c7';
      if (val === 'C') bgColor = '#fce7f3';
      if (val === 'I') bgColor = '#e0e7ff';
      cells += `<td style="background-color:${bgColor}; text-align:center; font-weight:bold; border:1px solid #cbd5e1; padding:6px;">${val}</td>`;
    });
    raciRows += `<tr><td style="font-weight:600; border:1px solid #cbd5e1; padding:6px;">${task}</td>${cells}</tr>`;
  });

  return `
    <div class="record-container">
      <div class="header-box">
        <h1 style="color:#1B4332; margin:0 0 6px 0; font-size:20pt;">KVKK GÖREV VE VERİ SAKLAMA-İMHA ENVANTERİ</h1>
        <p style="color:#4b5563; margin:0; font-size:11pt;">6698 Sayılı Kanun Uyum ve Görev Tanımları Raporu</p>
      </div>

      <div class="meta-box">
        <p style="margin:4px 0;"><strong>Şirket Unvanı:</strong> ${record.unvan || '-'}</p>
        <p style="margin:4px 0;"><strong>Proje Kodu & Versiyon:</strong> ${record.projectCode || '-'} / ${record.version || 'v1.0'}</p>
        <p style="margin:4px 0;"><strong>Rapor Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
        <p style="margin:4px 0;"><strong>Yetkili / Veri Sorumlusu:</strong> ${record.yetkili || '-'} / ${record.veriSorumlusu || '-'}</p>
        <p style="margin:4px 0;"><strong>İrtibat Kişisi (VERBİS):</strong> ${record.irtibat || '-'}</p>
      </div>

      <!-- BÖLÜM 1 -->
      <div class="section-title">BÖLÜM 1: KURUMSAL VE FİRMA BİLGİLERİ (1-9)</div>
      
      <div class="item-block">
        <div class="item-title">1. Şirket Unvanı</div>
        <div class="item-content">${record.unvan || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">2. Şirket Adresi</div>
        <div class="item-content">${record.adres || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">3. Vergi Numarası (VKN)</div>
        <div class="item-content">${record.vergiNo || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">4. Vergi Dairesi</div>
        <div class="item-content">${record.vergiDairesi || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">5. MERSİS / Ticaret Sicil No</div>
        <div class="item-content">${record.mersisNo || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">6. Kurumsal Telefon & Santral</div>
        <div class="item-content">${record.telefon || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">7. Kurumsal E-Posta & KEP Adresi</div>
        <div class="item-content">${record.eposta || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">8. Faaliyet Konusu ve Sektör</div>
        <div class="item-content">${record.faaliyet || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">9. Departmanlar ve Birimler</div>
        <div class="item-content">${record.departmanlar || '-'}</div>
      </div>

      <!-- BÖLÜM 2 -->
      <div class="section-title">BÖLÜM 2: ORGANİZASYON ŞEMASI VE KVK KOMİTESİ (10-14)</div>
      
      <div class="item-block">
        <div class="item-title">10. Organizasyon Şeması (Şemsiye Modeli Pozisyon Seçimi)</div>
        <div class="item-content">
          ${(record.selectedPositions && record.selectedPositions.length > 0)
            ? `<ul style="margin:4px 0 0 18px; padding:0;">${record.selectedPositions.map(p => `<li>${p}</li>`).join('')}</ul>`
            : 'Belirtilmemiş'}
        </div>
      </div>

      <div class="item-block">
        <div class="item-title">11. KVK Komite Yapısı</div>
        <div class="item-content">
          <p style="margin:2px 0;"><strong>Komite Başkanı:</strong> ${record.komiteBaskani || 'Genel Müdür / CEO'}</p>
          <p style="margin:2px 0;"><strong>Komite Üyeleri:</strong> ${(record.komiteUyeleri || []).join(', ') || 'Belirtilmemiş'}</p>
        </div>
      </div>

      <div class="item-block">
        <div class="item-title">12. İmza Yetkilisi / Şirket Temsilcisi</div>
        <div class="item-content">${record.yetkili || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">13. Veri Sorumlusu Unvanı</div>
        <div class="item-content">${record.veriSorumlusu || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">14. İrtibat Kişisi (VERBİS Görevlisi)</div>
        <div class="item-content">${record.irtibat || '-'}</div>
      </div>

      <!-- BÖLÜM 3 -->
      <div class="section-title">BÖLÜM 3: BİRİM GÖREV VE YETKİ DAĞILIMI (15-19)</div>
      ${birimHtml}

      <!-- RACI MATRIX -->
      <div class="section-title">TERS ŞEMSİYE RACI GÖREV MATRİSİ (TABANDAN TAVANA)</div>
      <table style="width:100%; border-collapse:collapse; margin-top:8px; margin-bottom:16px;">
        <thead>
          <tr style="background-color:#2D6A4F; color:#ffffff;">
            <th style="border:1px solid #1B4332; padding:8px; text-align:left;">Alt Görev Tanımı</th>
            ${roles.map(r => `<th style="border:1px solid #1B4332; padding:8px; text-align:center;">${r}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${raciRows}
        </tbody>
      </table>

      <!-- BÖLÜM 4 -->
      <div class="section-title">BÖLÜM 4: VERİ KAYIT ORTAMLARI (20-24)</div>

      <div class="item-block">
        <div class="item-title">20. Elektronik Veri Kayıt Ortamı - Donanım</div>
        <div class="item-content">${record.donanim || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">21. Elektronik Veri Kayıt Ortamı - Yazılım & Veritabanı</div>
        <div class="item-content">${record.yazilim || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">22. Elektronik Veri Kayıt Ortamı - Güvenlik Altyapısı</div>
        <div class="item-content">${record.guvenlik || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">23. Elektronik Olmayan (Fiziksel) Veri Kayıt Ortamı</div>
        <div class="item-content">${record.elektronikOlmayan || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">24. Bulut Depolama ve Uzak Sunucu Sistemleri</div>
        <div class="item-content">${record.bulutSistemleri || '-'}</div>
      </div>

      <!-- BÖLÜM 5 -->
      <div class="section-title">BÖLÜM 5: VERİ GÜVENLİĞİ VE ALINAN TEDBİRLER (25-27)</div>

      <div class="item-block">
        <div class="item-title">25. Veri Güvenliği – İdari Tedbirler</div>
        <div class="item-content">${record.idariTedbirler || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">26. Veri Güvenliği – Teknik Tedbirler</div>
        <div class="item-content">${record.teknikTedbirler || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">27. Genel Veri Güvenliği Önlemleri</div>
        <div class="item-content">${record.veriGuvenligi || '-'}</div>
      </div>

      <!-- BÖLÜM 6 -->
      <div class="section-title">BÖLÜM 6: KİŞİSEL VERİ KATEGORİLERİ VE İŞLEME AMAÇLARI (28-33)</div>

      <div class="item-block">
        <div class="item-title">28. Kişisel Veri Kategorileri (Genel)</div>
        <div class="item-content">${record.kisiselVeriKategorileri || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">29. Özel Nitelikli Kişisel Veri Kategorileri</div>
        <div class="item-content">${record.ozelNitelikliVeriler || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">30. Kişisel Veri Elde Etme Yöntemleri</div>
        <div class="item-content">${record.veriToplamaYontemleri || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">31. Saklamayı Gerektiren İşleme Amaçları</div>
        <div class="item-content">${record.saklamaAmaclari || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">32. Saklamayı Gerektiren Hukuki Sebepler</div>
        <div class="item-content">${record.hukukiSebepler || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">33. Veri Aktarılan Alıcı Grupları</div>
        <div class="item-content">${record.aliciGruplari || '-'}</div>
      </div>

      <!-- BÖLÜM 7 -->
      <div class="section-title">BÖLÜM 7: İMHA, SÜRELER VE PERİYODİK DENETİM (34-37)</div>

      <div class="item-block">
        <div class="item-title">34. İmhayı Gerektiren Sebepler</div>
        <div class="item-content">${record.imhaSebep || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">35. İmha Yöntemleri (Silme, Yok Etme, Anonimleştirme)</div>
        <div class="item-content">${record.imhaYontem || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">36. Saklama ve İmha Süreleri</div>
        <div class="item-content">${record.saklamaSureleri || '-'}</div>
      </div>

      <div class="item-block">
        <div class="item-title">37. Periyodik İmha Süresi ve Güncelleme Takvimi</div>
        <div class="item-content">${record.periyodikImhaSuresi || '-'}</div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 3. WORD (.DOC) EXPORT - SINGLE RECORD (Başlıklar Üstte, İçerik Altta)
// --------------------------------------------------------------------------
export function exportWordDocument(record: InventoryRecord) {
  const companyName = record.unvan || 'Firma';
  const bodyContent = generateRecordVerticalHtml(record);

  const wordDocument = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>KVKK Görev ve Envanter Raporu - ${companyName}</title>
      <style>
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1f2937; padding: 24px; }
        .header-box { text-align: center; border-bottom: 2px solid #1B4332; padding-bottom: 12px; margin-bottom: 20px; }
        .meta-box { background-color: #f3f4f6; border-left: 4px solid #2D6A4F; padding: 12px; margin-bottom: 20px; }
        .section-title { background-color: #1B4332; color: #ffffff; padding: 8px 12px; font-size: 13pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px; border-radius: 4px; }
        .item-block { margin-bottom: 14px; page-break-inside: avoid; }
        .item-title { font-weight: bold; color: #164e3f; font-size: 11pt; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px dashed #d1d5db; }
        .item-content { color: #374151; font-size: 10.5pt; padding: 4px 8px; background-color: #fafafa; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; }
        th { background-color: #2D6A4F; color: white; border: 1px solid #1B4332; padding: 6px; text-align: left; font-size: 10pt; }
        td { border: 1px solid #d1d5db; padding: 6px; font-size: 9.5pt; }
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `;

  const blob = new Blob([wordDocument], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `Gorev_Envanter_Raporu_${sanitizeFilename(companyName)}.doc`);
}

// --------------------------------------------------------------------------
// 4. WORD (.DOC) EXPORT - FULL DATABASE (Veritabanını Word'e Aktar)
// --------------------------------------------------------------------------
export function exportDatabaseToWord(records: InventoryRecord[]) {
  if (!records || records.length === 0) return;

  const recordsHtml = records.map((rec, idx) => `
    <div style="${idx > 0 ? 'page-break-before: always; margin-top: 30px; padding-top: 20px; border-top: 3px double #1B4332;' : ''}">
      <div style="background-color:#e6f4ea; color:#1B4332; font-weight:bold; font-size:12pt; padding:6px 12px; margin-bottom:12px; border-left:6px solid #1B4332;">
        VERİTABANI KAYDI #${idx + 1}: ${rec.unvan || rec.title || 'İsimsiz Şirket'} (${rec.projectCode || 'PRJ-KVK'})
      </div>
      ${generateRecordVerticalHtml(rec)}
    </div>
  `).join('\n');

  const wordDocument = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>KVKK Tüm Veritabanı Raporu - (${records.length} Kayıt)</title>
      <style>
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1f2937; padding: 24px; }
        .header-box { text-align: center; border-bottom: 2px solid #1B4332; padding-bottom: 12px; margin-bottom: 20px; }
        .meta-box { background-color: #f3f4f6; border-left: 4px solid #2D6A4F; padding: 12px; margin-bottom: 20px; }
        .section-title { background-color: #1B4332; color: #ffffff; padding: 8px 12px; font-size: 13pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px; border-radius: 4px; }
        .item-block { margin-bottom: 14px; page-break-inside: avoid; }
        .item-title { font-weight: bold; color: #164e3f; font-size: 11pt; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px dashed #d1d5db; }
        .item-content { color: #374151; font-size: 10.5pt; padding: 4px 8px; background-color: #fafafa; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; }
        th { background-color: #2D6A4F; color: white; border: 1px solid #1B4332; padding: 6px; text-align: left; font-size: 10pt; }
        td { border: 1px solid #d1d5db; padding: 6px; font-size: 9.5pt; }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f0fdf4; border: 2px solid #2D6A4F; border-radius: 8px;">
        <h1 style="color: #1B4332; margin: 0; font-size: 24pt;">KVKK GÖREV VE ENVANTER VERİTABANI TOPLU DÖKÜMANI</h1>
        <p style="color: #374151; font-size: 12pt; margin: 8px 0 0 0;">Veritabanında Kayıtlı Toplam <strong>${records.length}</strong> Şirket Envanteri</p>
        <p style="color: #6b7280; font-size: 10pt; margin: 4px 0 0 0;">Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</p>
      </div>

      ${recordsHtml}
    </body>
    </html>
  `;

  const blob = new Blob([wordDocument], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `KVKK_Veritabani_Toplu_Rapor_${new Date().toISOString().slice(0, 10)}.doc`);
}

// --------------------------------------------------------------------------
// 5. EXCEL SPREADSHEET (.XLS) - Sütun Sütun Yan Yana, Altlarında İçerikler
// --------------------------------------------------------------------------
export function exportExcelSpreadsheet(record: InventoryRecord) {
  exportDatabaseToExcel([record], `Gorev_Envanter_Raporu_${sanitizeFilename(record.unvan || 'Firma')}.xls`);
}

export function exportDatabaseToExcel(records: InventoryRecord[], customFilename?: string) {
  const filename = customFilename || `KVKK_Veritabani_Excel_${new Date().toISOString().slice(0, 10)}.xls`;

  // Headers array (Sütun sütun yan yana)
  const columns = [
    'Sıra',
    'Proje Kodu',
    'Versiyon',
    'Durum',
    '1. Şirket Unvanı',
    '2. Şirket Adresi',
    '3. Vergi Numarası (VKN)',
    '4. Vergi Dairesi',
    '5. MERSİS / Sicil No',
    '6. Kurumsal Telefon',
    '7. Kurumsal E-Posta',
    '8. Faaliyet Konusu',
    '9. Departmanlar',
    '10. Şemsiye Pozisyonları',
    '11. Komite Başkanı',
    '11. Komite Üyeleri',
    '12. İmza Yetkilisi / Temsilci',
    '13. Veri Sorumlusu',
    '14. İrtibat Kişisi (VERBİS)',
    '15. Genel Müdürlük Görevleri',
    '16. İK Müdürlüğü Görevleri',
    '17. IT / Teknik Müdürlük Görevleri',
    '18. Finans & Muhasebe Görevleri',
    '19. Hukuk & Uyum Görevleri',
    '20. Elektronik Donanım Ortamları',
    '21. Yazılım & Veritabanı Ortamları',
    '22. Güvenlik Altyapısı Ortamları',
    '23. Fiziksel Kayıt Ortamları',
    '24. Bulut ve Sunucu Sistemleri',
    '25. İdari Tedbirler',
    '26. Teknik Tedbirler',
    '27. Genel Veri Güvenliği Önlemleri',
    '28. Kişisel Veri Kategorileri',
    '29. Özel Nitelikli Kişisel Veriler',
    '30. Veri Toplama Yöntemleri',
    '31. Saklama ve İşleme Amaçları',
    '32. Hukuki Sebepler',
    '33. Veri Aktarılan Alıcı Grupları',
    '34. İmha Sebepleri',
    '35. İmha Yöntemleri',
    '36. Saklama ve İmha Süreleri',
    '37. Periyodik İmha Süresi',
    'Son Güncelleme Tarihi'
  ];

  // Build rows for each record
  let rowsHtml = '';
  records.forEach((rec, idx) => {
    const rowValues = [
      idx + 1,
      rec.projectCode || '',
      rec.version || 'v1.0',
      rec.status || 'draft',
      rec.unvan || '',
      rec.adres || '',
      rec.vergiNo || '',
      rec.vergiDairesi || '',
      rec.mersisNo || '',
      rec.telefon || '',
      rec.eposta || '',
      rec.faaliyet || '',
      rec.departmanlar || '',
      (rec.selectedPositions || []).join('; '),
      rec.komiteBaskani || '',
      (rec.komiteUyeleri || []).join('; '),
      rec.yetkili || '',
      rec.veriSorumlusu || '',
      rec.irtibat || '',
      (rec.birimSecilenGorevler?.yetkiGenelMudur || []).join('; '),
      (rec.birimSecilenGorevler?.yetkiIKMudur || []).join('; '),
      (rec.birimSecilenGorevler?.yetkiTeknik || []).join('; '),
      (rec.birimSecilenGorevler?.yetkiFinans || []).join('; '),
      (rec.birimSecilenGorevler?.yetkiHukuk || []).join('; '),
      rec.donanim || '',
      rec.yazilim || '',
      rec.guvenlik || '',
      rec.elektronikOlmayan || '',
      rec.bulutSistemleri || '',
      rec.idariTedbirler || '',
      rec.teknikTedbirler || '',
      rec.veriGuvenligi || '',
      rec.kisiselVeriKategorileri || '',
      rec.ozelNitelikliVeriler || '',
      rec.veriToplamaYontemleri || '',
      rec.saklamaAmaclari || '',
      rec.hukukiSebepler || '',
      rec.aliciGruplari || '',
      rec.imhaSebep || '',
      rec.imhaYontem || '',
      rec.saklamaSureleri || '',
      rec.periyodikImhaSuresi || '',
      rec.updatedAt ? new Date(rec.updatedAt).toLocaleDateString('tr-TR') : ''
    ];

    const cellsHtml = rowValues.map(val => `<td style="border:1px solid #d1d5db; padding:6px; font-size:10pt;">${String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('');
    rowsHtml += `<tr>${cellsHtml}</tr>`;
  });

  const headerCellsHtml = columns.map(col => `<th style="background-color:#1B4332; color:#ffffff; border:1px solid #0f281e; padding:8px; font-size:10pt; text-align:center; white-space:nowrap;">${col}</th>`).join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        th { background-color: #1B4332; color: #ffffff; font-weight: bold; border: 1px solid #0f281e; padding: 8px; font-size: 10pt; }
        td { border: 1px solid #cbd5e1; padding: 6px; font-size: 9.5pt; vertical-align: top; }
      </style>
    </head>
    <body>
      <table border="1">
        <thead>
          <tr>
            ${headerCellsHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, filename);
}

// --------------------------------------------------------------------------
// 6. CSV EXPORT - TABULAR COLUMNS
// --------------------------------------------------------------------------
export function exportCSVDocument(record: InventoryRecord) {
  exportDatabaseToCSV([record], `Gorev_Envanter_Raporu_${sanitizeFilename(record.unvan || 'Firma')}.csv`);
}

export function exportDatabaseToCSV(records: InventoryRecord[], customFilename?: string) {
  const filename = customFilename || `KVKK_Veritabani_${new Date().toISOString().slice(0, 10)}.csv`;

  const headers = [
    'Sira',
    'Proje Kodu',
    'Versiyon',
    'Durum',
    '1. Sirket Unvani',
    '2. Sirket Adresi',
    '3. VKN',
    '4. Vergi Dairesi',
    '5. MERSIS',
    '6. Telefon',
    '7. E-Posta',
    '8. Faaliyet Konusu',
    '9. Departmanlar',
    '10. Semsiye Pozisyonlari',
    '11. Komite Baskani',
    '11. Komite Uyeleri',
    '12. Imza Yetkilisi',
    '13. Veri Sorumlusu',
    '14. Irtibat Kisisi',
    '15. Genel Mudur Gorevleri',
    '16. IK Mudur Gorevleri',
    '17. IT Teknik Gorevleri',
    '18. Finans Gorevleri',
    '19. Hukuk Gorevleri',
    '20. Donanim Ortamlari',
    '21. Yazilim Ortamlari',
    '22. Guvenlik Ortamlari',
    '23. Fiziksel Ortamlar',
    '24. Bulut Sistemleri',
    '25. Idari Tedbirler',
    '26. Teknik Tedbirler',
    '27. Genel Veri Guvenligi',
    '28. Kisisel Veri Kategorileri',
    '29. Ozel Nitelikli Veriler',
    '30. Veri Toplama Yontemleri',
    '31. Saklama Amaclari',
    '32. Hukuki Sebepler',
    '33. Alici Gruplari',
    '34. Imha Sebepleri',
    '35. Imha Yontemleri',
    '36. Saklama Sureleri',
    '37. Periyodik Imha Suresi'
  ];

  let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';

  records.forEach((rec, idx) => {
    const row = [
      idx + 1,
      rec.projectCode || '',
      rec.version || 'v1.0',
      rec.status || 'draft',
      rec.unvan || '',
      rec.adres || '',
      rec.vergiNo || '',
      rec.vergiDairesi || '',
      rec.mersisNo || '',
      rec.telefon || '',
      rec.eposta || '',
      rec.faaliyet || '',
      rec.departmanlar || '',
      (rec.selectedPositions || []).join('; '),
      rec.komiteBaskani || '',
      (rec.komiteUyeleri || []).join('; '),
      rec.yetkili || '',
      rec.veriSorumlusu || '',
      rec.irtibat || '',
      (rec.birimSecilenGorevler?.yetkiGenelMudur || []).join('; '),
      (rec.birimSecilenGorevler?.yetkiIKMudur || []).join('; '),
      (rec.birimSecilenGorevler?.yetkiTeknik || []).join('; '),
      (rec.birimSecilenGorevler?.yetkiFinans || []).join('; '),
      (rec.birimSecilenGorevler?.yetkiHukuk || []).join('; '),
      rec.donanim || '',
      rec.yazilim || '',
      rec.guvenlik || '',
      rec.elektronikOlmayan || '',
      rec.bulutSistemleri || '',
      rec.idariTedbirler || '',
      rec.teknikTedbirler || '',
      rec.veriGuvenligi || '',
      rec.kisiselVeriKategorileri || '',
      rec.ozelNitelikliVeriler || '',
      rec.veriToplamaYontemleri || '',
      rec.saklamaAmaclari || '',
      rec.hukukiSebepler || '',
      rec.aliciGruplari || '',
      rec.imhaSebep || '',
      rec.imhaYontem || '',
      rec.saklamaSureleri || '',
      rec.periyodikImhaSuresi || ''
    ];

    csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  // Include UTF-8 BOM for Excel Turkish character compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

// --------------------------------------------------------------------------
// 7. PLAIN TEXT (.TXT) EXPORT - SINGLE & DATABASE (Alt Alta Başlık & İçerik)
// --------------------------------------------------------------------------
export function exportTextDocument(record: InventoryRecord) {
  const companyName = record.unvan || 'Firma';
  const textContent = generateVerticalTextReport(record);
  const blob = new Blob(['\uFEFF' + textContent], { type: 'text/plain;charset=utf-8;' });
  downloadBlob(blob, `Gorev_Envanter_Raporu_${sanitizeFilename(companyName)}.txt`);
}

export function exportDatabaseToText(records: InventoryRecord[]) {
  let fullText = '';
  records.forEach((rec, idx) => {
    fullText += `\n################################################################################\n`;
    fullText += `VERİTABANI KAYDI #${idx + 1} / ${records.length}\n`;
    fullText += `################################################################################\n\n`;
    fullText += generateVerticalTextReport(rec);
    fullText += '\n\n\n';
  });

  const blob = new Blob(['\uFEFF' + fullText], { type: 'text/plain;charset=utf-8;' });
  downloadBlob(blob, `KVKK_Veritabani_Tum_Kayitlar_${new Date().toISOString().slice(0, 10)}.txt`);
}

// --------------------------------------------------------------------------
// 8. PDF EXPORT (Text ve Düzenden PDF'e Aktar)
// --------------------------------------------------------------------------
export async function exportPDFDocument(record: InventoryRecord, elementId?: string): Promise<boolean> {
  const companyName = record.unvan || 'Firma';
  
  // If target element exists in DOM, render via html2canvas
  const targetElement = elementId ? document.getElementById(elementId) : null;
  
  if (targetElement) {
    try {
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // top margin

      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      pdf.save(`Gorev_Envanter_Raporu_${sanitizeFilename(companyName)}.pdf`);
      return true;
    } catch (error) {
      console.warn('DOM PDF export had an issue, falling back to direct PDF engine:', error);
    }
  }

  // Fallback: Pure Direct Text-based PDF generator
  try {
    const pdf = new jsPDF('p', 'pt', 'a4');
    const textReport = generateVerticalTextReport(record);
    const splitLines = pdf.splitTextToSize(textReport, 500);

    let cursorY = 40;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    for (let i = 0; i < splitLines.length; i++) {
      if (cursorY > pageHeight - 40) {
        pdf.addPage();
        cursorY = 40;
      }
      pdf.text(splitLines[i], 40, cursorY);
      cursorY += 13;
    }

    pdf.save(`Gorev_Envanter_Raporu_${sanitizeFilename(companyName)}.pdf`);
    return true;
  } catch (err) {
    console.error('PDF generation failed:', err);
    return false;
  }
}

// --------------------------------------------------------------------------
// Helper Download Utilities
// --------------------------------------------------------------------------
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ_ -]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 40) || 'Firma';
}

