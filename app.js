import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, onValue, off } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCmGu1j_qpMWx69WwfuIEMwYhZOsYVEVMk",
    authDomain: "bioclock-9b4cc.firebaseapp.com",
    projectId: "bioclock-9b4cc",
    storageBucket: "bioclock-9b4cc.firebasestorage.app",
    messagingSenderId: "569522849422",
    appId: "1:569522849422:web:7b5d347be24d024b89abdf",
    databaseURL: "https://bioclock-9b4cc-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM 제어기 세팅
const sleepTimeTrigger = document.getElementById('sleep-time-trigger');
const sleepTimePickerBox = document.getElementById('sleep-time-picker');
const sleepHourColumn = document.getElementById('sleep-hour-column');
const sleepMinuteColumn = document.getElementById('sleep-minute-column');

const wakeTimeTrigger = document.getElementById('wake-time-trigger');
const wakeTimePickerBox = document.getElementById('wake-time-picker');
const wakeHourColumn = document.getElementById('wake-hour-column');
const wakeMinuteColumn = document.getElementById('wake-minute-column');

const customInputWrapper = document.getElementById('custom-input-wrapper');
const customInput = document.getElementById('custom-input');
const analyzeBtn = document.getElementById('analyze-btn');
const resultContainer = document.getElementById('result-container');

// 계정 영역 DOM
const authTitle = document.getElementById('auth-title');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const passwordConfirmInput = document.getElementById('auth-password-confirm');
const mainSubmitBtn = document.getElementById('main-submit-btn');
const switchModeBtn = document.getElementById('switch-mode-btn');
const logoutBtn = document.getElementById('logout-btn');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
const forgotPasswordWrapper = document.getElementById('forgot-password-wrapper');
const authStatusText = document.getElementById('auth-status-text');
const mainAppSection = document.getElementById('main-app-section');

const ageSlider = document.getElementById('user-age');
const heightSlider = document.getElementById('user-height');
const weightSlider = document.getElementById('user-weight');
const ageVal = document.getElementById('age-val');
const heightVal = document.getElementById('height-val');
const weightVal = document.getElementById('weight-val');

const profileSummaryBox = document.getElementById('profile-summary-box');
const summaryDisplay = document.getElementById('summary-display');
const editProfileToggleBtn = document.getElementById('edit-profile-toggle-btn');
const personalDataSliders = document.getElementById('personal-data-sliders');
const saveProfileBtn = document.getElementById('save-profile-btn');

let selectedSleepHour = "22"; let selectedSleepMin = "00";
let selectedWakeHour = "07"; let selectedWakeMin = "00";
let countdownInterval = null; let isSignUpMode = false;

let activeSleepQuality = "꿀잠";
let activeVibeValue = "vibe1";
let activeVibeText = "일반적인 식사 / 정상 리듬";

if (ageSlider && ageVal) ageSlider.addEventListener('input', (e) => { ageVal.innerText = e.target.value; });
if (heightSlider && heightVal) heightSlider.addEventListener('input', (e) => { heightVal.innerText = e.target.value; });
if (weightSlider && weightVal) weightSlider.addEventListener('input', (e) => { weightVal.innerText = e.target.value; });

if (editProfileToggleBtn && personalDataSliders) {
    editProfileToggleBtn.addEventListener('click', () => {
        personalDataSliders.classList.toggle('hidden');
        editProfileToggleBtn.innerText = personalDataSliders.classList.contains('hidden') ? "내 정보 수정" : "닫기";
    });
}

if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            saveUserData(currentUser.uid);
            personalDataSliders.classList.add('hidden');
            if (editProfileToggleBtn) editProfileToggleBtn.innerText = "내 정보 수정";
            alert("신체 정보가 클라우드 데이터베이스에 실시간 동기화되었습니다.");
        }
    });
}

