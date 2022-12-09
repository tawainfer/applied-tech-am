let all;
let unit = [];
let chapter = [];
let section = [];
let problem = [];
let unitIndex = 0;
let chapIndex = 0;
let sectIndex = 0;
let upBorder = 101;
let downBorder = -1;
let isHeatmap = false;
let isHundred = false;
let schedule = [
  ["令和5年度春期試験", new Date(2023, 4 - 1, 16, 9, 30, 0)],
]
let oldYear = 1998;
let newYear = 2021;
let upYear = 0;
let downYear = 0;
let problemList = [[], [], [], []]; // all, T, M, S
let extractList = [[], [], [], []];
let choiceList = [];
// let startTime = 0;
// let endTime = 0;

// 現在時刻の取得・カウントダウン
let countdown = setInterval(() => {
  let currentTime = new Date();

  for (let i = 0; i < schedule.length; i++) {
    let targetTime = schedule[i][1];
    let remainTime = targetTime - currentTime;
    if (remainTime < 0) remainTime = 0;

    //差分の日・時・分・秒を取得
    let diffDay = Math.floor(remainTime / 1000 / 60 / 60 / 24);
    let diffHour = Math.floor(remainTime / 1000 / 60 / 60) % 24;
    let diffMin = Math.floor(remainTime / 1000 / 60) % 60;
    let diffSec = Math.floor(remainTime / 1000) % 60;

    //残りの日時を上書き
    document.getElementById(`day${i + 1}`).innerHTML = diffDay;
    document.getElementById(`hour${i + 1}`).innerHTML = diffHour;
    document.getElementById(`min${i + 1}`).innerHTML = diffMin;
    document.getElementById(`sec${i + 1}`).innerHTML = diffSec;
  }
}, 1000)    //1秒間に1度処理

// ボーダーカラー表示が有効ならオプションを表示する
let isBorder = () => {
  if (document.getElementById("border").checked) {
    document.getElementById("settingBorder").style.display = "block";
  } else {
    document.getElementById("settingBorder").style.display = "none";
  }
}

// ファイル読み込みの設定
let fileInput = document.getElementById("csv_file");
let message = document.getElementById("message");
let fileReader = new FileReader();
let file;

// ファイル読み込み時
fileInput.onchange = () => {
  file = fileInput.files[0];
  fileReader.readAsText(file, "Shift_JIS");
}

// ファイル読み込み成功時
fileReader.onload = () => {
  // startTime = performance.now();

  document.getElementById("option").style.display = "none";
  document.getElementById("news").style.display = "none";

  if ((file.name.match(/.csv$/)) === null) {
    message.innerHTML = "不正なファイル形式です。ファイル形式を確認して再度アップロードしてください。";
    document.getElementById("message").style.color = "#f00";
  } else {
    message.innerHTML = "読み込みに成功しました！";
    document.getElementById("menu").style.display = "block";
    changeMode("data");
    makeSelectOption();

    if (document.getElementById("border").checked) {
      upBorder = Number(document.getElementById("red").value);
      downBorder = Number(document.getElementById("blue").value);
    }

    if (document.getElementById("heatmap").checked) isHeatmap = true;
    if (document.getElementById("hundred").checked) isHundred = true;

    all = makeObject(all, false);
    let result = fileReader.result;
    result = specialCharacter(result);
    splitToLine(result);

    // endTime = performance.now();
    // console.log(endTime - startTime);
    setTimeout(() => {
      generateSettingTable(-1, -1, -1);
      generateTable();
    }, 500);
  }
}

// ファイル読み込み失敗時
fileReader.onerror = () => {
  message.innerHTML = "ファイル読み込みに失敗しました。ブラウザを更新してから再度お試しください。";
  document.getElementById("message").style.color = "#f00";
}

let specialCharacter = s => {
  let t = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] == '&') t += "&amp;";
    else if (s[i] == '<') t += "&lt;";
    else if (s[i] == '>') t += "&gt;";
    else if (s[i] == '"') t += "&quot;";
    else if (s[i] == "'") t += "$#39;";
    else t += s[i];
  }

  return t;
}

// 行単位に分割
let splitToLine = s => {
  let line = s.split("\r\n");
  let del = true;
  while (del) {
    if (line[line.length - 1][0] == 'E') del = false;
    line.pop();
  }
  splitToCeil(line);
}

// セル単位に分割
let splitToCeil = v => {
  v.forEach(s => {
    let ceil = s.split(',');

    if (ceil[0][0] === '[') processSection(ceil);
    else {
      let isUnit = true;
      for (let i = 0; i < ceil[0].length; i++) {
        if (ceil[0][i] === '.') {
          isUnit = false;
          break;
        }
      }

      if (isUnit) processUnit(ceil);
      else processChapter(ceil);
    }
  });
}

