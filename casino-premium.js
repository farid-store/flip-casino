/* ==========================================================
   PART 3A
   UI ENGINE + DOM CACHE + BETTING OPTIMIZATION
========================================================== */

const UI = {

balance:document.getElementById("displayBalance"),
spinTotal:document.getElementById("spinTotal"),
banner:document.getElementById("infoBanner"),
spinBtn:document.getElementById("btnSpin"),
clearBtn:document.getElementById("btnClear"),
board:document.getElementById("bettingBoard"),

chips:new Map(),

chipButtons:[...document.querySelectorAll(".chip-btn")],

spots:[...document.querySelectorAll(".bet-spot")]

};

/* ========================================= */

function formatMoney(v){

return Number(v).toLocaleString("id-ID");

}

function formatChip(v){

return v>=1000?(v/1000)+"K":v;

}

/* ========================================= */

function updateBalance(){

UI.balance.textContent=formatMoney(currentUser.balance);

}

function updateSpinTotal(){

UI.spinTotal.textContent=totalBet>0?`(${formatChip(totalBet)})`:"";

}

/* ========================================= */

function setBanner(message,win=false){

UI.banner.textContent=message;

UI.banner.classList.toggle("win-text",win);

}

/* ========================================= */

function selectChip(value){

if(isSpinning)return;

currentChip=value;

UI.chipButtons.forEach(btn=>{

btn.classList.remove("active");

let txt=btn.textContent.trim();

let amount=txt.includes("K")

?parseInt(txt)*1000

:parseInt(txt);

if(amount===value)

btn.classList.add("active");

});

}

/* ========================================= */

function getChip(id){

if(UI.chips.has(id))

return UI.chips.get(id);

const el=document.getElementById("chip-"+id);

UI.chips.set(id,el);

return el;

}

/* ========================================= */

function animateChip(el){

el.classList.remove("chip-update");

void el.offsetWidth;

el.classList.add("chip-update");

}

/* ========================================= */

function placeBet(spot){

if(isSpinning)return;

if(currentUser.balance<currentChip){

setBanner("INSUFFICIENT BALANCE");

return;

}

currentUser.balance-=currentChip;

totalBet+=currentChip;

bets[spot]=(bets[spot]||0)+currentChip;

updateBalance();

updateSpinTotal();

const chip=getChip(spot);

chip.style.display="flex";

chip.textContent=formatChip(bets[spot]);

animateChip(chip);

setBanner("BET ACCEPTED");

}

/* ========================================= */

function clearBets(){

if(isSpinning)return;

if(totalBet===0)return;

currentUser.balance+=totalBet;

bets={};

totalBet=0;

updateBalance();

updateSpinTotal();

UI.chips.forEach(chip=>{

chip.style.display="none";

chip.classList.remove("chip-update");

});

setBanner("ALL BETS CLEARED");

}

/* ========================================= */

function disableGame(){

isSpinning=true;

UI.spinBtn.disabled=true;

UI.clearBtn.disabled=true;

UI.spots.forEach(s=>{

s.style.pointerEvents="none";

});

}

/* ========================================= */

function enableGame(){

isSpinning=false;

UI.spinBtn.disabled=false;

UI.clearBtn.disabled=false;

UI.spots.forEach(s=>{

s.style.pointerEvents="auto";

});

}

/* ========================================= */

function resetTable(){

bets={};

totalBet=0;

updateSpinTotal();

UI.chips.forEach(chip=>{

chip.style.display="none";

chip.classList.remove("chip-update");

});

}

/* ========================================= */

updateBalance();

updateSpinTotal();

setBanner("PLACE YOUR BETS");

/* ==========================================================
   PART 3B
   PREMIUM SPIN ENGINE
========================================================== */

function spinWheel(){

    if(isSpinning) return;

    if(totalBet<=0){
        setBanner("PLACE A BET FIRST!");
        return;
    }

    disableGame();

    setBanner("NO MORE BETS");

    const targetNumber = determineWinningNumber();

    const baseIndex = ROULETTE_SEQ.indexOf(targetNumber);

    const loops = 4 + Math.floor(Math.random()*2);

    const targetIndex = (ROULETTE_SEQ.length * loops) + baseIndex;

    const wheelContainer = document.querySelector(".wheel-container");

    const firstItem = track.querySelector(".wheel-number");

    const gap = parseFloat(getComputedStyle(track).gap) || 4;

    const itemWidth = firstItem.getBoundingClientRect().width + gap;

    const containerCenter = wheelContainer.clientWidth / 2;

    const drift = (Math.random()-0.5) * 10;

    const finalPosition =
        (targetIndex * itemWidth)
        - containerCenter
        + (itemWidth/2)
        + drift;

    track.style.willChange="transform";

    track.style.transition="none";

    track.style.transform="translate3d(0,0,0)";

    void track.offsetWidth;

    requestAnimationFrame(()=>{

        track.style.transition =
        "transform 4.8s cubic-bezier(.08,.86,.18,1)";

        track.style.transform =
        `translate3d(-${finalPosition}px,0,0)`;

    });

    setTimeout(()=>{

        track.style.willChange="auto";

        resolveSpin(targetNumber);

    },4900);

}

