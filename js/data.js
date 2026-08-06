/*
  BU DOSYA İÇERİĞİ SEN DÜZENLEYECEKSİN.
  Kod bilmesen de buradaki listelere yeni satır ekleyip çıkararak
  galeriyi, quiz sorularını ve mektupları güncelleyebilirsin.
  Her girdinin sonundaki virgülü unutma, dosyanın sonunda } veya ] kapatma
  işaretlerine dokunma.
*/

/* ============================================================
   1) GALERİ — "Aylin'in Komik Anları"
   type: "image" veya "video"
   src : dosya yolu (assets/gallery/ klasörüne gerçek foto/video atıp
         buraya "../assets/gallery/dosyaadi.jpg" şeklinde yaz — başındaki
         "../" kısmını silme, galeri sayfası bir alt klasörde olduğu için
         gerekli. Şu an placeholder görseller kullanılıyor.)
   caption: görselin altında/tıklanınca görünecek kısa açıklama (opsiyonel, boş bırakılabilir)
   En fazla 100 öğe eklenebilir, alttaki satırları çoğaltman yeterli.
============================================================ */
const GALLERY_ITEMS = [
  { type: "image", src: "../assets/gallery/01.svg", caption: "" },
  { type: "image", src: "../assets/gallery/02.svg", caption: "" },
  { type: "image", src: "../assets/gallery/03.svg", caption: "" },
  { type: "image", src: "../assets/gallery/04.svg", caption: "" },
  { type: "image", src: "../assets/gallery/05.svg", caption: "" },
  { type: "image", src: "../assets/gallery/06.svg", caption: "" },
  { type: "image", src: "../assets/gallery/07.svg", caption: "" },
  { type: "image", src: "../assets/gallery/08.svg", caption: "" },
  { type: "image", src: "../assets/gallery/09.svg", caption: "" },
  { type: "image", src: "../assets/gallery/10.svg", caption: "" },
  { type: "image", src: "../assets/gallery/11.svg", caption: "" },
  { type: "image", src: "../assets/gallery/12.svg", caption: "" },
  { type: "image", src: "../assets/gallery/13.svg", caption: "" },
  { type: "image", src: "../assets/gallery/14.svg", caption: "" },
];

/* ============================================================
   2) QUIZ — "Aylin'i Ne Kadar İyi Tanıyorsun?"
   options: şıklar dizisi (sayısı soruya göre değişebilir)
   correct: doğru cevabın options içindeki sırası (0'dan başlar)
   En fazla 50 soru eklenebilir.
============================================================ */
const QUIZ_QUESTIONS = [
  {
    question: "Aylin'in en sevdiği renk hangisi?",
    options: ["Pembe", "Mor", "Ametist moru"],
    correct: 1,
  },
  {
    question: "Aylin'in en sevdiği çiçek hangisi?",
    options: ["Lavanta", "Menekşe", "Mor salkım"],
    correct: 2,
  },
  {
    question: "Aylin'in en sevdiği yönetmen kim?",
    options: ["Wes Anderson", "Denis Villeneuve", "Tim Burton"],
    correct: 2,
  },
  {
    question: "Aylin'in kişiliğini en iyi anlatan kelime hangisi?",
    options: ["Umursamaz", "Anksiyetik", "Düşünceli"],
    correct: 1,
  },
  {
    question: "Aylin dört elementten hangisi olurdu?",
    options: ["Hava", "Toprak", "Su", "Ateş"],
    correct: 2,
  },
  {
    question: "Aylin'in en sevdiği alkol hangisi?",
    options: ["Bira", "Gin", "Jager"],
    correct: 2,
  },
  {
    question: "Aylin'in en sevdiği aile üyesi kimdir?",
    options: ["Annesi", "Babası", "Kardeşi", "Babaannesi"],
    correct: 3,
  },
  {
    question: "Zombi saldırısında Aylin ne yapardı?",
    options: ["Saklanırdı", "Savaşırdı", "Kafasına sıkardı"],
    correct: 2,
  },
  {
    question: "Anaokulunda Aylin'in yaşadığı olay?",
    options: ["Kafası dolaba sıkıştırıldı", "Yemeğine çöpe atıldı", "Dövüldü"],
    correct: 0,
  },
  {
    question: "Aylin aşağıdaki 7 ölümcül günahtan hangisidir?",
    options: ["Kıskançlık-kibir-öfke", "Tembellik-öfke-kibir", "Tembellik-Oburluk-Öfke"],
    correct: 2,
  },
  {
    question: "Hangisi Aylin'in en büyük korkularından değildir?",
    options: [
      "Terlik giydiğinde toplu taşımada ayağına basılması",
      "Sinemaya geç kalması",
      "Babaannesiyle yalnız kalması",
      "Böcek ısırması",
    ],
    correct: 3,
  },
  {
    question: "Aylin'in babaannesinin adı nedir?",
    options: ["Zinnur", "Zeliha", "Mukaddes"],
    correct: 0,
  },
  {
    question: "Aylin'in tezinin adı nedir?",
    options: [
      "Çizgi romanların internet üzerinden yayınının telif hakkı problemi kapsamında incelenmesi",
      "Çizgi romanların türkçeye uyarlanmasında yapılan telif hakkı problemlerinin incelenmesi",
      "Çizgi romanların korsan yayınlarının telif hakkı kapsamında etik olarak incelenmesi",
    ],
    correct: 0,
  },
  {
    question: "Aylin Berkay ile neden evlendi?",
    options: ["Sarışın olduğu için", "Aşık olduğu için", "Avrupa vatandaşı olduğu için"],
    correct: 2,
  },
  {
    question: "Aylin nerelidir?",
    options: ["Ordu", "Trabzon", "Giresun"],
    correct: 1,
  },
  {
    question: "Aylin'in en sevmediği Buse hangisidir?",
    options: ["Gıcık Buse", "Mutsuz Buse", "Aç Buse", "Huysuz Buse", "Hepsi"],
    correct: 4,
  },
];

