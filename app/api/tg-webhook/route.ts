import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// --- FIREBASE CONFIG (သင့် page.tsx မှ Config အတိုင်းပါပဲ) ---
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Telegram Channel ကနေ ပို့တဲ့ Post ဟုတ်မဟုတ် စစ်ဆေးခြင်း
    const post = body.channel_post;
    if (!post) return NextResponse.json({ success: true, msg: 'Not a channel post' });

    // စာသား သို့မဟုတ် ပုံ/ဗီဒီယိုရဲ့ Caption ကို ယူခြင်း
    const content = post.text || post.caption || '';
    
    // Auto-Link Tag ကို ရှာဖွေခြင်း (ဥပမာ: #vid-123456789_ep1)
    const match = content.match(/#(vid-\d+)_ep(\d+)/);
    if (!match) return NextResponse.json({ success: true, msg: 'No auto-link tag found' });

    const movieId = match[1];
    const epNumber = parseInt(match[2], 10);

    // Telegram Public Link တည်ဆောက်ခြင်း
    let tgLink = '';
    if (post.chat.username) {
      tgLink = `https://t.me/${post.chat.username}/${post.message_id}`;
    } else {
      // အကယ်၍ Private ထဲ တင်မိပါက အလုပ်လုပ်စေရန် (Fallback)
      const chatIdStr = String(post.chat.id).replace('-100', '');
      tgLink = `https://t.me/c/${chatIdStr}/${post.message_id}`;
    }

    // Firebase Database ထဲသို့ Link အလိုအလျောက် သွားထည့်ခြင်း
    const showsRef = doc(db, "SiteData", "shows");
    const showsSnap = await getDoc(showsRef);
    
    if (showsSnap.exists() && showsSnap.data().data) {
      let shows = showsSnap.data().data;
      let isUpdated = false;

      shows = shows.map((show: any) => {
        if (show.id === movieId) {
          if (show.episodes && show.episodes[epNumber - 1]) {
            const ep = show.episodes[epNumber - 1];
            if (!ep.links) ep.links = [];
            
            // Link ထပ်နေတာမျိုး မဖြစ်အောင် စစ်ဆေးခြင်း
            const alreadyExists = ep.links.some((l: any) => l.url === tgLink);
            if (!alreadyExists) {
              ep.links.push({ platform: 'Telegram', url: tgLink });
              isUpdated = true;
            }
          }
        }
        return show;
      });

      // ပြင်ဆင်ပြီးသား Data ကို Database ထဲ Save ခြင်း
      if (isUpdated) {
        await setDoc(showsRef, { data: shows });
        console.log(`Auto-linked ${movieId} Episode ${epNumber}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}