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
    document.getElementById("connectBtn").innerText = "🔌 Disconnect";
    updateStatus("Wallet connected");

    await showPlayerStats();
  } catch (err) {
    console.error(err);
    updateStatus("Connection failed");
  }
}

async function startGame() {
  if (!contract || !userAccount) {
    updateStatus("Please connect wallet first");
    return;
  }

  const betRaw = document.getElementById("betInput").value.trim();
  const bet = Number(betRaw);
  console.log("Bet amount entered:", bet);

  if (!bet || isNaN(bet) || bet < 5 || bet > 100) {
    updateStatus("Invalid bet amount. Must be between 5 and 100 ZTC.");
    return;
  }

  updateStatus("Starting game...");
  try {
    const tx = await contract.startGame({ value: ethers.utils.parseEther(bet.toString()) });
    await tx.wait();
    updateStatus("Game started! Choose your move");
  } catch (err) {
    console.error("StartGame Error:", err);
    typeResult("❌ Failed to start game. Check bet amount, wallet balance, or contract connection.");
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

    if (event && event.args && event.args.playerChoice && event.args.botChoice) {
      const { playerChoice, botChoice, result } = event.args;

      const resultMsg =
        result === "Win" ? "🎉 You win!" :
        result === "Lose" ? "😢 You lose!" :
        "🤝 It's a draw!";

      const summary = `🤖 You chose ${emojiMap[playerChoice]}\n🕹 Bot chose ${emojiMap[botChoice]}\n🎯 Result: ${resultMsg}`;
      typeResult(summary);
      updateStatus(resultMsg);
    } else {
      typeResult("✅ Transaction confirmed.\nWaiting for bot's move to be revealed...");
      updateStatus("Awaiting result");
    }

    await showPlayerStats();
  } catch (err) {
    console.error("Error:", err);
    let msg = "⚠️ Unexpected error";
    const reason = (err.reason || err.message || "").toLowerCase();

    if (reason.includes("insufficient")) msg = "❌ Wallet balance is insufficient.";
    else if (reason.includes("already")) msg = "⏳ You are already in a game.";
    else if (reason.includes("not started")) msg = "Start the game before choosing.";

    typeResult(msg);
    updateStatus(msg);
  }
}

async function showPlayerStats() {
  try {
    const stats = await contract.playerStats(userAccount);
    const { wins, losses, draws } = stats;

    const statsText = `
🧾 Your Stats:
Wins: ${wins}
Losses: ${losses}
Draws: ${draws}
    `;
    document.getElementById("statsBox").innerText = statsText;
  } catch (err) {
    console.error("Stats error:", err);
    document.getElementById("statsBox").innerText = "📉 Unable to load stats.";
  }
}
