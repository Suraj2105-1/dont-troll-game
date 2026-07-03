// ============================================================
//  auth.js – Don't Troll Game  |  Login / Signup logic
// ============================================================

/* ── Floating pixel world ── */
(function createPixelWorld() {
    const container = document.getElementById('pixelWorld');
    if (!container) return;
    const types = ['block', 'block', 'block', 'spike', 'coin', 'coin', 'block', 'coin'];
    for (let i = 0; i < 14; i++) {
        const el = document.createElement('div');
        const type = types[Math.floor(Math.random() * types.length)];
        el.className = `pixel-block ${type}`;
        el.style.left            = Math.random() * 90 + 5 + '%';
        el.style.top             = Math.random() * 80 + 5 + '%';
        el.style.animationDelay  = Math.random() * 6 + 's';
        el.style.animationDuration = (4 + Math.random() * 4) + 's';
        container.appendChild(el);
    }
})();

/* ── Tab Switching ── */
function switchTab(tab) {
    const loginForm  = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabLogin   = document.getElementById('tab-login');
    const tabSignup  = document.getElementById('tab-signup');
    const footer     = document.getElementById('footerText');

    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        footer.innerHTML = 'New Player? <a href="#" onclick="switchTab(\'signup\'); return false;">Insert Coin</a>';
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        footer.innerHTML = 'Have a Save? <a href="#" onclick="switchTab(\'login\'); return false;">Load Game</a>';
        // Animate XP bar in on switch
        setTimeout(() => {
            const fill = document.getElementById('levelFill');
            if (fill) fill.style.width = '15%';
        }, 300);
    }
}

/* ── Password toggle ── */
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁';
    }
}

/* ── Password strength → XP bar ── */
function checkStrength(password) {
    const fill  = document.getElementById('levelFill');
    const value = document.getElementById('levelValue');
    if (!fill) return;

    let xp = 0;
    if (password.length >= 8)                               xp += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) xp += 25;
    if (password.match(/[0-9]/))                            xp += 25;
    if (password.match(/[^a-zA-Z0-9]/))                    xp += 25;

    const display = Math.max(15, xp);
    fill.style.width  = display + '%';
    if (value) value.textContent = xp + ' / 100 XP';
}

/* ── Toast notification ── */
function showToast(message, type = 'success') {
    const toast   = document.getElementById('toast');
    const msgEl   = document.getElementById('toastMessage');
    const iconEl  = document.getElementById('toastIcon');
    if (!toast) return;

    msgEl.textContent  = message;
    iconEl.textContent = type === 'success' ? '▶' : '✖';
    toast.className    = 'toast ' + type;
    toast.classList.add('show');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ── Field validation helpers ── */
function setError(inputId, errId, show) {
    const input = document.getElementById(inputId);
    const err   = document.getElementById(errId);
    if (!input || !err) return;
    if (show) {
        input.classList.add('error');
        err.classList.add('visible');
    } else {
        input.classList.remove('error');
        err.classList.remove('visible');
    }
}

function clearErrors(...ids) {
    ids.forEach(([inp, err]) => setError(inp, err, false));
}

/* ── Login form handler ── */
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Client-side validation
    let valid = true;
    clearErrors(['loginUsername', 'loginUsernameErr'], ['loginPassword', 'loginPasswordErr']);
    if (!username) { setError('loginUsername', 'loginUsernameErr', true); valid = false; }
    if (!password) { setError('loginPassword', 'loginPasswordErr', true); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = '► LOADING...';
    showToast('LOADING SAVE DATA...', 'success');

    try {
        const res  = await fetch('/api/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            // Persist session
            if (document.getElementById('rememberMe').checked) {
                localStorage.setItem('dt_user', JSON.stringify({ username: data.username }));
            } else {
                sessionStorage.setItem('dt_user', JSON.stringify({ username: data.username }));
            }
            showToast('WELCOME BACK, ' + data.username.toUpperCase() + '!', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        } else {
            showToast(data.error || 'INVALID CREDENTIALS!', 'error');
            setError('loginUsername', 'loginUsernameErr', true);
            setError('loginPassword', 'loginPasswordErr', true);
            document.getElementById('loginUsernameErr').textContent = data.error || 'Invalid credentials';
            document.getElementById('loginPasswordErr').textContent = '';
        }
    } catch (err) {
        showToast('SERVER ERROR – TRY AGAIN!', 'error');
        console.error('Login error:', err);
    } finally {
        btn.disabled = false;
        btn.textContent = '► START GAME';
    }
}

/* ── Signup form handler ── */
async function handleSignup(e) {
    e.preventDefault();

    const username = document.getElementById('signupUsername').value.trim();
    const email    = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const agreed   = document.getElementById('termsAgree').checked;

    // Client-side validation
    let valid = true;
    clearErrors(
        ['signupUsername', 'signupUsernameErr'],
        ['signupEmail',    'signupEmailErr'],
        ['signupPassword', 'signupPasswordErr']
    );

    if (!username || username.length < 3) {
        setError('signupUsername', 'signupUsernameErr', true);
        valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('signupEmail', 'signupEmailErr', true);
        valid = false;
    }
    if (!password || password.length < 8) {
        setError('signupPassword', 'signupPasswordErr', true);
        valid = false;
    }
    if (!agreed) {
        showToast('ACCEPT THE TRAPS FIRST!', 'error');
        valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('signupBtn');
    btn.disabled = true;
    btn.textContent = '► CREATING...';
    showToast('CREATING NEW SAVE...', 'success');

    try {
        const res  = await fetch('/api/signup', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ username, email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            sessionStorage.setItem('dt_user', JSON.stringify({ username: data.username }));
            showToast('SAVE CREATED! GOOD LUCK!', 'success');
            // Animate XP bar to full before redirect
            const fill = document.getElementById('levelFill');
            if (fill) fill.style.width = '100%';
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            showToast((data && data.error) || 'SIGNUP FAILED!', 'error');
        }
    } catch (err) {
        // Server unreachable – save as guest and go to game anyway
        console.warn('Signup fetch failed, redirecting as guest:', err);
        sessionStorage.setItem('dt_user', JSON.stringify({ username }));
        showToast('GOING IN AS GUEST – GOOD LUCK!', 'success');
        const fill = document.getElementById('levelFill');
        if (fill) fill.style.width = '100%';
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    } finally {
        btn.disabled = false;
        btn.textContent = '► CREATE SAVE';
    }
}

/* ── Social auth placeholder ── */
function socialAuth(provider) {
    showToast('CONNECTING TO ' + provider.toUpperCase() + '...', 'success');
}

/* ── Auto-fill username from storage (if remembered) ── */
(function prefillUsername() {
    const stored = localStorage.getItem('dt_user') || sessionStorage.getItem('dt_user');
    if (!stored) return;
    try {
        const user  = JSON.parse(stored);
        const input = document.getElementById('loginUsername');
        if (input && user.username) input.value = user.username;
    } catch (_) {}
})();
