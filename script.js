// ==========================================
// 1. SUPABASE CONFIGURATIE (VUL JOUW GEGEVENS IN)
// ==========================================
const SUPABASE_URL = "https://mdkjdahusnptqjqooias.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ka2pkYWh1c25wdHFqcW9vaWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDI0NDcsImV4cCI6MjEwMDExODQ0N30.efOjZEUz__E0cVKy4GnBH1lMlWAiHF2E_GbyjaEGGjg";

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const DEFAULT_SETTINGS = {
    showAdminNav: false,
    showJoinTeam: false,
    adminPassword: "RoanStudio2026!"
};

const DEFAULT_PORTFOLIO = [
    {
        id: "default-1",
        title: "HetIsRoan Studio's Platform",
        desc_text: "Het officiële platform van HetIsRoan Studio's. Volledig custom ontwikkeld met schone HTML, CSS en JavaScript.",
        tags: ["HTML5", "CSS3", "JavaScript"],
        url: "index.html"
    }
];

// ==========================================
// 2. CENTRALE INSTELLINGEN (SUPABASE)
// ==========================================
async function getSettings() {
    if (!supabaseClient) return DEFAULT_SETTINGS;
    try {
        const { data, error } = await supabaseClient.from('settings').select('*').eq('id', 'main').single();
        if (error || !data) return DEFAULT_SETTINGS;
        return {
            showAdminNav: data.show_admin_nav,
            showJoinTeam: data.show_join_team,
            adminPassword: data.admin_password || DEFAULT_SETTINGS.adminPassword
        };
    } catch (e) {
        return DEFAULT_SETTINGS;
    }
}

async function saveSettings(newSettings) {
    if (!supabaseClient) return;
    await supabaseClient.from('settings').update({
        show_admin_nav: newSettings.showAdminNav,
        show_join_team: newSettings.showJoinTeam
    }).eq('id', 'main');

    await applyVisibilitySettings();
}

// ==========================================
// 3. DYNAMISCHE MENU ZICHTBAARHEID
// ==========================================
async function applyVisibilitySettings() {
    const settings = await getSettings();

    document.querySelectorAll('.admin-link-item').forEach(el => {
        el.style.display = settings.showAdminNav ? 'inline-block' : 'none';
    });

    document.querySelectorAll('.join-team-nav').forEach(el => {
        el.style.display = settings.showJoinTeam ? 'inline-block' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await applyVisibilitySettings();
    initTheme();
    initAdminProtection();
    renderPortfolioPage();
});

// ==========================================
// 4. ADMIN BEVEILIGING & LOGIN
// ==========================================
async function initAdminProtection() {
    const adminContainer = document.getElementById('admin-protected-content');
    const loginOverlay = document.getElementById('admin-login-overlay');

    if (!adminContainer || !loginOverlay) return;

    const sessionAuth = sessionStorage.getItem('roan_admin_authenticated');

    if (sessionAuth === 'true') {
        showAdminContent();
    } else {
        loginOverlay.style.display = 'flex';
        adminContainer.style.display = 'none';
    }

    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const inputPass = document.getElementById('admin-pass-input').value.trim();
            const currentSettings = await getSettings();

            if (inputPass === currentSettings.adminPassword || inputPass === DEFAULT_SETTINGS.adminPassword) {
                sessionStorage.setItem('roan_admin_authenticated', 'true');
                showAdminContent();
            } else {
                alert('❌ Onjuist wachtwoord! Probeer opnieuw.');
            }
        };
    }
}

function showAdminContent() {
    const adminContainer = document.getElementById('admin-protected-content');
    const loginOverlay = document.getElementById('admin-login-overlay');

    if (loginOverlay) loginOverlay.style.display = 'none';
    if (adminContainer) adminContainer.style.display = 'block';

    setTimeout(() => {
        renderAdminDashboard();
        setupAdminEvents();
    }, 50);
}

function logoutAdmin() {
    sessionStorage.removeItem('roan_admin_authenticated');
    window.location.reload();
}

// ==========================================
// 5. THEMA & MOBIEL MENU
// ==========================================
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('hetisroan_theme') || 'dark-mode';

    body.className = savedTheme;
    if (themeToggleBtn) {
        themeToggleBtn.textContent = savedTheme === 'light-mode' ? '🌙 Dark' : '☀️ Light';
        themeToggleBtn.addEventListener('click', () => {
            if (body.classList.contains('dark-mode')) {
                body.classList.replace('dark-mode', 'light-mode');
                localStorage.setItem('hetisroan_theme', 'light-mode');
                themeToggleBtn.textContent = '🌙 Dark';
            } else {
                body.classList.replace('light-mode', 'dark-mode');
                localStorage.setItem('hetisroan_theme', 'dark-mode');
                themeToggleBtn.textContent = '☀️ Light';
            }
        });
    }
}

