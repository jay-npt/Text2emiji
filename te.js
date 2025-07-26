document.addEventListener('DOMContentLoaded', function() {
    // --- Sound Effects ---
    const buttonSound = document.getElementById('button-sound');
    const menuSound = document.getElementById('menu-sound');
    
    function playButtonSound() {
        buttonSound.currentTime = 0;
        buttonSound.play().catch(e => console.log("Sound playback prevented:", e));
    }
    
    function playMenuSound() {
        menuSound.currentTime = 0;
        menuSound.play().catch(e => console.log("Sound playback prevented:", e));
    }

    // --- Encryption Logic ---
    const BASE_EMOJIS = ['😀','😁','😂','😃','😄','😅','😆','😇','😈','😉','😊','😋','😌','😍','😎','😏','😐','😑','😒','😓','😔','😕','😖','😗','😘','😙','😚','😛','😜','😝','😞','😟','😠','😡','😢','😣','😤','😥','😦','😧','😨','😩','😪','😫','😬','😮','😯','😰','😱','😲','😳','😴','😵','😶','😷','😸','😹','😺','😻','😼','😽','😾','😿','🙀','💀','👽','💩','🔥','✨'];
    
    const getEmojiMaps = (password) => {
        let seed = 0;
        for (let i = 0; i < password.length; i++) {
            seed = (seed << 5) - seed + password.charCodeAt(i);
            seed |= 0;
        }
        
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
        
        const shuffled = [...BASE_EMOJIS].sort(() => random() - 0.5);
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        const emojiMap = {};
        const reverseEmojiMap = {};
        
        for (let i = 0; i < base64Chars.length; i++) {
            emojiMap[base64Chars[i]] = shuffled[i];
            reverseEmojiMap[shuffled[i]] = base64Chars[i];
        }
        
        return { emojiMap, reverseEmojiMap };
    };
    
    const xorStrings = (input, key) => {
        return Array.from(input).map((char, index) => {
            return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length));
        }).join('');
    };
    
    const encrypt = (text, password) => {
        try {
            const { emojiMap } = getEmojiMaps(password);
            const xorText = xorStrings(text, password);
            const base64 = btoa(unescape(encodeURIComponent(xorText)));
            return Array.from(base64).map(char => emojiMap[char] || '').join('');
        } catch (e) {
            console.error("Encryption error:", e);
            return null;
        }
    };
    
    const decrypt = (emojis, password) => {
        try {
            const { reverseEmojiMap } = getEmojiMaps(password);
            const base64 = Array.from(emojis).map(emoji => reverseEmojiMap[emoji] || '').join('');
            const xorText = decodeURIComponent(escape(atob(base64)));
            return xorStrings(xorText, password);
        } catch (e) {
            console.error("Decryption error:", e);
            return null;
        }
    };

    // --- UI Elements ---
    const body = document.body;
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-menu');
    const themeSwitcher = document.getElementById('theme-switcher');
    const langSwitcher = document.getElementById('lang-switcher');
    const langIndicator = document.getElementById('lang-indicator');
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const modalClose = document.getElementById('modal-close');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const encryptBtn = document.getElementById('encrypt-btn');
    const decryptBtn = document.getElementById('decrypt-btn');
    const encryptToggle = document.getElementById('encrypt-toggle');
    const decryptToggle = document.getElementById('decrypt-toggle');
    const encryptPassword = document.getElementById('encrypt-password');
    const decryptPassword = document.getElementById('decrypt-password');
    const textToEncrypt = document.getElementById('text-to-encrypt');
    const emojisToDecrypt = document.getElementById('emojis-to-decrypt');
    const encryptResult = document.querySelector('#encrypt .result-text');
    const decryptResult = document.querySelector('#decrypt .result-text');
    const copyBtns = document.querySelectorAll('.copy-btn');
    const toast = document.getElementById('toast');

    // --- State ---
    let currentLang = localStorage.getItem('app-language') || 'en';
    const languages = {
        en: {
            encryptTab: "Encrypt",
            decryptTab: "Decrypt",
            encryptPlaceholder: "Enter your message here...",
            decryptPlaceholder: "Paste emojis here...",
            passwordPlaceholder: "Your password",
            encryptBtn: "Encrypt Message",
            decryptBtn: "Decrypt Message",
            encryptResult: "Your encrypted emojis will appear here",
            decryptResult: "Your decrypted message will appear here",
            copied: "Copied to clipboard!",
            noMessage: "Please enter a message",
            noPassword: "Please enter a password",
            wrongPassword: "Wrong password or invalid emojis",
            processing: "Processing...",
            lang: "EN"
        },
        hi: {
            encryptTab: "एन्क्रिप्ट",
            decryptTab: "डिक्रिप्ट",
            encryptPlaceholder: "अपना संदेश यहां लिखें...",
            decryptPlaceholder: "इमोजी यहां पेस्ट करें...",
            passwordPlaceholder: "आपका पासवर्ड",
            encryptBtn: "संदेश एन्क्रिप्ट करें",
            decryptBtn: "संदेश डिक्रिप्ट करें",
            encryptResult: "आपके एन्क्रिप्टेड इमोजी यहां दिखाई देंगे",
            decryptResult: "आपका डिक्रिप्टेड संदेश यहां दिखाई देगा",
            copied: "क्लिपबोर्ड पर कॉपी किया गया!",
            noMessage: "कृपया एक संदेश दर्ज करें",
            noPassword: "कृपया एक पासवर्ड दर्ज करें",
            wrongPassword: "गलत पासवर्ड या अमान्य इमोजी",
            processing: "प्रोसेस हो रहा है...",
            lang: "HI"
        }
    };

    // --- Helper Functions ---
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('app-language', lang);
        
        // Update UI elements
        document.querySelector('[data-tab="encrypt"]').textContent = languages[lang].encryptTab;
        document.querySelector('[data-tab="decrypt"]').textContent = languages[lang].decryptTab;
        textToEncrypt.placeholder = languages[lang].encryptPlaceholder;
        emojisToDecrypt.placeholder = languages[lang].decryptPlaceholder;
        encryptPassword.placeholder = languages[lang].passwordPlaceholder;
        decryptPassword.placeholder = languages[lang].passwordPlaceholder;
        document.querySelector('#encrypt-btn .btn-text').textContent = languages[lang].encryptBtn;
        document.querySelector('#decrypt-btn .btn-text').textContent = languages[lang].decryptBtn;
        
        if (encryptResult.classList.contains('empty')) {
            encryptResult.textContent = languages[lang].encryptResult;
        }
        
        if (decryptResult.classList.contains('empty')) {
            decryptResult.textContent = languages[lang].decryptResult;
        }
        
        langIndicator.textContent = languages[lang].lang;
    }

    function setTheme(theme) {
        body.dataset.theme = theme;
        localStorage.setItem('app-theme', theme);
    }

    async function handleEncrypt() {
        playButtonSound();
        encryptBtn.classList.add('processing');
        
        const text = textToEncrypt.value.trim();
        const password = encryptPassword.value.trim();
        
        if (!text) {
            showToast(languages[currentLang].noMessage);
            encryptBtn.classList.remove('processing');
            return;
        }
        
        if (!password) {
            showToast(languages[currentLang].noPassword);
            encryptBtn.classList.remove('processing');
            return;
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const encrypted = encrypt(text, password);
        
        if (encrypted === null) {
            showToast(languages[currentLang].wrongPassword);
        } else {
            encryptResult.textContent = encrypted;
            encryptResult.classList.remove('empty');
        }
        
        encryptBtn.classList.remove('processing');
    }

    async function handleDecrypt() {
        playButtonSound();
        decryptBtn.classList.add('processing');
        
        const emojis = emojisToDecrypt.value.trim();
        const password = decryptPassword.value.trim();
        
        if (!emojis) {
            showToast(languages[currentLang].noMessage);
            decryptBtn.classList.remove('processing');
            return;
        }
        
        if (!password) {
            showToast(languages[currentLang].noPassword);
            decryptBtn.classList.remove('processing');
            return;
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const decrypted = decrypt(emojis, password);
        
        if (decrypted === null) {
            showToast(languages[currentLang].wrongPassword);
        } else {
            decryptResult.textContent = decrypted;
            decryptResult.classList.remove('empty');
        }
        
        decryptBtn.classList.remove('processing');
    }

    function handleCopy(e) {
        playButtonSound();
        const resultBox = e.target.closest('.result-box');
        const resultText = resultBox.querySelector('.result-text');
        
        if (!resultText.classList.contains('empty')) {
            // Create a temporary textarea to copy from
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = resultText.textContent;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showToast(languages[currentLang].copied);
                } else {
                    console.error('Copy command failed');
                }
            } catch (err) {
                console.error('Failed to copy:', err);
            }
            
            document.body.removeChild(tempTextarea);
        }
    }

    // --- Event Listeners ---
    menuBtn.addEventListener('click', () => {
        playMenuSound();
        sideMenu.classList.add('open');
        menuOverlay.classList.add('open');
    });

    closeMenuBtn.addEventListener('click', () => {
        playMenuSound();
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('open');
    });

    menuOverlay.addEventListener('click', () => {
        playMenuSound();
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('open');
    });

    themeSwitcher.addEventListener('click', () => {
        playMenuSound();
        const newTheme = body.dataset.theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    langSwitcher.addEventListener('click', () => {
        playMenuSound();
        const newLang = currentLang === 'en' ? 'hi' : 'en';
        setLanguage(newLang);
    });

    aboutBtn.addEventListener('click', () => {
        playMenuSound();
        aboutModal.classList.add('open');
    });

    modalClose.addEventListener('click', () => {
        playMenuSound();
        aboutModal.classList.remove('open');
    });

    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            playMenuSound();
            aboutModal.classList.remove('open');
        }
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playButtonSound();
            const tabId = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    encryptBtn.addEventListener('click', handleEncrypt);
    decryptBtn.addEventListener('click', handleDecrypt);

    encryptToggle.addEventListener('click', () => {
        playButtonSound();
        const type = encryptPassword.getAttribute('type');
        encryptPassword.setAttribute('type', type === 'password' ? 'text' : 'password');
    });

    decryptToggle.addEventListener('click', () => {
        playButtonSound();
        const type = decryptPassword.getAttribute('type');
        decryptPassword.setAttribute('type', type === 'password' ? 'text' : 'password');
    });

    copyBtns.forEach(btn => {
        btn.addEventListener('click', handleCopy);
    });

    // Prevent zooming
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });

    // Prevent text selection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });

    // Initialize
    setTheme(localStorage.getItem('app-theme') || 'light');
    setLanguage(currentLang);
});