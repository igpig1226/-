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

    // 最后一题时，下一个按钮变成提交
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
        currentQuestion++;
        showQuestion(currentQuestion);
    } else {
        submitSurvey();
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
            submitSurvey();
        }
    }
});

function submitSurvey() {
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

    console.log('问卷数据:', data);

    // 隐藏表单和导航，显示感谢页面
    document.querySelector('.survey-main').style.display = 'none';
    document.querySelector('.navigation').style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';
    document.querySelector('.progress-indicator').style.display = 'none';
    document.getElementById('thankYou').style.display = 'block';

    // 保存到 localStorage
    localStorage.setItem('surveyData_' + Date.now(), JSON.stringify(data));
}

// 初始化，显示第一题
showQuestion(0);
