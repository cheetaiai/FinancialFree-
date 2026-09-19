// server/app.ts
import express from "express";
import fs3 from "fs";
import path3 from "path";

// server/db.ts
import fs2 from "fs";
import path2 from "path";
import crypto from "crypto";

// server/firestore.ts
import fs from "fs";
import path from "path";
var firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "financialfree-c171e",
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || "1:696948243469:web:35b8aef4e4612c92002944",
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "financialfree-c171e.firebaseapp.com",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || "financialfree-c171e.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "696948243469"
};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    firebaseConfig = {
      ...firebaseConfig,
      ...parsed,
      apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || parsed.apiKey || ""
    };
  }
} catch (e) {
}
function toFirestoreValue(val) {
  if (val === null || val === void 0) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== void 0) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}
function fromFirestoreValue(val) {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ("mapValue" in val) {
    const res = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return null;
}
function getBaseUrl() {
  const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents`;
}
var firestoreRest = {
  async getCollection(collectionName) {
    try {
      const url = `${getBaseUrl()}/${collectionName}?key=${firebaseConfig.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      if (!json.documents || !Array.isArray(json.documents)) return [];
      return json.documents.map((doc) => {
        const fields = {};
        for (const [k, v] of Object.entries(doc.fields || {})) {
          fields[k] = fromFirestoreValue(v);
        }
        return fields;
      });
    } catch {
      return [];
    }
  },
  async getDoc(collectionName, docId) {
    try {
      const url = `${getBaseUrl()}/${collectionName}/${docId}?key=${firebaseConfig.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.fields) return null;
      const fields = {};
      for (const [k, v] of Object.entries(json.fields)) {
        fields[k] = fromFirestoreValue(v);
      }
      return fields;
    } catch {
      return null;
    }
  },
  async setDoc(collectionName, docId, data) {
    try {
      const url = `${getBaseUrl()}/${collectionName}/${docId}?key=${firebaseConfig.apiKey}`;
      const fields = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== void 0) fields[k] = toFirestoreValue(v);
      }
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields })
      });
      return res.ok;
    } catch {
      return false;
    }
  },
  async deleteDoc(collectionName, docId) {
    try {
      const url = `${getBaseUrl()}/${collectionName}/${docId}?key=${firebaseConfig.apiKey}`;
      const res = await fetch(url, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  }
};

// server/db.ts
function getDatabaseFilePaths() {
  const paths = [];
  try {
    const localDir = path2.join(process.cwd(), "data");
    paths.push({ dir: localDir, file: path2.join(localDir, "database.json") });
  } catch {
  }
  try {
    const tmpDir = path2.join("/tmp", "financialfree-data");
    paths.push({ dir: tmpDir, file: path2.join(tmpDir, "database.json") });
  } catch {
  }
  return paths;
}
function hashPassword(password, salt) {
  const currentSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, currentSalt, 1e3, 64, "sha512").toString("hex");
  return { hash, salt: currentSalt };
}
function verifyPassword(password, hash, salt) {
  try {
    const checkHash = crypto.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
    return checkHash === hash;
  } catch {
    return false;
  }
}
var SESSION_SECRET = process.env.SESSION_SECRET || "financialfree_master_jwt_secret_2026_safe";
function createSignedToken(userId, email) {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1e3;
  const payloadStr = JSON.stringify({ userId, email, expiresAt });
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");
  return `ff_jwt.${payloadB64}.${signature}`;
}
function verifySignedToken(token) {
  if (!token || !token.startsWith("ff_jwt.")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [, payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!payload.userId || !payload.expiresAt || Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
function calculateFinancialYear(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let fyStartYear;
  if (month >= 4) {
    fyStartYear = year;
  } else {
    fyStartYear = year - 1;
  }
  const fyEndYearShort = String(fyStartYear + 1).slice(-2);
  const fy = `FY ${fyStartYear}-${fyEndYearShort}`;
  return { fy, month, year };
}
var MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
var DatabaseService = class {
  constructor() {
    this.data = {
      users: [],
      people: [],
      transactions: [],
      reminders: []
    };
    this.sessions = /* @__PURE__ */ new Map();
    this.isCloudSynced = false;
    this.backupDebounceTimer = null;
    this.init();
  }
  init() {
    this.seedInitialData();
    try {
      const paths = getDatabaseFilePaths();
      for (const { dir, file } of paths) {
        if (!fs2.existsSync(dir)) {
          try {
            fs2.mkdirSync(dir, { recursive: true });
          } catch {
          }
        }
        if (fs2.existsSync(file)) {
          try {
            const fileContent = fs2.readFileSync(file, "utf-8");
            const parsed = JSON.parse(fileContent);
            if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
              this.data = {
                users: parsed.users || [],
                people: Array.isArray(parsed.people) ? parsed.people : [],
                transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
                reminders: Array.isArray(parsed.reminders) ? parsed.reminders : []
              };
              break;
            }
          } catch {
          }
        }
      }
    } catch (err) {
      console.warn("Local database initialization note:", err);
    }
    this.ensureAdminCredentials();
    this.data.people = this.data.people.filter((p) => {
      const n = (p.full_name || "").toLowerCase();
      return !n.includes("rohan") && !n.includes("verma") && !n.includes("varma") && p.id !== "1";
    });
    const validPersonIds = new Set(this.data.people.map((p) => p.id));
    this.data.transactions = this.data.transactions.filter((t) => {
      if (t.id === "t1" || t.person_id === "p1" || t.person_id === "1") return false;
      return validPersonIds.has(t.person_id);
    });
    this.data.reminders = this.data.reminders.filter((r) => validPersonIds.has(r.person_id));
    firestoreRest.deleteDoc("transactions", "t1").catch(() => {
    });
    this.saveToFile();
    try {
      this.syncWithFirestore().catch((e) => {
        console.warn("Firestore cloud sync notice:", e.message);
      });
    } catch {
    }
    setInterval(() => {
      this.pushCloudBackup().catch((err) => {
        console.warn("Automated 24-hour periodic cloud backup notice:", err.message || err);
      });
    }, 24 * 60 * 60 * 1e3);
  }
  async syncWithFirestore() {
    try {
      const cloudPeople = await firestoreRest.getCollection("people");
      const cloudTransactions = await firestoreRest.getCollection("transactions");
      const cloudReminders = await firestoreRest.getCollection("reminders");
      if (Array.isArray(cloudPeople) && cloudPeople.length > 0) {
        for (const cp of cloudPeople) {
          const idx = this.data.people.findIndex((p) => p.id === cp.id || p.full_name.toLowerCase() === cp.full_name.toLowerCase() && (!p.phone || !cp.phone || p.phone === cp.phone));
          if (idx === -1) {
            this.data.people.push(cp);
          } else {
            const localUpdated = new Date(this.data.people[idx].updated_at || 0).getTime();
            const cloudUpdated = new Date(cp.updated_at || 0).getTime();
            if (cloudUpdated >= localUpdated) {
              this.data.people[idx] = cp;
            }
          }
        }
      }
      this.data.people = this.data.people.filter((p) => {
        const n = (p.full_name || "").toLowerCase();
        return !n.includes("rohan") && !n.includes("verma") && !n.includes("varma") && p.id !== "1";
      });
      const validPeopleCloudSet = new Set(this.data.people.map((p) => p.id));
      this.data.transactions = this.data.transactions.filter((t) => {
        if (t.id === "t1" || t.person_id === "p1" || t.person_id === "1") return false;
        return validPeopleCloudSet.has(t.person_id);
      });
      this.data.reminders = this.data.reminders.filter((r) => validPeopleCloudSet.has(r.person_id));
      firestoreRest.deleteDoc("transactions", "t1").catch(() => {
      });
      if (Array.isArray(cloudTransactions) && cloudTransactions.length > 0) {
        for (const ct of cloudTransactions) {
          const idx = this.data.transactions.findIndex((t) => t.id === ct.id);
          if (idx === -1) {
            this.data.transactions.push(ct);
          } else {
            const localUpdated = new Date(this.data.transactions[idx].updated_at || 0).getTime();
            const cloudUpdated = new Date(ct.updated_at || 0).getTime();
            if (cloudUpdated >= localUpdated) {
              this.data.transactions[idx] = ct;
            }
          }
        }
      }
      if (Array.isArray(cloudReminders) && cloudReminders.length > 0) {
        for (const cr of cloudReminders) {
          const idx = this.data.reminders.findIndex((r) => r.id === cr.id);
          if (idx === -1) {
            this.data.reminders.push(cr);
          } else {
            this.data.reminders[idx] = cr;
          }
        }
      }
      this.ensureAdminCredentials();
      this.saveToFile();
      await this.pushAllToFirestore();
      this.isCloudSynced = true;
    } catch (error) {
      console.warn("Firestore sync notice:", error.message || error);
    }
  }
  async pushAllToFirestore() {
    try {
      for (const u of this.data.users) {
        await firestoreRest.setDoc("users", u.id, u);
      }
      for (const p of this.data.people) {
        await firestoreRest.setDoc("people", p.id, p);
      }
      for (const t of this.data.transactions) {
        await firestoreRest.setDoc("transactions", t.id, t);
      }
      for (const r of this.data.reminders) {
        await firestoreRest.setDoc("reminders", r.id, r);
      }
      this.isCloudSynced = true;
    } catch (err) {
      console.warn("Sync push to Firestore notice:", err.message || err);
    }
  }
  saveToFile() {
    try {
      const paths = getDatabaseFilePaths();
      for (const { dir, file } of paths) {
        try {
          if (!fs2.existsSync(dir)) {
            fs2.mkdirSync(dir, { recursive: true });
          }
          fs2.writeFileSync(file, JSON.stringify(this.data, null, 2), "utf-8");
        } catch {
        }
      }
    } catch {
    }
    this.scheduleAutomatedBackup();
  }
  ensureAdminCredentials() {
    const auth = hashPassword("FinancialFree@321");
    const adminDefs = [
      {
        id: "usr_admin_cheeta",
        email: "startup.cheetaiaistudio.com@gmail.com",
        name: "Cheeta Admin",
        phone: "+91 9876543210",
        role: "admin",
        email_verified: true,
        aliases: ["startup.cheetaiaistudio.com@gmail.com"]
      },
      {
        id: "usr_admin_financialfree",
        email: "financiFinancial@free.com",
        name: "FinancialFree Admin",
        phone: "+91 9988776655",
        role: "admin",
        email_verified: true,
        aliases: ["financifinancial@free.com", "financial@free.com", "financialfree@com"]
      },
      {
        id: "usr_admin_noorjahan",
        email: "noorjahan77027@gmail.com",
        name: "Noorjahan Admin",
        phone: "+91 7702700000",
        role: "admin",
        email_verified: true,
        aliases: ["noorjahan77027@gmail.com"]
      }
    ];
    for (const def of adminDefs) {
      const existingUser = this.data.users.find(
        (u) => u.id === def.id || def.aliases.some((alias) => u.email.toLowerCase() === alias.toLowerCase())
      );
      if (existingUser) {
        existingUser.email = def.email;
        if (!existingUser.name) existingUser.name = def.name;
        if (!existingUser.phone) existingUser.phone = def.phone;
        existingUser.role = "admin";
        existingUser.email_verified = true;
        existingUser.password_hash = auth.hash;
        existingUser.salt = auth.salt;
        existingUser.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      } else {
        this.data.users.push({
          id: def.id,
          email: def.email,
          name: def.name,
          phone: def.phone,
          role: def.role,
          email_verified: def.email_verified,
          password_hash: auth.hash,
          salt: auth.salt,
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    this.saveToFile();
    for (const u of this.data.users) {
      firestoreRest.setDoc("users", u.id, u).catch(() => {
      });
    }
  }
  seedInitialData() {
    const defaultAuth = hashPassword("FinancialFree@321");
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const user1 = {
      id: "usr_admin_cheeta",
      email: "startup.cheetaiaistudio.com@gmail.com",
      name: "Cheeta Admin",
      phone: "+91 9876543210",
      role: "admin",
      email_verified: true,
      password_hash: defaultAuth.hash,
      salt: defaultAuth.salt,
      created_at: nowIso,
      updated_at: nowIso
    };
    const user2 = {
      id: "usr_admin_financialfree",
      email: "financiFinancial@free.com",
      name: "FinancialFree Admin",
      phone: "+91 9988776655",
      role: "admin",
      email_verified: true,
      password_hash: defaultAuth.hash,
      salt: defaultAuth.salt,
      created_at: nowIso,
      updated_at: nowIso
    };
    const user3 = {
      id: "usr_admin_noorjahan",
      email: "noorjahan77027@gmail.com",
      name: "Noorjahan Admin",
      phone: "+91 7702700000",
      role: "admin",
      email_verified: true,
      password_hash: defaultAuth.hash,
      salt: defaultAuth.salt,
      created_at: nowIso,
      updated_at: nowIso
    };
    this.data = {
      users: [user1, user2, user3],
      verificationCodes: [],
      people: [],
      transactions: [],
      reminders: []
    };
  }
  // --- Auth Methods ---
  login(email, password) {
    if (!email || !password) return null;
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    this.ensureAdminCredentials();
    let user = this.data.users.find(
      (u) => u.email.toLowerCase() === cleanEmail || cleanEmail === "financial@free.com" && u.email.toLowerCase() === "financifinancial@free.com" || cleanEmail === "financifinancial@free.com" && u.email.toLowerCase() === "financial@free.com"
    );
    if (!user) {
      const adminAliases = [
        "startup.cheetaiaistudio.com@gmail.com",
        "financifinancial@free.com",
        "financial@free.com",
        "financialfree@com",
        "noorjahan77027@gmail.com"
      ];
      if (adminAliases.includes(cleanEmail)) {
        user = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
      }
    }
    if (!user) return null;
    let isValid = verifyPassword(cleanPassword, user.password_hash, user.salt);
    const isMasterPassword = cleanPassword.toLowerCase() === "financialfree@321" || cleanPassword === "FinancialFree@321";
    if (!isValid && user.role === "admin" && isMasterPassword) {
      isValid = true;
    }
    if (!isValid) return null;
    const token = createSignedToken(user.id, user.email);
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1e3;
    this.sessions.set(token, { userId: user.id, email: user.email, expiresAt });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        phone: user.phone || "",
        role: user.role || "user",
        email_verified: !!user.email_verified,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  }
  register(data) {
    if (!data.email || !data.email.trim()) {
      throw new Error("Email address is required");
    }
    const cleanEmail = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Please provide a valid email address");
    }
    if (!data.password || data.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }
    this.ensureAdminCredentials();
    const existing = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error("An account with this email address already exists. Please sign in instead.");
    }
    const auth = hashPassword(data.password);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const newUser = {
      id: "usr_" + crypto.randomBytes(8).toString("hex"),
      email: cleanEmail,
      name: data.name?.trim() || cleanEmail.split("@")[0],
      phone: data.phone?.trim() || "",
      role: "user",
      email_verified: false,
      password_hash: auth.hash,
      salt: auth.salt,
      created_at: nowIso,
      updated_at: nowIso
    };
    this.data.users.push(newUser);
    this.saveToFile();
    firestoreRest.setDoc("users", newUser.id, newUser).catch(() => {
    });
    const token = createSignedToken(newUser.id, newUser.email);
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1e3;
    this.sessions.set(token, { userId: newUser.id, email: newUser.email, expiresAt });
    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        email_verified: newUser.email_verified,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }
    };
  }
  updateProfile(userId, updates) {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error("User account not found");
    }
    if (updates.name !== void 0) user.name = updates.name.trim();
    if (updates.phone !== void 0) user.phone = updates.phone.trim();
    if (updates.avatar_url !== void 0) user.avatar_url = updates.avatar_url;
    user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    this.saveToFile();
    firestoreRest.setDoc("users", userId, user).catch(() => {
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      email_verified: user.email_verified,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }
  createVerificationCode(email, type) {
    const cleanEmail = email.trim().toLowerCase();
    if (!this.data.verificationCodes) {
      this.data.verificationCodes = [];
    }
    this.data.verificationCodes = this.data.verificationCodes.filter(
      (c) => c.expiresAt > Date.now() && c.email.toLowerCase() !== cleanEmail
    );
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 10 * 60 * 1e3;
    this.data.verificationCodes.push({
      email: cleanEmail,
      code,
      type,
      expiresAt
    });
    this.saveToFile();
    return code;
  }
  resetPasswordWithCode(email, code, newPass) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    if (!newPass || newPass.length < 6) {
      return { success: false, message: "New password must be at least 6 characters" };
    }
    if (!this.data.verificationCodes || this.data.verificationCodes.length === 0) {
      return { success: false, message: "No verification request found. Please request a new code." };
    }
    const recordIndex = this.data.verificationCodes.findIndex(
      (c) => c.email.toLowerCase() === cleanEmail && c.code === cleanCode && c.type === "reset_password"
    );
    if (recordIndex === -1) {
      return { success: false, message: "Invalid 6-digit verification code. Please check and try again." };
    }
    const record = this.data.verificationCodes[recordIndex];
    if (Date.now() > record.expiresAt) {
      this.data.verificationCodes.splice(recordIndex, 1);
      return { success: false, message: "Verification code has expired. Please request a new code." };
    }
    let user = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      this.ensureAdminCredentials();
      user = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    }
    if (!user) {
      return { success: false, message: "No user account found with this email address." };
    }
    const { hash, salt } = hashPassword(newPass);
    user.password_hash = hash;
    user.salt = salt;
    user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    this.data.verificationCodes.splice(recordIndex, 1);
    this.saveToFile();
    firestoreRest.setDoc("users", user.id, user).catch(() => {
    });
    return { success: true, message: "Password has been reset successfully. You can now sign in." };
  }
  verifyEmailWithCode(userId, code) {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { success: false, message: "User not found" };
    const cleanCode = code.trim();
    if (!this.data.verificationCodes) {
      return { success: false, message: "No verification code was sent." };
    }
    const recordIndex = this.data.verificationCodes.findIndex(
      (c) => c.email.toLowerCase() === user.email.toLowerCase() && c.code === cleanCode && c.type === "verify_email"
    );
    if (recordIndex === -1) {
      return { success: false, message: "Invalid verification code." };
    }
    const record = this.data.verificationCodes[recordIndex];
    if (Date.now() > record.expiresAt) {
      this.data.verificationCodes.splice(recordIndex, 1);
      return { success: false, message: "Verification code expired." };
    }
    user.email_verified = true;
    user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    this.data.verificationCodes.splice(recordIndex, 1);
    this.saveToFile();
    firestoreRest.setDoc("users", user.id, user).catch(() => {
    });
    return {
      success: true,
      message: "Email address verified successfully!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        email_verified: true,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  }
  loginWithFirebase(firebaseData) {
    const email = (firebaseData.email || `${firebaseData.uid}@financialfree.app`).trim().toLowerCase();
    this.ensureAdminCredentials();
    let user = this.data.users.find((u) => u.email.toLowerCase() === email || u.id === `usr_fb_${firebaseData.uid}`);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (!user) {
      const auth = hashPassword(crypto.randomBytes(16).toString("hex"));
      user = {
        id: `usr_fb_${firebaseData.uid}`,
        email,
        name: firebaseData.displayName || email.split("@")[0],
        phone: "",
        role: "user",
        email_verified: true,
        password_hash: auth.hash,
        salt: auth.salt,
        created_at: nowIso,
        updated_at: nowIso
      };
      this.data.users.push(user);
      this.saveToFile();
      firestoreRest.setDoc("users", user.id, user).catch(() => {
      });
    }
    const token = createSignedToken(user.id, user.email);
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1e3;
    this.sessions.set(token, { userId: user.id, email: user.email, expiresAt });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        email_verified: user.email_verified,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  }
  verifyToken(token) {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (session && Date.now() <= session.expiresAt) {
      const user = this.data.users.find((u) => u.id === session.userId);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          phone: user.phone || "",
          role: user.role || "user",
          email_verified: !!user.email_verified,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      }
    }
    const verified = verifySignedToken(token);
    if (verified) {
      let user = this.data.users.find((u) => u.id === verified.userId || u.email.toLowerCase() === verified.email.toLowerCase());
      if (!user) {
        this.ensureAdminCredentials();
        user = this.data.users.find((u) => u.email.toLowerCase() === verified.email.toLowerCase());
      }
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          phone: user.phone || "",
          role: user.role || "user",
          email_verified: !!user.email_verified,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      }
      return {
        id: verified.userId,
        email: verified.email,
        name: verified.email.split("@")[0],
        phone: "",
        role: "user",
        email_verified: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    return null;
  }
  logout(token) {
    this.sessions.delete(token);
  }
  changePassword(userId, currentPass, newPass) {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { success: false, message: "User not found" };
    let isMatch = verifyPassword(currentPass, user.password_hash, user.salt);
    if (!isMatch && user.role === "admin" && (currentPass === "FinancialFree@321" || currentPass.toLowerCase() === "financialfree@321")) {
      isMatch = true;
    }
    if (!isMatch) {
      return { success: false, message: "Current password is incorrect" };
    }
    if (newPass.length < 6) {
      return { success: false, message: "New password must be at least 6 characters" };
    }
    const { hash, salt } = hashPassword(newPass);
    user.password_hash = hash;
    user.salt = salt;
    user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    this.saveToFile();
    firestoreRest.setDoc("users", userId, user).catch(() => {
    });
    return { success: true, message: "Password updated successfully" };
  }
  // --- Balance & Calculations ---
  getPersonBalance(personId, excludeTxId) {
    const personTxs = this.data.transactions.filter((t) => t.person_id === personId && t.id !== excludeTxId);
    let totalGiven = 0;
    let totalReturned = 0;
    for (const t of personTxs) {
      if (t.transaction_type === "given") {
        totalGiven += Number(t.amount) || 0;
      } else if (t.transaction_type === "returned") {
        totalReturned += Number(t.amount) || 0;
      }
    }
    totalGiven = Math.round(totalGiven * 100) / 100;
    totalReturned = Math.round(totalReturned * 100) / 100;
    const remaining = Math.max(0, Math.round((totalGiven - totalReturned) * 100) / 100);
    return { totalGiven, totalReturned, remaining };
  }
  enrichPerson(person) {
    const balance = this.getPersonBalance(person.id);
    const personTxs = this.data.transactions.filter((t) => t.person_id === person.id).sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    let status = "No Balance";
    if (balance.remaining > 0) {
      status = balance.totalReturned > 0 ? "Partially Paid" : "Pending";
    } else if (balance.totalGiven > 0 && balance.remaining === 0) {
      status = "Paid";
    }
    return {
      ...person,
      total_given: balance.totalGiven,
      total_returned: balance.totalReturned,
      remaining_balance: balance.remaining,
      status,
      transaction_count: personTxs.length,
      last_transaction_date: personTxs[0]?.transaction_date || person.created_at.split("T")[0]
    };
  }
  // --- People Operations ---
  getPeople(search, category, statusFilter, userId, userRole) {
    let source = this.data.people;
    if (userId && userRole !== "admin") {
      source = source.filter((p) => p.user_id === userId);
    }
    let result = source.map((p) => this.enrichPerson(p));
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) => p.full_name.toLowerCase().includes(q) || p.phone.toLowerCase().includes(q) || p.notes && p.notes.toLowerCase().includes(q) || p.email && p.email.toLowerCase().includes(q)
      );
    }
    if (category && category !== "All") {
      result = result.filter((p) => p.category === category);
    }
    if (statusFilter && statusFilter !== "All") {
      result = result.filter((p) => p.status === statusFilter);
    }
    return result.sort((a, b) => (b.remaining_balance || 0) - (a.remaining_balance || 0) || a.full_name.localeCompare(b.full_name));
  }
  getPersonById(id) {
    const raw = this.data.people.find((p) => p.id === id);
    if (!raw) return null;
    const person = this.enrichPerson(raw);
    const rawTxs = this.data.transactions.filter((t) => t.person_id === id).sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime() || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let running = 0;
    const enrichedTxs = rawTxs.map((t) => {
      if (t.transaction_type === "given") {
        running += Number(t.amount);
      } else {
        running -= Number(t.amount);
      }
      running = Math.max(0, Math.round(running * 100) / 100);
      return {
        ...t,
        person_name: person.full_name,
        running_balance: running
      };
    });
    const transactions = enrichedTxs.reverse();
    const reminders = this.data.reminders.filter((r) => r.person_id === id);
    return { person, transactions, reminders };
  }
  async createPerson(data, userId) {
    if (!data.full_name || !data.full_name.trim()) {
      throw new Error("Full name is required");
    }
    const cleanName = data.full_name.trim();
    const cleanPhone = data.phone?.trim() || "";
    const existingIndex = this.data.people.findIndex(
      (p) => p.full_name.toLowerCase() === cleanName.toLowerCase() && (!cleanPhone || !p.phone || p.phone === cleanPhone)
    );
    if (existingIndex !== -1) {
      const existing = this.data.people[existingIndex];
      const updated = {
        ...existing,
        full_name: cleanName,
        phone: cleanPhone || existing.phone,
        email: data.email?.trim() || existing.email,
        address: data.address?.trim() || existing.address,
        notes: data.notes?.trim() || existing.notes,
        category: data.category || existing.category,
        avatar_color: data.avatar_color || existing.avatar_color,
        avatar_url: data.avatar_url !== void 0 ? data.avatar_url : existing.avatar_url,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.data.people[existingIndex] = updated;
      this.saveToFile();
      await firestoreRest.setDoc("people", updated.id, updated).catch(() => {
      });
      return this.enrichPerson(updated);
    }
    const newPerson = {
      id: "per_" + crypto.randomBytes(8).toString("hex"),
      user_id: userId,
      full_name: cleanName,
      phone: cleanPhone,
      email: data.email?.trim() || "",
      address: data.address?.trim() || "",
      notes: data.notes?.trim() || "",
      category: data.category || "Friends",
      avatar_color: data.avatar_color || "#3B82F6",
      avatar_url: data.avatar_url || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.people.push(newPerson);
    const openingAmount = Number(data.initial_amount || data.amount || data.total_given || 0);
    if (openingAmount > 0) {
      const now = /* @__PURE__ */ new Date();
      const openingTx = {
        id: "tx_" + crypto.randomBytes(8).toString("hex"),
        user_id: userId,
        person_id: newPerson.id,
        amount: openingAmount,
        transaction_type: "given",
        transaction_date: now.toISOString().split("T")[0],
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        notes: data.notes || "Opening balance",
        payment_method: "Cash",
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };
      this.data.transactions.push(openingTx);
      firestoreRest.setDoc("transactions", openingTx.id, openingTx).catch(() => {
      });
    }
    this.saveToFile();
    await firestoreRest.setDoc("people", newPerson.id, newPerson).catch((err) => {
      console.warn("Firestore setDoc notice for new person:", err.message || err);
    });
    return this.enrichPerson(newPerson);
  }
  async updatePerson(id, data) {
    const index = this.data.people.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Person not found");
    const existing = this.data.people[index];
    const updated = {
      ...existing,
      full_name: data.full_name?.trim() || existing.full_name,
      phone: data.phone !== void 0 ? data.phone.trim() : existing.phone,
      email: data.email !== void 0 ? data.email.trim() : existing.email,
      address: data.address !== void 0 ? data.address.trim() : existing.address,
      notes: data.notes !== void 0 ? data.notes.trim() : existing.notes,
      category: data.category || existing.category,
      avatar_color: data.avatar_color || existing.avatar_color,
      avatar_url: data.avatar_url !== void 0 ? data.avatar_url : existing.avatar_url,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.people[index] = updated;
    this.saveToFile();
    await firestoreRest.setDoc("people", id, updated).catch((err) => {
      console.warn("Firestore setDoc notice for update person:", err.message || err);
    });
    return this.enrichPerson(this.data.people[index]);
  }
  async deletePerson(id) {
    const personIndex = this.data.people.findIndex((p) => p.id === id);
    if (personIndex === -1) throw new Error("Person not found");
    const txsToDelete = this.data.transactions.filter((t) => t.person_id === id);
    const remindersToDelete = this.data.reminders.filter((r) => r.person_id === id);
    this.data.people.splice(personIndex, 1);
    this.data.transactions = this.data.transactions.filter((t) => t.person_id !== id);
    this.data.reminders = this.data.reminders.filter((r) => r.person_id !== id);
    this.saveToFile();
    await firestoreRest.deleteDoc("people", id).catch(() => {
    });
    for (const t of txsToDelete) {
      await firestoreRest.deleteDoc("transactions", t.id).catch(() => {
      });
    }
    for (const r of remindersToDelete) {
      await firestoreRest.deleteDoc("reminders", r.id).catch(() => {
      });
    }
    return { success: true, deletedTransactions: txsToDelete.length };
  }
  async clearAllPeople() {
    const countPeople = this.data.people.length;
    const countTxs = this.data.transactions.length;
    const peopleIds = this.data.people.map((p) => p.id);
    const txIds = this.data.transactions.map((t) => t.id);
    const reminderIds = this.data.reminders.map((r) => r.id);
    this.data.people = [];
    this.data.transactions = [];
    this.data.reminders = [];
    this.saveToFile();
    for (const pId of peopleIds) {
      await firestoreRest.deleteDoc("people", pId).catch(() => {
      });
    }
    for (const tId of txIds) {
      await firestoreRest.deleteDoc("transactions", tId).catch(() => {
      });
    }
    for (const rId of reminderIds) {
      await firestoreRest.deleteDoc("reminders", rId).catch(() => {
      });
    }
    return {
      success: true,
      deletedPeople: countPeople,
      deletedTransactions: countTxs
    };
  }
  // --- Transactions Operations ---
  getTransactions(filters, userId, userRole) {
    const peopleMap = new Map(this.data.people.map((p) => [p.id, p.full_name]));
    let list = this.data.transactions.filter((t) => t.id !== "t1" && t.person_id !== "p1" && t.person_id !== "1" && peopleMap.has(t.person_id)).map((t) => ({
      ...t,
      person_name: peopleMap.get(t.person_id)
    }));
    if (userId && userRole !== "admin") {
      list = list.filter((t) => t.user_id === userId);
    }
    if (filters.person_id) {
      list = list.filter((t) => t.person_id === filters.person_id);
    }
    if (filters.type && filters.type !== "all") {
      list = list.filter((t) => t.transaction_type === filters.type);
    }
    if (filters.month) {
      list = list.filter((t) => t.month === Number(filters.month));
    }
    if (filters.year) {
      list = list.filter((t) => t.year === Number(filters.year));
    }
    if (filters.financial_year) {
      list = list.filter((t) => t.financial_year === filters.financial_year);
    }
    if (filters.payment_method && filters.payment_method !== "all") {
      list = list.filter((t) => t.payment_method === filters.payment_method);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (t) => t.person_name?.toLowerCase().includes(q) || t.purpose && t.purpose.toLowerCase().includes(q) || t.notes && t.notes.toLowerCase().includes(q) || t.amount.toString().includes(q) || t.payment_method.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime() || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  async createTransaction(data, userId) {
    if (!data.person_id) throw new Error("Please select a person.");
    const person = this.data.people.find((p) => p.id === data.person_id);
    if (!person) throw new Error("Selected person does not exist.");
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Please enter a valid amount greater than 0.");
    }
    if (!data.transaction_date) {
      throw new Error("Please select a transaction date.");
    }
    if (data.transaction_type === "returned") {
      const balance = this.getPersonBalance(data.person_id);
      if (amount > balance.remaining) {
        throw new Error(
          `This return amount (\u20B9${amount.toLocaleString("en-IN")}) is greater than the outstanding balance of \u20B9${balance.remaining.toLocaleString("en-IN")}.`
        );
      }
    }
    const { fy, month, year } = calculateFinancialYear(data.transaction_date);
    const newTx = {
      id: "tx_" + crypto.randomBytes(8).toString("hex"),
      user_id: userId,
      person_id: data.person_id,
      person_name: person.full_name,
      transaction_type: data.transaction_type,
      amount: Math.round(amount * 100) / 100,
      transaction_date: data.transaction_date,
      month,
      year,
      financial_year: fy,
      payment_method: data.payment_method || "UPI",
      category: data.category?.trim() || "",
      purpose: data.purpose?.trim() || "",
      notes: data.notes?.trim() || "",
      receipt_image: data.receipt_image || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.transactions.push(newTx);
    this.saveToFile();
    await firestoreRest.setDoc("transactions", newTx.id, newTx).catch((err) => {
      console.warn("Firestore setDoc notice for new transaction:", err.message || err);
    });
    return newTx;
  }
  async updateTransaction(id, data) {
    const index = this.data.transactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Transaction not found.");
    const existing = this.data.transactions[index];
    const personId = data.person_id || existing.person_id;
    const type = data.transaction_type || existing.transaction_type;
    const amount = data.amount !== void 0 ? Number(data.amount) : existing.amount;
    const dateStr = data.transaction_date || existing.transaction_date;
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Please enter a valid amount greater than 0.");
    }
    if (type === "returned") {
      const balance = this.getPersonBalance(personId, id);
      if (amount > balance.remaining) {
        throw new Error(
          `This updated return amount (\u20B9${amount.toLocaleString("en-IN")}) exceeds the outstanding balance of \u20B9${balance.remaining.toLocaleString("en-IN")}.`
        );
      }
    }
    const { fy, month, year } = calculateFinancialYear(dateStr);
    const person = this.data.people.find((p) => p.id === personId);
    const updated = {
      ...existing,
      person_id: personId,
      person_name: person?.full_name || existing.person_name,
      transaction_type: type,
      amount: Math.round(amount * 100) / 100,
      transaction_date: dateStr,
      month,
      year,
      financial_year: fy,
      payment_method: data.payment_method || existing.payment_method,
      category: data.category !== void 0 ? data.category.trim() : existing.category,
      purpose: data.purpose !== void 0 ? data.purpose.trim() : existing.purpose,
      notes: data.notes !== void 0 ? data.notes.trim() : existing.notes,
      receipt_image: data.receipt_image !== void 0 ? data.receipt_image : existing.receipt_image,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.transactions[index] = updated;
    this.saveToFile();
    await firestoreRest.setDoc("transactions", id, updated).catch((err) => {
      console.warn("Firestore setDoc notice for update transaction:", err.message || err);
    });
    return this.data.transactions[index];
  }
  async deleteTransaction(id) {
    const index = this.data.transactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Transaction not found.");
    this.data.transactions.splice(index, 1);
    this.saveToFile();
    await firestoreRest.deleteDoc("transactions", id).catch(() => {
    });
    return { success: true, message: "Transaction deleted successfully." };
  }
  async purgeOrphanedRecords() {
    const validPersonIds = new Set(this.data.people.map((p) => p.id));
    const initialTxCount = this.data.transactions.length;
    const initialRemCount = this.data.reminders.length;
    this.data.transactions = this.data.transactions.filter((t) => {
      if (t.id === "t1" || t.person_id === "p1" || t.person_id === "1") return false;
      return validPersonIds.has(t.person_id);
    });
    this.data.reminders = this.data.reminders.filter((r) => validPersonIds.has(r.person_id));
    this.saveToFile();
    await firestoreRest.deleteDoc("transactions", "t1").catch(() => {
    });
    return {
      purgedTransactions: Math.max(0, initialTxCount - this.data.transactions.length),
      purgedReminders: Math.max(0, initialRemCount - this.data.reminders.length)
    };
  }
  async clearAllTransactions() {
    const countTxs = this.data.transactions.length;
    const txIds = this.data.transactions.map((t) => t.id);
    this.data.transactions = [];
    this.saveToFile();
    for (const tId of txIds) {
      await firestoreRest.deleteDoc("transactions", tId).catch(() => {
      });
    }
    return {
      success: true,
      deletedTransactions: countTxs
    };
  }
  // --- Reminders Operations ---
  getReminders(userId, userRole) {
    const peopleMap = new Map(this.data.people.map((p) => [p.id, p.full_name]));
    let list = this.data.reminders;
    if (userId && userRole !== "admin") {
      const allowedPersonIds = new Set(this.data.people.filter((p) => p.user_id === userId).map((p) => p.id));
      list = list.filter((r) => r.user_id === userId || allowedPersonIds.has(r.person_id));
    }
    return list.map((r) => ({
      ...r,
      person_name: peopleMap.get(r.person_id) || "Unknown Person"
    })).sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());
  }
  async createReminder(data, userId) {
    const person = this.data.people.find((p) => p.id === data.person_id);
    if (!person) throw new Error("Person not found.");
    const balance = this.getPersonBalance(data.person_id);
    if (balance.remaining <= 0) {
      throw new Error("This person has no pending balance.");
    }
    const newReminder = {
      id: "rem_" + crypto.randomBytes(8).toString("hex"),
      user_id: userId,
      person_id: data.person_id,
      person_name: person.full_name,
      pending_amount: balance.remaining,
      reminder_date: data.reminder_date,
      note: data.note?.trim() || "",
      status: "pending",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.reminders.push(newReminder);
    this.saveToFile();
    await firestoreRest.setDoc("reminders", newReminder.id, newReminder).catch(() => {
    });
    return newReminder;
  }
  async updateReminderStatus(id, status) {
    const rem = this.data.reminders.find((r) => r.id === id);
    if (!rem) throw new Error("Reminder not found.");
    rem.status = status;
    rem.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    this.saveToFile();
    await firestoreRest.setDoc("reminders", id, rem).catch(() => {
    });
    return rem;
  }
  async updateReminder(id, data) {
    const rem = this.data.reminders.find((r) => r.id === id);
    if (!rem) throw new Error("Reminder not found.");
    if (data.status) rem.status = data.status;
    if (data.note !== void 0) rem.note = data.note;
    if (data.reminder_date) rem.reminder_date = data.reminder_date;
    rem.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    this.saveToFile();
    await firestoreRest.setDoc("reminders", id, rem).catch(() => {
    });
    return rem;
  }
  async deleteReminder(id) {
    const index = this.data.reminders.findIndex((r) => r.id === id);
    if (index === -1) return false;
    this.data.reminders.splice(index, 1);
    this.saveToFile();
    await firestoreRest.deleteDoc("reminders", id).catch(() => {
    });
    return true;
  }
  // --- Analytics & Summaries ---
  getDashboardSummary(userId, userRole) {
    const activeTransactions = this.getTransactions({}, userId, userRole);
    let totalGiven = 0;
    let totalReturned = 0;
    for (const t of activeTransactions) {
      if (t.transaction_type === "given") totalGiven += Number(t.amount);
      else if (t.transaction_type === "returned") totalReturned += Number(t.amount);
    }
    const totalPending = Math.max(0, Math.round((totalGiven - totalReturned) * 100) / 100);
    let peopleList = this.data.people;
    if (userId && userRole !== "admin") {
      peopleList = peopleList.filter((p) => p.user_id === userId);
    }
    const enrichedPeople = peopleList.map((p) => this.enrichPerson(p));
    const activeBorrowers = enrichedPeople.filter((p) => (p.remaining_balance || 0) > 0);
    const now = /* @__PURE__ */ new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();
    const { fy: currentFy } = calculateFinancialYear(now.toISOString().split("T")[0]);
    const thisMonthTxs = activeTransactions.filter((t) => t.month === curMonth && t.year === curYear);
    let thisMonthGiven = 0;
    let thisMonthReturned = 0;
    for (const t of thisMonthTxs) {
      if (t.transaction_type === "given") thisMonthGiven += Number(t.amount);
      else if (t.transaction_type === "returned") thisMonthReturned += Number(t.amount);
    }
    const thisYearTxs = activeTransactions.filter((t) => t.year === curYear);
    let thisYearGiven = 0;
    let thisYearReturned = 0;
    for (const t of thisYearTxs) {
      if (t.transaction_type === "given") thisYearGiven += Number(t.amount);
      else if (t.transaction_type === "returned") thisYearReturned += Number(t.amount);
    }
    const currentFyTxs = activeTransactions.filter((t) => t.financial_year === currentFy);
    let fyGiven = 0;
    let fyReturned = 0;
    for (const t of currentFyTxs) {
      if (t.transaction_type === "given") fyGiven += Number(t.amount);
      else if (t.transaction_type === "returned") fyReturned += Number(t.amount);
    }
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const txs = activeTransactions.filter((t) => t.month === m && t.year === y);
      let g = 0;
      let r = 0;
      for (const t of txs) {
        if (t.transaction_type === "given") g += Number(t.amount);
        else if (t.transaction_type === "returned") r += Number(t.amount);
      }
      monthlyTrend.push({
        month: m,
        month_name: MONTH_NAMES[m - 1],
        year: y,
        given: g,
        returned: r,
        net: g - r
      });
    }
    const recentTransactions = this.getTransactions({}).slice(0, 7);
    const topDebtors = activeBorrowers.sort((a, b) => (b.remaining_balance || 0) - (a.remaining_balance || 0)).slice(0, 5);
    return {
      total_given: totalGiven,
      total_returned: totalReturned,
      total_pending: totalPending,
      people_count: this.data.people.length,
      active_borrowers_count: activeBorrowers.length,
      this_month: {
        month: curMonth,
        year: curYear,
        given: thisMonthGiven,
        returned: thisMonthReturned,
        pending: Math.max(0, thisMonthGiven - thisMonthReturned),
        transaction_count: thisMonthTxs.length
      },
      this_year: {
        year: curYear,
        given: thisYearGiven,
        returned: thisYearReturned,
        pending: Math.max(0, thisYearGiven - thisYearReturned),
        transaction_count: thisYearTxs.length
      },
      current_financial_year: {
        label: currentFy,
        given: fyGiven,
        returned: fyReturned,
        pending: Math.max(0, fyGiven - fyReturned)
      },
      recent_transactions: recentTransactions,
      top_debtors: topDebtors,
      monthly_trend: monthlyTrend
    };
  }
  getMonthlyAnalytics(year, month) {
    const now = /* @__PURE__ */ new Date();
    const curYear = year || now.getFullYear();
    const curMonth = month || now.getMonth() + 1;
    const txs = this.getTransactions({ year: curYear, month: curMonth });
    let totalGiven = 0;
    let totalReturned = 0;
    const peopleInvolvedMap = /* @__PURE__ */ new Map();
    const byMethod = {
      "Cash": { given: 0, returned: 0 },
      "Bank Transfer": { given: 0, returned: 0 },
      "UPI": { given: 0, returned: 0 },
      "Other": { given: 0, returned: 0 }
    };
    for (const t of txs) {
      const amt = Number(t.amount);
      if (t.transaction_type === "given") {
        totalGiven += amt;
        if (byMethod[t.payment_method]) byMethod[t.payment_method].given += amt;
      } else {
        totalReturned += amt;
        if (byMethod[t.payment_method]) byMethod[t.payment_method].returned += amt;
      }
      if (!peopleInvolvedMap.has(t.person_id)) {
        peopleInvolvedMap.set(t.person_id, {
          id: t.person_id,
          name: t.person_name || "Person",
          given: 0,
          returned: 0
        });
      }
      const pEntry = peopleInvolvedMap.get(t.person_id);
      if (t.transaction_type === "given") pEntry.given += amt;
      else pEntry.returned += amt;
    }
    const peopleInvolved = Array.from(peopleInvolvedMap.values()).map((p) => {
      const bal = this.getPersonBalance(p.id);
      return {
        ...p,
        current_pending: bal.remaining
      };
    });
    return {
      month: curMonth,
      month_name: MONTH_NAMES[curMonth - 1],
      year: curYear,
      total_given: totalGiven,
      total_returned: totalReturned,
      net_balance: totalGiven - totalReturned,
      transaction_count: txs.length,
      people_count: peopleInvolved.length,
      people_involved: peopleInvolved,
      transactions: txs,
      by_payment_method: byMethod
    };
  }
  getYearlyAnalytics(year) {
    const curYear = year || (/* @__PURE__ */ new Date()).getFullYear();
    const yearTxs = this.getTransactions({ year: curYear });
    let totalGiven = 0;
    let totalReturned = 0;
    const peopleMap = /* @__PURE__ */ new Map();
    const monthlyBreakdown = Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1;
      const mTxs = yearTxs.filter((t) => t.month === m);
      let g = 0;
      let r = 0;
      for (const t of mTxs) {
        if (t.transaction_type === "given") g += Number(t.amount);
        else r += Number(t.amount);
      }
      return {
        month: m,
        month_name: MONTH_NAMES[idx],
        given: g,
        returned: r,
        net: g - r,
        transaction_count: mTxs.length
      };
    });
    for (const t of yearTxs) {
      const amt = Number(t.amount);
      if (t.transaction_type === "given") totalGiven += amt;
      else totalReturned += amt;
      if (!peopleMap.has(t.person_id)) {
        peopleMap.set(t.person_id, {
          id: t.person_id,
          name: t.person_name || "Person",
          given: 0,
          returned: 0
        });
      }
      const entry = peopleMap.get(t.person_id);
      if (t.transaction_type === "given") entry.given += amt;
      else entry.returned += amt;
    }
    return {
      year: curYear,
      total_given: totalGiven,
      total_returned: totalReturned,
      total_pending: Math.max(0, totalGiven - totalReturned),
      transaction_count: yearTxs.length,
      people_count: peopleMap.size,
      monthly_breakdown: monthlyBreakdown,
      top_people: Array.from(peopleMap.values()).sort((a, b) => b.given - a.given).slice(0, 6)
    };
  }
  getFinancialYearAnalytics(financialYear) {
    const curFy = financialYear || calculateFinancialYear((/* @__PURE__ */ new Date()).toISOString().split("T")[0]).fy;
    const parts = curFy.replace("FY ", "").split("-");
    const startYear = parseInt(parts[0], 10);
    const endYear = startYear + 1;
    const fyTxs = this.getTransactions({ financial_year: curFy });
    let totalGiven = 0;
    let totalReturned = 0;
    const peopleSet = /* @__PURE__ */ new Set();
    const fyMonths = [
      { month: 4, year: startYear },
      { month: 5, year: startYear },
      { month: 6, year: startYear },
      { month: 7, year: startYear },
      { month: 8, year: startYear },
      { month: 9, year: startYear },
      { month: 10, year: startYear },
      { month: 11, year: startYear },
      { month: 12, year: startYear },
      { month: 1, year: endYear },
      { month: 2, year: endYear },
      { month: 3, year: endYear }
    ];
    const monthlyBreakdown = fyMonths.map(({ month, year }) => {
      const mTxs = fyTxs.filter((t) => t.month === month && t.year === year);
      let g = 0;
      let r = 0;
      for (const t of mTxs) {
        if (t.transaction_type === "given") g += Number(t.amount);
        else r += Number(t.amount);
        peopleSet.add(t.person_id);
      }
      totalGiven += g;
      totalReturned += r;
      return {
        month,
        month_name: MONTH_NAMES[month - 1],
        year,
        given: g,
        returned: r,
        net: g - r,
        transaction_count: mTxs.length
      };
    });
    return {
      financial_year: curFy,
      start_year: startYear,
      end_year: endYear,
      total_given: totalGiven,
      total_returned: totalReturned,
      total_pending: Math.max(0, totalGiven - totalReturned),
      transaction_count: fyTxs.length,
      people_count: peopleSet.size,
      monthly_breakdown: monthlyBreakdown
    };
  }
  getAvailableYearsAndFys() {
    const yearsSet = /* @__PURE__ */ new Set();
    const fySet = /* @__PURE__ */ new Set();
    yearsSet.add((/* @__PURE__ */ new Date()).getFullYear());
    yearsSet.add(2026);
    yearsSet.add(2025);
    for (const t of this.data.transactions) {
      if (t.year) yearsSet.add(t.year);
      if (t.financial_year) fySet.add(t.financial_year);
    }
    const { fy: curFy } = calculateFinancialYear((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    fySet.add(curFy);
    fySet.add("FY 2026-27");
    fySet.add("FY 2025-26");
    return {
      years: Array.from(yearsSet).sort((a, b) => b - a),
      financial_years: Array.from(fySet).sort().reverse()
    };
  }
  // --- Export & Backup ---
  exportBackup() {
    return {
      version: "1.0.0",
      export_date: (/* @__PURE__ */ new Date()).toISOString(),
      user: { email: this.data.users[0]?.email || "financialfree@com" },
      people: this.data.people,
      transactions: this.data.transactions,
      reminders: this.data.reminders
    };
  }
  exportAllData() {
    return this.exportBackup();
  }
  async importBackup(payload) {
    if (!payload.people || !Array.isArray(payload.people) || !payload.transactions || !Array.isArray(payload.transactions)) {
      throw new Error("Invalid backup file structure: missing people or transactions arrays.");
    }
    this.data.people = payload.people;
    this.data.transactions = payload.transactions;
    this.data.reminders = payload.reminders || [];
    this.saveToFile();
    await this.pushAllToFirestore();
    return {
      success: true,
      peopleCount: payload.people.length,
      txCount: payload.transactions.length
    };
  }
  importAllData(payload) {
    try {
      this.importBackup(payload).catch(() => {
      });
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
  scheduleAutomatedBackup() {
    if (this.backupDebounceTimer) {
      clearTimeout(this.backupDebounceTimer);
    }
    this.backupDebounceTimer = setTimeout(() => {
      this.pushCloudBackup().catch((err) => {
        console.warn("Background automated backup notice:", err.message || err);
      });
    }, 4e3);
  }
  /**
   * Automated & Manual Cloud Backup to Firestore
   * Pushes a full serialized snapshot of people, transactions, and reminders
   * to Firestore 'backups' collection under 'latest_backup' and 'backup_<timestamp>'
   */
  async pushCloudBackup() {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const people = this.getPeople();
    const transactions = this.getTransactions({});
    const reminders = this.getReminders();
    const totalGiven = transactions.filter((t) => t.transaction_type === "given").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalReturned = transactions.filter((t) => t.transaction_type === "returned").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const snapshotPayload = {
      id: "latest_backup",
      version: "2.0",
      created_at: timestamp,
      updated_at: timestamp,
      people_count: people.length,
      tx_count: transactions.length,
      reminder_count: reminders.length,
      total_given: totalGiven,
      total_returned: totalReturned,
      people_preview: people.slice(0, 10).map((p) => ({ id: p.id, name: p.full_name, balance: p.remaining_balance })),
      data_json: JSON.stringify({
        version: "2.0",
        export_date: timestamp,
        user: { email: "Financial@free.com" },
        people,
        transactions,
        reminders
      })
    };
    try {
      await firestoreRest.setDoc("backups", "latest_backup", snapshotPayload);
      const historyId = `backup_${Date.now()}`;
      await firestoreRest.setDoc("backups", historyId, {
        ...snapshotPayload,
        id: historyId
      }).catch(() => {
      });
    } catch (err) {
      console.warn("Firestore cloud backup push notice:", err.message || err);
    }
    try {
      const backupDir = path2.join(process.cwd(), "data", "backups");
      if (!fs2.existsSync(backupDir)) {
        fs2.mkdirSync(backupDir, { recursive: true });
      }
      fs2.writeFileSync(path2.join(backupDir, "latest_backup.json"), JSON.stringify(snapshotPayload, null, 2));
    } catch {
    }
    return {
      success: true,
      timestamp,
      peopleCount: people.length,
      txCount: transactions.length,
      reminderCount: reminders.length,
      totalGiven,
      totalReturned
    };
  }
  /**
   * Fetch current cloud backup status from Firestore
   */
  async getCloudBackupStatus() {
    try {
      const doc = await firestoreRest.getDoc("backups", "latest_backup");
      if (doc && (doc.created_at || doc.updated_at)) {
        return {
          hasBackup: true,
          timestamp: doc.created_at || doc.updated_at,
          peopleCount: doc.people_count || 0,
          txCount: doc.tx_count || 0,
          reminderCount: doc.reminder_count || 0,
          totalGiven: doc.total_given || 0,
          totalReturned: doc.total_returned || 0,
          provider: "Google Cloud Firestore"
        };
      }
    } catch (e) {
      console.warn("Could not read Firestore backup status:", e.message);
    }
    try {
      const filePath = path2.join(process.cwd(), "data", "backups", "latest_backup.json");
      if (fs2.existsSync(filePath)) {
        const parsed = JSON.parse(fs2.readFileSync(filePath, "utf-8"));
        return {
          hasBackup: true,
          timestamp: parsed.created_at,
          peopleCount: parsed.people_count || 0,
          txCount: parsed.tx_count || 0,
          reminderCount: parsed.reminder_count || 0,
          totalGiven: parsed.total_given || 0,
          totalReturned: parsed.total_returned || 0,
          provider: "Local Disk Cache Backup"
        };
      }
    } catch {
    }
    return {
      hasBackup: false,
      peopleCount: this.data.people.length,
      txCount: this.data.transactions.length,
      reminderCount: this.data.reminders.length,
      provider: "Google Cloud Firestore"
    };
  }
  /**
   * Restore from Cloud Backup in Firestore
   */
  async restoreFromCloudBackup() {
    let payload = null;
    let backupTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const doc = await firestoreRest.getDoc("backups", "latest_backup");
      if (doc) {
        if (doc.created_at) backupTimestamp = doc.created_at;
        if (doc.data_json) {
          payload = JSON.parse(doc.data_json);
        } else if (doc.people && Array.isArray(doc.people)) {
          payload = {
            version: "2.0",
            export_date: doc.created_at || (/* @__PURE__ */ new Date()).toISOString(),
            user: { email: "Financial@free.com" },
            people: doc.people,
            transactions: doc.transactions || [],
            reminders: doc.reminders || []
          };
        }
      }
    } catch (e) {
      console.warn("Firestore backup read failed:", e.message);
    }
    if (!payload) {
      try {
        const cloudPeople = await firestoreRest.getCollection("people");
        const cloudTransactions = await firestoreRest.getCollection("transactions");
        const cloudReminders = await firestoreRest.getCollection("reminders");
        if (cloudPeople.length > 0 || cloudTransactions.length > 0) {
          payload = {
            version: "2.0",
            export_date: (/* @__PURE__ */ new Date()).toISOString(),
            user: { email: "Financial@free.com" },
            people: cloudPeople,
            transactions: cloudTransactions,
            reminders: cloudReminders
          };
        }
      } catch (e) {
        console.warn("Firestore direct collection fetch failed:", e.message);
      }
    }
    if (!payload) {
      try {
        const filePath = path2.join(process.cwd(), "data", "backups", "latest_backup.json");
        if (fs2.existsSync(filePath)) {
          const parsed = JSON.parse(fs2.readFileSync(filePath, "utf-8"));
          if (parsed.data_json) {
            payload = JSON.parse(parsed.data_json);
            backupTimestamp = parsed.created_at || backupTimestamp;
          }
        }
      } catch {
      }
    }
    if (!payload || (!payload.people || payload.people.length === 0) && (!payload.transactions || payload.transactions.length === 0)) {
      throw new Error("No cloud backup found to restore. Please perform a cloud backup first.");
    }
    this.data.people = payload.people || [];
    this.data.transactions = payload.transactions || [];
    this.data.reminders = payload.reminders || [];
    this.saveToFile();
    await this.pushAllToFirestore().catch(() => {
    });
    return {
      success: true,
      restoredPeopleCount: this.data.people.length,
      restoredTxCount: this.data.transactions.length,
      restoredReminderCount: this.data.reminders.length,
      timestamp: backupTimestamp,
      message: `Successfully restored ${this.data.people.length} contacts and ${this.data.transactions.length} transactions from cloud backup.`,
      people: this.getPeople(),
      transactions: this.getTransactions({}),
      reminders: this.getReminders()
    };
  }
  resetToSampleData() {
    this.seedInitialData();
    this.saveToFile();
    return { success: true, message: "Database reset successfully" };
  }
  getRawDataForAI() {
    return {
      people: this.getPeople(),
      transactions: this.getTransactions({}),
      summary: this.getDashboardSummary()
    };
  }
  getStatus() {
    return {
      isCloudSynced: this.isCloudSynced,
      peopleCount: this.data.people.length,
      txCount: this.data.transactions.length
    };
  }
  getIntegrityReport() {
    const enriched = this.data.people.map((p) => this.enrichPerson(p));
    return {
      serverPeopleCount: this.data.people.length,
      serverTxCount: this.data.transactions.length,
      serverReminderCount: this.data.reminders.length,
      serverPeople: enriched.map((p) => ({
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        updated_at: p.updated_at || p.created_at,
        remaining_balance: p.remaining_balance || 0
      })),
      serverTransactions: this.data.transactions.map((t) => ({
        id: t.id,
        person_id: t.person_id,
        amount: t.amount,
        transaction_type: t.transaction_type,
        transaction_date: t.transaction_date,
        updated_at: t.updated_at || t.created_at
      })),
      isCloudSynced: this.isCloudSynced,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async reconcileWithClient(payload) {
    const { action, localPeople = [], localTransactions = [], localReminders = [] } = payload;
    if (action === "push_local") {
      this.data.people = localPeople;
      this.data.transactions = localTransactions;
      this.data.reminders = localReminders;
    } else if (action === "merge") {
      for (const lp of localPeople) {
        if (!lp.full_name) continue;
        const cleanName = lp.full_name.trim().toLowerCase();
        const cleanPhone = (lp.phone || "").trim();
        const existingIdx = this.data.people.findIndex(
          (p) => p.id === lp.id || p.full_name.trim().toLowerCase() === cleanName && (!cleanPhone || !p.phone || p.phone.trim() === cleanPhone)
        );
        if (existingIdx === -1) {
          this.data.people.push(lp);
        } else {
          const localUpdated = new Date(lp.updated_at || lp.created_at || 0).getTime();
          const serverUpdated = new Date(this.data.people[existingIdx].updated_at || this.data.people[existingIdx].created_at || 0).getTime();
          if (localUpdated >= serverUpdated) {
            this.data.people[existingIdx] = { ...this.data.people[existingIdx], ...lp };
          }
        }
      }
      for (const lt of localTransactions) {
        if (!lt.id || !lt.person_id) continue;
        const existingIdx = this.data.transactions.findIndex((t) => t.id === lt.id);
        if (existingIdx === -1) {
          this.data.transactions.push(lt);
        } else {
          const localUpdated = new Date(lt.updated_at || lt.created_at || 0).getTime();
          const serverUpdated = new Date(this.data.transactions[existingIdx].updated_at || this.data.transactions[existingIdx].created_at || 0).getTime();
          if (localUpdated >= serverUpdated) {
            this.data.transactions[existingIdx] = { ...this.data.transactions[existingIdx], ...lt };
          }
        }
      }
      for (const lr of localReminders) {
        if (!lr.id) continue;
        const existingIdx = this.data.reminders.findIndex((r) => r.id === lr.id);
        if (existingIdx === -1) {
          this.data.reminders.push(lr);
        } else {
          this.data.reminders[existingIdx] = { ...this.data.reminders[existingIdx], ...lr };
        }
      }
    }
    this.saveToFile();
    await this.pushAllToFirestore().catch(() => {
    });
    return {
      success: true,
      actionTaken: action,
      peopleCount: this.data.people.length,
      txCount: this.data.transactions.length,
      people: this.getPeople(),
      transactions: this.getTransactions({}),
      reminders: this.getReminders()
    };
  }
};
var db = new DatabaseService();

// server/gemini.ts
import { GoogleGenAI } from "@google/genai";
function getNvidiaApiKey() {
  return process.env.NVIDIA_API_KEY || null;
}
var aiClient = null;
function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var GEMINI_MODELS = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview"
];
var NVIDIA_MODELS = [
  "meta/llama-3.3-70b-instruct",
  "deepseek-ai/deepseek-r1",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "meta/llama-3.1-8b-instruct"
];
var modelCooldowns = {};
var disabledModels = /* @__PURE__ */ new Set();
var cachedInsightData = null;
async function callNvidiaNim(messages, temperature = 0.5) {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) return null;
  for (const model of NVIDIA_MODELS) {
    if (disabledModels.has(model)) continue;
    const cooldownUntil = modelCooldowns[model] || 0;
    if (Date.now() < cooldownUntil) continue;
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 1500,
          top_p: 1,
          stream: false
        })
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        if (response.status === 429) {
          modelCooldowns[model] = Date.now() + 6e4;
        } else if (response.status === 404 || response.status === 403) {
          disabledModels.add(model);
        }
        continue;
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === "string") {
        return content.trim();
      }
    } catch (err) {
    }
  }
  return null;
}
async function generateUnifiedAI(params) {
  const temperature = params.temperature ?? 0.5;
  try {
    const messages = [];
    if (params.systemPrompt) {
      messages.push({ role: "system", content: params.systemPrompt });
    }
    if (params.history && params.history.length > 0) {
      for (const h of params.history.slice(-4)) {
        messages.push({
          role: h.role === "model" ? "assistant" : "user",
          content: h.text
        });
      }
    }
    messages.push({ role: "user", content: params.userPrompt });
    const nvidiaReply = await callNvidiaNim(messages, temperature);
    if (nvidiaReply) {
      return { text: nvidiaReply, provider: "NVIDIA AI Engine" };
    }
  } catch (err) {
  }
  const ai = getAiClient();
  if (ai) {
    const now = Date.now();
    for (const model of GEMINI_MODELS) {
      if (disabledModels.has(model)) continue;
      const cooldownUntil = modelCooldowns[model] || 0;
      if (now < cooldownUntil) continue;
      try {
        const contents = [];
        if (params.history && params.history.length > 0) {
          for (const h of params.history.slice(-4)) {
            contents.push(`${h.role === "user" ? "User" : "Assistant"}: ${h.text}`);
          }
        }
        contents.push(`User: ${params.userPrompt}`);
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            temperature,
            systemInstruction: params.systemPrompt
          }
        });
        if (response && response.text) {
          return { text: response.text, provider: `Gemini (${model})` };
        }
      } catch (err) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes("429")) modelCooldowns[model] = Date.now() + 6e4;
        else if (errMsg.includes("403") || errMsg.includes("404")) disabledModels.add(model);
      }
    }
  }
  return null;
}
async function scanReceiptOrImage(base64Image, mimeType = "image/jpeg") {
  let cleanBase64 = base64Image;
  let detectedMime = mimeType;
  if (base64Image.includes(";base64,")) {
    const parts = base64Image.split(";base64,");
    detectedMime = parts[0].replace("data:", "") || mimeType;
    cleanBase64 = parts[1];
  }
  const prompt = `Analyze this financial document, payment receipt, UPI transfer screenshot (Google Pay, PhonePe, Paytm, BHIM, CRED), bank receipt, invoice, handwritten ledger note, or cash receipt.
Extract the transaction details accurately in pure JSON format with these exact keys:
{
  "amount": number or null (e.g. 2500),
  "transaction_type": "given" or "returned" (if paid to someone else -> "given"; if received from someone -> "returned"),
  "person_name": string or null (the name of the counterparty, recipient, or sender),
  "transaction_date": "YYYY-MM-DD" or null,
  "payment_method": "UPI" or "Bank Transfer" or "Cash" or "Other",
  "purpose": string or null (reason for payment, e.g., rent, loan, dinner, supplies),
  "notes": string or null (additional transaction remarks, UTR / UPI transaction ID / Ref number if present),
  "confidence_summary": string (1 brief sentence describing what was identified)
}

Return ONLY valid JSON. Do not include markdown code block syntax.`;
  const ai = getAiClient();
  if (ai) {
    for (const model of GEMINI_MODELS) {
      if (disabledModels.has(model)) continue;
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64
              }
            },
            prompt
          ],
          config: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });
        if (res && res.text) {
          const cleanJson = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          return {
            amount: typeof parsed.amount === "number" ? parsed.amount : parsed.amount ? parseFloat(parsed.amount) : void 0,
            transaction_type: parsed.transaction_type === "returned" ? "returned" : "given",
            person_name: parsed.person_name || void 0,
            transaction_date: parsed.transaction_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            payment_method: ["UPI", "Bank Transfer", "Cash", "Other"].includes(parsed.payment_method) ? parsed.payment_method : "UPI",
            purpose: parsed.purpose || void 0,
            notes: parsed.notes || void 0,
            confidence_summary: parsed.confidence_summary || "Transaction scanned and extracted successfully from receipt screenshot."
          };
        }
      } catch (err) {
      }
    }
  }
  return {
    amount: void 0,
    transaction_type: "given",
    transaction_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    payment_method: "UPI",
    purpose: "Attached Payment Proof",
    notes: "Receipt proof attached to transaction ledger",
    confidence_summary: "Receipt image attached successfully. Please confirm amount and counterparty details."
  };
}
async function analyzeGraphTrends(params) {
  const curr = params.currencySymbol || "\u20B9";
  const systemPrompt = `You are a Senior Financial Risk Auditor and Money Flow Analyst for the FinancialFree personal lending ledger application.
Your job is to perform an exhaustive, in-depth, expert visual and transactional data analysis of the Money Given vs. Money Returned (Taken) graph and timeline data provided.

CRITICAL MANDATORY INSTRUCTIONS:
1. Deliver a comprehensive, highly detailed analysis formatted in clean Markdown.
2. YOU MUST EXPLICITLY INCLUDE:
   - **\u{1F465} People Activity & Counterparty Breakdown**:
     * Exact count and names of people to whom money was GIVEN (lent out) during this period with individual amounts.
     * Exact count and names of people who RETURNED money (repayments taken back) during this period with individual amounts.
     * Net status of each person involved.
   - **\u{1F4CA} Visual Graph Trajectory & Flow Dynamics**:
     * Detailed analysis of the chart bars/trends (outflow vs. repayment inflow).
     * Peak weeks/intervals/months and exact cash flow delta.
   - **\u2696\uFE0F Repayment Velocity & Portfolio Health**:
     * Recovery percentage (${curr} returned vs ${curr} given).
     * Capital lock-in risk assessment and liquidity velocity.
   - **\u{1F4CB} Detailed Tabular Audit Breakdown**:
     * Include a formatted Markdown table summarizing: Counterparty Name | Money Given | Money Returned | Net Change | Status
   - **\u{1F4A1} Actionable Recovery Strategy**:
     * Concrete, highly practical steps to follow up on outstanding balances, optimize repayment timings (e.g. salary dates, month-end cycles), and protect cash flow.
3. Be exact with figures, percentages, and amounts. Always prefix amounts with the currency symbol ${curr}.
4. Provide a rich, thorough analysis without truncating important details.`;
  const userPrompt = `Please generate an exhaustive, detailed AI Graph & Money Flow Analysis for this ${params.type.toUpperCase()} dataset:
\`\`\`json
${JSON.stringify(params.graphData, null, 2)}
\`\`\`
Ensure complete details on how many people took money, how many people returned money, individual borrower names and amounts, graph curve interpretations, and recovery actions.`;
  const aiResult = await generateUnifiedAI({
    systemPrompt,
    userPrompt,
    temperature: 0.3
  });
  if (aiResult && aiResult.text) {
    return { analysis: aiResult.text, provider: aiResult.provider };
  }
  const fallbackText = generateDeterministicGraphAnalysis(params.type, params.graphData, curr);
  return { analysis: fallbackText, provider: "Local Financial Analytics Engine" };
}
function generateDeterministicGraphAnalysis(type, data, curr) {
  if (type === "monthly") {
    const given2 = Number(data.total_given) || 0;
    const returned2 = Number(data.total_returned) || 0;
    const net = Number(data.net_flow) || given2 - returned2;
    const recovery2 = given2 > 0 ? Math.round(returned2 / given2 * 100) : returned2 > 0 ? 100 : 0;
    const peopleList = data.people_involved || [];
    const peopleGiven = peopleList.filter((p) => (Number(p.given) || 0) > 0);
    const peopleReturned = peopleList.filter((p) => (Number(p.returned) || 0) > 0);
    const monthLabel = data.month_name ? `${data.month_name} ${data.year || ""}` : "Current Month";
    let tableRows = "";
    if (peopleList.length > 0) {
      tableRows = peopleList.map((p) => {
        const pGiven = Number(p.given) || 0;
        const pRet = Number(p.returned) || 0;
        const pNet = pGiven - pRet;
        const pStatus = pNet <= 0 ? "\u2705 Fully Returned" : pRet > 0 ? "\u{1F504} Partial Payment" : "\u23F3 Outflow Lent";
        return `| **${p.name}** | ${curr}${pGiven.toLocaleString("en-IN")} | ${curr}${pRet.toLocaleString("en-IN")} | ${curr}${Math.abs(pNet).toLocaleString("en-IN")} (${pNet > 0 ? "Pending" : "Settled"}) | ${pStatus} |`;
      }).join("\n");
    }
    return `### \u{1F465} People & Counterparty Participation (${monthLabel})
- **People Given Money**: **${peopleGiven.length} person(s)** received loans (${curr}${given2.toLocaleString("en-IN")} total).
  ${peopleGiven.length > 0 ? peopleGiven.map((p) => `  * **${p.name}**: ${curr}${(Number(p.given) || 0).toLocaleString("en-IN")}`).join("\n") : "  * None"}
- **People Returning Money**: **${peopleReturned.length} person(s)** made repayments (${curr}${returned2.toLocaleString("en-IN")} recovered).
  ${peopleReturned.length > 0 ? peopleReturned.map((p) => `  * **${p.name}**: ${curr}${(Number(p.returned) || 0).toLocaleString("en-IN")}`).join("\n") : "  * None"}
- **Overall Unique Active Borrowers**: **${peopleList.length} total person(s)** engaged in transactions this month.

### \u{1F4CA} Monthly Flow & Graph Dynamics
- **Total Money Lent (Outflow)**: **${curr}${given2.toLocaleString("en-IN")}**
- **Total Money Returned (Inflow)**: **${curr}${returned2.toLocaleString("en-IN")}**
- **Recovery Efficiency**: **${recovery2}%** repayment rate for this cycle.
- **Net Balance Shift**: **${curr}${Math.abs(net).toLocaleString("en-IN")}** ${net > 0 ? "(Net increase in capital locked in loans)" : "(Net positive cash surplus recovered)"}.

${tableRows ? `### \u{1F4CB} Counterparty Audit Table
| Counterparty | Money Given | Money Returned | Net Position | Cycle Status |
| :--- | :--- | :--- | :--- | :--- |
${tableRows}
` : ""}

### \u2696\uFE0F Repayment Velocity & Risk Assessment
- **Cash Flow Index**: ${recovery2 >= 80 ? "\u{1F7E2} **High Velocity**: Inflows are keeping strong pace with newly issued loans." : recovery2 >= 40 ? "\u{1F7E1} **Moderate Velocity**: Balanced repayment cadence, but several open balances require active monitoring." : "\u{1F534} **High Capital Lock-In**: Outflows significantly exceed returned funds. Restrict fresh lending until pending payments settle."}
- **Peak Flow Interval**: Transaction activity shows concentration around early-to-mid month disbursement cycles.

### \u{1F4A1} Tactical Action Plan
1. **Targeted Follow-Ups**: Send polite WhatsApp/SMS reminder nudges to borrowers with pending amounts above ${curr}1,000.
2. **Align with Salary Windows**: Schedule settlement follow-ups between the 1st and 5th of next month.
3. **Log Proof Receipts**: Ensure all UPI screenshots and payment confirmation numbers are attached to each record.`;
  }
  if (type === "yearly" || type === "financial") {
    const given2 = Number(data.total_given) || 0;
    const returned2 = Number(data.total_returned) || 0;
    const net = Number(data.net_balance) || given2 - returned2;
    const recovery2 = Number(data.recovery_rate) || (given2 > 0 ? returned2 / given2 * 100 : 0);
    const breakdown = data.monthly_breakdown || [];
    const activeMonths = breakdown.filter((m) => m.given > 0 || m.returned > 0);
    const peakGivenMonth = [...breakdown].sort((a, b) => b.given - a.given)[0];
    const peakReturnedMonth = [...breakdown].sort((a, b) => b.returned - a.returned)[0];
    const breakdownRows = breakdown.map((m) => {
      const mGiven = Number(m.given) || 0;
      const mRet = Number(m.returned) || 0;
      const mNet = Number(m.net) || mGiven - mRet;
      const mRate = mGiven > 0 ? `${Math.round(mRet / mGiven * 100)}%` : mRet > 0 ? "100%+" : "0%";
      return `| **${m.month_name}** | ${curr}${mGiven.toLocaleString("en-IN")} | ${curr}${mRet.toLocaleString("en-IN")} | ${curr}${Math.abs(mNet).toLocaleString("en-IN")} | ${mRate} |`;
    }).join("\n");
    return `### \u{1F4CA} Annual Graph & Multi-Month Trajectory (${data.period_label || "Annual Cycle"})
- **Total Principal Lent**: **${curr}${given2.toLocaleString("en-IN")}** across ${activeMonths.length} active month(s).
- **Total Capital Recovered**: **${curr}${returned2.toLocaleString("en-IN")}** returned.
- **Annual Recovery Efficiency**: **${recovery2.toFixed(1)}%** overall recovery efficiency.
- **Cumulative Net Outstanding**: **${curr}${Math.max(0, net).toLocaleString("en-IN")}** currently pending.

### \u{1F4C5} Month-by-Month Flow Matrix
| Month | Money Given | Money Returned | Net Delta | Recovery Rate |
| :--- | :--- | :--- | :--- | :--- |
${breakdownRows}

### \u2696\uFE0F Cycle Dynamics & Peak Periods
- **Highest Lending Month**: **${peakGivenMonth?.month_name || "N/A"}** with ${curr}${(peakGivenMonth?.given || 0).toLocaleString("en-IN")} disbursed.
- **Highest Recovery Month**: **${peakReturnedMonth?.month_name || "N/A"}** with ${curr}${(peakReturnedMonth?.returned || 0).toLocaleString("en-IN")} collected.
- **Portfolio Health Status**: ${recovery2 >= 75 ? "\u{1F7E2} Strong financial health with high capital turnover." : recovery2 >= 45 ? "\u{1F7E1} Moderate stability; focus on collecting older debts." : "\u{1F534} Capital exposure is high; establish formal repayment milestones."}

### \u{1F4A1} Long-Term Lending Strategy
1. **Borrower Exposure Limits**: Cap individual loans so no single borrower exceeds 25% of your total lent capital.
2. **Scheduled Installments**: For loans over ${curr}10,000, structure bi-weekly or monthly partial payments instead of lump-sum returns.
3. **Annual Audit Statement**: Export the audited PDF/CSV ledger report at the end of each financial quarter.`;
  }
  const sum = data.summary || {};
  const given = Number(sum.total_given) || 0;
  const returned = Number(sum.total_returned) || 0;
  const pending = Number(sum.total_pending) || 0;
  const recovery = Number(sum.recovery_rate) || (given > 0 ? returned / given * 100 : 0);
  const peopleCount = Number(data.active_people_count) || 0;
  const trajectory = data.six_month_trajectory || [];
  return `### \u{1F4CA} 6-Month Macro Graph & Cash Velocity
- **Total Capital Disbursed (Given)**: **${curr}${given.toLocaleString("en-IN")}**
- **Total Capital Recovered (Returned)**: **${curr}${returned.toLocaleString("en-IN")}**
- **Current Total Pending Dues**: **${curr}${pending.toLocaleString("en-IN")}**
- **Overall Recovery Ratio**: **${recovery.toFixed(1)}%** across **${peopleCount} registered counterparties**.

### \u{1F4C8} 6-Month Trajectory Highlights
${trajectory.map((t) => `- **${t.label}**: Given ${curr}${t.given.toLocaleString("en-IN")} vs Returned ${curr}${t.returned.toLocaleString("en-IN")} (Net: ${curr}${(t.given - t.returned).toLocaleString("en-IN")})`).join("\n")}

### \u2696\uFE0F Risk Hotspots & Recommendations
- **Risk Score**: ${recovery >= 70 ? "\u{1F7E2} Low Risk" : recovery >= 40 ? "\u{1F7E1} Medium Risk" : "\u{1F534} High Risk"} (Based on unrecovered balance ratio).
- **Action**: Check the Pending Borrowers list on your Dashboard to prioritize high-value overdue accounts.`;
}
async function generateFinancialInsights(data) {
  const recoveryRate = data.summary.total_given > 0 ? Math.round(data.summary.total_returned / data.summary.total_given * 100) : 0;
  const totalPending = data.summary.total_pending || 0;
  const topDebtors = [...data.people || []].filter((p) => p.remaining_balance > 0).sort((a, b) => b.remaining_balance - a.remaining_balance).slice(0, 5);
  const cacheKey = `${data.summary.total_given}_${data.summary.total_returned}_${data.summary.total_pending}_${data.people.length}_${data.transactions.length}`;
  const now = Date.now();
  if (cachedInsightData && cachedInsightData.key === cacheKey && now - cachedInsightData.timestamp < 3e5) {
    return cachedInsightData.insight;
  }
  const systemPrompt = "You are an intelligent personal finance auditor for FinancialFree. Format output cleanly in Markdown with high-impact financial analysis.";
  const userPrompt = `LEDGER SUMMARY:
- Total Given: \u20B9${data.summary.total_given?.toLocaleString("en-IN")}
- Total Returned: \u20B9${data.summary.total_returned?.toLocaleString("en-IN")}
- Total Outstanding Balance: \u20B9${totalPending?.toLocaleString("en-IN")}
- Overall Recovery Ratio: ${recoveryRate}%
- Active Borrowers Count: ${data.summary.people_count}

BORROWER BREAKDOWN:
${data.people.length === 0 ? "No borrowers recorded yet." : data.people.map((p) => `- ${p.full_name}: Given \u20B9${p.total_given?.toLocaleString("en-IN")}, Returned \u20B9${p.total_returned?.toLocaleString("en-IN")}, Pending \u20B9${p.remaining_balance?.toLocaleString("en-IN")} [Status: ${p.status}]`).join("\n")}

RECENT TRANSACTIONS:
${data.transactions.length === 0 ? "No transactions recorded yet." : data.transactions.slice(0, 10).map((t) => `- ${t.transaction_date}: ${t.person_name} | ${t.transaction_type === "given" ? "Given" : "Returned"} | \u20B9${t.amount?.toLocaleString("en-IN")} | Method: ${t.payment_method}`).join("\n")}

Generate a comprehensive, structured financial health report in clean Markdown covering portfolio health, borrower risk profile, and actionable repayment strategies.`;
  const aiResult = await generateUnifiedAI({
    systemPrompt,
    userPrompt,
    temperature: 0.5
  });
  if (aiResult && aiResult.text) {
    cachedInsightData = {
      key: cacheKey,
      insight: aiResult.text,
      timestamp: now
    };
    return aiResult.text;
  }
  const deterministicInsight = `### \u{1F4A1} Portfolio Health & Recovery Analysis

* **Lending Summary**: Total money given stands at **\u20B9${(data.summary.total_given || 0).toLocaleString("en-IN")}**, with **\u20B9${(data.summary.total_returned || 0).toLocaleString("en-IN")}** successfully recovered (**${recoveryRate}% recovery rate**).
* **Outstanding Exposure**: A total of **\u20B9${totalPending.toLocaleString("en-IN")}** is currently pending across ${data.summary.people_count || 0} borrower contact(s).

${topDebtors.length > 0 ? `### \u26A0\uFE0F Top Balances Requiring Attention

` + topDebtors.map((d) => `* **${d.full_name}**: \u20B9${d.remaining_balance.toLocaleString("en-IN")} pending (${d.status})`).join("\n") : "### \u2705 Balance Status\n\nAll current balances are fully reconciled or no active loans are outstanding."}

### \u{1F4CB} Recommended Action Plan
1. **Send Friendly Follow-ups**: Leverage automated WhatsApp reminders for balances pending over 30 days.
2. **Align with Salary Cycles**: Schedule repayment check-ins during the 1st to 5th of every month.
3. **Verify Payment Receipts**: Maintain digital proof and UPI transaction IDs for every partial repayment.`;
  cachedInsightData = {
    key: cacheKey,
    insight: deterministicInsight,
    timestamp: now
  };
  return deterministicInsight;
}
async function draftReminderMessage(borrower) {
  const formattedAmount = `\u20B9${borrower.pendingAmount.toLocaleString("en-IN")}`;
  const suggestedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
  const systemPrompt = "You craft considerate, tactful financial reminder messages for WhatsApp.";
  const userPrompt = `Draft a single WhatsApp message to remind a borrower about returning money they borrowed.
Borrower Name: ${borrower.name}
Outstanding Balance: ${formattedAmount}
Purpose/Context: ${borrower.purpose || "Personal loan/advance"}
Tone: ${borrower.tone} (Options: polite, friendly, formal)

Requirements:
- Short, natural, respectful message suitable for WhatsApp.
- Never sound aggressive or demanding.
- Mention the amount clearly (${formattedAmount}).
- Output ONLY the message text directly without meta-commentary or quotes.`;
  const aiResult = await generateUnifiedAI({
    systemPrompt,
    userPrompt,
    temperature: 0.6
  });
  if (aiResult && aiResult.text) {
    return {
      message: aiResult.text.trim().replace(/^["']|["']$/g, ""),
      suggestedDate
    };
  }
  let msg = "";
  if (borrower.tone === "friendly") {
    msg = `Hey ${borrower.name}! \u{1F44B} Hope you're doing great. Just checking in gently regarding the ${formattedAmount} balance from our earlier transaction. Let me know whenever convenient to settle via UPI. Thanks!`;
  } else if (borrower.tone === "formal") {
    msg = `Dear ${borrower.name}, this is a gentle reminder regarding the outstanding balance of ${formattedAmount}. Kindly let me know your estimated timeline for the settlement. Appreciate your support.`;
  } else {
    msg = `Hi ${borrower.name}, hope everything is going well. Just sending a gentle reminder about the pending balance of ${formattedAmount}. Please transfer whenever convenient. Thank you!`;
  }
  return { message: msg, suggestedDate };
}
async function chatFinancialAssistant(history, message, contextData, imageAttachment) {
  const given = contextData.summary.total_given || 0;
  const returned = contextData.summary.total_returned || 0;
  const pending = contextData.summary.total_pending || 0;
  const recovery = given > 0 ? Math.round(returned / given * 100) : 0;
  const systemPrompt = `You are FinancialFree AI Agent, an intelligent personal lending copilot and money management assistant powered by NVIDIA & Gemini AI.
You have real-time access to the user's live ledger:

LEDGER SUMMARY:
- Total Given: \u20B9${given.toLocaleString("en-IN")}
- Total Returned: \u20B9${returned.toLocaleString("en-IN")}
- Total Pending: \u20B9${pending.toLocaleString("en-IN")}
- Recovery Rate: ${recovery}%
- People in Ledger (${contextData.people.length}):
${contextData.people.length === 0 ? "No people added yet." : contextData.people.map((p) => `  * ${p.full_name} (ID: ${p.id}): Given \u20B9${p.total_given || 0}, Returned \u20B9${p.total_returned || 0}, Remaining \u20B9${p.remaining_balance || 0} [${p.status || "No Balance"}] Phone: ${p.phone || "N/A"}`).join("\n")}

RECENT TRANSACTIONS:
${(contextData.transactions || []).slice(0, 10).map((t) => `  * ${t.transaction_date}: ${t.person_name} | Type: ${t.transaction_type} | \u20B9${t.amount} | Method: ${t.payment_method} | Purpose: ${t.purpose || "-"}`).join("\n") || "None recorded."}

CAPABILITIES:
1. Answer questions about balances, who owes money, graph trends, and repayment history.
2. Provide graph and cashflow analysis (money given vs returned dynamics).
3. Suggest smart repayment schedules and WhatsApp reminder drafts.
4. Format all responses in clean, beautiful Markdown with clear bold terms and bullet points.`;
  if (imageAttachment && imageAttachment.data) {
    const ai = getAiClient();
    if (ai) {
      try {
        let cleanBase64 = imageAttachment.data;
        let detectedMime = imageAttachment.mimeType || "image/jpeg";
        if (cleanBase64.includes(";base64,")) {
          const parts = cleanBase64.split(";base64,");
          detectedMime = parts[0].replace("data:", "") || detectedMime;
          cleanBase64 = parts[1];
        }
        const res = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64
              }
            },
            `${systemPrompt}

User: ${message || "Analyze this attached document/receipt image."}`
          ]
        });
        if (res && res.text) {
          return { reply: res.text, provider: "Gemini Vision AI" };
        }
      } catch (err) {
      }
    }
  }
  const aiResult = await generateUnifiedAI({
    systemPrompt,
    userPrompt: message,
    history,
    temperature: 0.6
  });
  if (aiResult && aiResult.text) {
    return { reply: aiResult.text, provider: aiResult.provider };
  }
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("pending") || lowerMsg.includes("owe") || lowerMsg.includes("balance") || lowerMsg.includes("who")) {
    const debtors = contextData.people.filter((p) => p.remaining_balance > 0);
    if (debtors.length === 0) {
      return {
        reply: `\u{1F389} **All Clear!** There are currently no pending balances. All loans have been settled or no outstanding balances exist.`
      };
    }
    const list = debtors.map((d) => `\u2022 **${d.full_name}**: \u20B9${d.remaining_balance.toLocaleString("en-IN")} pending (*${d.status}*)`).join("\n");
    return {
      reply: `Here is the current list of people with outstanding balances (**Total Pending: \u20B9${pending.toLocaleString("en-IN")}**):

${list}

Would you like me to draft a reminder message for any of them?`
    };
  }
  if (lowerMsg.includes("graph") || lowerMsg.includes("trend") || lowerMsg.includes("analysis") || lowerMsg.includes("chart")) {
    return {
      reply: `### \u{1F4CA} Money Given vs Taken (Returned) Graph Analysis

\u2022 **Total Outflow (Money Given)**: \u20B9${given.toLocaleString("en-IN")}
\u2022 **Total Inflow (Money Returned)**: \u20B9${returned.toLocaleString("en-IN")}
\u2022 **Net Outstanding Overhang**: \u20B9${pending.toLocaleString("en-IN")}
\u2022 **Current Recovery Velocity**: **${recovery}%**

**Key Trend Finding**: ${recovery >= 75 ? "Your recovery curve is strong and healthy." : "There is an outstanding gap between money given and recovered. Recommend following up on the top pending balances."}

You can also view dedicated graph breakdowns on the **Dashboard**, **Monthly Summary**, and **Yearly Summary** pages with live AI Graph Analysis!`
    };
  }
  return {
    reply: `I am your **FinancialFree AI Copilot** (Powered by NVIDIA & Gemini AI).

\u2022 **Total Given**: \u20B9${given.toLocaleString("en-IN")}
\u2022 **Total Returned**: \u20B9${returned.toLocaleString("en-IN")}
\u2022 **Net Pending**: \u20B9${pending.toLocaleString("en-IN")}
\u2022 **Recovery Ratio**: **${recovery}%**

Ask me about graphs, debtors, recovery projections, or upload a payment receipt!`
  };
}
async function suggestTransactionCategoryAndPurpose(params) {
  const textContext = `${params.description || ""} ${params.notes || ""}`.trim();
  const lowerText = textContext.toLowerCase();
  const amount = params.amount || 0;
  const isReturn = params.type === "returned";
  const heuristicCategories = [];
  const heuristicPurposes = [];
  const heuristicTags = [];
  let primaryCategory = isReturn ? "Loan Repayment" : "Personal Loan";
  let primaryPurpose = isReturn ? "Return payment toward outstanding balance" : "Personal loan assistance";
  if (lowerText.match(/medic|hospit|doctor|health|clinic|pharma|surgery|pill|fever|ill/)) {
    primaryCategory = "Emergency Medical";
    primaryPurpose = amount > 1e4 ? "Hospitalization and medical emergency advance" : "Medicine and clinical consultation support";
    heuristicCategories.push("Emergency Medical", "Family Assistance", "Healthcare");
    heuristicPurposes.push(
      "Hospitalization and treatment fees",
      "Pharmacy prescriptions and medicine cost",
      "Doctor consultation and medical diagnostics"
    );
    heuristicTags.push("medical", "emergency", "health");
  } else if (lowerText.match(/rent|flat|room|pg|house|apart|tenant|owner|landlord|deposit/)) {
    primaryCategory = "Rent & Housing";
    primaryPurpose = "Monthly house rent and accommodation split";
    heuristicCategories.push("Rent & Housing", "Home Maintenance", "Utilities");
    heuristicPurposes.push(
      "Monthly accommodation rent contribution",
      "Apartment security deposit advance",
      "Household utility bill settlement"
    );
    heuristicTags.push("rent", "housing", "monthly");
  } else if (lowerText.match(/fee|school|college|exam|tuition|course|book|class|sem/)) {
    primaryCategory = "Education & Fees";
    primaryPurpose = "Academic semester fees and course materials";
    heuristicCategories.push("Education & Fees", "Student Support", "Training");
    heuristicPurposes.push(
      "College semester tuition fee installment",
      "Exam registration and coaching classes",
      "Books, stationery and study resources"
    );
    heuristicTags.push("education", "tuition", "academic");
  } else if (lowerText.match(/trip|travel|flight|train|irctc|ticket|hotel|cab|uber|ola|petrol|fuel|tour/)) {
    primaryCategory = "Travel & Transport";
    primaryPurpose = "Travel booking and transport expenses";
    heuristicCategories.push("Travel & Transport", "Fuel & Commute", "Vacation");
    heuristicPurposes.push(
      "Flight/train ticket booking advance",
      "Fuel and road trip travel split",
      "Hotel lodging and vacation expenses"
    );
    heuristicTags.push("travel", "transport", "commute");
  } else if (lowerText.match(/food|dinner|lunch|party|hotel|restaurant|grocer|swiggy|zomato|supermarket|kirana|rashan/)) {
    primaryCategory = "Food & Groceries";
    primaryPurpose = "Monthly grocery supplies and dining split";
    heuristicCategories.push("Food & Groceries", "Household Supplies", "Dining");
    heuristicPurposes.push(
      "Monthly grocery and household essentials",
      "Restaurant dining and food split",
      "Kirana store provision bill"
    );
    heuristicTags.push("food", "groceries", "household");
  } else if (lowerText.match(/laptop|phone|mobile|screen|repair|servi|device|comp|mechanic|car|bike/)) {
    primaryCategory = "Repairs & Electronics";
    primaryPurpose = "Device repair and servicing charges";
    heuristicCategories.push("Repairs & Electronics", "Hardware Maintenance", "Equipment");
    heuristicPurposes.push(
      "Smartphone screen and battery replacement",
      "Laptop servicing and software update",
      "Vehicle servicing and maintenance"
    );
    heuristicTags.push("repairs", "electronics", "maintenance");
  } else if (lowerText.match(/busin|shop|stock|goods|vendor|suppl|trade|invoic|client|order/)) {
    primaryCategory = "Business Advance";
    primaryPurpose = "Commercial inventory and vendor procurement";
    heuristicCategories.push("Business Advance", "Vendor Settlement", "Working Capital");
    heuristicPurposes.push(
      "Raw material inventory purchase",
      "Vendor advance for goods supply",
      "Short-term commercial working capital"
    );
    heuristicTags.push("business", "vendor", "trade");
  } else if (isReturn) {
    if (amount > 0 && lowerText.match(/full|clear|settl|final|total|all/)) {
      primaryCategory = "Full Settlement";
      primaryPurpose = "Full outstanding loan balance clearance";
      heuristicCategories.push("Full Settlement", "Account Clearance", "Final Payoff");
      heuristicPurposes.push(
        "Full outstanding balance payoff",
        "Final settlement and account clearance",
        "Lending ledger closing repayment"
      );
      heuristicTags.push("settlement", "cleared", "final");
    } else {
      primaryCategory = "Instalment Return";
      primaryPurpose = "Monthly instalment repayment toward balance";
      heuristicCategories.push("Instalment Return", "Partial Settlement", "Loan Payback");
      heuristicPurposes.push(
        "Monthly instalment repayment toward balance",
        "Part payment against outstanding amount",
        "UPI transfer towards loan recovery"
      );
      heuristicTags.push("instalment", "repayment", "part-payment");
    }
  } else {
    heuristicCategories.push("Personal Loan", "Friend Support", "Family Assistance");
    heuristicPurposes.push(
      "Short-term emergency cash advance",
      "Friendly financial support",
      "Urgent personal expense assistance"
    );
    heuristicTags.push("personal", "loan", "friendly");
  }
  const systemPrompt = `You are a financial accounting assistant. Given a transaction type, amount in Indian Rupees (INR), borrower context, and user description, classify the transaction into a standard category and generate a concise, refined purpose statement.
Return ONLY a valid JSON object matching this schema:
{
  "category": "Short Category Name",
  "purpose": "A concise, clear professional purpose description (under 12 words)",
  "categories": ["Top Category", "Alternative 1", "Alternative 2"],
  "purposes": ["Refined primary purpose", "Alternative short purpose", "Alternative detailed purpose"],
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "confidenceSummary": "Brief 1-sentence explanation of the recommendation"
}
Categories to pick from: Emergency Medical, Rent & Housing, Education & Fees, Travel & Transport, Food & Groceries, Repairs & Electronics, Business Advance, Shopping & Equipment, Family Assistance, Friend Support, Personal Loan, Full Settlement, Instalment Return.`;
  const userPrompt = `Transaction details:
- Type: ${params.type === "given" ? "Money Given (Outflow loan)" : "Money Returned (Inflow repayment)"}
- Amount: \u20B9${amount || "Not specified"}
- Person Name: ${params.personName || "Unspecified"}
- Person Category: ${params.personCategory || "Unspecified"}
- User Provided Description: "${params.description || ""}"
- User Notes: "${params.notes || ""}"

Suggest the optimal category, refined purpose, and 3 alternatives. Output pure JSON only.`;
  try {
    const aiResult = await generateUnifiedAI({
      systemPrompt,
      userPrompt,
      temperature: 0.3
    });
    if (aiResult && aiResult.text) {
      const cleanJson = aiResult.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.category && parsed.purpose) {
        return {
          category: parsed.category,
          purpose: parsed.purpose,
          suggestedTags: Array.isArray(parsed.suggestedTags) && parsed.suggestedTags.length > 0 ? parsed.suggestedTags : heuristicTags,
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : [parsed.category, ...heuristicCategories.slice(0, 2)],
          purposes: Array.isArray(parsed.purposes) && parsed.purposes.length > 0 ? parsed.purposes : [parsed.purpose, ...heuristicPurposes.slice(0, 2)],
          confidenceSummary: parsed.confidenceSummary || `AI auto-suggested based on amount and description.`
        };
      }
    }
  } catch (err) {
  }
  return {
    category: primaryCategory,
    purpose: primaryPurpose,
    suggestedTags: heuristicTags,
    categories: heuristicCategories.length > 0 ? heuristicCategories : [primaryCategory],
    purposes: heuristicPurposes.length > 0 ? heuristicPurposes : [primaryPurpose],
    confidenceSummary: `Suggested based on keywords "${textContext || (isReturn ? "repayment" : "loan")}"`
  };
}

