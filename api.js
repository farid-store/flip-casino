/**
 * ==============================================================
 * API CONTROLLER - KONEKSI KE FIREBASE FIRESTORE
 * ==============================================================
 */

// 1. Import Firebase SDK versi terbaru (V10 Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. GANTI DENGAN FIREBASE CONFIG MILIKMU! 
// (Dapatkan ini dari Firebase Console -> Project Settings)
const firebaseConfig = {
apiKey: "AIzaSyB2z0ueVPmvImlpXoHyeQ6ubS3P3P4BF1s",
  authDomain: "arcade-game-ec813.firebaseapp.com",
  projectId: "arcade-game-ec813",
  storageBucket: "arcade-game-ec813.firebasestorage.app",
  messagingSenderId: "1005759724056",
  appId: "1:1005759724056:web:0de1e12221206d5216e16d",
  measurementId: "G-J0QVRF3C4Q"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referensi ke koleksi "users" di Firestore
const usersCollection = collection(db, "users");

export const api = {
  
  // 1. Fungsi Pendaftaran (Register)
  async register(userObj) {
    try {
      // Cek apakah username sudah dipakai
      const q = query(usersCollection, where("username", "==", userObj.username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return { success: false, message: "Username sudah terdaftar!" };
      }

      // Format data user baru (sama seperti sebelumnya)
      const newUser = {
        ...userObj, 
        balance: 100000, // Saldo awal standar
        level: 1,
        exp: 0,
        joinedAt: new Date().toISOString()
      };

      // Simpan user baru sebagai dokumen baru di Firestore
      await addDoc(usersCollection, newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error("Gagal mendaftar:", error);
      return { success: false, message: "Gagal menyimpan ke server Firestore" };
    }
  },

  // 2. Fungsi Masuk (Login)
  async login(username, password) {
    try {
      // Cari data berdasarkan username
      const q = query(usersCollection, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: "Username tidak ditemukan!" };
      }

      let userData = null;
      let docId = null;

      // Ambil data user dari hasil pencarian (karena username unik, hasilnya pasti 1)
      querySnapshot.forEach((document) => {
        userData = document.data();
        docId = document.id; // ID unik dokumen di Firestore
      });

      // Validasi password
      if (userData && userData.password === password) {
        // Simpan sesi login ke LocalStorage (tambahkan docId untuk mempermudah update nantinya)
        const currentUserData = { ...userData, id: docId };
        localStorage.setItem('currentUser', JSON.stringify(currentUserData));
        
        return { success: true, user: currentUserData };
      }

      return { success: false, message: "Password salah!" };
    } catch (error) {
      console.error("Gagal login:", error);
      return { success: false, message: "Terjadi kesalahan server" };
    }
  },

  // 3. Fungsi Update Progres Pemain (Saldo & Level)
  async saveProgress(username, balance, level, exp) {
    try {
      // 1. Cari dokumen user berdasarkan username
      const q = query(usersCollection, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return false;

      let docId = null;
      let userData = null;

      querySnapshot.forEach((document) => {
        docId = document.id;
        userData = document.data();
      });

      // 2. Update HANYA data progres pada dokumen spesifik tersebut
      const userRef = doc(db, "users", docId);
      await updateDoc(userRef, {
        balance: balance,
        level: level,
        exp: exp
      });

      // 3. Update juga di LocalStorage agar UI web tetap sinkron
      const updatedUser = {
        ...userData,
        id: docId,
        balance: balance,
        level: level,
        exp: exp
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      return true;
    } catch (error) {
      console.error("Gagal menyimpan progres:", error);
      return false;
    }
  }
};
