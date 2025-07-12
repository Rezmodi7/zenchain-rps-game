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

window.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const startBtn = document.getElementById("startBtn");
  const choices = document.querySelectorAll(".choice-btn");

  connectBtn.onclick = connectWallet;
  startBtn.onclick = startGame;
  choices.forEach(btn => {
    btn.onclick = () => makeChoice(+btn.dataset.choice);
  });

  updateStatus("Ready");
});

function updateStatus(text) {
  document.getElementById("status").innerText = `Status: ${text}`;
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, ABI, signer);
    document.getElementById("walletAddr").innerText = `Wallet: ${userAccount}`;
    document.getElementById("connectBtn").innerText = "🔌 Connected";
    updateStatus("Wallet connected");
  } catch (err) {
    console.error(err);
    updateStatus("Connection failed");
  }
}

function disconnectWallet() {
  userAccount = null;
  provider = signer = contract = null;
  document.getElementById("walletAddr").innerText = "Wallet: Not connected";
  document.getElementById("connectBtn").innerText = "🔌 Connect Wallet";
  updateStatus("Wallet disconnected");
}

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

async function makeChoice(choice) {
  if (!contract || !userAccount) {
    updateStatus("Please connect wallet first");
    return;
  }

  updateStatus("Submitting choice...");
  try {
    const tx = await contract.makeChoice(choice);
    const receipt = await tx.wait();

    const ev = receipt.events.find(e => e.event === "GameResolved");
    if (ev) {
      const [, playerChoice, botChoice, result] = ev.args;
      const emojis = ["", "🪨", "📄", "✂️"];
      const msg = result === "Win" ? "🎉 You win!"
                 : result === "Lose" ? "😢 You lose!"
                 : "🤝 It's a draw! 🔄";
      updateStatus(`${msg} You: ${emojis[playerChoice]} | Bot: ${emojis[botChoice]}`);
    }
  } catch (err) {
    console.error(err);
    updateStatus("Error: " + (err.reason || err.message).split("\n")[0]);
  }
}
