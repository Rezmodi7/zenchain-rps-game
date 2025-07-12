// Contract details
const contractAddress = "0x7Ca41FF431d6422B58Af9d15474484EDB7b50154";
const ABI = [ /* ... your full ABI here as provided ... */ ];

// Global variables
let provider, signer, contract, userAccount;

// DOM load hooks
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

// UI status updater
function updateStatus(text) {
  document.getElementById("status").innerText = `Status: ${text}`;
}

// Connect to MetaMask wallet
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

    await showPlayerStats(); // Show stats on connection
  } catch (err) {
    console.error(err);
    updateStatus("Connection failed");
  }
}

// Disconnect wallet (for future use)
function disconnectWallet() {
  userAccount = null;
  provider = signer = contract = null;
  document.getElementById("walletAddr").innerText = "Wallet: Not connected";
  document.getElementById("connectBtn").innerText = "🔌 Connect Wallet";
  updateStatus("Wallet disconnected");
}

// Start game by submitting bet
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

// Submit player choice and process result
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

    if (event) {
      const { playerChoice, botChoice, result } = event.args;
      const emojis = ["", "🪨", "📄", "✂️"];
      const msg = result === "Win" ? "🎉 You win!"
                 : result === "Lose" ? "😢 You lose!"
                 : "🤝 It's a draw! 🔄";
      updateStatus(`${msg} You: ${emojis[playerChoice]} | Bot: ${emojis[botChoice]}`);
      document.getElementById("resultBox").innerText = `🤖 You chose ${playerChoice}, Bot chose ${botChoice}. Result: ${result}`;
    } else {
      document.getElementById("resultBox").innerText = "✅ Transaction successful, awaiting result...";
    }

    await showPlayerStats(); // Update stats after game
  } catch (err) {
    console.error("❌ Error during play:", err);
    updateStatus("Error: " + (err.reason || err.message).split("\n")[0]);
    document.getElementById("resultBox").innerText = "⚠️ Error occurred during the game.";
  }
}

// Fetch and display player stats
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
    console.error("⚠️ Failed to fetch player stats:", err);
    document.getElementById("statsBox").innerText = "📉 Unable to load stats.";
  }
}
