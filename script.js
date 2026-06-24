// --- 魚漢字データ ---
const kanji_easy = {
    "魚": "さかな", "鮎": "あゆ", "鰯": "いわし", "鰻": "うなぎ", "海老": "えび",
    "鮭": "さけ", "鯖": "さば", "鯛": "たい", "鯨": "くじら", "蛸": "たこ",
    "鯉": "こい", "鮫": "さめ", "鮪": "まぐろ", "鰹": "かつお", "鱈": "たら",
    "鱒": "ます", "鰈": "かれい", "鮃": "ひらめ", "蟹": "かに", "貝": "かい"
};

const kanji_normal = {
    "鯵": "あじ", "鰺": "あじ", "鮑": "あわび", "鰒": "ふぐ", "魷": "いか",
    "鯔": "ぼら", "鯆": "いるか", "鮇": "いわな", "鱓": "うつぼ", "鱏": "えい",
    "鮖": "かじか", "魛": "たちうお", "鰊": "にしん", "鯏": "あさり", "鰡": "ぼら",
    "鯑": "かずのこ", "鮟鱇": "あんこう", "鰍": "どじょう", "鰌": "どじょう", "鰔": "さより",
    "魴": "ほうぼう", "鮗": "このしろ", "鯊": "はぜ", "鯳": "すけとうだら",
    "鱚": "きす"
};

const kanji_hard = {
    "魭": "あおうみがめ", "鯘": "あざれ", "鮩": "あみ",
    "鯇": "あめのうお", "鰀": "あめのうお", "鮟": "あん",
    "鮧": "えそ", "鰂": "いか", "鰞": "いか", "鮻": "いさぎ",
    "魦": "いさざ", "鱊": "いさだ", "鰵": "いしもち", "鰝": "いせえび",
    "魚鬼": "いとう", "鰮": "いわし", "鰛": "いわし", "鷠": "ぎょ",
    "鰾": "うきぶくろ", "鱥": "うぐい", "魿": "うろこ",
    "鱁": "うるか", "鱗": "うろこ", "鱝": "えい", "鰩": "とびうお",
    "鱛": "えそ", "鮆": "えつ", "鱴": "えつ",
    "魮": "えつ", "鰕": "えび", "鰓": "えら",
    "魞": "えり", "鰲": "おおがめ", "鮱": "ぼら", "鰧": "おこぜ",
    "魯": "おろか", "鱠": "なます", "鱪": "しいら", "魳": "かます",
    "鱫": "えそ", "鱦": "かたくちいわし", "鯺": "ふぐ", "鱵": "さより",
    "鱨": "ぎぎ", "鮄": "ほうぼう", "鯓": "うろこ"
};

// --- ランキング保存（localStorage） ---
function loadRanking() {
    const data = localStorage.getItem("fish_ranking");
    return data ? JSON.parse(data) : {
        "easy": [],
        "normal": [],
        "hard": []
    };
}

function saveRanking(ranking) {
    localStorage.setItem("fish_ranking", JSON.stringify(ranking));
}

// --- 変数 ---
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

// --- スタート ---
document.getElementById("start-btn").onclick = () => {
    mode = document.getElementById("difficulty").value;

    if (mode === "easy") {
        choiceCount = 3;
        currentDict = kanji_easy;
    } else if (mode === "normal") {
        choiceCount = 4;
        currentDict = kanji_normal;
    } else {
        choiceCount = 5;
        currentDict = kanji_hard;
    }

    const all = Object.entries(currentDict);
    questions = shuffle(all).slice(0, 5);

    index = 0;
    score = 0;
    startTime = Date.now();

    showScreen("quiz-screen");
    loadQuestion();
};

// --- 問題表示 ---
function loadQuestion() {
    const [kanji, yomi] = questions[index];

    document.getElementById("progress").textContent =
        `第 ${index + 1} 問 / 全 5 問`;

    document.getElementById("question").textContent = kanji;

    // 画像なし
    document.getElementById("kanji-image").innerHTML = "";

    // 選択肢
    const allChoices = [...new Set(Object.values(currentDict))];
    const correct = yomi;

    const wrongChoices = shuffle(allChoices.filter(c => c !== correct)).slice(0, choiceCount - 1);

    const choices = shuffle([correct, ...wrongChoices]);

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

// --- 回答チェック ---
function checkAnswer(choice) {
    const correct = questions[index][1];

    if (choice === correct) {
        document.getElementById("result").textContent = "⭕ 正解！";
        document.getElementById("result").style.color = "green";
        score++;
    } else {
        document.getElementById("result").textContent = `❌ 不正解… 正解は「${correct}」`;
        document.getElementById("result").style.color = "red";
    }

    document.getElementById("next-btn").classList.remove("hidden");
}

document.getElementById("next-btn").onclick = () => {
    index++;
    if (index >= 5) {
        showResult();
    } else {
        loadQuestion();
    }
};

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
        showRanking(ranking[mode], name, totalScore, time);
    };
}

// --- ランキング ---
function showRanking(list, name, totalScore, time) {
    showScreen("ranking-screen");

    document.getElementById("rank-title").textContent = "ランキング TOP5";

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

// --- シャッフル ---
function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}
