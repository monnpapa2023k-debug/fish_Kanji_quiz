// --- Firebase SDKの読み込み ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, query, orderByChild } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// ⚠️【最重要】ここをご自身のFirebaseプロジェクトの設定に書き換えてください
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "fish-quiz-ranking.firebaseapp.com",
  databaseURL: "https://fish-quiz-ranking-default-rtdb.firebaseio.com",
  projectId: "fish-quiz-ranking",
  storageBucket: "fish-quiz-ranking.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- 魚漢字データ（Pythonコードから移植） ---
const kanjiEasy = {
  "魚": "さかな", "鮎": "あゆ", "鰯": "いわし", "鰻": "うなぎ", "海老": "えび",
  "鮭": "さけ", "鯖": "さば", "鯛": "たい", "鯨": "くじら", "蛸": "たこ",
  "鯉": "こい", "鮫": "さめ", "鮪": "まぐろ", "鰹": "かつお", "鱈": "たら",
  "鱒": "ます", "鰈": "かれい", "鮃": "ひらめ", "蟹": "かに", "貝": "かい"
};

const kanjiNormal = {
  "鯵": "あじ", "鰺": "あじ", "鮑": "あわび", "鰒": "ふぐ", "魷": "いか",
  "鯔": "ぼら", "鯆": "いるか", "鮇": "いわな", "鱓": "うつぼ", "鱏": "えい",
  "鮖": "かじか", "魛": "たちうお", "鰊": "にしん", "鯏": "あさり", "鰡": "ぼら",
  "鯑": "かずのこ", "鮟鱇": "あんこう", "鰍": "どじょう", "鰌": "どじょう", "鰔": "さより",
  "魴": "ほうぼう", "鮗": "このしろ", "鯊": "はぜ", "鯳": "すけとうだら", "鱚": "きす"
};

const kanjiHard = {
  "魭": "あおうみがめ", "鯘": "あざれ", "鮩": "あみ", 
  "鯇": "あめのうお", "鰀": "あめのうお", "鮟": "あん", 
  "鮧": "えそ", "鰂": "いか", "鰞": "いか", "鮻": "いさぎ", 
  "魦": "いさざ", "鱊": "いさだ", "鰵": "いしもち", "鰝": "いせえび", 
  "魚鬼": "いとう", "鰮": "いわし", "鰮": "いわし", "鷠": "ぎょ", 
  "鰾": "うきぶくろ", "鱥": "うぐい", "魿": "うろこ", 
  "鱁": "うるか", "鱗": "うろこ", "鱝": "えい", "鰩": "とびうお", 
  "鱛": "えそ", "鮆": "えつ", "鱴": "えつ", 
  "鰕": "えび", "鰓": "えら", 
  "魞": "えri", "鰲": "おおがめ", "鮱": "ぼら", "鰧": "おこぜ", 
  "魯": "おろか", "鱠": "なます", "鱪": "しいら", "魳": "かます",
  "鱫": "えそ", "鱦": "かたくちいわし", "鯺": "ふぐ", "鱵": "さより",
  "鱨": "ぎぎ", "鮄": "ほうぼう", "鯓": "うろこ"
};

// ゲーム状態管理用変数
let modeType = "中級(4択)";
let choiceCount = 4;
let currentDict = kanjiNormal;
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let startTime = 0;
let totalTime = 0;
let totalScore = 0;

// 画面切り替え関数
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// スタート画面のトップ3をリアルタイム読み込み
function updateStartRanking() {
  const mode = document.getElementById('age-select').value;
  document.getElementById('start-rank-title').innerText = `【${mode}の現在のトップ3】`;
  
  const startListContainer = document.getElementById('start-ranking-list');
  startListContainer.innerHTML = "<li>読み込み中...</li>";

  const scoresRef = ref(database, 'scores/' + mode);
  onValue(scoresRef, (snapshot) => {
    const data = snapshot.val();
    const records = [];
    for (let id in data) { records.push(data[id]); }
    
    // スコア降順、同点ならタイム昇順
    records.sort((a, b) => (b.score - a.score) || (a.time - b.time));

    let html = "";
    records.slice(0, 3).forEach((r, i) => {
      html += `<li>${i+1}位: ${escapeHTML(r.name)} (${r.score.toLocaleString()}点 / ${r.correct}問 / ${r.time.toFixed(1)}秒)</li>`;
    });
    startListContainer.innerHTML = html || "<li>まだ記録がありません</li>";
  }, { onlyOnce: true });
}

