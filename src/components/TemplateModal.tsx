import { SAMPLE_DATABASE_RECORDS } from '../data/initialData';
import { InventoryRecord } from '../types';
import { Sparkles, Building2, Stethoscope, Factory, ShoppingCart, ArrowRight, X } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: InventoryRecord) => void;
}

export function TemplateModal({ isOpen, onClose, onApplyTemplate }: TemplateModalProps) {
  if (!isOpen) return null;

  const extraTemplates: Array<{
    title: string;
    subtitle: string;
    icon: any;
    record: InventoryRecord;
  }> = [
    {
      title: 'Bilişim & Yazılım Teknolojileri A.Ş.',
      subtitle: 'SaaS, Bulut Çözümleri, Yazılım Geliştirme ve ISO 27001 Uyumlu',
      icon: <Building2 className="w-6 h-6 text-emerald-600" />,
      record: SAMPLE_DATABASE_RECORDS[0]
    },
    {
      title: 'Özel Sağlık & Tıp Merkezi Ltd. Şti.',
      subtitle: 'Hasta Kayıtları, Özel Nitelikli Sağlık Verileri ve Medula Entegrasyonu',
      icon: <Stethoscope className="w-6 h-6 text-rose-600" />,
      record: SAMPLE_DATABASE_RECORDS[1]
    },
    {
      title: 'Endüstriyel Üretim & Otomotiv Yan Sanayi A.Ş.',
      subtitle: 'Fabrika Üretim, Vardiya & İSG, Tedarikçi Ağı ve ERP Entegrasyonu',
      icon: <Factory className="w-6 h-6 text-amber-600" />,
      record: {
        ...SAMPLE_DATABASE_RECORDS[0],
        id: 'rec_uretim_03',
        title: 'Atlas Metal & Endüstri A.Ş.',
        unvan: 'Atlas Metal Sanayi ve Otomotiv Yan Parça Ticaret Anonim Şirketi',
        projectCode: 'PRJ-ATLAS-2026',
        faaliyet: 'Metal pres, talaşlı imalat, otomotiv OEM parça üretimi ve ihracatı',
        departmanlar: 'Fabrika Müdürlüğü, Kalite Kontrol, Üretim Planlama, İSG, İK, Lojistik, Muhasebe',
        yetkili: 'Mustafa Kemal Karadağ (Genel Müdür)',
        veriSorumlusu: 'Atlas Metal Sanayi ve Otomotiv Tic. A.Ş.',
        irtibat: 'Murat Çelik (İnsan Kaynakları & İSG Şefi)',
        infoNote: 'Fabrika içi giriş-çıkış parmak izi ve kamera güvenlik sistemleri mevcuttur.'
      }
    },
    {
      title: 'E-Ticaret & Perakende Mağazacılık A.Ş.',
      subtitle: 'Online Alışveriş, Çağrı Merkezi, Kargo Entegrasyonu ve Müşteri Sadakat Verileri',
      icon: <ShoppingCart className="w-6 h-6 text-blue-600" />,
      record: {
        ...SAMPLE_DATABASE_RECORDS[0],
        id: 'rec_eticaret_04',
        title: 'Trend Trend E-Ticaret ve Mağazacılık A.Ş.',
        unvan: 'Trend Trend Elektronik Ticaret ve Pazarlama Anonim Şirketi',
        projectCode: 'PRJ-TREND-2026',
        faaliyet: 'B2C E-Ticaret platformu, pazaryeri entegrasyonu ve omni-channel perakende',
        departmanlar: 'E-Ticaret Operasyon, Çağrı Merkezi, Dijital Pazarlama, Kargo & Lojistik, Yazılım, Hukuk',
        yetkili: 'Selin Aydın (Yönetim Kurulu Üyesi)',
        veriSorumlusu: 'Trend Trend Elektronik Ticaret A.Ş.',
        irtibat: 'Av. Berk Güven (KVKK Uyum Danışmanı)',
        infoNote: 'Müşteri veri tabanları PCI-DSS standartlarında ve şifreli tutulmaktadır.'
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">KVKK Hazır Sektör Şablonları</h2>
              <p className="text-xs text-emerald-100">
                Sektörünüze uygun hazır bir envanter seçerek hızlıca kayıt oluşturun
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-50 space-y-3">
          {extraTemplates.map((tpl, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-slate-50 group-hover:bg-emerald-50 rounded-xl border border-slate-100 transition-colors">
                  {tpl.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-800 transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {tpl.subtitle}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                    <span>🏢 {tpl.record.departmanlar.split(',').length} Departman</span>
                    <span>•</span>
                    <span>👥 {tpl.record.selectedPositions.length} Pozisyon</span>
                    <span>•</span>
                    <span>🛡️ Komite & RACI Hazır</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onApplyTemplate(tpl.record);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 group-hover:bg-[#1B4332] text-emerald-800 group-hover:text-white rounded-xl text-xs font-semibold transition-all flex-shrink-0 shadow-sm"
              >
                Şablonu Yükle
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Vazgeç
          </button>
        </div>

      </div>
    </div>
  );
}
