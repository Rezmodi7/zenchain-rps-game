// --- Contract Address and ABI ---
const CONTRACT_ADDRESS = "0xecda4696f2Bf39693B5E59F0d78a8B3975A7B10a";

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
		"inputs": [
			{
				"internalType": "enum RockPaperScissors.Choice",
				"name": "_playerChoice",
				"type": "uint8"
			}
		],
		"name": "makeChoice",
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
	}
];

// --- Web3 Providers and Signers ---
let provider;
let signer;
let contract;
let currentAccount = null;

// --- DOM Elements ---
const walletStatus = document.getElementById("walletStatus");
const accountAddress = document.getElementById("accountAddress");
const accountBalance = document.getElementById("accountBalance");
const connectWalletBtn = document.getElementById("connectWalletBtn");
const gameControls = document.getElementById("gameControls");
const betAmountInput = document.getElementById("betAmount");
const startGameBtn = document.getElementById("startGameBtn");
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

// --- Game Choice Mapping (for display) ---
const CHOICES = {
    0: "None",
    1: "Rock",
    2: "Paper",
    3: "Scissors"
};

// --- Helper function to convert Wei to ZTC ---
function weiToZTC(wei) {
    return ethers.utils.formatEther(wei); 
}

// --- Initialize DApp ---
// Uses a slightly delayed check to ensure window.ethereum is fully loaded/injected
async function initDapp() {
    console.log("initDapp called."); 
    if (typeof window.ethereum !== 'undefined') {
        // Wait a short moment to ensure MetaMask is fully injected and ready
        // This can sometimes solve issues in specific mobile browsers
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 500ms

        provider = new ethers.providers.Web3Provider(window.ethereum);
        walletStatus.textContent = "MetaMask Detected";
        connectWalletBtn.style.display = "block"; 
        console.log("MetaMask detected and provider initialized."); 
    } else {
        walletStatus.textContent = "MetaMask not detected. Please install MetaMask to play.";
        connectWalletBtn.style.display = "none";
        statusMessage.textContent = "MetaMask is required to play.";
        console.log("MetaMask not detected."); 
    }
}

// --- Connect Wallet Button Event Listener ---
connectWalletBtn.addEventListener("click", async () => {
    console.log("Connect Wallet button clicked."); 
    try {
        // Request accounts from MetaMask
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        currentAccount = accounts[0]; 
        console.log("Account connected:", currentAccount); 

        // Important: Re-initialize provider and signer if they somehow become stale
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        console.log("Contract instance re-created/verified."); 

        accountAddress.textContent = currentAccount;
        walletStatus.textContent = "Connected";
        connectWalletBtn.textContent = "Wallet Connected";
        connectWalletBtn.disabled = true; 
        
        console.log("UI updated for connection status."); 

        // Now that contract is initialized, set up event listeners
        await setupEventListeners(); 
        console.log("Event listeners setup triggered.");

        await updateBalance();
        console.log("Balance updated."); 
        await updateMinBet();
        console.log("Min bet updated."); 
        await checkGameState();
        console.log("Game state checked."); 

        gameControls.style.display = "block"; 
        console.log("Game controls displayed."); 

    } catch (error) {
        console.error("Failed to connect wallet:", error); 
        statusMessage.textContent = `Failed to connect wallet: ${error.message.split('\n')[0]}`;
        // Re-enable connect button on error to allow retry
        connectWalletBtn.textContent = "Connect Wallet";
        connectWalletBtn.disabled = false;
        walletStatus.textContent = "Error Connecting";
        accountAddress.textContent = "N/A";
        accountBalance.textContent = "N/A";
        gameControls.style.display = "none";
    }
});

// --- Update Account Balance ---
async function updateBalance() {
    console.log("updateBalance called for account:", currentAccount); 
    if (currentAccount && provider) {
        try {
            const balanceWei = await provider.getBalance(currentAccount); 
            accountBalance.textContent = weiToZTC(balanceWei); 
            console.log("Account balance updated successfully."); 
        } catch (error) {
            console.error("Error updating balance:", error); 
            accountBalance.textContent = "Error";
        }
    }
}