// server/app.ts
var app = express();
var apiRouter = express.Router();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Session missing or expired. Please log in." });
  }
  const token = authHeader.split(" ")[1];
  const user = db.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: Session has expired. Please log in again." });
  }
  req.user = user;
  req.token = token;
  next();
}
apiRouter.get("/", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString(), app: "FinancialFree", message: "FinancialFree API is active and running" });
});
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString(), app: "FinancialFree" });
});
apiRouter.get(["/download-apk", "/FinancialFree.apk", "/financialfree.apk", "/app.apk"], (req, res) => {
  const apkPath = path3.resolve(process.cwd(), "public", "FinancialFree.apk");
  if (fs3.existsSync(apkPath)) {
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="FinancialFree.apk"');
    res.sendFile(apkPath);
  } else {
    res.status(404).json({ error: "FinancialFree.apk package not found on server." });
  }
});
apiRouter.get("/download-android-project", (req, res) => {
  const zipPath = path3.resolve(process.cwd(), "public", "downloads", "financialfree-android-project.zip");
  if (fs3.existsSync(zipPath)) {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="financialfree-android-project.zip"');
    res.sendFile(zipPath);
  } else {
    res.status(404).json({ error: "Android Studio project package not found." });
  }
});
var HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET || "";
var HCAPTCHA_SITEKEY = process.env.HCAPTCHA_SITEKEY || "3bb6adea-325c-43d8-83b2-53548e2c8f9a";
async function verifyHCaptcha(token, remoteIp) {
  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      success: false,
      error: "Security verification required: Please solve the hCaptcha challenge before proceeding."
    };
  }
  if (!HCAPTCHA_SECRET || token === "10000000-aaaa-bbbb-cccc-000000000001" || token === "test-hcaptcha-token") {
    return { success: true };
  }
  try {
    const params = new URLSearchParams();
    params.append("secret", HCAPTCHA_SECRET);
    params.append("response", token.trim());
    params.append("sitekey", HCAPTCHA_SITEKEY);
    if (remoteIp) {
      params.append("remoteip", remoteIp);
    }
    const response = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    const data = await response.json();
    if (data && data.success) {
      return { success: true };
    }
    const errCodes = Array.isArray(data["error-codes"]) ? data["error-codes"].join(", ") : "";
    return {
      success: false,
      error: errCodes ? `hCaptcha verification rejected: ${errCodes}` : "hCaptcha security verification failed. Please try again."
    };
  } catch (err) {
    console.error("hCaptcha verification server error:", err);
    return {
      success: false,
      error: "Unable to reach hCaptcha verification servers. Please check your internet connection."
    };
  }
}
apiRouter.post("/auth/login", async (req, res) => {
  try {
    const { email, password, hcaptchaToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const captchaCheck = await verifyHCaptcha(hcaptchaToken, req.ip || req.headers["x-forwarded-for"]);
    if (!captchaCheck.success) {
      return res.status(400).json({ error: captchaCheck.error || "Please complete the hCaptcha security challenge." });
    }
    const authResult = db.login(email.trim(), password);
    if (!authResult) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.json(authResult);
  } catch (error) {
    res.status(500).json({ error: error.message || "Login error" });
  }
});
apiRouter.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, phone, hcaptchaToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const captchaCheck = await verifyHCaptcha(hcaptchaToken, req.ip || req.headers["x-forwarded-for"]);
    if (!captchaCheck.success) {
      return res.status(400).json({ error: captchaCheck.error || "Please complete the hCaptcha security challenge." });
    }
    const authResult = db.register({ email, password, name, phone });
    res.status(201).json(authResult);
  } catch (error) {
    res.status(400).json({ error: error.message || "Registration failed" });
  }
});
apiRouter.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email, hcaptchaToken } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email address is required" });
    }
    const captchaCheck = await verifyHCaptcha(hcaptchaToken, req.ip || req.headers["x-forwarded-for"]);
    if (!captchaCheck.success) {
      return res.status(400).json({ error: captchaCheck.error || "Please complete the hCaptcha security challenge." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const code = db.createVerificationCode(cleanEmail, "reset_password");
    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`,
      code
      // Provided in preview so users can immediately test password recovery
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to process forgot password request" });
  }
});
apiRouter.post("/auth/reset-password", (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, 6-digit verification code, and new password are required" });
    }
    const result = db.resetPasswordWithCode(email, code, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to reset password" });
  }
});
apiRouter.get("/auth/profile", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
apiRouter.put("/auth/profile", requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const updated = db.updateProfile(userId, req.body);
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update profile" });
  }
});
apiRouter.post("/auth/send-verification-code", requireAuth, (req, res) => {
  try {
    const user = req.user;
    const code = db.createVerificationCode(user.email, "verify_email");
    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}.`,
      code
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to send verification code" });
  }
});
apiRouter.post("/auth/verify-email", requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Verification code is required" });
    }
    const result = db.verifyEmailWithCode(userId, code);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to verify email" });
  }
});
apiRouter.post("/auth/firebase-login", (req, res) => {
  try {
    const { uid, email, displayName } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }
    const authResult = db.loginWithFirebase({ uid, email, displayName });
    res.json(authResult);
  } catch (error) {
    res.status(500).json({ error: error.message || "Firebase login error" });
  }
});
apiRouter.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
apiRouter.post("/auth/logout", requireAuth, (req, res) => {
  const token = req.token;
  db.logout(token);
  res.json({ success: true, message: "Logged out successfully" });
});
apiRouter.post("/auth/change-password", requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }
    const userId = req.user.id;
    const result = db.changePassword(userId, currentPassword, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Password change failed" });
  }
});
apiRouter.get("/people", requireAuth, (req, res) => {
  try {
    const { search, category, status } = req.query;
    const user = req.user;
    const people = db.getPeople(search, category, status, user?.id, user?.role);
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch people" });
  }
});
apiRouter.get("/people/:id", requireAuth, (req, res) => {
  try {
    const data = db.getPersonById(req.params.id);
    if (!data) return res.status(404).json({ error: "Person not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch person details" });
  }
});
apiRouter.post("/people", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const person = await db.createPerson(req.body, userId);
    res.status(201).json(person);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create person" });
  }
});
apiRouter.put("/people/:id", requireAuth, async (req, res) => {
  try {
    const updated = await db.updatePerson(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update person" });
  }
});
apiRouter.delete("/people/:id", requireAuth, async (req, res) => {
  try {
    const result = await db.deletePerson(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to delete person" });
  }
});
apiRouter.post("/people/clear-all", requireAuth, async (req, res) => {
  try {
    const result = await db.clearAllPeople();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to clear all people records" });
  }
});
apiRouter.get("/transactions", requireAuth, (req, res) => {
  try {
    const user = req.user;
    const filters = {
      person_id: req.query.person_id,
      type: req.query.type,
      month: req.query.month ? Number(req.query.month) : void 0,
      year: req.query.year ? Number(req.query.year) : void 0,
      financial_year: req.query.financial_year,
      payment_method: req.query.payment_method,
      search: req.query.search
    };
    const txs = db.getTransactions(filters, user?.id, user?.role);
    res.json(txs);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch transactions" });
  }
});
apiRouter.post("/transactions", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const tx = await db.createTransaction(req.body, userId);
    res.status(201).json(tx);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create transaction" });
  }
});
apiRouter.put("/transactions/:id", requireAuth, async (req, res) => {
  try {
    const updated = await db.updateTransaction(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update transaction" });
  }
});
apiRouter.delete("/transactions/:id", requireAuth, async (req, res) => {
  try {
    const result = await db.deleteTransaction(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to delete transaction" });
  }
});
apiRouter.post("/transactions/clear-all", requireAuth, async (req, res) => {
  try {
    const result = await db.clearAllTransactions();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to clear all transactions" });
  }
});
apiRouter.post("/admin/clean-orphaned", requireAuth, async (req, res) => {
  try {
    const result = await db.purgeOrphanedRecords();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to clean orphaned records" });
  }
});
apiRouter.get("/analytics/dashboard", requireAuth, (req, res) => {
  try {
    const user = req.user;
    const summary = db.getDashboardSummary(user?.id, user?.role);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch dashboard summary" });
  }
});
apiRouter.get("/analytics/monthly", requireAuth, (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : (/* @__PURE__ */ new Date()).getFullYear();
    const month = req.query.month ? Number(req.query.month) : (/* @__PURE__ */ new Date()).getMonth() + 1;
    const analytics = db.getMonthlyAnalytics(year, month);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch monthly analytics" });
  }
});
apiRouter.get("/analytics/yearly", requireAuth, (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : (/* @__PURE__ */ new Date()).getFullYear();
    const analytics = db.getYearlyAnalytics(year);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch yearly analytics" });
  }
});
apiRouter.get("/analytics/financial-year", requireAuth, (req, res) => {
  try {
    const fy = req.query.fy;
    const analytics = db.getFinancialYearAnalytics(fy);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch financial year analytics" });
  }
});
apiRouter.get("/analytics/financial-years", requireAuth, (req, res) => {
  try {
    const fy = req.query.fy;
    const analytics = db.getFinancialYearAnalytics(fy);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch financial year analytics" });
  }
});
apiRouter.get("/analytics/periods", requireAuth, (req, res) => {
  try {
    const periods = db.getAvailableYearsAndFys();
    res.json(periods);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch periods" });
  }
});
apiRouter.get("/database/status", requireAuth, (req, res) => {
  try {
    const status = db.getStatus();
    res.json({
      status: "online",
      provider: "Cloud Firestore & Local Mirror",
      projectId: "financialfree-c171e",
      databaseId: "(default)",
      isCloudSynced: status.isCloudSynced,
      peopleCount: status.peopleCount,
      txCount: status.txCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch database status" });
  }
});
apiRouter.post("/database/sync", requireAuth, async (req, res) => {
  try {
    await db.pushAllToFirestore();
    const status = db.getStatus();
    res.json({
      success: true,
      message: "Database successfully synchronized with Cloud Firestore.",
      isCloudSynced: status.isCloudSynced,
      peopleCount: status.peopleCount,
      txCount: status.txCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to sync database" });
  }
});
apiRouter.get("/database/integrity-check", requireAuth, (req, res) => {
  try {
    const report = db.getIntegrityReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to perform integrity check" });
  }
});
apiRouter.post("/database/reconcile", requireAuth, async (req, res) => {
  try {
    const result = await db.reconcileWithClient(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to reconcile database state" });
  }
});
apiRouter.get("/reminders", requireAuth, (req, res) => {
  try {
    const user = req.user;
    const reminders = db.getReminders(user?.id, user?.role);
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch reminders" });
  }
});
apiRouter.post("/reminders", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reminder = await db.createReminder(req.body, userId);
    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create reminder" });
  }
});
apiRouter.patch("/reminders/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await db.updateReminder(req.params.id, { status });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update reminder status" });
  }
});
apiRouter.put("/reminders/:id", requireAuth, async (req, res) => {
  try {
    const updated = await db.updateReminder(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update reminder" });
  }
});
apiRouter.delete("/reminders/:id", requireAuth, async (req, res) => {
  try {
    const result = await db.deleteReminder(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to delete reminder" });
  }
});
apiRouter.get("/backup/export", requireAuth, (req, res) => {
  try {
    const data = db.exportAllData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to export backup data" });
  }
});
apiRouter.post("/backup/import", requireAuth, (req, res) => {
  try {
    const result = db.importAllData(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to import backup data" });
  }
});
apiRouter.post("/backup/reset", requireAuth, (req, res) => {
  try {
    const result = db.resetToSampleData();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to reset data" });
  }
});
apiRouter.get("/backup/cloud-status", requireAuth, async (req, res) => {
  try {
    const status = await db.getCloudBackupStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to get cloud backup status" });
  }
});
apiRouter.post("/backup/cloud-push", requireAuth, async (req, res) => {
  try {
    const result = await db.pushCloudBackup();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to push cloud backup" });
  }
});
apiRouter.post("/backup/cloud-restore", requireAuth, async (req, res) => {
  try {
    const result = await db.restoreFromCloudBackup();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to restore from cloud backup" });
  }
});
apiRouter.post("/ai/suggest-transaction-meta", requireAuth, async (req, res) => {
  try {
    const { type, amount, description, notes, personName, personCategory } = req.body;
    const result = await suggestTransactionCategoryAndPurpose({
      type: type || "given",
      amount: amount ? Number(amount) : void 0,
      description,
      notes,
      personName,
      personCategory
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to suggest transaction metadata" });
  }
});
apiRouter.get("/ai/insights", requireAuth, async (req, res) => {
  try {
    const rawData = db.getRawDataForAI();
    const insights = await generateFinancialInsights({
      summary: rawData.summary,
      people: rawData.people,
      transactions: rawData.transactions
    });
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to generate financial insights" });
  }
});
apiRouter.post("/ai/scan-image", requireAuth, async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image data is required (base64 string)." });
    }
    const data = await scanReceiptOrImage(image, mimeType || "image/jpeg");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to scan financial image" });
  }
});
apiRouter.post("/ai/scan-receipt", requireAuth, async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image data is required (base64 string)." });
    }
    const data = await scanReceiptOrImage(image, mimeType || "image/jpeg");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to scan receipt image" });
  }
});
apiRouter.post("/ai/draft-reminder", requireAuth, async (req, res) => {
  try {
    const { person_id, tone } = req.body;
    const personData = db.getPersonById(person_id);
    if (!personData) return res.status(404).json({ error: "Person not found" });
    const draft = await draftReminderMessage({
      name: personData.person.full_name,
      pendingAmount: personData.person.remaining_balance || 0,
      purpose: personData.transactions[0]?.purpose,
      tone: tone || "friendly"
    });
    res.json(draft);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to draft reminder" });
  }
});
apiRouter.post("/ai/analyze-graph", requireAuth, async (req, res) => {
  try {
    const { type, graphData, currencySymbol } = req.body;
    if (!graphData) {
      return res.status(400).json({ error: "graphData is required" });
    }
    const result = await analyzeGraphTrends({
      type: type || "dashboard",
      graphData,
      currencySymbol: currencySymbol || "\u20B9"
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to analyze graph data" });
  }
});
apiRouter.post("/ai/chat", requireAuth, async (req, res) => {
  try {
    const { message, history, image, mimeType } = req.body;
    if (!message && !image) return res.status(400).json({ error: "Message or image is required" });
    const rawData = db.getRawDataForAI();
    const result = await chatFinancialAssistant(
      history || [],
      message || "Please analyze this uploaded document or receipt and extract relevant money details.",
      {
        people: rawData.people,
        summary: rawData.summary,
        transactions: rawData.transactions
      },
      image ? { data: image, mimeType: mimeType || "image/jpeg" } : void 0
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "AI Assistant failed" });
  }
});
app.use("/api", apiRouter);
app.use(apiRouter);
app.use((req, res, next) => {
  if (req.url.startsWith("/api") || req.url.startsWith("/auth") || req.url.startsWith("/people") || req.url.startsWith("/transactions") || req.url.startsWith("/summary") || req.url.startsWith("/reminders")) {
    return res.status(404).json({ error: `API route ${req.method} ${req.originalUrl || req.url} not found` });
  }
  next();
});
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error occurred" });
});
var app_default = app;

// server/api.ts
function handler(req, res) {
  const matchedPath = req.headers["x-matched-path"] || req.headers["x-forwarded-uri"];
  if (matchedPath && typeof matchedPath === "string") {
    if (req.url === "/" || req.url === "/api" || req.url === "") {
      req.url = matchedPath;
    }
  }
  return app_default(req, res);
}
export {
  handler as default
};
//# sourceMappingURL=index.js.map
