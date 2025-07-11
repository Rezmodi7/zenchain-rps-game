const CONTRACT_ADDRESS = "0x0cC77c746f3ee03B074Ee836c2cC83DB6204b8eD";

const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "playerChoice", "type": "uint8" },
      { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "botChoice", "type": "uint8" }
    ],
    "name": "Draw",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "playerChoice", "type": "uint8" },
      { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "botChoice", "type": "uint8" },
      { "indexed": false, "internalType": "string", "name": "result", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" }
    ],
    "name": "GameResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "betAmount", "type": "uint256" }
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "enum RockPaperScissors.Choice", "name": "_playerChoice", "type": "uint8" }
    ],
    "name": "makeChoice",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "choice", "type": "uint8" }
    ],
    "name": "PlayerChose",
    "type": "event"
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
    "inputs": [],
    "name": "minBet",
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
  }
];

let provider, signer, contract, readOnlyContract, currentAccount = null;

const walletStatus = document.getElementById("walletStatus");
const accountAddress = document.getElementById("accountAddress");
const accountBalance = document.getElementById("accountBalance");
const connectWalletBtn = document.getElementById("connectWalletBtn");
const startGameBtn = document.getElementById("startGameBtn");
const betAmountInput = document.getElementById("betAmount");
const gameControls = document.getElementById("gameControls");
const makeChoiceHeading = document.getElementById("makeChoiceHeading");
const choiceButtons = document.getElementById("choiceButtons");
const rockBtn = document.getElementById("rockBtn");
const paperBtn = document.getElementById("paperBtn");
const scissorsBtn = document.getElementById("scissorsBtn");
const statusMessage = document.getElementById("statusMessage");
const playerChoiceDisplay = document.getElementById("playerChoiceDisplay");
const botChoiceDisplay = document.getElementById("botChoiceDisplay");
const resultDisplay = document.getElementById("resultDisplay");
const minBetDisplay = document.getElementById("minBetDisplay");

const CHOICES = { 0: "None", 1: "Rock", 2: "Paper", 3: "Scissors" };

function weiToZTC(wei) {
  return ethers.utils.formatEther(wei);
}

async function initDapp() {
  if (typeof window.ethereum !== 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 300));
    provider = new ethers.providers.Web3Provider(window.ethereum);
    readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    walletStatus.textContent = "MetaMask Detected";
    connectWalletBtn.style.display = "block";

    try {
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        await connectWallet(accounts[0]);
      }
    } catch (e) { console.error(e); }

    await updateMinBet();
  } else {
    walletStatus.textContent = "MetaMask not detected.";
    statusMessage.textContent = "Install MetaMask to play.";
  }
}

async function connectWallet(accountFromPreconnect = null) {
  try {
    let accounts = accountFromPreconnect ? [accountFromPreconnect] : await window.ethereum.request({ method: "eth_requestAccounts" });
    currentAccount = accounts[0];
    signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    accountAddress.textContent = currentAccount;
    walletStatus.textContent = "Connected";
    connectWalletBtn.textContent = "Wallet Connected";
    connectWalletBtn.disabled = true;

    setupEventListeners();

    await updateBalance();
    await updateMinBet();
    await checkGameState();
    gameControls.style.display = "block";
    statusMessage.textContent = "Wallet connected.";

  } catch (err) {
    walletStatus.textContent = "Error Connecting";
    accountAddress.textContent = "N/A";
    accountBalance.textContent = "N/A";
    connectWalletBtn.textContent = "Connect Wallet";
    connectWalletBtn.disabled = false;
    gameControls.style.display = "none";
    statusMessage.textContent = "Error: " + err.message.split('\n')[0];
  }
}

connectWalletBtn.addEventListener("click", () => connectWallet());

async function updateBalance() {
  try {
    const balanceWei = await provider.getBalance(currentAccount);
    accountBalance.textContent = `${parseFloat(weiToZTC(balanceWei)).toFixed(4)} ZTC`;
  } catch {
    accountBalance.textContent = "Error";
  }
}

async function updateMinBet() {
  try {
    const minBetWei = await readOnlyContract.minBet();
    minBetDisplay.textContent = parseFloat(weiToZTC(minBetWei)).toFixed(0);
    betAmountInput.min = parseFloat(weiToZTC(minBetWei));
  } catch {
    minBetDisplay.textContent = "Error";
  }
}