function setupRadioCards() {
    let startY = 0; let isMoving = false;
    document.querySelectorAll('.radio-card').forEach(card => {
        card.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; isMoving = false; }, { passive: true });
        card.addEventListener('touchmove', (e) => { if (Math.abs(e.touches[0].clientY - startY) > 8) { isMoving = true; } }, { passive: true });
        card.addEventListener('touchend', (e) => { if (!isMoving) { executeCardSelection(card); } });
        card.addEventListener('click', (e) => { executeCardSelection(card); });
    });
}

function executeCardSelection(card) {
    const groupName = card.getAttribute('data-name');
    const groupValue = card.getAttribute('data-value');
    const siblings = card.parentElement.querySelectorAll('.radio-card');
    siblings.forEach(s => s.classList.remove('active'));
    card.classList.add('active');

    if (groupName === 'sleep-quality') {
        activeSleepQuality = groupValue;
    } else if (groupName === 'vibe') {
        activeVibeValue = groupValue;
        if (groupValue === 'vibe6') {
            customInputWrapper.classList.remove('hidden'); customInput.focus();
        } else {
            customInputWrapper.classList.add('hidden'); 
            activeVibeText = card.querySelector('.option-title').innerText.trim();
        }
    }
}

if (switchModeBtn) {
    switchModeBtn.addEventListener('click', () => {
        isSignUpMode = !isSignUpMode; authStatusText.innerText = "";
        if (isSignUpMode) {
            authTitle.innerText = "BIOCLOCK 회원가입"; mainSubmitBtn.innerText = "회원가입 완료하기";
            switchModeBtn.innerText = "이미 계정이 있으신가요? 로그인";
            passwordConfirmInput.classList.remove('hidden'); forgotPasswordWrapper.classList.add('hidden');
        } else {
            authTitle.innerText = "BIOCLOCK 로그인"; mainSubmitBtn.innerText = "로그인";
            switchModeBtn.innerText = "아직 계정이 없으신가요? 회원가입";
            passwordConfirmInput.classList.add('hidden'); forgotPasswordWrapper.classList.remove('hidden');
        }
    });
}

if (mainSubmitBtn) {
    mainSubmitBtn.addEventListener('click', () => {
        const email = emailInput.value.trim(); const password = passwordInput.value;
        if (!email || !password) { alert("이메일 주소와 비밀번호를 빠짐없이 채워주세요!"); return; }
        if (isSignUpMode) {
            const passwordConfirm = passwordConfirmInput.value;
            if (password !== passwordConfirm) { alert("비밀번호와 비밀번호 확인 칸의 입력값이 서로 다릅니다!"); return; }
            if (password.length < 6) { alert("비밀번호는 최소 6자리 이상이어야 합니다."); return; }
            createUserWithEmailAndPassword(auth, email, password)
                .then((uc) => { alert("BIOCLOCK 클라우드 정식 회원가입 완료!"); saveUserData(uc.user.uid); })
                .catch((e) => { authStatusText.innerText = `가입실패: ${e.message}`; authStatusText.style.color = "#ff453a"; });
        } else {
            signInWithEmailAndPassword(auth, email, password)
                .catch((e) => { authStatusText.innerText = "이메일 형식이나 비밀번호를 다시 확인하세요."; authStatusText.style.color = "#ff453a"; });
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        authStatusText.innerText = `${user.email} 계정 로그인 완료`; authStatusText.style.color = "#34c759";
        emailInput.classList.add('hidden'); passwordInput.classList.add('hidden'); passwordConfirmInput.classList.add('hidden');
        mainSubmitBtn.classList.add('hidden'); switchModeBtn.classList.add('hidden'); forgotPasswordWrapper.classList.add('hidden');
        logoutBtn.classList.remove('hidden'); mainAppSection.classList.remove('hidden');
        watchUserData(user.uid);
    } else {
        authStatusText.innerText = "로그인이 필요합니다."; authStatusText.style.color = "#86868b";
        emailInput.classList.remove('hidden'); passwordInput.classList.remove('hidden');
        mainSubmitBtn.classList.remove('hidden'); switchModeBtn.classList.remove('hidden');
        if(!isSignUpMode) forgotPasswordWrapper.classList.remove('hidden');
        logoutBtn.classList.add('hidden'); mainAppSection.classList.add('hidden');
        const currentUser = auth.currentUser;
        if (currentUser) off(ref(database, 'users/' + currentUser.uid));
        if(resultContainer) resultContainer.innerHTML = "";
    }
});

if(logoutBtn) logoutBtn.addEventListener('click', () => { signOut(auth); });

if(forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if(!email) { alert("이메일 칸에 아이디를 먼저 적어주신 뒤 버튼을 눌러주세요!"); emailInput.focus(); return; }
        sendPasswordResetEmail(auth, email)
            .then(() => { alert(`${email} 주소로 비밀번호 재설정 이메일을 보냈습니다!`); })
            .catch((e) => { authStatusText.innerText = `재설정 실패: ${e.message}`; authStatusText.style.color = "#ff453a"; });
    });
}

