// ==================== POCKETBASE SETUP ====================
const pb = new PocketBase('http://127.0.0.1:8090');

// Authentication functions
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const authData = await pb.collection('users').authWithPassword(email, password);
        console.log('Logged in!', authData);
        closeAuthModal();
        loadDashboard(); // Refresh the page with user data
        showNotification('Welcome back!', 'success');
    } catch (error) {
        console.error('Login failed:', error);
        showNotification('Login failed. Check your email/password.', 'error');
    }
}

async function handleRegister() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const data = {
            username: username,
            email: email,
            password: password,
            passwordConfirm: password,
            emailVisibility: true
        };
        
        await pb.collection('users').create(data);
        console.log('Registered!');
        showNotification('Account created! Please login.', 'success');
        showLoginForm(); // Switch to login form
    } catch (error) {
        console.error('Registration failed:', error);
        showNotification('Registration failed. Try different email.', 'error');
    }
}

function logout() {
    pb.authStore.clear();
    showNotification('Logged out successfully', 'success');
    loadDashboard(); // Refresh page
}

function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    showLoginForm();
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function isLoggedIn() {
    return pb.authStore.isValid;
}

function getCurrentUser() {
    return pb.authStore.model;
}

function showNotification(message, type = 'info') {
    // Simple notification - you can improve this later
    alert(message);
}
// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentArea = document.getElementById('content-area');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarFab = document.getElementById('sidebarFab');
    const userAvatar = document.getElementById('userAvatar');
    const profileDropdown = document.getElementById('profileDropdown');
    const floatingAskAI = document.getElementById('floatingAskAI');
    const aiChatPanel = document.getElementById('aiChatPanel');
    const aiChatClose = document.getElementById('aiChatClose');
    const aiChatSend = document.getElementById('aiChatSend');
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatBody = document.getElementById('aiChatBody');
    const splashScreen = document.getElementById('splashScreen');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const appContainer = document.querySelector('.container');
    const globalFileInput = document.getElementById('globalFileInput');
    const quizPage = document.getElementById('quizPage');
    const quizPageTitle = document.getElementById('quizPageTitle');
    const quizPrompt = document.getElementById('quizPrompt');
    const quizProgress = document.getElementById('quizProgress');
    const quizNext = document.getElementById('quizNext');
    const quizBack = document.getElementById('quizBack');
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsPage = document.getElementById('notificationsPage');
    const notificationsBack = document.getElementById('notificationsBack');
    const notificationsBody = document.getElementById('notificationsBody');
    const notesPage = document.getElementById('notesPage');
    const notesBack = document.getElementById('notesBack');
    const notesBody = document.getElementById('notesBody');
    const notesPageTitle = document.getElementById('notesPageTitle');
    const notesPageBody = document.getElementById('notesPageBody');
    const notesPageAllNodes = Array.from(document.querySelectorAll('#notesPage'));
    const dashListPage = document.getElementById('dashListPage');
    const dashListBack = document.getElementById('dashListBack');
    const dashListTitle = document.getElementById('dashListTitle');
    const dashListBody = document.getElementById('dashListBody');
    
    const labPage = document.getElementById('labPage');
    const labBack = document.getElementById('labBack');
    const labBody = document.getElementById('labBody');
    const labPageTitle = document.getElementById('labPageTitle');
    const mentorResourcePage = document.getElementById('mentorResourcePage');
    const mentorResourceBack = document.getElementById('mentorResourceBack');
    const mentorResourceTitle = document.getElementById('mentorResourceTitle');
    const mentorResourceBody = document.getElementById('mentorResourceBody');

    // Splash screen first-view logic
    if (splashScreen && getStartedBtn) {
        // Keep splash visible (no left/top bars) until user clicks Get Started
        document.body.style.overflow = 'hidden';
        if (appContainer) appContainer.style.display = 'none';

        const startApp = () => {
            splashScreen.style.display = 'none';
            document.body.style.overflow = '';
            if (appContainer) appContainer.style.display = '';
            loadDashboard();
        };

        // Primary CTA
        getStartedBtn.addEventListener('click', startApp);

        // Fallback: allow clicking/tapping anywhere on splash to start
        splashScreen.addEventListener('click', (e) => {
            // If click is within button or elsewhere on splash, proceed
            startApp();
        });
        splashScreen.addEventListener('touchstart', (e) => {
            startApp();
        }, { passive: true });
    }

    // Global helper to wire upload buttons to open system file picker
    function bindUploadTriggers(root=document) {
        const triggers = Array.from(root.querySelectorAll('button'))
            .filter(b => /choose files|upload syllabus|upload document/i.test(b.textContent || ''));
        const uploadAreas = root.querySelectorAll('.upload-area');
        triggers.forEach(btn => {
            btn.addEventListener('click', () => {
                // Also perform Netlify upload flow when user clicks Upload Document
                if (/upload document/i.test(btn.textContent||'')) {
                    if (globalFileInput) {
                        // First open picker, then upon selection, trigger netlify upload
                        const once = (e)=>{
                            globalFileInput.removeEventListener('change', once);
                            const file = (globalFileInput.files||[])[0];
                            if (file) uploadFromInput(file);
                        };
                        globalFileInput.addEventListener('change', once);
                        globalFileInput.click();
                    }
                    return;
                }
                if (globalFileInput) globalFileInput.click();
            });
        });
        uploadAreas.forEach(area => {
            area.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    if (globalFileInput) globalFileInput.click();
                }
            });
        });
    }

    // Attach Netlify profile action to top-right user avatar click
    if (userAvatar) userAvatar.addEventListener('click', (e)=>{
        // keep dropdown behavior but also fetch profile in background
        try { callGetProfile(); } catch {}
    });

    // Netlify Identity helpers (re-added, headless)
    async function callGetProfile() {
        const netlifyIdentity = window.netlifyIdentity;
        if (!netlifyIdentity) { alert('Netlify Identity not loaded'); return; }
        const currentUser = netlifyIdentity.currentUser();
        if (!currentUser) { netlifyIdentity.open(); return; }
        try {
            const token = (await currentUser.jwt()).access_token;
            const res = await fetch('/.netlify/functions/getProfile', { headers: { 'Authorization': 'Bearer ' + token } });
            const json = await res.json();
            console.log('profile result:', json);
        } catch (e) {
            console.error('getProfile failed', e);
        }
    }
    async function uploadSyllabusViaNetlify() {
        const netlifyIdentity = window.netlifyIdentity;
        if (!netlifyIdentity) { alert('Netlify Identity not loaded'); return; }
        const files = Array.from((document.getElementById('file')||{}).files||[]);
        const f = files[0];
        if (!f) { if (globalFileInput && globalFileInput.files && globalFileInput.files[0]) { return uploadFromInput(globalFileInput.files[0]); } alert('select file'); return; }
        uploadFromInput(f);
    }
    async function uploadFromInput(f){
        const netlifyIdentity = window.netlifyIdentity;
        const currentUser = netlifyIdentity.currentUser();
        if (!currentUser) { netlifyIdentity.open(); return; }
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64 = reader.result.split(',')[1];
                const token = (await currentUser.jwt()).access_token;
                const body = { filename: f.name, contentType: f.type, dataBase64: base64 };
                const res = await fetch('/.netlify/functions/uploadSyllabus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify(body)
                });
                const j = await res.json();
                console.log('upload response', j);
            } catch (e) {
                console.error('upload failed', e);
            }
        };
        reader.readAsDataURL(f);
    }

    // Uploads persistence
    function getUploads() {
        try { return JSON.parse(localStorage.getItem('uploads')||'[]'); } catch { return []; }
    }
    function saveUpload(item) {
        const items = getUploads();
        items.unshift(item);
        localStorage.setItem('uploads', JSON.stringify(items.slice(0, 30)));
    }
    if (globalFileInput) {
        globalFileInput.addEventListener('change', (e)=>{
            const files = Array.from(e.target.files||[]);
            files.forEach(file => {
                // Create an object URL to allow opening the file in a new tab
                const url = URL.createObjectURL(file);
                saveUpload({ name: file.name, url, ts: Date.now(), size: file.size, type: file.type });
            });
            // If currently on documents page, refresh the list
            if (contentArea && contentArea.querySelector('#recentUploads')) {
                loadDocuments();
            }
        });
    }

    // Fullscreen quiz/contest flow with topic-specific complex questions and MCQ options
    const QUESTIONS = {
        quiz: Array.from({length:10}, (_,i)=>({ q: `Q${i+1}. For n≥1, ∑_{k=1}^{n} (2k-1) = ?`, options:['n(n+1)','n^2','2n-1','n!'], correct:1 })),
        contest: Array.from({length:10}, (_,i)=>({ q: `C${i+1}. Peak in unimodal array can be found in:`, options:['O(n)','O(n log n)','O(log n)','O(1)'], correct:2 })),
        algebra: [
            { q:'Solve: 2x+3=11 → x=?', options:['3','4','5','6'], correct:1 },
            { q:'Roots of x^2-5x+6=0 are:', options:['(1,6)','(2,3)','(−2,−3)','(3,4)'], correct:1 }
        ],
        history: [ { q:'Hammurabi’s Code was from:', options:['Greece','Babylon','Rome','Egypt'], correct:1 } ],
        biology: [ { q:'ATP synthase is driven by:', options:['Na+ gradient','K+ gradient','H+ gradient','Cl− gradient'], correct:2 } ],
        literature: [ { q:'Romanticism emphasizes:', options:['Reason','Emotion & nature','Industrialism','Pure logic'], correct:1 } ],
        calculus: [ { q:'d/dx (x^2) = ?', options:['2x','x','x^2','0'], correct:0 } ],
        chemistry: [ { q:'Stoichiometry deals with:', options:['Qualitative analysis','Quantitative relationships','History','Spectroscopy'], correct:1 } ],
        ai: [ { q:'Logistic regression uses which link?', options:['Identity','Logit','Probit','Poisson'], correct:1 } ]
    };
    let activeSet = 'quiz';
    let activeTitle = 'Quiz';
    let quizIndex = 0;
    let quizCorrectCount = 0;
    function openQuizFlow(title='Quiz', set='quiz') {
        activeSet = set;
        activeTitle = title || 'Quiz';
        quizIndex = 0;
        quizCorrectCount = 0;
        if (quizPageTitle) quizPageTitle.textContent = title;
        showQuizQuestion();
        if (quizPage) quizPage.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    function showQuizQuestion() {
        const list = QUESTIONS[activeSet];
        const item = list[quizIndex];
        if (quizProgress) quizProgress.textContent = `${quizIndex+1} / ${list.length}`;
        if (quizPrompt) {
            const opts = item.options ? item.options.map((o,idx)=>`<label style="display:block; margin:.35rem 0;"><input type="radio" name="quizOpt" value="${idx}"> ${o}</label>`).join('') : '';
            quizPrompt.innerHTML = `<div><p>${item.q}</p>${opts?`<div class="mcq-opts">${opts}</div>`:''}</div>`;
        }
    }
    function closeQuiz() {
        if (quizPage) quizPage.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (quizNext) {
        quizNext.addEventListener('click', () => {
            const list = QUESTIONS[activeSet];
            const item = list[quizIndex];
            if (item && item.options) {
                const sel = document.querySelector('input[name="quizOpt"]:checked');
                if (!sel) { alert('Please select an option.'); return; }
                const chosen = parseInt(sel.value,10);
                if (chosen !== item.correct) { alert('Incorrect.'); } else { quizCorrectCount++; alert('Correct!'); }
            }
            quizIndex++;
            if (quizIndex >= list.length) {
                // Save result and navigate to Overview
                const total = list.length;
                const scorePct = Math.round((quizCorrectCount / total) * 100);
                saveAssessmentResult({
                    title: activeTitle,
                    kind: activeSet,
                    correct: quizCorrectCount,
                    total,
                    score: scorePct,
                    ts: Date.now()
                });
                closeQuiz();
                loadOverview();
                setTimeout(()=>{
                    const results = document.getElementById('recentResults');
                    if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
                return;
            }
            showQuizQuestion();
        });
    }
    if (quizBack) quizBack.addEventListener('click', closeQuiz);

    // Persist assessment results in localStorage
    function getAssessmentResults() {
        try { return JSON.parse(localStorage.getItem('assessmentResults')||'[]'); } catch { return []; }
    }
    function saveAssessmentResult(result) {
        const list = getAssessmentResults();
        list.unshift(result);
        localStorage.setItem('assessmentResults', JSON.stringify(list.slice(0, 20)));
    }

    // Labs fullpage: open per-topic with large content and back arrow
    const LAB_DETAILS = {
        'Virtual Chemistry Lab: Acids & Bases': {
            title: 'Chemistry Lab: Acids & Bases',
            html: `
                <div class="card">
                    <div class="card-header"><h3>Overview</h3></div>
                    <div class="card-content">
                        Explore strong vs. weak acids/bases, titration curves, indicators, and buffer capacity. Perform virtual titrations and analyze pH changes step-by-step.
                    </div>
                </div>
                <div class="card" style="margin-top:1rem;">
                    <div class="card-header"><h3>Experiment Protocol</h3></div>
                    <div class="card-content">
                        1) Standardize NaOH with KHP. 2) Titrate acetic acid. 3) Record pH vs. volume. 4) Determine equivalence point and pKa from half-equivalence.
                    </div>
                </div>
                <div class="card" style="margin-top:1rem;">
                    <div class="card-header"><h3>Analysis & Questions</h3></div>
                    <div class="card-content">
                        Plot your data, compute buffer region slope, and discuss deviations from Henderson–Hasselbalch due to ionic strength.
                    </div>
                </div>`
        },
        'Physics: Electromagnetism Basics': {
            title: 'Physics Lab: Electromagnetism Basics',
            html: `
                <div class="card"><div class="card-header"><h3>Overview</h3></div><div class="card-content">Build series/parallel circuits, visualize magnetic field lines, and apply right-hand rules.</div></div>
                <div class="card" style="margin-top:1rem;"><div class="card-header"><h3>Activities</h3></div><div class="card-content">Measure I–V characteristics, map fields around a solenoid, and test Faraday induction with changing flux.</div></div>
                <div class="card" style="margin-top:1rem;"><div class="card-header"><h3>Analysis</h3></div><div class="card-content">Fit Ohm’s law lines, estimate permeability, and discuss energy density in magnetic fields.</div></div>`
        },
        'Biology: Cell Structure & Function': {
            title: 'Biology Lab: Cell Structure & Function',
            html: `
                <div class="card"><div class="card-header"><h3>Overview</h3></div><div class="card-content">Navigate a 3D eukaryotic cell; identify organelles and relate ultrastructure to function.</div></div>
                <div class="card" style="margin-top:1rem;"><div class="card-header"><h3>Guided Tasks</h3></div><div class="card-content">Track protein trafficking ER→Golgi→membrane; compare mitochondria vs. chloroplasts.</div></div>
                <div class="card" style="margin-top:1rem;"><div class="card-header"><h3>Questions</h3></div><div class="card-content">Predict effects of inhibited ribosomes; justify impacts on secretory pathway.</div></div>`
        },
        'Molecular Genetics Lab': {
            title: 'Molecular Genetics Lab',
            html: `<div class="card"><div class="card-header"><h3>DNA Techniques</h3></div><div class="card-content">Simulate extraction, PCR primer design, and gel electrophoresis band analysis with size ladder.</div></div>`
        },
        'Astronomy: Planetary Orbits': {
            title: 'Astronomy Lab: Planetary Orbits',
            html: `<div class="card"><div class="card-header"><h3>Kepler & Newton</h3></div><div class="card-content">Vary mass and velocity; observe elliptical orbits and relate to a^3 ∝ T^2.</div></div>`
        },
        'Robotics: Basic Programming': {
            title: 'Robotics Lab: Basic Programming',
            html: `<div class="card"><div class="card-header"><h3>Robot Control</h3></div><div class="card-content">Program joint sequences, avoid collisions, and calibrate gripper timing.</div></div>`
        },
        'Earth Science: Plate Tectonics': {
            title: 'Earth Science Lab: Plate Tectonics',
            html: `<div class="card"><div class="card-header"><h3>Plates & Boundaries</h3></div><div class="card-content">Model divergent, convergent, and transform boundaries; simulate subduction and volcanism.</div></div>`
        },
        'Neuroscience: Brain Anatomy': {
            title: 'Neuroscience Lab: Brain Anatomy',
            html: `<div class="card"><div class="card-header"><h3>CNS Overview</h3></div><div class="card-content">Identify cortical lobes, deep nuclei, and major tracts; relate lesions to deficits.</div></div>`
        },
        'Environmental Science: Ecosystem Dynamics': {
            title: 'Environmental Science Lab: Ecosystem Dynamics',
            html: `<div class="card"><div class="card-header"><h3>Populations</h3></div><div class="card-content">Simulate logistic growth, carrying capacity, and predator–prey dynamics under climate stressors.</div></div>`
        },
        'Chemical Reactions Lab': {
            title: 'Chemistry Lab: Chemical Reactions',
            html: `<div class="card"><div class="card-header"><h3>Reactions</h3></div><div class="card-content">Balance equations, predict products, and compare kinetics for temperature and catalyst changes.</div></div>`
        },
        'Optics: Light and Lenses': {
            title: 'Optics Lab: Light and Lenses',
            html: `<div class="card"><div class="card-header"><h3>Geometric Optics</h3></div><div class="card-content">Construct ray diagrams, compute focal lengths, and verify lens-maker’s equation.</div></div>`
        }
    };

    function openLabDetail(title) {
        const detail = LAB_DETAILS[title];
        if (!detail) return;
        if (labPageTitle) labPageTitle.textContent = detail.title;
        if (labBody) labBody.innerHTML = `
            ${detail.html}
            <div class="card" style="margin-top:1rem;">
                <div class="card-header"><h3>Lab Timer</h3></div>
                <div class="card-content">
                    <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
                        <span id="labTimerDisplay" style="font-weight:700; font-size:1.25rem;">00:00:00</span>
                        <button class="btn-primary" id="labTimerStart">Start</button>
                        <button class="btn-secondary" id="labTimerPause">Pause</button>
                        <button class="btn-secondary" id="labTimerReset">Reset</button>
                    </div>
                </div>
            </div>`;
        if (labPage) labPage.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Simple per-open timer controls
        let labTimer = null; let labSeconds = 0; const fmt=(s)=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;};
        const disp = document.getElementById('labTimerDisplay');
        const startBtn = document.getElementById('labTimerStart');
        const pauseBtn = document.getElementById('labTimerPause');
        const resetBtn = document.getElementById('labTimerReset');
        function tick(){ labSeconds+=1; if(disp) disp.textContent = fmt(labSeconds); }
        if (startBtn) startBtn.addEventListener('click', ()=>{ if (labTimer) return; labTimer = setInterval(tick, 1000); });
        if (pauseBtn) pauseBtn.addEventListener('click', ()=>{ if (labTimer) { clearInterval(labTimer); labTimer=null; } });
        if (resetBtn) resetBtn.addEventListener('click', ()=>{ if (labTimer) { clearInterval(labTimer); labTimer=null; } labSeconds=0; if(disp) disp.textContent='00:00:00'; });
    }
    function closeLabDetail() {
        if (labPage) labPage.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (labBack) labBack.addEventListener('click', closeLabDetail);

    // AI Mentor resource details
    const MENTOR_RESOURCES = {
        quantum_lab: {
            title: 'Quantum Physics Lab',
            html: `
                <div class="card"><div class="card-header"><h3>Overview</h3></div><div class="card-content">Walk through double-slit, superposition and measurement postulates with interactive diagrams.</div></div>
                <img src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=900&fit=crop" alt="Quantum" style="width:100%; margin-top:1rem; border-radius:8px;" />`
        },
        entanglement_video: {
            title: 'Understanding Entanglement',
            html: `<div class="card"><div class="card-header"><h3>Brief</h3></div><div class="card-content">Bell pairs, nonlocal correlations, and CHSH inequality—visual summary with frames.</div></div>
                   <img src="https://images.unsplash.com/photo-1526378722484-bd91ca387e72?w=900&fit=crop" alt="Entanglement" style="width:100%; margin-top:1rem; border-radius:8px;" />`
        },
        particle_quiz: {
            title: 'Particle Interactions Quiz',
            html: `<div class="card"><div class="card-header"><h3>About</h3></div><div class="card-content">Short MCQ set on leptons, bosons, and conservation laws.</div></div>`
        },
        ai_foundations: {
            title: 'Foundations of AI',
            html: `<div class="card"><div class="card-header"><h3>Overview</h3></div><div class="card-content">History from logicism to deep learning; search, planning, probability, and learning paradigms.</div></div>
                   <img src="https://images.unsplash.com/photo-1555255707-c07966088b7b?w=900&fit=crop" alt="AI" style="width:100%; margin-top:1rem; border-radius:8px;" />`
        },
        advanced_algorithms: {
            title: 'Advanced Algorithms',
            html: `<div class="card"><div class="card-header"><h3>Topics</h3></div><div class="card-content">Flow, matching, NP-completeness, approximation, randomized algorithms, amortized analysis.</div></div>`
        },
        daily_learning: {
            title: 'Daily Learning Detail',
            html: `<div class="card"><div class="card-header"><h3>Weekly Breakdown</h3></div><div class="card-content">See detailed activity, time spent, and suggested next steps based on your week.</div></div>
                   <img src="https://images.unsplash.com/photo-1518085250887-2f903c200fee?w=900&fit=crop" alt="Daily Learning" style="width:100%; margin-top:1rem; border-radius:8px;" />`
        }
    };
    function openMentorResource(key){
        const r = MENTOR_RESOURCES[key]; if (!r) return;
        if (mentorResourceTitle) mentorResourceTitle.textContent = r.title;
        if (mentorResourceBody) mentorResourceBody.innerHTML = r.html;
        if (mentorResourcePage) mentorResourcePage.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    function closeMentorResource(){ if (mentorResourcePage) mentorResourcePage.style.display='none'; document.body.style.overflow=''; }
    if (mentorResourceBack) mentorResourceBack.addEventListener('click', closeMentorResource);

    // Dedicated mentor chat fullpage with save-to-file
    function openMentorChat(key='mentor', displayName='Mentor') {
        if (!mentorResourcePage) return;
        if (mentorResourceTitle) mentorResourceTitle.textContent = displayName;
        if (mentorResourceBody) mentorResourceBody.innerHTML = `
            <div class="card"><div class="card-header"><h3>Chat with ${displayName}</h3></div>
            <div class="card-content">
                <div id="mentorChatThread" style="height:320px; overflow:auto; border:1px solid #e2e8f0; border-radius:8px; padding:.75rem; background:#f8fafc; margin-bottom:.75rem;"></div>
                <div style="display:flex; gap:.5rem; align-items:center;">
                    <input id="mentorChatInput" type="text" placeholder="Type your message..." style="flex:1; padding:.6rem; border:1px solid #e2e8f0; border-radius:8px;">
                    <button class="btn-primary" id="mentorChatSend">Send</button>
                    <button class="btn-secondary" id="mentorChatSave">Save Chat</button>
                </div>
            </div></div>`;
        mentorResourcePage.style.display='flex';
        document.body.style.overflow='hidden';
        const storeKey = `mentor_chat_${key}`;
        function read(){ try { return JSON.parse(localStorage.getItem(storeKey)||'[]'); } catch { return []; } }
        function write(v){ localStorage.setItem(storeKey, JSON.stringify(v)); }
        const thread = document.getElementById('mentorChatThread');
        const input = document.getElementById('mentorChatInput');
        const send = document.getElementById('mentorChatSend');
        const saveBtn = document.getElementById('mentorChatSave');
        function render(){
            const msgs = read();
            thread.innerHTML = msgs.map(m=>`<div style="margin:.35rem 0;${m.who==='you'?'text-align:right;':''}"><span style="display:inline-block; background:${m.who==='you'?'#3B82F6':'#e5e7eb'}; color:${m.who==='you'?'#fff':'#111827'}; padding:.4rem .6rem; border-radius:12px; max-width:70%;">${m.text}</span></div>`).join('');
            thread.scrollTop = thread.scrollHeight;
        }
        function push(text, who='you'){ const msgs = read(); msgs.push({text, who, at: Date.now()}); write(msgs); render(); }
        render();
        if (send) send.addEventListener('click', ()=>{ const v=(input.value||'').trim(); if(!v) return; push(v,'you'); input.value=''; setTimeout(()=> push('Thanks! I will review and respond soon.','mentor'), 500); });
        if (input) input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); send.click(); } });
        if (saveBtn) saveBtn.addEventListener('click', ()=>{
            const msgs = read();
            const text = msgs.map(m=>`[${new Date(m.at).toISOString()}] ${m.who.toUpperCase()}: ${m.text}`).join('\n');
            const blob = new Blob([text], {type:'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${displayName.replace(/\s+/g,'_').toLowerCase()}_chat.txt`;
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        });
    }

    // Sidebar toggle functionality
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        if (sidebar.classList.contains('collapsed')) {
            sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
            if (sidebarFab) sidebarFab.classList.add('show');
        } else {
            sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
            if (sidebarFab) sidebarFab.classList.remove('show');
        }
    });
    if (sidebarFab) {
        sidebarFab.addEventListener('click', ()=>{
            sidebar.classList.remove('collapsed');
            sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
            sidebarFab.classList.remove('show');
        });
    }
    
    // User profile dropdown functionality
userAvatar.addEventListener('click', function(e) {
    e.stopPropagation();
    
    if (!isLoggedIn()) {
        showAuthModal(); // Show login if not logged in
        return;
    }
    
    profileDropdown.classList.toggle('show');
});
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userAvatar.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });
    // Notifications fullpage
    function openNotifications() {
        const COMPETITION_FEED = [
            { title: 'State-Level Hackathon (Tech Univ)', body: '48-hour coding marathon. Teams of 3-4. Registration closes in 5 days.' },
            { title: 'National Math Olympiad (Inter-College)', body: 'Prelims start next month. Syllabus: Algebra, Number Theory, Combinatorics.' },
            { title: 'AI Innovation Challenge (State)', body: 'Build an ML prototype for social good. Demo Day on campus hub.' },
            { title: 'Robotics League Nationals', body: 'Qualifiers hosted across major colleges. Mechanical + software event.' }
        ];
        const stored = JSON.parse(localStorage.getItem('notifications')||'[]');
        // Merge static competition feed with stored notifications without duplicating by title
        const byTitle = new Map();
        [...stored, ...COMPETITION_FEED].forEach(n=>{ if (n && n.title) byTitle.set(n.title, n); });
        const items = Array.from(byTitle.values());
        const html = items.length ? items.map(n=>`
            <div class="card" style="margin-bottom: 1rem;">
                <div class="card-header"><div class="card-title">${n.title}</div></div>
                <div class="card-content">${n.body}</div>
            </div>`).join('') : '<p>No new notifications.</p>';
        if (notificationsBody) notificationsBody.innerHTML = html;
        if (notificationsPage) notificationsPage.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    function closeNotifications() {
        if (notificationsPage) notificationsPage.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (notificationsBtn) notificationsBtn.addEventListener('click', openNotifications);
    if (notificationsBack) notificationsBack.addEventListener('click', closeNotifications);

    // Seed example notifications if none exist (kept lightweight; competition feed is merged on open)
    if (!localStorage.getItem('notifications')) {
        localStorage.setItem('notifications', JSON.stringify([
            { title: 'New Math Contest this Friday', body: 'Join the Algebra Sprint at 5 PM. Limited seats available.' },
            { title: 'New Quiz: Calculus Derivatives', body: 'Sharpen your skills with 15 challenging derivative problems.' },
            { title: 'Lab Update', body: 'Electromagnetism lab now includes Faraday induction experiments.' }
        ]));
    }

    // Notes fullpage helpers
    function openNotesList(kind) {
        const all = JSON.parse(localStorage.getItem('notes')||'[]');
        let items = all;
        if (kind==='Notes') items = all.filter(n=> n.type==='note');
        if (kind==='To-Dos') items = all.filter(n=> n.type==='todo' && !n.completed);
        if (kind==='Completed') items = all.filter(n=> n.completed);
        if (notesPageTitle) notesPageTitle.textContent = kind;
        const container = notesPageBody || notesBody;
        if (container) {
            const composeHeader = kind==='All' ? 'Quick Add' : (`Add to ${kind}`);
            const isTodo = kind==='To-Dos' || kind==='Completed';
            const completedDefault = kind==='Completed';
            // If no items for that filter today, show last items to avoid an empty feel
            const safeItems = items.length ? items : all.slice(0,3);
            const listHtml = safeItems.length ? safeItems.map(n=>`
                <div class="card" style="margin-bottom:1rem; cursor:pointer;" data-id="${n.id}">
                    <div class="card-header"><div class="card-title">${n.title||'(Untitled)'} — <small>${n.priority||''}</small></div></div>
                    <div class="card-content">${(n.content||'').slice(0,160)}${(n.content||'').length>160?'…':''}</div>
                </div>`).join('') : '<p>No items yet.</p>';
            container.innerHTML = `
                <div class="card" style="margin-bottom:1rem;">
                    <div class="card-header"><div class="card-title">${composeHeader}</div></div>
                    <div class="card-content">
                        <div style="display:flex; flex-direction:column; gap:.5rem;">
                            <input type="text" id="notesComposeTitle" placeholder="Title..." class="note-title-input">
                            <textarea id="notesComposeBody" placeholder="Write here..." class="note-content-input"></textarea>
                            <div style="display:flex; gap:.5rem; align-items:center; flex-wrap:wrap;">
                                <select id="notesComposePriority" class="priority-select">
                                    <option>Select Priority</option>
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                </select>
                                ${isTodo ? `<label style="display:inline-flex; align-items:center; gap:.4rem;"><input type="checkbox" id="notesComposeCompleted" ${completedDefault?'checked':''}> Mark as completed</label>` : ''}
                                <button class="btn-primary" id="notesComposeSave">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
                ${listHtml}
            `;
            // Save handler
            const saveBtn = document.getElementById('notesComposeSave');
            if (saveBtn) {
                saveBtn.addEventListener('click', ()=>{
                    const title = (document.getElementById('notesComposeTitle')||{}).value?.trim()||'';
                    const content = (document.getElementById('notesComposeBody')||{}).value?.trim()||'';
                    const prSel = (document.getElementById('notesComposePriority')||{}).value||'Low';
                    const completed = isTodo ? !!(document.getElementById('notesComposeCompleted')||{}).checked : false;
                    if (!title && !content) { alert('Please write something to save.'); return; }
                    const list = JSON.parse(localStorage.getItem('notes')||'[]');
                    list.unshift({
                        id: 'n_'+Date.now(),
                        title,
                        content,
                        priority: ['High','Medium','Low'].includes(prSel)? prSel : 'Low',
                        date: Date.now(),
                        type: isTodo ? 'todo' : (kind==='Notes' ? 'note' : 'note'),
                        completed: isTodo ? completed : false
                    });
                    localStorage.setItem('notes', JSON.stringify(list));
                    // Refresh main Notes page grid if present
                    try { loadNotes(); } catch {}
                    // Keep the fullpage open but clear inputs
                    const t = document.getElementById('notesComposeTitle'); if (t) t.value='';
                    const b = document.getElementById('notesComposeBody'); if (b) b.value='';
                    const p = document.getElementById('notesComposePriority'); if (p) p.value='Select Priority';
                    const c = document.getElementById('notesComposeCompleted'); if (c) c.checked = completedDefault;
                    // Re-render the list segment
                    openNotesList(kind);
                    alert('Saved. Find it under Your Personal Notes.');
                });
            }
            // open detail on click
            container.querySelectorAll('[data-id]').forEach(card=>{
                card.addEventListener('click', ()=> openNoteDetail(card.getAttribute('data-id')));
            });
            // Improve UX: focus input for immediate typing
            const focusTarget = document.getElementById('notesComposeTitle') || document.getElementById('notesComposeBody');
            if (focusTarget) focusTarget.focus();
        }
        // Show the correct fullpage container even with duplicate IDs
        const fp = (notesPageBody && notesPageBody.closest('.fullpage')) || notesPage;
        if (fp) fp.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    function openNoteDetail(id){
        const all = JSON.parse(localStorage.getItem('notes')||'[]');
        const n = all.find(x=>x.id===id); if (!n) return;
        if (notesPageTitle) notesPageTitle.textContent = n.title||'Note';
        const pr = n.priority||'Low'; const prCls = pr==='High'?'high':pr==='Medium'?'medium':'low';
        if (notesPageBody) notesPageBody.innerHTML = `
            <div class="note-card">
                <div class="note-header"><h3>${n.title||'(Untitled)'}</h3><span class="priority-tag ${prCls}">${pr} Priority</span></div>
                <p class="note-date">${new Date(n.date).toISOString().slice(0,10)}</p>
                <p class="note-content">${n.content||''}</p>
            </div>`;
    }
    function closeNotes(){ if (notesPage) notesPage.style.display='none'; document.body.style.overflow=''; }
    if (notesBack) notesBack.addEventListener('click', closeNotes);
    // Ensure any back arrow inside a fullpage closes its own panel (handles duplicate IDs)
    Array.from(document.querySelectorAll('.fullpage .back-btn')).forEach(btn=>{
        btn.addEventListener('click', (e)=>{
            const fp = btn.closest('.fullpage');
            if (fp) { fp.style.display='none'; document.body.style.overflow=''; }
            e.stopPropagation();
        });
    });
    
// Profile dropdown actions
profileDropdown.addEventListener('click', function(e) {
    const action = e.target.closest('.profile-action');
    if (!action) return;
    
    const label = action.querySelector('span') ? action.querySelector('span').textContent.trim().toLowerCase() : '';
    
    if (label === 'profile') {
        handleNavigation('profile-view');
    } else if (label === 'settings') {
        handleNavigation('settings');
    } else if (label === 'logout') {
        logout();
    }
    
    profileDropdown.classList.remove('show');
    e.preventDefault();
    e.stopPropagation();
});
    
    // Floating Ask AI button functionality -> open floating chat panel
    floatingAskAI.addEventListener('click', function() {
        if (aiChatPanel) {
            aiChatPanel.classList.add('open');
            aiChatPanel.setAttribute('aria-hidden', 'false');
            if (aiChatInput) aiChatInput.focus();
        }
    });
    if (aiChatClose) {
        aiChatClose.addEventListener('click', ()=>{
            aiChatPanel.classList.remove('open');
            aiChatPanel.setAttribute('aria-hidden', 'true');
        });
    }
    if (aiChatSend && aiChatInput && aiChatBody) {
        const sendAiMessage = ()=>{
            const text = aiChatInput.value.trim();
            if (!text) return;
            const userMsg = document.createElement('div');
            userMsg.className = 'message user-message';
            userMsg.innerHTML = `
                <div class="message-avatar"><i class="fas fa-user"></i></div>
                <div class="message-content"><p>${text}</p></div>
            `;
            aiChatBody.appendChild(userMsg);
            aiChatInput.value = '';
            aiChatBody.scrollTop = aiChatBody.scrollHeight;
            setTimeout(()=>{
                const aiMsg = document.createElement('div');
                aiMsg.className = 'message ai-message';
                aiMsg.innerHTML = `
                    <div class="message-avatar"><i class="fas fa-robot"></i></div>
                    <div class="message-content"><p>Thanks! Here's a helpful tip: break problems into smaller steps and tackle them one by one.</p></div>
                `;
                aiChatBody.appendChild(aiMsg);
                aiChatBody.scrollTop = aiChatBody.scrollHeight;
            }, 700);
        };
        aiChatSend.addEventListener('click', sendAiMessage);
        aiChatInput.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') sendAiMessage(); });
    }
    
    // Sidebar navigation functionality
    const sidebarItems = document.querySelectorAll('.progress-item, .action-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page) {
                // Remove active class from all sidebar items
                sidebarItems.forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                this.classList.add('active');
                
                // Handle navigation
                handleSidebarNavigation(page);
            }
        });
    });
    
    // Navigation click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Get the target section
            const target = this.getAttribute('href').substring(1);
            
            // Handle different sections
            handleNavigation(target);
        });
    });
    
    // Show splash first; dashboard will be loaded after Get Started
    if (!splashScreen) loadDashboard();

    // Simple profile storage helpers
    function getStoredProfile() {
        try { return JSON.parse(localStorage.getItem('studentProfile') || '{}'); } catch { return {}; }
    }
    function saveStoredProfile(profile) {
        localStorage.setItem('studentProfile', JSON.stringify(profile));
    }
    
    // Handle sidebar navigation
    function handleSidebarNavigation(page) {
        switch(page) {
            case 'streaks':
                loadStreaks();
                break;
            case 'badges':
                loadBadges();
                break;
            case 'syllabus':
                loadSyllabus();
                break;
            case 'portfolio':
                loadPortfolio();
                break;
            case 'documents':
                loadDocuments();
                break;
            case 'notes':
                loadNotes();
                break;
            case 'overview':
                loadOverview();
                break;
            case 'settings':
                loadSettings();
                break;
        }
    }
    
    // Handle navigation to different sections
    function handleNavigation(section) {
        // Show/hide floating Ask AI button
        if (section === 'quizzes' || section === 'contests') {
            floatingAskAI.classList.add('hidden');
        } else {
            floatingAskAI.classList.remove('hidden');
        }
        if (section === 'profile-view') { loadProfileView(); return; }
        switch(section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'documents':
                loadDocuments();
                break;
            case 'ai-mentor':
                loadAIMentor();
                break;
            case 'quizzes':
                loadQuizzes();
                break;
            case 'focus':
                loadFocus();
                break;
            case 'labs':
                loadLabs();
                break;
            case 'social':
                loadSocial();
                break;
            case 'notes':
                loadNotes();
                break;
        }
    }
    
    // Dashboard Page
    function loadDashboard() {
        const user = isLoggedIn() ? getCurrentUser() : null;
const welcomeMessage = user ? `Welcome Back, ${user.username}!` : 'Welcome to NextHorizon!';
const loginPrompt = user ? '' : '<p style="text-align: center; margin-top: 1rem;"><a href="#" onclick="showAuthModal()" style="color: #3B82F6;">Login to save your progress</a></p>';

contentArea.innerHTML = `
    <div class="dashboard-header">
        <h1 class="dashboard-title">${welcomeMessage}</h1>
        ${loginPrompt}
    </div>
            
            <div class="dashboard-carousel" id="dashboardCarousel">
                <div class="carousel-track">
                    <div class="carousel-slide active" style="background-image: url('https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=1600&auto=format&fit=crop'); background-size: cover; background-position: center;">
                        <div class="slide-content">
                            <h3>Boost your streak today</h3>
                            <p>Complete a quick focus session to keep momentum.</p>
                            <button class="btn-secondary">Start Focus</button>
                        </div>
                    </div>
                    <div class="carousel-slide" style="background-image: url('https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1600&auto=format&fit=crop'); background-size: cover; background-position: center;">
                        <div class="slide-content">
                            <h3>Contests this week</h3>
                            <p>Join coding and math contests to climb the leaderboard.</p>
                            <button class="btn-secondary">View Contests</button>
                        </div>
                    </div>
                    <div class="carousel-slide" style="background-image: url('https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=1600&auto=format&fit=crop'); background-size: cover; background-position: center;">
                        <div class="slide-content">
                            <h3>Leaderboard highlights</h3>
                            <p>You are 3rd with 1,980 XP. Keep going to take the lead!</p>
                            <button class="btn-secondary">Open Leaderboard</button>
                        </div>
                    </div>
                </div>
                <div class="carousel-dots"></div>
            </div>
            
            <div class="journey-section">
                <h2 class="section-title">Your Journey</h2>
                <div class="journey-cards">
                    <div class="journey-card">
                        <div class="card-icon target">
                            <i class="fas fa-bullseye"></i>
                        </div>
                        <div class="card-number">3</div>
                        <div class="card-title">Current Goals</div>
                        <button class="card-button">View Details</button>
                    </div>
                    <div class="journey-card">
                        <div class="card-icon sparkle">
                            <i class="fas fa-sparkles"></i>
                        </div>
                        <div class="card-number">5</div>
                        <div class="card-title">New Challenges</div>
                        <button class="card-button">Explore Challenges</button>
                    </div>
                    <div class="journey-card">
                        <div class="card-icon trophy">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="card-number">2</div>
                        <div class="card-title">Ongoing Contests</div>
                        <button class="card-button">Join Contest</button>
                    </div>
                </div>
            </div>
            
            <div class="journey-section">
                <h2 class="section-title">Continue Learning</h2>
                <div class="learning-cards">
                    <div class="learning-card">
                        <div class="learning-card-header">
                            <div class="learning-card-icon chat">
                                <i class="fas fa-comments"></i>
                            </div>
                            <h3 class="learning-card-title">AI Mentor Session</h3>
                        </div>
                        <p class="learning-card-description">Dive into an interactive Q&A or Socratic dialogue with your personal AI tutor.</p>
                        <button class="learning-card-button">Chat Now</button>
                    </div>
                    <div class="learning-card">
                        <div class="learning-card-header">
                            <div class="learning-card-icon book">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <h3 class="learning-card-title">Latest Quizzes</h3>
                        </div>
                        <p class="learning-card-description">Test your knowledge on recent topics and track your improvements instantly.</p>
                        <button class="learning-card-button">Take Quiz</button>
                    </div>
                    <div class="learning-card">
                        <div class="learning-card-header">
                            <div class="learning-card-icon lab">
                                <i class="fas fa-flask"></i>
                            </div>
                            <h3 class="learning-card-title">Explore 3D Labs</h3>
                        </div>
                        <p class="learning-card-description">Engage with immersive simulations and virtual experiments. Bring theory to life!</p>
                        <button class="learning-card-button">Launch Lab</button>
                    </div>
                </div>
            </div>
            
            <div class="progress-overview">
                <h2 class="section-title">Your Progress Overview</h2>
                <div class="progress-cards">
                    <div class="progress-card">
                        <div class="progress-card-icon blue">
                            <i class="fas fa-calculator"></i>
                        </div>
                        <div class="progress-card-content">
                            <h3 class="progress-card-title">Complete Calculus Module</h3>
                            <p class="progress-card-description">Finish all lessons and quizzes in the Advanced Calculus module.</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 75%"></div>
                            </div>
                            <button class="progress-card-button">Continue Learning</button>
                        </div>
                    </div>
                    <div class="progress-card">
                        <div class="progress-card-icon green">
                            <i class="fas fa-code"></i>
                        </div>
                        <div class="progress-card-content">
                            <h3 class="progress-card-title">Master Python Basics</h3>
                            <p class="progress-card-description">Complete the introductory Python programming course.</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 50%"></div>
                            </div>
                            <button class="progress-card-button">Resume Course</button>
                        </div>
                    </div>
                    <div class="progress-card">
                        <div class="progress-card-icon yellow">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="progress-card-content">
                            <h3 class="progress-card-title">Read 5 Research Papers</h3>
                            <p class="progress-card-description">Dive deeper into quantum computing concepts.</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 20%"></div>
                            </div>
                            <button class="progress-card-button">Find Papers</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="recent-activity">
                <h2 class="section-title">Recent Activity</h2>
                <div class="activity-grid">
                    <div class="activity-item">
                        <div class="activity-icon blue">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">Completed 'Algebra I Quiz'</div>
                            <div class="activity-time">2 hours ago</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon green">
                            <i class="fas fa-upload"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">Uploaded 'History_Notes.pdf'</div>
                            <div class="activity-time">Yesterday</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon green">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">Explored 'Virtual Human Anatomy Lab'</div>
                            <div class="activity-time">3 days ago</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon yellow">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">Set new goal: 'Prepare for Midterms'</div>
                            <div class="activity-time">4 days ago</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon blue">
                            <i class="fas fa-comments"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">Chatted with AI Mentor about 'Thermodynamics'</div>
                            <div class="activity-time">2 days ago</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        // Initialize carousel behaviour
        setupCarousel('dashboardCarousel');

        // Wire carousel buttons to requested pages
        const slidesRoot = document.getElementById('dashboardCarousel');
        if (slidesRoot) {
            const btns = Array.from(slidesRoot.querySelectorAll('.carousel-slide .btn-secondary'));
            btns.forEach(btn => {
                const label = btn.textContent.trim().toLowerCase();
                if (label.includes('start focus')) {
                    btn.addEventListener('click', ()=> handleNavigation('focus'));
                } else if (label.includes('view contests')) {
                    btn.addEventListener('click', ()=> openQuizFlow('Contest Practice','contest'));
                } else if (label.includes('open leaderboard')) {
                    btn.addEventListener('click', ()=> {
                        // Open overview and scroll to leaderboard card
                        loadOverview();
                        setTimeout(()=>{
                            const lb = document.querySelector('.overview-card.leaderboard');
                            if (lb) lb.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                    });
                }
            });
        }

        // Hook dashboard CTA buttons for quizzes/contests and new fullpages
        document.querySelectorAll('.journey-card .card-button, .learning-card-button').forEach(btn=>{
            const txt = (btn.textContent||'').toLowerCase();
            if (txt.includes('join contest')) {
                btn.addEventListener('click', ()=> openQuizFlow('Contest Practice','contest'));
            } else if (txt.includes('take quiz')) {
                btn.addEventListener('click', ()=> openQuizFlow('Quiz','quiz'));
            } else if (txt.includes('view details')) {
                btn.addEventListener('click', ()=> openDashList('Current Goals'));
            } else if (txt.includes('explore challenges')) {
                btn.addEventListener('click', ()=> openDashList('Upcoming Challenges'));
            } else if (txt.includes('chat now')) {
                btn.addEventListener('click', ()=> handleNavigation('ai-mentor'));
            } else if (txt.includes('launch lab')) {
                btn.addEventListener('click', ()=> handleNavigation('labs'));
            }
        });
        // Bind upload triggers globally in case upload UI appears
        bindUploadTriggers(contentArea);
    }

    // Simple auto-rotating carousel
    function setupCarousel(id) {
        const root = document.getElementById(id);
        if (!root) return;
        const slides = Array.from(root.querySelectorAll('.carousel-slide'));
        const dotsWrap = root.querySelector('.carousel-dots');
        let index = 0;
        let timer = null;

        // Build dots
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => go(i));
            dotsWrap.appendChild(dot);
        });
        const dots = Array.from(dotsWrap.querySelectorAll('.dot'));

        function show(i) {
            slides.forEach((s, si) => s.classList.toggle('active', si === i));
            dots.forEach((d, di) => d.classList.toggle('active', di === i));
        }

        function next() { index = (index + 1) % slides.length; show(index); }
        function go(i) { index = i; show(index); reset(); }

        function start() { timer = setInterval(next, 4000); }
        function stop() { if (timer) clearInterval(timer); }
        function reset() { stop(); start(); }

        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);

        start();
    }
    
    // Documents Page
    function loadDocuments() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Upload Syllabus</h1>
            </div>
            
            <div class="card">
                <div class="upload-area">
                    <div class="upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <h3>Upload Your Syllabus or Documents</h3>
                    <p>Drag and drop your files here, or click to browse</p>
                    <button class="btn-primary">Choose Files</button>
                </div>
            </div>
            
            <div class="action-cards">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-graduation-cap"></i>
                        <h3 class="card-title">Syllabus Upload</h3>
                    </div>
                    <p class="card-content">Upload your course syllabus to get AI-generated study plans, quiz recommendations, and personalized learning paths.</p>
                    <button class="btn-primary">Upload Syllabus</button>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-file-alt"></i>
                        <h3 class="card-title">Document Analysis</h3>
                    </div>
                    <p class="card-content">Upload any document for AI-powered analysis, quiz generation, and learning recommendations.</p>
                    <button class="btn-secondary">Upload Document</button>
                </div>
            </div>
            
            <div class="recent-uploads">
                <h2 class="section-title">Recent Uploads</h2>
                <div class="upload-list" id="recentUploads"></div>
            </div>
        `;
        bindUploadTriggers(contentArea);
        // Render dynamic uploads
        const uploadsHost = document.getElementById('recentUploads');
        if (uploadsHost) {
            const items = getUploads();
            uploadsHost.innerHTML = items.length ? items.slice(0,10).map(u=>`
                <div class="upload-item">
                    <i class="fas fa-file-alt"></i>
                    <div class="upload-info">
                        <h4>${u.name}</h4>
                        <p>Uploaded ${new Date(u.ts).toLocaleString()}</p>
                    </div>
                    <div class="upload-actions">
                        <a href="${u.url}" target="_blank" rel="noopener" title="Open"><i class="fas fa-external-link-alt"></i></a>
                    </div>
                </div>
            `).join('') : '<p style="color:#64748b">No uploads yet. Click Upload Document to add your syllabus.</p>';
        }
    }
    
    // AI Mentor Page
    function loadAIMentor() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">AI Mentor Chat</h1>
                <p class="page-subtitle">Engage in Socratic or Q&A learning</p>
            </div>
            
            <div class="ai-mentor-container">
                <div class="chat-section">
                    <div class="mode-toggle">
                        <button class="mode-btn active">Socratic</button>
                        <button class="mode-btn">Q&A</button>
                    </div>
                    
                    <div class="chat-messages">
                        <div class="message ai-message">
                            <div class="message-avatar">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="message-content">
                                <p>Hello! I'm your AI Mentor. How can I assist you with your learning today? We can explore topics in a Socratic style or a direct Q&A.</p>
                                <span class="message-time">10:00 AM</span>
                            </div>
                        </div>
                        
                        <div class="message user-message">
                            <div class="message-content">
                                <p>Hi! I'm struggling with the concept of quantum entanglement. Can you explain it in a Socratic way?</p>
                                <span class="message-time">10:05 AM</span>
                            </div>
                            <div class="message-avatar">
                                <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" alt="User">
                            </div>
                        </div>
                        
                        <div class="message ai-message">
                            <div class="message-avatar">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="message-content">
                                <p>Excellent question! Before we dive in, what are your initial thoughts on what 'entanglement' might mean in a scientific context?</p>
                                <span class="message-time">10:06 AM</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chat-input">
                        <i class="fas fa-paperclip"></i>
                        <input type="text" placeholder="Type your message..." class="mentor-input">
                        <i class="fas fa-microphone"></i>
                        <button class="btn-primary mentor-send">Send</button>
                    </div>
                </div>
                
                <div class="suggestions-section">
                    <h3>AI Suggested Resources</h3>
                    <p>Tailored for your learning journey</p>
                    
                    <div class="resource-cards">
                        <div class="resource-card">
                            <i class="fas fa-atom"></i>
                            <h4>Quantum Physics Lab</h4>
                            <p>Explore the basics of quantum mechanics in a virtual 3D lab environment.</p>
                            <button class="btn-secondary" data-resource="quantum_lab">Explore</button>
                        </div>
                        
                        <div class="resource-card">
                            <i class="fas fa-play"></i>
                            <h4>Understanding Entanglement</h4>
                            <p>Watch a simplified video explanation of quantum entanglement and its implications.</p>
                            <button class="btn-secondary" data-resource="entanglement_video">Explore</button>
                        </div>
                        
                        <div class="resource-card">
                            <i class="fas fa-question-circle"></i>
                            <h4>Particle Interactions Quiz</h4>
                            <p>Test your knowledge on particle physics and quantum interactions with this quiz.</p>
                            <button class="btn-secondary" data-resource="particle_quiz">Explore</button>
                        </div>
                        
                        <div class="resource-card">
                            <i class="fas fa-brain"></i>
                            <h4>Foundations of AI</h4>
                            <p>Dive into the core principles and historical milestones of artificial intelligence.</p>
                            <button class="btn-secondary" data-resource="ai_foundations">Explore</button>
                        </div>
                        
                        <div class="resource-card">
                            <i class="fas fa-gem"></i>
                            <h4>Advanced Algorithms</h4>
                            <p>Learn about complex algorithms and their applications in various computational problems.</p>
                            <button class="btn-secondary" data-resource="advanced_algorithms">Explore</button>
                        </div>
                    </div>
                    
                    <div class="progress-chart" id="dailyLearningChart">
                        <h4>Daily Learning Progress</h4>
                        <p>Your activity over the last week</p>
                        <div class="chart-placeholder">
                            <div class="chart-bars">
                                <div class="bar" style="height: 60%"></div>
                                <div class="bar" style="height: 80%"></div>
                                <div class="bar" style="height: 40%"></div>
                                <div class="bar" style="height: 90%"></div>
                                <div class="bar" style="height: 70%"></div>
                                <div class="bar" style="height: 85%"></div>
                                <div class="bar" style="height: 95%"></div>
                            </div>
                            <div class="chart-labels">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                            </div>
                        </div>
                    </div>
                    <div class="progress-chart" id="aiPerformanceInsights" style="margin-top:1rem;">
                        <h4>Performance Analysis & Study Plan</h4>
                        <div id="aiAnalysisText" style="color:#0f172a; line-height:1.6;">
                        </div>
                    </div>
                </div>
            </div>
        `;
        bindUploadTriggers(contentArea);

        // Chat mode toggle and simple responder
        const modeBtns = Array.from(contentArea.querySelectorAll('.mode-btn'));
        const messages = contentArea.querySelector('.chat-messages');
        const input = contentArea.querySelector('.mentor-input');
        const sendBtn = contentArea.querySelector('.mentor-send');
        let mode = 'Socratic';
        modeBtns.forEach((b,i)=> b.addEventListener('click', ()=>{
            modeBtns.forEach(x=> x.classList.remove('active'));
            b.classList.add('active');
            mode = b.textContent.trim();
        }));
        function appendMessage(text, who='user'){
            const wrap = document.createElement('div');
            wrap.className = 'message'+(who==='user'?' user-message':' ai-message');
            wrap.innerHTML = who==='user'
                ? `<div class="message-content"><p>${text}</p><span class="message-time">now</span></div><div class="message-avatar"><img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" alt="You"></div>`
                : `<div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><p>${text}</p><span class="message-time">now</span></div>`;
            messages.appendChild(wrap); messages.scrollTop = messages.scrollHeight;
        }
        function aiReply(prompt){
            if (mode==='Q&A') {
                appendMessage(`Answer: ${prompt} → Think about definitions, key steps, and final result.`, 'ai');
            } else {
                appendMessage(`Socratic: What do you already know about “${prompt}”? Why might that be relevant?`, 'ai');
            }
        }
        if (sendBtn) sendBtn.addEventListener('click', ()=>{ const v = input.value.trim(); if(!v) return; appendMessage(v,'user'); input.value=''; setTimeout(()=> aiReply(v), 500); });

        // Resource Explore fullpage
        const resBtns = Array.from(contentArea.querySelectorAll('button[data-resource]'));
        resBtns.forEach(btn => btn.addEventListener('click', ()=>{
            const key = btn.getAttribute('data-resource');
            openMentorResource(key);
        }));

        // Daily learning detail
        const daily = contentArea.querySelector('#dailyLearningChart');
        if (daily) daily.addEventListener('click', ()=> openMentorResource('daily_learning'));

        // Build simple analysis and plan from recent results
        const analysisHost = contentArea.querySelector('#aiAnalysisText');
        if (analysisHost) {
            const results = getAssessmentResults();
            if (!results.length) {
                analysisHost.innerHTML = '<p>No recent assessments yet. Take a quiz or contest to receive tailored analysis and a study plan here.</p>';
            } else {
                const last5 = results.slice(0,5);
                const avg = Math.round(last5.reduce((a,b)=>a+b.score,0)/last5.length);
                const weak = last5.filter(r=>r.score<70).map(r=>r.title);
                const trend = last5[0] && last5[last5.length-1] ? (last5[0].score - last5[last5.length-1].score >= 5 ? 'improving' : (last5[last5.length-1].score - last5[0].score >= 5 ? 'declining' : 'stable')) : 'stable';
                analysisHost.innerHTML = `
                    <p><strong>Summary:</strong> Your recent average score is <strong>${avg}%</strong> across ${last5.length} assessments and your trend looks <strong>${trend}</strong>.</p>
                    ${weak.length?`<p><strong>Focus areas:</strong> ${weak.join(', ')}.</p>`:''}
                    <p><strong>Next 7‑day plan:</strong></p>
                    <ul style="margin-left:1rem;">
                        <li>Day 1–2: Review mistakes from your latest attempts; rework incorrect questions.</li>
                        <li>Day 3–4: Target weak topics with 2 short practice sets daily (10–15 mins each).</li>
                        <li>Day 5: Take a mixed quiz; aim for +10% over last score.</li>
                        <li>Day 6: Summarize key formulas/ideas into a one‑page note.</li>
                        <li>Day 7: Full practice quiz/contest; compare to baseline.</li>
                    </ul>
                `;
            }
        }
    }
    
    // Quizzes Page
    function loadQuizzes() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Quizzes</h1>
            </div>
            
            <div class="quiz-section">
                <div class="quiz-section-header">
                    <i class="fas fa-graduation-cap"></i>
                    <h2>On-Demand Quizzes</h2>
                </div>
                <p>Explore our curated collection of quizzes across various subjects.</p>
                
                <div class="quiz-grid">
                    <div class="quiz-card">
                        <div class="quiz-image">
                            <img src="https://images.unsplash.com/photo-1509228468518-180ad4862e4d?w=300&h=200&fit=crop" alt="Algebra" onerror="this.src='https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop'">
                        </div>
                        <div class="quiz-content">
                            <h3>Algebra Fundamentals</h3>
                            <p>Test your basic algebraic knowledge including equations, inequalities, and functions.</p>
                            <div class="quiz-meta">
                                <span class="difficulty easy">Easy</span>
                                <span class="duration">20 min</span>
                                <span class="score">Last Score: 92%</span>
                            </div>
                            <button class="btn-primary" data-topic="algebra">Take Quiz</button>
                        </div>
                    </div>
                    
                    <div class="quiz-card">
                        <div class="quiz-image">
                            <img src="https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=200&fit=crop" alt="History">
                        </div>
                        <div class="quiz-content">
                            <h3>World History: Ancient Civilizations</h3>
                            <p>Explore the major ancient civilizations, their cultures, and historical significance.</p>
                            <div class="quiz-meta">
                                <span class="difficulty medium">Medium</span>
                                <span class="duration">30 min</span>
                                <span class="score">Last Score: 78%</span>
                            </div>
                            <button class="btn-primary" data-topic="history">Take Quiz</button>
                        </div>
                    </div>
                    
                    <div class="quiz-card">
                        <div class="quiz-image">
                            <img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&h=200&fit=crop" alt="Biology">
                        </div>
                        <div class="quiz-content">
                            <h3>Introduction to Biology</h3>
                            <p>A comprehensive quiz on fundamental biological concepts and processes.</p>
                            <div class="quiz-meta">
                                <span class="difficulty medium">Medium</span>
                                <span class="duration">25 min</span>
                                <span class="score">Last Score: 85%</span>
                            </div>
                            <button class="btn-primary" data-topic="biology">Take Quiz</button>
                        </div>
                    </div>
                    
                    <div class="quiz-card">
                        <div class="quiz-image">
                            <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop" alt="Literature">
                        </div>
                        <div class="quiz-content">
                            <h3>English Literature: Romanticism</h3>
                            <p>Examine the key authors, themes, and works of the Romantic period in literature.</p>
                            <div class="quiz-meta">
                                <span class="difficulty hard">Hard</span>
                                <span class="duration">40 min</span>
                                <span class="score">Last Score: 67%</span>
                            </div>
                            <button class="btn-primary" data-topic="literature">Take Quiz</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="quiz-section">
                <div class="quiz-section-header">
                    <i class="fas fa-brain"></i>
                    <h2>AI-Suggested Quizzes</h2>
                </div>
                <p>Personalized quizzes tailored to your learning needs and progress, powered by AI.</p>
                
                <div class="quiz-grid">
                    <div class="quiz-card ai-suggested">
                        <div class="quiz-image">
                            <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=200&fit=crop" alt="Calculus">
                        </div>
                        <div class="quiz-content">
                            <h3>Calculus: Derivatives</h3>
                            <p>AI-identified knowledge gap: Practice problems on derivative rules and applications.</p>
                            <div class="quiz-meta">
                                <span class="difficulty hard">Hard</span>
                                <span class="duration">35 min</span>
                                <div class="ai-relevance">
                                    <span>AI-Suggested 75% relevance</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 75%"></div>
                                    </div>
                                </div>
                            </div>
                            <button class="btn-primary" data-topic="calculus">Take Quiz</button>
                        </div>
                    </div>
                    
                    <div class="quiz-card ai-suggested">
                        <div class="quiz-image">
                            <img src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300&h=200&fit=crop" alt="Chemistry">
                        </div>
                        <div class="quiz-content">
                            <h3>Chemistry: Stoichiometry</h3>
                            <p>Recommended by AI: Master the quantitative relationships in chemical reactions.</p>
                            <div class="quiz-meta">
                                <span class="difficulty medium">Medium</span>
                                <span class="duration">25 min</span>
                                <div class="ai-relevance">
                                    <span>AI-Suggested 50% relevance</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 50%"></div>
                                    </div>
                                </div>
                            </div>
                            <button class="btn-primary" data-topic="chemistry">Take Quiz</button>
                        </div>
                    </div>
                    
                    <div class="quiz-card ai-suggested">
                        <div class="quiz-image">
                            <img src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=200&fit=crop" alt="AI">
                        </div>
                        <div class="quiz-content">
                            <h3>AI & Machine Learning Basics</h3>
                            <p>Personalized for your interests: Fundamental concepts of AI and machine learning.</p>
                            <div class="quiz-meta">
                                <span class="difficulty medium">Medium</span>
                                <span class="duration">30 min</span>
                                <div class="ai-relevance">
                                    <span>AI-Suggested 90% relevance</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 90%"></div>
                                    </div>
                                </div>
                            </div>
                            <button class="btn-primary" data-topic="ai">Take Quiz</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="quiz-history-link">
                <a href="#">View My Quiz History & Scores</a>
            </div>
        `;
        // Bind quiz buttons to topic-specific sets
        contentArea.querySelectorAll('button').forEach(btn => {
            const t = btn.textContent||'';
            const topic = btn.getAttribute('data-topic');
            if (/take quiz/i.test(t)) {
                if (topic && QUESTIONS[topic]) {
                    btn.addEventListener('click', ()=> openQuizFlow(`${btn.closest('.quiz-content')?.querySelector('h3')?.textContent||'Quiz'}`, topic));
                } else {
                    btn.addEventListener('click', ()=> openQuizFlow('Quiz','quiz'));
                }
            } else if (/join contest/i.test(t)) {
                btn.addEventListener('click', ()=> openQuizFlow('Contest Practice','contest'));
            }
        });
    }
    
    // Focus Page
    function loadFocus() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Focus Sessions</h1>
            </div>
            
            <div class="focus-container">
                <div class="current-session">
                    <div class="session-header">
                        <h2>Current Session</h2>
                        <p>Stay focused, stay productive.</p>
                    </div>
                    <div class="timer-display">
                        <div class="timer-circle">
                            <span class="timer-text">00:00:00</span>
                        </div>
                    </div>
                    <button class="btn-primary start-btn">▶ Start Session</button>
                </div>
                
                <div class="focus-stats">
                    <div class="stat-card">
                        <h3>Daily Focus</h3>
                        <p>Target: 60 minutes</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 75%"></div>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">45 min</span>
                            <span class="stat-goal">60 min Goal</span>
                        </div>
                        <div class="streak-info">
                            <span class="streak-number">5 Day Streak</span>
                            <p>Keep up the great work!</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <h3>Weekly Focus Goal</h3>
                        <p>Target: 10 hours</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 50%"></div>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">5 hrs</span>
                            <span class="stat-goal">10 hrs Goal</span>
                        </div>
                        <div class="streak-info">
                            <span class="streak-number">3 Week Streak</span>
                            <p>Almost there, just a few more hours!</p>
                        </div>
                    </div>
                </div>
                
                <div class="session-history">
                    <h3>Session History</h3>
                    <p>Your past focus sessions.</p>
                    <div class="history-list">
                        <div class="history-item">
                            <span class="history-date">Oct 26, 2023</span>
                            <span class="history-duration">1h 15m</span>
                            <span class="history-status">Focused</span>
                        </div>
                        <div class="history-item">
                            <span class="history-date">Oct 25, 2023</span>
                            <span class="history-duration">45m</span>
                            <span class="history-status">Challenging</span>
                        </div>
                        <div class="history-item">
                            <span class="history-date">Oct 24, 2023</span>
                            <span class="history-duration">1h 30m</span>
                            <span class="history-status">Productive</span>
                        </div>
                    </div>
                </div>
                <div class="focus-times" id="interactiveTimetable">
                    <h3>Interactive Timetable</h3>
                    <p>Auto-adjusts using your assignments, exams, and study time preferences.</p>
                    <div class="card" style="margin-bottom:1rem;">
                        <div class="card-header"><h3>Add Assignment / Exam</h3></div>
                        <div class="card-content">
                            <form id="plannerForm" class="note-form">
                                <input class="note-title-input" name="title" placeholder="Title (e.g., Algebra Assignment 2)">
                                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                                    <input class="note-title-input" name="due" type="date" placeholder="Due date">
                                    <select class="priority-select" name="type">
                                        <option value="assignment">Assignment</option>
                                        <option value="exam">Exam</option>
                                    </select>
                                    <input class="note-title-input" name="hours" type="number" step="0.5" min="0" placeholder="Est. hours">
                                </div>
                                <div class="note-actions">
                                    <button class="btn-primary" type="submit">Add</button>
                                    <button class="btn-secondary" type="button" id="clearPlanner">Clear All</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;
        // Bind 30-minute focus session to control quizzes/contests
        const startBtn = contentArea.querySelector('.start-btn');
        const timerText = contentArea.querySelector('.timer-text');
        let focusInterval = null; let remaining = 30*60; // 30 minutes
        function fmt(s){ const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
        function stopFocus(){ if (focusInterval) clearInterval(focusInterval); focusInterval=null; remaining=30*60; if (timerText) timerText.textContent='00:00:00'; }
        if (startBtn) startBtn.addEventListener('click', ()=>{
            if (focusInterval) return; // already running
            remaining = 30*60;
            if (timerText) timerText.textContent = fmt(remaining);
            focusInterval = setInterval(()=>{
                remaining -= 1;
                if (timerText) timerText.textContent = fmt(Math.max(remaining,0));
                localStorage.setItem('focusMinutesToday', String( (parseInt(localStorage.getItem('focusMinutesToday')||'0',10)) ));
                if (remaining <= 0) {
                    clearInterval(focusInterval); focusInterval=null;
                    // Auto-close quiz/contest page if open
                    const qp = document.getElementById('quizPage');
                    if (qp && qp.style.display !== 'none') { qp.style.display = 'none'; document.body.style.overflow=''; }
                    alert('Focus session ended. Quiz/contest has been closed.');
                }
            }, 1000);
        });
        // Timetable storage helpers
        function getPlannerItems(){ try { return JSON.parse(localStorage.getItem('plannerItems')||'[]'); } catch { return []; } }
        function savePlannerItems(items){ localStorage.setItem('plannerItems', JSON.stringify(items)); }
        function addPlannerItem(item){ const arr = getPlannerItems(); arr.push(item); savePlannerItems(arr); }
        function clearPlanner(){ savePlannerItems([]); }

        // Auto-schedule: simple heuristic for next 7 days
        function buildSchedule(items){
            const plan = [];
            const today = new Date(); today.setHours(0,0,0,0);
            const preferred = (getStoredProfile()?.learningTime)||'evening';
            const dailySlots = preferred==='morning' ? [8] : preferred==='evening' ? [19] : [16];
            items.sort((a,b)=> new Date(a.due) - new Date(b.due));
            for (const it of items){
                let remaining = Math.max(0, Number(it.hours)||0);
                const due = new Date(it.due); due.setHours(0,0,0,0);
                let d = new Date(today);
                while (remaining > 0 && d <= due){
                    for (const hr of dailySlots){
                        if (remaining <= 0) break;
                        plan.push({ date: new Date(d), hour: hr, title: it.title, type: it.type });
                        remaining = Math.max(0, remaining - 1);
                    }
                    d.setDate(d.getDate()+1);
                }
            }
            return plan.filter(x=> (x.date - today) <= 6*24*3600*1000);
        }

        function renderSchedule(){
            const host = document.getElementById('timetableGrid');
            if (!host) return;
            const items = getPlannerItems();
            const schedule = buildSchedule(items);
            const byDay = {};
            schedule.forEach(s=>{
                const key = s.date.toDateString();
                (byDay[key] ||= []).push(s);
            });
            const days = Array.from({length:7}, (_,i)=>{ const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+i); return d; });
            host.innerHTML = `<div class="activity-grid">${days.map(d=>{
                const key = d.toDateString();
                const list = (byDay[key]||[]).map(s=>
                    `<div class=\"activity-item\"><div class=\"activity-icon ${'${'}s.type==='exam'?'yellow':'blue'${'}'}\"><i class=\"fas ${'${'}s.type==='exam'?'fa-calendar':'fa-book'${'}'}\"></i></div><div class=\"activity-content\"><div class=\"activity-text\">${'${'}s.title${'}'}</div><div class=\"activity-time\">${'${'}d.toLocaleDateString('en-US')${'}'} • ${'${'}String(s.hour).padStart(2,'0')${'}'}:00</div></div></div>`
                ).join('') || '<p style=\"color:#64748b\">No sessions scheduled.</p>';
                return `<div class=\"card\"><div class=\"card-header\"><h3>${'${'}d.toLocaleDateString('en-US',{weekday:'short', month:'short', day:'numeric'})${'}'}</h3></div><div class=\"card-content\">${'${'}list${'}'}</div></div>`;
            }).join('')}</div>`;
        }

        const pf = document.getElementById('plannerForm');
        const clearBtn = document.getElementById('clearPlanner');
        if (pf) pf.addEventListener('submit', (e)=>{
            e.preventDefault();
            const fd = new FormData(pf);
            const title = String(fd.get('title')||'').trim();
            const due = String(fd.get('due')||'');
            const type = String(fd.get('type')||'assignment');
            const hours = Number(fd.get('hours')||'1');
            if (!title || !due) { alert('Please provide a title and due date.'); return; }
            addPlannerItem({ title, due, type, hours });
            pf.reset();
            renderSchedule();
        });
        if (clearBtn) clearBtn.addEventListener('click', ()=>{ if(confirm('Clear all planner items?')){ clearPlanner(); renderSchedule(); }});
        renderSchedule();
    }
    
    // Social Page
    function loadSocial() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Friend Groups & Mentor Chats</h1>
            </div>
            
            <div class="social-container">
                <div class="groups-section">
                    <div class="section-header">
                        <h2>Your Groups</h2>
                        <div class="group-actions">
                            <button class="btn-primary" id="createGroupBtn">Create Group</button>
                            <button class="btn-secondary" id="joinGroupBtn">Join Group</button>
                        </div>
                    </div>
                    
                    <div class="groups-list">
                        <div class="group-card">
                            <div class="group-avatars">
                                <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" alt="User">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" alt="User">
                                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="User">
                                <div class="more-count">+1</div>
                            </div>
                            <div class="group-info">
                                <h3>AI Study Group</h3>
                                <p>4 Members</p>
                            </div>
                            <span class="group-status active">Active</span>
                        </div>
                        
                        <div class="group-card">
                            <div class="group-avatars">
                                <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" alt="User">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" alt="User">
                                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="User">
                                <div class="more-count">+3</div>
                            </div>
                            <div class="group-info">
                                <h3>History Buffs</h3>
                                <p>6 Members</p>
                            </div>
                            <span class="group-status planning">Planning Session</span>
                        </div>
                    </div>
                </div>
                
                <div class="mentors-section">
                    <h2>Mentor Chats</h2>
                    <div class="mentors-list">
                        <div class="mentor-card" data-mentor="anya">
                            <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" alt="Mentor">
                            <div class="mentor-info">
                                <h3>Dr. Anya Sharma</h3>
                                <p>Sure, let's connect later this week to discuss your thesis progress.</p>
                            </div>
                            <span class="mentor-status online">Online</span>
                        </div>
                        
                        <div class="mentor-card" data-mentor="david">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" alt="Mentor">
                            <div class="mentor-info">
                                <h3>Prof. David Lee</h3>
                                <p>I'll review your questions and get back to you by tomorrow morning.</p>
                            </div>
                            <span class="mentor-status away">Away</span>
                        </div>
                    </div>
                </div>
                
                <div class="chat-section">
                    <div class="chat-header">
                        <h3>AI Study Group</h3>
                        <p>4 Members</p>
                        <span class="chat-status active">Active</span>
                    </div>
                    
                    <div class="chat-messages">
                        <div class="message">
                            <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" alt="Alice">
                            <div class="message-content">
                                <span class="sender">Alice</span>
                                <p>Hey everyone, any updates on the AI project?</p>
                                <span class="message-time">10:00 AM</span>
                            </div>
                        </div>
                        
                        <div class="message">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" alt="Bob">
                            <div class="message-content">
                                <span class="sender">Bob</span>
                                <p>I'm focusing on data preprocessing today. Anyone free for a quick call later?</p>
                                <span class="message-time">10:05 AM</span>
                            </div>
                        </div>
                        
                        <div class="message">
                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="Charlie">
                            <div class="message-content">
                                <span class="sender">Charlie</span>
                                <p>I'll be available after 3 PM. Just finished my daily focus session!</p>
                                <span class="message-time">10:15 AM</span>
                            </div>
                        </div>
                        
                        <div class="message user-message">
                            <div class="message-content">
                                <span class="sender">You</span>
                                <p>Great, Bob! I can join a call after 4 PM. Charlie, nice work!</p>
                                <span class="message-time">10:20 AM</span>
                            </div>
                            <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" alt="You">
                        </div>
                    </div>
                    
                    <div class="chat-input">
                        <input type="text" placeholder="Type your message here..." id="groupChatInput">
                        <button class="btn-primary" id="groupChatSend">Send</button>
                    </div>
                </div>
                
                <div class="focus-times">
                    <h3>Daily Focus Times</h3>
                    <div class="focus-list">
                        <div class="focus-item">
                            <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" alt="Alice">
                            <span class="focus-name">Alice</span>
                            <span class="focus-time">2h 30m</span>
                        </div>
                        <div class="focus-item">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" alt="Bob">
                            <span class="focus-name">Bob</span>
                            <span class="focus-time">1h 45m</span>
                        </div>
                        <div class="focus-item">
                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="Charlie">
                            <span class="focus-name">Charlie</span>
                            <span class="focus-time">3h 10m</span>
                        </div>
                        <div class="focus-item">
                            <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" alt="You">
                            <span class="focus-name">You</span>
                            <span class="focus-time">1h 0m</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        // Open dedicated chat per mentor
        contentArea.querySelectorAll('.mentor-card').forEach(card=>{
            card.addEventListener('click', ()=>{
                const key = card.getAttribute('data-mentor')||'mentor';
                openMentorChat(key, card.querySelector('h3')?.textContent||'Mentor');
            });
        });
        // Simple local group storage
        function getGroups(){ try { return JSON.parse(localStorage.getItem('groups')||'[]'); } catch { return []; } }
        function setGroups(v){ localStorage.setItem('groups', JSON.stringify(v)); }
        if (!localStorage.getItem('groups')) setGroups([{name:'AI Study Group', members:['alice@mail.com','bob@mail.com','charlie@mail.com']}]);

        const createBtn = contentArea.querySelector('#createGroupBtn');
        const joinBtn = contentArea.querySelector('#joinGroupBtn');
        if (createBtn) createBtn.addEventListener('click', ()=>{
            const name = prompt('Group name?');
            const emails = prompt('Enter friend emails (comma-separated):');
            if (!name) return; const arr = emails? emails.split(',').map(s=>s.trim()).filter(Boolean):[];
            const gs = getGroups(); gs.push({name, members: arr}); setGroups(gs); alert('Group created.');
        });
        if (joinBtn) joinBtn.addEventListener('click', ()=>{
            const email = prompt('Your email to join with?');
            const group = prompt('Name of group to join?');
            if (!email||!group) return; const gs = getGroups(); const g = gs.find(x=>x.name.toLowerCase()===group.toLowerCase());
            if (!g) { alert('Group not found'); return; }
            if (!g.members.includes(email)) g.members.push(email); setGroups(gs); alert('Joined group.');
        });

        // Group chat (local, simple echo for demo)
        const chatBox = contentArea.querySelector('.chat-messages');
        const chatInput = contentArea.querySelector('#groupChatInput');
        const chatSend = contentArea.querySelector('#groupChatSend');
        function pushMsg(text, who='you'){
            const wrap = document.createElement('div');
            wrap.className = 'message'+(who==='you'?' user-message':'');
            wrap.innerHTML = who==='you'
                ? `<div class="message-content"><span class="sender">You</span><p>${text}</p><span class="message-time">now</span></div><img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" alt="You">`
                : `<img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" alt="Mentor"><div class="message-content"><span class="sender">Mentor</span><p>${text}</p><span class="message-time">now</span></div>`;
            chatBox.appendChild(wrap); chatBox.scrollTop = chatBox.scrollHeight;
        }
        if (chatSend) chatSend.addEventListener('click', ()=>{ const v=chatInput.value.trim(); if(!v) return; pushMsg(v,'you'); chatInput.value=''; setTimeout(()=> pushMsg('Thanks for the update! Keep going.'),'mentor'), 600; });
    }
    
    // Labs Page
    function loadLabs() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Explore Interactive 3D Labs</h1>
            </div>
            
            <div class="labs-container">
                <div class="featured-labs">
                    <h2>Featured Labs</h2>
                    <div class="featured-grid">
                        <div class="lab-card featured">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=250&fit=crop" alt="Chemistry Lab">
                                <span class="ai-tag">AI Suggested</span>
                            </div>
                            <div class="lab-content">
                                <h3>Virtual Chemistry Lab: Acids & Bases</h3>
                                <p>Conduct experiments with various acids and bases, observe reactions, and understand pH changes in a safe virtual environment.</p>
                                <div class="lab-tags">
                                    <span class="tag">Chemistry</span>
                                    <span class="tag">Simulation</span>
                                    <span class="tag">Interactive</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Virtual Chemistry Lab: Acids & Bases">Launch Lab</button>
                            </div>
                        </div>
                        
                        <div class="lab-card featured">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop" alt="Physics Lab">
                            </div>
                            <div class="lab-content">
                                <h3>Physics: Electromagnetism Basics</h3>
                                <p>Explore the fundamental principles of electromagnetism, build simple circuits, and visualize magnetic fields with interactive tools.</p>
                                <div class="lab-tags">
                                    <span class="tag">Physics</span>
                                    <span class="tag">Circuits</span>
                                    <span class="tag">Beginner</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Physics: Electromagnetism Basics">Launch Lab</button>
                            </div>
                        </div>
                        
                        <div class="lab-card featured">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop" alt="Biology Lab">
                                <span class="ai-tag">AI Suggested</span>
                            </div>
                            <div class="lab-content">
                                <h3>Biology: Cell Structure & Function</h3>
                                <p>Dissect a virtual cell, identify organelles, and understand their functions in a detailed 3D model.</p>
                                <div class="lab-tags">
                                    <span class="tag">Biology</span>
                                    <span class="tag">Anatomy</span>
                                    <span class="tag">3D Model</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Biology: Cell Structure & Function">Launch Lab</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="all-labs">
                    <h2>All Labs</h2>
                    <div class="labs-grid">
                        <div class="lab-card">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&h=200&fit=crop" alt="Genetics Lab">
                            </div>
                            <div class="lab-content">
                                <h3>Molecular Genetics Lab</h3>
                                <p>Simulate DNA extraction, PCR, and gel electrophoresis to understand genetic processes.</p>
                                <div class="lab-tags">
                                    <span class="tag">Biology</span>
                                    <span class="tag">Genetics</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Molecular Genetics Lab">Launch Lab</button>
                            </div>
                        </div>
                        
                        <div class="lab-card">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=200&fit=crop" alt="Astronomy Lab">
                                <span class="ai-tag">AI Suggested</span>
                            </div>
                            <div class="lab-content">
                                <h3>Astronomy: Planetary Orbits</h3>
                                <p>Manipulate planetary masses and velocities to observe gravitational effects and orbital mechanics.</p>
                                <div class="lab-tags">
                                    <span class="tag">Astronomy</span>
                                    <span class="tag">Physics</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Astronomy: Planetary Orbits">Launch Lab</button>
                            </div>
                        </div>
                        
                        <div class="lab-card">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&h=200&fit=crop" alt="Robotics Lab">
                            </div>
                            <div class="lab-content">
                                <h3>Robotics: Basic Programming</h3>
                                <p>Program a virtual robot arm to perform simple tasks and learn foundational robotics concepts.</p>
                                <div class="lab-tags">
                                    <span class="tag">Engineering</span>
                                    <span class="tag">Programming</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Robotics: Basic Programming">Launch Lab</button>
                            </div>
                        </div>
                        
                        <div class="lab-card">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop" alt="Geology Lab">
                                <span class="ai-tag">AI Suggested</span>
                            </div>
                            <div class="lab-content">
                                <h3>Earth Science: Plate Tectonics</h3>
                                <p>Visualize and interact with geological processes like continental drift, earthquakes, and volcanism.</p>
                                <div class="lab-tags">
                                    <span class="tag">Geology</span>
                                    <span class="tag">Simulation</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Earth Science: Plate Tectonics">Launch Lab</button>
                            </div>
                        </div>
                        
                        <div class="lab-card">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop" alt="Neuroscience Lab">
                            </div>
                            <div class="lab-content">
                                <h3>Neuroscience: Brain Anatomy</h3>
                                <p>Explore a detailed 3D model of the human brain, identifying different regions and their functions.</p>
                                <div class="lab-tags">
                                    <span class="tag">Neuroscience</span>
                                    <span class="tag">Anatomy</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Neuroscience: Brain Anatomy">Launch Lab</button>
                            </div>
                        </div>
                        
                        <div class="lab-card">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop" alt="Ecology Lab">
                            </div>
                            <div class="lab-content">
                                <h3>Environmental Science: Ecosystem Dynamics</h3>
                                <p>Simulate population changes, resource depletion, and climate effects on different ecosystems.</p>
                                <div class="lab-tags">
                                    <span class="tag">Ecology</span>
                                    <span class="tag">Environment</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Environmental Science: Ecosystem Dynamics">Launch Lab</button>
                            </div>
                        </div>
                        
                        <div class="lab-card">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300&h=200&fit=crop" alt="Chemistry Lab">
                            </div>
                            <div class="lab-content">
                                <h3>Chemical Reactions Lab</h3>
                                <p>Experiment with various chemical reactions, balancing equations and predicting products.</p>
                                <div class="lab-tags">
                                    <span class="tag">Chemistry</span>
                                    <span class="tag">Reactions</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Chemical Reactions Lab">Launch Lab</button>
                            </div>
                        </div>
                        
                        <div class="lab-card">
                            <div class="lab-image">
                                <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=200&fit=crop" alt="Optics Lab">
                                <span class="ai-tag">AI Suggested</span>
                            </div>
                            <div class="lab-content">
                                <h3>Optics: Light and Lenses</h3>
                                <p>Investigate light refraction, reflection, and the properties of different lenses and mirrors.</p>
                                <div class="lab-tags">
                                    <span class="tag">Physics</span>
                                    <span class="tag">Light</span>
                                </div>
                                <button class="btn-primary" data-lab-title="Optics: Light and Lenses">Launch Lab</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        // Bind Launch Lab buttons and show time limits beside them
        const LAB_DURATIONS = {
            'Virtual Chemistry Lab: Acids & Bases': '20 min',
            'Physics: Electromagnetism Basics': '25 min',
            'Biology: Cell Structure & Function': '30 min',
            'Molecular Genetics Lab': '35 min',
            'Astronomy: Planetary Orbits': '20 min',
            'Robotics: Basic Programming': '30 min',
            'Earth Science: Plate Tectonics': '25 min',
            'Neuroscience: Brain Anatomy': '30 min',
            'Environmental Science: Ecosystem Dynamics': '30 min',
            'Chemical Reactions Lab': '25 min',
            'Optics: Light and Lenses': '20 min'
        };
        contentArea.querySelectorAll('button[data-lab-title]').forEach(btn => {
            const title = btn.getAttribute('data-lab-title');
            btn.addEventListener('click', ()=> openLabDetail(title));
            const dur = LAB_DURATIONS[title];
            if (dur) {
                const tag = document.createElement('span');
                tag.textContent = dur;
                tag.style.marginLeft = '8px';
                tag.style.color = '#64748b';
                tag.style.fontWeight = '600';
                btn.insertAdjacentElement('afterend', tag);
            }
        });
    }
    
    // Notes Page
    function loadNotes() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">My Notes & To-Do List</h1>
                <p class="page-subtitle">Keep track of your academic tasks, personal reminders, and study notes all in one organized place.</p>
            </div>
            
            <div class="notes-container">
                <div class="create-note">
                    <h2>Create New Note</h2>
                    <div class="note-form">
                        <input type="text" placeholder="Note title..." class="note-title-input">
                        <textarea placeholder="Write your note here..." class="note-content-input"></textarea>
                        <div class="note-actions">
                            <select class="priority-select">
                                <option>Select Priority</option>
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                            <button class="btn-primary" id="addNoteBtn">Add Note</button>
                            <button class="btn-secondary" id="saveNoteToFileBtn">Save Note</button>
                        </div>
                    </div>
                </div>
                
                <div class="notes-tabs">
                    <button class="tab-btn active" data-open="All">All</button>
                    <button class="tab-btn" data-open="To-Dos">To-Dos</button>
                    <button class="tab-btn" data-open="Notes">Notes</button>
                    <button class="tab-btn" data-open="Completed">Completed</button>
                </div>
                
                <div class="todos-section">
                    <div class="section-header">
                        <i class="fas fa-tasks"></i>
                        <h2>Your Active To-Dos</h2>
                    </div>
                    <p>Manage your academic and personal tasks efficiently.</p>
                    
                    <div class="todos-list">
                        <div class="todo-item">
                            <input type="checkbox" id="todo1">
                            <label for="todo1">Finish calculus homework by Friday.</label>
                        </div>
                        <div class="todo-item">
                            <input type="checkbox" id="todo2" checked>
                            <label for="todo2">Read 'The Martian' for book club discussion.</label>
                        </div>
                        <div class="todo-item">
                            <input type="checkbox" id="todo3">
                            <label for="todo3">Schedule study group meeting for biology.</label>
                        </div>
                        <div class="todo-item">
                            <input type="checkbox" id="todo4">
                            <label for="todo4">Practice Python coding challenges.</label>
                        </div>
                        <div class="todo-item">
                            <input type="checkbox" id="todo5" checked>
                            <label for="todo5">Update resume for internship applications.</label>
                        </div>
                    </div>
                </div>
                
                <div class="personal-notes">
                    <div class="section-header">
                        <i class="fas fa-sticky-note"></i>
                        <h2>Your Personal Notes</h2>
                    </div>
                    <p>Jot down important ideas, summaries, or reminders.</p>
                    
                    <div class="notes-grid" id="notesGrid"></div>
                </div>
            </div>
        `;

        // Notes persistence and tabs
        const titleEl = contentArea.querySelector('.note-title-input');
        const contentEl = contentArea.querySelector('.note-content-input');
        const priorityEl = contentArea.querySelector('.priority-select');
        const addBtn = contentArea.querySelector('#addNoteBtn');
        const saveToFileBtn = contentArea.querySelector('#saveNoteToFileBtn');
        const notesGrid = contentArea.querySelector('#notesGrid');
        const tabButtons = Array.from(contentArea.querySelectorAll('.notes-tabs .tab-btn'));

        function readNotes() {
            try { return JSON.parse(localStorage.getItem('notes')||'[]'); } catch { return []; }
        }
        function writeNotes(list) {
            localStorage.setItem('notes', JSON.stringify(list));
        }
        function renderNotes(filter='All') {
            const notes = readNotes();
            const now = new Date();
            const fmt = (d)=> d.toISOString().slice(0,10);
            notesGrid.innerHTML = notes
                .filter(n=>{
                    if (filter==='All') return true;
                    if (filter==='Notes') return n.type==='note';
                    if (filter==='To-Dos') return n.type==='todo' && !n.completed;
                    if (filter==='Completed') return n.completed;
                    return true;
                })
                .map(n=>{
                    const prCls = n.priority==='High'?'high':n.priority==='Medium'?'medium':'low';
                    return `
                        <div class="note-card" data-id="${n.id}">
                            <div class="note-header">
                                <h3>${n.title||'(Untitled)'}</h3>
                                <span class="priority-tag ${prCls}">${n.priority||'Low'} Priority</span>
                            </div>
                            <p class="note-date">${fmt(new Date(n.date))}</p>
                            <p class="note-content">${n.content||''}</p>
                        </div>`;
                }).join('');
            // open note fullpage on click
            notesGrid.querySelectorAll('.note-card').forEach(card=>{
                card.addEventListener('click', ()=>{
                    const id = card.getAttribute('data-id');
                    const item = readNotes().find(x=>x.id===id);
                    if (!item) return;
                    if (notesPageTitle) notesPageTitle.textContent = item.title||'Note';
                    if (notesBody) notesBody.innerHTML = `<div class="card"><div class="card-header"><h3>${item.title||'(Untitled)'}</h3></div><div class="card-content">${item.content||''}</div></div>`;
                    if (notesPage) notesPage.style.display='flex';
                    document.body.style.overflow='hidden';
                });
            });
        }
        function addNote() {
            const notes = readNotes();
            const n = {
                id: 'n_'+Date.now(),
                title: titleEl.value.trim(),
                content: contentEl.value.trim(),
                priority: ['High','Medium','Low'].includes(priorityEl.value)? priorityEl.value : 'Low',
                date: Date.now(),
                type: 'note',
                completed: false
            };
            if (!n.title && !n.content) return;
            notes.unshift(n);
            writeNotes(notes);
            titleEl.value = '';
            contentEl.value = '';
            priorityEl.value = 'Select Priority';
            setActiveTab('All');
        }
        function setActiveTab(name) {
            tabButtons.forEach(b=> b.classList.toggle('active', b.textContent===name));
            renderNotes(name);
        }
        if (addBtn) addBtn.addEventListener('click', addNote);
        if (saveToFileBtn) saveToFileBtn.addEventListener('click', ()=>{
            const title = (titleEl?.value||'Untitled').trim()||'Untitled';
            const body = (contentEl?.value||'').trim();
            if (!title && !body) { alert('Nothing to save.'); return; }
            const text = `Title: ${title}\nPriority: ${priorityEl?.value||'Low'}\nDate: ${new Date().toISOString()}\n\n${body}`;
            const blob = new Blob([text], {type:'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href=url; a.download = `${title.replace(/[^a-z0-9-_]+/gi,'_').toLowerCase()}_note.txt`;
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        });
        tabButtons.forEach(btn=> btn.addEventListener('click', ()=> setActiveTab(btn.textContent)));
        // Open fullpages when clicking tabs header buttons
        // Single click opens the fullpage (as requested), and ensures non-empty by focusing composer with today items fallback
        contentArea.querySelectorAll('.notes-tabs .tab-btn').forEach(b=>{
            b.addEventListener('click', ()=> openNotesList(b.getAttribute('data-open')||b.textContent));
        });
        // Initial render
        setActiveTab('All');
        if (notesBack) notesBack.addEventListener('click', ()=>{ if (notesPage) notesPage.style.display='none'; document.body.style.overflow=''; });
    }
    
    // Portfolio Page (read-only showcase)
    function loadPortfolio() {
        const profile = getStoredProfile();
        const name = profile.name || 'Student';
        const achievements = profile.achievements || ['Top 5 in Weekly Leaderboard', 'Completed 12 Courses', 'Won AI Hackathon (Campus)'];
        const contests = profile.contests || ['Coding Sprint #12', 'Math Marathon', 'AI Quiz Bowl'];
        const work = profile.work || 'Intern, NextHorizon Labs — Built a quiz generator using NLP.';

        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">${name}'s Portfolio</h1>
                <p class="page-subtitle">Achievements, progress, contests, and experience</p>
            </div>

            <div class="profile-form-container">
                <div class="form-section">
                    <div class="section-header">
                        <i class="fas fa-trophy" style="color:#10B981;"></i>
                        <h3>Achievements</h3>
                    </div>
                    <ul>
                        ${achievements.map(a=>`<li>${a}</li>`).join('')}
                    </ul>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <i class="fas fa-chart-line" style="color:#5680E9;"></i>
                        <h3>Day-to-day Progress</h3>
                    </div>
                    <div id="portfolioLineChart" style="height:180px"></div>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <i class="fas fa-medal" style="color:#F59E0B;"></i>
                        <h3>Contest Participations</h3>
                    </div>
                    <ul>
                        ${contests.map(c=>`<li>${c}</li>`).join('')}
                    </ul>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <i class="fas fa-briefcase" style="color:#8B5CF6;"></i>
                        <h3>Work Experience</h3>
                    </div>
                    <p>${work}</p>
                </div>
            </div>
        `;

        const data = profile.progress || [3,5,4,7,6,8,9,7,8,10,9,11];
        const root = document.getElementById('portfolioLineChart');
        const w = root.clientWidth || 700, h = 180, pad = 24;
        const max = Math.max(...data) || 1;
        const dx = (w - pad*2) / (data.length - 1);
        const points = data.map((v,i)=>{
            const x = pad + i*dx; const y = h - pad - (v/max)*(h - pad*2);
            return `${x},${y}`;
        }).join(' ');
        root.innerHTML = `
            <svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">
                <polyline fill="none" stroke="#5680E9" stroke-width="3" points="${points}" />
                ${data.map((v,i)=>{
                    const x = pad + i*dx; const y = h - pad - (v/max)*(h - pad*2);
                    return `<circle cx="${x}" cy="${y}" r="3" fill="#8860D0" />`;
                }).join('')}
            </svg>`;
    }
    
    // Overview Page
    function loadOverview() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Overview</h1>
            </div>
            
            <div class="overview-container">
                <div class="overview-grid">
                    <div class="overview-card">
                        <div class="card-header">
                            <i class="fas fa-fire"></i>
                            <h3>Highest Streak</h3>
                        </div>
                        <div class="streak-display">
                            <div class="streak-number">12</div>
                            <div class="streak-label">Days</div>
                        </div>
                        <p class="streak-date">Achieved on March 15, 2024</p>
                    </div>
                    
                    <div class="overview-card">
                        <div class="card-header">
                            <i class="fas fa-bolt"></i>
                            <h3>Current Streak</h3>
                        </div>
                        <div class="streak-display">
                            <div class="streak-number">5</div>
                            <div class="streak-label">Days</div>
                        </div>
                        <p class="streak-date">Started on March 20, 2024</p>
                    </div>
                    
                    <div class="overview-card">
                        <div class="card-header">
                            <i class="fas fa-medal"></i>
                            <h3>Total Badges</h3>
                        </div>
                        <div class="badges-display">
                            <div class="badge-count">23</div>
                            <div class="badge-grid">
                                <div class="badge-item gold">🏆</div>
                                <div class="badge-item silver">🥈</div>
                                <div class="badge-item bronze">🥉</div>
                                <div class="badge-item special">⭐</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-card leaderboard">
                        <div class="card-header">
                            <i class="fas fa-trophy"></i>
                            <h3>Leaderboard</h3>
                        </div>
                        <div class="leaderboard-list">
                            <div class="leaderboard-item">
                                <div class="rank">1</div>
                                <div class="player-info">
                                    <div class="player-name">Alex Johnson</div>
                                    <div class="player-score">2,450 XP</div>
                                </div>
                            </div>
                            <div class="leaderboard-item">
                                <div class="rank">2</div>
                                <div class="player-info">
                                    <div class="player-name">Emma Wilson</div>
                                    <div class="player-score">2,100 XP</div>
                                </div>
                            </div>
                            <div class="leaderboard-item current">
                                <div class="rank">3</div>
                                <div class="player-info">
                                    <div class="player-name">You</div>
                                    <div class="player-score">1,980 XP</div>
                                </div>
                            </div>
                            <div class="leaderboard-item">
                                <div class="rank">4</div>
                                <div class="player-info">
                                    <div class="player-name">Sarah Davis</div>
                                    <div class="player-score">1,750 XP</div>
                                </div>
                            </div>
                            <div class="leaderboard-item">
                                <div class="rank">5</div>
                                <div class="player-info">
                                    <div class="player-name">David Kim</div>
                                    <div class="player-score">1,650 XP</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="overview-card heatmap-card">
                        <div class="card-header">
                            <i class="fas fa-fire"></i>
                            <h3>Focus Heat Map</h3>
                        </div>
                        <div id="focusHeatmap" class="heatmap-grid"></div>
                        <div style="margin-top:8px; color:#64748b; font-size:0.9rem;">Last 6 months</div>
                    </div>
                    <div class="overview-card" id="recentResults">
                        <div class="card-header">
                            <i class="fas fa-chart-bar"></i>
                            <h3>Recent Quiz & Contest Results</h3>
                        </div>
                        <div id="resultsList"></div>
                    </div>
                </div>
            </div>
        `;
        const weeks = 26, days = 7;
        const container = document.getElementById('focusHeatmap');
        if (container) {
            const total = weeks * days;
            // Derive pseudo data from localStorage focus minutes if available
            const stored = parseInt(localStorage.getItem('focusMinutesToday')||'45', 10);
            for (let i = 0; i < total; i++) {
                const rand = Math.random();
                const intensity = (rand * 0.6) + (stored/120)*0.4; // blend in stored focus
                const alpha = Math.min(0.85, 0.15 + intensity*0.6);
                const cell = document.createElement('div');
                cell.style.width = '12px';
                cell.style.height = '12px';
                cell.style.borderRadius = '3px';
                cell.style.background = `rgba(16, 185, 129, ${alpha})`;
                container.appendChild(cell);
            }
        }

        // Render recent assessment results
        const resultsTarget = document.getElementById('resultsList');
        if (resultsTarget) {
            const results = getAssessmentResults();
            if (!results.length) {
                resultsTarget.innerHTML = `<p style="color:#64748b;">No results yet. Try a quiz or contest to see your performance here.</p>`;
            } else {
                resultsTarget.innerHTML = results.slice(0,5).map(r=>`
                    <div class="activity-item" style="margin-bottom:8px;">
                        <div class="activity-icon ${r.kind==='contest'?'yellow':'blue'}"><i class="fas ${r.kind==='contest'?'fa-trophy':'fa-check'}"></i></div>
                        <div class="activity-content">
                            <div class="activity-text">${r.title} — ${r.score}% (${r.correct}/${r.total})</div>
                            <div class="activity-time">${new Date(r.ts).toLocaleString()}</div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }
    
    // Other sidebar pages (placeholder functions)
    function loadStreaks() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Streaks</h1>
            </div>
            <div class="card">
                <h3>Your Learning Streaks</h3>
                <p>Track your daily learning progress and maintain your streak!</p>
            </div>
        `;
    }
    
    function loadBadges() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Badges</h1>
            </div>
            <div class="card">
                <h3>Your Achievements</h3>
                <p>View all your earned badges and achievements!</p>
            </div>
        `;
    }
    
    function loadSyllabus() {
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Syllabus Progress</h1>
            </div>
            <div class="card">
                <h3>Course Progress</h3>
                <p>Track your progress through different courses and subjects!</p>
            </div>
        `;
    }
    
    function loadSettings() {
        const p = getStoredProfile();
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Student Learning Profile</h1>
                <p class="page-subtitle">Edit your preferences and save</p>
            </div>
            <form class="profile-form-container" id="settingsForm">
                <div class="form-section">
                    <div class="section-header">
                        <i class="fas fa-user" style="color: #8B5CF6;"></i>
                        <h3>Profile</h3>
                    </div>
                    <div class="form-group">
                        <label>Name</label>
                        <input name="name" value="${p.name||''}" type="text" placeholder="Enter your name" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Age</label>
                        <input name="age" value="${p.age||''}" type="text" placeholder="Enter your age" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Grade</label>
                        <input name="grade" value="${p.grade||''}" type="text" placeholder="Enter your grade" class="form-input">
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <i class="fas fa-brain" style="color: #8B5CF6;"></i>
                        <h3>Learning Style</h3>
                    </div>
                    <div class="radio-group">
                        ${['visual','auditory','reading-writing','kinesthetic'].map(v=>`
                        <label class=\"radio-label\">
                            <input ${p.learningStyle===v?'checked':''} type=\"radio\" name=\"learningStyle\" value=\"${v}\">
                            <span class=\"radio-custom\"></span>
                            ${v.replace('-', ' ')}
                        </label>`).join('')}
                    </div>
                </div>

                <div class="form-section">
                    <h3>Pace</h3>
                    <div class="radio-group">
                        ${['fast','moderate','slow'].map(v=>`
                        <label class=\"radio-label\">
                            <input ${p.pace===v?'checked':''} type=\"radio\" name=\"pace\" value=\"${v}\">
                            <span class=\"radio-custom\"></span>
                            ${v}
                        </label>`).join('')}
                    </div>
                </div>

                <div class="form-section">
                    <h3>Focus time</h3>
                    <div class="radio-group">
                        ${['short','medium','long'].map(v=>`
                        <label class=\"radio-label\">
                            <input ${p.focusTime===v?'checked':''} type=\"radio\" name=\"focusTime\" value=\"${v}\">
                            <span class=\"radio-custom\"></span>
                            ${v}
                        </label>`).join('')}
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <i class="fas fa-clock" style="color: #8B5CF6;"></i>
                        <h3>Learning Habits</h3>
                    </div>
                    <p>Best time to learn:</p>
                    <div class="radio-group">
                        ${['morning','30-60-mins','evening'].map(v=>`
                        <label class=\"radio-label\">
                            <input ${p.learningTime===v?'checked':''} type=\"radio\" name=\"learningTime\" value=\"${v}\">
                            <span class=\"radio-custom\"></span>
                            ${v}
                        </label>`).join('')}
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <i class="fas fa-briefcase" style="color:#8B5CF6;"></i>
                        <h3>Portfolio Extras</h3>
                    </div>
                    <div class="form-group">
                        <label>Achievements (comma separated)</label>
                        <input name="achievements" value="${(p.achievements||[]).join(', ')}" class="form-input" type="text" placeholder="e.g., Won Hackathon, 12 Badges">
                    </div>
                    <div class="form-group">
                        <label>Contest Participations (comma separated)</label>
                        <input name="contests" value="${(p.contests||[]).join(', ')}" class="form-input" type="text" placeholder="e.g., Coding Sprint, AI Quiz">
                    </div>
                    <div class="form-group">
                        <label>Work Experience</label>
                        <input name="work" value="${p.work||''}" class="form-input" type="text" placeholder="e.g., Intern at ...">
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn-primary submit-btn" type="submit">Save</button>
                </div>
            </form>
        `;

        const form = document.getElementById('settingsForm');
        form.addEventListener('submit', (e)=>{
            e.preventDefault();
            const fd = new FormData(form);
            const profile = {
                name: fd.get('name')||'',
                age: fd.get('age')||'',
                grade: fd.get('grade')||'',
                learningStyle: fd.get('learningStyle')||'',
                pace: fd.get('pace')||'',
                focusTime: fd.get('focusTime')||'',
                learningTime: fd.get('learningTime')||'',
                achievements: (fd.get('achievements')||'').split(',').map(s=>s.trim()).filter(Boolean),
                contests: (fd.get('contests')||'').split(',').map(s=>s.trim()).filter(Boolean),
                work: fd.get('work')||'',
            };
            saveStoredProfile(profile);
            alert('Saved!');
        });
    }

    // Non-editable profile view
    function loadProfileView() {
        const p = getStoredProfile();
        contentArea.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Profile</h1>
            </div>
            <div class="profile-form-container">
                <div class="form-section">
                    <div class="section-header">
                        <i class="fas fa-user"></i>
                        <h3>${p.name||'Student'} — ${p.grade||''}</h3>
                    </div>
                    <p>Age: ${p.age||'-'}</p>
                    <p>Learning Style: ${p.learningStyle||'-'}</p>
                    <p>Pace: ${p.pace||'-'} | Focus time: ${p.focusTime||'-'}</p>
                    <p>Best time: ${p.learningTime||'-'}</p>
                </div>
            </div>
        `;
    }

    // Dashboard list fullpage for Current Goals / Upcoming Challenges
    function openDashList(kind='Details') {
        if (!dashListPage) return;
        if (dashListTitle) dashListTitle.textContent = kind;
        const items = kind.includes('Goals')
            ? ['Finish Algebra Quiz', 'Join Physics Contest', 'Submit AI Lab Report']
            : ['Math Marathon - Sat 5 PM', 'Coding Sprint - Sun 11 AM', 'Biology Quiz - Mon 9 AM'];
        if (dashListBody) {
            dashListBody.innerHTML = items.map(t=>`<div class="card" style="margin-bottom:1rem;"><div class="card-header"><h3>${t}</h3></div><div class="card-content">More details will appear here.</div></div>`).join('');
        }
        dashListPage.style.display='flex';
        document.body.style.overflow='hidden';
    }
    if (dashListBack) dashListBack.addEventListener('click', ()=>{ if (dashListPage) dashListPage.style.display='none'; document.body.style.overflow=''; });
    
    // Dashboard view
    function showDashboard() {
        const header = document.querySelector('.header');
        const dashboardContent = document.querySelector('.dashboard-content');
        
        header.innerHTML = `
            <div class="header-left">
                <h1>Welcome back, John!</h1>
                <p>Ready to continue your learning journey?</p>
            </div>
            <div class="header-right">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search courses, topics...">
                </div>
                <div class="notifications">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge">3</span>
                </div>
            </div>
        `;
        
        dashboardContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <div class="stat-info">
                        <h3>12</h3>
                        <p>Courses Completed</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3>48h</h3>
                        <p>Study Time</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-info">
                        <h3>8</h3>
                        <p>Achievements</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h3>85%</h3>
                        <p>Progress</p>
                    </div>
                </div>
            </div>

            <div class="content-grid">
                <div class="content-card">
                    <div class="card-header">
                        <h2>Recent Activity</h2>
                        <a href="#" class="view-all">View All</a>
                    </div>
                    <div class="activity-list">
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fas fa-play"></i>
                            </div>
                            <div class="activity-content">
                                <h4>Completed JavaScript Basics</h4>
                                <p>2 hours ago</p>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="activity-content">
                                <h4>Quiz: React Fundamentals</h4>
                                <p>Score: 95%</p>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fas fa-file"></i>
                            </div>
                            <div class="activity-content">
                                <h4>New document uploaded</h4>
                                <p>Advanced CSS Techniques</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="content-card">
                    <div class="card-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div class="quick-actions">
                        <button class="action-btn" onclick="showNotes()">
                            <i class="fas fa-plus"></i>
                            <span>New Note</span>
                        </button>
                        <button class="action-btn" onclick="showFocus()">
                            <i class="fas fa-video"></i>
                            <span>Start Focus</span>
                        </button>
                        <button class="action-btn" onclick="showQuizzes()">
                            <i class="fas fa-question"></i>
                            <span>Take Quiz</span>
                        </button>
                        <button class="action-btn" onclick="showAIMentor()">
                            <i class="fas fa-comments"></i>
                            <span>Ask AI Mentor</span>
                        </button>
                    </div>
                </div>

                <div class="content-card featured-courses">
                    <div class="card-header">
                        <h2>Featured Courses</h2>
                        <a href="#" class="view-all">View All</a>
                    </div>
                    <div class="courses-grid">
                        <div class="course-card">
                            <div class="course-image">
                                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop" alt="Web Development">
                            </div>
                            <div class="course-content">
                                <h3>Web Development</h3>
                                <p>Master HTML, CSS, and JavaScript</p>
                                <div class="course-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 75%"></div>
                                    </div>
                                    <span>75% Complete</span>
                                </div>
                            </div>
                        </div>
                        <div class="course-card">
                            <div class="course-image">
                                <img src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=200&fit=crop" alt="Data Science">
                            </div>
                            <div class="course-content">
                                <h3>Data Science</h3>
                                <p>Python, Machine Learning, Analytics</p>
                                <div class="course-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 45%"></div>
                                    </div>
                                    <span>45% Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="content-card ai-mentor">
                    <div class="card-header">
                        <h2>AI Mentor</h2>
                        <div class="status-indicator online">Online</div>
                    </div>
                    <div class="chat-container">
                        <div class="chat-messages">
                            <div class="message ai-message">
                                <div class="message-avatar">
                                    <i class="fas fa-robot"></i>
                                </div>
                                <div class="message-content">
                                    <p>Hi! I'm here to help you with your studies. What would you like to learn today?</p>
                                </div>
                            </div>
                        </div>
                        <div class="chat-input">
                            <input type="text" placeholder="Ask me anything...">
                            <button><i class="fas fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Re-attach event listeners
        attachEventListeners();
    }
    
    // Documents view
    function showDocuments() {
        const header = document.querySelector('.header');
        const dashboardContent = document.querySelector('.dashboard-content');
        
        header.innerHTML = `
            <div class="header-left">
                <h1>Documents</h1>
                <p>Manage your learning materials and resources</p>
            </div>
            <div class="header-right">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search documents...">
                </div>
                <button class="btn-primary">
                    <i class="fas fa-upload"></i>
                    Upload Document
                </button>
            </div>
        `;
        
        dashboardContent.innerHTML = `
            <div class="documents-grid">
                <div class="document-card">
                    <div class="document-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <div class="document-info">
                        <h3>JavaScript Fundamentals</h3>
                        <p>PDF • 2.4 MB • 2 days ago</p>
                    </div>
                    <div class="document-actions">
                        <button class="btn-icon"><i class="fas fa-download"></i></button>
                        <button class="btn-icon"><i class="fas fa-share"></i></button>
                        <button class="btn-icon"><i class="fas fa-ellipsis-v"></i></button>
                    </div>
                </div>
                
                <div class="document-card">
                    <div class="document-icon">
                        <i class="fas fa-file-word"></i>
                    </div>
                    <div class="document-info">
                        <h3>React Best Practices</h3>
                        <p>DOCX • 1.8 MB • 1 week ago</p>
                    </div>
                    <div class="document-actions">
                        <button class="btn-icon"><i class="fas fa-download"></i></button>
                        <button class="btn-icon"><i class="fas fa-share"></i></button>
                        <button class="btn-icon"><i class="fas fa-ellipsis-v"></i></button>
                    </div>
                </div>
                
                <div class="document-card">
                    <div class="document-icon">
                        <i class="fas fa-file-powerpoint"></i>
                    </div>
                    <div class="document-info">
                        <h3>CSS Grid Layout</h3>
                        <p>PPTX • 3.2 MB • 2 weeks ago</p>
                    </div>
                    <div class="document-actions">
                        <button class="btn-icon"><i class="fas fa-download"></i></button>
                        <button class="btn-icon"><i class="fas fa-share"></i></button>
                        <button class="btn-icon"><i class="fas fa-ellipsis-v"></i></button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // AI Mentor view
    function showAIMentor() {
        const header = document.querySelector('.header');
        const dashboardContent = document.querySelector('.dashboard-content');
        
        header.innerHTML = `
            <div class="header-left">
                <h1>AI Mentor</h1>
                <p>Get personalized help and guidance</p>
            </div>
            <div class="header-right">
                <div class="status-indicator online">Online</div>
            </div>
        `;
        
        dashboardContent.innerHTML = `
            <div class="ai-mentor-container">
                <div class="chat-interface">
                    <div class="chat-messages" id="chatMessages">
                        <div class="message ai-message">
                            <div class="message-avatar">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="message-content">
                                <p>Hello! I'm your AI mentor. I can help you with:</p>
                                <ul>
                                    <li>Explaining complex concepts</li>
                                    <li>Providing study tips</li>
                                    <li>Answering questions</li>
                                    <li>Creating study plans</li>
                                </ul>
                                <p>What would you like to learn about today?</p>
                            </div>
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" id="chatInput" placeholder="Ask me anything...">
                        <button onclick="sendMessage()"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
                
                <div class="mentor-suggestions">
                    <h3>Quick Questions</h3>
                    <div class="suggestion-buttons">
                        <button class="suggestion-btn" onclick="askQuestion('Explain JavaScript closures')">Explain JavaScript closures</button>
                        <button class="suggestion-btn" onclick="askQuestion('How do I optimize React performance?')">How do I optimize React performance?</button>
                        <button class="suggestion-btn" onclick="askQuestion('What is CSS Grid?')">What is CSS Grid?</button>
                        <button class="suggestion-btn" onclick="askQuestion('Create a study plan for web development')">Create a study plan for web development</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Quizzes view
    function showQuizzes() {
        const header = document.querySelector('.header');
        const dashboardContent = document.querySelector('.dashboard-content');
        
        header.innerHTML = `
            <div class="header-left">
                <h1>Quizzes</h1>
                <p>Test your knowledge and track progress</p>
            </div>
            <div class="header-right">
                <button class="btn-primary">
                    <i class="fas fa-plus"></i>
                    Create Quiz
                </button>
            </div>
        `;
        
        dashboardContent.innerHTML = `
            <div class="quizzes-grid">
                <div class="quiz-card">
                    <div class="quiz-header">
                        <h3>JavaScript Fundamentals</h3>
                        <span class="quiz-difficulty easy">Easy</span>
                    </div>
                    <p>Test your basic JavaScript knowledge</p>
                    <div class="quiz-stats">
                        <span><i class="fas fa-question"></i> 15 Questions</span>
                        <span><i class="fas fa-clock"></i> 20 Minutes</span>
                        <span><i class="fas fa-users"></i> 1,234 Attempts</span>
                    </div>
                    <div class="quiz-actions">
                        <button class="btn-primary">Start Quiz</button>
                        <button class="btn-secondary">Preview</button>
                    </div>
                </div>
                
                <div class="quiz-card">
                    <div class="quiz-header">
                        <h3>React Hooks</h3>
                        <span class="quiz-difficulty medium">Medium</span>
                    </div>
                    <p>Advanced React concepts and hooks</p>
                    <div class="quiz-stats">
                        <span><i class="fas fa-question"></i> 20 Questions</span>
                        <span><i class="fas fa-clock"></i> 30 Minutes</span>
                        <span><i class="fas fa-users"></i> 856 Attempts</span>
                    </div>
                    <div class="quiz-actions">
                        <button class="btn-primary">Start Quiz</button>
                        <button class="btn-secondary">Preview</button>
                    </div>
                </div>
                
                <div class="quiz-card">
                    <div class="quiz-header">
                        <h3>CSS Grid Mastery</h3>
                        <span class="quiz-difficulty hard">Hard</span>
                    </div>
                    <p>Complex CSS Grid layouts and techniques</p>
                    <div class="quiz-stats">
                        <span><i class="fas fa-question"></i> 25 Questions</span>
                        <span><i class="fas fa-clock"></i> 45 Minutes</span>
                        <span><i class="fas fa-users"></i> 432 Attempts</span>
                    </div>
                    <div class="quiz-actions">
                        <button class="btn-primary">Start Quiz</button>
                        <button class="btn-secondary">Preview</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Focus view
    function showFocus() {
        const header = document.querySelector('.header');
        const dashboardContent = document.querySelector('.dashboard-content');
        
        header.innerHTML = `
            <div class="header-left">
                <h1>Focus Mode</h1>
                <p>Stay focused and productive</p>
            </div>
            <div class="header-right">
                <div class="focus-timer">
                    <span id="timer">25:00</span>
                </div>
            </div>
        `;
        
        dashboardContent.innerHTML = `
            <div class="focus-container">
                <div class="pomodoro-timer">
                    <div class="timer-circle">
                        <div class="timer-progress" id="timerProgress"></div>
                        <div class="timer-content">
                            <span id="timerDisplay">25:00</span>
                            <p id="timerLabel">Focus Time</p>
                        </div>
                    </div>
                    <div class="timer-controls">
                        <button class="timer-btn" id="startBtn">Start</button>
                        <button class="timer-btn" id="pauseBtn">Pause</button>
                        <button class="timer-btn" id="resetBtn">Reset</button>
                    </div>
                </div>
                
                <div class="focus-settings">
                    <h3>Focus Settings</h3>
                    <div class="setting-group">
                        <label>Focus Duration (minutes)</label>
                        <input type="number" id="focusDuration" value="25" min="5" max="60">
                    </div>
                    <div class="setting-group">
                        <label>Break Duration (minutes)</label>
                        <input type="number" id="breakDuration" value="5" min="1" max="30">
                    </div>
                    <div class="setting-group">
                        <label>Long Break Duration (minutes)</label>
                        <input type="number" id="longBreakDuration" value="15" min="5" max="60">
                    </div>
                </div>
            </div>
        `;
        
        // Initialize Pomodoro timer
        initializePomodoroTimer();
    }
    
    // Labs view
    function showLabs() {
        const header = document.querySelector('.header');
        const dashboardContent = document.querySelector('.dashboard-content');
        
        header.innerHTML = `
            <div class="header-left">
                <h1>Labs</h1>
                <p>Hands-on coding practice and projects</p>
            </div>
            <div class="header-right">
                <button class="btn-primary">
                    <i class="fas fa-plus"></i>
                    New Lab
                </button>
            </div>
        `;
        
        dashboardContent.innerHTML = `
            <div class="labs-grid">
                <div class="lab-card">
                    <div class="lab-header">
                        <h3>JavaScript Calculator</h3>
                        <span class="lab-status completed">Completed</span>
                    </div>
                    <p>Build a fully functional calculator using vanilla JavaScript</p>
                    <div class="lab-tech">
                        <span class="tech-tag">JavaScript</span>
                        <span class="tech-tag">HTML</span>
                        <span class="tech-tag">CSS</span>
                    </div>
                    <div class="lab-actions">
                        <button class="btn-primary">View Code</button>
                        <button class="btn-secondary">Edit</button>
                    </div>
                </div>
                
                <div class="lab-card">
                    <div class="lab-header">
                        <h3>React Todo App</h3>
                        <span class="lab-status in-progress">In Progress</span>
                    </div>
                    <p>Create a todo application with React hooks and state management</p>
                    <div class="lab-tech">
                        <span class="tech-tag">React</span>
                        <span class="tech-tag">Hooks</span>
                        <span class="tech-tag">State</span>
                    </div>
                    <div class="lab-actions">
                        <button class="btn-primary">Continue</button>
                        <button class="btn-secondary">Reset</button>
                    </div>
                </div>
                
                <div class="lab-card">
                    <div class="lab-header">
                        <h3>CSS Grid Layout</h3>
                        <span class="lab-status not-started">Not Started</span>
                    </div>
                    <p>Design responsive layouts using CSS Grid</p>
                    <div class="lab-tech">
                        <span class="tech-tag">CSS</span>
                        <span class="tech-tag">Grid</span>
                        <span class="tech-tag">Responsive</span>
                    </div>
                    <div class="lab-actions">
                        <button class="btn-primary">Start Lab</button>
                        <button class="btn-secondary">Preview</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Social view
    function showSocial() {
        const header = document.querySelector('.header');
        const dashboardContent = document.querySelector('.dashboard-content');
        
        header.innerHTML = `
            <div class="header-left">
                <h1>Social Learning</h1>
                <p>Connect with other learners and share knowledge</p>
            </div>
            <div class="header-right">
                <button class="btn-primary">
                    <i class="fas fa-plus"></i>
                    New Post
                </button>
            </div>
        `;
        
        dashboardContent.innerHTML = `
            <div class="social-feed">
                <div class="post-card">
                    <div class="post-header">
                        <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" alt="User" class="post-avatar">
                        <div class="post-user">
                            <h4>Sarah Johnson</h4>
                            <p>2 hours ago</p>
                        </div>
                    </div>
                    <div class="post-content">
                        <p>Just completed the React Hooks course! The useState and useEffect hooks are game-changers. Anyone else working on React projects?</p>
                        <div class="post-image">
                            <img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop" alt="React Code">
                        </div>
                    </div>
                    <div class="post-actions">
                        <button class="post-action"><i class="fas fa-heart"></i> 24</button>
                        <button class="post-action"><i class="fas fa-comment"></i> 8</button>
                        <button class="post-action"><i class="fas fa-share"></i> Share</button>
                    </div>
                </div>
                
                <div class="post-card">
                    <div class="post-header">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" alt="User" class="post-avatar">
                        <div class="post-user">
                            <h4>Mike Chen</h4>
                            <p>5 hours ago</p>
                        </div>
                    </div>
                    <div class="post-content">
                        <p>CSS Grid vs Flexbox - when to use which? Here's my cheat sheet:</p>
                        <div class="post-code">
                            <pre><code>/* CSS Grid for 2D layouts */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: auto 1fr auto;
}

/* Flexbox for 1D layouts */
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}</code></pre>
                        </div>
                    </div>
                    <div class="post-actions">
                        <button class="post-action"><i class="fas fa-heart"></i> 42</button>
                        <button class="post-action"><i class="fas fa-comment"></i> 15</button>
                        <button class="post-action"><i class="fas fa-share"></i> Share</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Notes view
    function showNotes() {
        const header = document.querySelector('.header');
        const dashboardContent = document.querySelector('.dashboard-content');
        
        header.innerHTML = `
            <div class="header-left">
                <h1>Notes</h1>
                <p>Capture your thoughts and learning insights</p>
            </div>
            <div class="header-right">
                <button class="btn-primary" onclick="createNewNote()">
                    <i class="fas fa-plus"></i>
                    New Note
                </button>
            </div>
        `;
        
        dashboardContent.innerHTML = `
            <div class="notes-container">
                <div class="notes-sidebar">
                    <div class="notes-search">
                        <input type="text" placeholder="Search notes...">
                    </div>
                    <div class="notes-list">
                        <div class="note-item active">
                            <h4>JavaScript Closures</h4>
                            <p>Understanding how closures work in JavaScript...</p>
                            <span class="note-date">Today</span>
                        </div>
                        <div class="note-item">
                            <h4>React State Management</h4>
                            <p>Best practices for managing state in React...</p>
                            <span class="note-date">Yesterday</span>
                        </div>
                        <div class="note-item">
                            <h4>CSS Grid Layout</h4>
                            <p>Complete guide to CSS Grid properties...</p>
                            <span class="note-date">2 days ago</span>
                        </div>
                    </div>
                </div>
                
                <div class="notes-editor">
                    <div class="editor-toolbar">
                        <button class="toolbar-btn"><i class="fas fa-bold"></i></button>
                        <button class="toolbar-btn"><i class="fas fa-italic"></i></button>
                        <button class="toolbar-btn"><i class="fas fa-underline"></i></button>
                        <button class="toolbar-btn"><i class="fas fa-list-ul"></i></button>
                        <button class="toolbar-btn"><i class="fas fa-list-ol"></i></button>
                    </div>
                    <div class="editor-content">
                        <input type="text" placeholder="Note title..." class="note-title">
                        <textarea placeholder="Start writing your note..." class="note-body"></textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Attach event listeners
    function attachEventListeners() {
        // Search functionality
        const searchInputs = document.querySelectorAll('.search-box input');
        searchInputs.forEach(input => {
            input.addEventListener('input', function() {
                // Implement search functionality
                console.log('Searching for:', this.value);
            });
        });
        
        // Notification click
        const notifications = document.querySelectorAll('.notifications');
        notifications.forEach(notification => {
            notification.addEventListener('click', function() {
                alert('You have 3 new notifications!');
            });
        });
        
        // Action buttons
        const actionBtns = document.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.querySelector('span').textContent;
                alert(`Action: ${action}`);
            });
        });
    }
    
    // Initialize the dashboard
    showDashboard();
});

// Global functions for specific features
function sendMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    
    if (input.value.trim()) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${input.value}</p>
            </div>
        `;
        
        messages.appendChild(messageDiv);
        input.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            const aiResponse = document.createElement('div');
            aiResponse.className = 'message ai-message';
            aiResponse.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>That's a great question! Let me help you understand that concept better.</p>
                </div>
            `;
            messages.appendChild(aiResponse);
            messages.scrollTop = messages.scrollHeight;
        }, 1000);
        
        messages.scrollTop = messages.scrollHeight;
    }
}

function askQuestion(question) {
    const input = document.getElementById('chatInput');
    input.value = question;
    sendMessage();
}

function createNewNote() {
    alert('Creating a new note...');
}

// Pomodoro Timer functionality
let pomodoroTimer;
let isRunning = false;
let currentTime = 25 * 60; // 25 minutes in seconds
let isBreak = false;

function initializePomodoroTimer() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerLabel = document.getElementById('timerLabel');
    const timerProgress = document.getElementById('timerProgress');
    
    if (startBtn) {
        startBtn.addEventListener('click', startTimer);
        pauseBtn.addEventListener('click', pauseTimer);
        resetBtn.addEventListener('click', resetTimer);
        
        updateTimerDisplay();
    }
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        pomodoroTimer = setInterval(updateTimer, 1000);
    }
}

function pauseTimer() {
    isRunning = false;
    clearInterval(pomodoroTimer);
}

function resetTimer() {
    isRunning = false;
    clearInterval(pomodoroTimer);
    currentTime = 25 * 60;
    isBreak = false;
    updateTimerDisplay();
}

function updateTimer() {
    currentTime--;
    updateTimerDisplay();
    
    if (currentTime <= 0) {
        if (isBreak) {
            // Break finished, start focus time
            currentTime = 25 * 60;
            isBreak = false;
            document.getElementById('timerLabel').textContent = 'Focus Time';
        } else {
            // Focus time finished, start break
            currentTime = 5 * 60;
            isBreak = true;
            document.getElementById('timerLabel').textContent = 'Break Time';
        }
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = display;
    }
    
    const timer = document.getElementById('timer');
    if (timer) {
        timer.textContent = display;
    }
    
    // Update progress circle
    const totalTime = isBreak ? 5 * 60 : 25 * 60;
    const progress = ((totalTime - currentTime) / totalTime) * 100;
    const timerProgress = document.getElementById('timerProgress');
    if (timerProgress) {
        timerProgress.style.strokeDashoffset = 440 - (440 * progress) / 100;
    }
}
