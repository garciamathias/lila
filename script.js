async function getSimilarListings(url) {
    const apiKey = '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';
    try {
        const prompt = `Analyze this URL: ${url} and provide 3 similar but safer alternatives. 
        Return ONLY a JSON array with exactly this format, no other text:
        [
            {"title": "Safe Alternative 1", "url": "https://example1.com", "scamScore": 20},
            {"title": "Safe Alternative 2", "url": "https://example2.com", "scamScore": 15},
            {"title": "Safe Alternative 3", "url": "https://example3.com", "scamScore": 25}
        ]`;

        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "sonar-small-online",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that finds similar safe listings. Respond only with JSON data, no additional text."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 500
            })
        };

        const response = await fetch('https://api.perplexity.ai/chat/completions', options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid API response structure');
        }

        const content = data.choices[0].message.content;
        
        // Tentative de trouver et parser le JSON dans la réponse
        const jsonMatch = content.match(/\[.*\]/s);
        if (jsonMatch) {
            const parsedListings = JSON.parse(jsonMatch[0]);
            return Array.isArray(parsedListings) ? parsedListings : [];
        }

        // Fallback avec des données d'exemple si l'API échoue
        return [
            {
                title: "Alternative plus sûre sur un site reconnu",
                url: "https://www.leboncoin.fr/annonces/similaires",
                scamScore: 15
            },
            {
                title: "Offre similaire vérifiée",
                url: "https://www.amazon.fr",
                scamScore: 10
            },
            {
                title: "Alternative recommandée",
                url: "https://www.fnac.com",
                scamScore: 20
            }
        ];

    } catch (error) {
        console.error('Erreur détaillée:', error);
        // Retourner les données fallback en cas d'erreur
        return [
            {
                title: "Alternative sécurisée (site de repli)",
                url: "https://www.leboncoin.fr",
                scamScore: 15
            }
        ];
    }
}

async function analyseUrl() {
    const urlInput = document.getElementById('urlInput');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const url = urlInput.value;

    if (!url) {
        alert('Veuillez entrer une URL valide');
        return;
    }

    loading.style.display = 'block';
    result.style.display = 'none';

    const score = analyseScamProbability(url);
    let similarListings = [];

    if (score >= 70) {
        similarListings = await getSimilarListings(url);
    }

    loading.style.display = 'none';
    result.style.display = 'block';

    let color = score < 30 ? '#4CAF50' : score < 70 ? '#FFA500' : '#FF0000';

    result.style.backgroundColor = `${color}22`;
    result.style.border = `2px solid ${color}`;
    result.innerHTML = `
        <h3>Résultat de l'analyse</h3>
        <p>Probabilité de scam : <strong>${score}%</strong></p>
        <p>${getRecommendation(score)}</p>
        ${score >= 70 ? displaySimilarListings(similarListings) : ''}
    `;
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
        return "Cette URL semble sûre, mais restez toujours vigilant.";
    } else if (score < 70) {
        return "Attention ! Cette URL présente des signes suspects. Vérifiez bien sa légitimité avant de continuer.";
    } else {
        return "DANGER ! Cette URL présente un risque élevé de scam. Il est fortement déconseillé de continuer.";
    }
}

function displaySimilarListings(listings) {
    if (!listings.length) return '';
    
    const listingsHtml = listings.map(listing => `
        <div class="similar-listing-item">
            <a href="${listing.url}" target="_blank">${listing.title}</a>
            <span class="similar-listing-score" style="background-color: ${getScoreColor(listing.scamScore)}">
                ${listing.scamScore}%
            </span>
        </div>
    `).join('');

    return `
        <div class="similar-listings">
            <h4>Annonces similaires plus sûres :</h4>
            ${listingsHtml}
        </div>
    `;
}

function getScoreColor(score) {
    return score < 30 ? '#4CAF5022' : score < 70 ? '#FFA50022' : '#FF000022';
}