/* =========================================
   RESIZE FIX
========================================= */

let resizeTimer;

window.addEventListener("resize",()=>{

    clearTimeout(resizeTimer);

    resizeTimer=setTimeout(()=>{

        track.style.transition="none";

    },150);

});

/* =========================================
   PRELOAD GPU
========================================= */

track.style.transform="translate3d(0,0,0)";
track.style.backfaceVisibility="hidden";
track.style.perspective="1000px";
track.style.transformStyle="preserve-3d";

/* ==========================================================
   PART 3C
   RESULT ENGINE + PREMIUM OVERLAY
========================================================== */

function resolveSpin(winNumber){

    const payout = calculatePayoutForNumber(winNumber);

    const modal = document.getElementById("resultModal");

    const resNum = document.getElementById("resNumber");

    const resText = document.getElementById("resText");

    const resLabel = document.getElementById("resLabel");

    const isRed = RED_NUMS.includes(winNumber);

    const color =
        winNumber===0
        ? "var(--success)"
        : isRed
        ? "var(--danger)"
        : "#cbd5e1";

    resLabel.textContent="WINNING NUMBER";

    resNum.textContent=winNumber;

    resNum.style.color=color;

    /* =====================================
       WIN
    ===================================== */

    if(payout>0){

        currentUser.balance+=payout;

        updateBalance();

        resText.className="result-payout";

        resText.textContent="+ "+formatMoney(payout);

        setBanner("YOU WIN "+formatMoney(payout),true);

        confettiEngine.burst(120);

        modal.classList.add("jackpot");

        if(payout>=totalBet*15){

            resLabel.textContent="BIG WIN";

            confettiEngine.burst(220);

        }

        if(payout>=totalBet*30){

            resLabel.textContent="MEGA WIN";

            confettiEngine.burst(300);

        }

        if(payout>=totalBet*50){

            resLabel.textContent="JACKPOT";

            confettiEngine.burst(450);

        }

    }

    /* =====================================
       LOSE
    ===================================== */

    else{

        resText.className="result-zonk";

        resText.textContent="HOUSE WINS";

        setBanner("BETTER LUCK NEXT ROUND");

        modal.classList.remove("jackpot");

    }

    modal.classList.add("show");

}

/* ==========================================================
   CLOSE RESULT
========================================================== */

function closeResult(){

    const modal=document.getElementById("resultModal");

    modal.classList.remove("show");

    modal.classList.remove("jackpot");

    resetTable();

    enableGame();

    setBanner("PLACE YOUR BETS");

    if(typeof api!=="undefined" && api.saveProgress){

        api.saveProgress(

            currentUser.username,

            currentUser.balance,

            currentUser.level||1,

            currentUser.exp||0

        ).catch(()=>{});

    }

}

/* ==========================================================
   PREMIUM TOAST
========================================================== */

function toast(message){

    let toast=document.getElementById("premiumToast");

    if(!toast){

        toast=document.createElement("div");

        toast.id="premiumToast";

        toast.className="toast-message";

        document.body.appendChild(toast);

    }

    toast.textContent=message;

    toast.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer=setTimeout(()=>{

        toast.classList.remove("show");

    },2200);

}

/* ==========================================================
   HISTORY ENGINE
========================================================== */

const lastResults=[];

function addHistory(number){

    lastResults.unshift(number);

    if(lastResults.length>15)

        lastResults.pop();

    const history=document.getElementById("historyBar");

    if(!history)return;

    history.innerHTML="";

    lastResults.forEach(n=>{

        const item=document.createElement("div");

        item.className="history-item";

        if(n===0){

            item.classList.add("green");

        }else if(RED_NUMS.includes(n)){

            item.classList.add("red");

        }else{

            item.classList.add("black");

        }

        item.textContent=n;

        history.appendChild(item);

    });

}

/* ==========================================================
   AUTO HISTORY
========================================================== */

const oldResolveSpin=resolveSpin;

