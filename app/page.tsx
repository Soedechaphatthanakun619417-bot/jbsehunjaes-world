'use client';

import React, { useState, useEffect } from 'react';
// Firebase Imports များ
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  Play, Lock, Unlock, Search, User, Coins, Sparkles, X, Plus, Edit, Trash2, 
  Globe, Menu, Home, HelpCircle, Gift, Info, Send, Phone,
  Users, Bell, LayoutDashboard, Upload, ShieldCheck, UserPlus, Calendar, ChevronRight,
  ChevronLeft, Copy, CheckCircle, Clock, XCircle, CreditCard, Settings, LogOut, Key, MessageCircle, MonitorPlay,
  Eye, EyeOff, Download, RefreshCw
} from 'lucide-react';

// ------------------------------------------------------------------
// သတိပြုရန် - အောက်ပါ firebaseConfig နေရာတွင် Firebase မှ သင် Copy ကူးလာသော အချက်အလက်များကို အစားထိုးထည့်ပါ။
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAPVvbhDa1xJ97b2N4Mm7it4yY1TRSKaDw",
  authDomain: "jbsehunjaes-world.firebaseapp.com",
  projectId: "jbsehunjaes-world",
  storageBucket: "jbsehunjaes-world.firebasestorage.app",
  messagingSenderId: "605183918160",
  appId: "1:605183918160:web:a5a9e10af5a113fa32d155",
  measurementId: "G-YB2V92YDTS"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
// ------------------------------------------------------------------

// --- Types ---
interface EpLink { platform: string; url: string; }
interface EpisodeData { epLabel: string; links: EpLink[]; releaseDateRaw?: string; releaseDate: string; }
interface VideoCardData { id: string; title_en: string; title_mm: string; image: string; category: string; description: string; totalEpisodes: number; pointsPerEp: number; episodes: EpisodeData[]; vipTelegramLink?: string; }
interface UserData { username: string; email: string; password?: string; role: 'admin' | 'user'; points: number; vip: boolean; unlockedShows: string[]; }
interface PointRequest { id: string; username: string; idCode: string; provider: string; date: string; status: 'pending' | 'approved' | 'rejected'; amount?: number; remark?: string; }
interface ContentItem { id: string; title_en: string; body_en: string; title_mm: string; body_mm: string; }
interface SiteConfig { marqueeEn: string; marqueeMm: string; depositGuideEn: string; depositGuideMm: string; paymentWarningEn: string; paymentWarningMm: string; fbLink: string; tgLink: string; viberLink: string; }

const DEFAULT_CONFIG: SiteConfig = {
  marqueeEn: "We do not accept gambling advertisements.",
  marqueeMm: "လောင်းကစားနဲ့ပတ်သက်သော ကြော်ငြာများကိုထည့်သွင်းကြော်ငြာပေးမည်မဟုတ်ပါ",
  depositGuideEn: "Step 1: Scan the QR code.\nStep 2: Transfer the exact amount.\nStep 3: Enter your Transaction ID.",
  depositGuideMm: "ငွေသွင်းနည်း\n၁။ ပြသထားသော QR Code ကို Scan ဖတ်ပါ။\n၂။ မိမိဝယ်ယူလိုသော ပမာဏကို လွှဲပါ။\n၃။ ငွေလွှဲပြီးပါက လုပ်ငန်းစဉ်အမှတ် (Txn ID) ကို အောက်ပါအကွက်တွင် မှန်ကန်စွာ ထည့်သွင်းပါ။",
  paymentWarningEn: "Do not write anything in the transaction description/notes. Please transfer only between 1 AM - 6 AM and 12 PM - 9 PM.",
  paymentWarningMm: "ငွေလွှဲရာတွင် Description (မှတ်ချက်) နေရာ၌ ဘာမှမရေးပါနှင့်။ မနက် ၁ နာရီမှ ၆ နာရီအတွင်း၊ နေ့ခင်း ၁၂ နာရီမှ ည ၉ နာရီအတွင်းသာ သွင်းပေးပါ။",
  fbLink: "#", tgLink: "#", viberLink: "#"
}

