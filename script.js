const contractAddress = "0x0cC77c746f3ee03B074Ee836c2cC83DB6204b8eD";

const contractABI = [
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
    "name": "makeChoice", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "startGame", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
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
  }
];

let provider, signer, contract, userAddress;

window.addEventListener("DOMContentLoaded", async () => {
  if (typeof window.ethereum === "undefined") {
    alert("Please install MetaMask to play.");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  // DOM elements
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

  connectWalletBtn.addEventListener("click", async () => {
    try {
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      userAddress = await signer.getAddress();
      contract = new ethers.Contract(contractAddress, contractABI, signer);

      const balance = await provider.getBalance(userAddress);
      accountAddress.textContent = userAddress;
      accountBalance.textContent = `${parseFloat(ethers.utils.formatEther(balance)).toFixed(4)} ZTC`;
      walletStatus.textContent = "Connected";
      gameControls.style.display = "block";
      statusMessage.textContent = "Wallet connected. Ready to play!";
    } catch (err) {
      alert("Connection error: " + err.message);
    }
  });

  startGameBtn.addEventListener("click", async () => {
    const betAmount = parseFloat(betAmountInput.value);
    if (isNaN(betAmount) || betAmount < 5) {
      alert("Minimum bet is 5 ZTC.");
      return;
    }

    try {
      const tx = await contract.startGame({
        value: ethers.utils.parseEther(betAmount.toString())
      });
      await tx.wait();
      makeChoiceHeading.style.display = "block";
      choiceButtons.style.display = "flex";
      statusMessage.textContent = "Game started. Choose your move.";
    } catch (err) {
      alert("Failed to start game: " + err.message);
    }
  });

  const makeChoice = async (choiceIndex) => {
    try {
      const tx = await contract.makeChoice(choiceIndex);
      await tx.wait();
      statusMessage.textContent = "Choice submitted. Waiting for result...";
    } catch (err) {
      statusMessage.textContent = "Choice error: " + err.message;
    }
  };

  rockBtn.addEventListener("click", () => makeChoice(1));
  paperBtn.addEventListener("click", () => makeChoice(2));
  scissorsBtn.addEventListener("click", () => makeChoice(3));

  const readOnlyContract = new ethers.Contract(contractAddress, contractABI, provider);

  readOnlyContract.on("GameResolved", (player, pChoice, bChoice, result) => {
    if (player.toLowerCase() !== userAddress?.toLowerCase()) return;

    const choices = ["None", "Rock", "Paper", "Scissors"];
    playerChoiceDisplay.textContent = `You chose: ${choices[pChoice]}`;
    botChoiceDisplay.textContent = `Bot chose: ${choices[bChoice]}`;
    resultDisplay.textContent = `Result: ${result}`;
    resultDisplay.className = result.toLowerCase();

    playerChoiceDisplay.style.display = "block";
    botChoiceDisplay.style.display = "block";
    resultDisplay.style.display = "block";

    statusMessage.textContent =
      result === "Win" ? "🎉 You win!" :
      result === "Lose" ? "😞 You lose!" :
      "🤝 It's a draw!";
  });

  readOnlyContract.on("Draw", (player) => {
    if (player.toLowerCase() !== userAddress?.toLowerCase()) return;
    statusMessage.textContent = "Draw. Please choose again.";
    choiceButtons.style.display = "flex";
  });
});