// クイズ開始処理
function startQuiz() {
  modeType = document.getElementById('age-select').value;
  
  if (modeType === "初級(3択)") {
    choiceCount = 3;
    currentDict = kanjiEasy;
  } else if (modeType === "中級(4択)") {
    choiceCount = 4;
    currentDict = kanjiNormal;
  } else {
    choiceCount = 5;
    currentDict = kanjiHard;
  }

  const keys = Object.keys(currentDict).filter(k => k !== "");
  const shuffledKeys = keys.sort(() => 0.5 - Math.random());
  const selectedKeys = shuffledKeys.slice(0, Math.min(5, shuffledKeys.length));
  
  questions = selectedKeys.map(k => ({ kanji: k, yomi: currentDict[k] }));
  
  currentIndex = 0;
  correctCount = 0;
  startTime = Date.now();

  showScreen('quiz-screen');
  showQuestion();
}

function showQuestion() {
  const q = questions[currentIndex];
  document.getElementById('question-progress').innerText = `[${modeType}] 第 ${currentIndex + 1} 問 / 全 5 問`;
  document.getElementById('kanji-display').innerText = q.kanji;
  document.getElementById('result-message').innerText = "";
  document.getElementById('btn-next').style.display = "none";

  // 画像表示
  const imgArea = document.getElementById('fish-image-area');
  const img = new Image();
  img.src = `images/${q.kanji}.png`;
  img.onload = function() {
    imgArea.innerHTML = `<img src="images/${q.kanji}.png" alt="${q.kanji}">`;
  };
  img.onerror = function() {
    imgArea.innerText = "🔍 お魚漢字の正体は何かな？";
  };

  // 選択肢作成
  const allYomi = Array.from(new Set(Object.values(currentDict)));
  const filteredYomi = allYomi.filter(y => y !== q.yomi);
  
  let wrongChoicesPool = [...filteredYomi];
  const backupPool = ["まぐろ", "さけ", "さば", "いわし", "たい", "たこ", "いか"];
  if (wrongChoicesPool.length < (choiceCount - 1)) {
    backupPool.forEach(b => {
      if (b !== q.yomi && !wrongChoicesPool.includes(b)) wrongChoicesPool.push(b);
    });
  }

  wrongChoicesPool.sort(() => 0.5 - Math.random());
  const choices = [q.yomi, ...wrongChoicesPool.slice(0, choiceCount - 1)];
  choices.sort(() => 0.5 - Math.random());

  const choicesContainer = document.getElementById('choices-container');
  choicesContainer.innerHTML = "";
  
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.innerText = choice;
    btn.onclick = () => checkAnswer(choice);
    choicesContainer.appendChild(btn);
  });
}

function checkAnswer(chosen) {
  if (document.getElementById('btn-next').style.display === "block") return;

  const q = questions[currentIndex];
  const msg = document.getElementById('result-message');

  if (chosen === q.yomi) {
    msg.innerText = "⭕ 正解！";
    msg.style.color = "green";
    correctCount++;
  } else {
    msg.innerText = `❌ 不正解… 正しくは「${q.yomi}」`;
    msg.style.color = "red";
  }

  document.querySelectorAll('#choices-container .btn').forEach(b => b.disabled = true);
  document.getElementById('btn-next').style.display = "block";
  document.getElementById('btn-next').focus();
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= questions.length) {
    calculateFinalScore();
  } else {
    showQuestion();
  }
}

