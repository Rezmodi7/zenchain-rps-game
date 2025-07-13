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
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
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
  }
];

let provider, signer, contract, userAccount;
let gameStarted = false;

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectBtn").onclick = toggleWallet;
  document.getElementById("startBtn").onclick = startGame;
  document.querySelectorAll(".choice-square").forEach(btn => {
    btn.onclick = () => makeChoice(+btn.dataset.choice);
  });

  document.body.classList.add("dark-theme");
  updateStatus("Ready");
});

function updateStatus(text) {
  document.getElementById("status").innerText = `Status: ${text}`;
}

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

function toggleWallet() {
  if (userAccount) {
    provider = null;
    signer = null;
    contract = null;
    userAccount = null;
    document.getElementById("walletAddr").innerText = "Wallet: Not connected";
    document.getElementById("connectBtn").innerText = "🔌 Connect Wallet";
    updateStatus("Disconnected");
  } else {
    connectWallet();
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("🦊 Please install MetaMask to play ZenChain!");
    updateStatus("MetaMask not found");
    return;
  }

  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, ABI, signer);

    const balance = await provider.getBalance(userAccount);
    const ztc = ethers.utils.formatEther(balance);

    document.getElementById("walletAddr").innerText = `Wallet: ${userAccount}\nBalance: ${ztc} ZTC`;
    document.getElementById("connectBtn").innerText = "🔌 Disconnect";
    updateStatus("✅ Wallet connected successfully");

    await showPlayerStats();
  } catch (err) {
    updateStatus("Connection failed");
    console.error("Connection Error:", err);
  }
}

async function startGame() {
  if (!contract || !userAccount) {
    updateStatus("Please connect wallet first");
    return;
  }

  const betRaw = document.getElementById("betInput").value;
  if (!betRaw || isNaN(betRaw)) {
    updateStatus("⚠️ Please enter a valid bet amount.");
    return;
  }

  const bet = parseFloat(betRaw);
  if (bet < 5 || bet > 100) {
    updateStatus("⚠️ Bet must be between 5 and 100 ZTC.");
    return;
  }

  const valueToSend = ethers.utils.parseUnits(bet.toString(), "ether");
  console.log("🔍 Sending Bet:", bet, "ZTC →", valueToSend.toString(), "wei");

  updateStatus("Starting game...");
  try {
    const tx = await contract.startGame({ value: valueToSend });
    await tx.wait();
    gameStarted = true;
    updateStatus("🎮 Game started! Choose your move.");
  } catch (err) {
    gameStarted = false;
    let msg = "❌ Failed to start game.";
    const reason = (err.reason || err.message || "").toLowerCase();

    if (reason.includes("already in game")) {
      msg = "⏳ You already started a game.\nPlease choose your move.";
    } else if (reason.includes("exceeded daily transaction limit")) {
      msg = "🚫 You’ve played 10 times in the last 24 hours.\nCome back later.";
    } else if (reason.includes("insufficient")) {
      msg = "💰 Not enough balance to start the game.";
    }

    typeResult(msg);
    updateStatus("Transaction failed");
    console.error("StartGame error:", err);
  }
}

async function makeChoice(choice) {
  if (!contract || !userAccount) {
    updateStatus("Please connect wallet first");
    return;
  }

  if (!gameStarted) {
    updateStatus("⚠️ You must start the game before choosing.");
    return;
  }

  updateStatus("Submitting choice...");
  try {
    const tx = await contract.makeChoice(choice);
    const receipt = await tx.wait();

    const event = receipt.events.find(e => e.event === "GameResolved");
    const emojiMap = { 1: "✊ Rock", 2: "✋ Paper", 3: "✌️ Scissors" };

    if (event && event.args) {
      const { playerChoice, botChoice, result } = event.args;

      const playerText = emojiMap[playerChoice] || "Unknown";
      const botText = emojiMap[botChoice] || "Unknown";

      const resultMsg =
        result === "Win" ? "🎉 You win!" :
        result === "Lose" ? "😢 You lose!" :
        "🤝 It's a draw!";

      const summary = `🧑 You chose ${playerText}\n🤖 Bot chose ${botText}\n🎯 Result: ${resultMsg}`;
      typeResult(summary);
      updateStatus(resultMsg);
    } else {
      typeResult("✅ Transaction confirmed.\nWaiting for bot's move...");
      updateStatus("Awaiting result");
    }

    await showPlayerStats();
  } catch (err) {
    let msg = "⚠️ Unexpected error";
    const reason = (err.reason || err.message || "").toLowerCase();

    if (reason.includes("insufficient")) msg = "❌ Wallet balance is insufficient.";
    else if (reason.includes("already")) msg = "⏳ You are already in a game.";
    else if (reason.includes("not started")) msg = "⚠️ Start the game before choosing.";

    typeResult(msg);
    updateStatus(msg);
    console.error("Choice error:", err);
  }
}

async function showPlayerStats() {
  try {
    const stats = await contract.playerStats(userAccount);
    const { wins, losses, draws } = stats;

    const statsText = `
🏆 Wins: ${wins}
💔 Losses: ${losses}
🤝 Draws: ${draws}
    `;
    document.getElementById("statsBox").innerText = statsText;
  } catch (err) {
    document.getElementById("statsBox").innerText = "📉 Unable to load stats.";
    console.error("Stats error:", err);
  }
}