async function checkGameState() {
  try {
    const state = await contract.playerGames(currentAccount);
    if (state.inGame) {
      statusMessage.textContent = "Choose your move!";
      startGameBtn.disabled = true;
      betAmountInput.disabled = true;
      makeChoiceHeading.style.display = "block";
      choiceButtons.style.display = "flex";
    } else {
      statusMessage.textContent = "Ready to start a new game.";
      startGameBtn.disabled = false;
      betAmountInput.disabled = false;
      makeChoiceHeading.style.display = "none";
      choiceButtons.style.display = "none";
    }
  } catch (e) {
    statusMessage.textContent = "Error: " + e.message.split('\n')[0];
  }
}

startGameBtn.addEventListener("click", async () => {
  const bet = parseFloat(betAmountInput.value);
  if (isNaN(bet) || bet < parseFloat(minBetDisplay.textContent)) {
    alert(`Minimum bet is ${minBetDisplay.textContent}`);
    return;
  }

  try {
    statusMessage.textContent = "Confirm transaction...";
    const tx = await contract.startGame({ value: ethers.utils.parseEther(bet.toString()) });
    await tx.wait();
    makeChoiceHeading.style.display = "block";
    choiceButtons.style.display = "flex";
    statusMessage.textContent = "Game started!";
    await updateBalance();
  } catch (e) {
    statusMessage.textContent = "Error: " + e.message.split('\n')[0];
  }
});

const makeChoice = async (choiceIndex) => {
  try {
    statusMessage.textContent = `Confirm ${CHOICES[choiceIndex]}...`;
    rockBtn.disabled = true;
    paperBtn.disabled = true;
    scissorsBtn.disabled = true;
    const tx = await contract.makeChoice(choiceIndex);
    await tx.wait();
    statusMessage.textContent = "Waiting for result...";
  } catch (e) {
    statusMessage.textContent = "Error: " + e.message.split('\n')[0];
    rockBtn.disabled = false;
    paperBtn.disabled = false;
    scissorsBtn.disabled = false;
  }
};

rockBtn.addEventListener("click", () => makeChoice(1));
paperBtn.addEventListener("click", () => makeChoice(2));
scissorsBtn.addEventListener("click", () => makeChoice(3));

async function setupEventListeners() {
  if (contract) {
    contract.on("GameResolved", async (player, playerChoice, botChoice, result, payout) => {
      if (player.toLowerCase() !== currentAccount.toLowerCase()) return;

      playerChoiceDisplay.textContent = `You chose: ${CHOICES[playerChoice]}`;
      botChoiceDisplay.textContent = `Bot chose: ${CHOICES[botChoice]}`;
      resultDisplay.textContent = `Result: ${result}`;
      resultDisplay.className = result.toLowerCase();

      playerChoiceDisplay.style.display = "block";
      botChoiceDisplay.style.display = "block";
      resultDisplay.style.display = "block";

      if (result === "Win") {
        statusMessage.textContent = `🎉 You win ${parseFloat(weiToZTC(payout)).toFixed(4)} ZTC!`;
      } else if (result === "Lose") {
        statusMessage.textContent = `😞 You lost ${parseFloat(betAmountInput.value)} ZTC.`;
      } else {
        statusMessage.textContent = "🤝 It's a draw!";
      }

      rockBtn.disabled = false;
      paperBtn.disabled = false;
      scissorsBtn.disabled = false;
      await updateBalance();
      await checkGameState();
    });

    contract.on("Draw", async (player, playerChoice, botChoice) => {
      if (player.toLowerCase() !== currentAccount.toLowerCase()) return;

      playerChoiceDisplay.textContent = `You chose: ${CHOICES[playerChoice]}`;
      botChoiceDisplay.textContent = `Bot chose: ${CHOICES[botChoice]}`;
      resultDisplay.textContent = "Result: It's a DRAW!";
      resultDisplay.className = "draw";

      playerChoiceDisplay.style.display = "block";
      botChoiceDisplay.style.display = "block";
      resultDisplay.style.display = "block";

      statusMessage.textContent = "Draw! Play again.";
      rockBtn.disabled = false;
      paperBtn.disabled = false;
      scissorsBtn.disabled = false;
      await updateBalance();
      await checkGameState();
    });
  }
}

window.addEventListener("DOMContentLoaded", initDapp);
