// Global variables
let revolvers = {};
let activeRevolverId = null;
let revolverCounter = 0;

// Sound elements
const gunshotSound = document.getElementById("gunshotSound");
const emptyClickSound = document.getElementById("emptyClickSound");
const spinSound = document.getElementById("spinSound");
const clickSound = document.getElementById("clickSound");
const chimeSound = document.getElementById("chimeSound");

let isFlipping = false;
let shuffleInterval;

function randomCard() {
    if (isFlipping) return;
    isFlipping = true;

    const card = document.getElementById("card");
    const characters = ["A", "K", "Q"];

    card.classList.add("flipping");
    clickSound.play();

    shuffleInterval = setInterval(() => {
        card.textContent = characters[Math.floor(Math.random() * characters.length)];
    }, 100);

    setTimeout(() => {
        clearInterval(shuffleInterval);

        const finalChar = characters[Math.floor(Math.random() * characters.length)];
        card.textContent = finalChar;
        card.classList.remove("flipping");
        card.classList.add("selected");

        chimeSound.play();
        speakText(finalChar === "A" ? "Ace" : finalChar === "K" ? "King" : "Queen");

        setTimeout(() => {
            card.classList.remove("selected");
            isFlipping = false;
        }, 2000);
    }, 2000);
}

function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.5;
    window.speechSynthesis.speak(utterance);
}
function showBloodEffect() {
    const damageOverlay = document.getElementById('damageOverlay');
    const bloodContainer = document.getElementById('blood-splatter-container');

    // Show blood splatter with fade-in
    bloodContainer.style.opacity = '1';

    // Show damage flash
    damageOverlay.style.display = 'block';
    damageOverlay.classList.add('flash');

    // Hide after 3 seconds (fade stays for 2s)
    setTimeout(() => {
        bloodContainer.style.opacity = '0';
        damageOverlay.style.display = 'none';
    }, 3000); // matches the fade duration
}
// Revolver class
class Revolver {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.totalChambers = 6;
        this.shotsTaken = 0;
        this.isGameOver = false;
        this.bulletPosition = Math.floor(Math.random() * this.totalChambers);
    }

    updateCylinder() {
        const gameArea = document.getElementById(`gameArea-${this.id}`);
        if (!gameArea) return;

        for (let i = 0; i < this.totalChambers; i++) {
            const chamber = gameArea.querySelector(`#chamber${i}-${this.id}`);
            if (chamber) {
                chamber.classList.remove("shot", "fired");
                if (i < this.shotsTaken) {
                    chamber.classList.add("shot");

                    // Mark the last fired chamber in red if game over
                    if (i === this.shotsTaken - 1 && this.isGameOver) {
                        chamber.classList.add("fired");
                    }
                }
            }
        }

    const remainingShots = this.totalChambers - this.shotsTaken;
    const shotCountElement = gameArea.querySelector(`#shotCount-${this.id}`);
    if (shotCountElement) {
        shotCountElement.textContent = "🎯 " + remainingShots + "/" + this.totalChambers;
    }

    const deathChance = remainingShots > 0 ? (100 / remainingShots).toFixed(2) : 100;
    const deathChanceElement = gameArea.querySelector(`#deathChance-${this.id}`);
    if (deathChanceElement) {
        deathChanceElement.textContent = "💀 " + deathChance + "%";
    }

    
}
    resetGame() {
        this.shotsTaken = 0;
        this.isGameOver = false;
        this.bulletPosition = Math.floor(Math.random() * this.totalChambers);
        this.updateCylinder();

        const gameArea = document.getElementById(`gameArea-${this.id}`);
        const triggerBtn = gameArea.querySelector(`#pullTriggerBtn-${this.id}`);
        if (triggerBtn) {
            triggerBtn.querySelector("span").textContent = "FIRE";
        }
        const tab = document.getElementById(`tab-${this.id}`);
        if (tab) tab.classList.remove("dead");
    }

    increaseShots() {
        if (this.shotsTaken < 5 && !this.isGameOver) {
            this.shotsTaken++;
            this.updateCylinder();
        }
    }

    decreaseShots() {
        if (this.shotsTaken > 0 && !this.isGameOver) {
            this.shotsTaken--;
            this.updateCylinder();
        }
    }

    randomDeathCheck() {
        return this.shotsTaken === this.bulletPosition;
    }