// ==========================================
// 6. FORMULIEREN (VERSTUREN NAAR SUPABASE)
// ==========================================
const requestForm = document.getElementById('request-form');
if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newRequest = {
            id: Date.now(),
            name: document.getElementById('req-name').value,
            email: document.getElementById('req-email').value,
            type: document.getElementById('req-type').value,
            details: document.getElementById('req-details').value,
            allow_portfolio: document.getElementById('req-portfolio-permission').checked
        };

        if (supabaseClient) {
            const { error } = await supabaseClient.from('requests').insert([newRequest]);
            if (error) {
                alert('Er is iets misgegaan bij het versturen.');
                console.error(error);
                return;
            }
        }

        alert(`Bedankt ${newRequest.name}! Je aanvraag is opgeslagen.`);
        requestForm.reset();
    });
}

const applyForm = document.getElementById('apply-form');
if (applyForm) {
    applyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const checkedSkills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value);
        if (checkedSkills.length === 0) {
            alert('Selecteer a.u.b. ten minste 1 vaardigheid.');
            return;
        }

        const newApp = {
            id: Date.now(),
            name: document.getElementById('apply-name').value,
            email: document.getElementById('apply-email').value,
            skills: checkedSkills.join(', '),
            experience: document.getElementById('apply-experience').value,
            code: document.getElementById('apply-code').value || 'Geen extra code meegegeven'
        };

        if (supabaseClient) {
            const { error } = await supabaseClient.from('applications').insert([newApp]);
            if (error) {
                alert('Er is iets misgegaan bij het versturen.');
                console.error(error);
                return;
            }
        }

        alert(`Bedankt ${newApp.name}! Je sollicitatie is ontvangen.`);
        applyForm.reset();
    });
}

// ==========================================
// 7. ADMIN DASHBOARD RENDEREN
// ==========================================
function setupAdminEvents() {
    const btnSaveToggles = document.getElementById('btn-save-toggles');
    if (btnSaveToggles) {
        btnSaveToggles.onclick = async () => {
            const updated = {
                showAdminNav: document.getElementById('toggle-admin-nav').checked,
                showJoinTeam: document.getElementById('toggle-join-team').checked
            };
            await saveSettings(updated);
            alert('⚙️ Instellingen live opgeslagen op alle apparaten!');
        };
    }
}

async function renderAdminDashboard() {
    const requestsList = document.getElementById('requests-list');
    const applicationsList = document.getElementById('applications-list');
    const countReqEl = document.getElementById('count-requests');
    const countAppEl = document.getElementById('count-applications');

    if (!requestsList || !applicationsList || !supabaseClient) return;

    const settings = await getSettings();

    const toggleAdmin = document.getElementById('toggle-admin-nav');
    const toggleJoin = document.getElementById('toggle-join-team');
    if (toggleAdmin) toggleAdmin.checked = settings.showAdminNav;
    if (toggleJoin) toggleJoin.checked = settings.showJoinTeam;

    const { data: requests } = await supabaseClient.from('requests').select('*').order('created_at', { ascending: false });
    const { data: applications } = await supabaseClient.from('applications').select('*').order('created_at', { ascending: false });

    const reqList = requests || [];
    const appList = applications || [];

    if (countReqEl) countReqEl.textContent = reqList.length;
    if (countAppEl) countAppEl.textContent = appList.length;

    // Render Aanvragen
    requestsList.innerHTML = reqList.length === 0
        ? '<p style="color: var(--text-secondary);">Geen aanvragen ontvangen.</p>'
        : reqList.map((r, index) => `
            <div class="admin-card-item" onclick="openDetailModal('request', ${r.id})">
                <div>
                    <div style="font-weight:700;">📩 Aanvraag #${index + 1} - ${escapeHTML(r.name)}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary);">Type: ${escapeHTML(r.type)} | Portfolio Permissie: ${r.allow_portfolio ? '✅ Ja' : '❌ Nee'}</div>
                </div>
                <div style="font-size:0.85rem; color:var(--text-secondary);">&rarr;</div>
            </div>
        `).join('');

    // Render Sollicitaties
    applicationsList.innerHTML = appList.length === 0
        ? '<p style="color: var(--text-secondary);">Geen sollicitaties ontvangen.</p>'
        : appList.map((a, index) => `
            <div class="admin-card-item" onclick="openDetailModal('application', ${a.id})">
                <div>
                    <div style="font-weight:700;">👨‍💻 Sollicitatie #${index + 1} - ${escapeHTML(a.name)}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary);">Skills: ${escapeHTML(a.skills)}</div>
                </div>
                <div style="font-size:0.85rem; color:var(--text-secondary);">&rarr;</div>
            </div>
        `).join('');
}

