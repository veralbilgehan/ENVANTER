import { Position, UnitDefinition, InventoryRecord, StepConfig } from '../types';

export const DEPARTMAN_TUR_LISTESI = [
  "Genel Müdürlük & İcra Kurulu",
  "Yazılım Geliştirme & Ar-Ge",
  "Bilgi İşlem ve IT Departmanı",
  "Siber Güvenlik & Bilgi Güvenliği",
  "İnsan Kaynakları (İK)",
  "Bordro ve Özlük İşleri",
  "Muhasebe ve Finans",
  "Hukuk Müşavirliği ve Mevzuat Uyum",
  "KVK / Veri Koruma Ofisi (DPO)",
  "Satış ve Pazarlama",
  "Müşteri Hizmetleri & Çağrı Merkezi",
  "Satın Alma ve Tedarik Zinciri",
  "Operasyon ve Süreç Yönetimi",
  "Üretim, Fabrika ve İmalat",
  "Kalite Güvence ve Test",
  "Depo, Sevkiyat ve Lojistik",
  "İdari İşler ve Tesis Yönetimi",
  "İş Sağlığı ve Güvenliği (İSG)",
  "Kurumsal İletişim ve Halkla İlişkiler",
  "E-Ticaret ve Dijital Kanallar",
  "İç Denetim ve Risk Yönetimi"
];

export const POLITIKA_METNI = `
<h4>1. AMAÇ</h4>
<p>Bu politika ŞİRKETİMİZ tarafından yürütülen faaliyetler sırasında işlenmesi gereken kişisel verilerin 6698 Sayılı Kişisel Verilerin Korunması Kanunu'na (KVKK) uygun yöntemlerle işlenmesi, saklanması ve gerektiğinde imha edilmesini amaçlamaktadır.</p>

<h4>2. KAPSAM</h4>
<p>Bu Politika; şirketimiz ile ilişki kurmuş tüm gerçek kişiler, çalışanlar, stajyerler, çalışan adayları, ziyaretçiler, tedarikçiler, iş ortakları ve üçüncü kişilerin otomatik olan ya da herhangi bir veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yollarla işlenen tüm kişisel verilerini kapsar.</p>

<h4>3. TANIMLAR VE KISALTMALAR</h4>
<ul>
    <li><strong>Açık Rıza:</strong> Belirli bir konuya ilişkin, bilgilendirilmeye dayanan ve özgür iradeyle açıklanan rıza.</li>
    <li><strong>İmha:</strong> Kişisel verilerin silinmesi, yok edilmesi veya anonim hale getirilmesi işlemi.</li>
    <li><strong>Kanun:</strong> 6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK).</li>
    <li><strong>Kişisel Veri:</strong> Kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgi.</li>
    <li><strong>Özel Nitelikli Kişisel Veri:</strong> Kişilerin ırkı, etnik kökeni, siyasi düşüncesi, felsefi inancı, dini, mezhebi veya diğer inançları, kılık ve kıyafeti, dernek, vakıf ya da sendika üyeliği, sağlığı, cinsel hayatı, ceza mahkûmiyeti ve güvenlik tedbirleriyle ilgili verileri ile biyometrik ve genetik verileri.</li>
    <li><strong>Veri Sorumlusu:</strong> Kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen, veri kayıt sisteminin kurulmasından ve yönetilmesinden sorumlu olan tüzel veya gerçek kişi.</li>
    <li><strong>Veri İşleyen:</strong> Veri sorumlusunun verdiği yetkiye dayanarak onun adına kişisel verileri işleyen gerçek veya tüzel kişi.</li>
    <li><strong>Periyodik İmha:</strong> Kanunda yer alan kişisel verilerin işlenme şartlarının tamamının ortadan kalkması durumunda kişisel verileri saklama ve imha politikasında belirtilen ve tekrar eden aralıklarla re'sen gerçekleştirilecek silme, yok etme veya anonim hale getirme işlemi.</li>
</ul>
`;

export const EK_BILGILER = `
<h4>Periyodik İmha Süresi</h4>
<p>Şirketimizde periyodik imha süresi <strong>6 ay</strong> olarak belirlenmiştir. Her yıl Haziran ayı sonu ile Aralık ayı sonu itibarıyla periyodik imha işlemi mevzuata uygun şekilde icra edilir.</p>

<h4>Politika'nın Yayınlanması ve Saklanması</h4>
<p>Şirketimiz imha politikası basılı ıslak imzalı kağıt ortamında ve şifrelenmiş dijital ortamda olmak üzere 2 ayrı formatta hazır bulundurulmaktadır.</p>
<p>İmha politikası çalışanlara bildirilmiş, şirket iç ağı ve internet sitesinde yayınlanmış, Veri Sorumlusu İrtibat Kişisi ve Mali İşler Müdürü tarafından özel KVKK dosyasında saklanmaktadır.</p>
<p>Politika yenilendiği takdirde yeni versiyonu dosyasında ayrıca saklanacak ve geçmiş versiyonlar 10 yıl süreyle arşivlenecektir.</p>

<h4>Politika'nın Güncellenme Periyodu</h4>
<p>İmha politikası mevzuatta değişiklik olduğu, şirket organizasyon şemasında veya veri işleme süreçlerinde değişiklik meydana geldiğinde ya da Komite tarafından ihtiyaç duyulduğunda derhal güncellenir.</p>

<h4>Politika'nın Yürürlüğü ve Yürürlükten Kaldırılması</h4>
<p>Politika internet sitesinde ve şirket intranetinde yayınlanması akabinde yürürlüğe girer. Yeni bir versiyon yürürlüğe girdiğinde önceki politika yürürlükten kalkar ve 10 yıl süreyle güvenli arşivde saklanır.</p>
`;

export const VERI_GUVENLIGI_LISTESI = [
  "Bilgiler sağlık bakanlığı ölüm bildirim sisteminde depolanmaktadır.",
  "Kişisel verilerin hukuka aykırı işlenmesini önlemeye yönelik riskler belirlenmektedir.",
  "Fiziksel ve dijital arşivleme güvenlik standartlarına uygun yapılmaktadır.",
  "Çalışanlar için veri güvenliği hükümleri içeren disiplin düzenlemeleri mevcuttur.",
  "Erişim, bilgi güvenliği, kullanım, saklama ve imha konularında kurumsal politikalar hazırlanmıştır.",
  "Tüm personel ile Gizlilik ve Sadakat Taahhütnameleri imzalanmıştır.",
  "İmzalanan ticari sözleşmeler KVKK veri güvenliği hükümleri içermektedir.",
  "Çalışanlar için yetki matrisi (RACI modeli) oluşturulmuştur.",
  "Görev değişikliği olan ya da işten ayrılan personelin sistem yetkileri derhal kaldırılmaktadır.",
  "Şirket bünyesinde çalışanlara Bilgi Koruma Taahhütnameleri imzalatılmaktadır.",
  "Çalışanlar için veri güvenliği ve siber farkındalık eğitimleri periyodik verilmektedir.",
  "Kişisel veri güvenliği politika ve prosedürleri belirlenmiştir.",
  "Kişisel veri içeren fiziksel ortamlara (arşiv, sunucu odası) giriş-çıkış kartlı/kameralı sistemle denetlenmektedir.",
  "Kurum içi periyodik ve/veya rastgele KVK denetimleri yapılmaktadır.",
  "Güvenlik politika ve prosedürlerine uymayan çalışanlara yönelik disiplin prosedürü hazırlanmıştır.",
  "Kişisel veri işleme envanteri güncel olarak tutulmakta ve VERBİS senkronizasyonu sağlanmaktadır.",
  "Ağ güvenliği ve uygulama güvenliği (Firewall, WAF, IPS/IDS) sağlanmaktadır.",
  "Kişisel veri içeren ortamlar yedeklenmekte ve yedeklerin güvenliği şifreli tutulmaktadır."
];