pullTrigger() {
    if (this.isGameOver) {
        this.resetGame();
        return;
    }

    const gameArea = document.getElementById(`gameArea-${this.id}`);
    const cylinder = gameArea.querySelector(`#cylinder-${this.id}`);
    const triggerBtn = gameArea.querySelector(`#pullTriggerBtn-${this.id}`);

    spinSound.play();
    cylinder.classList.add("spin");
    triggerBtn.disabled = true;

    setTimeout(() => {
        cylinder.classList.remove("spin");

        const remainingChambers = this.totalChambers - this.shotsTaken;
        const bulletInChamber = Math.floor(Math.random() * remainingChambers) === 0;

        this.shotsTaken++;

        if (bulletInChamber) {
            gunshotSound.play();
            showBloodEffect();
            this.isGameOver = true;
            const tab = document.getElementById(`tab-${this.id}`);
            if (tab) tab.classList.add("dead");
            triggerBtn.querySelector("span").textContent = "RESET";

        } else {
            emptyClickSound.play();
        }

        this.updateCylinder();
        triggerBtn.disabled = false;
    }, 3000);
}
}

// Function to add a new revolver
function addRevolver() {
    const nameInput = document.getElementById("revolverNameInput");
    const name = nameInput.value.trim();

    if (!name) {
        alert("Please enter a revolver name");
        return;
    }

    if (Object.values(revolvers).some(revolver => revolver.name === name)) {
        alert("A revolver with this name already exists");
        return;
    }

    revolverCounter++;
    const id = `revolver-${revolverCounter}`;

    revolvers[id] = new Revolver(id, name);
    createRevolverTab(id, name);
    createGameArea(id, name);
    nameInput.value = "";
    switchToRevolver(id);
}

function createRevolverTab(id, name) {
    const tabsContainer = document.getElementById("revolverTabs");

    const tab = document.createElement("div");
    tab.className = "revolver-tab";
    tab.id = `tab-${id}`;
    tab.innerHTML = `
        <span>${name}</span>
        <button class="remove-tab" onclick="removeRevolver('${id}')" title="Remove revolver">×</button>
    `;

    tab.addEventListener("click", (e) => {
        if (!e.target.classList.contains("remove-tab")) {
            switchToRevolver(id);
        }
    });

    tabsContainer.appendChild(tab);
}

function createGameArea(id, name) {
    const gameContainer = document.getElementById("gameContainer");

    const gameArea = document.createElement("div");
    gameArea.className = "game-area";
    gameArea.id = `gameArea-${id}`;
    gameArea.style.display = "none";

    gameArea.innerHTML = `
        <h1 class="current-revolver-name">${name}</h1>

        <div class="shot-info">
            <div class="shot-count">
                <span id="shotCount-${id}">6/6</span>
            </div>
            <div class="death-chance">
                <span id="deathChance-${id}">16.67%</span>
            </div>
        </div>

        <div class="cylinder-container">
            <div class="cylinder" id="cylinder-${id}">
                ${Array.from({ length: 6 }, (_, i) => `
                    <div class="chamber" id="chamber${i}-${id}"></div>
                `).join('')}
                <div class="outer-ring"></div>

                <div class="revolver-slot slot-one"></div>
                <div class="revolver-slot slot-two"></div>
                <div class="revolver-slot slot-three"></div>
                <div class="revolver-slot slot-four"></div>
                <div class="revolver-slot slot-five"></div>
                <div class="revolver-slot slot-six"></div>
            </div>
        </div>

        <div class="shots-count">
            <a onclick="revolvers['${id}'].decreaseShots()">-</a>
            <a onclick="revolvers['${id}'].increaseShots()">+</a>
        </div>

        <button onclick="revolvers['${id}'].pullTrigger()" id="pullTriggerBtn-${id}">
            <span>FIRE</span>
        </button>
        <div class="divider"></div>
        
    `;

    gameContainer.appendChild(gameArea);
}

function switchToRevolver(id) {
    document.querySelectorAll(".game-area").forEach(area => {
        area.style.display = "none";
    });

    document.querySelectorAll(".revolver-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    const gameArea = document.getElementById(`gameArea-${id}`);
    if (gameArea) {
        gameArea.style.display = "block";
    }

    const tab = document.getElementById(`tab-${id}`);
    if (tab) {
        tab.classList.add("active");
    }

    activeRevolverId = id;

    if (revolvers[id]) {
        revolvers[id].updateCylinder();
    }
}

function removeRevolver(id) {
    if (Object.keys(revolvers).length <= 1) {
        alert("You must have at least one revolver");
        return;
    }

    delete revolvers[id];

    const tab = document.getElementById(`tab-${id}`);
    if (tab) tab.remove();

    const gameArea = document.getElementById(`gameArea-${id}`);
    if (gameArea) gameArea.remove();

    if (activeRevolverId === id) {
        const remainingIds = Object.keys(revolvers);
        if (remainingIds.length > 0) {
            switchToRevolver(remainingIds[0]);
        }
    }
}

document.getElementById("revolverNameInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        addRevolver();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("revolverNameInput").value = "SWAE";
    addRevolver();
});