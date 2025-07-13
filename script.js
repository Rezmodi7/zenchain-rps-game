const contractAddress = "0xE3C87205e8E1F748D08A14F5C662D436505BD3da";
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
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "refund",
				"type": "uint256"
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

async function connectWallet() {
  if (!window.ethereum) {
    alert("🦊 Please install MetaMask");
    updateStatus("MetaMask not found");
    return;
  }

  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, ABI, signer);
    document.getElementById("walletAddr").innerText = `Wallet: ${userAccount}`;
    updateStatus("✅ Wallet connected");
  } catch (err) {
    updateStatus("Connection failed.");
    console.error("Wallet error:", err);
  }
}

async function startGame() {
  if (!contract || !userAccount) {
    updateStatus("Please connect your wallet.");
    return;
  }

  const betRaw = document.getElementById("betInput").value;
  if (!betRaw || isNaN(betRaw)) {
    updateStatus("Enter a valid bet amount.");
    return;
  }

  const bet = parseFloat(betRaw);
  if (bet < 5 || bet > 100) {
    updateStatus("Bet must be between 5 and 100 ZTC.");
    return;
  }

  const valueToSend = ethers.utils.parseUnits(bet.toString(), "ether");

  updateStatus("Starting game...");
  try {
    const tx = await contract.startGame({ value: valueToSend });
    await tx.wait();
    gameStarted = true;
    updateStatus("Game started! Choose your move.");
  } catch (err) {
    gameStarted = false;

    const rawError = (
      err?.reason ||
      err?.message ||
      err?.data?.message ||
      err?.error?.message ||
      ""
    ).toLowerCase();

    console.error("Error details:", rawError);

    let msg = "⛔ Unable to start the game.\n\nPossible reasons:\n- Daily limit reached\n- Insufficient wallet balance\n- Already in a game\n\nPlease check and try again.";

    if (rawError.includes('execution reverted: "daily limit reached"')) {
      msg = "🚫 You've reached the daily limit (10 plays). Try again after 3:30 AM Tehran time.";
    } else if (rawError.includes("execution reverted: bet must be between")) {
      msg = "⚠️ Bet amount must be between 5 and 100 ZTC.";
    } else if (rawError.includes("execution reverted: already in game")) {
      msg = "⏳ You're already in a game. Make your move.";
    } else if (rawError.includes("execution reverted: insufficient balance")) {
      msg = "💰 Wallet balance is insufficient.";
    }

    typeResult(msg);
    updateStatus(msg);
    console.error("StartGame error message:", msg);
  }
				}
