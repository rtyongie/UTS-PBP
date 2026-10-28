 
const http = require("http");
const fs = require("fs");
const path = require("path");

const folder = __dirname;
const fileRSVP = path.join(folder, "rsvp.txt");

const tipeFile = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

const server = http.createServer((req, res) => {
  // Menerima data RSVP
  if (req.method === "POST" && req.url === "/rsvp") {
    let body = "";

    req.on("data", bagian => {
      body += bagian;

      if (body.length > 100000) {
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        const nama = String(data.nama || "").trim();
        const kehadiran = String(data.kehadiran || "");
        const ucapan = String(data.ucapan || "").trim();

        if (
          !nama || nama.length > 100 ||
          !["Hadir", "Tidak hadir"].includes(kehadiran) ||
          !ucapan || ucapan.length > 2000
        ) {
          res.writeHead(400, {
            "Content-Type": "application/json"
          });
          return res.end(JSON.stringify({
            pesan: "Data RSVP tidak valid."
          }));
        }

        const isi = `
Nama: ${nama}
Kehadiran: ${kehadiran}
Ucapan: ${ucapan}
Waktu: ${new Date().toLocaleString("id-ID")}

----------------------------------------
`;

        fs.appendFile(fileRSVP, isi, "utf8", error => {
          if (error) {
            res.writeHead(500, {
              "Content-Type": "application/json"
            });
            return res.end(JSON.stringify({
              pesan: "Gagal menyimpan RSVP."
            }));
          }

          res.writeHead(200, {
            "Content-Type": "application/json"
          });
          res.end(JSON.stringify({
            pesan: "RSVP berhasil disimpan!"
          }));
        });
      } catch (error) {
        res.writeHead(400, {
          "Content-Type": "application/json"
        });
        res.end(JSON.stringify({
          pesan: "Format data tidak valid."
        }));
      }
    });

    return;
  }

  // Menampilkan halaman dan file pendukung
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end("Metode tidak diizinkan.");
  }

  let alamat;
  try {
    alamat = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname
    );
  } catch {
    res.writeHead(400);
    return res.end("Alamat tidak valid.");
  }

  if (alamat === "/") alamat = "/index.html";

  const file = path.resolve(folder, "." + alamat);

  if (
    file !== folder &&
    !file.startsWith(folder + path.sep)
  ) {
    res.writeHead(403);
    return res.end("Akses ditolak.");
  }

  fs.readFile(file, (error, isi) => {
    if (error) {
      res.writeHead(404);
      return res.end("File tidak ditemukan.");
    }

    const tipe = tipeFile[path.extname(file)] ||
      "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": tipe
    });

    if (req.method === "HEAD") return res.end();
    res.end(isi);
  });
});

server.listen(3000, () => {
  console.log("Undangan berjalan di http://localhost:3000");
});
