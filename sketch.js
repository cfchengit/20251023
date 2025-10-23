// 全域變數定義
let finalScore = 0; 
let maxScore = 0;
let scoreText = "等待 H5P 成績中..."; 
let scoreCanvas; 

// 煙火相關全域變數
let fireworks = [];
let gravity;
const FIREWORK_COUNTDOWN = 60; 


// =================================================================
// 類別定義 (Particle & Firework)
// (與上一個版本相同，已移除音效)
// =================================================================

// 粒子類別 (用於火箭和爆炸碎片)
class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework;
        this.lifespan = 255;
        this.hu = hue;
        this.acc = createVector(0, 0);

        if (this.firework) {
            this.vel = createVector(0, random(-10, -15));
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9); 
            this.lifespan -= 4; 
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    show() {
        colorMode(HSB);

        if (this.firework) {
            // 火箭顆粒大小
            strokeWeight(6); 
            stroke(this.hu, 255, 255);
        } else {
            // 碎片顆粒大小
            strokeWeight(3); 
            stroke(this.hu, 255, 255, this.lifespan);
        }
        point(this.pos.x, this.pos.y);
    }
    
    done() {
        return this.lifespan < 0;
    }
}

// 煙火類別 (管理一個火箭及其爆炸)
class Firework {
    constructor(startX, startY) {
        this.hu = random(255); 
        this.firework = new Particle(startX, startY, this.hu, true); 
        this.exploded = false;
        this.particles = [];
        this.timer = FIREWORK_COUNTDOWN;
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();
            
            this.timer--;
            if (this.timer <= 0) {
                this.explode();
                this.exploded = true;
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        for (let i = 0; i < 100; i++) {
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        
        for (const p of this.particles) {
            p.show();
        }
    }
    
    done() {
        return this.exploded && this.particles.length === 0;
    }
}

// =================================================================
// 輔助函式：繪製帶有背景框的文字
// =================================================================
function drawTextBox(textString, x, y, boxW, boxH) {
    // 繪製半透明白色方框背景
    fill(255, 255, 255, 204); // 白色，透明度 80%
    noStroke();
    rectMode(CENTER);
    rect(x, y, boxW, boxH, 10); // 圓角半徑 10

    // 繪製文字 (文字顏色使用黑色，以配合白色背景)
    fill(0); // 黑色文字
    textSize(30); 
    textAlign(CENTER, CENTER);
    text(textString, x, y);
}

// =================================================================
// p5.js 繪圖邏輯
// =================================================================
function setup() {
    const container = document.getElementById('overlay-container');
    const w = container.offsetWidth;
    const h = container.offsetHeight;

    scoreCanvas = createCanvas(w, h); 
    scoreCanvas.parent('overlay-container'); 
    
    colorMode(HSB, 255); 
    gravity = createVector(0, 0.2); 

    scoreCanvas.hide(); 
    
    loop(); 
    noLoop(); 
} 

function draw() { 
    clear(); // 每次繪製，先清除畫布

    colorMode(RGB); 
    
    if (finalScore === 0 && maxScore === 0) {
        // **狀態：等待成績 (初始狀態)**
        
        // 繪製等待文字
        drawTextBox(scoreText, width / 2, height / 2, 400, 80);
        
        return; 
    }
    
    // **狀態：顯示成績**
    // 只有在顯示成績時才使用透明背景來製造煙火殘影
    background(0, 0, 0, 25); 

    let percentage = (finalScore / maxScore) * 100;
    let textYOffset = height / 2 - 100; // 調整位置以騰出空間給分數框
    let shapeYOffset = height / 2 + 150;

    // A. 繪製祝賀/提示文字 (第一行文字，居中)
    let mainText = "";
    let mainTextColor = color(0); // 預設黑色

    if (percentage >= 90) {
        mainText = "恭喜！優異成績！";
        mainTextColor = color(0, 200, 50); // 綠色
        
        // 觸發煙火發射 (如果分數夠高)
        if (frameCount % 10 === 0 && random(1) < 0.2) { 
            fireworks.push(new Firework(random(width), height));
        }
        
    } else if (percentage >= 60) {
        mainText = "成績良好，請再接再厲。";
        mainTextColor = color(255, 181, 35); // 黃色
        
    } else {
        mainText = "需要加強努力！";
        mainTextColor = color(200, 0, 0); // 紅色
    }
    
    // 繪製第一行文字的背景框
    drawTextBox(mainText, width / 2, textYOffset, 450, 80);
    
    // 重新繪製第一行文字，使用動態顏色
    textSize(30);
    textAlign(CENTER, CENTER);
    fill(mainTextColor);
    text(mainText, width / 2, textYOffset);

    // **B. 繪製實際分數 (第二行文字，放在中央)**
    let scoreDisplay = `得分: ${finalScore}/${maxScore}`;
    drawTextBox(scoreDisplay, width / 2, height / 2, 300, 80);
    
    // -----------------------------------------------------------------
    // C. 煙火動畫更新與繪製
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();

        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }
    
    // D. 繪製幾何圖形 (與舊版本邏輯相同)
    if (percentage >= 90) {
        fill(0, 200, 50, 150); 
        noStroke();
        circle(width / 2, shapeYOffset, 150);
        
    } else if (percentage >= 60) {
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, shapeYOffset, 150, 150);
    }

    // 判斷是否停止 loop
    if (fireworks.length === 0 && percentage < 90) {
        noLoop(); // 靜態分數顯示完成，停止動畫
    } else if (fireworks.length === 0 && percentage >= 90) {
        // 煙火放完後，停止動畫，保持靜態畫面
        noLoop();
    }
}


// =================================================================
// 接收 postMessage 消息並更新分數
// =================================================================
window.addEventListener('message', function (event) {
    
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // 1. 更新全域變數
        finalScore = data.score;
        maxScore = data.maxScore;
        
        // 2. 關鍵步驟：顯示 p5.js 畫布
        if (scoreCanvas) {
            scoreCanvas.show(); // 讓 Canvas 顯示出來
        }
        
        // 3. 呼叫 p5.js 重新繪製
        if (typeof loop === 'function') {
            loop(); // 強制啟動 loop() 以持續繪製動畫或靜態畫面
        }
    }
}, false);
