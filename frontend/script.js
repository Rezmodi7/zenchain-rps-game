// --- Contract Address and ABI ---
// This is your deployed contract address on ZenChain Testnet.
const CONTRACT_ADDRESS = "0xecda4696f2Bf39693B5E59F0d78a8B3975A7B10a";

// This is the full ABI (Application Binary Interface) of your RockPaperScissors contract.
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
const paperBtn = document = document.getElementById("paperBtn");
const scissorsBtn = document.getElementById("scissorsBtn");
const statusMessage = document.getElementById("statusMessage");
const playerChoiceDisplay = document.getElementById("playerChoiceDisplay");
const botChoiceDisplay = document.getElementById("botChoiceDisplay");
const resultDisplay = document.getElementById("resultDisplay");
const minBetDisplay = document.getElementById("minBetDisplay");

// --- Game Choice Mapping (for display) ---
// Maps the Choice enum values (0-3) to human-readable strings
const CHOICES = {
    0: "None",
    1: "Rock",
    2: "Paper",
    3: "Scissors"
};

// --- Helper function to convert Wei to ZTC ---
function weiToZTC(wei) {
    // ethers.utils.formatEther converts Wei (10^18) to standard units
    return ethers.utils.formatEther(wei); 
}

// --- Initialize DApp ---
async function initDapp() {
    // Check if MetaMask (window.ethereum) is available
    if (typeof window.ethereum !== 'undefined') {
        // Create an Ethers.js Web3Provider using MetaMask's provider
        provider = new ethers.providers.Web3Provider(window.ethereum);
        walletStatus.textContent = "MetaMask Detected";
        connectWalletBtn.style.display = "block"; // Show connect button
    } else {
        walletStatus.textContent = "MetaMask not detected. Please install MetaMask to play.";
        connectWalletBtn.style.display = "none";
        statusMessage.textContent = "MetaMask is required to play.";
    }
}

// --- Connect Wallet Button Event Listener ---
connectWalletBtn.addEventListener("click", async () => {
    try {
        // Request accounts from MetaMask
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        currentAccount = accounts[0]; // Set the first connected account
        
        // Get a signer for sending transactions
        signer = provider.getSigner();
        // Create a contract instance with the signer to interact with the contract
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        accountAddress.textContent = currentAccount;
        walletStatus.textContent = "Connected";
        connectWalletBtn.textContent = "Wallet Connected";
        connectWalletBtn.disabled = true; // Disable button after connecting

        // Update UI with account balance, min bet, and game state
        await updateBalance();
        await updateMinBet();
        await checkGameState();

        gameControls.style.display = "block"; // Show game controls
    } catch (error) {
        console.error("Failed to connect wallet:", error);
        statusMessage.textContent = `Failed to connect wallet: ${error.message.split('\n')[0]}`;
    }
});

// --- Update Account Balance ---
async function updateBalance() {
    if (currentAccount && provider) {
        const balanceWei = await provider.getBalance(currentAccount); // Get balance in Wei
        accountBalance.textContent = weiToZTC(balanceWei); // Display balance in ZTC
    }
}

// --- Update Minimum Bet Display ---
async function updateMinBet() {
    if (contract) {
        const minBetWei = await contract.minBet(); // Get minBet from contract in Wei
        minBetDisplay.textContent = weiToZTC(minBetWei); // Display minBet in ZTC
        betAmountInput.min = weiToZTC(minBetWei); // Set min value for input field
        betAmountInput.value = weiToZTC(minBetWei); // Set default value
    }
}

// --- Check Current Game State (if player is in a game, especially after a draw) ---
async function checkGameState() {
    if (contract && currentAccount) {
        // Retrieve player's game state from the smart contract
        const gameState = await contract.playerGames(currentAccount);
        if (gameState.inGame) {
            statusMessage.textContent = "You are in an active game. Make your choice!";
            startGameBtn.disabled = true;
            betAmountInput.disabled = true;
            makeChoiceHeading.style.display = "block";
            choiceButtons.style.display = "block";
            playerChoiceDisplay.style.display = "none";
            botChoiceDisplay.style.display = "none";
            resultDisplay.style.display = "none";
        } else {
            statusMessage.textContent = "Ready to start a new game.";
            startGameBtn.disabled = false;
            betAmountInput.disabled = false;
            makeChoiceHeading.style.display = "none";
            choiceButtons.style.display = "none";
            playerChoiceDisplay.style.display = "none";
            botChoiceDisplay.style.display = "none";
            resultDisplay.style.display = "none";
        }
    }
}

// --- Start Game Button Event Listener ---
startGameBtn.addEventListener("click", async () => {
    if (!contract || !currentAccount) {
        statusMessage.textContent = "Please connect your wallet first.";
        return;
    }

    const betAmountZTC = parseFloat(betAmountInput.value);
    if (isNaN(betAmountZTC) || betAmountZTC <= 0) {
        statusMessage.textContent = "Please enter a valid bet amount.";
        return;
    }

    // Convert ZTC amount to Wei for the transaction
    const betAmountWei = ethers.utils.parseEther(betAmountZTC.toString()); 

    try {
        statusMessage.textContent = "Starting game... Confirm transaction in MetaMask.";
        startGameBtn.disabled = true; // Disable button to prevent double click

        // Call the startGame function on the contract, sending ZTC with it
        const tx = await contract.startGame({ value: betAmountWei });
        await tx.wait(); // Wait for the transaction to be mined

        statusMessage.textContent = "Game started! Now make your choice.";
        startGameBtn.disabled = true;
        betAmountInput.disabled = true;
        makeChoiceHeading.style.display = "block";
        choiceButtons.style.display = "block";
        playerChoiceDisplay.style.display = "none";
        botChoiceDisplay.style.display = "none";
        resultDisplay.style.display = "none";

        await updateBalance(); // Update balance after sending ZTC
    } catch (error) {
        console.error("Error starting game:", error);
        statusMessage.textContent = `Error: ${error.message.split('\n')[0]}`;
        startGameBtn.disabled = false; // Re-enable button on error
    }
});

