// GANTI DENGAN URL WEB APP GOOGLE SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwPw69wrUFwe58QJMCIxwWi-ykYjaUvzjM4rzzeF3WlDAm4q5lPU0Mdop5Z9aSU6bM/exec";

const form = document.getElementById("tamuForm");
const btnSubmit = document.getElementById("main-submit");
const tiketModal = document.getElementById("tiketAntrian");

// Isi tanggal & waktu
const sekarang = new Date();
const namaHari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const hariIni = sekarang.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

document.getElementById("tanggalHari").value = `${namaHari[sekarang.getDay()]}, ${sekarang.toLocaleDateString('id-ID')}`;
document.getElementById("waktu").value = sekarang.toTimeString().substring(0,8);

// Nomor antrian harian
let nomorAntrian = parseInt(localStorage.getItem("nomorAntrian") || "0");
if (localStorage.getItem("hariTerakhir") !== hariIni.split(', ')[1]) {
  localStorage.setItem("hariTerakhir", hariIni.split(', ')[1]);
  localStorage.setItem("nomorAntrian", "0");
  nomorAntrian = 0;
}
const formatNomor = n => String(n + 1).padStart(3, "0");

// Preview foto
function previewFoto(fileInput, previewId, hiddenId, errId) {
  if (!fileInput.files || !fileInput.files[0]) return;
  
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById(previewId).src = e.target.result;
    document.getElementById(previewId).style.display = "block";
    document.getElementById(hiddenId).value = e.target.result;
    document.getElementById(errId).style.display = "none";
  };
  reader.readAsDataURL(file);
}

// Tombol kamera
document.querySelectorAll(".camera-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    const input = document.getElementById(target);
    input.click();
  });
});

// Event file input
document.getElementById("fileKtp").addEventListener("change", () => previewFoto(document.getElementById("fileKtp"), "previewKtp", "fotoKtpBase64", "errKtp"));
document.getElementById("fileWajah").addEventListener("change", () => previewFoto(document.getElementById("fileWajah"), "previewWajah", "fotoWajahBase64", "errWajah"));

// Validasi foto sebelum submit
function cekFoto() {
  let ok = true;
  if (!document.getElementById("fotoKtpBase64").value) { document.getElementById("errKtp").style.display = "block"; ok = false; }
  if (!document.getElementById("fotoWajahBase64").value) { document.getElementById("errWajah").style.display = "block"; ok = false; }
  return ok;
}

// Submit
form.addEventListener("submit", async function(e) {
  e.preventDefault();
  if (!cekFoto()) {
    alert("Mohon lengkapi semua foto yang wajib!");
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = "Sedang mengirim...";

  const fd = new FormData();
  fd.append("nama", form.nama.value.trim());
  fd.append("alamat", form.alamat.value.trim());
  fd.append("instansi", form.instansi.value.trim());
  fd.append("menemui", form.menemui.value.trim());
  fd.append("urusan", form.urusan.value.trim());
  fd.append("janji", form.janji.value);
  fd.append("keterangan", form.keterangan.value.trim());
  fd.append("fotoKtp", document.getElementById("fotoKtpBase64").value);
  fd.append("fotoWajah", document.getElementById("fotoWajahBase64").value);

  try {
    const res = await fetch(SCRIPT_URL, { method: "POST", body: fd });
    const json = await res.json();

    if (json.result === "success") {
      nomorAntrian++;
      localStorage.setItem("nomorAntrian", nomorAntrian);

      document.getElementById("nomorAntrian").textContent = formatNomor(nomorAntrian);
      document.getElementById("tiketNama").textContent = form.nama.value;
      document.getElementById("tiketMenemui").textContent = form.menemui.value;
      document.getElementById("tiketWaktu").textContent = document.getElementById("waktu").value;
      document.getElementById("tiketTanggal").textContent = hariIni.split(', ')[1];

      tiketModal.style.display = "flex";
      new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3').play().catch(()=>{});
      
      // Mencegah submit ulang
      form.querySelectorAll("input, textarea, select, button").forEach(el => el.disabled = true);
      btnSubmit.textContent = "SUKSES! Tiket siap dicetak";
    } else {
      throw new Error(json.message || "Gagal menyimpan");
    }
  } catch (err) {
    alert("Gagal mengirim: " + err.message + "\nCoba lagi atau hubungi admin.");
    btnSubmit.disabled = false;
    btnSubmit.textContent = "SUBMIT & CETAK NOMOR ANTRIAN";
  }
});

// Tutup tiket
document.getElementById("btnTutup").addEventListener("click", () => {
  tiketModal.style.display = "none";
  setTimeout(() => location.reload(), 600);
});