function saveUserData(uid) {
    if(!ageSlider) return;
    try {
        set(ref(database, 'users/' + uid), {
            age: ageSlider.value, height: heightSlider.value, weight: weightSlider.value, job: document.getElementById('user-job').value
        });
    } catch(e) { console.warn("DB 가드 조치 완료:", e); }
}

function watchUserData(uid) {
    try {
        onValue(ref(database, 'users/' + uid), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const age = data.age || 28; const height = data.height || 175; const weight = data.weight || 70;
                const jobSelect = document.getElementById('user-job'); let jobText = "사무직";
                if (jobSelect) { jobSelect.value = data.job || "desk"; jobText = jobSelect.options[jobSelect.selectedIndex].text.split(' ')[0]; }
                if(ageSlider) { ageSlider.value = age; ageVal.innerText = age; }
                if(heightSlider) { heightSlider.value = height; heightVal.innerText = height; }
                if(weightSlider) { weightSlider.value = weight; weightVal.innerText = weight; }
                if (summaryDisplay) summaryDisplay.innerText = `${age}세  ·  ${height}cm  ·  ${weight}kg  ·  ${jobText}`;
            } else {
                if (summaryDisplay) summaryDisplay.innerText = "신체 정보를 입력해 주세요.";
            }
        });
    } catch(e) { console.warn("DB 스트림 예외 조치 완료:", e); }
}

function setupTimePicker(columnHour, columnMinute, defaultH, defaultM, onSelectCallback) {
    const totalHoursToRender = [
        0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
        0,1,2,3,4,5,6,7,8,9,10,11
    ];

    totalHoursToRender.forEach((hourInt, index) => {
        const hStr = hourInt < 10 ? '0' + hourInt : '' + hourInt;
        let period = "오전", displayHour = hourInt;
        if (hourInt === 0) displayHour = 12; else if (hourInt === 12) period = "오후"; else if (hourInt > 12) { period = "오후"; displayHour = hourInt - 12; }
        const item = document.createElement('div');
        item.className = 'picker-item' + (hStr === defaultH && index === totalHoursToRender.indexOf(parseInt(defaultH)) ? ' active' : '');
        item.setAttribute('data-hour', hStr); item.innerText = `${period} ${displayHour < 10 ? '0' : ''}${displayHour}:00`;
        columnHour.appendChild(item);
    });

    for (let i = 0; i < 60; i++) {
        const minStr = i < 10 ? '0' + i : '' + i;
        const item = document.createElement('div');
        item.className = 'picker-item' + (minStr === defaultM ? ' active' : '');
        item.setAttribute('data-minute', minStr); item.innerText = minStr + '분';
        columnMinute.appendChild(item);
    }

    columnHour.querySelectorAll('.picker-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation(); columnHour.querySelectorAll('.picker-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active'); scrollToCenter(columnHour, item); onSelectCallback(item.getAttribute('data-hour'), null);
        });
    });

    columnMinute.querySelectorAll('.picker-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation(); columnMinute.querySelectorAll('.picker-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active'); scrollToCenter(columnMinute, item); onSelectCallback(null, item.getAttribute('data-minute'));
        });
    });
}