// --- Choice Buttons Event Listeners ---
rockBtn.addEventListener("click", () => makePlayerChoice(1)); // 1 for Rock
paperBtn.addEventListener("click", () => makePlayerChoice(2)); // 2 for Paper
scissorsBtn.addEventListener("click", () => makePlayerChoice(3)); // 3 for Scissors

async function makePlayerChoice(choice) {
    if (!contract || !currentAccount) {
        statusMessage.textContent = "Wallet not connected or game not started.";
        return;
    }

    try {
        statusMessage.textContent = `Making your choice (${CHOICES[choice]})... Confirm transaction in MetaMask.`;
        // Disable choice buttons during transaction to prevent multiple clicks
        rockBtn.disabled = true;
        paperBtn.disabled = true;
        scissorsBtn.disabled = true;

        // Call the makeChoice function on the contract
        const tx = await contract.makeChoice(choice);
        await tx.wait(); // Wait for the transaction to be mined

        statusMessage.textContent = "Choice made! Waiting for result...";
        // Result will be displayed by the event listener below
    } catch (error) {
        console.error("Error making choice:", error);
        statusMessage.textContent = `Error: ${error.message.split('\n')[0]}`;
        // Re-enable choice buttons on error
        rockBtn.disabled = false;
        paperBtn.disabled = false;
        scissorsBtn.disabled = false;
    }
}

// --- Listen to Contract Events for Game Resolution ---
// This sets up listeners to react to events emitted by your smart contract
async function setupEventListeners() {
    if (contract) {
        // Event listener for when a game is resolved (Win/Lose/Draw)
        contract.on("GameResolved", async (player, playerChoice, botChoice, result, payout) => {
            // Only update if the event is for the current connected player
            if (player.toLowerCase() === currentAccount.toLowerCase()) {
                playerChoiceDisplay.textContent = `You chose: ${CHOICES[playerChoice]}`;
                botChoiceDisplay.textContent = `Bot chose: ${CHOICES[botChoice]}`;
                resultDisplay.textContent = `Result: ${result}!`;

                // Set CSS class for styling the result (e.g., green for win, red for lose)
                resultDisplay.className = ''; // Reset classes
                if (result === "Win") {
                    resultDisplay.classList.add('win');
                } else if (result === "Lose") {
                    resultDisplay.classList.add('lose');
                } else if (result === "Draw") { // Although 'Draw' has its own event, this handles it too.
                    resultDisplay.classList.add('draw');
                }

                playerChoiceDisplay.style.display = "block";
                botChoiceDisplay.style.display = "block";
                resultDisplay.style.display = "block";

                // If game ended (Win/Lose), re-enable start game button
                if (result === "Win" || result === "Lose") {
                    statusMessage.textContent = `Game Over. ${result}! You ${result === "Win" ? "won " + weiToZTC(payout) + " ZTC" : "lost"}. Start a new game?`;
                    startGameBtn.disabled = false;
                    betAmountInput.disabled = false;
                    choiceButtons.style.display = "none"; // Hide choice buttons
                    makeChoiceHeading.style.display = "none";
                }

                // Always re-enable choice buttons after resolution
                rockBtn.disabled = false;
                paperBtn.disabled = false;
                scissorsBtn.disabled = false;
                await updateBalance(); // Update balance after game
                await checkGameState(); // Re-check game state, especially for draws
            }
        });

        // Specific event listener for when a game results in a Draw (for re-roll scenario)
        contract.on("Draw", async (player, playerChoice, botChoice) => {
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
                // Re-enable choice buttons immediately for a re-roll
                rockBtn.disabled = false;
                paperBtn.disabled = false;
                scissorsBtn.disabled = false;
                startGameBtn.disabled = true; // Keep start game disabled during draw re-roll
                betAmountInput.disabled = true; // Keep bet input disabled during draw re-roll
                
                await updateBalance(); // Update balance (though it shouldn't change on draw)
                await checkGameState(); // Re-check game state
            }
        });

        // Listen for account changes in MetaMask (user changes account)
        window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length > 0) {
                currentAccount = accounts[0];
                accountAddress.textContent = currentAccount;
                await updateBalance();
                await checkGameState(); // Check game state for the new account
            } else {
                // Wallet disconnected
                currentAccount = null;
                accountAddress.textContent = "N/A";
                accountBalance.textContent = "N/A";
                walletStatus.textContent = "Disconnected";
                connectWalletBtn.textContent = "Connect Wallet";
                connectWalletBtn.disabled = false;
                gameControls.style.display = "none";
                statusMessage.textContent = "Connect wallet to start.";
                // Remove listeners to prevent errors when no account is connected
                contract.off("GameResolved");
                contract.off("Draw");
            }
        });

        // Listen for network changes in MetaMask (user changes network)
        window.ethereum.on('chainChanged', (chainId) => {
            // Reload the page or reinitialize if the network changes
            // Simple reload is sufficient for this app
            window.location.reload();
        });
    }
}

// Call initDapp when the page loads
window.addEventListener('load', initDapp);
// Setup event listeners after initial Dapp setup
window.addEventListener('load', setupEventListeners);