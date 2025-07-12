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

function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");
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
    if (!accounts || !accounts[0]) {
      updateStatus("❌ No account found");
      return;
    }

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
    console.error("Connection Error:", err);
    updateStatus("Connection failed: " + (err.message || ""));
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

  updateStatus("Starting game...");
  try {
    const tx = await contract.startGame({ value: valueToSend });
    await tx.wait();
    updateStatus("🎮 Game started! Choose your move.");
  } catch (err) {
    console.error("StartGame error:", err);
    let msg = "❌ Failed to start game.";
    const reason = (err.reason || err.message || "").toLowerCase();

    if (reason.includes("already in game")) {
      msg = "⏳ You already started a game.\nPlease choose your move.";
    } else if (reason.includes("exceeded daily transaction limit")) {
      msg = "🚫 You’ve played 10 times in the last 24 hours.\nCome back after 03:30 AM (Tehran time)!";
    } else if (reason.includes("insufficient")) {
      msg = "💰 Not enough balance to start the game.";
    } else if (reason.includes("invalid")) {
      msg = "⚠️ Invalid bet or contract condition.";
    }

    typeResult(msg);
    updateStatus("Transaction failed");
  }
}

async function makeChoice(choice) {
  if (!contract || !userAccount) {
    updateStatus("Please connect wallet first");
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

      const resultMsg =
        result === "Win" ? "🎉 You win!" :
        result === "Lose" ? "😢 You lose!" :
        "🤝 It's a draw!";

      const summary = `🧑 You chose ${emojiMap[playerChoice]}\n🤖 Bot chose ${emojiMap[botChoice]}\n🎯 Result: ${resultMsg}`;
      typeResult(summary);
      updateStatus(resultMsg);
    } else {
      typeResult("✅ Transaction confirmed.\nWaiting for bot's move...");
      updateStatus("Awaiting result");
    }

    await showPlayerStats();
  } catch (err) {
    console.error("Choice error:", err);
    let msg = "⚠️ Unexpected error";
    const reason = (err.reason || err.message || "").toLowerCase();

    if (reason.includes("insufficient")) msg = "❌ Wallet balance is insufficient.";
    else if (reason.includes("already")) msg = "⏳ You are already in a game.";
    else if (reason.includes("not started")) msg = "⚠️ Start the game before choosing.";

    typeResult(msg);
    updateStatus(msg);
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
    console.error("Stats error:", err);
    document.getElementById("statsBox").innerText = "📉 Unable to load stats.";
  }
}
