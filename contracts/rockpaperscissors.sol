// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; // Specifies the Solidity compiler version

contract RockPaperScissors {
    // Enum to represent the player's and bot's choices
    enum Choice { None, Rock, Paper, Scissors }

    // Struct to store the state of an active game for each player
    struct GameState {
        Choice playerChoice; // The choice made by the the player
        uint256 betAmount;   // The amount of ZTC bet by the player
        bool inGame;         // True if the player is in an active game (including after a draw)
    }

    // A mapping to link each player's address to their current game state
    mapping(address => GameState) public playerGames;

    // Minimum allowed bet amount, set to 5 ZTC (using 18 decimals for ZTC)
    // 10**18 is used to represent 1 ZTC in Wei (smallest unit of ZTC)
    uint256 public minBet = 5 * 10**18; // 5 ZTC

    // Events to notify the frontend about game progress and results
    event GameStarted(address indexed player, uint256 betAmount);
    event PlayerChose(address indexed player, Choice choice);
    event GameResolved(address indexed player, Choice playerChoice, Choice botChoice, string result, uint256 payout);
    event Draw(address indexed player, Choice playerChoice, Choice botChoice);

    // Modifier to ensure the caller is currently in an active game
    modifier onlyInGame() {
        require(playerGames[msg.sender].inGame == true, "You are not in an active game.");
        _;
    }

    // Modifier to ensure the caller is NOT currently in an active game
    modifier onlyNotInGame() {
        require(playerGames[msg.sender].inGame == false, "You are already in an active game. Please resolve or exit.");
        _;
    }

    // Owner of the contract, for administrative functions like withdrawing lost funds
    address public owner;

    // Constructor: Runs only once when the contract is deployed
    constructor() {
        owner = msg.sender; // The deployer becomes the owner
    }

    // Function to start a new game
    // Players send ZTC directly with this transaction (msg.value)
    function startGame() public payable onlyNotInGame {
        require(msg.value >= minBet, "Bet amount must be at least minBet.");

        playerGames[msg.sender].playerChoice = Choice.None; // Reset choice for new game
        playerGames[msg.sender].betAmount = msg.value;     // Store the actual amount bet
        playerGames[msg.sender].inGame = true;              // Mark player as in an active game

        emit GameStarted(msg.sender, msg.value);
    }

    // Function for the player to make their choice (Rock, Paper, or Scissors)
    function makeChoice(Choice _playerChoice) public onlyInGame {
        require(_playerChoice != Choice.None, "Invalid choice. Please choose Rock, Paper, or Scissors.");
        require(playerGames[msg.sender].playerChoice == Choice.None, "You have already made a choice for this round. Waiting for resolution or a new choice after draw.");

        // Ensure no additional ZTC is sent if it's a re-roll after a draw
        require(msg.value == 0, "No additional funds needed for re-roll after draw.");

        playerGames[msg.sender].playerChoice = _playerChoice;

        emit PlayerChose(msg.sender, _playerChoice);

        // Immediately resolve the game after the player makes a choice
        _resolveGame(msg.sender);
    }

    // Internal function to determine the bot's choice and resolve the game
    // This function uses a pseudo-random method suitable for testnets.
    // WARNING: This method is NOT cryptographically secure for mainnet applications.
    // Attackers (e.g., miners/validators) could potentially manipulate block properties
    // to influence the outcome.
    function _resolveGame(address _player) internal {
        // Generate a pseudo-random number based on block properties and player address
        // This is a simple hash-based method
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            block.timestamp,      // Current block timestamp
            block.difficulty,     // Current block difficulty (or mixHash on PoS)
            _player,              // Player's address
            block.number          // Current block number
        ))) % 3; // Modulo 3 to get 0, 1, or 2 (which map to Rock, Paper, Scissors)

        Choice botChoice;
        if (randomNumber == 0) { // 0 -> Rock
            botChoice = Choice.Rock;
        } else if (randomNumber == 1) { // 1 -> Paper
            botChoice = Choice.Paper;
        } else { // 2 -> Scissors
            botChoice = Choice.Scissors;
        }

        Choice playerChoice = playerGames[_player].playerChoice;
        uint256 bet = playerGames[_player].betAmount;
        string memory result;
        uint256 payout = 0;

        if (playerChoice == botChoice) {
            // Draw: Players can re-roll without losing initial bet.
            // Game state 'inGame' remains true. playerChoice is reset to allow new choice.
            playerGames[_player].playerChoice = Choice.None; // Allow player to choose again
            result = "Draw";
            emit Draw(_player, playerChoice, botChoice);
        } else if (
            (playerChoice == Choice.Rock && botChoice == Choice.Scissors) ||
            (playerChoice == Choice.Paper && botChoice == Choice.Rock) ||
            (playerChoice == Choice.Scissors && botChoice == Choice.Paper)
        ) {
            // Player wins: Payout is twice the bet amount (initial bet + win amount)
            result = "Win";
            payout = bet * 2;
            payable(_player).transfer(payout); // Send ZTC to the player
            // Reset game state for next new game
            playerGames[_player].inGame = false;
            playerGames[_player].playerChoice = Choice.None;
            playerGames[_player].betAmount = 0;
        } else {
            // Player loses: Bet amount remains in the contract
            result = "Lose";
            // Reset game state for next new game
            playerGames[_player].inGame = false;
            playerGames[_player].playerChoice = Choice.None;
            playerGames[_player].betAmount = 0;
        }

        emit GameResolved(_player, playerChoice, botChoice, result, payout);
    }

    // Function to allow the contract owner to withdraw accumulated ZTC (from lost bets)
    function withdraw() public onlyOwner {
        // Transfer all available ZTC balance from the contract to the owner
        payable(owner).transfer(address(this).balance);
    }

    // Modifier to restrict access to owner-only functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }
}