export const IDARI_TEDBIRLER_LISTESI = [
  "Çalışanlar için Veri Güvenliği Hükümleri İçeren Disiplin Yönetmeliği",
  "Çalışanlarla Gizlilik ve Sadakat Taahhütnamelerinin İmzalanması",
  "Görev Değişikliği veya İşten Ayrılışta Sistem Yetkilerinin Derhal Kaldırılması",
  "Kişisel Veri Güvenliği Politikaları ve Prosedürlerinin Hazırlanması",
  "Kişisel Veri İşleme Envanteri Hazırlanması ve Güncellenmesi",
  "Periyodik Olarak KVK ve Siber Farkındalık Eğitimlerinin Verilmesi",
  "İmzalanan Ticari Sözleşmelerde KVK ve Veri Güvenliği Maddelerinin Bulunması",
  "Kurum İçi Periyodik ve Rastgele KVK Denetimlerinin Yapılması",
  "Veri Minimizasyonu İlkesinin Kurum Genelinde Uygulanması",
  "Özel Nitelikli Kişisel Veriler İçin Ayrı Güvenlik Prosedürlerinin Belirlenmesi"
];

export const TEKNIK_TEDBIRLER_LISTESI = [
  "Ağ Güvenliği ve Uygulama Güvenliği (Firewall, WAF, IPS/IDS)",
  "Kullanıcı Hesap Yönetimi ve Yetki Kontrol Matrisi",
  "Bilgi Sistemleri Güncel ve Lisanslı Yazılımlarla Korunmaktadır",
  "Periyodik Sızma (Penetrasyon) Testleri ve Zafiyet Taraması",
  "Siber Güvenlik Olay Yönetimi ve SIEM Log Takibi (5651 Loglama)",
  "Uç Nokta Güvenliği (Merkezi Antivirüs / EDR)",
  "Disk ve Veri Şifreleme (BitLocker, AES-256, SSL/TLS)",
  "Çift Faktörlü Kimlik Doğrulama (2FA / MFA)",
  "Veri Kaybı Önleme (DLP) Yazılımlarının Kullanımı",
  "Kişisel Verilerin Güvenli Yedeklenmesi ve Şifreli Depolanması"
];

export const BULUT_SISTEMLERI = [
  "Microsoft 365 / OneDrive / Teams Bulut Hizmetleri",
  "Google Workspace / Google Drive Depolama",
  "Amazon Web Services (AWS) S3 / EC2 Bulut Altyapısı",
  "Microsoft Azure Cloud Sunucuları",
  "Yerli Bulut / Özel Veri Merkezi Barındırma",
  "Bulut Tabanlı Muhasebe / Paraşüt / Logo Bulut",
  "Bulut Tabanlı CRM / Salesforce / HubSpot",
  "Bulut E-Posta Sunucusu (Exchange Online)",
  "Uzak Veri Yedekleme / Acronis / Veeam Cloud"
];

export const OZEL_NITELIKLI_VERILER = [
  "Sağlık Bilgileri (İşe giriş muayene formu, Sağlık raporu, Engellilik durumu)",
  "Kan Grubu Bilgisi (Ehliyet veya sağlık kartı)",
  "Ceza Mahkûmiyeti ve Güvenlik Tedbirleri (Adli Sicil Kaydı)",
  "Biyometrik Veri (Parmak izi, Yüz tanıma PDKS kayıtları)",
  "Sendika Üyeliği Bilgisi (Sendika aidat kesinti listeleri)",
  "Kılık ve Kıyafet / Fotoğraf Bilgisi",
  "Genetik Veriler"
];

export const VERI_TOPLAMA_YONTEMLERI = [
  "İnternet Sitesi İletişim, Talep ve Başvuru Formları",
  "Fiziki Ortamda Doldurulan İş Başvuru ve Mülakat Formları",
  "Fiziki Sözleşmeler, Protokoller, İrsaliye ve Faturalar",
  "Şirket Girişinde Ziyaretçi Defteri ve Resepsiyon Kayıtları",
  "Kapalı Devre Güvenlik Kamera (CCTV) Sistemleri",
  "Çağrı Merkezi / Telefon Görüşmesi Ses Kayıtları",
  "E-Posta, KEP, Kargo, Posta veya Faks Yoluyla Gönderilen Evraklar",
  "İnternet Sitesi Çerezleri (Cookies) ve Dijital Analitik Araçları",
  "Mobil Uygulama ve Kullanıcı Portalları"
];

export const HUKUKI_SEBEPLER = [
  "Kanunlarda açıkça öngörülmesi (6698 s.k. Md. 5/2-a)",
  "Fiili imkânsızlık nedeniyle rızasını açıklayamayacak durumda olanın korunması (Md. 5/2-b)",
  "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması (Md. 5/2-c)",
  "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması (Md. 5/2-ç)",
  "İlgili kişinin kendisi tarafından alenileştirilmiş olması (Md. 5/2-d)",
  "Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması (Md. 5/2-e)",
  "İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla meşru menfaatler (Md. 5/2-f)",
  "İlgili Kişinin Açık Rızası (Md. 5/1 ve Md. 6/2)"
];

export const ALICI_GRUPLARI = [
  "Yetkili Kamu Kurum ve Kuruluşları (Bakanlıklar, Gelir İdaresi, SGK, BTK, KVKK)",
  "Adli Makamlar, Mahkemeler ve İcra Daireleri",
  "Bankalar ve Finans Kuruluşları (Maaş ve Ödeme Transferleri İçin)",
  "Gerçek Kişiler veya Özel Hukuk Tüzel Kişileri (Tedarikçi & İş Ortakları)",
  "Hukuk Müşavirleri, Avukatlar ve Bağımsız Denetçiler",
  "Mali Müşavir ve Yeminli Mali Müşavirlik Ofisleri",
  "İş Sağlığı ve Güvenliği Şirketleri (OSGB) & İşyeri Hekimi",
  "Şirket Hissedarları ve Yönetim Kurulu Üyeleri",
  "Kargo, Kurye ve Posta Dağıtım Hizmeti Sağlayıcıları"
];

export const PERIYODIK_IMHA_SURELERI = [
  "6 Ayda Bir (Her Yıl Haziran Sonu ve Aralık Sonu İtibarıyla - Standart)",
  "3 Ayda Bir (Yoğun Veri İşleme Hacmine Sahip Kurumlar)",
  "Yılda Bir Kez (Yıllık Denetim ve Revizyon Döneminde)",
  "Kişisel Veri Saklama ve İmha Politikasının Yıllık Düzenli Revizyonu"
];