const INITIAL_PROVIDERS = {
  banks: [
    { id: 'aya-bank', name: 'AYA Bank', qrImage: 'https://via.placeholder.com/200?text=AYA+QR', color: 'bg-red-600', accountNo: '' },
    { id: 'kbz-bank', name: 'KBZ Bank', qrImage: 'https://via.placeholder.com/200?text=KBZ+QR', color: 'bg-blue-600', accountNo: '' }
  ],
  ewallets: [
    { id: 'aya-pay', name: 'AYA Pay', qrImage: 'https://via.placeholder.com/200?text=AYAPAY+QR', color: 'bg-red-500', accountNo: '' },
    { id: 'kbz-pay', name: 'KBZ Pay', qrImage: 'https://via.placeholder.com/200?text=KBZPAY+QR', color: 'bg-blue-500', accountNo: '' },
    { id: 'wave-pay', name: 'Wave Pay', qrImage: 'https://via.placeholder.com/200?text=WAVEPAY+QR', color: 'bg-yellow-400', accountNo: '' }
  ]
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours(); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12; h = h ? h : 12; 
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${h}:${m} ${ampm}`;
};

const TRANSLATIONS = {
  en: {
    loginBtn: "LOGIN", signUpBtn: "REGISTER", adminPanel: "Admin Panel", logout: "Logout", pts: "PTS",
    latestReleases: "Latest Releases", collection: "Collection", episodes: "Episodes", searchPlaceholder: "Search drama, movie...",
    home: "Home", promotions: "Promotions", faq: "FAQ & Guide", email: "Email or Username", password: "Password", 
    forgotPwd: "Forgot password?", noAccount: "Don't have an account?", hasAccount: "Already have an account?", backTo: "Back to", 
    getpwd: "Get Password", buyPoints: "Buy Points", watchBtn: "Click to Watch", waitBtn: "Schedule Wait",
    vipTitle: "VIP Member", vipDesc: "Join VIP to watch all episodes.", joinVip: "Join VIP",
    vipUnlockedTitle: "VIP Unlocked", vipUnlockedDesc: "You have full VIP access to all episodes of this series.",
    vipNotRequired: "VIP Not Required", allEpsAvailable: "All episodes are available to watch.",
    unlockAll: "Unlock All Episodes", unlockDesc: "Points are required to unlock all episodes of this series.", required: "Required:",
    balance: "Your Balance:", unlockBtn: "Deduct Points & Unlock", adminSystem: "SUPPORT SYSTEM", adminRole: "Role: Admin",
    adminTabUsers: "User Dashboard", adminTabPoints: "Point Requests", adminTabHistory: "Transaction History", 
    adminTabSettings: "System Settings", adminTabPromo: "Promo & FAQ Manage", adminTabUpload: "Upload Movies / Series",
    userMgmt: "User Management", searchUser: "Search Username or Email...", searchPoint: "Search Username or ID Code...",
    createUser: "Create User", pointReqs: "Point Requests", managePromoFaq: "Manage Promotions & FAQs", addCat: "Add Category",
    uploadVid: "Upload Movie / Series", genSlots: "Generate Slots", saveBtn: "Save Content", updateBtn: "Update Content",
    titleEnPlaceholder: "Title (English)", titleMmPlaceholder: "Title (Myanmar)", descPlaceholder: "Description / Body Content",
    imgPlaceholder: "Image URL", tgLinkPlaceholder: "VIP Telegram Link", qrLinkPlaceholder: "QR Image URL", totEps: "Total Episodes", newCatName: "New Category Name...",
    addBtn: "Add", approveBtn: "Approve", rejectBtn: "Reject", noReqs: "No pending requests.", cancelBtn: "Cancel", alertNotReleased: "Not released yet! Wait until",
    alertOrJoinVip: "Or join VIP.", msgExists: "This Username or Email already exists.", msgSuccess: "Registration successful.",
    msgLoginSucc: "Login successful.", msgWrong: "Invalid Username or Password.", msgPointSent: "Request submitted.",
    msgApproved: "Points added successfully.", msgContentAdded: "Content saved successfully.", msgUploaded: "Video saved successfully.",
    msgVipSuccess: "VIP unlocked successfully.", msgNotEnough: "Not enough points. Required: ", msgUserSaved: "Data saved successfully!",
    msgDeleted: "Item deleted.", msgCopied: "Copied to clipboard!", payMenuDeposit: "Deposit Points", payMenuHistory: "My History", paySelectMethod: "Select Payment Method",
    payBank: "Banks", payEwallet: "E-Wallets", payAccountNo: "Account Number", payTxnId: "Transaction ID", paySubmitBtn: "Submit", 
    payWarnTitle: "Important Notice", payWarnDesc: "Do not write anything in the transaction description/notes.",
    payWarnTime: "Please transfer only between 1:00 AM - 6:00 AM and 12:00 PM - 9:00 PM. Outside these hours, admin is offline and you will need to wait.",
    statusPending: "Pending", statusSuccess: "Success", statusRejected: "Rejected",
    changePwd: "Change Password", contactUs: "Contact Us", duplicateId: "This Transaction ID has already been used.", remarkLabel: "Reason: ",
    createUserTitle: "Create New User", editUserTitle: "Edit User Data Settings", pointsInput: "Points", role: "Role",
    confirmDelTitle: "Are you sure?", confirmDelDesc: "Do you want to delete this item? This action cannot be undone.",
    confirmRejectTitle: "Reject Request", rejectPlaceholder: "Reason for rejection...", 
    promptPwdTitle: "Change Password", promptPwdPlaceholder: "Enter new password...",
    oldPwd: "Old Password", newPwd: "New Password", confirmPwd: "Confirm Password", pwdMismatch: "Passwords do not match!", wrongOldPwd: "Old password is incorrect!",
    choosePlatform: "Choose Platform", watchOn: "Watch on",
    downloadQR: "Download QR Code",
    rememberMe: "Remember me for future logins"
  },
  mm: {
    loginBtn: "အကောင့်ဝင်ရန်", signUpBtn: "အကောင့်ဖွင့်ရန်", adminPanel: "Admin စာမျက်နှာ", logout: "အကောင့်မှထွက်ရန်", pts: "မှတ်",
    latestReleases: "နောက်ဆုံးတင်ထားသော ဇာတ်ကားများ", collection: "ဇာတ်ကားများ", episodes: "အပိုင်းများ", searchPlaceholder: "ဇာတ်ကားအမည် ရှာရန်...",
    home: "ပင်မစာမျက်နှာ", promotions: "ပရိုမိုးရှင်းများ", faq: "ငွေထည့်နည်း နှင့် အမေးအဖြေ", email: "အီးမေးလ် (သို့) Username", password: "စကားဝှက်", 
    forgotPwd: "စကားဝှက်မေ့နေပါသလား?", noAccount: "အကောင့်မရှိသေးဘူးလား?", hasAccount: "အကောင့်ရှိပြီးသားလား?", backTo: "နောက်သို့", 
    getpwd: "စကားဝှက်တောင်းမည်", buyPoints: "Point ဝယ်ယူရန်", watchBtn: "ဇာတ်ကားကြည့်ရန်နှိပ်ပါ", waitBtn: "အချိန်စောင့်ပါ",
    vipTitle: "VIP အဖွဲ့ဝင်", vipDesc: "Schedule မစောင့်ချင်ပါက VIP Member ဝင်ပြီး အပိုင်းအားလုံး ကြည့်ရှုနိုင်ပါသည်။", joinVip: "VIP ဝင်မည်",
    vipUnlockedTitle: "VIP ဝင်ပြီးပါပြီ", vipUnlockedDesc: "ဒီဇာတ်ကားအတွက် VIP အပြည့်အစုံ ဝင်ရောက်ထားပြီး ဖြစ်ပါသည်။",
    vipNotRequired: "VIP ဝင်ရန်မလိုအပ်ပါ", allEpsAvailable: "အပိုင်းအားလုံးကို အခမဲ့ကြည့်ရှုနိုင်ပြီဖြစ်ပါသည်။",
    unlockAll: "အပိုင်းအားလုံး ဖွင့်ရန်", unlockDesc: "ဒီဇာတ်ကားရဲ့ အပိုင်းအားလုံးကို VIP အနေနဲ့ကြည့်ရန် Points လိုအပ်ပါသည်။", required: "လိုအပ်သော Point:",
    balance: "သင့်လက်ကျန်:", unlockBtn: "Point ဖျက်၍ ဝင်မည်", adminSystem: "SUPPORT SYSTEM", adminRole: "Role: Admin",
    adminTabUsers: "အကောင့်ဖွင့်ထားသော User များ", adminTabPoints: "Point တောင်းဆိုမှုများ", adminTabHistory: "ငွေသွင်းမှတ်တမ်းများ", 
    adminTabSettings: "စနစ် အပြင်အဆင်များ", adminTabPromo: "ပရိုမိုးရှင်း နှင့် FAQ စီမံရန်", adminTabUpload: "ဇာတ်ကား / ဇာတ်လမ်းတွဲ တင်ရန်", 
    userMgmt: "အသုံးပြုသူများ စီမံရန်", searchUser: "Username (သို့) Email ရှာရန်...", searchPoint: "Username သို့မဟုတ် ID Code ဖြင့်ရှာပါ...", 
    createUser: "အကောင့်ဖွင့်ပေးရန်", pointReqs: "Point တောင်းဆိုမှုများ (Pending)", managePromoFaq: "ပရိုမိုးရှင်း နှင့် FAQ စီမံရန်", addCat: "အမျိုးအစား အသစ်ထည့်ရန်", 
    uploadVid: "ဇာတ်ကား / ဇာတ်လမ်းတွဲ တင်ရန်", genSlots: "အပိုင်းများ ဖန်တီးရန်", saveBtn: "သိမ်းမည်", updateBtn: "ပြင်ဆင်မည်", titleEnPlaceholder: "ခေါင်းစဉ် (English)",
    titleMmPlaceholder: "ခေါင်းစဉ် (Myanmar)", descPlaceholder: "အကြောင်းအရာ စာသား (Body)", imgPlaceholder: "ပုံ Link",
    tgLinkPlaceholder: "VIP Telegram Link", qrLinkPlaceholder: "QR ပုံ Link ထည့်ပါ...", totEps: "စုစုပေါင်း အပိုင်း", newCatName: "အမျိုးအစား အမည်သစ်...", addBtn: "ထည့်မည်",
    approveBtn: "ထည့်ပေးမည်", rejectBtn: "ပယ်ဖျက်မည်", noReqs: "တောင်းဆိုမှုများ မရှိပါ။", cancelBtn: "Cancel", alertNotReleased: "မထုတ်ပြန်ရသေးပါ!",
    alertOrJoinVip: "အထိ စောင့်ပါ သို့မဟုတ် VIP သို့ ဝင်ပါ။", msgExists: "ဒီ Username (သို့) Email ဖွင့်ပြီးသားရှိနေပါသည်။",
    msgSuccess: "အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။", msgLoginSucc: "Login ဝင်ရောက်ခြင်း အောင်မြင်ပါသည်။", msgWrong: "Username သို့မဟုတ် Password မှားယွင်းနေပါသည်။",
    msgPointSent: "ပေးပို့မှု အောင်မြင်ပါသည်။ Admin မှ စစ်ဆေးပေးပါမည်။", msgApproved: "Points ထည့်ပေးလိုက်ပါပြီ။", msgContentAdded: "အချက်အလက် သိမ်းဆည်းပြီးပါပြီ။",
    msgUploaded: "ဇာတ်ကားအချက်အလက် သိမ်းဆည်းပြီးပါပြီ။", msgVipSuccess: "VIP ဝင်ရောက်ခြင်း အောင်မြင်ပါသည်။",
    msgNotEnough: "Points မလုံလောက်ပါ။ လိုအပ်သည် - ", msgUserSaved: "အချက်အလက် ပြင်ဆင်/သိမ်းဆည်း ပြီးပါပြီ!", msgDeleted: "ဖျက်သိမ်းပြီးပါပြီ။",
    msgCopied: "ကူးယူပြီးပါပြီ!", payMenuDeposit: "ငွေသွင်းရန်", payMenuHistory: "မိမိမှတ်တမ်း", paySelectMethod: "ငွေသွင်းရန် ရွေးချယ်ပါ",
    payBank: "ဘဏ်", payEwallet: "E - ပိုက်ဆံအိတ်", payAccountNo: "အကောင့်နံပါတ် (Account No)", payTxnId: "ငွေလွှဲ ID", paySubmitBtn: "တင်သွင်းရန်", 
    payWarnTitle: "အရေးကြီးသတိပေးချက်", payWarnDesc: "ငွေလွှဲရာတွင် Description (မှတ်ချက်) နေရာ၌ ဘာမှမရေးပါနှင့်။",
    payWarnTime: "ငွေသွင်းထားသူများအနေဖြင့် မနက် ၁ နာရီမှ မနက် ၆ နာရီအတွင်း၊ နေ့ခင်း ၁၂ နာရီမှ ည ၉ နာရီအတွင်းသာ သွင်းပေးပါရန်။ ကျန်သောအချိန်များတွင် Admin မရှိပါသဖြင့် စောင့်ဆိုင်းပေးရပါမည်။",
    statusPending: "စောင့်ဆိုင်းဆဲ", statusSuccess: "အောင်မြင်ပါပြီ", statusRejected: "ငြင်းပယ်ခံရသည်",
    changePwd: "စကားဝှက်ပြောင်းလဲရန်", contactUs: "ဆက်သွယ်ရန်", duplicateId: "ဒီ ငွေလွှဲ ID ကို အသုံးပြုပြီးသားဖြစ်နေပါသည် (Already used).", remarkLabel: "အကြောင်းပြချက်: ",
    createUserTitle: "အကောင့်သစ်ဖန်တီးရန်", editUserTitle: "အကောင့် ပြင်ဆင်ရန်", pointsInput: "Points (မှတ်)", role: "အဆင့်သတ်မှတ်ချက် (Role)",
    confirmDelTitle: "သေချာပြီလား?", confirmDelDesc: "ဤအချက်အလက်ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား? ဖျက်ပြီးပါက ပြန်ယူ၍မရပါ။",
    confirmRejectTitle: "ပယ်ချရသည့် အကြောင်းရင်း", rejectPlaceholder: "အကြောင်းပြချက်ကို ရေးပါ...", 
    oldPwd: "လက်ရှိ စကားဝှက်", newPwd: "စကားဝှက် အသစ်", confirmPwd: "စကားဝှက် အသစ် (အတည်ပြုရန်)", pwdMismatch: "စကားဝှက်များ မတူညီပါ!", wrongOldPwd: "လက်ရှိ စကားဝှက် မှားယွင်းနေပါသည်!",
    choosePlatform: "ကြည့်ရှုမည့် နေရာကို ရွေးချယ်ပါ", watchOn: "ကြည့်ရှုရန် -",
    downloadQR: "QR ကို ဒေါင်းလုဒ်လုပ်ရန်",
    rememberMe: "နောက်တစ်ခါ ဝင်စရာမလိုအောင် မှတ်သားထားမည်"
  }
};

const INITIAL_CATEGORIES = ['All']; 
const INITIAL_PLATFORMS = ['Facebook', 'Telegram', 'Viber', 'Drive', 'Other']; 

const INITIAL_SHOWS: VideoCardData[] = [
  {
    id: 'cw-1', title_en: 'Unlucky Bae', title_mm: 'ကံမကောင်းတဲ့ချစ်သူ',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&auto=format&fit=crop&q=80',
    category: 'All', description: 'When two opposite college students end up as accidental roommates...',
    totalEpisodes: 2, pointsPerEp: 20, vipTelegramLink: 'https://t.me/sweetieworld_vip',
    episodes: [
      { epLabel: 'EP 1', links: [{platform: 'Telegram', url: 'https://t.me/example'}, {platform: 'Facebook', url: 'https://facebook.com'}], releaseDateRaw: '', releaseDate: '' },
      { epLabel: 'EP 2', links: [], releaseDateRaw: '2026-08-04T18:00', releaseDate: '4 Aug 2026 6:00 PM' }
    ]
  }
];

const INITIAL_USERS: UserData[] = [
  { username: 'admin', email: 'admin@gmail.com', password: '123', role: 'admin', points: 999999, vip: false, unlockedShows: [] },
  { username: 'testuser', email: 'user@gmail.com', password: '123', role: 'user', points: 200, vip: false, unlockedShows: [] }
];

export default function SweetieWorldApp() {
  const [isClient, setIsClient] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lang, setLang] = useState<'mm' | 'en'>('mm');
  const t = TRANSLATIONS[lang];

  const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);
  const [shows, setShows] = useState<VideoCardData[]>(INITIAL_SHOWS);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [platforms, setPlatforms] = useState<string[]>(INITIAL_PLATFORMS);
  const [promotions, setPromotions] = useState<ContentItem[]>([]);
  const [faqs, setFaqs] = useState<ContentItem[]>([]);
  const [pointRequests, setPointRequests] = useState<PointRequest[]>([]);
  const [paymentProviders, setPaymentProviders] = useState(INITIAL_PROVIDERS);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  
  // Custom 3D Modal States with dynamic action support
  const [alertModal, setAlertModal] = useState<{message: string, actionText?: string, onAction?: () => void} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{message?: string, onConfirm: () => void} | null>(null);
  const [promptModal, setPromptModal] = useState<{title: string, placeholder: string, onSubmit: (val: string) => void} | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');
  
  // Password View States
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showPwdOld, setShowPwdOld] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // New State for "Remember Me"
  
  // Password Change State
  const [changePwdModalOpen, setChangePwdModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });

  // New Provider State
  const [newProvider, setNewProvider] = useState({ name: '', type: 'banks', accountNo: '' });

  // Platform Selector Modal for multiple links
  const [platformSelectModal, setPlatformSelectModal] = useState<{ep: EpisodeData, show: VideoCardData} | null>(null);

  // Pagination States အသစ်များ
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);
  const [showsPage, setShowsPage] = useState(1);
  const [showsPerPage, setShowsPerPage] = useState(10);

  // Bulk Delete State
  const [bulkDeleteDate, setBulkDeleteDate] = useState('');

  // --- Firebase Data Fetching ---
  useEffect(() => {
    setIsClient(true);
    const loadData = async () => {
      try {
        const fetchDoc = async (colName: string, setFn: any, defaultVal: any) => {
           const snap = await getDoc(doc(db, "SiteData", colName));
           if (snap.exists() && snap.data().data && snap.data().data.length > 0) {
               setFn(snap.data().data);
           } else if (defaultVal) {
               setFn(defaultVal);
           }
        };
        
        const fetchObjDoc = async (colName: string, setFn: any, defaultVal: any) => {
           const snap = await getDoc(doc(db, "SiteData", colName));
           if (snap.exists() && snap.data().data) {
               setFn(snap.data().data);
           } else if (defaultVal) {
               setFn(defaultVal);
           }
        };

        await fetchDoc("users", setUsers, INITIAL_USERS);
        
        const showsSnap = await getDoc(doc(db, "SiteData", "shows"));
        if (showsSnap.exists() && showsSnap.data().data && showsSnap.data().data.length > 0) {
           const parsedShows = showsSnap.data().data;
           const migratedShows = parsedShows.map((s: any) => ({
              ...s,
              episodes: s.episodes.map((ep: any) => ({
                  ...ep,
                  links: ep.links ? ep.links : (ep.link ? [{ platform: 'Default', url: ep.link }] : [])
              }))
           }));
           setShows(migratedShows);
        } else {
           setShows(INITIAL_SHOWS);
        }

        await fetchDoc("categories", setCategories, INITIAL_CATEGORIES);
        await fetchDoc("platforms", setPlatforms, INITIAL_PLATFORMS);
        await fetchDoc("promotions", setPromotions, [{ id: '1', title_en: 'Welcome Bonus', body_en: 'New members get free VIP trial for 3 days!', title_mm: 'အကောင့်သစ် Bonus', body_mm: 'အကောင့်အသစ် ဖွင့်သူများအတွက် VIP ၃ ရက် အခမဲ့ရရှိမည်!' }]);
        await fetchDoc("faqs", setFaqs, [{ id: '1', title_en: 'How to buy points?', body_en: 'Transfer via KPay or WavePay. Then submit your Transaction ID.', title_mm: 'Point ဘယ်လိုဝယ်ရမလဲ?', body_mm: 'KPay, WavePay မှ ငွေလွှဲပါ။ ပြီးလျှင် Transaction ID အား ထည့်ပေးပါ။' }]);
        await fetchDoc("pointRequests", setPointRequests, []);
        await fetchObjDoc("paymentProviders", setPaymentProviders, INITIAL_PROVIDERS);
        await fetchObjDoc("siteConfig", setSiteConfig, DEFAULT_CONFIG);

      } catch(e) {
        console.error("Firebase fetch error", e);
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadData();
  }, []);

  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // --- Auto Login Check (Remember Me) ---
  useEffect(() => {
    if (isInitialLoad || users.length === 0) return;
    const savedUser = localStorage.getItem('jbsehunjaes_auth');
    if (savedUser && !currentUser) {
      const found = users.find(u => u.username === savedUser);
      if (found) setCurrentUser(found);
      else localStorage.removeItem('jbsehunjaes_auth'); // Clean up if user is deleted
    }
  }, [isInitialLoad, users]);

  // --- Real-time Sync Helper (To get fresh data on demand instantly) ---
  const syncLatestData = async () => {
    try {
      const pSnap = await getDoc(doc(db, "SiteData", "pointRequests"));
      if (pSnap.exists() && pSnap.data().data) {
         setPointRequests(prev => JSON.stringify(prev) !== JSON.stringify(pSnap.data().data) ? pSnap.data().data : prev);
      }
      const uSnap = await getDoc(doc(db, "SiteData", "users"));
      if (uSnap.exists() && uSnap.data().data) {
         const fetchedUsers = uSnap.data().data;
         setUsers(prev => JSON.stringify(prev) !== JSON.stringify(fetchedUsers) ? fetchedUsers : prev);
         setCurrentUser(prev => {
            if (!prev) return prev;
            const updated = fetchedUsers.find((u: UserData) => u.username === prev.username);
            return (updated && JSON.stringify(prev) !== JSON.stringify(updated)) ? updated : prev;
         });
      }
    } catch(e) {
      console.error("Sync error:", e);
    }
  };

  // --- Firebase Data Auto-Saving ---
  useEffect(() => { if (!isInitialLoad) setDoc(doc(db, "SiteData", "users"), { data: users }); }, [users, isInitialLoad]);
  useEffect(() => { if (!isInitialLoad) setDoc(doc(db, "SiteData", "shows"), { data: shows }); }, [shows, isInitialLoad]);
  useEffect(() => { if (!isInitialLoad) setDoc(doc(db, "SiteData", "categories"), { data: categories }); }, [categories, isInitialLoad]);
  useEffect(() => { if (!isInitialLoad) setDoc(doc(db, "SiteData", "platforms"), { data: platforms }); }, [platforms, isInitialLoad]);
  useEffect(() => { if (!isInitialLoad) setDoc(doc(db, "SiteData", "promotions"), { data: promotions }); }, [promotions, isInitialLoad]);
  useEffect(() => { if (!isInitialLoad) setDoc(doc(db, "SiteData", "faqs"), { data: faqs }); }, [faqs, isInitialLoad]);
  useEffect(() => { if (!isInitialLoad) setDoc(doc(db, "SiteData", "pointRequests"), { data: pointRequests }); }, [pointRequests, isInitialLoad]);
  useEffect(() => { if (!isInitialLoad) setDoc(doc(db, "SiteData", "paymentProviders"), { data: paymentProviders }); }, [paymentProviders, isInitialLoad]);
  useEffect(() => { if (!isInitialLoad) setDoc(doc(db, "SiteData", "siteConfig"), { data: siteConfig }); }, [siteConfig, isInitialLoad]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false); 
  const [activeTab, setActiveTab] = useState<'home' | 'promo' | 'faq'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [payStep, setPayStep] = useState<'menu' | 'providers' | 'form' | 'history'>('menu');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [idCodeInput, setIdCodeInput] = useState('');
  
  const [selectedShow, setSelectedShow] = useState<VideoCardData | null>(null);
  const [vipModalShow, setVipModalShow] = useState<VideoCardData | null>(null);
  const [scheduleAlert, setScheduleAlert] = useState<{isOpen: boolean, date: string, show: VideoCardData} | null>(null);
  
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'points' | 'history' | 'settings' | 'promo' | 'upload'>('users');
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminPointSearch, setAdminPointSearch] = useState('');
  const [adminHistorySearch, setAdminHistorySearch] = useState('');
  const [adminUploadedSearch, setAdminUploadedSearch] = useState('');
  const [adminPromoSearch, setAdminPromoSearch] = useState('');
  const [adminFaqSearch, setAdminFaqSearch] = useState('');
  
  const [approveAmounts, setApproveAmounts] = useState<Record<string, number>>({});
  const [editUserModal, setEditUserModal] = useState<{isOpen: boolean, mode: 'create'|'edit', oldUsername?: string}>({isOpen: false, mode: 'create'});
  const [editUserForm, setEditUserForm] = useState<UserData>({username: '', email: '', password: '', role: 'user', points: 0, vip: false, unlockedShows: []});
  
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editingShowId, setEditingShowId] = useState<string | null>(null);
  const [newPromo, setNewPromo] = useState({ title_en: '', body_en: '', title_mm: '', body_mm: '' });
  const [newFaq, setNewFaq] = useState({ title_en: '', body_en: '', title_mm: '', body_mm: '' });
  const [newVideo, setNewVideo] = useState<Partial<VideoCardData>>({ episodes: [], title_en: '', title_mm: '', pointsPerEp: 20 });
  const [epCount, setEpCount] = useState(1);
  const [newCategory, setNewCategory] = useState('');
  const [newPlatform, setNewPlatform] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t.msgCopied);
  };

  const handleDownloadQR = async (url: string, providerName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${providerName}_QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      showToast("QR Code Downloaded!");
    } catch (error) {
      // Fallback 
      const a = document.createElement('a');
      a.href = url;
      a.download = `${providerName}_QR.png`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Pagination UI Render Component
  const renderPagination = (currentPage: number, setPage: (p: number) => void, itemsPerPage: number, setItemsPerPage: (p: number) => void, totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    return (
      <div className="flex flex-wrap justify-between items-center mt-4 bg-black/40 p-3 rounded-xl border border-zinc-800 gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
          <span>{lang === 'en' ? 'Show' : 'ပြသရန်'}</span>
          <select value={itemsPerPage} onChange={e => {setItemsPerPage(Number(e.target.value)); setPage(1);}} className="bg-black border border-zinc-700 rounded px-2 py-1 text-white outline-none cursor-pointer">
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>{lang === 'en' ? 'entries' : 'ခု'}</span>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 text-xs font-bold transition">Prev</button>
          <span className="text-xs font-bold text-zinc-400">{lang === 'en' ? 'Page' : 'စာမျက်နှာ'} {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 text-xs font-bold transition">Next</button>
        </div>
      </div>
    );
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'register') {
      const exists = users.find(u => u.username.toLowerCase() === authForm.username.trim().toLowerCase() || u.email.toLowerCase() === authForm.email.trim().toLowerCase());
      if (exists) return setAuthError(t.msgExists);
      const newUser: UserData = { ...authForm, role: 'user', points: 0, vip: false, unlockedShows: [] };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      
      // Save Remember Me
      if (rememberMe) localStorage.setItem('jbsehunjaes_auth', newUser.username);
      else localStorage.removeItem('jbsehunjaes_auth');
      
      showToast(t.msgSuccess);
      setAuthModalOpen(false);
      setAuthForm({ username: '', email: '', password: '' });
      setShowAuthPassword(false);
    } else if (authMode === 'login') {
      const inputUsernameOrEmail = authForm.username.trim().toLowerCase();
      const user = users.find(u => 
        (u.username.toLowerCase() === inputUsernameOrEmail || u.email.toLowerCase() === inputUsernameOrEmail) && 
        u.password === authForm.password
      );
      if (user) {
        setCurrentUser(user);
        
        // Save Remember Me
        if (rememberMe) localStorage.setItem('jbsehunjaes_auth', user.username);
        else localStorage.removeItem('jbsehunjaes_auth');
        
        showToast(t.msgLoginSucc);
        setAuthModalOpen(false);
        setAuthForm({ username: '', email: '', password: '' });
        setShowAuthPassword(false);
      } else {
        setAuthError(t.msgWrong);
      }
    } else if (authMode === 'forgot') {
      const user = users.find(u => u.username.toLowerCase() === authForm.username.trim().toLowerCase() && u.email.toLowerCase() === authForm.email.trim().toLowerCase());
      if (user) {
         setAlertModal({ message: `Password: ${user.password}` });
         setAuthMode('login');
      } else {
         setAuthError(t.msgWrong);
      }
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if(!currentUser) return;
    if(pwdForm.old !== currentUser.password) {
       return setAlertModal({ message: t.wrongOldPwd });
    }
    if(pwdForm.new !== pwdForm.confirm) {
       return setAlertModal({ message: t.pwdMismatch });
    }
    const updatedUsers = users.map(u => u.username === currentUser.username ? {...u, password: pwdForm.new.trim()} : u);
    setUsers(updatedUsers);
    setCurrentUser({...currentUser, password: pwdForm.new.trim()});
    showToast("Password updated successfully!");
    setChangePwdModalOpen(false);
    setPwdForm({ old: '', new: '', confirm: '' });
    setShowPwdOld(false); setShowPwdNew(false); setShowPwdConfirm(false);
  };

  const handlePointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProvider || !idCodeInput.trim()) return;
    
    const isDuplicate = pointRequests.some(r => r.idCode.trim().toLowerCase() === idCodeInput.trim().toLowerCase());
    if (isDuplicate) {
      return setAlertModal({ message: t.duplicateId });
    }
    
    const newReq: PointRequest = {
      id: Date.now().toString(),
      username: currentUser.username,
      provider: selectedProvider.name,
      idCode: idCodeInput.trim(),
      date: new Date().toISOString(),
      status: 'pending'
    };
    
    setPointRequests([newReq, ...pointRequests]);
    showToast(t.msgPointSent);
    setIdCodeInput('');
    setPayStep('history');
  };

  const handleAdminSaveUser = () => {
    if (editUserModal.mode === 'create') {
      const exists = users.find(u => u.username.toLowerCase() === editUserForm.username.trim().toLowerCase() || u.email.toLowerCase() === editUserForm.email.trim().toLowerCase());
      if (exists) return setAlertModal({ message: t.msgExists });
      setUsers([{...editUserForm, username: editUserForm.username.trim(), email: editUserForm.email.trim()}, ...users]);
    } else {
      setUsers(users.map(u => u.username === editUserModal.oldUsername ? {...editUserForm, username: editUserForm.username.trim(), email: editUserForm.email.trim()} : u));
      if(currentUser?.username === editUserModal.oldUsername) setCurrentUser({...editUserForm, username: editUserForm.username.trim(), email: editUserForm.email.trim()});
    }
    showToast(t.msgUserSaved);
    setEditUserModal({isOpen: false, mode: 'create'});
    setShowAuthPassword(false);
  };

  const getRequiredPoints = (show: VideoCardData) => {
    const unreleasedCount = show.episodes.filter(ep => !ep.links || ep.links.length === 0).length;
    return unreleasedCount * (show.pointsPerEp ?? 20);
  };

  // Bulk Delete Data calculation
  const recordsToDelete = bulkDeleteDate ? pointRequests.filter(r => {
    const reqD = new Date(r.date);
    const selD = new Date(bulkDeleteDate);
    selD.setHours(23, 59, 59, 999);
    return reqD.getTime() <= selD.getTime();
  }) : [];

  const filteredShows = shows.filter(s => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    const matchSearch = (s.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.title_mm?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const adminFilteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(adminUserSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(adminUserSearch.toLowerCase())
  );
  const paginatedUsers = adminFilteredUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);

  const adminPendingPoints = pointRequests.filter(p => p.status === 'pending');
  const adminFilteredPoints = adminPendingPoints.filter(p => 
    p.username.toLowerCase().includes(adminPointSearch.toLowerCase()) || 
    p.idCode.toLowerCase().includes(adminPointSearch.toLowerCase())
  );

  const adminFilteredHistory = pointRequests.filter(r => r.username.toLowerCase().includes(adminHistorySearch.toLowerCase()) || r.idCode.toLowerCase().includes(adminHistorySearch.toLowerCase()));
  const paginatedHistory = adminFilteredHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);

  const adminUploadedShowsFiltered = shows.filter(s => 
    (s.title_en?.toLowerCase().includes(adminUploadedSearch.toLowerCase()) || 
     s.title_mm?.toLowerCase().includes(adminUploadedSearch.toLowerCase()))
  );
  const paginatedShows = adminUploadedShowsFiltered.slice((showsPage - 1) * showsPerPage, showsPage * showsPerPage);

  const adminFilteredPromos = promotions.filter(p => 
    (p.title_en?.toLowerCase().includes(adminPromoSearch.toLowerCase()) || 
     p.title_mm?.toLowerCase().includes(adminPromoSearch.toLowerCase()))
  );

  const adminFilteredFaqs = faqs.filter(f => 
    (f.title_en?.toLowerCase().includes(adminFaqSearch.toLowerCase()) || 
     f.title_mm?.toLowerCase().includes(adminFaqSearch.toLowerCase()))
  );

  if (!isClient) return null;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center text-[#fcd385]">
        <div className="w-12 h-12 border-4 border-[#fcd385] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-widest uppercase text-sm">Loading Jbsehunjae’s World...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-100 pb-20" style={{ fontFamily: '"Georgia", "Times New Roman", "Myanmar Text", serif' }}>
      
      {/* CSS For Right to Left Marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marqueeRTL {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-rtl {
          display: inline-block;
          white-space: nowrap;
          animation: marqueeRTL 20s linear infinite;
          will-change: transform;
        }
      `}} />

      {/* --- TOAST --- */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-[300] flex items-center gap-3 bg-[#6b1111] text-[#fcd385] border border-[#fcd385] px-5 py-3 rounded-xl shadow-2xl animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* --- MOBILE SIDEBAR MENU --- */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[100] flex font-sans lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-[#161616] h-full shadow-2xl flex flex-col border-r border-[#fcd385]/20 animate-slide-in">
             <div className="flex justify-between items-center p-5 border-b border-[#fcd385]/20 bg-[#1a1a1a]">
                <h3 className="text-lg font-black text-[#fcd385] tracking-wider italic">Menu</h3>
                <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-white transition p-1"><X className="w-6 h-6"/></button>
             </div>
             <nav className="flex-1 overflow-y-auto p-4 space-y-3">
                <button onClick={() => {setActiveTab('home'); setAdminDashboardOpen(false); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition ${activeTab === 'home' && !adminDashboardOpen ? 'bg-[#fcd385] text-[#3e1717]' : 'bg-[#1f1f1f] text-zinc-300 hover:text-white border border-zinc-800'}`}><Home className="w-5 h-5"/> {t.home}</button>
                <button onClick={() => {setActiveTab('promo'); setAdminDashboardOpen(false); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition ${activeTab === 'promo' && !adminDashboardOpen ? 'bg-[#fcd385] text-[#3e1717]' : 'bg-[#1f1f1f] text-zinc-300 hover:text-white border border-zinc-800'}`}><Gift className="w-5 h-5"/> {t.promotions}</button>
                <button onClick={() => {setActiveTab('faq'); setAdminDashboardOpen(false); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition ${activeTab === 'faq' && !adminDashboardOpen ? 'bg-[#fcd385] text-[#3e1717]' : 'bg-[#1f1f1f] text-zinc-300 hover:text-white border border-zinc-800'}`}><HelpCircle className="w-5 h-5"/> {t.faq}</button>
                
                {currentUser?.role === 'admin' && (
                  <button onClick={() => {syncLatestData(); setAdminDashboardOpen(true); setSidebarOpen(false);}} className="w-full mt-6 flex items-center gap-3 p-3 rounded-xl font-bold bg-red-900/50 text-red-200 border border-red-500/30 hover:bg-red-800 transition">
                    <ShieldCheck className="w-5 h-5"/> {t.adminPanel}
                  </button>
                )}
             </nav>
          </div>
        </div>
      )}

      {/* --- DESKTOP & MOBILE NAVIGATION HEADER --- */}
      <header className="sticky top-0 z-40 bg-[#161616]/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex flex-wrap gap-4 items-center justify-between shadow-lg">
        <div className="flex items-center gap-4 lg:gap-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-300 hover:text-white"><Menu className="w-7 h-7" /></button>
          <a href="#" className="flex items-center gap-2 group" onClick={() => {setActiveTab('home'); setAdminDashboardOpen(false); setSelectedShow(null);}}>
            <div className="text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r from-[#fcd385] to-[#d4af37] bg-clip-text text-transparent italic">Jbsehunjae’s World</div>
          </a>
          <nav className="hidden lg:flex items-center gap-1 bg-[#1f1f1f] p-1 rounded-xl border border-zinc-800 font-sans">
            <button onClick={() => {setActiveTab('home'); setAdminDashboardOpen(false);}} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition ${activeTab === 'home' && !adminDashboardOpen ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-white'}`}><Home className="w-4 h-4"/> {t.home}</button>
            <button onClick={() => {setActiveTab('promo'); setAdminDashboardOpen(false);}} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition ${activeTab === 'promo' && !adminDashboardOpen ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-white'}`}><Gift className="w-4 h-4"/> {t.promotions}</button>
            <button onClick={() => {setActiveTab('faq'); setAdminDashboardOpen(false);}} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition ${activeTab === 'faq' && !adminDashboardOpen ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-white'}`}><HelpCircle className="w-4 h-4"/> {t.faq}</button>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 bg-[#1f1f1f] border border-zinc-700 hover:border-[#fcd385]/50 rounded-lg px-2 py-1.5 sm:px-2 sm:py-1.5 transition cursor-pointer font-sans shrink-0">
            <Globe className="w-4 h-4 text-[#fcd385]" />
            <select value={lang} onChange={(e) => setLang(e.target.value as 'mm' | 'en')} className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer">
              <option value="mm">မြန်မာ</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="relative hidden sm:block font-sans">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-[#1f1f1f] border border-zinc-700 pl-9 pr-4 py-1.5 rounded-full text-xs text-white focus:outline-none focus:border-[#fcd385] w-48 transition-all" />
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-4 font-sans relative">
              {currentUser.role === 'admin' && (
                <button onClick={() => {syncLatestData(); setAdminDashboardOpen(true);}} className="hidden sm:flex text-xs bg-gradient-to-r from-[#b30000] to-[#660000] hover:brightness-110 px-3 py-1.5 rounded-lg font-bold transition items-center gap-1 shadow-lg">
                  <ShieldCheck className="w-4 h-4" /> Admin
                </button>
              )}
              
              {/* BIGGER POINTS BUTTON */}
              <button onClick={() => {syncLatestData(); setPayStep('menu'); setPointModalOpen(true);}} className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#2b0303] to-[#1a0101] border-2 border-[#fcd385] text-[#fcd385] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-black shadow-[0_0_10px_rgba(252,211,133,0.3)] hover:brightness-110 transition shrink-0">
                <Coins className="w-5 h-5 sm:w-5 sm:h-5 text-yellow-400" /> <span>{currentUser.points} {t.pts}</span>
              </button>
              
              {/* BIGGER USER PROFILE BUTTON */}
              <div onClick={() => {syncLatestData(); setUserMenuOpen(true);}} className="cursor-pointer p-2 sm:p-2 bg-[#fcd385] rounded-full hover:bg-yellow-400 transition shadow-[0_0_10px_rgba(252,211,133,0.4)] border-2 border-[#d4af37] flex items-center justify-center shrink-0">
                 <User className="w-5 h-5 sm:w-5 sm:h-5 text-[#3e1717]" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-sans">
              <button onClick={() => {setAuthForm({username:'', email:'', password:''}); setAuthError(''); setAuthMode('login'); setAuthModalOpen(true);}} className="text-xs sm:text-sm font-bold bg-[#fcd385] text-[#3e1717] px-3 sm:px-5 py-1.5 rounded-md hover:bg-yellow-400 transition shadow-lg">{t.loginBtn}</button>
              <button onClick={() => {setAuthForm({username:'', email:'', password:''}); setAuthError(''); setAuthMode('register'); setAuthModalOpen(true);}} className="hidden sm:block text-sm font-bold border border-[#fcd385] text-[#fcd385] px-5 py-1.5 rounded-md hover:bg-[#fcd385]/10 transition">{t.signUpBtn}</button>
            </div>
          )}
        </div>
      </header>

      {/* --- MARQUEE BELOW HEADER (RIGHT TO LEFT) FOR EVERYONE --- */}
      {(siteConfig.marqueeEn || siteConfig.marqueeMm) && (
        <div className="bg-gradient-to-r from-[#1a0101] via-[#2b0303] to-[#1a0101] text-[#fcd385] py-2 overflow-hidden border-b border-[#fcd385]/20 flex w-full">
          <div className="animate-marquee-rtl text-xs font-bold font-sans w-full">
            {lang === 'en' ? siteConfig.marqueeEn : siteConfig.marqueeMm}
          </div>
        </div>
      )}

      {/* --- RE-SIZED USER PROFILE SLIDE MENU --- */}
      {userMenuOpen && currentUser && (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setUserMenuOpen(false)} />
          <div className="relative w-72 max-w-[75%] bg-[#5c0909] h-full shadow-2xl flex flex-col animate-slide-in border-l border-[#fcd385]/30">
             <div className="flex justify-between items-center p-4 border-b border-[#fcd385]/20">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full border border-[#fcd385] flex items-center justify-center bg-black/30">
                     <User className="w-4 h-4 text-[#fcd385]"/>
                   </div>
                   <h3 className="text-base font-bold text-white uppercase tracking-wider">{currentUser.username}</h3>
                </div>
                <button onClick={() => setUserMenuOpen(false)} className="text-white hover:text-[#fcd385] transition"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-4 bg-black/20 border-b border-[#fcd385]/10">
                <p className="text-xs text-zinc-300 mb-1">{t.balance}</p>
                <p className="text-2xl font-black text-[#fcd385]">Ks. {currentUser.points}</p>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <button onClick={() => {setChangePwdModalOpen(true); setUserMenuOpen(false);}} className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/40 rounded-xl transition text-white font-bold text-sm">
                  <div className="flex items-center gap-3"><Key className="w-4 h-4"/> {t.changePwd}</div>
                  <ChevronRight className="w-4 h-4 text-white/50"/>
                </button>
                <button onClick={() => {
                  setCurrentUser(null);
                  localStorage.removeItem('jbsehunjaes_auth'); // Logout တဲ့အခါ Remember Me ပါဖျက်မည်
                  setUserMenuOpen(false);
                }} className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/40 rounded-xl transition text-white font-bold text-sm">
                  <div className="flex items-center gap-3"><LogOut className="w-4 h-4"/> {t.logout}</div>
                  <ChevronRight className="w-4 h-4 text-white/50"/>
                </button>

                <div className="mt-6 pt-4 border-t border-[#fcd385]/10">
                  <h4 className="text-xs font-bold text-[#fcd385] mb-3">{t.contactUs}</h4>
                  <div className="space-y-2">
                    <a href={siteConfig.fbLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 bg-black/20 hover:bg-[#1877F2]/20 rounded-xl transition text-white font-bold text-sm">
                      <Globe className="w-4 h-4 text-[#1877F2]"/> Facebook
                    </a>
                    <a href={siteConfig.tgLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 bg-black/20 hover:bg-[#0088cc]/20 rounded-xl transition text-white font-bold text-sm">
                      <Send className="w-4 h-4 text-[#0088cc]"/> Telegram
                    </a>
                    <a href={siteConfig.viberLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 bg-black/20 hover:bg-[#7360f2]/20 rounded-xl transition text-white font-bold text-sm">
                      <MessageCircle className="w-4 h-4 text-[#7360f2]"/> Viber
                    </a>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- MOBILE SEARCH BAR --- */}
      <div className="sm:hidden px-4 pt-4 font-sans">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#1f1f1f] border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      {adminDashboardOpen && currentUser?.role === 'admin' ? (
        <div className="flex flex-col md:flex-row min-h-[85vh] mt-1 border-t border-zinc-800">
          <aside className="w-full md:w-72 bg-[#361c1c] md:min-h-full border-r border-[#4a2626] flex flex-col">
             <div className="p-5 border-b border-[#4a2626] bg-[#2a1414]">
                <h2 className="text-[#ff9d9d] font-black text-lg flex items-center gap-2 mb-4"><LayoutDashboard className="w-5 h-5"/> {t.adminSystem}</h2>
             </div>
             <nav className="flex-1 py-4 flex flex-col gap-1 font-sans">
                <button onClick={() => {syncLatestData(); setAdminActiveTab('users')}} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'users' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Users className="w-5 h-5"/> {t.adminTabUsers}</button>
                <button onClick={() => {syncLatestData(); setAdminActiveTab('points')}} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'points' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}>
                  <div className="relative"><Bell className="w-5 h-5"/>{adminPendingPoints.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"/>}</div> 
                  {t.adminTabPoints}
                </button>
                <button onClick={() => {syncLatestData(); setAdminActiveTab('history')}} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'history' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Clock className="w-5 h-5"/> {t.adminTabHistory}</button>
                <button onClick={() => setAdminActiveTab('settings')} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'settings' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Settings className="w-5 h-5"/> {t.adminTabSettings}</button>
                <button onClick={() => setAdminActiveTab('promo')} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'promo' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Gift className="w-5 h-5"/> {t.adminTabPromo}</button>
                <button onClick={() => setAdminActiveTab('upload')} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'upload' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Upload className="w-5 h-5"/> {t.adminTabUpload}</button>
              </nav>
          </aside>

          <main className="flex-1 p-4 md:p-8 bg-[#111111]">
            
            {adminActiveTab === 'users' && (
              <div className="animate-fade-in space-y-6">
                 <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.userMgmt}</h3>
                 <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 overflow-x-auto font-sans">
                   
                   {/* User Search & Add User Section */}
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 min-w-[600px]">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" placeholder={t.searchUser} value={adminUserSearch}
                          onChange={e => {setAdminUserSearch(e.target.value); setUsersPage(1);}}
                          className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                        />
                      </div>
                      <button onClick={() => {
                        setEditUserForm({username: '', email: '', password: '', role: 'user', points: 0, vip: false, unlockedShows: []});
                        setEditUserModal({isOpen: true, mode: 'create'});
                      }} className="bg-[#fcd385] text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-yellow-400 transition whitespace-nowrap">
                        <UserPlus className="w-4 h-4" /> {t.createUser}
                      </button>
                   </div>

                   <div className="min-w-[600px]">
                     {paginatedUsers.length === 0 ? (
                        <p className="text-zinc-500 text-sm py-4">No users found.</p>
                     ) : paginatedUsers.map(u => (
                        <div key={u.username} className="grid grid-cols-5 gap-4 items-center bg-black/40 p-4 rounded-xl border border-zinc-800 hover:border-[#4a1515] transition mb-2">
                          <div className="col-span-2">
                            <p className="text-sm font-bold text-white">{u.username}</p>
                            <p className="text-xs text-zinc-400 mt-1">{u.email}</p>
                          </div>
                          <div><span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${u.role==='admin' ? 'bg-red-900 text-red-200' : 'bg-zinc-800 text-zinc-300'}`}>{u.role}</span></div>
                          <div><span className="text-[#fcd385] font-bold text-sm">{u.points} {t.pts}</span></div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => {setEditUserForm({...u}); setEditUserModal({isOpen: true, mode: 'edit', oldUsername: u.username});}} className="p-2 bg-zinc-800 rounded text-blue-400 hover:bg-zinc-700 transition"><Edit className="w-4 h-4"/></button>
                            {u.username !== currentUser.username && (
                              <button onClick={() => setConfirmModal({
                                 message: t.confirmDelDesc,
                                 onConfirm: () => setUsers(users.filter(user => user.username !== u.username))
                              })} className="p-2 bg-zinc-800 rounded text-red-400 hover:bg-zinc-700 transition"><Trash2 className="w-4 h-4"/></button>
                            )}
                          </div>
                        </div>
                      ))}
                   </div>
                   
                   {/* Pagination UI */}
                   {adminFilteredUsers.length > 0 && renderPagination(usersPage, setUsersPage, usersPerPage, setUsersPerPage, adminFilteredUsers.length)}

                 </div>
              </div>
            )}

            {adminActiveTab === 'points' && (
              <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.pointReqs}</h3>
                  <button onClick={syncLatestData} className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-[#fcd385] px-3 py-2 rounded-lg transition shadow-lg border border-zinc-700">
                      <RefreshCw className="w-4 h-4" /> Sync
                  </button>
                </div>
                <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 font-sans">
                  <div className="space-y-3">
                    {adminFilteredPoints.length === 0 ? <p className="text-zinc-500 text-sm py-4">{t.noReqs}</p> : adminFilteredPoints.map(req => (
                      <div key={req.id} className="bg-black/40 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between border border-[#fcd385]/30 shadow-lg gap-4">
                        <div>
                          <p className="text-sm font-bold text-white mb-1">User: <span className="text-blue-400">{req.username}</span></p>
                          <p className="text-xs text-zinc-400 mb-0.5">Provider: {req.provider}</p>
                          <p className="text-xs text-[#fcd385] font-bold">Txn ID: {req.idCode}</p>
                          <p className="text-[10px] text-zinc-500 mt-1">{formatDateTime(req.date)}</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <input 
                            type="number" min="1" placeholder="Amount" value={approveAmounts[req.id] || ''}
                            onChange={(e) => setApproveAmounts({...approveAmounts, [req.id]: Number(e.target.value)})}
                            className="w-24 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white rounded-lg focus:outline-none focus:border-[#fcd385]"
                          />
                          <button onClick={() => {
                            const amount = approveAmounts[req.id] || 0;
                            if (amount <= 0) return setAlertModal({ message: "Please enter a valid amount." });
                            
                            setUsers(users.map(u => u.username === req.username ? { ...u, points: u.points + amount } : u));
                            setPointRequests(pointRequests.map(p => p.id === req.id ? { ...p, status: 'approved', amount } : p));
                            showToast(`${amount} ${t.msgApproved}`);
                          }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition flex-1 md:flex-none">
                            {t.approveBtn}
                          </button>
                          
                          {/* Reject with Remark 3D Modal */}
                          <button onClick={() => {
                             setPromptModal({
                               title: t.confirmRejectTitle,
                               placeholder: t.rejectPlaceholder,
                               onSubmit: (reason) => {
                                 setPointRequests(pointRequests.map(p => p.id === req.id ? { ...p, status: 'rejected', remark: reason } : p));
                                 showToast("Request Rejected");
                               }
                             });
                          }} className="bg-red-800 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition flex-1 md:flex-none">
                            {t.rejectBtn}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'history' && (
              <div className="animate-fade-in space-y-6">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.adminTabHistory}</h3>
                <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 font-sans">
                  
                  {/* Bulk Delete Section */}
                  <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div>
                      <label className="block text-xs font-bold text-red-400 mb-1">Clear Old Records (On or Before)</label>
                      <input 
                        type="date" 
                        value={bulkDeleteDate} 
                        onChange={e => setBulkDeleteDate(e.target.value)} 
                        className="bg-black/50 border border-red-900/50 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 w-full sm:w-auto outline-none"
                      />
                    </div>
                    {bulkDeleteDate && (
                       <div className="flex items-center gap-4 mt-2 sm:mt-0">
                         <span className="text-sm font-bold text-red-300 bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-900/50">
                           {recordsToDelete.length} records found
                         </span>
                         <button 
                           disabled={recordsToDelete.length === 0}
                           onClick={() => {
                             setConfirmModal({
                               message: `Are you sure you want to delete ${recordsToDelete.length} records? This action cannot be undone.`,
                               onConfirm: () => {
                                 const remaining = pointRequests.filter(r => !recordsToDelete.includes(r));
                                 setPointRequests(remaining);
                                 setBulkDeleteDate('');
                                 showToast(`${recordsToDelete.length} records deleted.`);
                               }
                             })
                           }}
                           className="bg-red-700 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
                         >
                           <Trash2 className="w-4 h-4"/> Delete All Selected
                         </button>
                       </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input 
                        type="text" placeholder="Search User or Txn ID..." value={adminHistorySearch}
                        onChange={e => {setAdminHistorySearch(e.target.value); setHistoryPage(1);}}
                        className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {paginatedHistory.length === 0 ? (
                       <p className="text-zinc-500 text-sm py-4">No records found.</p>
                    ) : (
                      paginatedHistory.map((req, i) => (
                        <div key={i} className="bg-black/40 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center border border-white/5 gap-3">
                          <div>
                            <p className="text-sm font-bold text-white mb-1">User: <span className="text-blue-400">{req.username}</span></p>
                            <p className="text-xs text-zinc-400 mb-0.5">Provider: {req.provider} | Txn ID: <span className="text-[#fcd385] font-mono">{req.idCode}</span></p>
                            {req.remark && <p className="text-[11px] text-red-300 mt-1 italic">Reason: {req.remark}</p>}
                            <p className="text-[10px] text-zinc-500 mt-1">{formatDateTime(req.date)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {req.status === 'pending' && <span className="text-[11px] bg-yellow-900/50 text-yellow-400 px-3 py-1 rounded font-bold uppercase">{t.statusPending}</span>}
                            {req.status === 'approved' && <span className="text-[11px] bg-emerald-900/50 text-emerald-400 px-3 py-1 rounded font-bold uppercase">{t.statusSuccess} (+{req.amount} Pts)</span>}
                            {req.status === 'rejected' && <span className="text-[11px] bg-red-900/50 text-red-400 px-3 py-1 rounded font-bold uppercase">{t.statusRejected}</span>}
                            
                            <button onClick={() => {
                              setConfirmModal({
                                message: t.confirmDelDesc,
                                onConfirm: () => {
                                   setPointRequests(pointRequests.filter(p => p.id !== req.id));
                                   showToast(t.msgDeleted);
                                }
                              });
                            }} className="p-2 bg-zinc-800 rounded text-red-400 hover:bg-zinc-700 transition"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Pagination UI */}
                  {adminFilteredHistory.length > 0 && renderPagination(historyPage, setHistoryPage, historyPerPage, setHistoryPerPage, adminFilteredHistory.length)}
                </div>
              </div>
            )}

            {/* SYSTEM SETTINGS TAB */}
            {adminActiveTab === 'settings' && (
              <div className="animate-fade-in space-y-6">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.adminTabSettings}</h3>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-sans">
                  <div className="space-y-6">
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Marquee / Announcement Text</h4>
                      <input type="text" placeholder="English Version" value={siteConfig.marqueeEn || ''} onChange={e => setSiteConfig({...siteConfig, marqueeEn: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385] mb-3" />
                      <input type="text" placeholder="Myanmar Version" value={siteConfig.marqueeMm || ''} onChange={e => setSiteConfig({...siteConfig, marqueeMm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>

                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Deposit Guide (Side Panel)</h4>
                      <textarea placeholder="English Version" rows={3} value={siteConfig.depositGuideEn || ''} onChange={e => setSiteConfig({...siteConfig, depositGuideEn: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385] mb-3" />
                      <textarea placeholder="Myanmar Version" rows={3} value={siteConfig.depositGuideMm || ''} onChange={e => setSiteConfig({...siteConfig, depositGuideMm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>

                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-red-400 mb-4 border-b border-zinc-800 pb-2">Important Notice (Payment form)</h4>
                      <textarea placeholder="English Version" rows={2} value={siteConfig.paymentWarningEn || ''} onChange={e => setSiteConfig({...siteConfig, paymentWarningEn: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-red-400 mb-3" />
                      <textarea placeholder="Myanmar Version" rows={2} value={siteConfig.paymentWarningMm || ''} onChange={e => setSiteConfig({...siteConfig, paymentWarningMm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-red-400" />
                    </div>

                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Contact Links (Profile Menu)</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3"><Globe className="w-5 h-5 text-[#1877F2]"/> <input type="text" value={siteConfig.fbLink || ''} onChange={e => setSiteConfig({...siteConfig, fbLink: e.target.value})} className="flex-1 bg-black border border-zinc-700 p-2 rounded-lg text-sm text-white" /></div>
                        <div className="flex items-center gap-3"><Send className="w-5 h-5 text-[#0088cc]"/> <input type="text" value={siteConfig.tgLink || ''} onChange={e => setSiteConfig({...siteConfig, tgLink: e.target.value})} className="flex-1 bg-black border border-zinc-700 p-2 rounded-lg text-sm text-white" /></div>
                        <div className="flex items-center gap-3"><MessageCircle className="w-5 h-5 text-[#7360f2]"/> <input type="text" value={siteConfig.viberLink || ''} onChange={e => setSiteConfig({...siteConfig, viberLink: e.target.value})} className="flex-1 bg-black border border-zinc-700 p-2 rounded-lg text-sm text-white" /></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Payment Methods (QR Codes)</h4>
                      
                      {paymentProviders.banks.length > 0 && <p className="text-xs text-zinc-400 mb-2 mt-4 font-bold uppercase tracking-wider">{t.payBank}</p>}
                      <div className="space-y-3">
                        {paymentProviders.banks.map((p, idx) => (
                          <div key={p.id} className="bg-black/40 p-3 rounded-lg border border-zinc-800 space-y-2">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3 w-40">
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${p.color}`}>{p.name[0]}</div>
                                 <span className="text-white font-bold text-sm">{p.name}</span>
                               </div>
                               <button onClick={() => setConfirmModal({
                                  message: "Delete this bank provider?",
                                  onConfirm: () => setPaymentProviders({...paymentProviders, banks: paymentProviders.banks.filter(b => b.id !== p.id)})
                               })} className="p-1.5 bg-red-900/30 rounded text-red-400 hover:bg-red-900 transition"><Trash2 className="w-4 h-4"/></button>
                             </div>
                             <div className="flex flex-col gap-2 mt-2">
                               <input type="text" placeholder={t.qrLinkPlaceholder} value={p.qrImage || ''} onChange={e => {
                                   const newBanks = [...paymentProviders.banks]; newBanks[idx].qrImage = e.target.value;
                                   setPaymentProviders({...paymentProviders, banks: newBanks});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                               <input type="text" placeholder="Account Number..." value={p.accountNo || ''} onChange={e => {
                                   const newBanks = [...paymentProviders.banks]; newBanks[idx].accountNo = e.target.value;
                                   setPaymentProviders({...paymentProviders, banks: newBanks});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                             </div>
                          </div>
                        ))}
                      </div>

                      {paymentProviders.ewallets.length > 0 && <p className="text-xs text-zinc-400 mb-2 mt-6 font-bold uppercase tracking-wider">{t.payEwallet}</p>}
                      <div className="space-y-3">
                        {paymentProviders.ewallets.map((p, idx) => (
                          <div key={p.id} className="bg-black/40 p-3 rounded-lg border border-zinc-800 space-y-2">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3 w-40">
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${p.color}`}>{p.name[0]}</div>
                                 <span className="text-white font-bold text-sm">{p.name}</span>
                               </div>
                               <button onClick={() => setConfirmModal({
                                  message: "Delete this E-Wallet provider?",
                                  onConfirm: () => setPaymentProviders({...paymentProviders, ewallets: paymentProviders.ewallets.filter(e => e.id !== p.id)})
                               })} className="p-1.5 bg-red-900/30 rounded text-red-400 hover:bg-red-900 transition"><Trash2 className="w-4 h-4"/></button>
                             </div>
                             <div className="flex flex-col gap-2 mt-2">
                               <input type="text" placeholder={t.qrLinkPlaceholder} value={p.qrImage || ''} onChange={e => {
                                   const newEwallets = [...paymentProviders.ewallets]; newEwallets[idx].qrImage = e.target.value;
                                   setPaymentProviders({...paymentProviders, ewallets: newEwallets});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                               <input type="text" placeholder="Account Number (Phone)..." value={p.accountNo || ''} onChange={e => {
                                   const newEwallets = [...paymentProviders.ewallets]; newEwallets[idx].accountNo = e.target.value;
                                   setPaymentProviders({...paymentProviders, ewallets: newEwallets});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                             </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-2">
                        <input type="text" placeholder="Name (e.g. KBZ Pay)" value={newProvider.name || ''} onChange={e => setNewProvider({...newProvider, name: e.target.value})} className="bg-black border border-zinc-700 p-2.5 rounded-lg flex-1 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                        <input type="text" placeholder="Account No" value={newProvider.accountNo || ''} onChange={e => setNewProvider({...newProvider, accountNo: e.target.value})} className="bg-black border border-zinc-700 p-2.5 rounded-lg flex-1 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                        <select value={newProvider.type || ''} onChange={e => setNewProvider({...newProvider, type: e.target.value})} className="bg-black border border-zinc-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385]">
                          <option value="banks">Bank</option>
                          <option value="ewallets">E-Wallet</option>
                        </select>
                        <button onClick={() => {
                          if(newProvider.name.trim()) {
                            const newProv = { id: 'prov-'+Date.now(), name: newProvider.name, qrImage: '', color: 'bg-zinc-600', accountNo: newProvider.accountNo };
                            if (newProvider.type === 'banks') {
                              setPaymentProviders({...paymentProviders, banks: [...paymentProviders.banks, newProv]});
                            } else {
                              setPaymentProviders({...paymentProviders, ewallets: [...paymentProviders.ewallets, newProv]});
                            }
                            setNewProvider({ name: '', type: 'banks', accountNo: '' });
                            showToast("Payment method added.");
                          }
                        }} className="bg-[#fcd385] px-4 py-2 sm:py-0 rounded-lg text-black text-sm font-bold">{t.addBtn}</button>
                      </div>
                    </div>

                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Manage Categories</h4>
                      <div className="flex gap-2 mb-4">
                         <input type="text" value={newCategory || ''} onChange={(e) => setNewCategory(e.target.value)} placeholder={t.newCatName} className="bg-black border border-zinc-700 p-2.5 rounded-lg flex-1 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                         <button onClick={() => {if(newCategory && !categories.includes(newCategory)){ setCategories([...categories, newCategory]); setNewCategory(''); showToast('Category Added');}}} className="bg-[#fcd385] px-5 rounded-lg text-black text-sm font-bold">{t.addBtn}</button>
                      </div>
                      <div className="space-y-2">
                        {categories.map(c => (
                          <div key={c} className="flex justify-between items-center bg-black p-3 rounded-lg border border-zinc-800">
                             <span className="text-sm text-white font-bold">{c}</span>
                             {c !== 'All' && (
                               <button onClick={() => setConfirmModal({
                                  message: t.confirmDelDesc,
                                  onConfirm: () => setCategories(categories.filter(cat => cat !== c))
                               })} className="p-1.5 bg-red-900/30 rounded text-red-400 hover:bg-red-900 transition"><Trash2 className="w-4 h-4"/></button>
                             )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* NEW PLATFORM MANAGE SECTION */}
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Manage Platforms (Link Types)</h4>
                      <div className="flex gap-2 mb-4">
                         <input type="text" value={newPlatform || ''} onChange={(e) => setNewPlatform(e.target.value)} placeholder="New Platform Name..." className="bg-black border border-zinc-700 p-2.5 rounded-lg flex-1 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                         <button onClick={() => {if(newPlatform && !platforms.includes(newPlatform)){ setPlatforms([...platforms, newPlatform]); setNewPlatform(''); showToast('Platform Added');}}} className="bg-[#fcd385] px-5 rounded-lg text-black text-sm font-bold">{t.addBtn}</button>
                      </div>
                      <div className="space-y-2">
                        {platforms.map(p => (
                          <div key={p} className="flex justify-between items-center bg-black p-3 rounded-lg border border-zinc-800">
                             <span className="text-sm text-white font-bold">{p}</span>
                             <button onClick={() => setConfirmModal({
                                message: t.confirmDelDesc,
                                onConfirm: () => setPlatforms(platforms.filter(plat => plat !== p))
                             })} className="p-1.5 bg-red-900/30 rounded text-red-400 hover:bg-red-900 transition"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button onClick={() => showToast(t.msgUserSaved)} className="bg-[#fcd385] text-[#3e0a0a] px-10 py-3.5 rounded-xl text-sm font-black hover:brightness-110 transition shadow-lg">
                    SAVE ALL SETTINGS
                  </button>
                </div>
              </div>
            )}

            {adminActiveTab === 'promo' && (
              <div className="animate-fade-in space-y-6">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.managePromoFaq}</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-sans">
                  {/* PROMO EDIT SECTION */}
                  <div>
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 mb-4">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 flex items-center gap-2"><Gift className="w-4 h-4"/> {editingPromoId ? "Edit Promotion" : "Add Promotion"}</h4>
                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-zinc-700">
                        <label className="text-xs text-zinc-400 mb-2 block font-bold uppercase tracking-wider">English</label>
                        <input type="text" placeholder="Title (EN)" value={newPromo.title_en || ''} onChange={e => setNewPromo({...newPromo, title_en: e.target.value})} className="w-full mb-3 bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" />
                        <textarea placeholder="Description (EN)" value={newPromo.body_en || ''} onChange={e => setNewPromo({...newPromo, body_en: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" rows={2}/>
                      </div>
                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-zinc-700">
                        <label className="text-xs text-zinc-400 mb-2 block font-bold uppercase tracking-wider">Myanmar (မြန်မာ)</label>
                        <input type="text" placeholder="Title (MM)" value={newPromo.title_mm || ''} onChange={e => setNewPromo({...newPromo, title_mm: e.target.value})} className="w-full mb-3 bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" />
                        <textarea placeholder="Description (MM)" value={newPromo.body_mm || ''} onChange={e => setNewPromo({...newPromo, body_mm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" rows={2}/>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          if (editingPromoId) {
                            setPromotions(promotions.map(p => p.id === editingPromoId ? { ...newPromo, id: editingPromoId } : p));
                            setEditingPromoId(null);
                          } else {
                            setPromotions([...promotions, {id: Date.now().toString(), ...newPromo}]); 
                          }
                          setNewPromo({title_en:'', body_en:'', title_mm:'', body_mm:''}); 
                          showToast(t.msgContentAdded);
                        }} className="flex-1 bg-[#fcd385] text-black py-2.5 rounded-lg text-sm font-bold">{editingPromoId ? t.updateBtn : t.addBtn}</button>
                        {editingPromoId && <button onClick={() => {setEditingPromoId(null); setNewPromo({title_en:'', body_en:'', title_mm:'', body_mm:''});}} className="px-4 bg-zinc-700 text-white rounded-lg font-bold">{t.cancelBtn}</button>}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" placeholder="Search Promotions..." value={adminPromoSearch || ''}
                          onChange={e => setAdminPromoSearch(e.target.value)}
                          className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                        />
                      </div>
                      {adminFilteredPromos.map(p => (
                        <div key={p.id} className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-lg flex justify-between items-center">
                           <div className="truncate pr-4 text-sm text-white font-bold">{p.title_en || p.title_mm}</div>
                           <div className="flex gap-2">
                             <button onClick={() => {setEditingPromoId(p.id); setNewPromo(p); window.scrollTo(0,0);}} className="p-2 bg-zinc-800 rounded text-blue-400 hover:bg-zinc-700"><Edit className="w-4 h-4"/></button>
                             <button onClick={() => setConfirmModal({
                               message: t.confirmDelDesc,
                               onConfirm: () => { setPromotions(promotions.filter(x => x.id !== p.id)); showToast(t.msgDeleted); }
                             })} className="p-2 bg-zinc-800 rounded text-red-400 hover:bg-zinc-700"><Trash2 className="w-4 h-4"/></button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* FAQ EDIT SECTION */}
                  <div>
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 mb-4">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 flex items-center gap-2"><HelpCircle className="w-4 h-4"/> {editingFaqId ? "Edit FAQ" : "Add FAQ"}</h4>
                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-zinc-700">
                        <label className="text-xs text-zinc-400 mb-2 block font-bold uppercase tracking-wider">English</label>
                        <input type="text" placeholder="Question (EN)" value={newFaq.title_en || ''} onChange={e => setNewFaq({...newFaq, title_en: e.target.value})} className="w-full mb-3 bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" />
                        <textarea placeholder="Answer (EN)" value={newFaq.body_en || ''} onChange={e => setNewFaq({...newFaq, body_en: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" rows={2}/>
                      </div>
                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-zinc-700">
                        <label className="text-xs text-zinc-400 mb-2 block font-bold uppercase tracking-wider">Myanmar (မြန်မာ)</label>
                        <input type="text" placeholder="Question (MM)" value={newFaq.title_mm || ''} onChange={e => setNewFaq({...newFaq, title_mm: e.target.value})} className="w-full mb-3 bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" />
                        <textarea placeholder="Answer (MM)" value={newFaq.body_mm || ''} onChange={e => setNewFaq({...newFaq, body_mm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" rows={2}/>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          if (editingFaqId) {
                            setFaqs(faqs.map(f => f.id === editingFaqId ? { ...newFaq, id: editingFaqId } : f));
                            setEditingFaqId(null);
                          } else {
                            setFaqs([...faqs, {id: Date.now().toString(), ...newFaq}]); 
                          }
                          setNewFaq({title_en:'', body_en:'', title_mm:'', body_mm:''}); 
                          showToast(t.msgContentAdded);
                        }} className="flex-1 bg-[#fcd385] text-black py-2.5 rounded-lg text-sm font-bold">{editingFaqId ? t.updateBtn : t.addBtn}</button>
                        {editingFaqId && <button onClick={() => {setEditingFaqId(null); setNewFaq({title_en:'', body_en:'', title_mm:'', body_mm:''});}} className="px-4 bg-zinc-700 text-white rounded-lg font-bold">{t.cancelBtn}</button>}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" placeholder="Search FAQs..." value={adminFaqSearch || ''}
                          onChange={e => setAdminFaqSearch(e.target.value)}
                          className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                        />
                      </div>
                      {adminFilteredFaqs.map(f => (
                        <div key={f.id} className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-lg flex justify-between items-center">
                           <div className="truncate pr-4 text-sm text-white font-bold">{f.title_en || f.title_mm}</div>
                           <div className="flex gap-2">
                             <button onClick={() => {setEditingFaqId(f.id); setNewFaq(f); window.scrollTo(0,0);}} className="p-2 bg-zinc-800 rounded text-blue-400 hover:bg-zinc-700"><Edit className="w-4 h-4"/></button>
                             <button onClick={() => setConfirmModal({
                               message: t.confirmDelDesc,
                               onConfirm: () => { setFaqs(faqs.filter(x => x.id !== f.id)); showToast(t.msgDeleted); }
                             })} className="p-2 bg-zinc-800 rounded text-red-400 hover:bg-zinc-700"><Trash2 className="w-4 h-4"/></button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'upload' && (
              <div className="animate-fade-in space-y-6 font-sans">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3 font-serif">
                   {editingShowId ? "Edit Movie / Series" : t.uploadVid}
                </h3>
                
                <div className="bg-[#1f1f1f] p-5 md:p-8 rounded-2xl border border-zinc-800 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                    <div>
                      <label className="block text-zinc-400 mb-1.5">{t.titleEnPlaceholder}</label>
                      <input type="text" value={newVideo.title_en || ''} onChange={e => setNewVideo({...newVideo, title_en: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1.5">{t.titleMmPlaceholder}</label>
                      <input type="text" value={newVideo.title_mm || ''} onChange={e => setNewVideo({...newVideo, title_mm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1.5">{t.imgPlaceholder}</label>
                      <input type="text" value={newVideo.image || ''} onChange={e => setNewVideo({...newVideo, image: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1.5">Category</label>
                      <select value={newVideo.category || categories[0]} onChange={e => setNewVideo({...newVideo, category: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white outline-none">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#fcd385] mb-1.5 font-bold flex items-center gap-1"><Lock className="w-3 h-3"/> {t.tgLinkPlaceholder}</label>
                      <input type="text" placeholder="https://t.me/..." value={newVideo.vipTelegramLink || ''} onChange={e => setNewVideo({...newVideo, vipTelegramLink: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>
                    
                    <div>
                      <label className="block text-zinc-400 mb-1.5">Point Price (Per Unreleased Ep)</label>
                      <input type="number" min="0" value={newVideo.pointsPerEp || 20} onChange={e => setNewVideo({...newVideo, pointsPerEp: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-zinc-400 mb-1.5">{t.descPlaceholder}</label>
                      <textarea value={newVideo.description || ''} onChange={e => setNewVideo({...newVideo, description: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" rows={3} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-zinc-400 mb-1.5">{t.totEps}</label>
                      <div className="flex gap-2">
                        <input type="number" min="1" value={epCount || 1} onChange={e => setEpCount(Number(e.target.value))} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white flex-1 focus:outline-none focus:border-[#fcd385]" />
                        <button onClick={() => {
                          const eps: EpisodeData[] = [];
                          for(let i=1; i<=epCount; i++) eps.push({epLabel: `EP ${i}`, links: [], releaseDateRaw: '', releaseDate: ''});
                          setNewVideo({...newVideo, totalEpisodes: epCount, episodes: eps, pointsPerEp: newVideo.pointsPerEp || 20});
                        }} className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-white font-bold transition">{t.genSlots}</button>
                      </div>
                    </div>

                  </div>

                  {newVideo.episodes && newVideo.episodes.length > 0 && (
                    <div className="mt-8 space-y-4 p-5 rounded-xl border border-zinc-700 bg-black/40">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4">Episode Links / Schedule Data</h4>
                      {newVideo.episodes.map((ep, idx) => (
                        <div key={idx} className="flex flex-col gap-3 w-full bg-black p-4 rounded-lg border border-zinc-800">
                          
                          {/* Top Row: EP Label, Schedule, Add Link Button */}
                          <div className="flex flex-wrap items-center gap-3">
                            <input type="text" value={ep.epLabel || ''} onChange={e => {
                              const eps = [...newVideo.episodes!]; eps[idx].epLabel = e.target.value; setNewVideo({...newVideo, episodes: eps});
                            }} className="bg-[#3e1717] text-[#fcd385] text-xs font-bold px-2 py-2.5 rounded w-24 text-center outline-none border border-zinc-800 focus:border-[#fcd385]" />
                            
                            <span className="text-zinc-600 text-xs">Schedule:</span>
                            <div className="flex-1 min-w-[150px] relative">
                              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                              <input 
                                type="datetime-local" 
                                value={ep.releaseDateRaw || ''} 
                                onChange={e => {
                                  const eps = [...newVideo.episodes!]; 
                                  eps[idx].releaseDateRaw = e.target.value; 
                                  eps[idx].releaseDate = formatDateTime(e.target.value); 
                                  setNewVideo({...newVideo, episodes: eps});
                                }} 
                                className="bg-zinc-900 pl-9 pr-3 py-2.5 rounded text-xs text-white border border-zinc-800 w-full outline-none focus:border-[#fcd385] custom-datetime" 
                              />
                            </div>

                            <button onClick={() => {
                                const eps = [...newVideo.episodes!];
                                if(!eps[idx].links) eps[idx].links = [];
                                eps[idx].links.push({platform: platforms.length > 0 ? platforms[0] : 'Other', url: ''});
                                setNewVideo({...newVideo, episodes: eps});
                            }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-3 py-2 rounded font-bold uppercase transition flex items-center gap-1"><Plus className="w-3 h-3"/> Add Link</button>
                          </div>
                          
                          {/* Links Row Mapping */}
                          {ep.links && ep.links.length > 0 && (
                            <div className="space-y-2 pl-4 border-l-2 border-zinc-800 mt-2">
                              {ep.links.map((lnk, lIdx) => (
                                <div key={lIdx} className="flex gap-2 items-center">
                                   <select value={lnk.platform || ''} onChange={e => {
                                     const eps = [...newVideo.episodes!];
                                     eps[idx].links[lIdx].platform = e.target.value;
                                     setNewVideo({...newVideo, episodes: eps});
                                   }} className="bg-zinc-800 text-white text-xs p-2 rounded outline-none border border-zinc-700 w-24 sm:w-32">
                                      {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                                   </select>
                                   <input type="text" placeholder="URL..." value={lnk.url || ''} onChange={e => {
                                     const eps = [...newVideo.episodes!];
                                     eps[idx].links[lIdx].url = e.target.value;
                                     setNewVideo({...newVideo, episodes: eps});
                                   }} className="bg-zinc-900 p-2 rounded text-xs flex-1 text-white border border-zinc-800 outline-none focus:border-[#fcd385]" />
                                   <button onClick={() => {
                                     const eps = [...newVideo.episodes!];
                                     eps[idx].links.splice(lIdx, 1);
                                     setNewVideo({...newVideo, episodes: eps});
                                   }} className="p-1.5 bg-red-900/50 rounded text-red-400 hover:bg-red-900 transition"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div className="flex gap-3 mt-6">
                        <button onClick={() => {
                          if(!newVideo.title_en && !newVideo.title_mm) return;
                          const itemToSave = {
                            id: editingShowId || `vid-${Date.now()}`, 
                            title_en: newVideo.title_en || '', title_mm: newVideo.title_mm || '', 
                            image: newVideo.image || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700',
                            category: newVideo.category || categories[0], description: newVideo.description || '', 
                            totalEpisodes: newVideo.totalEpisodes || 1, episodes: newVideo.episodes || [], 
                            vipTelegramLink: newVideo.vipTelegramLink || '', pointsPerEp: newVideo.pointsPerEp || 20
                          };
                          if (editingShowId) {
                            setShows(shows.map(s => s.id === editingShowId ? itemToSave : s));
                            setEditingShowId(null);
                          } else {
                            setShows([itemToSave, ...shows]);
                          }
                          showToast(t.msgUploaded); 
                          setNewVideo({episodes:[], title_en: '', title_mm: '', vipTelegramLink: '', pointsPerEp: 20});
                        }} className="flex-1 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-3 rounded-lg shadow-lg hover:brightness-110 transition">
                          {editingShowId ? t.updateBtn : t.saveBtn}
                        </button>
                        {editingShowId && (
                          <button onClick={() => {setEditingShowId(null); setNewVideo({episodes:[], title_en: '', title_mm: '', vipTelegramLink: '', pointsPerEp: 20});}} className="px-6 bg-zinc-700 text-white font-bold py-3 rounded-lg shadow-lg hover:brightness-110 transition">
                            {t.cancelBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <h4 className="text-sm font-bold text-[#fcd385]">Uploaded Content</h4>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input 
                        type="text" placeholder="Search by Title..." value={adminUploadedSearch || ''}
                        onChange={e => {setAdminUploadedSearch(e.target.value); setShowsPage(1);}}
                        className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedShows.length > 0 ? paginatedShows.map(s => (
                      <div key={s.id} className="bg-black/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                         <div>
                            <div className="flex gap-3 items-start mb-2">
                              <img src={s.image} alt="Thumb" className="w-16 h-9 object-cover rounded shadow" />
                              <div>
                                <p className="font-bold text-white text-sm line-clamp-1">{s.title_en || s.title_mm}</p>
                                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 mt-1 inline-block">{s.category}</span>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-500">{s.totalEpisodes} Episodes</p>
                         </div>
                         <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
                           <button onClick={() => {
                             setEditingShowId(s.id); setNewVideo(s); setEpCount(s.totalEpisodes); window.scrollTo({top:0, behavior: 'smooth'});
                           }} className="bg-blue-900/50 text-blue-300 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-900 transition flex items-center gap-1"><Edit className="w-3 h-3"/> Edit</button>
                           <button onClick={() => setConfirmModal({
                               message: t.confirmDelDesc,
                               onConfirm: () => { setShows(shows.filter(x => x.id !== s.id)); showToast(t.msgDeleted); }
                           })} className="bg-red-900/50 text-red-300 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-900 transition flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</button>
                         </div>
                      </div>
                    )) : (
                      <p className="text-zinc-500 text-xs py-2">No uploaded shows found.</p>
                    )}
                  </div>
                  {/* Pagination UI */}
                  {adminUploadedShowsFiltered.length > 0 && renderPagination(showsPage, setShowsPage, showsPerPage, setShowsPerPage, adminUploadedShowsFiltered.length)}
                </div>
              </div>
            )}
          </main>
        </div>

      ) : activeTab === 'promo' ? (
        <main className="max-w-4xl mx-auto px-4 mt-8 animate-fade-in pb-10">
          <h2 className="text-2xl font-bold text-[#fcd385] mb-6 flex items-center gap-2"><Gift className="w-6 h-6"/> {t.promotions}</h2>
          <div className="space-y-4">
            {promotions.map(p => (
              <div key={p.id} className="bg-gradient-to-r from-[#2b0303] to-[#1a1a1a] p-6 rounded-2xl border border-[#fcd385]/20 shadow-lg font-sans">
                <h3 className="text-lg font-black text-white mb-2">{lang === 'en' ? (p.title_en || p.title_mm) : (p.title_mm || p.title_en)}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{lang === 'en' ? (p.body_en || p.body_mm) : (p.body_mm || p.body_en)}</p>
              </div>
            ))}
          </div>
        </main>
      ) : activeTab === 'faq' ? (
        <main className="max-w-4xl mx-auto px-4 mt-8 animate-fade-in pb-10">
          <h2 className="text-2xl font-bold text-[#fcd385] mb-6 flex items-center gap-2"><HelpCircle className="w-6 h-6"/> {t.faq}</h2>
          <div className="space-y-4 font-sans">
            {faqs.map(f => (
              <div key={f.id} className="bg-[#1f1f1f] p-5 rounded-xl border border-zinc-800">
                <h3 className="text-base font-bold text-[#fcd385] mb-2">Q: {lang === 'en' ? (f.title_en || f.title_mm) : (f.title_mm || f.title_en)}</h3>
                <p className="text-sm text-zinc-400 whitespace-pre-wrap">A: {lang === 'en' ? (f.body_en || f.body_mm) : (f.body_mm || f.body_en)}</p>
              </div>
            ))}
          </div>
        </main>
      ) : (
        /* HOME VIEW */
        <>
          <div className="max-w-7xl mx-auto px-4 mt-6 font-sans">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    activeCategory === cat ? 'bg-[#3e1717] text-[#fcd385] border-[#fcd385]' : 'bg-[#1f1f1f] text-zinc-400 border-zinc-800 hover:text-white'
                  }`}>
                  {cat === 'All' ? t.latestReleases : cat}
                </button>
              ))}
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 mt-6 pb-12 font-sans">
            {activeCategory === 'All' && !searchQuery ? (
              <div className="space-y-8">
                {categories.filter(c => c !== 'All').map(cat => {
                  const catShows = shows.filter(s => s.category === cat);
                  if (catShows.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 cursor-pointer hover:text-[#fcd385] transition" onClick={() => setActiveCategory(cat)}>
                          Top {cat} <ChevronRight className="w-5 h-5 text-[#fcd385]" />
                        </h2>
                      </div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {catShows.map(item => (
                          <div key={item.id} onClick={() => setSelectedShow(item)} className="w-[240px] sm:w-[280px] flex-none bg-[#1a1a1a] border border-zinc-800 rounded-xl overflow-hidden cursor-pointer group hover:border-[#fcd385]/50 transition flex flex-col shadow-lg">
                            <div className="aspect-[16/9] relative overflow-hidden bg-black">
                              <img src={item.image} alt={item.title_en} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <div className="w-10 h-10 rounded-full bg-[#fcd385]/90 flex items-center justify-center shadow-xl"><Play className="w-4 h-4 text-[#3e1717] ml-0.5" /></div>
                              </div>
                              <div className="absolute top-2 left-2 bg-[#2b0303] border border-[#fcd385]/50 text-[#fcd385] text-[10px] font-bold px-2 py-0.5 rounded shadow">{item.totalEpisodes} EP</div>
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <h3 className="text-sm font-bold text-white truncate">{lang === 'en' ? (item.title_en || item.title_mm) : (item.title_mm || item.title_en)}</h3>
                              <p className="text-[11px] text-zinc-400 mt-1">{item.category}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {filteredShows.length > 0 ? filteredShows.map(item => (
                  <div key={item.id} onClick={() => setSelectedShow(item)} className="bg-[#1a1a1a] border border-zinc-800 rounded-xl overflow-hidden cursor-pointer group hover:border-[#fcd385]/50 transition flex flex-col shadow-lg">
                    <div className="aspect-[16/9] relative overflow-hidden bg-black">
                      <img src={item.image} alt={item.title_en} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <div className="w-12 h-12 rounded-full bg-[#fcd385]/90 flex items-center justify-center shadow-xl"><Play className="w-5 h-5 text-[#3e1717] ml-1" /></div>
                      </div>
                      <div className="absolute top-2 left-2 bg-[#2b0303] border border-[#fcd385]/50 text-[#fcd385] text-[10px] font-bold px-2 py-0.5 rounded shadow">{item.totalEpisodes} EP</div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h3 className="text-sm font-bold text-white truncate">{lang === 'en' ? (item.title_en || item.title_mm) : (item.title_mm || item.title_en)}</h3>
                      <p className="text-[11px] text-zinc-400 mt-1">{item.category}</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-10 text-center text-zinc-500 text-sm">No shows found.</div>
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* --- ALL ROOT LEVEL MODALS --- */}

      {/* 3D Edit/Create User Modal (Admin Panel) */}
      {editUserModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
             <h3 className="text-xl font-black text-white mb-6 text-center">{editUserModal.mode === 'create' ? t.createUserTitle : t.editUserTitle}</h3>
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Username</label>
                  <input type="text" value={editUserForm.username} onChange={e => setEditUserForm({...editUserForm, username: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Email</label>
                  <input type="email" value={editUserForm.email} onChange={e => setEditUserForm({...editUserForm, email: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t.password}</label>
                  <div className="relative w-full">
                     <input type={showAuthPassword ? "text" : "password"} value={editUserForm.password || ''} onChange={e => setEditUserForm({...editUserForm, password: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                     <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                        {showAuthPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                     </button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-400 mb-1">{t.pointsInput}</label>
                    <input type="number" value={editUserForm.points} onChange={e => setEditUserForm({...editUserForm, points: Number(e.target.value)})} className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-400 mb-1">{t.role}</label>
                    <select value={editUserForm.role} onChange={e => setEditUserForm({...editUserForm, role: e.target.value as 'admin'|'user'})} className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
             </div>
             <div className="flex gap-3 mt-6">
               <button onClick={() => {setEditUserModal({isOpen: false, mode: 'create'}); setShowAuthPassword(false);}} className="flex-1 bg-zinc-800 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_0_#3f3f46] active:shadow-none active:translate-y-1 transition-all">{t.cancelBtn}</button>
               <button onClick={handleAdminSaveUser} className="flex-1 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-2.5 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">Save</button>
             </div>
          </div>
        </div>
      )}

      {/* Platform Select 3D Modal */}
      {platformSelectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-center">
            <button onClick={() => setPlatformSelectModal(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="w-16 h-16 rounded-full bg-[#fcd385]/10 flex items-center justify-center mx-auto mb-4 border border-[#fcd385]/30 shadow-inner">
               <MonitorPlay className="w-8 h-8 text-[#fcd385]" />
            </div>
            <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: '"Georgia", serif' }}>{t.choosePlatform}</h3>
            <p className="text-sm text-zinc-400 mb-6">{platformSelectModal.ep.epLabel}</p>
            
            <div className="space-y-3">
               {platformSelectModal.ep.links.map((lnk, idx) => (
                  <button key={idx} onClick={() => {
                      window.open(lnk.url, '_blank');
                      setPlatformSelectModal(null);
                  }} className="w-full bg-black/50 border border-zinc-700 hover:border-[#fcd385] text-white font-bold py-3 rounded-xl shadow-inner hover:shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2">
                     {lnk.platform === 'Facebook' ? <Globe className="w-5 h-5 text-blue-500" /> : lnk.platform === 'Telegram' ? <Send className="w-5 h-5 text-blue-400" /> : lnk.platform === 'Viber' ? <MessageCircle className="w-5 h-5 text-purple-500"/> : <Play className="w-5 h-5 text-[#fcd385]" />}
                     {t.watchOn} {lnk.platform}
                  </button>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Reusable 3D Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] transform transition-all scale-100">
             <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-inner">
                <Info className="w-6 h-6 text-[#fcd385]" />
             </div>
             <p className="text-center text-white font-bold mb-6 leading-relaxed">{alertModal.message}</p>
             <button onClick={() => {
                 if (alertModal.onAction) {
                     alertModal.onAction();
                 } else {
                     setAlertModal(null);
                 }
             }} className="w-full bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-2.5 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-[0_0px_0_#a88621] active:translate-y-1 transition-all">
                {alertModal.actionText || 'OK'}
             </button>
          </div>
        </div>
      )}

      {/* Reusable 3D Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
             <div className="w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center mx-auto mb-4 border border-yellow-500/30 shadow-inner">
                <HelpCircle className="w-6 h-6 text-[#fcd385]" />
             </div>
             <p className="text-center text-white font-bold mb-6">{confirmModal.message || t.confirmDelTitle}</p>
             <div className="flex gap-3">
               <button onClick={() => setConfirmModal(null)} className="flex-1 bg-zinc-800 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_0_#3f3f46] active:shadow-none active:translate-y-1 transition-all">{t.cancelBtn}</button>
               <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 bg-red-700 text-white font-black py-2.5 rounded-xl shadow-[0_4px_0_#7f1d1d] active:shadow-none active:translate-y-1 transition-all">Confirm</button>
             </div>
          </div>
        </div>
      )}

      {/* Reusable 3D Prompt Modal */}
      {promptModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
             <h3 className="text-lg font-bold text-white mb-4 text-center">{promptModal.title}</h3>
             <input 
               type="text" autoFocus placeholder={promptModal.placeholder} 
               value={promptInputValue} onChange={e => setPromptInputValue(e.target.value)} 
               className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg text-white mb-6 focus:outline-none focus:border-[#fcd385] shadow-inner"
             />
             <div className="flex gap-3">
               <button onClick={() => {setPromptModal(null); setPromptInputValue('');}} className="flex-1 bg-zinc-800 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_0_#3f3f46] active:shadow-none active:translate-y-1 transition-all">{t.cancelBtn}</button>
               <button onClick={() => { 
                 if(promptInputValue.trim() !== '') {
                   promptModal.onSubmit(promptInputValue); setPromptModal(null); setPromptInputValue('');
                 } else { setAlertModal({ message: "Input cannot be empty!" }); }
               }} className="flex-1 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-2.5 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">Submit</button>
             </div>
          </div>
        </div>
      )}

      {/* 3D Password Change Modal (With Eye Icon) */}
      {changePwdModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
             <button onClick={() => {setChangePwdModalOpen(false); setPwdForm({old:'', new:'', confirm:''}); setShowPwdOld(false); setShowPwdNew(false); setShowPwdConfirm(false);}} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
             <div className="w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center mx-auto mb-4 border border-yellow-500/30 shadow-inner">
                <Key className="w-6 h-6 text-[#fcd385]" />
             </div>
             <h3 className="text-xl font-black text-white mb-6 text-center">{t.changePwd}</h3>
             
             <form onSubmit={handlePasswordUpdate} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t.oldPwd}</label>
                  <div className="relative w-full">
                     <input type={showPwdOld ? "text" : "password"} required value={pwdForm.old} onChange={e => setPwdForm({...pwdForm, old: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385] shadow-inner" />
                     <button type="button" onClick={() => setShowPwdOld(!showPwdOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">{showPwdOld ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t.newPwd}</label>
                  <div className="relative w-full">
                     <input type={showPwdNew ? "text" : "password"} required value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385] shadow-inner" />
                     <button type="button" onClick={() => setShowPwdNew(!showPwdNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">{showPwdNew ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t.confirmPwd}</label>
                  <div className="relative w-full">
                     <input type={showPwdConfirm ? "text" : "password"} required value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385] shadow-inner" />
                     <button type="button" onClick={() => setShowPwdConfirm(!showPwdConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">{showPwdConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
               </div>
               <button type="submit" className="w-full mt-2 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-3 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">Submit</button>
             </form>
          </div>
        </div>
      )}

      {/* Auth Modal (With Eye Icon and Remember Me) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-gradient-to-b from-[#3e1717] via-[#2b0303] to-[#1a0101] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
            <button onClick={() => {setAuthModalOpen(false); setShowAuthPassword(false);}} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black text-[#fcd385] mb-6 text-center tracking-wide drop-shadow-md">
              {authMode === 'login' ? t.loginBtn : authMode === 'register' ? t.signUpBtn : t.getpwd}
            </h3>
            {authError && <div className="bg-red-900/30 border border-red-500/50 text-red-200 text-xs p-2 rounded mb-4 text-center">{authError}</div>}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <input type="text" required placeholder={authMode === 'login' ? t.email : "Username"} value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} className="w-full bg-black/40 border border-zinc-700/50 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
              {(authMode === 'register' || authMode === 'forgot') && (
                <input type="email" required placeholder="Email (Gmail)" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-black/40 border border-zinc-700/50 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
              )}
              {(authMode === 'login' || authMode === 'register') && (
                <div className="relative w-full">
                  <input type={showAuthPassword ? "text" : "password"} required placeholder={t.password} value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-black/40 border border-zinc-700/50 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                  <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                    {showAuthPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              )}
              
              {/* Remember Me Checkbox */}
              {(authMode === 'login' || authMode === 'register') && (
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 cursor-pointer accent-[#fcd385] rounded border-zinc-700" />
                  <label htmlFor="rememberMe" className="text-xs text-zinc-300 cursor-pointer select-none">{t.rememberMe}</label>
                </div>
              )}

              <button type="submit" className={`w-full font-black py-3 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all tracking-wide ${
                authMode === 'register' ? 'border border-[#fcd385] text-[#fcd385] bg-black/50' : 'bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717]'
              }`}>{authMode === 'login' ? t.loginBtn : authMode === 'register' ? t.signUpBtn : t.getpwd}</button>
            </form>
            <div className="mt-6 text-center text-xs space-y-2 text-white/80">
              {authMode === 'login' ? (
                <>
                  <p className="hover:text-white cursor-pointer" onClick={() => {setAuthError(''); setAuthMode('forgot'); setShowAuthPassword(false);}}>{t.forgotPwd}</p>
                  <p>{t.noAccount} <span className="text-[#fcd385] font-bold cursor-pointer underline" onClick={() => {setAuthError(''); setAuthMode('register'); setShowAuthPassword(false);}}>{t.signUpBtn}</span></p>
                </>
              ) : (
                <p>{t.backTo} <span className="text-[#fcd385] font-bold cursor-pointer underline" onClick={() => {setAuthError(''); setAuthMode('login'); setShowAuthPassword(false);}}>{t.loginBtn}</span></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment & History Modal */}
      {pointModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md font-sans">
          <div className={`bg-gradient-to-b from-[#3e0a0a] to-[#1a0101] border border-[#fcd385]/30 rounded-2xl w-full relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] ${payStep === 'form' ? 'max-w-4xl' : 'max-w-md'}`}>
            <div className="flex items-center justify-between p-4 border-b border-[#fcd385]/20 bg-black/30 shadow-inner">
              {payStep === 'menu' ? <div className="w-8"/> : (
                <button onClick={() => {
                  if(payStep === 'form') setPayStep('providers');
                  else setPayStep('menu');
                }} className="p-1 rounded-full text-[#fcd385]/70 hover:text-[#fcd385] hover:bg-[#fcd385]/10 transition"><ChevronLeft className="w-6 h-6" /></button>
              )}
              <h3 className="text-lg font-bold text-[#fcd385] tracking-wide">
                {payStep === 'menu' ? t.buyPoints : payStep === 'providers' ? t.paySelectMethod : payStep === 'history' ? t.payMenuHistory : selectedProvider?.name}
              </h3>
              <button onClick={() => setPointModalOpen(false)} className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              {payStep === 'menu' && (
                <div className="flex gap-6 justify-center items-center py-10">
                  <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => setPayStep('providers')}>
                    <div className="w-20 h-20 rounded-full border border-[#fcd385] bg-gradient-to-b from-[#2b0303] to-[#1a0101] flex items-center justify-center shadow-[0_4px_15px_rgba(252,211,133,0.3)] group-hover:scale-105 transition-all">
                      <Coins className="w-10 h-10 text-[#fcd385]" />
                    </div>
                    <span className="text-white font-bold text-sm drop-shadow-md">{t.payMenuDeposit}</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => { syncLatestData(); setPayStep('history'); }}>
                    <div className="w-20 h-20 rounded-full border border-[#fcd385] bg-gradient-to-b from-[#2b0303] to-[#1a0101] flex items-center justify-center shadow-[0_4px_15px_rgba(252,211,133,0.3)] group-hover:scale-105 transition-all">
                      <Clock className="w-10 h-10 text-[#fcd385]" />
                    </div>
                    <span className="text-white font-bold text-sm drop-shadow-md">{t.payMenuHistory}</span>
                  </div>
                </div>
              )}

              {payStep === 'providers' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[#fcd385] text-sm font-bold mb-3 border-b border-white/10 pb-2">{t.payBank}</h4>
                    <div className="space-y-2">
                      {paymentProviders.banks.map((p: any) => (
                        <div key={p.id} onClick={() => {setSelectedProvider(p); setPayStep('form');}} className="flex items-center justify-between p-3 bg-black/40 hover:bg-black/60 rounded-xl cursor-pointer transition border border-transparent hover:border-[#fcd385]/50 shadow-inner">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${p.color}`}>{p.name[0]}</div>
                            <span className="text-white font-bold text-sm">{p.name}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#fcd385]/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[#fcd385] text-sm font-bold mb-3 border-b border-white/10 pb-2">{t.payEwallet}</h4>
                    <div className="space-y-2">
                      {paymentProviders.ewallets.map((p: any) => (
                        <div key={p.id} onClick={() => {setSelectedProvider(p); setPayStep('form');}} className="flex items-center justify-between p-3 bg-black/40 hover:bg-black/60 rounded-xl cursor-pointer transition border border-transparent hover:border-[#fcd385]/50 shadow-inner">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${p.color}`}>{p.name[0]}</div>
                            <span className="text-white font-bold text-sm">{p.name}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#fcd385]/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {payStep === 'form' && selectedProvider && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-5">
                    <div className="bg-black/50 p-4 rounded-xl border border-white/10 text-center shadow-inner">
                       <p className="text-sm font-bold text-[#fcd385] mb-4">Scan QR to Pay with {selectedProvider.name}</p>
                       <img src={selectedProvider.qrImage || 'https://via.placeholder.com/200'} alt="QR Code" className="w-48 h-48 object-contain mx-auto rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.5)] border border-white/20" />
                       
                       {/* QR Code Download Button */}
                       <div className="mt-4 flex justify-center">
                          <button type="button" onClick={() => handleDownloadQR(selectedProvider.qrImage, selectedProvider.name)} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-[#fcd385] px-4 py-2 rounded-lg transition shadow-lg text-xs font-bold border border-zinc-700">
                            <Download className="w-4 h-4"/> {t.downloadQR}
                          </button>
                       </div>

                       {/* Account Number Section */}
                       {selectedProvider.accountNo && (
                         <div className="mt-5 p-3 bg-[#1f1f1f] rounded-lg border border-[#fcd385]/20 flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-[10px] text-zinc-400 font-bold uppercase">{t.payAccountNo}</p>
                              <p className="text-base text-white font-black font-mono tracking-widest mt-1">{selectedProvider.accountNo}</p>
                            </div>
                            <button type="button" onClick={() => handleCopy(selectedProvider.accountNo)} className="bg-zinc-800 hover:bg-zinc-700 text-[#fcd385] p-2 rounded-lg transition shadow-lg">
                              <Copy className="w-5 h-5"/>
                            </button>
                         </div>
                       )}

                    </div>
                    <form onSubmit={handlePointSubmit} className="space-y-4">
                      <div>
                        <p className="text-xs text-[#fcd385] mb-2">{t.payTxnId}</p>
                        <input type="text" required placeholder="Enter ID..." value={idCodeInput} onChange={e => setIdCodeInput(e.target.value)} className="w-full bg-black/50 border border-white/20 p-3.5 rounded-xl text-white text-sm focus:border-[#fcd385] outline-none transition shadow-inner" />
                      </div>
                      <button type="submit" className="w-full bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e0a0a] font-black py-3.5 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-[0_0px_0_#a88621] active:translate-y-1 transition-all">{t.paySubmitBtn}</button>
                    </form>
                  </div>
                  <div className="space-y-5">
                     <div className="bg-black/40 p-5 rounded-xl border border-white/10 shadow-inner">
                       <h4 className="text-[#fcd385] font-bold text-sm mb-3 border-b border-white/10 pb-2 flex items-center gap-2"><HelpCircle className="w-4 h-4"/> Deposit Guide</h4>
                       <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {lang === 'en' ? siteConfig.depositGuideEn : siteConfig.depositGuideMm}
                       </p>
                     </div>
                     <div className="bg-red-900/30 border border-red-500/50 p-5 rounded-xl shadow-inner">
                       <h4 className="text-red-400 font-bold text-sm flex items-center gap-2 mb-3"><Info className="w-4 h-4"/> {t.payWarnTitle}</h4>
                       <p className="text-sm text-red-200/90 leading-relaxed font-bold whitespace-pre-wrap">
                          {lang === 'en' ? siteConfig.paymentWarningEn : siteConfig.paymentWarningMm}
                       </p>
                     </div>
                  </div>
                </div>
              )}

              {payStep === 'history' && (
                <div className="space-y-3 animate-fade-in relative">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[#fcd385] text-sm font-bold border-b border-white/10 pb-1">{t.payMenuHistory}</h4>
                    <button onClick={syncLatestData} className="flex items-center gap-1.5 text-xs bg-black/50 border border-zinc-700 hover:border-[#fcd385] text-zinc-300 hover:text-[#fcd385] px-3 py-1.5 rounded-lg transition shadow">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </div>
                  {pointRequests.filter(r => r.username === currentUser?.username).length === 0 ? (
                     <p className="text-center text-white/50 text-sm py-10">No transaction history found.</p>
                  ) : (
                    pointRequests.filter(r => r.username === currentUser?.username).map((req, i) => (
                      <div key={i} className="bg-black/40 border border-white/10 p-4 rounded-xl shadow-inner">
                         <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                            <span className="text-xs text-white/60 font-mono">{formatDateTime(req.date)}</span>
                            {req.status === 'pending' && <span className="flex items-center gap-1 text-[10px] bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 font-bold uppercase"><Clock className="w-3 h-3"/> {t.statusPending}</span>}
                            {req.status === 'approved' && <span className="flex items-center gap-1 text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold uppercase"><CheckCircle className="w-3 h-3"/> {t.statusSuccess}</span>}
                            {req.status === 'rejected' && <span className="flex items-center gap-1 text-[10px] bg-red-900/50 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-bold uppercase"><XCircle className="w-3 h-3"/> {t.statusRejected}</span>}
                         </div>
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-xs text-[#fcd385] mb-0.5">{req.provider}</p>
                               <p className="text-sm text-white font-bold tracking-wider">{req.idCode}</p>
                               {req.remark && req.status === 'rejected' && (
                                  <p className="text-[11px] text-red-300 mt-2 bg-red-950/80 p-2 rounded-lg border border-red-500/50 shadow-inner">
                                    <span className="font-bold block mb-0.5 opacity-80">{t.remarkLabel}</span> {req.remark}
                                  </p>
                               )}
                            </div>
                            {req.amount && req.status === 'approved' && (
                               <p className="text-lg font-black text-emerald-400">+{req.amount} Pts</p>
                            )}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Details Modal */}
      {selectedShow && !vipModalShow && !scheduleAlert && !platformSelectModal && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-2 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto font-sans">
          <div className="bg-[#161616] border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl relative my-auto">
            <button onClick={() => setSelectedShow(null)} className="absolute z-20 top-4 right-4 bg-black/70 p-2 rounded-full text-white hover:bg-red-600 transition"><X className="w-5 h-5" /></button>
            <div className="relative h-48 md:h-72 w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/40 to-transparent z-10" />
              <img src={selectedShow.image} alt={selectedShow.title_en} className="w-full h-full object-cover opacity-50" />
            </div>
            <div className="px-5 md:px-8 pb-8 relative z-20 -mt-16 md:-mt-24">
              <h2 className="text-2xl md:text-4xl font-black text-white mb-2">{lang === 'en' ? (selectedShow.title_en || selectedShow.title_mm) : (selectedShow.title_mm || selectedShow.title_en)}</h2>
              <div className="flex gap-2 text-xs font-bold mb-4">
                <span className="bg-[#fcd385] text-black px-2.5 py-1 rounded shadow">{selectedShow.category}</span>
                <span className="bg-zinc-800 border border-zinc-700 text-white px-2.5 py-1 rounded">{selectedShow.totalEpisodes} {t.episodes}</span>
              </div>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-3xl">{selectedShow.description}</p>

              <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: '"Georgia", serif' }}>{t.episodes}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedShow.episodes.map((ep, idx) => {
                  const isUnlocked = currentUser?.vip || currentUser?.unlockedShows?.includes(selectedShow.id);
                  const hasLinks = ep.links && ep.links.length > 0;
                  return (
                    <div key={idx} className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#fcd385]/40 transition shadow-inner">
                      <span className="font-bold text-[#fcd385] text-sm">{ep.epLabel}</span>
                      <button onClick={() => {
                        if (!currentUser) return setAuthModalOpen(true);
                        
                        if (hasLinks) {
                          if(ep.links.length === 1) {
                             window.open(ep.links[0].url, '_blank');
                          } else {
                             setPlatformSelectModal({ ep, show: selectedShow });
                          }
                        } else {
                          if (isUnlocked && selectedShow.vipTelegramLink) {
                            window.open(selectedShow.vipTelegramLink, '_blank');
                          } else {
                            setScheduleAlert({ isOpen: true, date: ep.releaseDate, show: selectedShow });
                          }
                        }
                      }} className={`w-full text-xs py-2 rounded-lg font-bold transition shadow-[0_3px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none ${hasLinks || isUnlocked ? 'bg-[#2b0303] text-[#fcd385] border border-[#fcd385]/30' : 'bg-zinc-800 text-zinc-400'}`}>
                        {hasLinks || isUnlocked ? t.watchBtn : t.waitBtn}
                      </button>
                      {!hasLinks && !isUnlocked && ep.releaseDate && <span className="text-[10px] text-zinc-500 text-center">{ep.releaseDate}</span>}
                    </div>
                  );
                })}
              </div>

              {/* VIP BOX DYNAMIC RENDER */}
              {(() => {
                const isAlreadyUnlocked = currentUser?.vip || currentUser?.unlockedShows?.includes(selectedShow.id);
                const isAllEpisodesAvailable = selectedShow.episodes.length > 0 && selectedShow.episodes.every(ep => ep.links && ep.links.length > 0);

                if (isAllEpisodesAvailable) {
                   return (
                     <div className="mt-8 bg-black/40 border border-[#fcd385]/20 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-inner">
                       <h4 className="font-bold text-[#fcd385] text-lg mb-1"><Sparkles className="w-5 h-5 inline mr-1 mb-1"/>{t.vipNotRequired}</h4>
                       <p className="text-sm text-zinc-400">{t.allEpsAvailable}</p>
                     </div>
                   );
                }

                return (
                  <div className="mt-8 bg-gradient-to-r from-[#2b0303] to-black border border-[#fcd385]/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <div>
                      <h4 className="font-bold text-[#fcd385] flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5"/> {isAlreadyUnlocked ? t.vipUnlockedTitle : t.vipTitle}
                      </h4>
                      <p className="text-sm text-zinc-300 mt-1">{isAlreadyUnlocked ? t.vipUnlockedDesc : t.vipDesc}</p>
                    </div>
                    <button onClick={() => { 
                      if(!currentUser) { setAuthModalOpen(true); return; }
                      if(isAlreadyUnlocked) {
                        if(selectedShow.vipTelegramLink) window.open(selectedShow.vipTelegramLink, '_blank');
                      } else {
                        setVipModalShow(selectedShow); 
                      }
                    }} className={`px-6 py-2.5 rounded-xl font-black text-sm shadow-[0_4px_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all whitespace-nowrap ${
                      isAlreadyUnlocked ? 'bg-emerald-600 text-white border border-emerald-500/50' : 'bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717]'
                    }`}>
                      {isAlreadyUnlocked ? "Telegram သို့သွားရန်" : t.joinVip}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Alert Modal */}
      {scheduleAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
            <button onClick={() => setScheduleAlert(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-inner">
               <Clock className="w-6 h-6 text-[#fcd385]" />
            </div>
            <div className="text-center mb-6 space-y-4">
               <p className="text-white font-bold leading-relaxed text-sm">{TRANSLATIONS.en.alertNotReleased} <span className="text-[#fcd385]">{scheduleAlert.date}</span>. {TRANSLATIONS.en.alertOrJoinVip}</p>
               <p className="text-zinc-300 font-bold leading-relaxed text-sm border-t border-zinc-700 pt-4">{TRANSLATIONS.mm.alertNotReleased} <span className="text-[#fcd385]">{scheduleAlert.date}</span> {TRANSLATIONS.mm.alertOrJoinVip}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setScheduleAlert(null)} className="flex-1 bg-zinc-800 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_0_#3f3f46] active:shadow-none active:translate-y-1 transition-all">OK</button>
              <button onClick={() => {setScheduleAlert(null); setVipModalShow(scheduleAlert.show);}} className="flex-1 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-2.5 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">{t.joinVip}</button>
            </div>
          </div>
        </div>
      )}

      {/* VIP Unlock Modal */}
      {vipModalShow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/40 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-center">
            <button onClick={() => setVipModalShow(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            <Lock className="w-10 h-10 text-[#fcd385] mx-auto mb-3" />
            <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: '"Georgia", serif' }}>{t.unlockAll}</h3>
            <p className="text-sm text-zinc-400 mb-6">{t.unlockDesc}</p>
            <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 mb-6 shadow-inner">
              <div className="flex justify-between text-sm mb-3"><span>{t.required}</span><span className="text-[#fcd385] font-bold">{getRequiredPoints(vipModalShow)} {t.pts}</span></div>
              <div className="flex justify-between text-sm"><span>{t.balance}</span><span className="text-white font-bold">{currentUser?.points || 0} {t.pts}</span></div>
            </div>
            <button onClick={() => {
               if(!currentUser || !vipModalShow) return;
               const reqPoints = getRequiredPoints(vipModalShow);
               if(currentUser.points >= reqPoints) {
                 const updatedShows = currentUser.unlockedShows ? [...currentUser.unlockedShows, vipModalShow.id] : [vipModalShow.id];
                 setUsers(users.map(u => u.username === currentUser.username ? { ...u, points: u.points - reqPoints, unlockedShows: updatedShows } : u));
                 setCurrentUser({ ...currentUser, points: currentUser.points - reqPoints, unlockedShows: updatedShows });
                 showToast(t.msgVipSuccess);
                 setVipModalShow(null);
                 if(vipModalShow.vipTelegramLink) window.open(vipModalShow.vipTelegramLink, '_blank');
               } else {
                 setAlertModal({ 
                    message: `${t.msgNotEnough} ${reqPoints} ${t.pts}`,
                    actionText: t.buyPoints,
                    onAction: () => {
                       setAlertModal(null);
                       setVipModalShow(null);
                       setPayStep('providers');
                       setPointModalOpen(true);
                    }
                 });
               }
            }} className="w-full bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-3 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2">
              <Unlock className="w-5 h-5"/> {t.unlockBtn}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}