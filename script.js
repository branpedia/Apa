document.addEventListener('DOMContentLoaded', function() {
    // Daftar kode redeem yang valid
    const VALID_CODES = [
        "BRANPEDIA", 
        "BRANPEDIA10", 
        "BRAN2023",
        "BRAN123",
        "BRANPEDIAVIP"
    ];
    
    // Probabilitas hadiah yang lebih fair
    const PRIZES = [
        {name: 'Paket Internet 10GB', probability: 0.1},  // 10%
        {name: 'Pulsa 50.000', probability: 0.1},        // 10%
        {name: 'Voucher Netflix 1 Bulan', probability: 0.1}, // 10%
        {name: 'Voucher Spotify Premium', probability: 0.1}, // 10%
        {name: 'Zonk', probability: 0.6}                   // 60%
    ];
    
    // DOM Elements
    const redeemBtn = document.getElementById('redeemBtn');
    const redeemCodeInput = document.getElementById('redeemCode');
    const resultDiv = document.getElementById('result');
    const usedCodeAlert = document.getElementById('usedCodeAlert');
    const infoAlert = document.getElementById('infoAlert');
    const invalidCodeAlert = document.getElementById('invalidCodeAlert');
    const historyList = document.getElementById('historyList');
    const timeDisplay = document.getElementById('time');
    const totalRedeemsDisplay = document.getElementById('totalRedeems');
    const winCountDisplay = document.getElementById('winCount');
    const loseCountDisplay = document.getElementById('loseCount');
    
    // Sistem random yang lebih fair
    let prizePool = [];
    let currentPool = [];
    let startTime;
    let timerInterval;
    
    // Inisialisasi pool hadiah
    function initializePrizePool() {
        prizePool = [];
        // Isi pool dengan hadiah sesuai probabilitas
        PRIZES.forEach(prize => {
            const count = Math.floor(prize.probability * 100);
            for (let i = 0; i < count; i++) {
                prizePool.push(prize.name);
            }
        });
        
        // Acak isi pool
        prizePool = shuffleArray(prizePool);
        currentPool = [...prizePool]; // Salin pool untuk digunakan
    }
    
    // Fungsi untuk mengacak array
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // Dapatkan hadiah dari pool
    function getPrizeFromPool() {
        if (currentPool.length === 0) {
            initializePrizePool(); // Reset pool jika habis
        }
        
        // Ambil hadiah dari pool
        const prize = currentPool.pop();
        return prize;
    }
    
    // Initialize database in localStorage
    function initializeDatabase() {
        if (!localStorage.getItem('redeemDatabase')) {
            const initialData = {
                logs: [],
                usedCodes: [],
                stats: {
                    total: 0,
                    wins: 0,
                    loses: 0
                }
            };
            localStorage.setItem('redeemDatabase', JSON.stringify(initialData));
            return initialData;
        }
        return getDatabase();
    }
    
    // Load and display history
    initializeDatabase();
    initializePrizePool();
    updateHistory();
    updateStats();
    startTimer();
    
    // Event listeners
    redeemCodeInput.addEventListener('input', checkCode);
    redeemBtn.addEventListener('click', processRedeem);
    
    // Check code validity and availability
    function checkCode() {
        const code = redeemCodeInput.value.trim().toUpperCase();
        const db = getDatabase();
        
        // Sembunyikan semua alert terlebih dahulu
        usedCodeAlert.style.display = 'none';
        infoAlert.style.display = 'none';
        invalidCodeAlert.style.display = 'none';
        
        if (code.length === 0) {
            redeemBtn.disabled = true;
            return;
        }
        
        // Cek apakah kode termasuk dalam daftar valid
        const isValidCode = VALID_CODES.includes(code);
        
        // Cek apakah kode sudah digunakan sebelumnya
        const isUsed = db.usedCodes && db.usedCodes.some(usedCode => 
            usedCode.toUpperCase() === code
        );
        
        if (isUsed) {
            usedCodeAlert.style.display = 'block';
            redeemBtn.disabled = true;
        } else if (isValidCode) {
            infoAlert.style.display = 'block';
            redeemBtn.disabled = false;
        } else {
            // Jika kode tidak valid
            invalidCodeAlert.style.display = 'block';
            redeemBtn.disabled = true;
        }
    }
    
    // Process redeem
    function processRedeem() {
        const code = redeemCodeInput.value.trim().toUpperCase();
        if (!code) return;
        
        // Validasi lagi sebelum proses
        if (!VALID_CODES.includes(code)) {
            invalidCodeAlert.style.display = 'block';
            return;
        }
        
        // UI changes
        redeemBtn.disabled = true;
        redeemBtn.innerHTML = 'Memproses <span class="spinner"></span>';
        resultDiv.style.display = 'none';
        usedCodeAlert.style.display = 'none';
        infoAlert.style.display = 'none';
        invalidCodeAlert.style.display = 'none';
        
        // Simulate API call
        setTimeout(() => {
            const result = redeemCode(code);
            
            // Display result
            displayResult(result, code);
            
            // Update UI
            updateHistory();
            updateStats();
            redeemCodeInput.value = '';
            redeemBtn.disabled = false;
            redeemBtn.textContent = 'Redeem Sekarang';
            checkCode();
        }, 1500);
    }
    
    // Redeem code logic
    function redeemCode(code) {
        const db = getDatabase();
        
        // Validate code again (just to be sure)
        if (!VALID_CODES.includes(code.toUpperCase())) {
            return {
                success: false,
                message: 'Kode tidak valid',
                prize: null
            };
        }
        
        // Check if code already used (case insensitive)
        if (db.usedCodes && db.usedCodes.some(c => c.toUpperCase() === code.toUpperCase())) {
            return {
                success: false,
                message: 'Kode sudah digunakan',
                prize: null
            };
        }
        
        // Dapatkan hadiah dari pool yang sudah diacak
        const selectedPrize = getPrizeFromPool();
        
        // Initialize arrays if they don't exist
        if (!db.logs) db.logs = [];
        if (!db.usedCodes) db.usedCodes = [];
        if (!db.stats) {
            db.stats = {
                total: 0,
                wins: 0,
                loses: 0
            };
        }
        
        // Save to database
        const log = {
            id: db.logs.length + 1,
            code: code,
            prize: selectedPrize,
            redeemed_at: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        db.logs.unshift(log);
        db.usedCodes.push(code);
        
        // Update stats
        db.stats.total++;
        if (selectedPrize === 'Zonk') {
            db.stats.loses++;
        } else {
            db.stats.wins++;
        }
        
        updateDatabase(db);
        
        // Return result
        if (selectedPrize !== 'Zonk') {
            createConfetti();
            return {
                success: true,
                prize: selectedPrize,
                message: 'Selamat! Anda memenangkan hadiah!'
            };
        } else {
            return {
                success: false,
                prize: 'Zonk',
                message: 'Maaf, Anda belum beruntung.'
            };
        }
    }
    
    // Display result
    function displayResult(result, code) {
        resultDiv.style.display = 'block';
        
        if (result.success) {
            resultDiv.className = 'result-container win';
            resultDiv.innerHTML = `
                <h2>🎉 Selamat!</h2>
                <p>Anda mendapatkan: <strong>${result.prize}</strong></p>
                <p>Kode: <code>${code}</code></p>
                <p>Hadiah akan dikirim ke email Anda dalam 1x24 jam.</p>
                <p><small>Waktu redeem: ${new Date().toLocaleString()}</small></p>
            `;
        } else {
            resultDiv.className = 'result-container lose';
            resultDiv.innerHTML = `
                <h2>😢 ${result.prize ? 'Zonk!' : 'Error'}</h2>
                <p>${result.message}</p>
                ${code ? `<p>Kode: <code>${code}</code></p>` : ''}
                <p><small>Waktu redeem: ${new Date().toLocaleString()}</small></p>
            `;
        }
    }
    
    // Update history list
    function updateHistory() {
        const db = getDatabase();
        historyList.innerHTML = '';
        
        if (!db.logs || db.logs.length === 0) {
            historyList.innerHTML = '<li>Belum ada riwayat redeem</li>';
            return;
        }
        
        db.logs.slice(0, 5).forEach(log => {
            const li = document.createElement('li');
            li.className = 'history-item';
            
            const isWin = log.prize !== 'Zonk';
            const prizeClass = isWin ? 'prize-success' : 'prize-danger';
            
            li.innerHTML = `
                <span>
                    <strong>${log.code}</strong>
                    <small>(${new Date(log.redeemed_at).toLocaleTimeString()})</small>
                </span>
                <span class="prize-badge ${prizeClass}">${log.prize}</span>
            `;
            
            historyList.appendChild(li);
        });
    }
    
    // Update statistics
    function updateStats() {
        const db = getDatabase();
        if (!db.stats) {
            db.stats = {
                total: 0,
                wins: 0,
                loses: 0
            };
            updateDatabase(db);
        }
        totalRedeemsDisplay.textContent = db.stats.total || 0;
        winCountDisplay.textContent = db.stats.wins || 0;
        loseCountDisplay.textContent = db.stats.loses || 0;
    }
    
    // Timer functions
    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timeDisplay.textContent = `${minutes}:${seconds}`;
    }
    
    // Confetti effect
    function createConfetti() {
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = '-10px';
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            
            document.body.appendChild(confetti);
            
            const animationDuration = Math.random() * 3 + 2;
            
            confetti.animate([
                { top: '-10px', opacity: 1, transform: 'rotate(0deg)' },
                { top: '100vh', opacity: 0, transform: 'rotate(360deg)' }
            ], {
                duration: animationDuration * 1000,
                easing: 'cubic-bezier(0.1, 0.8, 0.9, 1)'
            });
            
            setTimeout(() => {
                confetti.remove();
            }, animationDuration * 1000);
        }
    }
    
    // Database helper functions
    function getDatabase() {
        const db = localStorage.getItem('redeemDatabase');
        return db ? JSON.parse(db) : initializeDatabase();
    }
    
    function updateDatabase(newData) {
        localStorage.setItem('redeemDatabase', JSON.stringify(newData));
    }
});