export const KISISEL_VERI_KATEGORILERI = [
  "Kimlik - Ad soyad, TC kimlik no, Doğum tarihi, İmza",
  "İletişim - E-posta adresi, Telefon no, Tebligat adresi, Dahili no",
  "Lokasyon - Bulunduğu yerin GPS/konum bilgileri, Taşıt takip",
  "Özlük - Bordro bilgileri, Disiplin soruşturması, İşe giriş belgesi, CV, Performans değerlendirme",
  "Hukuki İşlem - Dava dosyası, İcra takipleri, Adli yazışmalar, Noter ihtarnameleri",
  "Müşteri İşlem - Sipariş bilgisi, Fatura, Talep/Şikayet kaydı, Çağrı merkezi kayıtları",
  "Fiziksel Mekan Güvenliği - Güvenlik kamera kayıtları, Ziyaretçi giriş-çıkış defteri",
  "İşlem Güvenliği - IP adresi, Kullanıcı adı/şifre, Log kayıtları, MAC adresi",
  "Finans - Bilanço bilgileri, IBAN/Banka hesap no, Finansal performans, Vergi levhası",
  "Mesleki Deneyim - Diploma bilgileri, Sertifikalar, Kurs bitirme belgeleri, Referanslar",
  "Pazarlama - Alışveriş geçmişi, Çerez (cookie) kayıtları, Kampanya onayları",
  "Görsel Ve İşitsel Kayıtlar - Fotoğraf, Ses kaydı, Video kamera kayıtları",
  "Sağlık Bilgileri (Özel Nitelikli) - Sağlık raporları, Kan grubu kartı, Engellilik durumu",
  "Sendika Üyeliği (Özel Nitelikli) - Sendika aidat kesinti listeleri",
  "Biyometrik Veri (Özel Nitelikli) - Parmak izi, Yüz tanıma kayıtları",
  "Ceza Mahkûmiyeti ve Güvenlik Tedbirleri (Özel Nitelikli) - Adli sicil kaydı"
];

export const SAKLAMA_AMACLARI = [
  "Kurumsal iletişimi ve operasyonel koordinasyonu sağlamak.",
  "Şirket, çalışan ve ziyaretçi fiziksel mekan güvenliğini sağlamak.",
  "İstatistiksel, analitik ve iş geliştirme çalışmaları yapabilmek.",
  "Yasal düzenlemelerin gerektirdiği veya zorunlu kıldığı şekilde hukuki yükümlülüklerin yerine getirilmesini sağlamak.",
  "İleride doğabilecek hukuki uyuşmazlıklarda delil olarak ispat yükümlülüğünü yerine getirmek.",
  "İmzalanan sözleşmeler, protokoller ve taahhütler neticesinde iş ve işlemleri ifa edebilmek.",
  "VERBİS kapsamında verilen kayıt ve bildirim yükümlülüklerini düzenlemek ve güncellemek.",
  "Kurum ile iş ilişkisinde bulunan gerçek ve tüzel kişilerle irtibat sağlamak.",
  "Mali ve yasal denetim raporlamalarını eksiksiz gerçekleştirmek.",
  "Müşteri ilişkileri, destek ve çağrı merkezi süreçlerini yönetmek.",
  "İnsan kaynakları işe alım, özlük ve bordrolama süreçlerini yürütmek."
];

export const IMHA_SEBEPLER = [
  "İşlenmesine esas teşkil eden ilgili mevzuat hükümlerinin yürürlükten kalkması veya değiştirilmesi.",
  "İşlenmesini veya saklanmasını gerektiren meşru amacın tamamen ortadan kalkması.",
  "Kişisel verileri işlemenin sadece açık rıza şartına istinaden gerçekleştiği hallerde, ilgili kişinin açık rızasını geri alması.",
  "Kanunun 11 inci maddesi gereği ilgili kişinin kişisel verilerinin silinmesi ve yok edilmesine ilişkin yaptığı başvurunun Veri Sorumlusu tarafından kabul edilmesi.",
  "Kurulun (KVKK), ilgili kişinin şikayeti üzerine kişisel verilerin silinmesine karar vermesi.",
  "Kişisel verilerin saklanmasını gerektiren azami yasal veya kurumsal saklama süresinin sona ermiş olması."
];

export const IMHA_YONTEMLER = [
  "Sunucularda yer alan kişisel verilerden saklama süresi dolanlar için sistem yöneticisi tarafından yetkiler kaldırılarak kalıcı silme işlemi uygulanır.",
  "Elektronik ortamdaki veriler, veritabanı yöneticisi hariç diğer kullanıcılar için hiçbir şekilde erişilemez ve geri döndürülemez biçimde 'drop/truncate/shred' komutlarıyla güvenli silinir.",
  "Fiziksel ortamda tutulan kağıt evrak ve dosyalar, kağıt imha (kırpma/shredder) makineleri kullanılarak DIN 66399 standardında okunamaz şeritler haline getirilir.",
  "Optik ve Manyetik Medyalarda (CD/DVD/Manyetik Bant/HDD) yer alan veriler eritilerek, kırılarak ya da fiziksel imha (degausser) cihazıyla manyetik alanı sıfırlanarak yok edilir.",
  "Kişisel verilerin anonim hale getirilmesi; veri maskeleme, genelleştirme, gürültü ekleme veya K-Anonimlik yöntemleriyle bir gerçek kişiyle asla ilişkilendirilemeyecek hale dönüştürülmesidir."
];

export const SAKLAMA_SURELERI = [
  "Kimlik Kişisel Veri – Hukuki ilişkinin sona ermesinden itibaren 15 yıl (TTK & TBK)",
  "İletişim Kişisel Veri – Hukuki ilişkinin sona ermesinden itibaren 15 yıl",
  "Lokasyon Kişisel Veri – Hukuki ilişkinin sona ermesinden itibaren 10 yıl",
  "Özlük Kişisel Veri – İş sözleşmesinin sona ermesinden itibaren 15 yıl (İş Kanunu & SGK)",
  "Hukuki İşlem Kişisel Veri – Dava ve icra dosyası kesinleşmesinden itibaren 15 yıl",
  "Müşteri İşlem Kişisel Veri – Hukuki ve ticari ilişkinin bitiminden itibaren 10 yıl (VUK)",
  "Fiziksel Mekan Güvenliği (Kamera Kayıtları) – Kayıt tarihinden itibaren 30 Gün ile 3 Ay",
  "İşlem Güvenliği (Log / Trafik Kayıtları) – 5651 Sayılı Kanun gereği 2 yıl",
  "Finans & Muhasebe Verileri – İlgili takvim yılını takip eden 15 yıl (TTK / VUK)",
  "Mesleki Deneyim & CV Verileri – İlgili personelin ayrılmasından itibaren 15 yıl",
  "Pazarlama & Çerez Kayıtları – Onay tarihinden itibaren 2 yıl veya onay geri alınana kadar",
  "Görsel Ve İşitsel Kayıtlar – Hukuki ilişkinin sona ermesinden itibaren 10 yıl",
  "Sağlık Bilgileri (İşyeri Hekimliği) – İSG Kanunu gereği ayrılıştan itibaren 15 yıl",
  "Biyometrik Veri – İş akdinin sonlanmasıyla derhal veya ilk periyodik imha döneminde",
  "Çalışan Adayı CV Bilgileri – Başvuru tarihinden itibaren en fazla 2 Yıl",
  "Kurumsal Hafıza ve Genel Kurul Kararları – Şirketin tüzel kişiliği devam ettiği sürece (Süresiz / 70 yıl)"
];

