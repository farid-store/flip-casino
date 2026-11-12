/**
 * ==============================================================
 * API CONTROLLER - FIREBASE FIRESTORE (User & Admin)
 * ==============================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, collection, getDocs, query, where, 
  addDoc, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: GANTI DENGAN FIREBASE CONFIG MILIKMU!
const firebaseConfig = {
  apiKey: "AIzaSyB2z0ueVPmvImlpXoHyeQ6ubS3P3P4BF1s",
  authDomain: "arcade-game-ec813.firebaseapp.com",
  projectId: "arcade-game-ec813",
  storageBucket: "arcade-game-ec813.firebasestorage.app",
  messagingSenderId: "1005759724056",
  appId: "1:1005759724056:web:0de1e12221206d5216e16d",
  measurementId: "G-J0QVRF3C4Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const usersCollection = collection(db, "users");
const depositsCollection = collection(db, "deposits");
const withdrawalsCollection = collection(db, "withdrawals");

export const api = {
  // 1. REGISTER
  async register(userObj) {
    try {
      const q = query(usersCollection, where("username", "==", userObj.username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) return { success: false, message: "Username sudah terdaftar!" };

      const newUser = {
        ...userObj, balance: 100000, level: 1, exp: 0, winRate: 15, joinedAt: new Date().toISOString()
      };
      await addDoc(usersCollection, newUser);
      return { success: true, user: newUser };
    } catch (error) { return { success: false, message: "Gagal menyimpan ke Firestore" }; }
  },

  // 2. LOGIN
  async login(username, password) {
    try {
      const q = query(usersCollection, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return { success: false, message: "Username tidak ditemukan!" };

      let userData = null; let docId = null;
      querySnapshot.forEach((document) => { userData = document.data(); docId = document.id; });

      if (userData && userData.password === password) {
        const currentUserData = { ...userData, id: docId };
        localStorage.setItem('currentUser', JSON.stringify(currentUserData));
        return { success: true, user: currentUserData };
      }
      return { success: false, message: "Password salah!" };
    } catch (error) { return { success: false, message: "Terjadi kesalahan server" }; }
  },

  // 3. SAVE PROGRESS (Untuk Game)
  async saveProgress(username, balance, level, exp) {
    try {
      const q = query(usersCollection, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return false;

      let docId = null; let userData = null;
      querySnapshot.forEach((document) => { docId = document.id; userData = document.data(); });

      await updateDoc(doc(db, "users", docId), { balance, level, exp });
      const updatedUser = { ...userData, id: docId, balance, level, exp };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return true;
    } catch (error) { return false; }
  },

  // ==============================================
  // FUNGSI KHUSUS ADMIN PANEL
  // ==============================================
  
  // 4. Ambil semua data (Users, Deposits, Withdrawals)
  async getAdminData() {
    try {
      const users = []; const deposits = []; const withdrawals = [];
      
      const usersSnap = await getDocs(usersCollection);
      usersSnap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

      const depSnap = await getDocs(depositsCollection);
      depSnap.forEach(doc => deposits.push({ id: doc.id, ...doc.data() }));

      const wdSnap = await getDocs(withdrawalsCollection);
      wdSnap.forEach(doc => withdrawals.push({ id: doc.id, ...doc.data() }));

      return { users, deposits, withdrawals };
    } catch (error) {
      console.error("Gagal mengambil data admin:", error);
      return null;
    }
  },

  // 5. Update data pemain (Saldo / RTP) langsung via ID dokumen
  async updateAdminUser(docId, updateData) {
    try {
      await updateDoc(doc(db, "users", docId), updateData);
      return true;
    } catch (error) { return false; }
  },

  // 6. Proses Deposit/Withdrawal (Ubah Status)
  async updateTransactionStatus(collectionName, docId, status) {
    try {
      await updateDoc(doc(db, collectionName, docId), { status: status });
      return true;
    } catch (error) { return false; }
  }
};
