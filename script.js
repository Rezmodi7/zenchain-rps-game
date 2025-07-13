const contractAddress = "0x7Ca41FF431d6422B58Af9d15474484EDB7b50154";

const ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum RockPaperScissors.Choice",
				"name": "playerChoice",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "enum RockPaperScissors.Choice",
				"name": "botChoice",
				"type": "uint8"
			}
		],
		"name": "Draw",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum RockPaperScissors.Choice",
				"name": "playerChoice",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "enum RockPaperScissors.Choice",
				"name": "botChoice",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "result",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "payout",
				"type": "uint256"
			}
		],
		"name": "GameResolved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			}
		],
		"name": "GameStarted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum RockPaperScissors.Choice",
				"name": "choice",
				"type": "uint8"
			}
		],
		"name": "PlayerChose",
		"type": "event"
	},
	{
		"stateMutability": "payable",
		"type": "fallback"
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
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "enum RockPaperScissors.Choice",
				"name": "_playerChoice",
				"type": "uint8"
			}
		],
		"name": "makeChoice",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "maxBet",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "minBet",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "playerGames",
		"outputs": [
			{
				"internalType": "enum RockPaperScissors.Choice",
				"name": "playerChoice",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "inGame",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "playerStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "wins",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "losses",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "draws",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalGames",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lastPlayedDay",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "playsToday",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "startGame",
		"outputs": [],
		"stateMutability": "payable",
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
		"stateMutability": "payable",
		"type": "receive"
	}
]

let provider, signer, contract, userAccount;
let gameStarted = false;

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectBtn").onclick = toggleWallet;
  document.getElementById("startBtn").onclick = startGame;
  document.querySelectorAll(".choice-square").forEach(btn => {
    btn.onclick = () => makeChoice(+btn.dataset.choice);
  });
  document.querySelector("button[onclick='toggleTheme()']").onclick = toggleTheme;

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
      setTimeout(type, 20);
    }
  }
  type();
}

function toggleTheme() {
  const body = document.body;
  if (body.classList.contains("dark-theme")) {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
  } else {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
  }
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
    updateStatus("Connection failed: " + (err.message || ""));
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
      msg = "⏳ You're already in a game. Please choose your move.";
      gameStarted = true; // در این حالت کاربر هنوز انتخاب نکرده
    } else if (reason.includes("exceeded daily")) {
      msg = "🚫 You’ve reached the daily play limit.\nTry again later.";
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
    updateStatus("⚠️ Start a game first before choosing.");
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

    // ✅ Reset game flag after move
    gameStarted = false;
  } catch (err) {
    let msg = "⚠️ Unexpected error";
    const reason = (err.reason || err.message || "").toLowerCase();

    if (reason.includes("not started")) msg = "⚠️ You need to start a game first.";
    else if (reason.includes("already")) msg = "⏳ You're already in a game.";
    else if (reason.includes("insufficient")) msg = "❌ Insufficient funds.";
    else if (reason.includes("revert")) msg = "❌ Reverted by smart contract.";

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