// オブジェクトを作成
let makeObject = (e, isProblem) => {
  e = {};

  if (isProblem) {
    e["correctCnt"] = 0;
    e["wrongCnt"] = 0;
    e["solveCnt"] = 0;
    e["lastAnswer"] = false;
    e["evenOnceAnswer"] = false;
    e["evenOnceWrong"] = false;
    e["year"] = 0;
    e["answerMark"] = "";
    e["genre"] = "";
    e["answerText"] = "";
  } else {
    e["name"] = "";
    e["problemCnt"] = 0;

    e["correctCnt"] = [];
    e["wrongCnt"] = [];
    e["solveCnt"] = [];
    e["lastAnswer"] = 0;
    e["evenOnceAnswer"] = 0;
    e["evenOnceWrong"] = 0;
  }

  return e;
}

// 単元の処理
let processUnit = v => {
  unitIndex = Number(v[0]) - 1;
  chapter[unitIndex] = [];
  section[unitIndex] = [];
  problem[unitIndex] = [];

  let e = unit[unitIndex];
  e = makeObject(e, false);

  e["name"] = v[1];
  // console.log("UNIT", unitIndex + 1, v);
  unit[unitIndex] = e;
}

// 章の処理
let processChapter = v => {
  let s = "";
  let del = true;
  for (let i = 0; i < v[0].length; i++) {
    if (!del) s += v[0][i];
    if (v[0][i] === '.') del = false;
  };

  chapIndex = Number(s) - 1;
  section[unitIndex][chapIndex] = [];
  problem[unitIndex][chapIndex] = [];

  let e = chapter[unitIndex][chapIndex];
  e = makeObject(e, false);

  e["name"] = v[1];
  // console.log("CHAP", chapIndex + 1, v);
  chapter[unitIndex][chapIndex] = e;
}

// 節の処理
let processSection = v => {
  let s = "";
  for (let i = 0; i < v[0].length; i++) {
    if (!(i === 0 || i === (v[0].length - 1))) s += v[0][i];
  };

  sectIndex = Number(s) - 1;
  problem[unitIndex][chapIndex][sectIndex] = [];

  let e = section[unitIndex][chapIndex][sectIndex];
  e = makeObject(e, false);

  e["name"] = v[1];
  // console.log("SECT", sectIndex + 1, v);
  section[unitIndex][chapIndex][sectIndex] = e;

  let problemCnt = Number(v[2]);
  for (let i = 0; i < 3; i++) v.shift();

  processProblem(v, problemCnt);
}

// 問題の処理
let processProblem = (v, cnt) => {
  for (let probIndex = 0; probIndex < cnt; probIndex++) {
    problemList[0].push([unitIndex, chapIndex, sectIndex, probIndex]);

    if (unitIndex < 6) problemList[1].push([unitIndex, chapIndex, sectIndex, probIndex]);
    else if (unitIndex === 6) problemList[2].push([unitIndex, chapIndex, sectIndex, probIndex]);
    else problemList[3].push([unitIndex, chapIndex, sectIndex, probIndex]);

    let e = problem[unitIndex][chapIndex][sectIndex][probIndex];
    e = makeObject(e, true);

    let year = String(magicNumber[all["problemCnt"]]);
    let ans = year[4];
    year = year.slice(0, -1);

    e["year"] = year;
    if (ans == 1) e["answerMark"] = "ア";
    else if (ans == 2) e["answerMark"] = "イ";
    else if (ans == 3) e["answerMark"] = "ウ";
    else if (ans == 4) e["answerMark"] = "エ";
    else e["answerMark"] = "ERROR";

    if (unitIndex < 6) e["genre"] = "T";
    else if (unitIndex === 6) e["genre"] = "M";
    else e["genre"] = "S";

    let s = v[probIndex];
    e["answerText"] = s;

    for (let i = 0; i < s.length; i++) {
      e["solveCnt"]++;

      if (s[i] === 'o') {
        e["correctCnt"]++;
        e["lastAnswer"] = true;
        e["evenOnceAnswer"] = true;
      } else if (s[i] === 'x') {
        e["wrongCnt"]++;
        e["lastAnswer"] = false;
        e["evenOnceWrong"] = true;
      } else {
        message.innerHTML = `進捗の記入に'o', 'x'以外の文字が使われているため、進捗を正しく集計出来ていない可能性があります。CSVファイルの内容をご確認ください。`;
        document.getElementById("message").style.color = "#f00";
      }
    }

    let ep = [];
    ep[0] = all;
    ep[1] = unit[unitIndex];
    ep[2] = chapter[unitIndex][chapIndex];
    ep[3] = section[unitIndex][chapIndex][sectIndex];

    for (let i = 0; i < 4; i++) {
      ep[i]["problemCnt"]++;
      if (e["lastAnswer"]) ep[i]["lastAnswer"]++;
      if (e["evenOnceAnswer"]) ep[i]["evenOnceAnswer"]++;
      if (e["evenOnceWrong"]) ep[i]["evenOnceWrong"]++;

      ep[i]["correctCnt"].push(e["correctCnt"]);
      ep[i]["correctCnt"].sort();
      ep[i]["wrongCnt"].push(e["wrongCnt"]);
      ep[i]["wrongCnt"].sort();
      ep[i]["solveCnt"].push(e["solveCnt"]);
      ep[i]["solveCnt"].sort();
    }

    all = ep[0];
    unit[unitIndex] = ep[1];
    chapter[unitIndex][chapIndex] = ep[2];
    section[unitIndex][chapIndex][sectIndex] = ep[3];
    problem[unitIndex][chapIndex][sectIndex][probIndex] = e;
  }
}

