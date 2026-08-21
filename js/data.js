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
         gerekli.)
   caption: görselin altında/tıklanınca görünecek kısa açıklama (opsiyonel, boş bırakılabilir)
   En fazla 100 öğe eklenebilir, alttaki satırları çoğaltman yeterli.
============================================================ */
const GALLERY_ITEMS = [
  { type: "image", src: "../assets/gallery/01.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/02.jpg", caption: "Aylinin en büyük hayali Tost Otomatı" },
  { type: "image", src: "../assets/gallery/03.jpg", caption: "Bir SubarDAĞI" },
  { type: "image", src: "../assets/gallery/04.jpg", caption: "Dünya tarihinin en önemli 3.günü Sigarayı bıraktığımız3.gün" },
  { type: "image", src: "../assets/gallery/05.jpg", caption: "Dünya tarihinin en önemli 77.fotoğrafı Hitchcock sevdiğin gün" },
  { type: "image", src: "../assets/gallery/06.jpg", caption: "Emir Taha ve en büyük hayaranı" },
  { type: "image", src: "../assets/gallery/07.jpg", caption: "En sarhoş olduğumuz gün 09.08.2026" },
  { type: "image", src: "../assets/gallery/08.jpg", caption: "En sevdiği şey TURŞU" },
  { type: "image", src: "../assets/gallery/09.jpg", caption: "Favori Babaanemiz" },
  { type: "image", src: "../assets/gallery/10.jpg", caption: "Hayatımızı kökten değiştiren o gün" },
  { type: "image", src: "../assets/gallery/11.jpg", caption: "İlk Halloween Partimiz" },
  { type: "image", src: "../assets/gallery/12.jpg", caption: "İlk tanıştığımız gün -Hazel" },
  { type: "image", src: "../assets/gallery/13.jpg", caption: "Klasik bir gününmüz" },
  { type: "image", src: "../assets/gallery/14.jpg", caption: "Seni Seviyorum - Berkay" },
  { type: "image", src: "../assets/gallery/15.jpg", caption: "Şefin bir yeri" },
  { type: "image", src: "../assets/gallery/16.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/17.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/18.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/19.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/20.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/21.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/22.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/23.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/24.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/25.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/26.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/27.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/28.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/29.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/30.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/31.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/32.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/33.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/34.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/35.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/36.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/37.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/38.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/39.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/40.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/41.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/42.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/43.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/44.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/45.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/46.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/47.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/48.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/49.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/50.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/51.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/52.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/53.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/54.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/55.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/56.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/57.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/58.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/59.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/60.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/61.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/62.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/63.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/64.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/65.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/66.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/67.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/68.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/69.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/70.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/71.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/72.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/73.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/74.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/75.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/76.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/77.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/78.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/79.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/80.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/81.jpg", caption: "" },
  { type: "image", src: "../assets/gallery/82.jpg", caption: "" },
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
    options: ["Kafası dolaba sıkıştırıldı", "Yemeği çöpe atıldı", "Dövüldü"],
    correct: 1,
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
    options: ["Zinnure", "Zeliha", "Mukaddes"],
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
   image: (opsiyonel) mektubun altında gösterilecek görsel — "../assets/letters/dosyaadi.jpg"
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
    text: "Beraber kutladığımız 5. Yıl hayatımızın çok büyük bir bölümünü beraber kutladık belki en güzel yaşımız değil ama bir çok sıkıntıyı beraber aştığımız bir yaş oldu. Birbirimizden en uzak zaman ayrı kaldığımız sana mektuplar yazıp yokluğunun hüznünü kaleme kağıda döktüğüm bir dönemi aştık yıllarca içimizde büyüyen bir sıkıntıyı aşmanın mutluluğuyla yine avrupanın bir ülkesine giderek listemize bir çentik attık daha güzelini sana yaşatacağıma söz verdiğim musmutlu bir senemiz olsun sen 30'a yaklaşırken barney gibi terk etsem mi diye düşünerek geçireceğimiz 2 yıl daha var seni çok çok seviyorum iyi ki hayatımdasınnnnnnnnnnnnnnn\n\n-Berkay",
  },
  {
    name: "Su",
    text: "Ayluşum,\n\nÇok değil 2-3 sene önce Buse'nin doğum günlerinden doğum günlerine gördüğüm rengarenk ve uzak bir yüzdün. Artık benim hayat dolu içki buddy'm, anksiyete senkronizem, bebek metalim, big tiddy geek ikizim ve fav otistik arkadaşımsın. Zamanın bizi getirdiği noktaya bayılıyorum.\n\n27'nde, 37'nde, 77'nde ve daha nicelerinde umarım hep yanında olurum. Yeni yaşın güzellikler getirsin, MUTLU YILLAR BITCH!!!\n\n-Su",
    image: "../assets/letters/su-monkey.jpg",
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
