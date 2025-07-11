const CONTRACT_ADDRESS = "0xecda4696f2Bf39693B5E59F0d78a8B3975A7B10a";
const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "anonymous": false, "inputs": [
    { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
    { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "playerChoice", "type": "uint8" },
    { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "botChoice", "type": "uint8" }
  ], "name": "Draw", "type": "event" },
  { "anonymous": false, "inputs": [
    { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
    { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "playerChoice", "type": "uint8" },
    { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "botChoice", "type": "uint8" },
    { "indexed": false, "internalType": "string", "name": "result", "type": "string" },
    { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" }
  ], "name": "GameResolved", "type": "event" },
  { "anonymous": false, "inputs": [
    { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "betAmount", "type": "uint256" }
  ], "name": "GameStarted", "type": "event" },
  { "anonymous": false, "inputs": [
    { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
    { "indexed": false, "internalType": "enum RockPaperScissors.Choice", "name": "choice", "type": "uint8" }
  ], "name": "PlayerChose", "type": "event" },
  { "inputs": [ { "internalType": "enum RockPaperScissors.Choice", "name": "_playerChoice", "type": "uint8" } ],
    "name": "makeChoice", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "minBet", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ],
    "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ],
    "name": "playerGames", "outputs": [
      { "internalType": "enum RockPaperScissors.Choice", "name": "playerChoice", "type": "uint8" },
      { "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "internalType": "bool", "name": "inGame", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  { "inputs": [], "name": "startGame", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];


// Global variables for ethers and contract instances
let provider;
let signer;
let contract;
let readOnlyContract; // For view functions before connecting wallet
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
const minBetDisplay = document.getElementById("minBetDisplay");

// Game Choice Mapping
const CHOICES = {
    0: "None",
    1: "Rock",
    2: "Paper",
    3: "Scissors"
};

// Helper function to convert Wei to ZTC
function weiToZTC(wei) {
    if (!wei) return "0";
    return ethers.utils.formatEther(wei);
}

// Function to initialize DApp state and check for MetaMask
async function initDapp() {
    console.log("Initializing DApp...");
    if (typeof window.ethereum !== 'undefined') {
        // Give MetaMask a moment to inject and become ready
        // This is crucial for some mobile browsers
        await new Promise(resolve => setTimeout(resolve, 300)); 
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider); // Initialize read-only contract early

        walletStatus.textContent = "MetaMask Detected";
        connectWalletBtn.style.display = "block";
        console.log("MetaMask detected. Ready to connect.");

        // Try to pre-connect if already authorized
        try {
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                console.log("Accounts already connected:", accounts[0]);
                await connectWallet(accounts[0]); // Connect with the first account
            } else {
                console.log("No accounts pre-connected.");
            }
        } catch (error) {
            console.error("Error checking pre-connected accounts:", error);
        }

        await updateMinBet(); // Display minBet even before wallet is connected
    } else {
        walletStatus.textContent = "MetaMask not detected. Please install MetaMask to play.";
        connectWalletBtn.style.display = "none";
        statusMessage.textContent = "MetaMask is required to play.";
        console.log("MetaMask not detected.");
    }
}

// Function to handle wallet connection logic
async function connectWallet(accountFromPreconnect = null) {
    console.log("Attempting to connect wallet...");
    try {
        let accounts = [];
        if (accountFromPreconnect) {
            accounts = [accountFromPreconnect];
        } else {
            // Request accounts if not already pre-connected
            accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        }
        
        currentAccount = accounts[0];
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        accountAddress.textContent = currentAccount;
        walletStatus.textContent = "Connected";
        connectWalletBtn.textContent = "Wallet Connected";
        connectWalletBtn.disabled = true;

        console.log("Wallet connected successfully. Account:", currentAccount);

        // Setup event listeners after contract is initialized
        setupEventListeners(); 
        console.log("Event listeners setup.");

        await updateBalance();
        await updateMinBet(); // Update just in case
        await checkGameState();
        
        gameControls.style.display = "block";
        statusMessage.textContent = "Wallet connected. Ready to play!";

    } catch (error) {
        console.error("Failed to connect wallet:", error);
        statusMessage.textContent = `Wallet connection failed: ${error.message.split('\n')[0]}`;
        
        // Reset UI on error
        walletStatus.textContent = "Error Connecting";
        accountAddress.textContent = "N/A";
        accountBalance.textContent = "N/A";
        connectWalletBtn.textContent = "Connect Wallet";
        connectWalletBtn.disabled = false;
        gameControls.style.display = "none";
    }
}

// Event listener for the "Connect Wallet" button
connectWalletBtn.addEventListener("click", () => connectWallet());

// --- Update Account Balance ---
async function updateBalance() {
    if (currentAccount && provider) {
        try {
            const balanceWei = await provider.getBalance(currentAccount);
            accountBalance.textContent = `${parseFloat(weiToZTC(balanceWei)).toFixed(4)} ZTC`;
            console.log("Account balance updated.");
        } catch (error) {
            console.error("Error updating balance:", error);
            accountBalance.textContent = "Error";
        }
    }
}

// --- Update Minimum Bet Display ---
async function updateMinBet() {
    if (readOnlyContract) { // Use readOnlyContract for initial display
        try {
            const minBetWei = await readOnlyContract.minBet();
            minBetDisplay.textContent = parseFloat(weiToZTC(minBetWei)).toFixed(0); // Display as integer ZTC
            betAmountInput.min = parseFloat(weiToZTC(minBetWei));
            if (parseFloat(betAmountInput.value) < parseFloat(weiToZTC(minBetWei))) {
                betAmountInput.value = parseFloat(weiToZTC(minBetWei));
            }
            console.log("Minimum bet updated:", parseFloat(weiToZTC(minBetWei)).toFixed(0));
        } catch (error) {
            console.error("Error updating minimum bet:", error);
            minBetDisplay.textContent = "Error";
            betAmountInput.min = 0;
        }
    }
}

// --- Check Current Game State ---
async function checkGameState() {
    if (contract && currentAccount) {
        try {
            const gameState = await contract.playerGames(currentAccount);
            console.log("Game state retrieved:", gameState);
            if (gameState.inGame) {
                statusMessage.textContent = "You are in an active game. Make your choice!";
                startGameBtn.disabled = true;
                betAmountInput.disabled = true;
                makeChoiceHeading.style.display = "block";
                choiceButtons.style.display = "flex"; // Use flex for styling
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
    if (!signer || !contract) {
        alert("Please connect your wallet first.");
        return;
    }

    const betAmount = parseFloat(betAmountInput.value);
    if (isNaN(betAmount) || betAmount < parseFloat(minBetDisplay.textContent)) {
        alert(`Minimum bet is ${minBetDisplay.textContent} ZTC.`);
        return;
    }

    try {
        statusMessage.textContent = "Starting game... Confirm transaction in MetaMask.";
        startGameBtn.disabled = true;

        const tx = await contract.startGame({
            value: ethers.utils.parseEther(betAmount.toString())
        });
        console.log("startGame transaction sent:", tx.hash);
        await tx.wait();
        console.log("startGame transaction confirmed.");

        makeChoiceHeading.style.display = "block";
        choiceButtons.style.display = "flex"; // Use flex for styling
        statusMessage.textContent = "Game started. Choose your move!";

        await updateBalance(); // Update balance after sending ZTC
    } catch (err) {
        console.error("Failed to start game:", err);
        statusMessage.textContent = "Failed to start game: " + err.message.split('\n')[0];
        startGameBtn.disabled = false; // Re-enable button on error
    }
});

// --- Player Choice Logic ---
const makeChoice = async (choiceIndex) => {
    if (!contract || !signer) return;

    try {
        statusMessage.textContent = `Submitting your choice (${CHOICES[choiceIndex]})... Confirm transaction in MetaMask.`;
        // Disable choice buttons during transaction
        rockBtn.disabled = true;
        paperBtn.disabled = true;
        scissorsBtn.disabled = true;

        const tx = await contract.makeChoice(choiceIndex);
        console.log("makeChoice transaction sent:", tx.hash);
        await tx.wait();
        console.log("makeChoice transaction confirmed.");
        statusMessage.textContent = "Choice submitted. Waiting for result...";

    } catch (err) {
        console.error("Error submitting choice:", err);
        statusMessage.textContent = "Error submitting choice: " + err.message.split('\n')[0];
        // Re-enable choice buttons on error
        rockBtn.disabled = false;
        paperBtn.disabled = false;
        scissorsBtn.disabled = false;
    }
};

rockBtn.addEventListener("click", () => makeChoice(1));
paperBtn.addEventListener("click", () => makeChoice(2));
scissorsBtn.addEventListener("click", () => makeChoice(3));


// --- Event Listeners from Smart Contract ---
async function setupEventListeners() {
    // Remove existing listeners to prevent duplicates if called multiple times
    if (contract) { // Check if contract is initialized
        contract.off("GameResolved");
        contract.off("Draw");
    }

    if (readOnlyContract) { // Also remove from readOnlyContract if it was used for listening
        readOnlyContract.off("GameResolved");
        readOnlyContract.off("Draw");
    }

    // Now, set up new listeners on the 'contract' instance (which has a signer)
    if (contract) { 
        console.log("Setting up contract event listeners...");

        contract.on("GameResolved", async (player, playerChoice, botChoice, result, payout) => {
            console.log("GameResolved event received:", { player, playerChoice, botChoice, result, payout });
            if (player.toLowerCase() === currentAccount?.toLowerCase()) { // Use optional chaining for userAddress
                playerChoiceDisplay.textContent = `You chose: ${CHOICES[playerChoice]}`;
                botChoiceDisplay.textContent = `Bot chose: ${CHOICES[botChoice]}`;
                resultDisplay.textContent = `Result: ${result}`;
                resultDisplay.className = ''; // Reset class
                resultDisplay.classList.add(result.toLowerCase()); // Add win/lose/draw class

                playerChoiceDisplay.style.display = "block";
                botChoiceDisplay.style.display = "block";
                resultDisplay.style.display = "block";

                statusMessage.textContent =
                    result === "Win" ? `🎉 You win! Won ${parseFloat(weiToZTC(payout)).toFixed(4)} ZTC.` :
                    result === "Lose" ? `😞 You lose! Lost ${parseFloat(betAmountInput.value).toFixed(4)} ZTC.` :
                    "🤝 It's a draw!";
                
                // If game ended (Win/Lose), enable start game button and bet input
                if (result === "Win" || result === "Lose") {
                    startGameBtn.disabled = false;
                    betAmountInput.disabled = false;
                    choiceButtons.style.display = "none";
                    makeChoiceHeading.style.display = "none";
                }

                // Re-enable choice buttons for next potential move (e.g., after a draw)
                rockBtn.disabled = false;
                paperBtn.disabled = false;
                scissorsBtn.disabled = false;

                await updateBalance(); // Update balance after game
                await checkGameState(); // Check state for re-roll or new game
            }
        });

        contract.on("Draw", async (player, playerChoice, botChoice) => {
            console.log("Draw event received:", { player, playerChoice, botChoice });
            if (player.toLowerCase() === currentAccount?.toLowerCase()) {
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
                startGameBtn.disabled = true; // Keep start game disabled during draw re-roll
                betAmountInput.disabled = true; // Keep bet input disabled during draw re-roll

                await updateBalance();
                await checkGameState();
            }
        });

        // Listen for account changes in MetaMask
        window.ethereum.on('accountsChanged', async (accounts) => {
            console.log("accountsChanged event:", accounts);
            if (accounts.length > 0) {
                await connectWallet(accounts[0]); // Re-connect with the new account
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
                if (contract) {
                   contract.off("GameResolved");
                   contract.off("Draw");
                   console.log("Event listeners removed on disconnect.");
                }
            }
        });

        // Listen for network changes in MetaMask
        window.ethereum.on('chainChanged', (chainId) => {
            console.log("chainChanged event:", chainId);
            // Reload the page if the network changes
            window.location.reload();
        });
    } else {
        console.log("Contract instance not available for setting up listeners. This might be normal if called early.");
    }
}

// Run initDapp when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", initDapp);