// 表を生成
let generateTable = () => {
  for (let i = 0; i < problem.length; i++) {
    generateSettingTable(i, -1, -1);

    for (let j = 0; j < problem[i].length; j++) {
      generateSettingTable(i, j, -1);

      for (let k = 0; k < problem[i][j].length; k++) {
        generateSettingTable(i, j, k);

      }
    }
  }
}

// 表の設定を定義
let generateSettingTable = (i, j, k) => {
  i++;
  j++;
  k++;
  let id = `table${i}_${j}_${k}`;

  let p = document.createElement("div");
  p.setAttribute("id", id);
  p.style.display = "none";
  if (i === 0 && j === 0 && k === 0) p.style.display = "block";
  let e = document.createElement("table");
  e.setAttribute("border", 1);
  e.setAttribute("cellpadding", "10");

  if (i === 0 && j === 0 && k === 0) {
    generateUnitTable(p, e);
  } else if (j === 0 && k === 0) {
    generateChapterTable(p, e, i);
  } else if (k === 0) {
    generateSectionTable(p, e, i, j);
  } else {
    generateProblemTable(p, e, i, j, k);
  }
}

let generateUnitTable = (p, e) => {
  let sum = all["problemCnt"];
  let once = sum - binarySearch(all["solveCnt"], 1);
  let rate = (once / sum * 100).toFixed(2);
  document.getElementById("allOnce").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${once}問解答)</span>`;

  let twice = sum - binarySearch(all["solveCnt"], 2);
  rate = (twice / sum * 100).toFixed(2);
  document.getElementById("allTwice").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${twice}問解答)</span>`;

  let sum2 = all["solveCnt"].length - binarySearch(all["solveCnt"], 1);
  let achievement = all["evenOnceAnswer"];
  let rate2 = ((achievement / sum2 * 100).toFixed(2));
  if (sum2 === 0) rate2 = (0 / 1).toFixed(2);
  rate = (achievement / sum * 100).toFixed(2);
  document.getElementById("allAchievementA").innerHTML = `<span style="color:${changeColor(rate2)};">${rate2}%(${sum2}問中${achievement}問正解)</span>`;
  document.getElementById("allAchievementB").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${achievement}問正解)</span>`;

  let last = all["lastAnswer"];
  let rate3 = (last / sum2 * 100).toFixed(2);
  if (sum2 === 0) rate3 = (0 / 1).toFixed(2);
  rate = (last / sum * 100).toFixed(2);
  document.getElementById("allUnderstandingA").innerHTML = `<span style="color:${changeColor(rate)};">${rate3}%(${sum2}問中${last}問正解)</span>`;
  document.getElementById("allUnderstandingB").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${last}問正解)</span>`;

  let s = "";

  s += "<tr><th></th>";
  for (let i = 1; i <= unit.length; i++) s += `<th>単元${i}</th>`;
  s += "</tr>";

  s += "<tr><td><b>単元名</b></td>";
  for (let i = 0; i < unit.length; i++) s += `<td><a href="javascript:changeDisplay(${i + 1}, 0, 0);">${unit[i]["name"]}</a></td>`;
  s += "</tr>";

  s += "<tr><td><b>1回</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let once = sum - binarySearch(unit[i]["solveCnt"], 1);
    let rate = (once / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${once} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>2回</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let twice = sum - binarySearch(unit[i]["solveCnt"], 2);
    let rate = (twice / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${twice} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率A</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["solveCnt"].length - binarySearch(unit[i]["solveCnt"], 1);
    let achievement = unit[i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    if (sum === 0) rate = (0 / 1).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率B</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let achievement = unit[i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度A</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["solveCnt"].length - binarySearch(unit[i]["solveCnt"], 1);
    let last = unit[i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    if (sum === 0) rate = (0 / 1).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度B</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let last = unit[i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

let generateChapterTable = (p, e, u) => {
  u--;
  let title = document.createElement("p");
  title.innerHTML = `●単元${u + 1} ${unit[u]["name"]}`;
  p.appendChild(title);

  let s = "";

  s += "<tr><th></th>";
  for (let i = 1; i <= chapter[u].length; i++) s += `<th>${u + 1}.${i}</th>`;
  s += "</tr>";

  s += "<tr><td><b>チャプター名</b></td>";
  for (let i = 0; i < chapter[u].length; i++) s += `<td><a href="javascript:changeDisplay(${u + 1}, ${i + 1}, 0);">${chapter[u][i]["name"]}</a></td>`;
  s += "</tr>";

  s += "<tr><td><b>1回</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let once = sum - binarySearch(chapter[u][i]["solveCnt"], 1);
    let rate = (once / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${once} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>2回</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let twice = sum - binarySearch(chapter[u][i]["solveCnt"], 2);
    let rate = (twice / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${twice} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率A</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["solveCnt"].length - binarySearch(chapter[u][i]["solveCnt"], 1);
    let achievement = chapter[u][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    if (sum === 0) rate = (0 / 1).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率B</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let achievement = chapter[u][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度A</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["solveCnt"].length - binarySearch(chapter[u][i]["solveCnt"], 1);
    let last = chapter[u][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    if (sum === 0) rate = (0 / 1).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度B</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let last = chapter[u][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

let generateSectionTable = (p, e, u, c) => {
  u--;
  c--;
  let title = document.createElement("p");
  title.innerHTML = `●${u + 1}.${c + 1} ${chapter[u][c]["name"]}`;
  p.appendChild(title);

  let s = "";

  s += "<tr><th></th>";
  for (let i = 1; i <= section[u][c].length; i++) s += `<th>(${i})</th>`;
  s += "</tr>";

  s += "<tr><td><b>セクション名</b></td>";
  for (let i = 0; i < section[u][c].length; i++) s += `<td><a href="javascript:changeDisplay(${u + 1}, ${c + 1}, ${i + 1});">${section[u][c][i]["name"]}</a></td>`;
  s += "</tr>";

  s += "<tr><td><b>1回</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let once = sum - binarySearch(section[u][c][i]["solveCnt"], 1);
    let rate = (once / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${once} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>2回</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let twice = sum - binarySearch(section[u][c][i]["solveCnt"], 2);
    let rate = (twice / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${twice} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率A</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["solveCnt"].length - binarySearch(section[u][c][i]["solveCnt"], 1);
    let achievement = section[u][c][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    if (sum === 0) rate = (0 / 1).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率B</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let achievement = section[u][c][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度A</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["solveCnt"].length - binarySearch(section[u][c][i]["solveCnt"], 1);
    let last = section[u][c][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    if (sum === 0) rate = (0 / 1).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度B</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let last = section[u][c][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

let generateProblemTable = (p, e, u, c, si) => {
  u--;
  c--;
  si--;
  let title = document.createElement("p");
  title.innerHTML = `●${u + 1}.${c + 1} (${si + 1}) ${section[u][c][si]["name"]}`;
  p.appendChild(title);

  let s = "";

  for (let r = 0; r < Math.ceil(problem[u][c][si].length / 15); r++) {
    s += "<tr><th></th>";
    for (let i = (r * 15 + 1); i <= Math.min(problem[u][c][si].length, (r + 1) * 15); i++) s += `<th>問${i}</th>`;
    s += "</tr>";

    s += "<tr><td><b>解いた回数</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      s += `<td>${problem[u][c][si][i]["solveCnt"]}回</td>`;
    }
    s += "</tr>";

    s += "<tr><td><b>正解した回数</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      s += `<td>${problem[u][c][si][i]["correctCnt"]}回</td>`;
    }
    s += "</tr>";

    s += "<tr><td><b>間違えた回数</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      s += `<td>${problem[u][c][si][i]["wrongCnt"]}回</td>`;
    }
    s += "</tr>";

    s += "<tr><td><b>最後に正解</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      let ans;
      if (problem[u][c][si][i]["lastAnswer"]) ans = 'o';
      else ans = 'x';
      s += `<td>${ans}</td>`;
    }
    s += "</tr>";
  }

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

// 二分探索
let binarySearch = (v, key) => {
  let left = -1;
  let right = v.length;

  while (right - left > 1) {
    let mid = Math.floor(left + (right - left) / 2);
    if (v[mid] >= key) right = mid;
    else left = mid;
  }

  return right;
}

// 表の表示・非表示を切り替える
let changeDisplay = (u, c, si) => {
  for (let i = 1; i <= unit.length; i++) {
    document.getElementById(`table${i}_0_0`).style.display = "none";
  }

  for (let i = 1; i <= unit.length; i++) {
    for (let j = 1; j <= chapter[i - 1].length; j++) {
      for (let k = 0; k <= section[i - 1][j - 1].length; k++) {
        document.getElementById(`table${i}_${j}_${k}`).style.display = "none";
      }
    }
  }

  if (u !== 0) document.getElementById(`table${u}_0_0`).style.display = "block";
  if (c !== 0) document.getElementById(`table${u}_${c}_0`).style.display = "block";
  if (si !== 0) document.getElementById(`table${u}_${c}_${si}`).style.display = "block";

  scrollTo(0, 9999);
}

let changeColor = n => {
  if (n >= upBorder) return "#e00";
  else if (n < downBorder) return "#00e";
  else return "#000";
}

let changeBackgroundColor = n => {
  if (isHeatmap) {
    let baseOpacity = n / 250;
    if (isHundred && n == 100) return "#c4e2cb";
    else return `rgba(255, 0, 0, ${baseOpacity})`;
  }
  else return "#eee";
}

let changeMode = s => {
  if (s === "data") {
    document.getElementById("data").style.display = "block";
    document.getElementById("all").style.display = "block";
    document.getElementById("buttonData").style.color = "#fff";
    document.getElementById("buttonData").style.backgroundColor = "#31a9ee";
    document.getElementById("gacha").style.display = "none";
    document.getElementById("buttonGacha").style.color = "#000";
    document.getElementById("buttonGacha").style.backgroundColor = "#fff";
  } else {
    document.getElementById("data").style.display = "none";
    document.getElementById("all").style.display = "none";
    document.getElementById("buttonData").style.color = "#000";
    document.getElementById("buttonData").style.backgroundColor = "#fff";
    document.getElementById("gacha").style.display = "block";
    document.getElementById("buttonGacha").style.color = "#fff";
    document.getElementById("buttonGacha").style.backgroundColor = "#31a9ee";
  }
}

let makeSelectOption = () => {
  let d = document.getElementById("selectDownYear");
  let u = document.getElementById("selectUpYear");

  for (let i = oldYear; i <= newYear; i++) {
    let e1 = document.createElement("option");
    e1.setAttribute("value", String(i));
    e1.innerHTML = `${i}`;
    d.appendChild(e1);

    let e2 = document.createElement("option");
    e2.setAttribute("value", String(newYear + oldYear - i));
    e2.innerHTML = `${newYear + oldYear - i}`;
    u.appendChild(e2);
  }
}

let changeShowingMode = () => {
  if (document.getElementById("showingAll").checked) {
    document.getElementById("questionAll").style.display = "block";
    document.getElementById("questionGenre").style.display = "none";
  } else {
    document.getElementById("questionAll").style.display = "none";
    document.getElementById("questionGenre").style.display = "block";
  }
}

let shuffleArray = v => {
  for (let loop = 0; loop < 10000; loop++) {
    for (var i = (v.length - 1); 0 < i; i--) {
      var r = Math.floor(Math.random() * (i + 1));
      var tmp = v[i];
      v[i] = v[r];
      v[r] = tmp;
    }
  }
  return v;
}

let changeShowingAnswer = () => {
  if (document.getElementById("checkShowingAnswer").checked) {
    for (let i = 0; i < choiceList.length; i++) {
      if (i % 2 == 0) {
        document.getElementById(`list${i}_${7}`).style.backgroundColor = "#ddd";
      } else {
        document.getElementById(`list${i}_${7}`).style.backgroundColor = "#eee";
      }
    }
  } else {
    for (let i = 0; i < choiceList.length; i++) {
      document.getElementById(`list${i}_${7}`).style.backgroundColor = "#000";
    }
  }
}

let makeChoiceList = () => {
  downYear = document.getElementById("selectDownYear").value;
  upYear = document.getElementById("selectUpYear").value;

  let m = document.getElementById("results");
  if (m != null) m.remove();
  m = document.createElement("p");
  m.setAttribute("id", "results");

  let c = document.getElementById("checkShowingAnswer");
  if (c != null) c.remove();
  c = document.createElement("input");
  c.setAttribute("type", "checkbox");
  c.setAttribute("id", "checkShowingAnswer");
  c.setAttribute("onchange", "changeShowingAnswer()");
  // document.getElementById("gacha").appendChild(c);

  let t = document.getElementById("showingMessage");
  if (t != null) t.remove();
  t = document.createElement("span");
  t.setAttribute("id", "showingMessage");
  // document.getElementById("gacha").appendChild(t);
  t.innerHTML = " 答えを表示する<br>";

  let p = document.getElementById("choiceList");
  if (p != null) p.remove();
  p = document.createElement("table");
  p.setAttribute("id", "choiceList");
  p.style.width = "100%";
  p.style.marginTop = "5px";
  p.style.tableLayout = "fixed";

  for (let i = 0; i < 4; i++) extractList[i].length = 0;
  choiceList.length = 0;

  // 問題を抽出する
  let form = document.getElementById("extractProblems");
  let radioValue = form.extractProblemsProperty.value;

  switch (radioValue) {
    case 'a':
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < problemList[i].length; j++) {
          let v = problemList[i][j];
          let e1 = v[0], e2 = v[1], e3 = v[2], e4 = v[3];
          if (downYear <= problem[e1][e2][e3][e4]["year"] && problem[e1][e2][e3][e4]["year"] <= upYear) {
            extractList[i].push(problemList[i][j]);
          }
        }
      }
      break;

    case 'b':
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < problemList[i].length; j++) {
          let v = problemList[i][j];
          let e1 = v[0], e2 = v[1], e3 = v[2], e4 = v[3];
          if (downYear <= problem[e1][e2][e3][e4]["year"] && problem[e1][e2][e3][e4]["year"] <= upYear) {
            if ((!problem[e1][e2][e3][e4]["lastAnswer"]) && (problem[e1][e2][e3][e4]["solveCnt"] > 0)) {
              if (problem[e1][e2][e3][e4]["evenOnceWrong"]) {
                extractList[i].push(problemList[i][j]);
              }
            }
          }
        }
      }
      break;

    case 'c':
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < problemList[i].length; j++) {
          let v = problemList[i][j];
          let e1 = v[0], e2 = v[1], e3 = v[2], e4 = v[3];
          if (downYear <= problem[e1][e2][e3][e4]["year"] && problem[e1][e2][e3][e4]["year"] <= upYear) {
            if ((!problem[e1][e2][e3][e4]["lastAnswer"]) && (problem[e1][e2][e3][e4]["solveCnt"] > 0)) {
              extractList[i].push(problemList[i][j]);
            }
          }
        }
      }
      break;


    case 'd':
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < problemList[i].length; j++) {
          let v = problemList[i][j];
          let e1 = v[0], e2 = v[1], e3 = v[2], e4 = v[3];
          if (downYear <= problem[e1][e2][e3][e4]["year"] && problem[e1][e2][e3][e4]["year"] <= upYear) {
            if (!problem[e1][e2][e3][e4]["evenOnceAnswer"]) {
              extractList[i].push(problemList[i][j]);
            }
          }
        }
      }
      break;


    case 'e':
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < problemList[i].length; j++) {
          let v = problemList[i][j];
          let e1 = v[0], e2 = v[1], e3 = v[2], e4 = v[3];
          if (downYear <= problem[e1][e2][e3][e4]["year"] && problem[e1][e2][e3][e4]["year"] <= upYear) {
            if (problem[e1][e2][e3][e4]["solveCnt"] === 0) {
              extractList[i].push(problemList[i][j]);
            }
          }
        }
      }
      break;
  }

  // 指定した表示順に問題を整理する
  let maxCnt = [];
  maxCnt.push(document.getElementById("numberAll").value);
  maxCnt.push(document.getElementById("numberT").value);
  maxCnt.push(document.getElementById("numberM").value);
  maxCnt.push(document.getElementById("numberS").value);
  for (let i = 0; i < 4; i++) if (maxCnt[i] <= 0) maxCnt[i] = 10000;

  form = document.getElementById("orderProblems");
  radioValue = form.orderProblemsProperty.value;
  // console.log(maxCnt[0], maxCnt[1], maxCnt[2], maxCnt[3]);
  let cnt = 0;
  if (document.getElementById("showingAll").checked) {
    switch (radioValue) {
      case 'a':
        extractList[0] = shuffleArray(extractList[0]);
        for (let j = 0; j < extractList[0].length; j++) {
          if (cnt >= maxCnt[0]) break;
          choiceList.push(extractList[0][j]);
          cnt++;
        }
        break;

      case 'b':
        for (let j = 0; j < extractList[0].length; j++) {
          if (cnt >= maxCnt[0]) break;
          choiceList.push(extractList[0][j]);
          cnt++;
        }
        break;
    }
  } else {
    switch (radioValue) {
      case 'a':
        for (let i = 1; i < 4; i++) {
          extractList[i] = shuffleArray(extractList[i]);
          cnt = 0;
          for (let j = 0; j < extractList[i].length; j++) {
            if (cnt >= maxCnt[i]) break;
            choiceList.push(extractList[i][j]);
            cnt++;
          }
        }
        choiceList = shuffleArray(choiceList);
        break;

      case 'b':
        for (let i = 1; i < 4; i++) {
          cnt = 0;
          for (let j = 0; j < extractList[i].length; j++) {
            if (cnt >= maxCnt[i]) break;
            choiceList.push(extractList[i][j]);
            cnt++;
          }
        }
        break;
    }
  }

  // リスト(表)を生成してHTMLに反映させる
  let widthArray = [65, 120, 40, 315, 315, 315, 65, 40];
  m.innerHTML = `表示した問題数：${choiceList.length}問`;
  m.style.paddingTop = "20px";
  m.style.borderBottom = "1px solid #000";
  m.style.fontWeight = "Bold";
  m.style.display = "inline-block";
  m.style.marginRight = "5px";
  document.getElementById("gacha").appendChild(m);
  document.getElementById("gacha").appendChild(c);
  document.getElementById("gacha").appendChild(t);
  let tr = document.createElement("tr");

  for (let i = 0; i <= 7; i++) {
    let e = document.createElement("th");
    e.style.width = `${widthArray[i]}px`;
    e.style.textAlign = "center";

    switch (i) {
      case 0:
        e.innerHTML = "番号";
        break;

      case 1:
        e.innerHTML = "問題名";
        break;

      case 2:
        e.innerHTML = "分野";
        break;

      case 3:
        e.innerHTML = "unit名";
        break;

      case 4:
        e.innerHTML = "chapter名";
        break;

      case 5:
        e.innerHTML = "section名";
        break;

      case 6:
        e.innerHTML = "進捗";
        break;

      case 7:
        e.innerHTML = "答え";
        break;
    }

    tr.appendChild(e);
  }

  p.appendChild(tr);

  for (let i = 0; i < choiceList.length; i++) {
    let v = [];
    for (let j = 0; j < 4; j++) v.push(choiceList[i][j]);

    let tr = document.createElement("tr");
    tr.setAttribute("id", `list${i}`);
    if (i % 2 == 0) tr.style.backgroundColor = "#ddd";
    else tr.style.backgroundColor = "#eee";

    for (let j = 0; j <= 7; j++) {
      let e = document.createElement("td");
      e.setAttribute("id", `list${i}_${j}`);
      e.style.width = `${widthArray[i]}px`;
      e.style.textAlign = "center";

      switch (j) {
        case 0:
          e.innerHTML = `${i + 1}`;
          break;

        case 1:
          e.innerHTML = `${v[0] + 1}.${v[1] + 1}(${v[2] + 1}) 問${v[3] + 1}`;
          e.style.textAlign = "left";
          break;

        case 2:
          e.innerHTML = `${problem[v[0]][v[1]][v[2]][v[3]]["genre"]}`;
          break;

        case 3:
          e.innerHTML = `${unit[v[0]]["name"]}`;
          break;

        case 4:
          e.innerHTML = `${chapter[v[0]][v[1]]["name"]}`;
          break;

        case 5:
          e.innerHTML = `${section[v[0]][v[1]][v[2]]["name"]}`;
          break;

        case 6:
          e.innerHTML = `${problem[v[0]][v[1]][v[2]][v[3]]["answerText"]}`;
          e.style.textAlign = "left";
          break;

        case 7:
          e.innerHTML = `${problem[v[0]][v[1]][v[2]][v[3]]["answerMark"]}`;
          e.style.backgroundColor = "#000";
          break;
      }

      tr.appendChild(e);
    }

    p.appendChild(tr);
  }

  document.getElementById("gacha").appendChild(p);
  scrollTo(0, 900);

  // for (let i = 0; i < 4; i++) console.log(i, extractList[i].length, extractList[i]);
  // console.log(choiceList.length, choiceList);
}

let magicNumber = [20204,20112,20153,20163,20021,20142,20193,20121,20134,20092,20144,20103,20082,19984,19993,20051,20211,20003,20214,20113,20054,20131,20154,20191,20004,20034,20134,20191,20161,20163,20211,20174,20144,20131,20062,20152,20203,20182,20072,20074,20171,20001,20063,20201,20171,20161,20214,20173,20172,20034,20162,20124,20214,20182,20192,20073,20084,20074,20142,20122,20183,20182,20203,20122,20071,20193,20203,20122,20102,20171,20123,20174,20181,20093,20163,20214,20013,20133,20034,20191,20213,20212,20132,20103,20192,20063,20093,20213,20011,20093,20204,20124,20181,20054,20211,20123,20092,20204,20213,20163,20093,20061,20183,20182,20184,19992,20164,20062,20072,20214,20142,20193,20103,20083,20204,20172,20092,20163,20072,20182,20144,20112,19994,20183,20154,20192,20181,20021,20133,20213,19983,20191,20144,20034,20053,20192,20183,20173,20122,20123,20091,20171,20002,20132,20213,20142,20053,20174,20042,20121,20073,20164,20212,20104,20152,20203,20214,20213,20162,20112,20092,20141,20104,20033,20001,20114,20101,20094,20062,20192,20063,20194,20201,20141,20162,20014,20062,20213,20142,20194,20173,20194,20154,20184,20163,20142,20194,20203,20184,20182,20171,20212,20192,20174,20091,20204,20214,20172,20192,20053,20101,20193,20181,20164,20212,20001,20051,20193,20003,20032,20133,20163,20203,20203,20204,20051,20042,20214,20211,20043,20012,20051,20004,20071,20214,20161,20192,20212,20192,20021,20111,20211,20112,20103,20074,20212,20122,20193,20202,20162,20183,20202,20211,20181,20153,20141,20121,20131,20141,20073,20184,20161,20183,20214,20153,20194,20213,20124,20053,20063,20101,20171,20102,20192,20024,20191,20193,20164,20204,20214,20182,20143,20181,20164,20201,20053,20152,20192,20184,20214,20183,20193,20144,20211,20173,20132,20173,20201,20183,20194,20211,20172,20212,20124,20093,20111,19983,19981,20034,20003,20202,20192,20051,20181,20162,20144,20181,20173,20154,20162,20124,20163,20183,20212,20201,20191,20152,20062,20211,20214,20181,20141,20211,20201,20161,20193,20162,20184,20211,20103,20154,20102,20161,20172,20042,20061,20194,20054,20213,20153,20152,20091,20184,20174,20061,20213,20213,20163,20194,20174,20183,20193,20213,20211,20213,20202,20202,20202,20211,20173,20211,20191,20213,20213,20212,20174,20193,20214,20211,20054,20062,20191,20084,20013,20072,20194,20033,19983,20012,20073,20003,20003,20063,20211,20203,20171,20134,20153,20124,20113,20092,20163,20102,20183,20174,20212,20123,20203,20164,20064,20003,20022,20064,19981,20114,19993,20112,20212,20172,20132,20204,20214,20051,20124,20152,20181,20062,20071,20191,20204,20153,20074,20192,20043,20023,20162,20212,20124,20151,20192,20173,20184,20174,20144,20212,20212,20194,20053,20153,20161,20201,20162,20183,20182,20121,20163,20174,20183,20212,20214,20214,20101,20193,20142,20114,20053,20052,20093,20182,20112,20192,20091,20091,20212,20202,20204,20183,20163,20174,20182,20132,20184,20072,20114,20092,20033,20203,20181,20183,20064,20214,20194,20193,20074,19993,19982,20102,20051,20053,20003,19994,20042,20064,20074,20022,20074,20182,20202,20164,20153,20122,20052,20171,20191,20053,20023,20092,20211,20172,20164,20192,20193,20213,20161,20174,20211,20214,20202,20201,20212,20192,20172,20052,20212,20164,20152,20214,20144,20122,20021,20111,20132,20214,20154,20044,20073,20132,20142,20182,20014,20194,20211,20202,20183,20211,20162,20211,20193,20202,20144,20213,20203,20202,20173,20194,20164,20213,20193,20184,20211,20211,20122,20122,20202,20123,20133,20182,20201,20204,20184,20201,20183,20193,20193,20181,20151,20174,20212,20212,20173,20184,20152,20174,20194,20191,20211,20154,20133,20184,20213,20213,20183,20211,20213,20183,20213,20054,20132,20214,20193,20212,20192,20184,20174,20191,20193,20201,20183,20192,20162,20194,20192,20194,20164,20212,20164,20182,20212,20194,20193,20183,20181,20122,19994,20192,20092,20093,20193,20141,20001,20214,20093,20183,20154,20172,20102,20074,19983,20052,20112,20173,20154,20041,20024,20092,20163,20122,20201,20211,20182,20182,20041,20194,20121,20121,20212,20161,20193,20194,20162,20153,20193,19994,19983,20011,19982,19981,20054,20162,20001,20171,20121,20093,20213,20114,20182,20093,20053,20012,20171,20162,20144,20183,20111,19994,20151,20074,20131,20191,20141,20174,20101,19981,20001,20211,20174,20032,20142,20181,20021,20154,20134,20051,20102,20074,20022,20092,20142,20174,20071,20073,20193,20204,20061,20164,20151,20214,20181,20181,20211,20203,20212,20194,20183,20093,20113,20154,20112,20184,20193,20101,20171,20084,20121,20161,20194,20072,20051,20034,20164,20044,20144,20134,20211,20194,20193,20214,20204,20183,20214,20212,20214,20203,20172,20193,20193,20191,20211,20212,20202,20183,20214,20161,20182,20181,20201,20194,20193,20183,20182,20193,20141,20191,20211,20182,20203,20194,20202,20091,20194,20141,20192,20214,20171,20203,20143,20191,20001,20212,20184,20174,20213,20181,20193,20193,20212,20201,20213,20213,20202,20214,20213,20192,20211,20181,20193,20193,20151,20162,20182,20213,20211,20191,20194,20201,20182,20204,20213,20191,20194,20201,20203,20204,20212,20194,20194,20214,20212,20214,20184,20213,20212,20192,20213,20213,20203,20193,20201,20212,20213,20212,20192,20211,20192,20211,20193,20211,20191,20214,20204,20212,20194,20204,20214,20212,20204,20174,20182,20192,20191,20124,20174,20213,20193,20214,20211,20184,20174,20164,20212,20154,20211,20171,20172,20164,20213,20184,20162,20213,20201,20193,20211,20191,20183,20192,20204,20214,20203,20211,20183,20183,20202,20193,20193,20192,20154,20212,20184,20194,20171,20132,20204,20161,20214,20211,20194,20204,20174,20163,20212,20202,20182,20212,20214,20211,20162,20211,20143,20192,20203,20184,20183,20164,20193,20181,20162,20091,20171,20061,20171,20074,20192];