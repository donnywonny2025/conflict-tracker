// ════════════════════════════════════════════════════
//  STREAM DATABASE — Multi-Source: YouTube + HLS
//  Verified Live 2026-03-01
//
//  type: 'yt'  = YouTube (id = video ID)
//  type: 'hls' = Direct HLS m3u8 (proxied via /api/proxy)
//
//  To add a stream: just add a new entry below.
// ════════════════════════════════════════════════════

const STREAMS = [
    // ── MIDDLE EAST ──────────────────────
    { type: 'yt', id: 'gCNeDWCI0vo', label: 'Al Jazeera English', region: 'QATAR', continent: 'me', flag: '🇶🇦' },
    { type: 'hls', id: 'aje', url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8', label: 'Al Jazeera HLS', region: 'QATAR', continent: 'me', flag: '🇶🇦' },
    { type: 'yt', id: 'CV5Fooi8YJA', label: 'TRT World', region: 'TURKEY', continent: 'me', flag: '🇹🇷' },
    { type: 'yt', id: 'g8bvU0WBfBU', label: 'i24 News English', region: 'ISRAEL', continent: 'me', flag: '🇮🇱' },
    { type: 'yt', id: 'zguvqv2pqTs', label: 'ILTV Israel 24/7', region: 'ISRAEL', continent: 'me', flag: '🇮🇱' },

    // ── IRAN (HLS — Direct from Iranian broadcasters) ──
    { type: 'hls', id: 'presstv', url: 'https://live.presstv.ir/hls/presstv.m3u8', label: 'Press TV (Iran English)', region: 'IRAN', continent: 'me', flag: '🇮🇷' },
    { type: 'hls', id: 'alalam', url: 'https://live2.alalam.ir/alalam.m3u8', label: 'Al Alam (Iran Arabic)', region: 'IRAN', continent: 'me', flag: '🇮🇷' },
    { type: 'hls', id: 'iranpress', url: 'https://live.presstv.ir/hls/presstv_5_482/index.m3u8', label: 'Iran Press', region: 'IRAN', continent: 'me', flag: '🇮🇷' },
    { type: 'hls', id: 'snn', url: 'https://live2.snn.ir/hls/snn2_hd720/index.m3u8', label: 'SNN Iran News', region: 'IRAN', continent: 'me', flag: '🇮🇷' },

    // ── ISRAEL (HLS — Direct from Israeli broadcasters) ──
    { type: 'hls', id: 'kan11', url: 'https://kan11w.media.kan.org.il/hls/live/2105694/2105694/master.m3u8', label: 'KAN 11 Israel', region: 'ISRAEL', continent: 'me', flag: '🇮🇱' },
    { type: 'hls', id: 'i24heb', url: 'https://bcovlive-a.akamaihd.net/d89ede8094c741b7924120b27764153c/eu-central-1/5377161796001/playlist.m3u8', label: 'i24 News Hebrew', region: 'ISRAEL', continent: 'me', flag: '🇮🇱' },
    { type: 'hls', id: 'knesset', url: 'https://contact.gostreaming.tv/Knesset/myStream/playlist.m3u8', label: 'Knesset Channel', region: 'ISRAEL', continent: 'me', flag: '🇮🇱' },
    { type: 'hls', id: 'reshet13', url: 'https://d2xg1g9o5vns8m.cloudfront.net/out/v1/0855d703f7d5436fae6a9c7ce8ca5075/index.m3u8', label: 'Reshet 13 Israel', region: 'ISRAEL', continent: 'me', flag: '🇮🇱' },

    // ── EUROPE ───────────────────────────
    { type: 'hls', id: 'f24en', url: 'https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8', label: 'France 24 English', region: 'FRANCE', continent: 'eu', flag: '🇫🇷' },
    { type: 'hls', id: 'f24fr', url: 'https://static.france24.com/live/F24_FR_HI_HLS/live_web.m3u8', label: 'France 24 Français', region: 'FRANCE', continent: 'eu', flag: '🇫🇷' },
    { type: 'hls', id: 'f24ar', url: 'https://static.france24.com/live/F24_AR_HI_HLS/live_web.m3u8', label: 'France 24 العربية', region: 'FRANCE', continent: 'eu', flag: '🇫🇷' },
    { type: 'yt', id: 'QliL4CGc7iY', label: 'GB News', region: 'UK', continent: 'eu', flag: '🇬🇧' },
    { type: 'yt', id: '4Y799Fb-jkk', label: 'DW News', region: 'GERMANY', continent: 'eu', flag: '🇩🇪' },
    { type: 'yt', id: 'pykpO5kQJ98', label: 'Euronews', region: 'EU', continent: 'eu', flag: '🇪🇺' },
    { type: 'yt', id: 'ScdUZNkwcYc', label: 'Espreso TV', region: 'UKRAINE', continent: 'eu', flag: '🇺🇦' },
    { type: 'yt', id: 'm4mVcUReR6Y', label: 'TVP World', region: 'POLAND', continent: 'eu', flag: '🇵🇱' },

    // ── NORTH AMERICA ────────────────────
    { type: 'yt', id: 'iipR5yUp36o', label: 'ABC News Live', region: 'USA', continent: 'na', flag: '🇺🇸' },
    { type: 'yt', id: 'ZvdiJUYGBis', label: 'LiveNOW from FOX', region: 'USA', continent: 'na', flag: '🇺🇸' },
    { type: 'yt', id: 'RrR3Bn60J7I', label: 'NBC News NOW', region: 'USA', continent: 'na', flag: '🇺🇸' },
    { type: 'yt', id: '8rD5quyoCo0', label: 'CBS News 24/7', region: 'USA', continent: 'na', flag: '🇺🇸' },
    { type: 'yt', id: 'kfxWyGsBLek', label: 'PBS NewsHour', region: 'USA', continent: 'na', flag: '🇺🇸' },
    { type: 'yt', id: 'S-lFBzloL2Y', label: 'NEWSMAX', region: 'USA', continent: 'na', flag: '🇺🇸' },
    { type: 'yt', id: 'j5BfCSVgS10', label: 'Free Speech TV', region: 'USA', continent: 'na', flag: '🇺🇸' },

    // ── ASIA-PACIFIC ─────────────────────
    { type: 'yt', id: '0UrpSCv6A1Y', label: 'WION', region: 'INDIA', continent: 'asia', flag: '🇮🇳' },
    { type: 'yt', id: 'KctE56sB5oo', label: 'NDTV 24x7', region: 'INDIA', continent: 'asia', flag: '🇮🇳' },
    { type: 'yt', id: 'koV7xh3FzB4', label: 'Times Now', region: 'INDIA', continent: 'asia', flag: '🇮🇳' },
    { type: 'yt', id: 'BOy2xDU1LC8', label: 'CGTN', region: 'CHINA', continent: 'asia', flag: '🇨🇳' },
    { type: 'hls', id: 'nhk', url: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index_4M.m3u8', label: 'NHK World', region: 'JAPAN', continent: 'asia', flag: '🇯🇵' },
    { type: 'yt', id: 'XWq5kBlakcQ', label: 'CNA', region: 'SINGAPORE', continent: 'asia', flag: '🇸🇬' },
    { type: 'yt', id: 'zvoPEgZeWkg', label: 'Arirang TV', region: 'S. KOREA', continent: 'asia', flag: '🇰🇷' },

    // ── AFRICA ───────────────────────────
    { type: 'yt', id: 'd4zDorDl5UE', label: 'Channels TV', region: 'NIGERIA', continent: 'africa', flag: '🇳🇬' },
    { type: 'yt', id: 'NQjabLGdP5g', label: 'Africanews', region: 'PAN-AFRICA', continent: 'africa', flag: '🌍' },
    { type: 'yt', id: 'eVe3C_3wFU8', label: 'SABC News', region: 'S. AFRICA', continent: 'africa', flag: '🇿🇦' },

    // ── LATIN AMERICA ────────────────────
    { type: 'yt', id: '3CFBGiIm-_E', label: 'TeleSUR English', region: 'VENEZUELA', continent: 'latam', flag: '🇻🇪' },
    { type: 'yt', id: '_843_WB2at8', label: 'Canal 26', region: 'ARGENTINA', continent: 'latam', flag: '🇦🇷' },

    // ── OCEANIA ──────────────────────────
    { type: 'yt', id: 'vOTiJkg1voo', label: 'ABC Australia', region: 'AUSTRALIA', continent: 'oceania', flag: '🇦🇺' },
    { type: 'yt', id: 'rr2e9YNQO4Q', label: 'Sky News Australia', region: 'AUSTRALIA', continent: 'oceania', flag: '🇦🇺' },

    // ── LIVE CAMERAS / SKYLINES ──────────
    { type: 'yt', id: 'UMJGcSB1VvI', label: 'Western Wall 24/7', region: 'JERUSALEM', continent: 'cam', flag: '📹' },
    { type: 'yt', id: 'DDU-rZs-Ic4', label: 'ISS Earth View', region: 'SPACE', continent: 'cam', flag: '🌍' },
    { type: 'yt', id: 'LsUGWzMeXOI', label: 'Jerusalem Skyline', region: 'ISRAEL', continent: 'cam', flag: '📹' },
    { type: 'yt', id: '4K_E_GSFM8Q', label: 'Tel Aviv Skyline', region: 'ISRAEL', continent: 'cam', flag: '📹' },
    { type: 'yt', id: 'iFKzOjVDBaw', label: 'Haifa Port View', region: 'ISRAEL', continent: 'cam', flag: '📹' },
    { type: 'yt', id: '86YLFOog4GM', label: 'Kyiv Skyline', region: 'UKRAINE', continent: 'cam', flag: '📹' },
    { type: 'yt', id: 'kVVk-F4Qfew', label: 'Dubai Skyline', region: 'UAE', continent: 'cam', flag: '📹' },
    { type: 'yt', id: '2lCgiwnPrD4', label: 'Beirut Panorama', region: 'LEBANON', continent: 'cam', flag: '📹' },
];

const REGIONS = {
    all: { label: '🌍 All', filter: () => true },
    cam: { label: '📹 Cameras', filter: s => s.continent === 'cam' },
    me: { label: '🕌 Middle East', filter: s => s.continent === 'me' },
    eu: { label: '🇪🇺 Europe', filter: s => s.continent === 'eu' },
    na: { label: '🇺🇸 Americas', filter: s => s.continent === 'na' },
    asia: { label: '🌏 Asia', filter: s => s.continent === 'asia' },
    africa: { label: '🌍 Africa', filter: s => s.continent === 'africa' },
    latam: { label: '🌎 Latin Am.', filter: s => s.continent === 'latam' },
    oceania: { label: '🌊 Oceania', filter: s => s.continent === 'oceania' },
};
