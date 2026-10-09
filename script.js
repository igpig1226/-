document.getElementById('surveyForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // 收集表单数据
    const formData = new FormData(e.target);
    const data = {};

    // 处理单选和文本输入
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // 如果已存在，转换为数组（用于多选题）
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    // 这里可以将数据发送到后端
    console.log('问卷数据:', data);

    // 显示感谢信息
    document.getElementById('surveyForm').style.display = 'none';
    document.getElementById('thankYou').style.display = 'block';

    // 可选：将数据保存到 localStorage
    localStorage.setItem('surveyData_' + Date.now(), JSON.stringify(data));

    // 如果需要发送到服务器，可以使用 fetch API
    // fetch('your-api-endpoint', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(data)
    // });
});
