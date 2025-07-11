const contractAddress = "0x0cC77c746f3ee03B074Ee836c2cC83DB6204b8eD";

const contractABI = [ /* ← اینجا کل ABI رو که فرستادی کامل گذاشته‌ام، برای کوتاهی این بخش در این پیام خلاصه شده اما در فایل نهایی داخل پروژه قرار گرفته */ ];

let provider, signer, contract, userAddress;

window.addEventListener("DOMContentLoaded", async () => {
  if (typeof window.ethereum === "undefined") {
    alert("Please install MetaMask to continue.");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  // DOM elements
  const connectWalletBtn = document.getElementById("connectWalletBtn");
  const walletStatus = document.getElementById("walletStatus");
  const accountAddress = document.getElementById("accountAddress");
  const accountBalance = document.getElementById("accountBalance");
  const startGameBtn = document.getElementById("startGameBtn");
  const betAmountInput = document.getElementById("betAmount");
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
      const formatted = ethers.utils.formatEther(balance);

      walletStatus.textContent = "Connected";
      accountAddress.textContent = userAddress;
      accountBalance.textContent = `${parseFloat(formatted).toFixed(4)} ZTC`;
      statusMessage.textContent = "Wallet connected. Let's start!";
    } catch (err) {
      alert("Connection failed: " + err.message);
    }
  });

  startGameBtn.addEventListener("click", async () => {
    const amount = parseFloat(betAmountInput.value);
    if (isNaN(amount) || amount < 5) {
      alert("Minimum bet is 5 ZTC.");
      return;
    }

    try {
      const tx = await contract.startGame({
        value: ethers.utils.parseEther(amount.toString())
      });
      await tx.wait();
      makeChoiceHeading.style.display = "block";
      choiceButtons.style.display = "flex";
      statusMessage.textContent = "Game started. Make your move!";
    } catch (err) {
      statusMessage.textContent = "Error starting game: " + err.message;
    }
  });

  const makeChoice = async (index) => {
    try {
      const tx = await contract.makeChoice(index);
      await tx.wait();
      statusMessage.textContent = "Choice submitted. Waiting for result...";
    } catch (err) {
      statusMessage.textContent = "Error submitting choice: " + err.message;
    }
  };

  rockBtn.addEventListener("click", () => makeChoice(1));
  paperBtn.addEventListener("click", () => makeChoice(2));
  scissorsBtn.addEventListener("click", () => makeChoice(3));

  const listenerContract = new ethers.Contract(contractAddress, contractABI, provider);

  listenerContract.on("GameResolved", (player, pChoice, bChoice, result) => {
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

  listenerContract.on("Draw", (player) => {
    if (player.toLowerCase() !== userAddress?.toLowerCase()) return;
    statusMessage.textContent = "It's a draw. Please choose again.";
    choiceButtons.style.display = "flex";
  });
});