export const VERI_KAYIT_LISTELERI = {
  donanim: [
    "Sunucu (Server)",
    "Notebook / Dizüstü Bilgisayar",
    "Masaüstü PC",
    "Kurumsal Akıllı Telefon",
    "Tablet Cihazları",
    "Ağ Yazıcıları / Fotokopi",
    "Tarayıcılar (Scanner)",
    "Şifreli USB Bellek",
    "Harici Hard Disk / NAS Depolama",
    "Firewall / UTM Güvenlik Donanımı"
  ],
  yazilim: [
    "Windows Server / Desktop",
    "Linux / Ubuntu / Debian",
    "macOS / iOS / Android",
    "Oracle Database / MS SQL Server / PostgreSQL",
    "ERP / CRM Kurumsal Yazılımları",
    "İK ve Bordro Yönetim Programı",
    "E-Fatura / Muhasebe Sistemi",
    "Bulut Depolama / Office 365 / Google Workspace",
    "Döküman Yönetim Sistemi (DYS)"
  ],
  guvenlik: [
    "Next-Gen Güvenlik Duvarı (Firewall)",
    "Saldırı Tespit ve Önleme Sistemi (IDS/IPS)",
    "Merkezi Antivirüs / EDR Uç Nokta Güvenliği",
    "Periyodik Sızma (Penetrasyon) Testleri",
    "SSL/TLS ve BitLocker Disk Şifreleme",
    "Çift Faktörlü Kimlik Doğrulama (2FA/MFA)",
    "SIEM Log Yönetimi ve Zaman Damgası",
    "DLP (Veri Sızıntısı Önleme) Yazılımı"
  ],
  elektronikOlmayan: [
    "Ziyaretçi Giriş-Çıkış Defteri",
    "Islak İmzalı Sözleşmeler ve Protokoller",
    "Çalışan Özlük Dosyaları (Kilitli Dolap)",
    "Muhasebe ve Fatura Arşiv Klasörleri",
    "Gelen / Giden Evrak Kayıt Defterleri",
    "Sağlık Raporları ve İSG Dosyaları",
    "Vekaletname ve İmza Sirküleri Arşivi"
  ]
};

export const POZISYON_HAVUZU: Position[] = [
  { unvan: "Genel Müdür / CEO", seviye: 1 },
  { unvan: "Genel Müdür Yardımcısı", seviye: 2 },
  { unvan: "Direktör", seviye: 2 },
  { unvan: "Satış & Pazarlama Müdürü", seviye: 3 },
  { unvan: "İnsan Kaynakları Müdürü", seviye: 3 },
  { unvan: "Teknik / IT Müdürü", seviye: 3 },
  { unvan: "Finans ve Muhasebe Müdürü", seviye: 3 },
  { unvan: "Hukuk Müşaviri / Uyum Yöneticisi", seviye: 3 },
  { unvan: "Operasyon / Üretim Müdürü", seviye: 3 },
  { unvan: "Yönetici / Takım Lideri", seviye: 4 },
  { unvan: "KVK Sorumlusu / DPO", seviye: 4 },
  { unvan: "Bilgi Güvenliği Uzmanı", seviye: 4 },
  { unvan: "İK & İdari İşler Uzmanı", seviye: 5 },
  { unvan: "Sistem ve Ağ Uzmanı", seviye: 5 },
  { unvan: "Muhasebe Uzmanı", seviye: 5 },
  { unvan: "Uzman Yardımcısı", seviye: 5 },
  { unvan: "Operasyon / Ofis Personeli", seviye: 6 }
];

export const SABIT_BIRIMLER: UnitDefinition[] = [
  { key: 'yetkiGenelMudur', unvan: 'Genel Müdür', birim: 'Genel Müdürlük' },
  { key: 'yetkiIKMudur', unvan: 'İnsan Kaynakları Müdürü', birim: 'İnsan Kaynakları' },
  { key: 'yetkiTeknik', unvan: 'Teknik / IT Müdürü', birim: 'Bilgi İşlem ve IT' },
  { key: 'yetkiFinans', unvan: 'Finans ve Muhasebe Müdürü', birim: 'Mali İşler' },
  { key: 'yetkiHukuk', unvan: 'Hukuk Müşaviri', birim: 'Hukuk ve Uyum' }
];

export const BIRIM_TASK_LIST: Record<string, string[]> = {
  yetkiGenelMudur: [
    "Mevzuata uygunluk genel denetimi",
    "İmha kararları ve periyodik imha onaylarının verilmesi",
    "Üst düzey kurumsal KVK taahhütlerinin imzalanması",
    "Bütçe ve güvenlik yatırımlarının onaylanması"
  ],
  yetkiIKMudur: [
    "Özlük dosyalarının fiziki ve dijital güvenliği",
    "Personel gizlilik ve bilgi güvenliği sözleşmelerinin imzalatılması",
    "İK veri saklama ve imha sürelerinin takibi",
    "Çalışanlara yönelik KVKK eğitim ve farkındalık süreçlerinin koordinasyonu"
  ],
  yetkiTeknik: [
    "Ağ, sunucu ve sistem siber güvenliğinin sağlanması",
    "Kayıt ortamlarının şifrelenmesi ve yedekleme mekanizmalarının işletilmesi",
    "5651 Sayılı Kanun gereği sistem loglarının zaman damgasıyla saklanması",
    "Kullanıcı yetki ve erişim matrislerinin teknik olarak uygulanması"
  ],
  yetkiFinans: [
    "Mali belge, fatura ve defterlerin 15 yıl kanuni saklanması",
    "Banka hesap ve IBAN verilerinin güvenliği",
    "Süresi dolan mali kayıtların güvenli imhasının takibi",
    "Finansal denetimlerde veri güvenliği standartlarının sağlanması"
  ],
  yetkiHukuk: [
    "Ticari sözleşmelerdeki KVK maddelerinin ve protokollerin hazırlanması",
    "Kişisel Verileri Koruma Kurulu (KVKK) ile resmi yazışmaların yürütülmesi",
    "İlgili kişi başvuru süreçlerinin hukuki değerlendirmesi ve yanıtlanması",
    "Mevzuat değişikliklerinin takip edilerek politikalara entegre edilmesi"
  ]
};

export const DEFAULT_RACI_TASKS = [
  "Kişisel Veri İşleme Envanterinin Hazırlanması ve Güncellenmesi",
  "Aydınlatma ve Açık Rıza Metinlerinin Hazırlanması",
  "VERBİS Bildirimlerinin ve Güncellemelerinin Yapılması",
  "Veri Güvenliği ve İhlal Olaylarının Yönetimi",
  "Kişisel Veri Saklama ve İmha Süreçlerinin Yürütülmesi",
  "İlgili Kişi (Veri Sahibi) Başvurularının Yanıtlanması",
  "Çalışan KVK Farkındalık Eğitimlerinin Düzenlenmesi",
  "Tedarikçi ve Üçüncü Taraf Gizlilik Sözleşmelerinin Denetimi"
];