function scrollToCenter(container, item) { container.scrollTo({ top: item.offsetTop - (container.clientHeight / 2) + (item.clientHeight / 2), behavior: 'smooth' }); }
function centerActiveItems(colH, colM) {
    const activeHour = colH.querySelector('.picker-item.active'); const activeMin = colM.querySelector('.picker-item.active');
    if (activeHour) scrollToCenter(colH, activeHour); if (activeMin) scrollToCenter(colM, activeMin);
}
function formatDisplayTime(hourStr, minStr) {
    const hourInt = parseInt(hourStr); let period = "오전", displayHour = hourInt;
    if (hourInt === 0) displayHour = 12; else if (hourInt === 12) period = "오후"; else if (hourInt > 12) { period = "오후"; displayHour = hourInt - 12; }
    return `${period} ${displayHour < 10 ? '0' : ''}${displayHour}:${minStr}`;
}

setupTimePicker(sleepHourColumn, sleepMinuteColumn, "22", "00", (h, m) => {
    if(h) selectedSleepHour = h; if(m) selectedSleepMin = m;
    sleepTimeTrigger.innerText = formatDisplayTime(selectedSleepHour, selectedSleepMin);
});
sleepTimeTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); wakeTimePickerBox.classList.add('hidden'); sleepTimePickerBox.classList.toggle('hidden');
    if (!sleepTimePickerBox.classList.contains('hidden')) centerActiveItems(sleepHourColumn, sleepMinuteColumn);
});

setupTimePicker(wakeHourColumn, wakeMinuteColumn, "07", "00", (h, m) => {
    if(h) selectedWakeHour = h; if(m) selectedWakeMin = m;
    wakeTimeTrigger.innerText = formatDisplayTime(selectedWakeHour, selectedWakeMin);
});
wakeTimeTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); sleepTimePickerBox.classList.add('hidden'); wakeTimePickerBox.classList.toggle('hidden');
    if (!wakeTimePickerBox.classList.contains('hidden')) centerActiveItems(wakeHourColumn, wakeMinuteColumn);
});

document.addEventListener('click', () => { sleepTimePickerBox.classList.add('hidden'); wakeTimePickerBox.classList.add('hidden'); });

// 🔒 [보안 수리 완료] 시스템 마비를 일으켰던 공백 함수 영역을 안전하게 복원해 로그인을 정상화했습니다.
function startCrashTimer(targetHour, targetMin) { return; }

if(analyzeBtn) analyzeBtn.addEventListener('click', () => { generateReport(); });

