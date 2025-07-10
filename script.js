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
    ],
    "stateMutability": "view",
    "type": "function"
  },
  { "inputs": [], "name": "startGame", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

window.addEventListener("DOMContentLoaded", async () => {
  const provider = window.ethereum
    ? new ethers.providers.Web3Provider(window.ethereum, "any")
    : null;

  if (!provider) {
    alert("MetaMask not detected. Please install it to continue.");
    return;
  }

  let signer, contract, userAddress;

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
      const formattedBalance = ethers.utils.formatEther(balance);

      walletStatus.textContent = "Connected";
      accountAddress.textContent = userAddress;
      accountBalance.textContent = `${parseFloat(formattedBalance).toFixed(4)} ZTC`;

      gameControls.style.display = "block";
      statusMessage.textContent = "Wallet connected. Ready to play!";
    } catch (err) {
      alert("Wallet connection failed: " + err.message);
    }
  });

  startGameBtn.addEventListener("click", async () => {
    if (!signer || !contract) {
      alert("Please connect your wallet first.");
      return;
    }

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
      statusMessage.textContent = "Game started. Choose your move!";
    } catch (err) {
      statusMessage.textContent = "Failed to start game: " + err.message;
    }
  });

  const makeChoice = async (choiceIndex) => {
    if (!contract || !signer) return;

    try {
      const tx = await contract.makeChoice(choiceIndex);
      await tx.wait();
      statusMessage.textContent = "Choice submitted. Waiting for result...";
    } catch (err) {
      statusMessage.textContent = "Error submitting choice: " + err.message;
    }
  };

  rockBtn.addEventListener("click", () => makeChoice(1));
  paperBtn.addEventListener("click", () => makeChoice(2));
  scissorsBtn.addEventListener("click", () => makeChoice(3));

  const readOnlyContract = new ethers.Contract(contractAddress, contractABI, provider);

  readOnlyContract.on("GameResolved", (player, playerChoice, botChoice, result) => {
    if (player.toLowerCase() !== userAddress?.toLowerCase()) return;

    const choices = ["None", "Rock", "Paper", "Scissors"];
    playerChoiceDisplay.textContent = `You chose: ${choices[playerChoice]}`;
    botChoiceDisplay.textContent = `Bot chose: ${choices[botChoice]}`;
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

  readOnlyContract.on("Draw", (player[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/Liqee/Contracts/tree/a3f444af7b9eb7c001dfc3e665a1227f5ee68f94/migrations%2F9_set_distribution_speed_2.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "1")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/paddyc1/coin-flip/tree/c9841c6c8b4e9423140e97ea5170591afa5f26f7/frontend%2FCoinFlip.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "2")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/Geology-Today/geology-today.github.io/tree/fb1066e6b142e503f9477d600fdd4417b24fb3d6/docs%2Fmain.996ad921.chunk.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "3")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/i0709/Dapp-Flip-Coin_Ropsten/tree/335394c1d0c2730791f4dbbd1cf32ff3310db90e/abi.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "4")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/MaccsUniversal/Lucky_Duckys_V2/tree/6c3811be3f98114884ec7b4f5e2c9d31d1c9c142/Web3_Scripts%2FContract_Abi.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "5")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/BitSpades/bitspades.github.io/tree/c0b29943e54402fd327639aaa37d105d3c21e413/js%2Fapp~f71cff67.9e5424b9.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "6")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/CreatifyPlatform/NiFTyHextris/tree/7779dbda6750e0ac9f4645bd223d3ae37f381253/js%2FNiFTyHextris.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "7")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/VanijaDev/playmycrypto/tree/3b8fe74f062ac5dba631f5b367c35d1a8b9b7d03/src%2Fblockchain%2Fcontract%2Fcontract.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "8")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/arun-ajay/casino-blackjack/tree/609610234c79879065195f7f1b868c17e929fc27/FrontEnd%2Fblackjack%2Fsrc%2FAbis%2FcasinoAbi.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "9")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/degentoken/gh-pages/tree/0ff0c517a3d1f903767fa1614e8113e8f9b6c064/static%2Fjs%2Fmain.c6eb8bc6.chunk.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "10")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/best-coder-NA/snowgov/tree/cd22630a425f65fa3872553156c22b0ca56e8adf/js%2Finactive%2Fsiren.8191d6f0fe3237be61ca0edd7a682a98.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "11")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/Wb379512824/Wb379512824.github.io/tree/817920f1cf45207ca387ff149143cf6c65bbd6c3/js%2Fapp.6f3262d7.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "12")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/MatricksDeCoder/stablecoin/tree/dccda3933deed1f1ef29bda8d4b445e7e66346d2/node_modules%2F@chainlink%2Fcontracts%2Ftruffle%2Fv0.6%2FOracle.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "13")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/btcapp/btcapp.github.io/tree/3b838225a9f18d119b4e3fc4eb8a6712a876f636/js%2Fdracula.d2233760b367e82273046f324860fdcc.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "14")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/rocketlemondefi/Kavian-vfat-tools/tree/e87665e51ee0724a87166020be507fd16f90a42d/src%2Fstatic%2Fjs%2Fbsc_goldenbunny.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "15")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/dece-cash/worldshare/tree/ca88efd7d2e33e3f35286dda2d8346539d4bfc41/src%2Fservice%2Fconfig.ts?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "16")
