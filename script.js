const CONTRACT_ADDRESS = "0x0cC77c746f3ee03B074Ee836c2cC83DB6204b8eD";

const CONTRACT_ABI = [
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
	}
]

let provider, signer, contract, readOnlyContract;
let currentAccount = null;

// DOM Elements
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

const CHOICES = {
    0: "None",
    1: "Rock",
    2: "Paper",
    3: "Scissors"
};

function weiToZTC(wei) {
    return ethers.utils.formatEther(wei || "0");
}

async function initDapp() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        walletStatus.textContent = "MetaMask Detected";
        connectWalletBtn.style.display = "block";

        try {
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                await connectWallet(accounts[0]);
            }
        } catch (error) {
            console.warn("Pre-connect failed:", error);
        }

        try {
            await updateMinBet();
        } catch (e) {
            console.warn("Failed to load minBet initially:", e);
        }
    } else {
        walletStatus.textContent = "MetaMask not detected";
        statusMessage.textContent = "Install MetaMask to continue.";
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

        gameControls.style.display = "block";
        statusMessage.textContent = "Wallet connected. Ready to play.";

        setupEventListeners();
        await updateBalance();

        try {
            await updateMinBet();
        } catch (err) {
            console.warn("updateMinBet failed:", err);
        }

        try {
            await checkGameState();
        } catch (err) {
            console.warn("checkGameState failed:", err);
        }

    } catch (err) {
        console.error("Connection failed:", err);
        walletStatus.textContent = "Error Connecting";
        statusMessage.textContent = `Wallet connection failed: ${err.message}`;
        connectWalletBtn.textContent = "Connect Wallet";
        connectWalletBtn.disabled = false;
    }
}

connectWalletBtn.addEventListener("click", () => connectWallet());

async function updateBalance() {
    try {
        const balance = await provider.getBalance(currentAccount);
        accountBalance.textContent = `${parseFloat(weiToZTC(balance)).toFixed(4)} ZTC`;
    } catch (err) {
        console.warn("Balance fetch failed:", err);
        accountBalance.textContent = "Error";
    }
}

async function updateMinBet() {
    const minBetWei = await readOnlyContract.minBet();
    const minBet = parseFloat(weiToZTC(minBetWei)).toFixed(0);
    betAmountInput.min = minBet;
    if (parseFloat(betAmountInput.value) < minBet) {
        betAmountInput.value = minBet;
    }
}

async function checkGameState() {
    const game = await contract.playerGames(currentAccount);
    if (game.inGame) {
        statusMessage.textContent = "You're in a game. Make your choice!";
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
}

startGameBtn.addEventListener("click", async () => {
    const bet = parseFloat(betAmountInput.value);
    if (isNaN(bet)) return alert("Enter a valid bet.");

    try {
        statusMessage.textContent = "Starting game...";
        const tx = await contract.startGame({ value: ethers.utils.parseEther(bet.toString()) });
        await tx.wait();
        makeChoiceHeading.style.display = "block";
        choiceButtons.style.display = "flex";
        statusMessage.textContent = "Game started. Choose your move.";
        await updateBalance();
    } catch (err) {
        console.error("Start game failed:", err);
        statusMessage.textContent = "Start game failed.";
    }
});

const makeChoice = async (choice) => {
    try {
        statusMessage.textContent = "Submitting choice...";
        await contract.makeChoice(choice);
    } catch (err) {
        console.warn("Choice failed:", err);
        statusMessage.textContent = "Failed to submit choice.";
    }
};

rockBtn.addEventListener("click", () => makeChoice(1));
paperBtn.addEventListener("click", () => makeChoice(2));
scissorsBtn.addEventListener("click", () => makeChoice(3));

function setupEventListeners() {
    contract.on("GameResolved", async (player, playerChoice, botChoice, result, payout) => {
        if (player.toLowerCase() !== currentAccount.toLowerCase()) return;

        playerChoiceDisplay.textContent = `You: ${CHOICES[playerChoice]}`;
        botChoiceDisplay.textContent = `Bot: ${CHOICES[botChoice]}`;
        resultDisplay.textContent = `Result: ${result}`;

        playerChoiceDisplay.style.display = "block";
        botChoiceDisplay.style.display = "block";
        resultDisplay.style.display = "block";

        await updateBalance();
        await checkGameState();
    });

    window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
            await connectWallet(accounts[0]);
        } else {
            currentAccount = null;
            walletStatus.textContent = "Disconnected";
            connectWalletBtn.textContent = "Connect Wallet";
            connectWalletBtn.disabled = false;
        }
    });

    window.ethereum.on('chainChanged', () => window.location.reload());
}

window.addEventListener("DOMContentLoaded", initDapp);