/* Sonuç mesajları, puana (yüzde) göre en yüksekten en düşüğe sırayla.
   min: bu yüzdenin ve üzerinin göstereceği mesaj */
const QUIZ_RESULT_TIERS = [
  { min: 90, message: "Resmen Aylin'in ikizi gibisin! Mükemmel skor 💜" },
  { min: 70, message: "Aylin'i gerçekten çok iyi tanıyorsun, tebrikler ✨" },
  { min: 50, message: "Fena değil ama biraz daha sohbet lazım gibi 😄" },
  { min: 0, message: "Aylin'le tanışma vaktin gelmiş, daha çok vakit geçirin! 💌" },
];

/* ============================================================
   3) MEKTUPLAR — "Aylin'e Mektuplar"
   name: zarfın üstünde görünecek isim
   text: mektubun tam metni (satır atlamak için \n kullanabilirsin)
   Şimdilik placeholder isim ve metinler var, gerçekleriyle değiştir.
   Sayı sınırı yok, istediğin kadar ekleyebilirsin.
============================================================ */
const LETTERS = [
  {
    name: "Buse",
    text: "Sevgili Aylin,\n\nBu placeholder bir mektup metni — gerçek mektubunla değiştirilecek.\nAma şunu bilmeni isterim ki bu sitedeki her piksel, seni ne kadar sevdiğimizin küçük bir kanıtı. İyi ki varsın.\n\nSeni seven,\nBuse",
  },
  {
    name: "Berkay",
    text: "Aylin,\n\nBuraya senin için özel bir şeyler yazılacak. Şimdilik placeholder metin duruyor.\nDoğum günün kutlu olsun!\n\nBerkay",
  },
  {
    name: "Arkadaş 3",
    text: "Sevgili Aylin,\n\n[Bu mektup metni daha sonra gerçek içerikle değiştirilecek.]\n\nSeni seven biri",
  },
  {
    name: "Arkadaş 4",
    text: "Aylin'ciğim,\n\n[Placeholder mektup metni. Gerçek anılar ve sözler buraya gelecek.]\n\nİyi ki doğdun!",
  },
  {
    name: "Arkadaş 5",
    text: "Sevgili Aylin,\n\n[Bu alana senin için özel bir mektup yazılacak.]\n\nSevgiyle,",
  },
  {
    name: "Arkadaş 6",
    text: "Aylin,\n\n[Placeholder metin — gerçek mektupla değiştirilecek.]\n\nNice mutlu yıllara!",
  },
  {
    name: "Arkadaş 7",
    text: "Sevgili Aylin,\n\n[Bu mektubun gerçek hali daha sonra eklenecek.]\n\nSeni çok seviyoruz.",
  },
  {
    name: "Arkadaş 8",
    text: "Aylin'ciğim,\n\n[Placeholder — gerçek mektup metniyle değiştirilecek.]\n\nDoğum günün kutlu olsun!",
  },
];

/* ============================================================
   4) MÜZİK — Spotify çalma listesi linki
============================================================ */
const SPOTIFY_PLAYLIST_URL =
  "https://open.spotify.com/playlist/51rDwdq20usr9OW99eAd8C";
