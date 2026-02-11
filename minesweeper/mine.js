let rows, cols, minesTotal;

let board = [];
let revealedCount = 0;
let timerInterval;
let seconds = 0;

let flagsLeft = 0;

let pvpMode = false;
let playerTurn = true;
let gameActive = true;

let playerScore = 0;
let sisilScore = 0;

const mineCountDisplay = document.getElementById("mineCount");
const timerDisplay = document.getElementById("timer");
const restartBtn = document.getElementById("restartBtn");
const boardDiv = document.getElementById("board");
const difficultySelect = document.getElementById("difficulty");
const pvpBtn = document.getElementById("pvpBtn");
const flagsDisplay = document.getElementById("flagsLeft");

restartBtn.addEventListener("click", () => {
  pvpMode = false;
  init();
});

difficultySelect.addEventListener("change", () => {
  pvpMode = false;
  init();
});

pvpBtn.addEventListener("click", () => {
  pvpMode = !pvpMode;
  init();
});

function setDifficulty() {
  const level = difficultySelect.value;

  if(level === "easy"){
    rows = 8; cols = 8; minesTotal = 10;
  }
  else if(level === "medium"){
    rows = 12; cols = 12; minesTotal = 25;
  }
  else if(level === "hard"){
    rows = 16; cols = 16; minesTotal = 40;
  }
  else if(level === "extreme"){
    rows = 20; cols = 20; minesTotal = 80;
  }
  else if(level === "hacker"){
    rows = 24; cols = 24; minesTotal = 140;
  }
  else if(level === "champion"){
    rows = 30; cols = 30; minesTotal = 250;
  }
  else if(level === "sisil"){
    rows = 35; cols = 35; minesTotal = 400;
  }
}

function init(){
  clearInterval(timerInterval);
  seconds = 0;
  revealedCount = 0;
  playerTurn = true;
  gameActive = true;

  setDifficulty();

  flagsLeft = minesTotal;

  timerDisplay.textContent = 0;
  mineCountDisplay.textContent = minesTotal;
  flagsDisplay.textContent = flagsLeft;

  board = [];
  boardDiv.innerHTML = "";
  boardDiv.style.gridTemplateColumns = `repeat(${cols}, 30px)`;

  for(let r=0;r<rows;r++){
    board[r] = [];
    for(let c=0;c<cols;c++){

      const cellElement = document.createElement("div");
      cellElement.classList.add("cell");

      const cell = {
        mine:false,
        revealed:false,
        flagged:false,
        number:0,
        element:cellElement
      };

      cellElement.addEventListener("click", ()=>{
        if(!playerTurn && pvpMode) return;
        reveal(r,c);
      });

      cellElement.addEventListener("contextmenu", (e)=>{
        e.preventDefault();
        toggleFlag(r,c);
      });

      board[r][c] = cell;
      boardDiv.appendChild(cellElement);
    }
  }

  placeMines();
  calculateNumbers();

  timerInterval = setInterval(()=>{
    seconds++;
    timerDisplay.textContent = seconds;
  },1000);
}

function placeMines(){
  let placed = 0;
  while(placed < minesTotal){
    let r = Math.floor(Math.random()*rows);
    let c = Math.floor(Math.random()*cols);
    if(!board[r][c].mine){
      board[r][c].mine = true;
      placed++;
    }
  }
}

function calculateNumbers(){
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(board[r][c].mine) continue;

      let count = 0;
      for(let dr=-1;dr<=1;dr++){
        for(let dc=-1;dc<=1;dc++){
          let nr=r+dr, nc=c+dc;
          if(nr>=0 && nr<rows && nc>=0 && nc<cols){
            if(board[nr][nc].mine) count++;
          }
        }
      }
      board[r][c].number = count;
    }
  }
}

function reveal(r,c){
  if(!gameActive) return;

  const cell = board[r][c];
  if(cell.revealed || cell.flagged) return;

  cell.revealed = true;
  cell.element.classList.add("revealed");

  if(cell.mine){
    cell.element.textContent="💣";
    cell.element.classList.add("mine");

    if(pvpMode){
      alert("You exploded lol 💀 Sisil wins this round!");
      sisilScore++;
    }

    gameOver(false);
    return;
  }

  revealedCount++;

  if(cell.number > 0){
    cell.element.textContent = cell.number;
  } else {
    for(let dr=-1;dr<=1;dr++){
      for(let dc=-1;dc<=1;dc++){
        let nr=r+dr, nc=c+dc;
        if(nr>=0 && nr<rows && nc>=0 && nc<cols){
          reveal(nr,nc);
        }
      }
    }
  }

  if(revealedCount === rows*cols - minesTotal){
    if(pvpMode){
      alert("You cleared the board 🏆");
      playerScore++;
    }
    gameOver(true);
    return;
  }

  if(pvpMode){
    playerTurn = false;
    setTimeout(sisilMove, 600);
  }
}

function toggleFlag(r,c){
  const cell = board[r][c];
  if(cell.revealed || !gameActive) return;

  if(cell.flagged){
    cell.flagged = false;
    cell.element.textContent = "";
    flagsLeft++;
  } else {
    if(flagsLeft <= 0) return;
    cell.flagged = true;
    cell.element.textContent = "🚩";
    flagsLeft--;
  }

  flagsDisplay.textContent = flagsLeft;
}

function sisilMove(){
  if(!gameActive) return;

  let safeMoves = [];
  let riskyMoves = [];

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const cell = board[r][c];

      if(!cell.revealed && !cell.flagged){
        riskyMoves.push({r,c});
      }

      if(cell.revealed && cell.number > 0){
        let hidden = [];
        let flaggedCount = 0;

        for(let dr=-1;dr<=1;dr++){
          for(let dc=-1;dc<=1;dc++){
            let nr=r+dr, nc=c+dc;
            if(nr>=0 && nr<rows && nc>=0 && nc<cols){
              const neighbor = board[nr][nc];
              if(neighbor.flagged) flaggedCount++;
              if(!neighbor.revealed && !neighbor.flagged){
                hidden.push({r:nr,c:nc});
              }
            }
          }
        }

        if(flaggedCount === cell.number){
          safeMoves.push(...hidden);
        }
      }
    }
  }

  let move;

  if(safeMoves.length > 0){
    move = safeMoves[Math.floor(Math.random()*safeMoves.length)];
  } else {
    move = riskyMoves[Math.floor(Math.random()*riskyMoves.length)];
  }

  const target = board[move.r][move.c];

  if(target.mine){
    alert("Sisil exploded 💀 You win this round!");
    playerScore++;
    gameOver(true);
    return;
  }

  reveal(move.r, move.c);
  playerTurn = true;
}

function gameOver(win){
  clearInterval(timerInterval);
  gameActive = false;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(board[r][c].mine){
        board[r][c].element.textContent="💣";
      }
    }
  }

  setTimeout(()=>{
    alert(
      (win ? "ROUND OVER 🏆" : "GAME OVER 💀") +
      `\nScore: You ${playerScore} | Sisil ${sisilScore}`
    );
    init();
  },100);
}

init();