// --- Update Minimum Bet Display ---
async function updateMinBet() {
    console.log("updateMinBet called."); 
    if (contract) {
        try {
            const minBetWei = await contract.minBet(); 
            minBetDisplay.textContent = weiToZTC(minBetWei); 
            betAmountInput.min = weiToZTC(minBetWei); 
            betAmountInput.value = weiToZTC(minBetWei); 
            console.log("Min bet updated successfully:", weiToZTC(minBetWei)); 
        } catch (error) {
            console.error("Error updating minBet:", error); 
            minBetDisplay.textContent = "Error";
            betAmountInput.min = 0; 
        }
    }
}

// --- Check Current Game State ---
async function checkGameState() {
    console.log("checkGameState called for account:", currentAccount); 
    if (contract && currentAccount) {
        try {
            const gameState = await contract.playerGames(currentAccount);
            console.log("Game state retrieved:", gameState); 
            if (gameState.inGame) {
                statusMessage.textContent = "You are in an active game. Make your choice!";
                startGameBtn.disabled = true;
                betAmountInput.disabled = true;
                makeChoiceHeading.style.display = "block";
                choiceButtons.style.display = "block";
                playerChoiceDisplay.style.display = "none";
                botChoiceDisplay.style.display = "none";
                resultDisplay.style.display = "none";
                console.log("Player is in active game."); 
            } else {
                statusMessage.textContent = "Ready to start a new game.";
                startGameBtn.disabled = false;
                betAmountInput.disabled = false;
                makeChoiceHeading.style.display = "none";
                choiceButtons.style.display = "none";
                playerChoiceDisplay.style.display = "none";
                botChoiceDisplay.style.display = "none";
                resultDisplay.style.display = "none";
                console.log("Player not in active game."); 
            }
        } catch (error) {
            console.error("Error checking game state:", error); 
            statusMessage.textContent = `Error checking game state: ${error.message.split('\n')[0]}`;
        }
    }
}

// --- Start Game Button Event Listener ---
startGameBtn.addEventListener("click", async () => {
    console.log("Start Game button clicked."); 
    if (!contract || !currentAccount) {
        statusMessage.textContent = "Please connect your wallet first.";
        return;
    }

    const betAmountZTC = parseFloat(betAmountInput.value);
    if (isNaN(betAmountZTC) || betAmountZTC <= 0) {
        statusMessage.textContent = "Please enter a valid bet amount.";
        return;
    }

    const betAmountWei = ethers.utils.parseEther(betAmountZTC.toString()); 

    try {
        statusMessage.textContent = "Starting game... Confirm transaction in MetaMask.";
        startGameBtn.disabled = true; 

        const tx = await contract.startGame({ value: betAmountWei });
        console.log("startGame transaction sent:", tx.hash); 
        await tx.wait(); 
        console.log("startGame transaction confirmed."); 

        statusMessage.textContent = "Game started! Now make your choice.";
        startGameBtn.disabled = true;
        betAmountInput.disabled = true;
        makeChoiceHeading.style.display = "block";
        choiceButtons.style.display = "block";
        playerChoiceDisplay.style.display = "none";
        botChoiceDisplay.style.display = "none";
        resultDisplay.style.display = "none";

        await updateBalance(); 
    } catch (error) {
        console.error("Error starting game:", error); 
        statusMessage.textContent = `Error: ${error.message.split('\n')[0]}`;
        startGameBtn.disabled = false; 
    }
});

// --- Choice Buttons Event Listeners ---
rockBtn.addEventListener("click", () => makePlayerChoice(1)); 
paperBtn.addEventListener("click", () => makePlayerChoice(2)); 
scissorsBtn.addEventListener("click", () => makePlayerChoice(3)); 

async function makePlayerChoice(choice) {
    console.log("makePlayerChoice called with choice:", CHOICES[choice]); 
    if (!contract || !currentAccount) {
        statusMessage.textContent = "Wallet not connected or game not started.";
        return;
    }

    try {
        statusMessage.textContent = `Making your choice (${CHOICES[choice]})... Confirm transaction in MetaMask.`;
        rockBtn.disabled = true;
        paperBtn.disabled = true;
        scissorsBtn.disabled = true;

        const tx = await contract.makeChoice(choice);
        console.log("makeChoice transaction sent:", tx.hash); 
        await tx.wait(); 
        console.log("makeChoice transaction confirmed."); 

        statusMessage.textContent = "Choice made! Waiting for result...";
    } catch (error) {
        console.error("Error making choice:", error); 
        statusMessage.textContent = `Error: ${error.message.split('\n')[0]}`;
        rockBtn.disabled = false;
        paperBtn.disabled = false;
        scissorsBtn.disabled = false;
    }
}