export const STEPS: StepConfig[] = [
  // Bölüm 1: Firma ve Genel Bilgiler (1-9)
  { id: 1, label: 'Şirket Unvanı', key: 'unvan', category: 'Bölüm 1: Firma ve Genel Bilgiler', categorySectionNumber: 1, description: 'Kurumunuzun tam yasal ticari unvanı' },
  { id: 2, label: 'Şirket Adresi', key: 'adres', category: 'Bölüm 1: Firma ve Genel Bilgiler', categorySectionNumber: 1, description: 'Genel merkez / faaliyet adresi' },
  { id: 3, label: 'Vergi Kimlik Numarası (VKN)', key: 'vergiNo', category: 'Bölüm 1: Firma ve Genel Bilgiler', categorySectionNumber: 1, description: '10 haneli vergi kimlik numarası' },
  { id: 4, label: 'Vergi Dairesi', key: 'vergiDairesi', category: 'Bölüm 1: Firma ve Genel Bilgiler', categorySectionNumber: 1, description: 'Bağlı olunan vergi dairesi müdürlüğü' },
  { id: 5, label: 'MERSİS / Ticaret Sicil No', key: 'mersisNo', category: 'Bölüm 1: Firma ve Genel Bilgiler', categorySectionNumber: 1, description: 'MERSİS numarası veya ticaret sicil numarası' },
  { id: 6, label: 'Kurumsal Telefon & Santral', key: 'telefon', category: 'Bölüm 1: Firma ve Genel Bilgiler', categorySectionNumber: 1, description: 'Şirket telefon numarası ve dahili santral' },
  { id: 7, label: 'Kurumsal E-Posta & KEP Adresi', key: 'eposta', category: 'Bölüm 1: Firma ve Genel Bilgiler', categorySectionNumber: 1, description: 'Resmi iletişim e-posta ve KEP adresi' },
  { id: 8, label: 'Faaliyet Konusu ve Sektör', key: 'faaliyet', category: 'Bölüm 1: Firma ve Genel Bilgiler', categorySectionNumber: 1, description: 'Ana ticari faaliyet ve sektör alanı' },
  { id: 9, label: 'Departmanlar ve Birimler (Tür Seçimi)', key: 'departmanlar', customType: 'multiSelect', list: DEPARTMAN_TUR_LISTESI, category: 'Bölüm 1: Firma ve Genel Bilgiler', categorySectionNumber: 1, description: 'Kurumunuz bünyesinde faaliyet gösteren departman türlerini seçin veya ekleyin' },
  
  // Bölüm 2: Organizasyon Şeması ve KVK Komitesi (10-14)
  { id: 10, label: 'Organizasyon Şeması (Şemsiye Modeli Pozisyon Seçimi)', key: 'selectedPositions', customType: 'orgSelection', category: 'Bölüm 2: Organizasyon Şeması ve KVK Komitesi', categorySectionNumber: 2, description: 'Kademeli unvan havuzundan seçim yapın' },
  { id: 11, label: 'Komite Oluşturma (Başkan ve Üye Seçimi)', key: 'komite', customType: 'committeeSelection', category: 'Bölüm 2: Organizasyon Şeması ve KVK Komitesi', categorySectionNumber: 2, description: 'Kişisel Verileri Koruma Komitesi görevlendirmesi' },
  { id: 12, label: 'İmza Yetkilisi / Şirket Temsilcisi', key: 'yetkili', category: 'Bölüm 2: Organizasyon Şeması ve KVK Komitesi', categorySectionNumber: 2, description: 'İmza yetkilisi veya şirket temsilcisi' },
  { id: 13, label: 'Veri Sorumlusu Unvanı', key: 'veriSorumlusu', category: 'Bölüm 2: Organizasyon Şeması ve KVK Komitesi', categorySectionNumber: 2, description: 'Tüzel kişilik unvanı veya veri sorumlusu' },
  { id: 14, label: 'İrtibat Kişisi (VERBİS Görevlisi)', key: 'irtibat', category: 'Bölüm 2: Organizasyon Şeması ve KVK Komitesi', categorySectionNumber: 2, description: 'VERBİS ve resmi irtibat görevlisi' },
  
  // Bölüm 3: Birim Sorumlulukları ve Görev Dağılımı (15-19)
  { id: 15, label: 'Genel Müdürlük / Üst Yönetim Görevleri', key: 'yetkiGenelMudur', customType: 'taskSelection', category: 'Bölüm 3: Birim Sorumlulukları ve Görev Dağılımı', categorySectionNumber: 3, description: 'Üst yönetim görev ve sorumlulukları' },
  { id: 16, label: 'İnsan Kaynakları Müdürü Görevleri', key: 'yetkiIKMudur', customType: 'taskSelection', category: 'Bölüm 3: Birim Sorumlulukları ve Görev Dağılımı', categorySectionNumber: 3, description: 'İK ve personel veri yönetimi görevleri' },
  { id: 17, label: 'Teknik / IT Müdürü Görevleri', key: 'yetkiTeknik', customType: 'taskSelection', category: 'Bölüm 3: Birim Sorumlulukları ve Görev Dağılımı', categorySectionNumber: 3, description: 'Bilgi güvenliği ve sistem görevleri' },
  { id: 18, label: 'Finans ve Muhasebe Müdürü Görevleri', key: 'yetkiFinans', customType: 'taskSelection', category: 'Bölüm 3: Birim Sorumlulukları ve Görev Dağılımı', categorySectionNumber: 3, description: 'Mali mevzuat ve veri saklama görevleri' },
  { id: 19, label: 'Hukuk Müşaviri / Uyum Yöneticisi Görevleri', key: 'yetkiHukuk', customType: 'taskSelection', category: 'Bölüm 3: Birim Sorumlulukları ve Görev Dağılımı', categorySectionNumber: 3, description: 'Sözleşme ve uyum sorumlulukları' },
  
  // Bölüm 4: Veri Kayıt Ortamları (20-24)
  { id: 20, label: 'Elektronik Veri Kayıt Ortamı - Donanım', key: 'donanim', customType: 'multiSelect', list: VERI_KAYIT_LISTELERI.donanim, category: 'Bölüm 4: Veri Kayıt Ortamları', categorySectionNumber: 4, description: 'Kullanılan donanım ve sunucu araçları' },
  { id: 21, label: 'Elektronik Veri Kayıt Ortamı - Yazılım & Veritabanı', key: 'yazilim', customType: 'multiSelect', list: VERI_KAYIT_LISTELERI.yazilim, category: 'Bölüm 4: Veri Kayıt Ortamları', categorySectionNumber: 4, description: 'İşletim sistemleri, ERP ve veri tabanları' },
  { id: 22, label: 'Elektronik Veri Kayıt Ortamı - Güvenlik Altyapısı', key: 'guvenlik', customType: 'multiSelect', list: VERI_KAYIT_LISTELERI.guvenlik, category: 'Bölüm 4: Veri Kayıt Ortamları', categorySectionNumber: 4, description: 'Firewall, IDS/IPS, SIEM ve EDR altyapısı' },
  { id: 23, label: 'Elektronik Olmayan (Fiziksel) Veri Kayıt Ortamı', key: 'elektronikOlmayan', customType: 'multiSelect', list: VERI_KAYIT_LISTELERI.elektronikOlmayan, category: 'Bölüm 4: Veri Kayıt Ortamları', categorySectionNumber: 4, description: 'Fiziksel klasörler, defterler ve arşiv dolapları' },
  { id: 24, label: 'Bulut Depolama ve Uzak Sunucu Sistemleri', key: 'bulutSistemleri', customType: 'multiSelect', list: BULUT_SISTEMLERI, category: 'Bölüm 4: Veri Kayıt Ortamları', categorySectionNumber: 4, description: 'Bulut ve harici barındırma sistemleri' },
  
  // Bölüm 5: Veri Güvenliği ve Alınan Tedbirler (25-27)
  { id: 25, label: 'Veri Güvenliği – İdari Tedbirler', key: 'idariTedbirler', customType: 'multiSelect', list: IDARI_TEDBIRLER_LISTESI, category: 'Bölüm 5: Veri Güvenliği ve Alınan Tedbirler', categorySectionNumber: 5, description: 'Politikalar, taahhütnameler ve eğitimler' },
  { id: 26, label: 'Veri Güvenliği – Teknik Tedbirler', key: 'teknikTedbirler', customType: 'multiSelect', list: TEKNIK_TEDBIRLER_LISTESI, category: 'Bölüm 5: Veri Güvenliği ve Alınan Tedbirler', categorySectionNumber: 5, description: 'Ağ güvenliği, şifreleme ve sızma testleri' },
  { id: 27, label: 'Genel Veri Güvenliği Önlemleri', key: 'veriGuvenligi', customType: 'multiSelect', list: VERI_GUVENLIGI_LISTESI, category: 'Bölüm 5: Veri Güvenliği ve Alınan Tedbirler', categorySectionNumber: 5, description: 'Kurumsal veri güvenliği önlemleri' },
  
  // Bölüm 6: Kişisel Veri Kategorileri ve İşleme Amaçları (28-33)
  { id: 28, label: 'Kişisel Veri Kategorileri (Genel)', key: 'kisiselVeriKategorileri', customType: 'multiSelect', list: KISISEL_VERI_KATEGORILERI, category: 'Bölüm 6: Kişisel Veri Kategorileri ve İşleme Amaçları', categorySectionNumber: 6, description: 'İşlenen genel kişisel veri grupları' },
  { id: 29, label: 'Özel Nitelikli Kişisel Veri Kategorileri', key: 'ozelNitelikliVeriler', customType: 'multiSelect', list: OZEL_NITELIKLI_VERILER, category: 'Bölüm 6: Kişisel Veri Kategorileri ve İşleme Amaçları', categorySectionNumber: 6, description: 'Sağlık, adli sicil, biyometrik veriler' },
  { id: 30, label: 'Kişisel Veri Elde Etme Yöntemleri', key: 'veriToplamaYontemleri', customType: 'multiSelect', list: VERI_TOPLAMA_YONTEMLERI, category: 'Bölüm 6: Kişisel Veri Kategorileri ve İşleme Amaçları', categorySectionNumber: 6, description: 'Verilerin kuruma intikal kanalları' },
  { id: 31, label: 'Saklamayı Gerektiren İşleme Amaçları', key: 'saklamaAmaclari', customType: 'multiSelect', list: SAKLAMA_AMACLARI, category: 'Bölüm 6: Kişisel Veri Kategorileri ve İşleme Amaçları', categorySectionNumber: 6, description: 'Veri işlemenin meşru amaçları' },
  { id: 32, label: 'Saklamayı Gerektiren Hukuki Sebepler', key: 'hukukiSebepler', customType: 'multiSelect', list: HUKUKI_SEBEPLER, category: 'Bölüm 6: Kişisel Veri Kategorileri ve İşleme Amaçları', categorySectionNumber: 6, description: '6698 s.k. Md. 5 ve 6 hukuki gerekçeleri' },
  { id: 33, label: 'Veri Aktarılan Alıcı Grupları', key: 'aliciGruplari', customType: 'multiSelect', list: ALICI_GRUPLARI, category: 'Bölüm 6: Kişisel Veri Kategorileri ve İşleme Amaçları', categorySectionNumber: 6, description: 'Verilerin paylaşıldığı kurum ve taraflar' },
  
  // Bölüm 7: İmha, Süreler ve Periyodik Denetim (34-37)
  { id: 34, label: 'İmhayı Gerektiren Sebepler', key: 'imhaSebep', customType: 'multiSelect', list: IMHA_SEBEPLER, category: 'Bölüm 7: İmha, Süreler ve Periyodik Denetim', categorySectionNumber: 7, description: 'Veri silme ve yok etme gerekçeleri' },
  { id: 35, label: 'İmha Yöntemleri (Silme, Yok Etme, Anonimleştirme)', key: 'imhaYontem', customType: 'multiSelect', list: IMHA_YONTEMLER, category: 'Bölüm 7: İmha, Süreler ve Periyodik Denetim', categorySectionNumber: 7, description: 'Fiziksel ve elektronik imha teknikleri' },
  { id: 36, label: 'Saklama ve İmha Süreleri', key: 'saklamaSureleri', customType: 'multiSelect', list: SAKLAMA_SURELERI, category: 'Bölüm 7: İmha, Süreler ve Periyodik Denetim', categorySectionNumber: 7, description: 'Yasal saklama zaman sınırları' },
  { id: 37, label: 'Periyodik İmha Süresi ve Güncelleme Takvimi', key: 'periyodikImhaSuresi', customType: 'multiSelect', list: PERIYODIK_IMHA_SURELERI, category: 'Bölüm 7: İmha, Süreler ve Periyodik Denetim', categorySectionNumber: 7, description: '6 aylık periyodik imha ve politika revizyon döngüsü' }
];

