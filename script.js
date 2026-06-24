// --- 魚漢字データ ---// --- 魚漢字データ ---
const DICTS = {
    easy: {
        dict: {
            "魚": "さかな", "鮎": "あゆ", "鰯": "いわし", "鰻": "うなぎ", "海老": "えび",
            "鮭": "さけ", "鯖": "さば", "鯛": "たい", "鯨": "くじら", "蛸": "たこ",
            "鯉": "こい", "鮫": "さめ", "鮪": "まぐろ", "鰹": "かつお", "鱈": "たら",
            "鱒": "ます", "鰈": "かれい", "鮃": "ひらめ", "蟹": "かに", "貝": "かい"
        },
        choices: 3
    },
    normal: {
        dict: kanji_normal,
        choices: 4
    },
    hard: {
        dict: kanji_hard,
        choices: 5
    }
};

// --- ランキング ---
function loadRanking() {
    return JSON.parse(localStorage.getItem("fish_ranking")) || {
        easy: [], normal: [], hard: []
    };
}

function saveRanking(ranking) {
    localStorage.setItem("fish_ranking", JSON.stringify(ranking));
}

// --- 状態 ---
let mode = "easy";
let choiceCount = 3;
let currentDict = {};
let questions = [];
let index = 0;
let score = 0;
let startTime = 0;

// --- 画面切り替え ---
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// --- Fisher–Yates シャッフル ---
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// --- 問題読み込み ---
function loadQuestion() {
    const [kanji, yomi] = questions[index];

    document.getElementById("progress").textContent =
        `第 ${index + 1} 問 / 全 5 問`;

    document.getElementById("question").textContent = kanji;
    document.getElementById("kanji-image").innerHTML = "";

    const allChoices = [...new Set(Object.values(currentDict))];
    const wrong = shuffle(allChoices.filter(c => c !== yomi)).slice(0, choiceCount - 1);
    const choices = shuffle([yomi, ...wrong]);

    const choiceDiv = document.getElementById("choices");
    choiceDiv.innerHTML = "";

    choices.forEach(c => {
        const btn = document.createElement("button");
        btn.textContent = c;
        btn.className = "choice-btn";
        btn.onclick = () => checkAnswer(c);
        choiceDiv.appendChild(btn);
    });

    document.getElementById("result").textContent = "";
    document.getElementById("next-btn").classList.add("hidden");
}

// --- 回答 ---
function checkAnswer(choice) {
    const correct = questions[index][1];
    const result = document.getElementById("result");

    if (choice === correct) {
        result.textContent = "⭕ 正解！";
        result.style.color = "green";
        score++;
    } else {
        result.textContent = `❌ 不正解… 正解は「${correct}」`;
        result.style.color = "red";
    }

    document.getElementById("next-btn").classList.remove("hidden");
}

// --- 結果 ---
function showResult() {
    const time = (Date.now() - startTime) / 1000;
    const multiplier = choiceCount * 60;
    const baseScore = score * multiplier;
    const timeBonus = Math.max(0, Math.floor((50 - time) * 10));
    const totalScore = score > 0 ? baseScore + timeBonus : 0;

    document.getElementById("final-score").textContent = `${totalScore} 点`;
    document.getElementById("final-detail").textContent =
        `正解数：${score} / 5問　時間：${time.toFixed(1)}秒`;

    showScreen("result-screen");

    document.getElementById("save-btn").onclick = () => {
        const name = document.getElementById("player-name").value.replace(",", "");
        const ranking = loadRanking();

        ranking[mode].push({ name, totalScore, score, time });
        ranking[mode].sort((a, b) => b.totalScore - a.totalScore);

        saveRanking(ranking);
        showRanking(ranking[mode]);
    };
}

// --- ランキング表示 ---
function showRanking(list) {
    showScreen("ranking-screen");

    const div = document.getElementById("ranking-list");
    div.innerHTML = "";

    list.slice(0, 5).forEach((r, i) => {
        div.innerHTML += `<p>${i + 1}位：${r.name}（${r.totalScore}点 / ${r.score}問 / ${r.time.toFixed(1)}秒）</p>`;
    });

    document.getElementById("reset-btn").onclick = () => {
        if (confirm("ランキングを全部消しますか？")) {
            localStorage.removeItem("fish_ranking");
            alert("ランキングを消しました！");
            showScreen("start-screen");
        }
    };

    document.getElementById("back-btn").onclick = () => {
        showScreen("start-screen");
    };
}

// --- イベント登録 ---
document.getElementById("start-btn").onclick = () => {
    mode = document.getElementById("difficulty").value;

    currentDict = DICTS[mode].dict;
    choiceCount = DICTS[mode].choices;

    questions = shuffle(Object.entries(currentDict)).slice(0, 5);

    index = 0;
    score = 0;
    startTime = Date.now();

    showScreen("quiz-screen");
    loadQuestion();
};

document.getElementById("next-btn").onclick = () => {
    index++;
    if (index >= 5) showResult();
    else loadQuestion();
};