resolveSpin=function(number){

    addHistory(number);

    oldResolveSpin(number);

};

/* ==========================================================
   PART 3D
   PREMIUM LIVE ENGINE
   Final Integration
========================================================== */

/* ==========================================
   LAST RESULT HISTORY
========================================== */

const gameStats={

history:[],

red:0,

black:0,

green:0,

spin:0,

};

function updateStatistics(number){

gameStats.spin++;

if(number===0){

gameStats.green++;

}else if(RED_NUMS.includes(number)){

gameStats.red++;

}else{

gameStats.black++;

}

gameStats.history.unshift(number);

if(gameStats.history.length>20)

gameStats.history.pop();

renderHistory();

renderLiveStats();

}

/* ==========================================
   HISTORY
========================================== */

function renderHistory(){

const history=document.getElementById("historyBar");

if(!history) return;

history.innerHTML="";

gameStats.history.forEach(num=>{

const div=document.createElement("div");

div.className="history-item";

if(num===0){

div.classList.add("green");

}else if(RED_NUMS.includes(num)){

div.classList.add("red");

}else{

div.classList.add("black");

}

div.textContent=num;

history.appendChild(div);

});

}

/* ==========================================
   LIVE STATS
========================================== */

function renderLiveStats(){

const red=document.getElementById("statRed");

const black=document.getElementById("statBlack");

const green=document.getElementById("statGreen");

const spin=document.getElementById("statSpin");

if(red) red.textContent=gameStats.red;

if(black) black.textContent=gameStats.black;

if(green) green.textContent=gameStats.green;

if(spin) spin.textContent=gameStats.spin;

}

/* ==========================================
   HOT COLD NUMBER
========================================== */

function calculateHotCold(){

const map={};

gameStats.history.forEach(n=>{

map[n]=(map[n]||0)+1;

});

let hot="-";

let cold="-";

let hotCount=0;

let coldCount=999;

Object.keys(map).forEach(k=>{

if(map[k]>hotCount){

hot=k;

hotCount=map[k];

}

if(map[k]<coldCount){

cold=k;

coldCount=map[k];

}

});

const hotUI=document.getElementById("hotNumber");

const coldUI=document.getElementById("coldNumber");

if(hotUI) hotUI.textContent=hot;

if(coldUI) coldUI.textContent=cold;

}

/* ==========================================
   PREMIUM TOAST
========================================== */

function premiumToast(text,color="#d4af37"){

let toast=document.getElementById("premiumToast");

if(!toast){

toast=document.createElement("div");

toast.id="premiumToast";

toast.className="toast-message";

document.body.appendChild(toast);

}

toast.textContent=text;

toast.style.borderColor=color;

toast.style.boxShadow=`0 0 25px ${color}`;

toast.classList.add("show");

clearTimeout(toast.timer);

toast.timer=setTimeout(()=>{

toast.classList.remove("show");

},2200);

}

/* ==========================================
   SOUND HOOK
========================================== */

const sound={

spin:new Audio(),

win:new Audio(),

lose:new Audio()

};

/* nanti tinggal isi src

sound.spin.src="audio/spin.mp3";

sound.win.src="audio/win.mp3";

sound.lose.src="audio/lose.mp3";

*/

/* ==========================================
   WRAP resolveSpin
========================================== */

const originalResolve=resolveSpin;

resolveSpin=function(number){

updateStatistics(number);

calculateHotCold();

originalResolve(number);

if(calculatePayoutForNumber(number)>0){

premiumToast("YOU WIN","#16a34a");

/* sound.win.play(); */

}else{

premiumToast("HOUSE WINS","#ef4444");

/* sound.lose.play(); */

}

}

/* ==========================================
   AUTO SAVE
========================================== */

setInterval(()=>{

if(typeof api==="undefined") return;

if(!api.saveProgress) return;

api.saveProgress(

currentUser.username,

currentUser.balance,

currentUser.level||1,

currentUser.exp||0

).catch(()=>{});

},30000);

/* ==========================================
   ANTI DOUBLE CLICK
========================================== */

document.addEventListener("dblclick",e=>{

e.preventDefault();

});

/* ==========================================
   ESC CLOSE RESULT
========================================== */

document.addEventListener("keydown",e=>{

if(e.key==="Escape"){

const modal=document.getElementById("resultModal");

if(modal.classList.contains("show"))

closeResult();

}

});

/* ==========================================
   INIT
========================================== */

window.addEventListener("load",()=>{

updateBalance();

updateSpinTotal();

renderHistory();

renderLiveStats();

calculateHotCold();

setBanner("WELCOME TO VIP ROULETTE");

});
