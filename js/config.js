/* ═══════════════════════════════════════════
   WAR ROOM — Config / Data
   Stream presets, Polymarket data, OSINT links, ticker headlines
   ═══════════════════════════════════════════ */

const CONFIG = {
    storageKey: 'warRoomStreams_v7',

    // ── TICKER HEADLINES ──
    ticker: [
        'US & ISRAEL STRIKE IRAN — OPERATION EPIC FURY',
        'KHAMENEI KILLED IN US-ISRAELI STRIKE ON TEHRAN',
        '1,200+ BOMBS DROPPED ON IRAN — IDF NEAR AIR SUPREMACY',
        'IRAN RETALIATES — MISSILES HIT ISRAEL & GULF STATES',
        '9 KILLED IN IRANIAN MISSILE STRIKE ON BEIT SHEMESH',
        'DUBAI AIRPORT & BURJ AL ARAB DAMAGED',
        'UN SECURITY COUNCIL HOLDS EMERGENCY SESSION',
        'IRAN DECLARES 40 DAYS OF NATIONAL MOURNING',
        'IRANIAN CLUSTER BOMB SUB-MUNITIONS HIT ISRAEL',
        'TRUMP ANNOUNCES "MAJOR COMBAT OPERATIONS" IN IRAN',
    ],

    // ── POLYMARKET DATA ──
    polymarket: [
        { title: 'Khamenei out by Feb 28?', answer: 'Yes', odds: '100%', url: 'https://polymarket.com/event/khamenei-out-as-supreme-leader-of-iran-by-february-28' },
        { title: 'Khamenei out by Mar 31?', answer: 'Yes', odds: '100%', url: 'https://polymarket.com/event/khamenei-out-as-supreme-leader-of-iran-by-march-31' },
        { title: 'Countries Iran strikes in March?', answer: 'Israel', odds: '98%', url: 'https://polymarket.com/event/which-countries-will-iran-strike-in-march' },
        { title: 'Iran strikes Israel on...?', answer: 'March 1', odds: '98%', url: 'https://polymarket.com/event/iran-strikes-israel-on' },
        { title: 'How many countries Iran strikes?', answer: '3+', odds: '84%', url: 'https://polymarket.com/event/how-many-different-countries-will-iran-strike-in-march' },
        { title: 'New Supreme Leader by...?', answer: 'March 31', odds: '80%', url: 'https://polymarket.com/event/will-iran-name-a-successor-to-khamenei-by' },
        { title: 'Iran strike gulf oil facilities?', answer: 'Yes', odds: '78%', url: 'https://polymarket.com/event/will-iran-strike-gulf-oil-facilities-by-march-31' },
        { title: 'Trump ends operations by...?', answer: 'March 31', odds: '71%', url: 'https://polymarket.com/event/trump-announces-end-of-military-operations-against-iran-by' },
        { title: 'Conflict ends by...?', answer: 'March 31', odds: '64%', url: 'https://polymarket.com/event/iran-x-israelus-conflict-ends-by' },
        { title: 'US-Iran ceasefire by...?', answer: 'March 31', odds: '62%', url: 'https://polymarket.com/event/us-x-iran-ceasefire-by' },
        { title: 'Iran closes Strait of Hormuz?', answer: 'Yes', odds: '47%', url: 'https://polymarket.com/event/will-iran-close-the-strait-of-hormuz-by-2027' },
        { title: 'Reza Pahlavi enters Iran?', answer: 'Yes', odds: '45%', url: 'https://polymarket.com/event/will-reza-pahlavi-enter-iran-by-june-30' },
        { title: 'US forces enter Iran?', answer: 'Yes', odds: '38%', url: 'https://polymarket.com/event/us-forces-enter-iran-by' },
        { title: 'US recognizes Pahlavi as leader?', answer: 'Yes', odds: '25%', url: 'https://polymarket.com/event/us-recognizes-reza-pahlavi-as-leader-of-iran-in2026' },
        { title: 'US invades Iran before 2027?', answer: 'Yes', odds: '22%', url: 'https://polymarket.com/event/will-the-us-invade-iran-before-2027' },
        { title: 'US-Iran nuclear deal by Mar 31?', answer: 'Yes', odds: '20%', url: 'https://polymarket.com/event/us-iran-nuclear-deal-by-march-31' },
        { title: 'Next Supreme Leader?', answer: 'Mojtaba Khamenei', odds: '18%', url: 'https://polymarket.com/event/who-will-be-next-supreme-leader-of-iran-515' },
        { title: 'Iran ends uranium enrichment?', answer: 'Yes', odds: '18%', url: 'https://polymarket.com/event/iran-agrees-to-end-enrichment-of-uranium-by-march-31' },
        { title: 'US officially declares war?', answer: 'Yes', odds: '11%', url: 'https://polymarket.com/event/will-the-us-officially-declare-war-on-iran-by' },
        { title: 'US invades Iran by Mar 31?', answer: 'Yes', odds: '8%', url: 'https://polymarket.com/event/will-the-us-invade-iran-by-march-31' },
    ],

    // ── OSINT DASHBOARDS ──
    osint: [
        { name: 'ISW Strike Map', icon: '🎯', url: 'https://isw.pub/IranStrikesMap2026' },
        { name: 'LiveUAMap Iran', icon: '🗺️', url: 'https://iran.liveuamap.com' },
        { name: 'World Monitor', icon: '🌐', url: 'https://worldmonitor.app' },
        { name: 'USvsIRAN', icon: '⚔️', url: 'https://usvsiran.com' },
        { name: 'Iran Monitor', icon: '📡', url: 'https://iranmonitor.org' },
        { name: 'NASA FIRMS', icon: '🔥', url: 'https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@52,32,5' },
        { name: 'FlightRadar24', icon: '✈️', url: 'https://flightradar24.com' },
        { name: 'ADS-B Exchange', icon: '🛩️', url: 'https://globe.adsbexchange.com' },
        { name: 'MarineTraffic', icon: '🚢', url: 'https://marinetraffic.com' },
        { name: 'Cloudflare Radar', icon: '📶', url: 'https://radar.cloudflare.com/ir' },
        { name: 'GeoConfirmed', icon: '📌', url: 'https://geoconfirmed.org' },
        { name: 'Critical Threats', icon: '🔴', url: 'https://criticalthreats.org' },
    ],

    // ── STREAM PRESETS — ALL UNIQUE IDs (no duplicates per preset!) ──
    presets: {
        iran: [
            { type: 'youtube', id: 'gCNeDWCI0vo', handle: '@AlJazeeraEnglish', label: 'Al Jazeera', region: 'QATAR' },
            { type: 'youtube', id: 'NygUCOEHrF8', handle: '@SkyNews', label: 'Sky News', region: 'UK' },
            { type: 'youtube', id: 'Ap-UM1O9RBU', handle: '@France24_en', label: 'France 24', region: 'FRANCE' },
            { type: 'youtube', id: '4Y799Fb-jkk', handle: '@DWNews', label: 'DW News', region: 'GERMANY' },
            { type: 'youtube', id: 'ABfFhWzWs0s', handle: '@TRTWorld', label: 'TRT World', region: 'TURKEY' },
            { type: 'youtube', id: 'FGUKbzulB_Y', handle: '@TBNIsrael', label: 'TBN Israel', region: 'ISRAEL' },
            { type: 'youtube', id: 'pykpO5kQJ98', handle: '@euronews', label: 'Euronews', region: 'EU' },
            { type: 'youtube', id: 'zguvqv2pqTs', handle: '@ILTVIsrael', label: 'ILTV Israel', region: 'ISRAEL' },
            { type: 'youtube', id: 'GzIGQs7dkos', handle: '@WIONews', label: 'WION', region: 'INDIA' },
        ],
        'iran2': [
            { type: 'youtube', id: 'QliL4CGc7iY', label: 'GB News', region: 'UK' },
            { type: 'youtube', id: 'UCknLrEdhRCp1aegoMqRaCZg', handle: '@dw_conflict_zone', label: 'DW Conflict', region: 'GERMANY' },
            { type: 'youtube', id: 'pykpO5kQJ98', handle: '@euronews', label: 'Euronews', region: 'EU' },
            { type: 'youtube', id: 'KctE56sB5oo', label: 'NDTV 24x7', region: 'INDIA' },
            { type: 'youtube', id: 'XWq5kBlakcQ', label: 'CNA', region: 'SINGAPORE' },
            { type: 'youtube', id: 'NQjabLGdP5g', label: 'Africanews', region: 'PAN-AFRICA' },
            { type: 'youtube', id: '87r-1JKz7E4', label: 'Sky News Australia', region: 'AUSTRALIA' },
            { type: 'hls', id: 'presstv', url: 'https://live.presstv.ir/hls/presstv.m3u8', label: 'Press TV (Iran)', region: 'IRAN' },
            { type: 'youtube', id: 'ScdUZNkwcYc', label: 'Espreso TV', region: 'UKRAINE' },
        ],
        world: [
            { type: 'youtube', id: 'gCNeDWCI0vo', handle: '@AlJazeeraEnglish', label: 'Al Jazeera', region: 'QATAR' },
            { type: 'youtube', id: 'NygUCOEHrF8', handle: '@SkyNews', label: 'Sky News', region: 'UK' },
            { type: 'youtube', id: 'pykpO5kQJ98', handle: '@euronews', label: 'Euronews', region: 'EU' },
            { type: 'youtube', id: 'ABfFhWzWs0s', handle: '@TRTWorld', label: 'TRT World', region: 'TURKEY' },
            { type: 'youtube', id: '4Y799Fb-jkk', handle: '@DWNews', label: 'DW News', region: 'GERMANY' },
            { type: 'youtube', id: 'Ap-UM1O9RBU', handle: '@France24_en', label: 'France 24', region: 'FRANCE' },
        ],
        'iran-attacks': [
            { type: 'youtube', id: 'gCNeDWCI0vo', handle: '@AlJazeeraEnglish', label: 'Al Jazeera', region: 'QATAR' },
            { type: 'youtube', id: 'NygUCOEHrF8', handle: '@SkyNews', label: 'Sky News', region: 'UK' },
            { type: 'youtube', id: 'Ap-UM1O9RBU', handle: '@France24_en', label: 'France 24', region: 'FRANCE' },
            { type: 'youtube', id: 'ABfFhWzWs0s', handle: '@TRTWorld', label: 'TRT World', region: 'TURKEY' },
            { type: 'youtube', id: 'FGUKbzulB_Y', handle: '@TBNIsrael', label: 'TBN Israel', region: 'ISRAEL' },
        ],
        mideast: [
            { type: 'youtube', id: 'gCNeDWCI0vo', handle: '@AlJazeeraEnglish', label: 'Al Jazeera', region: 'QATAR' },
            { type: 'youtube', id: 'NygUCOEHrF8', handle: '@SkyNews', label: 'Sky News', region: 'UK' },
            { type: 'youtube', id: 'Ap-UM1O9RBU', handle: '@France24_en', label: 'France 24', region: 'FRANCE' },
            { type: 'youtube', id: 'ABfFhWzWs0s', handle: '@TRTWorld', label: 'TRT World', region: 'TURKEY' },
        ],
        europe: [
            { type: 'youtube', id: '4Y799Fb-jkk', label: 'DW News', region: 'GERMANY' },
            { type: 'youtube', id: 'Ap-UM1O9RBU', label: 'France 24', region: 'FRANCE' },
            { type: 'youtube', id: 'NygUCOEHrF8', label: 'Sky News', region: 'UK' },
        ],
        americas: [
            { type: 'youtube', id: 'yMr0neQhu6c', label: 'NBC News NOW', region: 'USA' },
            { type: 'youtube', id: 'LK14M_4wkcE', label: 'CBS News 24/7', region: 'USA' },
            { type: 'youtube', id: 'gCNeDWCI0vo', label: 'Al Jazeera', region: 'QATAR' },
            { type: 'youtube', id: 'LuKwFajn37U', label: 'DW News', region: 'GERMANY' },
        ],
    },

    // ── X / WAR VIDEO PLAYLIST ──
    xVideos: [
        { id: 'NygUCOEHrF8', caption: 'Sky News — Iran war coverage', source: '@SkyNews' },
        { id: 'gCNeDWCI0vo', caption: 'Al Jazeera English — 24/7', source: '@AlJazeera' },
        { id: 'Ap-UM1O9RBU', caption: 'France 24 — International coverage', source: '@France24' },
        { id: 'LuKwFajn37U', caption: 'DW News — German perspective', source: '@DWNews' },
        { id: 'i_539x1jpXw', caption: 'Times Now — Iran-Israel live', source: '@TimesNow' },
    ],
};
