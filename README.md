# 🎮 Steam Idler — Saat Kasma Aracı

Steam hesabınızda oyun hilesi olmadan, tamamen güvenli bir şekilde dilediğiniz kadar oyunda aynı anda "saat kasmanızı" sağlayan açık kaynaklı bir araçtır.

Modern arayüzü, kullanım kolaylığı ve Steam mobil uygulaması üzerinden **QR Kod** ile şifresiz/güvenli giriş yapma özelliği ile öne çıkar. Açık kaynak kodlu olduğu için Steam hesabınız tamamen güvendedir.

![Steam Idler Screenshot 1](public/steam-idler-1.png)

![Steam Idler Screenshot 2](public/steam-idler-2.png)

---

## ✨ Özellikler

- **📱 QR Kod ile Şifresiz Giriş:** Hesabınızın kullanıcı adını, şifresini veya Steam Guard kodunu tuşlamanıza gerek kalmaz. Steam mobil uygulamanızı açıp ekrandaki QR kodu okutmanız yeterlidir!
- **💯 %100 Güvenli:** Hiçbir şifreniz veya tokeniniz uzak bir sunucuya gönderilmez. Tüm sistem sizin bilgisayarınızda (yerel) çalışır.
- **🕒 Sınırsız Oyun İdleme:** Seçtiğiniz onlarca veya yüzlerce oyunu aynı anda "Oynuyor" gibi gösterin ve profilinizdeki oyun saatlerini roketleyin.
- **📚 Geçmiş Oturumlar:** Kapatıp açtığınızda daha önceki idle geçmişinizi, ne kadar süre kastığınızı rahatça görebilirsiniz.
- **🌙 Modern Arayüz:** Kullanıcı dostu, animasyonlu, "Dark Mode" odaklı ve yormayan şık bir arayüze sahiptir.

---

## 🛠️ Kurulum (%100 Açık Kaynak)

Bu proje **Node.js** gerektirir. Bilgisayarınızda [Node.js](https://nodejs.org/) kurulu değilse indirip kurunuz (LTS sürümü tavsiye edilir).

### 1. Projeyi İndirin
Terminali (veya Komut İstemini) açın ve projeyi bilgisayarınıza klonlayın:

```cmd
git clone https://github.com/nazimparlak/steam-idler.git
cd steam-idler
```

*(Eğer git kullanmıyorsanız yeşil `Code` butonuna basıp `.zip` olarak indirebilirsiniz)*

### 2. Gerekli Paketleri Yükleyin
Klasörün içinde terminal açtığınıza emin olun ve şu komutu çalıştırarak gerekli bağımlılıkları yükleyin:

```cmd
npm install
```

---

## 🚀 Çalıştırma

Projenin biri arka ucu (backend - hesaba bağlanan kısım) diğeri ön ucu (frontend - gördüğünüz site) olmak üzere iki bacağı var. İkisini birden çalıştırmak için:

### 1. Terminal (Backend) Açın:
Ana dizinde terminale şunu yazın:
```cmd
node server.js
```
*(Arka planda Steam kütüphanesi aktifleşir ve `localhost:3001` portunda dinlemeye başlar.)*

### 2. İkinci Terminali (Frontend) Açın:
Aynı dizinde yeni bir komut satırı penceresi daha açın (Birincisini kapatmayın!) ve şunu yazın:
```cmd
npm run dev
```
*(Vite arayüz projeniz derlenir ve `http://localhost:5173` adresinde açılır).*

Artık tarayıcınızdan **[http://localhost:5173](http://localhost:5173)** adresine gidip Steam Idler aracını kullanabilirsiniz!

---

## 🔒 Güvenlik Uyarıları

Geliştirici veya kullanıcı olarak, bu depoyu uzak sunucuya yedeklemek veya başka kodlarla birleştirmek isterseniz dikkatli olun.

Bu yazılım lokalde çalışırken **`.steam_tokens.json`** adlı şifrelenmiş bir dosya yaratır. Bu dosya, hesabınızın GitHub veya internet ortamına sızmaması gereken **Giriş Anahtarınızı** barındırır. Projenin `.gitignore` dosyasında bu veri zaten kara listeye alınmıştır ancak yine de kendi sorumluluğunuzda tutunuz.

---

## ❤️ Destek & İletişim

Geliştirici: **[nzmprlk](https://github.com/nazimparlak)**

Herhangi bir sorun tespit ederseniz "Issues" kısmından bildirebilir, düzeltme yapmak veya özellik eklemek isterseniz "Pull Request" oluşturabilirsiniz. İyi kasmalar! 🎮
