/**
 * ==============================================================
 * API CONTROLLER - KONEKSI KE JSONBIN.IO
 * ==============================================================
 */

// GANTI DENGAN KUNCI DAN ID MILIKMU
const API_KEY = '$2a$10$tcKHEWwuz2sqRoMCKJfga.1xxTFW0RxpXUPnP.NI4YbivtlK1xxau'; 
const BIN_ID = '6a6e2401da38895dfead2b5f'; 
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const headers = {
  'Content-Type': 'application/json',
  'X-Master-Key': API_KEY
};

const api = {
  // 1. Mengambil seluruh data dari database
  async getDatabase() {
    try {
      const response = await fetch(`${BASE_URL}/latest`, { method: 'GET', headers });
      const data = await response.json();
      return data.record; // JSONBin menyimpan data kita di dalam properti 'record'
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      return null;
    }
  },

  // 2. Menyimpan/menimpa data baru ke database
  async updateDatabase(newData) {
    try {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers,
        body: JSON.stringify(newData)
      });
      return await response.json();
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      return null;
    }
  },

  // 3. Fungsi Pendaftaran (Register)
  async register(userObj) {
    const db = await this.getDatabase();
    if (!db || !db.users) return { success: false, message: "Database error" };

    // Cek apakah username sudah dipakai
    const exists = db.users.find(u => u.username === userObj.username);
    if (exists) return { success: false, message: "Username sudah terdaftar!" };

    // Format data user baru
    const newUser = {
      ...userObj, // Memasukkan (username, password, email, hp, rekening)
      balance: 100000, // Saldo awal standar
      level: 1,
      exp: 0,
      joinedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    const result = await this.updateDatabase(db);
    
    if (result) return { success: true, user: newUser };
    return { success: false, message: "Gagal menyimpan ke server" };
  },

  // 4. Fungsi Masuk (Login)
  async login(username, password) {
    const db = await this.getDatabase();
    if (!db || !db.users) return { success: false, message: "Database error" };

    // Cari kecocokan username dan password
    const user = db.users.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Simpan sesi login ke LocalStorage (browser)
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: "Username atau password salah!" };
  },

  // 5. Fungsi Update Progres Pemain (Saldo & Level)
  async saveProgress(username, balance, level, exp) {
    const db = await this.getDatabase();
    if (!db || !db.users) return false;

    const userIndex = db.users.findIndex(u => u.username === username);
    if (userIndex !== -1) {
      db.users[userIndex].balance = balance;
      db.users[userIndex].level = level;
      db.users[userIndex].exp = exp;
      
      await this.updateDatabase(db);
      
      // Update juga di LocalStorage agar UI sinkron
      const updatedUser = db.users[userIndex];
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      return true;
    }
    return false;
  }
};
