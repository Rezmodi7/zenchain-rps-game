const contractAddress = "0xecda4696f2Bf39693B5E59F0d78a8B3975A7B10a";
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
    ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "startGame", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

const provider = new ethers.providers.Web3Provider(window.ethereum, {
  name: "ZenChain Testnet",
  chainId: 8408
});

let signer, contract, userAddress = "";

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

connectWalletBtn.onclick = async () => {
  if (!window.ethereum) return alert("MetaMask not detected");
  await window.ethereum.request({ method: "eth_requestAccounts" });

  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  const balance = await provider.getBalance(userAddress);
  const formatted = ethers.utils.formatEther(balance);

  contract = new ethers.Contract(contractAddress, contractABI, signer);

  walletStatus.textContent = "Connected";
  accountAddress.textContent = userAddress;
  accountBalance.textContent = `${parseFloat(formatted).toFixed(4)} ZTC`;
  gameControls.style.display = "block";
  statusMessage.textContent = "Wallet connected. Ready to start!";
};

startGameBtn.onclick = async () => {
  if (!contract || !signer) return alert("Wallet not connected.");
  const betAmount = parseFloat(betAmountInput.value);
  if (isNaN(betAmount) || betAmount < 5) return alert("Minimum bet is 5 ZTC.");

  try {
    const tx = await contract.startGame({ value: ethers.utils.parseEther(betAmount.toString()) });
    await tx.wait();
    makeChoiceHeading.style.display = "block";
    choiceButtons.style.display = "block";
    statusMessage.textContent = "Game started. Make your move!";
  } catch (err) {
    statusMessage.textContent = `Transaction failed: ${err.message}`;
  }
};

const makeChoice = async (index) => {
  if (!contract) return;
  try {
    const tx = await contract.makeChoice(index); // 1=Rock, 2=Paper, 3=Scissors
    await tx.wait();
    statusMessage.textContent = "Choice submitted. Awaiting result...";
  } catch (err) {
    statusMessage.textContent = `Error submitting choice: ${err.message}`;
  }
};

rockBtn.onclick = () => makeChoice(1);
paperBtn.onclick = () => makeChoice(2);
scissorsBtn.onclick = () => makeChoice(3);

window.addEventListener("load", () => {
  if (!contract) return;

  contract.on("GameResolved", (player, playerChoice, botChoice, result, payout) => {
    if (player.toLowerCase() !== userAddress.toLowerCase()) return;
    const choices = ["None", "Rock", "Paper", "Scissors"];
    playerChoiceDisplay.style.display = "block";
    botChoiceDisplay.style.display = "block";
    resultDisplay.style.display = "block";
    playerChoiceDisplay.textContent = `You chose: ${choices[playerChoice]}`;
    botChoiceDisplay.textContent = `Bot chose: ${choices[botChoice]}`;
    resultDisplay.textContent = `Result: ${result}`;
    resultDisplay.className = result.toLowerCase();
    statusMessage.textContent = result === "Win" ? "🎉 You win!" :
      result === "Lose" ? "😞 You lose!" : "🤝 It's a draw!";
  });

  contract.on("Draw", (player, playerChoice, botChoice) => {
    if (player.toLowerCase() !== userAddress.toLowerCase()) return;
    statusMessage.textContent = "It's a draw. Please choose again.";
    choiceButtons.style.display = "block";
    makeChoiceHeading.style.display = "block";
  });
});
