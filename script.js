let currentQuestion = 0;
const questions = document.querySelectorAll('.question-card');
const totalQuestions = questions.length;

document.getElementById('totalQuestions').textContent = totalQuestions;

function showQuestion(index) {
    questions.forEach((q, i) => {
        q.classList.remove('active', 'prev');
        if (i === index) {
            q.classList.add('active');
        } else if (i < index) {
            q.classList.add('prev');
        }
    });

    // 更新进度条
    const progress = ((index + 1) / totalQuestions) * 100;
    document.querySelector('.progress-bar').style.width = progress + '%';

    // 更新问题计数
    document.getElementById('currentQuestion').textContent = index + 1;

    // 更新按钮状态
    document.getElementById('prevBtn').disabled = index === 0;

    // 最后一题时，下一个按钮显示不同
    if (index === totalQuestions - 1) {
        document.getElementById('nextBtn').innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 16L14 10L8 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else {
        document.getElementById('nextBtn').innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 16L14 10L8 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
}

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentQuestion < totalQuestions - 1) {
        // 处理跳题逻辑：如果第2题选择了跳过，跳到第6题
        const skipCheckbox = document.querySelector('input[name="q2_skip"]');
        if (currentQuestion === 1 && skipCheckbox && skipCheckbox.checked) {
            currentQuestion = 5; // 跳到第6题（索引5）
        } else {
            currentQuestion++;
        }
        showQuestion(currentQuestion);
    } else {
        showReviewPage();
    }
});

// 键盘导航
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
    } else if (e.key === 'ArrowRight') {
        if (currentQuestion < totalQuestions - 1) {
            currentQuestion++;
            showQuestion(currentQuestion);
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
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    return data;
}

function showReviewPage() {
    const data = collectFormData();
    const reviewContent = document.getElementById('reviewContent');

    const questionTitles = {
        'q1': '1. 老师名字',
        'q2': '2. 考试科目',
        'q2_skip': '跳过AP考试相关题目',
        'q3': '3. 班级参加考试人数',
        'q4': '4. 考试非选择题时长',
        'q5': '5. 是否希望在半期考试采用机考',
        'q6': '6. 对于半期考试采用机考的态度',
        'q7': '7. 对于学校wifi效果的满意度',
        'q8_rating': '8. 考试中方案的可行性（评分）',
        'q8_text': '8. 考试中方案的可行性（补充说明）',
        'q9_rating': '9. 日常方案的可行性（评分）',
        'q9_text': '9. 日常方案的可行性（补充说明）',
        'q10': '10. 其他意见'
    };

    let html = '';
    for (let key in data) {
        if (data[key] && data[key].toString().trim() !== '') {
            const title = questionTitles[key] || key;
            let value = data[key];

            // 格式化数值答案
            if (key === 'q4') {
                value = value + ' 分钟';
            } else if (key === 'q3') {
                value = value + ' 人';
            } else if (key === 'q6' || key === 'q7') {
                value = value + ' 分';
            }

            html += `
                <div class="review-item">
                    <div class="review-label">${title}</div>
                    <div class="review-value">${value}</div>
                </div>
            `;
        }
    }

    reviewContent.innerHTML = html;

    // 隐藏问卷，显示确认页面
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
    showQuestion(currentQuestion);
});

document.getElementById('confirmSubmit').addEventListener('click', () => {
    submitSurvey();
});

function submitSurvey() {
    const data = collectFormData();

    console.log('问卷数据:', data);

    // 保存到 IndexedDB
    dataManager.saveResponse(data).then(id => {
        console.log('问卷已保存，ID:', id);
    }).catch(err => {
        console.error('保存失败:', err);
    });

    // 隐藏确认页面，显示感谢页面
    document.getElementById('reviewPage').style.display = 'none';
    document.getElementById('thankYou').style.display = 'block';
}

// 初始化，显示第一题
showQuestion(0);
