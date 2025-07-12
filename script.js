const contractAddress = "0x7Ca41FF431d6422B58Af9d15474484EDB7b50154";

const ABI = [
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "playerChoice", "type": "uint8" }
    ],
    "name": "makeChoice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "address", "name": "", "type": "address" } ],
    "name": "playerStats",
    "outputs": [
      { "internalType": "uint256", "name": "wins", "type": "uint256" },
      { "internalType": "uint256", "name": "losses", "type": "uint256" },
      { "internalType": "uint256", "name": "draws", "type": "uint256" },
      { "internalType": "uint256", "name": "totalGames", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint8", "name": "playerChoice", "type": "uint8" },
      { "indexed": false, "internalType": "uint8", "name": "botChoice", "type": "uint8" },
      { "indexed": false, "internalType": "string", "name": "result", "type": "string" }
    ],
    "name": "GameResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "Draw",
    "type": "event"
  }
];

let provider, signer, contract, userAccount;

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectBtn").onclick = connectWallet;
  document.getElementById("startBtn").onclick = startGame;
  document.querySelectorAll(".choice-square").forEach(btn => {
    btn.onclick = () => makeChoice(+btn.dataset.choice);
  });

  document.body.classList.add("dark-theme");
  updateStatus("Ready");
});

// Typing effect for game result
function typeResult(text) {
  const el = document.getElementById("resultBox");
  el.textContent = "";
  let i = 0;
  function type() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      setTimeout(type, 30);
    }
  }
  type();
}

// Theme toggler
function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");
}

// Status updater
function updateStatus(text) {
  document.getElementById("status").innerText = `Status: ${text}`;
}

// Wallet connection
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return;
  }

  try {
    await ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, ABI, signer);

    const balance = await provider.getBalance(userAccount);
    const ztc = ethers.utils.formatEther(balance);

    document.getElementById("walletAddr").innerText = `Wallet: ${userAccount}\nBalance: ${ztc} ZTC`;
    document.getElementById("connectBtn").innerText = "🔌 Connected";
    updateStatus("Wallet connected");

    await showPlayerStats();
  } catch (err) {
    console.error(err);
    updateStatus("Connection failed");
  }
}

// Start game with bet
async function startGame() {
  if (!contract || !userAccount) {
    updateStatus("Please connect wallet first");
    return;
  }

  const bet = +document.getElementById("betInput").value;
  if (bet < 5 || bet > 100) {
    updateStatus("Bet must be between 5 and 100 ZTC");
    return;
  }

  updateStatus("Starting game...");
  try {
    const tx = await contract.startGame({ value: ethers.utils.parseEther(bet.toString()) });
    await tx.wait();
    updateStatus("Game started! Choose your move");
  } catch (err) {
    console.error(err);
    updateStatus("Failed to start game");
  }
}

// Submit choice and handle result
async function makeChoice(choice) {
  if (!contract || !userAccount) {
    updateStatus("Please connect wallet first");
    return;
  }

  updateStatus("Submitting choice...");
  try {
    const tx = await contract.makeChoice(choice);
    const receipt = await tx.wait();

    const event = receipt.events.find(e => e.event === "GameResolved" || e.event === "Draw");
    const choiceMap = { 1: "Rock", 2: "Paper", 3: "Scissors" };

    if (event) {
      const { playerChoice, botChoice, result } = event.args;

      const resultMessage =
        result === "Win" ? "🎉 You win!" :
        result === "Lose" ? "😢 You lose!" :
        "🤝 It's a draw!";

      const summary = `🤖 You chose ${choiceMap[playerChoice]}, Bot chose ${choiceMap[botChoice]}.\nResult: ${resultMessage}`;
      typeResult(summary);
      updateStatus(resultMessage);
    } else {
      typeResult("✅ Transaction successful, awaiting result...");
    }

    await showPlayerStats();
  } catch (err) {
    console.error("Error during play:", err);

    let message = "⚠️ Unknown error occurred";
    const reason = (err.reason || err.message || "").toLowerCase();

    if (reason.includes("insufficient")) message = "❌ Wallet balance is insufficient.";
    else if (reason.includes("already")) message = "⏳ You are already in a game.";
    else if (reason.includes("draw")) message = "🤝 It's a draw!";
    else if (reason.includes("not started")) message = "Please start the game first.";

    typeResult(message);
    updateStatus(message);
  }
}

// Display user stats
async function showPlayerStats() {
  try {
    const stats = await contract.playerStats(userAccount);
    const { wins, losses, draws, totalGames } = stats;

    const statsText = `
🧾 Your Stats:
Wins: ${wins}
Losses: ${losses}
Draws: ${draws}
Total Games: ${totalGames}
    `;
    document.getElementById("statsBox").innerText = statsText;
  } catch (err) {
    console.error("Failed to fetch player stats:", err);
    document.getElementById("statsBox").innerText = "📉 Unable to load stats.";
  }
      }