// Sample Database Records / Industry Templates
export const SAMPLE_DATABASE_RECORDS: InventoryRecord[] = [
  {
    id: 'rec_tekno_01',
    title: 'Nova Bilişim & Yazılım A.Ş.',
    projectCode: 'PRJ-NOVA-2026',
    companyName: 'Nova Bilişim ve Yazılım Teknolojileri Anonim Şirketi',
    ownerUsername: 'ahmet',
    version: 'v1.2',
    status: 'active',
    createdAt: '2026-08-15T10:30:00.000Z',
    updatedAt: '2026-08-25T16:45:00.000Z',
    unvan: 'Nova Bilişim ve Yazılım Teknolojileri Anonim Şirketi',
    adres: 'Büyükdere Cad. Maslak No:142 Plaza Kat:8 Sarıyer / İstanbul',
    vergiNo: '6320984712',
    vergiDairesi: 'Maslak Vergi Dairesi',
    mersisNo: '0632098471200001',
    telefon: '0212 345 67 89',
    eposta: 'kvkk@novabilisim.com.tr',
    faaliyet: 'Bulut Bilişim, SaaS Yazılım Geliştirme, Siber Güvenlik Danışmanlığı',
    departmanlar: 'Yazılım Geliştirme, Ürün Yönetimi, Bilgi Güvenliği, Satış & Pazarlama, İnsan Kaynakları, Hukuk, Finans',
    selectedPositions: [
      'Genel Müdür / CEO',
      'Direktör',
      'Teknik / IT Müdürü',
      'İnsan Kaynakları Müdürü',
      'Finans ve Muhasebe Müdürü',
      'Hukuk Müşaviri / Uyum Yöneticisi',
      'KVK Sorumlusu / DPO',
      'Bilgi Güvenliği Uzmanı',
      'Sistem ve Ağ Uzmanı',
      'Operasyon / Ofis Personeli'
    ],
    komiteBaskani: 'Genel Müdür / CEO',
    komiteUyeleri: [
      'Hukuk Müşaviri / Uyum Yöneticisi',
      'Teknik / IT Müdürü',
      'İnsan Kaynakları Müdürü',
      'KVK Sorumlusu / DPO'
    ],
    yetkili: 'Ahmet Kemal Yılmaz (Yönetim Kurulu Başkanı & CEO)',
    veriSorumlusu: 'Nova Bilişim ve Yazılım Teknolojileri A.Ş.',
    irtibat: 'Av. Elif Sönmez (Hukuk & Uyum Müdürü)',
    birimSecilenGorevler: { ...BIRIM_TASK_LIST },
    donanim: 'Sunucu (Server); Notebook / Dizüstü Bilgisayar; Masaüstü PC; Kurumsal Akıllı Telefon; Ağ Yazıcıları / Fotokopi; Firewall / UTM Güvenlik Donanımı; Harici Hard Disk / NAS Depolama',
    yazilim: 'Windows Server / Desktop; Linux / Ubuntu / Debian; Oracle Database / MS SQL Server / PostgreSQL; Bulut Depolama / Office 365 / Google Workspace; ERP / CRM Kurumsal Yazılımları; Döküman Yönetim Sistemi (DYS)',
    guvenlik: 'Next-Gen Güvenlik Duvarı (Firewall); Saldırı Tespit ve Önleme Sistemi (IDS/IPS); Merkezi Antivirüs / EDR Uç Nokta Güvenliği; Periyodik Sızma (Penetrasyon) Testleri; SSL/TLS ve BitLocker Disk Şifreleme; Çift Faktörlü Kimlik Doğrulama (2FA/MFA); SIEM Log Yönetimi ve Zaman Damgası; DLP (Veri Sızıntısı Önleme) Yazılımı',
    elektronikOlmayan: 'Ziyaretçi Giriş-Çıkış Defteri; Islak İmzalı Sözleşmeler ve Protokoller; Çalışan Özlük Dosyaları (Kilitli Dolap); Muhasebe ve Fatura Arşiv Klasörleri',
    bulutSistemleri: 'Microsoft 365 / OneDrive / Teams Bulut Hizmetleri; Amazon Web Services (AWS) S3 / EC2 Bulut Altyapısı; Uzak Veri Yedekleme / Acronis / Veeam Cloud',
    idariTedbirler: IDARI_TEDBIRLER_LISTESI.slice(0, 8).join('; '),
    teknikTedbirler: TEKNIK_TEDBIRLER_LISTESI.slice(0, 8).join('; '),
    veriGuvenligi: VERI_GUVENLIGI_LISTESI.slice(1, 15).join('; '),
    kisiselVeriKategorileri: KISISEL_VERI_KATEGORILERI.slice(0, 12).join('; '),
    ozelNitelikliVeriler: OZEL_NITELIKLI_VERILER.slice(0, 4).join('; '),
    veriToplamaYontemleri: VERI_TOPLAMA_YONTEMLERI.slice(0, 6).join('; '),
    saklamaAmaclari: SAKLAMA_AMACLARI.slice(0, 8).join('; '),
    hukukiSebepler: HUKUKI_SEBEPLER.slice(0, 6).join('; '),
    aliciGruplari: ALICI_GRUPLARI.slice(0, 6).join('; '),
    imhaSebep: IMHA_SEBEPLER.join('; '),
    imhaYontem: IMHA_YONTEMLER.join('; '),
    saklamaSureleri: SAKLAMA_SURELERI.slice(0, 12).join('; '),
    periyodikImhaSuresi: '6 Ayda Bir (Her Yıl Haziran Sonu ve Aralık Sonu İtibarıyla - Standart)',
    raciTasks: [...DEFAULT_RACI_TASKS],
    raciValues: {
      '0_KVK Sorumlusu / DPO': 'R',
      '0_Hukuk Müşaviri / Uyum Yöneticisi': 'A',
      '0_Genel Müdür / CEO': 'I',
      '1_Hukuk Müşaviri / Uyum Yöneticisi': 'R',
      '1_Genel Müdür / CEO': 'A',
      '2_KVK Sorumlusu / DPO': 'R',
      '2_Genel Müdür / CEO': 'A',
      '3_Bilgi Güvenliği Uzmanı': 'R',
      '3_Teknik / IT Müdürü': 'A',
      '4_KVK Sorumlusu / DPO': 'R',
      '4_Genel Müdür / CEO': 'A'
    },
    infoNote: 'Nova Bilişim ISO 27001 ve ISO 27701 standartlarına uyumlu olarak yapılandırılmıştır.'
  },
  {
    id: 'rec_atlas_02',
    title: 'Atlas İmalat ve Sanayi Ltd. Şti.',
    projectCode: 'PRJ-ATL-2026',
    companyName: 'Atlas İmalat ve Sanayi Ticaret Limited Şirketi',
    ownerUsername: 'mehmet',
    version: 'v1.0',
    status: 'active',
    createdAt: '2026-08-10T09:15:00.000Z',
    updatedAt: '2026-08-20T14:30:00.000Z',
    unvan: 'Atlas İmalat ve Sanayi Ticaret Limited Şirketi',
    adres: 'Organize Sanayi Bölgesi 4. Cadde No:18 Nilüfer / Bursa',
    vergiNo: '1240987654',
    vergiDairesi: 'Nilüfer Vergi Dairesi',
    mersisNo: '0124098765400018',
    telefon: '0224 441 55 66',
    eposta: 'info@atlasimalat.com.tr',
    faaliyet: 'Endüstriyel Makine İmalatı, Metal İşleme, Otomotiv Yan Sanayi ve Talaşlı İmalat',
    departmanlar: 'Fabrika Müdürlüğü, Üretim, Kalite Kontrol, Depo & Lojistik, Satın Alma, Muhasebe, İK',
    selectedPositions: [
      'Genel Müdür / CEO',
      'Direktör',
      'Teknik / IT Müdürü',
      'İnsan Kaynakları Müdürü',
      'Finans ve Muhasebe Müdürü',
      'KVK Sorumlusu / DPO',
      'Operasyon / Ofis Personeli'
    ],
    komiteBaskani: 'Genel Müdür / CEO',
    komiteUyeleri: [
      'Direktör',
      'İnsan Kaynakları Müdürü',
      'KVK Sorumlusu / DPO'
    ],
    yetkili: 'Mehmet Kaya (Genel Müdür / Şirket Müdürü)',
    veriSorumlusu: 'Atlas İmalat ve Sanayi Ticaret Ltd. Şti.',
    irtibat: 'Kemal Demir (KVK Sorumlusu / İK Uzmanı)',
    birimSecilenGorevler: { ...BIRIM_TASK_LIST },
    donanim: 'Sunucu (Server); Masaüstü PC; Notebook / Dizüstü Bilgisayar; CCTV Kamera Kayıt Cihazı (NVR/DVR); Barkod Okuyucu / El Terminalleri',
    yazilim: 'Windows Server / Desktop; Logo ERP / Tiger; MS SQL Server; AutoCAD / SolidWorks Lisansları; Bulut Yedekleme',
    guvenlik: 'Firewall / UTM Güvenlik Donanımı; Antivirüs Uç Nokta Koruması; Fabrika Güvenlik Kameraları ve Kartlı Turnike Sistemi; Günlük Veri Yedekleme',
    elektronikOlmayan: 'Çalışan Özlük Dosyaları (Kilitli Arşiv Odası); İSG ve Sağlık Raporları; Ziyaretçi Defteri; Sevk İrsaliyeleri ve Faturalar',
    bulutSistemleri: 'Uzak Veri Yedekleme / Cloud Backup',
    idariTedbirler: IDARI_TEDBIRLER_LISTESI.slice(0, 6).join('; '),
    teknikTedbirler: TEKNIK_TEDBIRLER_LISTESI.slice(0, 6).join('; '),
    veriGuvenligi: VERI_GUVENLIGI_LISTESI.slice(0, 9).join('; '),
    kisiselVeriKategorileri: KISISEL_VERI_KATEGORILERI.slice(0, 8).join('; '),
    ozelNitelikliVeriler: OZEL_NITELIKLI_VERILER.slice(0, 2).join('; '),
    veriToplamaYontemleri: VERI_TOPLAMA_YONTEMLERI.slice(0, 4).join('; '),
    saklamaAmaclari: SAKLAMA_AMACLARI.slice(0, 6).join('; '),
    hukukiSebepler: HUKUKI_SEBEPLER.slice(0, 5).join('; '),
    aliciGruplari: ALICI_GRUPLARI.slice(0, 5).join('; '),
    imhaSebep: IMHA_SEBEPLER.join('; '),
    imhaYontem: IMHA_YONTEMLER.join('; '),
    saklamaSureleri: SAKLAMA_SURELERI.slice(0, 8).join('; '),
    periyodikImhaSuresi: '6 Ayda Bir (Her Yıl Haziran Sonu ve Aralık Sonu İtibarıyla - Standart)',
    raciTasks: [...DEFAULT_RACI_TASKS],
    raciValues: {
      '0_KVK Sorumlusu / DPO': 'R',
      '0_Genel Müdür / CEO': 'A',
      '1_İnsan Kaynakları Müdürü': 'R'
    },
    infoNote: 'Atlas İmalat fabrikasında kamera kayıtları ve ziyaretçi kayıtları 30 gün süreyle saklanmaktadır.'
  },
  {
    id: 'rec_avrasya_03',
    title: 'Avrasya Lojistik ve Taşımacılık A.Ş.',
    projectCode: 'PRJ-AVR-2026',
    companyName: 'Avrasya Lojistik ve Taşımacılık Hizmetleri A.Ş.',
    ownerUsername: 'zeynep',
    version: 'v1.0',
    status: 'review',
    createdAt: '2026-08-18T14:15:00.000Z',
    updatedAt: '2026-08-22T11:20:00.000Z',
    unvan: 'Avrasya Lojistik ve Taşımacılık Hizmetleri A.Ş.',
    adres: 'Atatürk Bulvarı No:54 Kat:3 Çankaya / Ankara',
    vergiNo: '1187429033',
    vergiDairesi: 'Çankaya Vergi Dairesi',
    mersisNo: '0118742903300015',
    telefon: '0312 456 78 90',
    eposta: 'kvk@avrasyalojistik.com.tr',
    faaliyet: 'Uluslararası ve Yurtiçi Karayolu Lojistiği, Depolama, Gümrükleme ve Tedarik Zinciri Yönetimi',
    departmanlar: 'Filo Yönetimi, Depo & Antrepo, Operasyon, İnsan Kaynakları, Muhasebe, Bilgi İşlem',
    selectedPositions: [
      'Genel Müdür / CEO',
      'Direktör',
      'Teknik / IT Müdürü',
      'İnsan Kaynakları Müdürü',
      'Finans ve Muhasebe Müdürü',
      'Hukuk Müşaviri / Uyum Yöneticisi',
      'KVK Sorumlusu / DPO',
      'Operasyon / Ofis Personeli'
    ],
    komiteBaskani: 'Genel Müdür / CEO',
    komiteUyeleri: [
      'Direktör',
      'Hukuk Müşaviri / Uyum Yöneticisi',
      'Teknik / IT Müdürü'
    ],
    yetkili: 'Zeynep Aktaş (Genel Müdür Yardımcısı & İcra Kurulu Üyesi)',
    veriSorumlusu: 'Avrasya Lojistik ve Taşımacılık Hizmetleri A.Ş.',
    irtibat: 'Canan Özdemir (KVK Sorumlusu)',
    birimSecilenGorevler: { ...BIRIM_TASK_LIST },
    donanim: 'Sunucu (Server); Masaüstü PC; Tablet Cihazları; Araç Takip GPS Cihazları; Ağ Yazıcıları / Fotokopi; Harici Hard Disk / NAS Depolama',
    yazilim: 'Windows Server / Desktop; Oracle Database / MS SQL Server / PostgreSQL; ERP / CRM Kurumsal Yazılımları; Filo Yönetim Yazılımı; Döküman Yönetim Sistemi (DYS)',
    guvenlik: 'Next-Gen Güvenlik Duvarı (Firewall); Merkezi Antivirüs / EDR Uç Nokta Güvenliği; SSL/TLS ve BitLocker Disk Şifreleme; Çift Faktörlü Kimlik Doğrulama (2FA/MFA)',
    elektronikOlmayan: 'Ziyaretçi Giriş-Çıkış Defteri; Islak İmzalı Taşıma Sözleşmeleri ve CMR Belgeleri; Çalışan ve Şoför Özlük Dosyaları (Kilitli Dolap); Muhasebe ve Fatura Arşiv Klasörleri',
    bulutSistemleri: 'Yerli Bulut / Özel Veri Merkezi Barındırma; Uzak Veri Yedekleme / Acronis / Veeam Cloud',
    idariTedbirler: IDARI_TEDBIRLER_LISTESI.slice(0, 7).join('; '),
    teknikTedbirler: TEKNIK_TEDBIRLER_LISTESI.slice(0, 7).join('; '),
    veriGuvenligi: VERI_GUVENLIGI_LISTESI.slice(0, 10).join('; '),
    kisiselVeriKategorileri: KISISEL_VERI_KATEGORILERI.join('; '),
    ozelNitelikliVeriler: OZEL_NITELIKLI_VERILER.join('; '),
    veriToplamaYontemleri: VERI_TOPLAMA_YONTEMLERI.join('; '),
    saklamaAmaclari: SAKLAMA_AMACLARI.join('; '),
    hukukiSebepler: HUKUKI_SEBEPLER.join('; '),
    aliciGruplari: ALICI_GRUPLARI.join('; '),
    imhaSebep: IMHA_SEBEPLER.join('; '),
    imhaYontem: IMHA_YONTEMLER.join('; '),
    saklamaSureleri: SAKLAMA_SURELERI.join('; '),
    periyodikImhaSuresi: '6 Ayda Bir (Her Yıl Haziran Sonu ve Aralık Sonu İtibarıyla - Standart)',
    raciTasks: [...DEFAULT_RACI_TASKS],
    raciValues: {
      '0_KVK Sorumlusu / DPO': 'R',
      '0_Genel Müdür / CEO': 'A',
      '1_Hukuk Müşaviri / Uyum Yöneticisi': 'R'
    },
    infoNote: 'Avrasya Lojistik bünyesinde araç takip ve konum verileri yasal süre boyunca güvenli sunucularda tutulmaktadır.'
  }
];
