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
      { "internalType": "uint8", "name": "_playerChoice", "type": "uint8" }
    ],
    "name": "makeChoice",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fundContract",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minBet",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxBet",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "playerGames",
    "outputs": [
      { "internalType": "enum RockPaperScissors.Choice", "name": "playerChoice", "type": "uint8" },
      { "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "internalType": "bool", "name": "inGame", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "playerStats",
    "outputs": [
      { "internalType": "uint256", "name": "wins", "type": "uint256" },
      { "internalType": "uint256", "name": "losses", "type": "uint256" },
      { "internalType": "uint256", "name": "draws", "type": "uint256" },
      { "internalType": "uint256", "name": "totalGames", "type": "uint256" },
      { "internalType": "uint256", "name": "lastPlayedDay", "type": "uint256" },
      { "internalType": "uint256", "name": "playsToday", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    provider = signer = contract = userAccount = null;
    document.getElementById("walletAddr").innerText = "Wallet: Not connected";
    document.getElementById("connectBtn").innerText = "🔌 Connect Wallet";
    updateStatus("Disconnected");
  } else {
    connectWallet();
  }
}

async function connectWallet() {
  if (!window.ethereum) return alert("🦊 Please install MetaMask!");

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, ABI, signer);

    const balance = await provider.getBalance(userAccount);
    document.getElementById("walletAddr").innerText = `Wallet: ${userAccount}\nBalance: ${ethers.utils.formatEther(balance)} ZTC`;
    document.getElementById("connectBtn").innerText = "🔌 Disconnect";
    updateStatus("✅ Wallet connected");

    await checkGameStatus();
    await showPlayerStats();
  } catch (err) {
    updateStatus("❌ Wallet connection failed");
    console.error(err);
  }
}

async function checkGameStatus() {
  try {
    const info = await contract.playerGames(userAccount);
    gameStarted = info.inGame;
    if (info.inGame) {
      typeResult("⏳ You have an active game.\nChoose Rock ✊, Paper ✋ or Scissors ✌️.");
    }
  } catch (err) {
    console.warn("Status check failed", err);
  }
}

async function startGame() {
  if (!contract || !userAccount) return updateStatus("Connect wallet first");

  await checkGameStatus();
  if (gameStarted) {
    typeResult("⚠️ You are already in a game.\nChoose your move to finish.");
    return;
  }

  const betRaw = document.getElementById("betInput").value;
  if (!betRaw || isNaN(betRaw)) return updateStatus("⚠️ Invalid bet amount");

  const bet = parseFloat(betRaw);
  if (bet < 5 || bet > 100) return updateStatus("⚠️ Bet must be between 5–100 ZTC");

  try {
    const tx = await contract.startGame({ value: ethers.utils.parseEther(bet.toString()) });
    await tx.wait();
    gameStarted = true;
    updateStatus("🎮 Game started");
  } catch (err) {
    gameStarted = false;
    if ((err.reason || "").includes("already")) {
      typeResult("⏳ Already in a game.\nChoose your move.");
    } else {
      typeResult("❌ Could not start game");
    }
  }
}

async function makeChoice(choice) {
  if (!contract || !userAccount) return updateStatus("Connect wallet first");
  if (!gameStarted) return updateStatus("⚠️ Start a game first");

  try {
    const tx = await contract.makeChoice(choice);
    const receipt = await tx.wait();

    const event = receipt.events.find(e => e.event === "GameResolved");
    const emojiMap = { 1: "✊ Rock", 2: "✋ Paper", 3: "✌️ Scissors" };

    if (event && event.args) {
      const { playerChoice, botChoice, result } = event.args;
      const summary = `🧑 You: ${emojiMap[playerChoice]}\n🤖 Bot: ${emojiMap[botChoice]}\n🎯 Result: ${
        result === "Win" ? "🎉 You win!" :
        result === "Lose" ? "😢 You lose!" : "🤝 Draw!"
      }`;
      typeResult(summary);
      updateStatus("✅ Game finished");
    } else {
      updateStatus("🕒 Waiting for result");
    }

    gameStarted = false;
    await showPlayerStats();
  } catch (err) {
    console.error(err);
    typeResult("❌ Choice failed");
  }
}

async function showPlayerStats() {
  try {
    const stats = await contract.playerStats(userAccount);
    document.getElementById("statsBox").innerText = `🏆 Wins: ${stats.wins}\n💔 Losses: ${stats.losses}\n🤝 Draws: ${stats.draws}`;
  } catch {
    document.getElementById("statsBox").innerText = "📉 Stats unavailable";
  }
}