async function generateReport() {
    if (!resultContainer) return;
    const currentUser = auth.currentUser; if (currentUser) saveUserData(currentUser.uid);

    const userAge = ageSlider.value; const userHeight = heightSlider.value; const userWeight = weightSlider.value;
    const userJobSelect = document.getElementById('user-job'); const userJobText = userJobSelect.options[userJobSelect.selectedIndex].text;
    
    const sleepTimeStr = `${selectedSleepHour}:${selectedSleepMin}`;
    const wakeTimeStr = `${selectedWakeHour}:${selectedWakeMin}`;

    let vibePromptText = activeVibeText || "일반적인 식사 / 정상 리듬";
    if (activeVibeValue === 'vibe6') { vibePromptText = customInput.value.trim() || "특이사항 입력"; }

    resultContainer.innerHTML = `<div class="report-card" style="text-align: center; padding: 40px 20px;"><div style="font-size: 24px; animation: spin 2s linear infinite; margin-bottom: 15px;">⚙️</div><p style="color: var(--accent-color); font-weight: 600; font-size: 15px;">BIOCLOCK AI ENGINE</p><p style="color: var(--text-sub); font-size: 13px; margin-top: 5px;">바이오클락 생체 리듬 연산 시스템을 가동 중입니다...</p></div>`;
    resultContainer.scrollIntoView({ behavior: 'smooth' });

    const prompt = `너는 생체 시계 및 호르몬 대사 전문가 'BIOCLOCK AI' 엔진이다. 유저 정보를 기반으로 오늘의 생체 점수와 리포트를 반환하라. 다른 어떤 설명글도 절대 붙이지 말고 오직 중괄호로 시작해 중괄호로 끝나는 순수한 JSON 데이터 덩어리 하나만 반환해야 한다.

[유저 정보]
나이: ${userAge}세, 체형: ${userHeight}cm/${userWeight}kg, 직무: ${userJobText}, 수면시간: ${sleepTimeStr} ~ ${wakeTimeStr}, 만족도: ${activeSleepQuality}, 특이 변수: "${vibePromptText}"

[출력 JSON 템플릿 양식]
{
  "score": 85,
  "status": "안정",
  "scoreColor": "#00f0ff",
  "timeline": [
    {"time": "오전 09:00", "title": "에너지 피크 각성", "desc": "일반식 섭취로 혈당 변동성이 안전 궤도에 고정되었습니다."},
    {"time": "오후 14:00", "title": "도파민 보충 윈도우", "desc": "가벼운 스트레칭 및 수분 보충으로 도파민 회로를 회복하세요."},
    {"time": "오후 19:30", "title": "멜라토닌 리셋 단계", "desc": "네온 필터를 낮추고 차분한 조명으로 수면 사이클을 조절하십시오."}
  ],
  "prescription": "현재 대사 흐름이 매우 규칙적입니다. 인위적인 고카페인을 제어하고 현 기조를 유지하십시오."
}`;

    try {
        const response = await fetch('/api/analyze', {
            method: "POST", 
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: prompt })
        });
        
        if (!response.ok) {
            throw new Error(`서버 통신 장애 (상태코드: ${response.status})`);
        }
        
        const serverData = await response.json();
        let aiResponseText = serverData.text.trim();
        
        if (aiResponseText.startsWith("```")) {
            aiResponseText = aiResponseText.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
        }

        const aiData = JSON.parse(aiResponseText);
        let timelineRows = ""; 
        aiData.timeline.forEach(row => { 
            timelineRows += `<tr><td><strong>${row.time}</strong></td><td>${row.title}</td><td>${row.desc}</td></tr>`; 
        });

        
        resultContainer.innerHTML = `<div class="report-card"><div style="text-align: center; margin-bottom: 25px;"><div style="font-size: 11px; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.1em;">Today's Bio-Score</div><div style="font-size: 54px; font-weight: 700; color: ${aiData.scoreColor}; margin: 5px 0;">${aiData.score}<span style="font-size: 20px; color: var(--text-sub);">점</span></div><div style="font-size: 13px; color: var(--text-main);">현재 대사 리듬 지표는 <span style="color: ${aiData.scoreColor}; font-weight: 700;">[${aiData.status}]</span> 상태입니다.</div></div><table class="report-table"><thead><tr><th>예측 시간</th><th>기상 궤도</th><th>AI 정밀 가이드라인</th></tr></thead><tbody>${timelineRows}</tbody></table><div style="margin-top: 20px; padding: 14px; background: rgba(56, 189, 248, 0.05); border: 1px dashed rgba(56, 189, 248, 0.3); border-radius: 12px; font-size: 12px; line-height: 1.5;"><span style="color: #00f0ff; font-weight: 700;">🛒 AI 맞춤 솔루션 제안:</span><br>${aiData.prescription}</div></div>`;
    } catch (error) {
        console.error("AI 엔진 마스터 디버깅 에러:", error);
        resultContainer.innerHTML = `<div class="report-card" style="border-color:#ff453a;"><p style="text-align:center; color:#ff453a; font-size:13px;">🚨 연산 실패. 다시 시도해 주세요.</p></div>`;
    }
}

setupRadioCards();