// スコア計算（Python版再現）
function calculateFinalScore() {
  totalTime = (Date.now() - startTime) / 1000;
  const multiplier = choiceCount * 60;
  const baseScore = correctCount * multiplier;
  
  if (correctCount > 0) {
    const timeBonus = Math.max(0, Math.floor((50 - totalTime) * 10));
    totalScore = baseScore + timeBonus;
  } else {
    totalScore = 0;
  }

  document.getElementById('total-score-display').innerText = `${totalScore.toLocaleString()} 点`;
  document.getElementById('result-details-display').innerHTML = `
    モード: ${modeType}<br>
    正解数: ${correctCount} 問 / 5 問<br>
    クリア時間: ${totalTime.toFixed(1)} 秒
  `;

  document.getElementById('register-area').style.display = "block";
  showScreen('result-screen');
}

// オンラインランキングに記録を送信
function registerRanking() {
  const nameInput = document.getElementById('player-name');
  let name = nameInput.value.trim();
  if (!name) {
    alert("名前を入力してください。");
    return;
  }
  name = name.replace(/,/g, "");

  const scoresRef = ref(database, 'scores/' + modeType);
  const newRecordRef = push(scoresRef);

  const newRecord = {
    name: name,
    score: totalScore,
    correct: correctCount,
    time: totalTime,
    timestamp: Date.now()
  };

  set(newRecordRef, newRecord).then(() => {
    document.getElementById('register-area').style.display = "none";
    showGlobalRanking(newRecord);
  }).catch((error) => {
    console.error("Firebaseへの保存に失敗しました:", error);
  });
}

function showGlobalRanking(myRecord) {
  document.getElementById('ranking-title').innerText = `🏆 ランキング Top 5 🏆\n(${modeType})`;
  showScreen('ranking-screen');

  const scoresRef = ref(database, 'scores/' + modeType);
  onValue(scoresRef, (snapshot) => {
    const data = snapshot.val();
    const records = [];
    for (let id in data) { records.push(data[id]); }
    
    records.sort((a, b) => (b.score - a.score) || (a.time - b.time));

    let myRank = 0;
    for (let i = 0; i < records.length; i++) {
      if (records[i].name === myRecord.name && records[i].score === myRecord.score && records[i].time === myRecord.time) {
        myRank = i + 1;
        break;
      }
    }
    document.getElementById('my-rank-display').innerText = `あなたの順位：第 ${myRank} 位！`;

    const globalListContainer = document.getElementById('global-ranking-list');
    let html = "";
    
    records.slice(0, 5).forEach((r, i) => {
      let rankText = `第${i+1}位`;
      if (i === 0) rankText = "🥇1位";
      else if (i === 1) rankText = "🥈2位";
      else if (i === 2) rankText = "🥉3位";
      
      const paddedRank = rankText.padEnd(4, ' ');
      const paddedName = r.name.substring(0, 10).padEnd(10, ' ');
      const paddedScore = r.score.toLocaleString().padStart(6, ' ');
      const paddedTime = r.time.toFixed(1).padStart(4, ' ');

      html += `<li>${paddedRank} : ${escapeHTML(paddedName)} [ ${paddedScore}点 | ${r.correct}問 | ${paddedTime}秒 ]</li>`;
    });

    globalListContainer.innerHTML = html || "<li>データがありません</li>";
  }, { onlyOnce: true });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// --- イベントリスナーの設定（HTML要素とJavaScriptの紐付け） ---
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('age-select').addEventListener('change', updateStartRanking);
  document.getElementById('start-btn').addEventListener('click', startQuiz);
  document.getElementById('btn-next').addEventListener('click', nextQuestion);
  document.getElementById('register-btn').addEventListener('click', registerRanking);
  document.getElementById('back-title-btn').addEventListener('click', () => {
    showScreen('start-screen');
    updateStartRanking();
  });

  // 初期読み込み
  updateStartRanking();
});
