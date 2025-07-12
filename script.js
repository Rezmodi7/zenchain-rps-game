const CONTRACT_ADDRESS = "0x3A059C4A7e0FD7700cDC3Ce2fD779F5d344880Ce";

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
		"inputs": [],
		"name": "fundContract",
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
		"stateMutability": "payable",
		"type": "fallback"
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
	}
]


let provider, signer, contract, readOnlyContract;
let currentAccount = null;

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
    if (!wei) return "0";
    return ethers.utils.formatEther(wei);
}

async function initDapp() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        walletStatus.textContent = "MetaMask Detected";
        connectWalletBtn.style.display = "block";

        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
            await connectWallet(accounts[0]);
        }
    } else {
        walletStatus.textContent = "MetaMask not detected.";
        connectWalletBtn.style.display = "none";
        statusMessage.textContent = "MetaMask is required.";
    }
}

async function connectWallet(accountFromPreconnect = null) {
    try {
        let accounts = [];
        if (accountFromPreconnect) {
            accounts = [accountFromPreconnect];
        } else {
            accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        }

        currentAccount = accounts[0];
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        walletStatus.textContent = "Connected";
        connectWalletBtn.textContent = "Wallet Connected";
        connectWalletBtn.disabled = true;
        accountAddress.textContent = currentAccount;

        gameControls.style.display = "block";
        await updateBalance();
        await checkGameState();

        setupEventListeners();
    } catch (err) {
        walletStatus.textContent = "Error Connecting";
        statusMessage.textContent = `Error: ${err.message.split('\n')[0]}`;
    }
}

connectWalletBtn.addEventListener("click", () => connectWallet());

async function updateBalance() {
    if (currentAccount && provider) {
        const balanceWei = await provider.getBalance(currentAccount);
        accountBalance.textContent = `${parseFloat(weiToZTC(balanceWei)).toFixed(4)} ZTC`;
    }
}

async function checkGameState() {
    const game = await contract.playerGames(currentAccount);
    if (game.inGame) {
        statusMessage.textContent = "You're in an active game.";
        makeChoiceHeading.style.display = "block";
        choiceButtons.style.display = "flex";
        startGameBtn.disabled = true;
        betAmountInput.disabled = true;
    } else {
        statusMessage.textContent = "Start a new game.";
        makeChoiceHeading.style.display = "none";
        choiceButtons.style.display = "none";
        startGameBtn.disabled = false;
        betAmountInput.disabled = false;
    }
}

startGameBtn.addEventListener("click", async () => {
    const amount = parseFloat(betAmountInput.value);
    if (isNaN(amount) || amount < 5 || amount > 100) {
        alert("Bet must be between 5 and 100 ZTC.");
        return;
    }

    statusMessage.textContent = "Starting game... Confirm in wallet.";
    const tx = await contract.startGame({ value: ethers.utils.parseEther(amount.toString()) });
    await tx.wait();

    await updateBalance();
    await checkGameState();
});

const makeChoice = async (index) => {
    const tx = await contract.makeChoice(index);
    await tx.wait();
    statusMessage.textContent = "Waiting for result...";
};

rockBtn.addEventListener("click", () => makeChoice(1));
paperBtn.addEventListener("click", () => makeChoice(2));
scissorsBtn.addEventListener("click", () => makeChoice(3));

function setupEventListeners() {
    contract.on("GameResolved", async (player, playerChoice, botChoice, result, payout) => {
        if (player.toLowerCase() === currentAccount.toLowerCase()) {
            playerChoiceDisplay.textContent = `You chose: ${CHOICES[playerChoice]}`;
            botChoiceDisplay.textContent = `Bot chose: ${CHOICES[botChoice]}`;
            resultDisplay.textContent = `Result: ${result}`;

            playerChoiceDisplay.style.display = "block";
            botChoiceDisplay.style.display = "block";
            resultDisplay.style.display = "block";

            statusMessage.textContent = result === "Win" ? `🎉 You won ${weiToZTC(payout)} ZTC!`
                : result === "Lose" ? `😞 You lost.` : `🤝 It's a draw!`;

            makeChoiceHeading.style.display = "none";
            choiceButtons.style.display = "none";
            startGameBtn.disabled = false;
            betAmountInput.disabled = false;

            await updateBalance();
            await checkGameState();
        }
    });

    contract.on("Draw", async (player, playerChoice, botChoice) => {
        if (player.toLowerCase() === currentAccount.toLowerCase()) {
            playerChoiceDisplay.textContent = `You chose: ${CHOICES[playerChoice]}`;
            botChoiceDisplay.textContent = `Bot chose: ${CHOICES[botChoice]}`;
            resultDisplay.textContent = "Result: It's a draw.";

            playerChoiceDisplay.style.display = "block";
            botChoiceDisplay.style.display = "block";
            resultDisplay.style.display = "block";

            makeChoiceHeading.style.display = "block";
            choiceButtons.style.display = "flex";
        }
    });

    window.ethereum.on("accountsChanged", () => window.location.reload());
    window.ethereum.on("chainChanged", () => window.location.reload());
}

window.addEventListener("DOMContentLoaded", initDapp);
