function analyseUrl() {
    const urlInput = document.getElementById('urlInput');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const url = urlInput.value;

    if (!url) {
        alert('Please enter a valid URL');
        return;
    }

    loading.style.display = 'block';
    result.style.display = 'none';

    setTimeout(() => {
        const score = analyseScamProbability(url);
        loading.style.display = 'none';
        result.style.display = 'block';

        let color;
        if (score < 30) {
            color = '#4CAF50';
        } else if (score < 70) {
            color = '#FFA500';
        } else {
            color = '#FF0000';
        }

        result.style.backgroundColor = `${color}22`;
        result.style.border = `2px solid ${color}`;
        result.innerHTML = `
            <h3>Résultat de l'analyse</h3>
            <p>Probabilité de scam : <strong>${score}%</strong></p>
            <p>${getRecommendation(score)}</p>
        `;
    }, 2000);
}

function analyseScamProbability(url) {
    let score = 0;
    
    if (url.includes('secure') || url.includes('bank')) score += 20;
    if (url.includes('free') || url.includes('win')) score += 30;
    if (url.length > 50) score += 15;
    if (!url.includes('https')) score += 25;
    
    score += Math.random() * 10;
    
    return Math.min(Math.round(score), 100);
}

function getRecommendation(score) {
    if (score < 30) {
        return "This URL seems safe, but always stay vigilant.";
    } else if (score < 70) {
        return "Warning! This URL shows suspicious signs. Check its legitimacy before proceeding.";
    } else {
        return "DANGER! This URL presents a high risk of scam. It is strongly advised not to proceed.";
    }
}