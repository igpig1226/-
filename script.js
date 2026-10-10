// Route sequences by role (data-question indices)
const ROUTES = {
    exam:     [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15],
    'no-exam':[0, 1, 6, 7, 14, 15],
    homeroom: [0, 1, 6, 7, 9, 10, 11, 12, 14, 15],
    counselor:[0, 1, 6, 7, 13, 14, 15],
};

const questions = document.querySelectorAll('.question-card');
let currentRoute = ROUTES.exam; // default until role is chosen at Q1
let routePos = 0; // index into currentRoute

function getRole() {
    const checked = document.querySelector('input[name="q_role"]:checked');
    return checked ? checked.value : null;
}

function resolveRoute() {
    const role = getRole();
    return ROUTES[role] || ROUTES.exam;
}

function showQuestion(questionIndex) {
    questions.forEach(q => {
        q.classList.remove('active', 'prev');
        const qi = parseInt(q.dataset.question, 10);
        if (qi === questionIndex) {
            q.classList.add('active');
        } else if (currentRoute.indexOf(qi) < routePos) {
            q.classList.add('prev');
        }
    });

    const total = currentRoute.length;
    const pos = routePos + 1;
    const progress = (pos / total) * 100;
    document.querySelector('.progress-bar').style.width = progress + '%';
    document.getElementById('currentQuestion').textContent = pos;
    document.getElementById('totalQuestions').textContent = total;
    document.getElementById('prevBtn').disabled = routePos === 0;
}

function startSurvey() {
    document.getElementById('startPage').style.display = 'none';
    document.querySelector('.progress-container').style.display = 'block';
    document.querySelector('.progress-indicator').style.display = 'block';
    document.querySelector('.survey-main').style.display = 'flex';
    document.querySelector('.navigation').style.display = 'flex';
    routePos = 0;
    showQuestion(currentRoute[routePos]);
}

document.getElementById('startBtn').addEventListener('click', startSurvey);

document.getElementById('prevBtn').addEventListener('click', () => {
    if (routePos > 0) {
        routePos--;
        showQuestion(currentRoute[routePos]);
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    // After Q1, lock in the route based on role selection
    if (currentRoute[routePos] === 1) {
        currentRoute = resolveRoute();
        // Recalculate routePos in new route (we just finished index 1, so pos = 1)
        routePos = currentRoute.indexOf(1);
    }

    if (routePos < currentRoute.length - 1) {
        routePos++;
        showQuestion(currentRoute[routePos]);
    } else {
        showReviewPage();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (document.getElementById('startPage').style.display !== 'none') return;
    if (e.key === 'ArrowLeft' && routePos > 0) {
        routePos--;
        showQuestion(currentRoute[routePos]);
    } else if (e.key === 'ArrowRight') {
        if (currentRoute[routePos] === 1) {
            currentRoute = resolveRoute();
            routePos = currentRoute.indexOf(1);
        }
        if (routePos < currentRoute.length - 1) {
            routePos++;
            showQuestion(currentRoute[routePos]);
        } else {
            showReviewPage();
        }
    }
});

function collectFormData() {
    const formData = new FormData(document.getElementById('surveyForm'));
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
        } else {
            data[key] = value;
        }
    }
    return data;
}

const QUESTION_LABELS = {
    q1:                  '老师名字',
    q2:                  '考试科目',
    q_role:              '身份 / 科目类型',
    q3:                  '班级参加考试人数',
    q4:                  '考试非选择题时长',
    q5:                  '是否希望采用机考',
    q6:                  '对机考的总体态度',
    q7:                  '对学校 WiFi 的满意度',
    q7_pilot:            '对试运行教室 WiFi 的满意度',
    q8_rating:           '考试期间网络方案可行性（评分）',
    q8_text:             '考试期间网络方案可行性（补充）',
    q9_rating:           '日常上课期间网络方案可行性（评分）',
    q9_text:             '日常上课期间网络方案可行性（补充）',
    q_evening_net:       '晚自习网络开放范围',
    q10_homeroom:        '机考对日常工作的影响',
    q11_homeroom:        '推行机考的具体需求与建议',
    q_hallway_router:    '是否有必要在楼道安装路由器',
    q_hallway_router_text: '楼道路由器补充意见',
    q_other:             '其他意见',
};

function showReviewPage() {
    const data = collectFormData();
    let html = '';

    for (let key of Object.keys(QUESTION_LABELS)) {
        const val = data[key];
        if (!val || val.toString().trim() === '') continue;
        let display = val;
        if (key === 'q4') display = val + ' 分钟';
        else if (key === 'q3') display = val + ' 人';
        else if (key === 'q6' || key === 'q7') display = val + ' 分';

        html += `
            <div class="review-item">
                <div class="review-label">${QUESTION_LABELS[key]}</div>
                <div class="review-value">${display}</div>
            </div>`;
    }

    document.getElementById('reviewContent').innerHTML = html;
    document.querySelector('.survey-main').style.display = 'none';
    document.querySelector('.navigation').style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';
    document.querySelector('.progress-indicator').style.display = 'none';
    document.getElementById('reviewPage').style.display = 'block';
}

document.getElementById('backToEdit').addEventListener('click', () => {
    document.getElementById('reviewPage').style.display = 'none';
    document.querySelector('.survey-main').style.display = 'flex';
    document.querySelector('.navigation').style.display = 'flex';
    document.querySelector('.progress-container').style.display = 'block';
    document.querySelector('.progress-indicator').style.display = 'block';
    showQuestion(currentRoute[routePos]);
});

document.getElementById('confirmSubmit').addEventListener('click', submitSurvey);

function submitSurvey() {
    const data = collectFormData();
    dataManager.saveResponse(data).then(id => {
        console.log('问卷已保存，ID:', id);
    }).catch(err => {
        console.error('保存失败:', err);
    });
    document.getElementById('reviewPage').style.display = 'none';
    document.getElementById('thankYou').style.display = 'block';
}

document.getElementById('anotherSubjectBtn').addEventListener('click', () => {
    // Keep teacher name, reset everything else
    const teacherName = document.querySelector('input[name="q1"]').value;

    document.getElementById('surveyForm').reset();

    document.querySelector('input[name="q1"]').value = teacherName;

    // Reset route to exam (default) and jump to Q1 (subject question, index 1)
    currentRoute = ROUTES.exam;
    routePos = currentRoute.indexOf(1);

    document.getElementById('thankYou').style.display = 'none';
    document.querySelector('.survey-main').style.display = 'flex';
    document.querySelector('.navigation').style.display = 'flex';
    document.querySelector('.progress-container').style.display = 'block';
    document.querySelector('.progress-indicator').style.display = 'block';

    showQuestion(currentRoute[routePos]);
});