// Modal voor details
async function openDetailModal(type, id) {
    const modal = document.getElementById('detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    const portfolioBox = document.getElementById('modal-portfolio-box');

    if (!modal || !supabaseClient) return;

    if (type === 'request') {
        const { data: req } = await supabaseClient.from('requests').select('*').eq('id', id).single();
        if (!req) return;

        modalTitle.textContent = `📩 Aanvraag Details`;
        modalContent.innerHTML = `
            <p><strong>Naam:</strong> ${escapeHTML(req.name)}</p>
            <p><strong>E-mailadres:</strong> ${escapeHTML(req.email)}</p>
            <p><strong>Soort Website:</strong> ${escapeHTML(req.type)}</p>
            <p><strong>Toestemming Portfolio:</strong> ${req.allow_portfolio ? '✅ Ja, mag op portfolio' : '❌ Nee, liever niet'}</p>
            <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">
            <p><strong>Wensen & Inhoud:</strong></p>
            <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color); font-size:0.9rem;">
                ${escapeHTML(req.details)}
            </div>
        `;

        if (portfolioBox) {
            portfolioBox.style.display = 'block';
            document.getElementById('port-title').value = req.type + " - " + req.name;
            document.getElementById('port-url').value = "";
            document.getElementById('port-desc').value = req.details;
            document.getElementById('port-tags').value = "HTML5, CSS3, JavaScript";

            document.getElementById('btn-submit-to-portfolio').onclick = async () => {
                const title = document.getElementById('port-title').value.trim();
                const desc = document.getElementById('port-desc').value.trim();
                const url = document.getElementById('port-url').value.trim() || "#";
                const tagsRaw = document.getElementById('port-tags').value.trim();

                if (!title || !desc) {
                    alert('⚠️ Vul ten minste de titel en beschrijving in om het project te plaatsen.');
                    return;
                }

                const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : ["Custom Web"];

                const newProject = {
                    id: Date.now(),
                    title: title,
                    desc_text: desc,
                    tags: tags,
                    url: url
                };

                await supabaseClient.from('portfolio_projects').insert([newProject]);
                alert('🎉 Project succesvol op de portfolio pagina geplaatst!');
                closeModal();
                renderPortfolioPage();
            };
        }

        modalDeleteBtn.onclick = () => deleteItem('request', id);

    } else {
        if (portfolioBox) portfolioBox.style.display = 'none';

        const { data: app } = await supabaseClient.from('applications').select('*').eq('id', id).single();
        if (!app) return;

        modalTitle.textContent = `👨‍💻 Sollicitatie Details`;
        modalContent.innerHTML = `
            <p><strong>Naam:</strong> ${escapeHTML(app.name)}</p>
            <p><strong>E-mailadres:</strong> ${escapeHTML(app.email)}</p>
            <p><strong>Vaardigheden:</strong> ${escapeHTML(app.skills)}</p>
            <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">
            <p><strong>Motivatie & Ervaring:</strong></p>
            <p style="background:var(--bg-color); padding:10px; border-radius:8px; border:1px solid var(--border-color);">${escapeHTML(app.experience)}</p>
        `;

        modalDeleteBtn.onclick = () => deleteItem('application', id);
    }

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) modal.style.display = 'none';
}

async function deleteItem(type, id) {
    if (!confirm('Weet je zeker dat je dit wilt verwijderen?')) return;

    if (type === 'request') {
        await supabaseClient.from('requests').delete().eq('id', id);
    } else {
        await supabaseClient.from('applications').delete().eq('id', id);
    }

    closeModal();
    renderAdminDashboard();
}

// ==========================================
// 8. PORTFOLIO PAGINA RENDEREN
// ==========================================
async function renderPortfolioPage() {
    const container = document.getElementById('portfolio-container');
    if (!container) return;

    let customProjects = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('portfolio_projects').select('*').order('created_at', { ascending: false });
        if (data) customProjects = data;
    }

    const allProjects = [...DEFAULT_PORTFOLIO, ...customProjects];

    container.innerHTML = allProjects.map(proj => `
        <div class="card" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; align-items: center;">
            <div style="background: var(--bg-card-hover); border: 1px solid var(--border-color); border-radius: 10px; padding: 25px; text-align: center;">
                <img src="logo.png" alt="Logo" style="max-width: 90px; margin-bottom: 15px;">
                <h3>${escapeHTML(proj.title)}</h3>
                <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-top: 12px;">
                    ${(proj.tags || []).map(t => `<span class="badge" style="margin:0;">${escapeHTML(t)}</span>`).join('')}
                </div>
            </div>
            <div>
                <h2>${escapeHTML(proj.title)}</h2>
                <p style="color: var(--text-secondary); margin: 15px 0 20px 0;">${escapeHTML(proj.desc_text || proj.desc)}</p>
                <a href="${escapeHTML(proj.url)}" target="${proj.url.startsWith('http') ? '_blank' : '_self'}" class="btn btn-primary">🌐 Bekijk Live Website</a>
            </div>
        </div>
    `).join('');
}

function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}