// --- Listen to Contract Events for Game Resolution ---
// This sets up listeners to react to events emitted by your smart contract
async function setupEventListeners() {
    // Remove existing listeners to prevent duplicates if called multiple times
    if (contract) {
        contract.off("GameResolved");
        contract.off("Draw");
    }
    
    // Make sure contract object is available before setting up listeners
    if (contract) { 
        console.log("Setting up contract event listeners."); 

        contract.on("GameResolved", async (player, playerChoice, botChoice, result, payout) => {
            console.log("GameResolved event received:", {player, playerChoice, botChoice, result, payout}); 
            if (player.toLowerCase() === currentAccount.toLowerCase()) {
                playerChoiceDisplay.textContent = `You chose: ${CHOICES[playerChoice]}`;
                botChoiceDisplay.textContent = `Bot chose: ${CHOICES[botChoice]}`;
                resultDisplay.textContent = `Result: ${result}!`;

                resultDisplay.className = ''; 
                if (result === "Win") {
                    resultDisplay.classList.add('win');
                } else if (result === "Lose") {
                    resultDisplay.classList.add('lose');
                } else if (result === "Draw") { 
                    resultDisplay.classList.add('draw');
                }

                playerChoiceDisplay.style.display = "block";
                botChoiceDisplay.style.display = "block";
                resultDisplay.style.display = "block";

                if (result === "Win" || result === "Lose") {
                    statusMessage.textContent = `Game Over. ${result}! You ${result === "Win" ? "won " + weiToZTC(payout) + " ZTC" : "lost"}. Start a new game?`;
                    startGameBtn.disabled = false;
                    betAmountInput.disabled = false;
                    choiceButtons.style.display = "none"; 
                    makeChoiceHeading.style.display = "none";
                }

                rockBtn.disabled = false;
                paperBtn.disabled = false;
                scissorsBtn.disabled = false;
                await updateBalance(); 
                await checkGameState(); 
            }
        });

        contract.on("Draw", async (player, playerChoice, botChoice) => {
            console.log("Draw event received:", {player, playerChoice, botChoice}); 
            if (player.toLowerCase() === currentAccount.toLowerCase()) {
                playerChoiceDisplay.textContent = `You chose: ${CHOICES[playerChoice]}`;
                botChoiceDisplay.textContent = `Bot chose: ${CHOICES[botChoice]}`;
                resultDisplay.textContent = `Result: It's a DRAW! Play again!`;
                resultDisplay.className = '';
                resultDisplay.classList.add('draw');

                playerChoiceDisplay.style.display = "block";
                botChoiceDisplay.style.display = "block";
                resultDisplay.style.display = "block";

                statusMessage.textContent = "It's a draw! Make your choice again for another round (no extra bet).";
                rockBtn.disabled = false;
                paperBtn.disabled = false;
                scissorsBtn.disabled = false;
                startGameBtn.disabled = true; 
                betAmountInput.disabled = true; 
                
                await updateBalance(); 
                await checkGameState(); 
            }
        });

        // Listen for account changes in MetaMask (user changes account)
        window.ethereum.on('accountsChanged', async (accounts) => {
            console.log("accountsChanged event:", accounts); 
            if (accounts.length > 0) {
                currentAccount = accounts[0];
                accountAddress.textContent = currentAccount;
                await updateBalance();
                await checkGameState(); 
            } else {
                currentAccount = null;
                accountAddress.textContent = "N/A";
                accountBalance.textContent = "N/A";
                walletStatus.textContent = "Disconnected";
                connectWalletBtn.textContent = "Connect Wallet";
                connectWalletBtn.disabled = false;
                gameControls.style.display = "none";
                statusMessage.textContent = "Connect wallet to start.";
                // Important: remove listeners when disconnected to prevent errors
                if (contract) { // Check if contract exists before trying to offload listeners
                   contract.off("GameResolved");
                   contract.off("Draw");
                   console.log("Event listeners removed on disconnect."); 
                }
            }
        });

        // Listen for network changes in MetaMask (user changes network)
        window.ethereum.on('chainChanged', (chainId) => {
            console.log("chainChanged event:", chainId); 
            window.location.reload();
        });
    } else {
        console.log("Contract object not available yet. Event listeners will be set up after successful connection."); 
    }
}

// Call initDapp when the page loads
window.addEventListener('load', initDapp);
// Event listeners will be primarily setup when `connectWalletBtn` is successfully clicked
// and `contract` object is properly initialized.
