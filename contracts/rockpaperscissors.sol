// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RockPaperScissors {
    enum Choice { None, Rock, Paper, Scissors }

    struct GameState {
        Choice playerChoice;
        uint256 betAmount;
        bool inGame;
    }

    mapping(address => GameState) public playerGames;

    uint256 public minBet = 5 * 10**18; // 5 ZTC (assuming 18 decimals)

    event GameStarted(address indexed player, uint256 betAmount);
    event PlayerChose(address indexed player, Choice choice);
    event GameResolved(address indexed player, Choice playerChoice, Choice botChoice, string result, uint256 payout);
    event Draw(address indexed player, Choice playerChoice, Choice botChoice);

    modifier onlyInGame() {
        require(playerGames[msg.sender].inGame == true, "You are not in an active game.");
        _;
    }

    modifier onlyNotInGame() {
        require(playerGames[msg.sender].inGame == false, "You are already in an active game. Please resolve or exit.");
        _;
    }

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function startGame() public payable onlyNotInGame {
        require(msg.value >= minBet, "Bet amount must be at least minBet.");

        playerGames[msg.sender].playerChoice = Choice.None;
        playerGames[msg.sender].betAmount = msg.value;
        playerGames[msg.sender].inGame = true;

        emit GameStarted(msg.sender, msg.value);
    }

    function makeChoice(Choice _playerChoice) public payable onlyInGame {
        require(_playerChoice != Choice.None, "Invalid choice. Please choose Rock, Paper, or Scissors.");
        require(playerGames[msg.sender].playerChoice == Choice.None, "You have already made a choice for this round. Waiting for resolution or a new choice after draw.");

        require(msg.value == 0, "No additional funds needed for re-roll after draw.");

        playerGames[msg.sender].playerChoice = _playerChoice;

        emit PlayerChose(msg.sender, _playerChoice);

        _resolveGame(msg.sender);
    }

    function _resolveGame(address _player) internal {
        // Generate a pseudo-random number using block.prevrandao (for PoS compatible chains)
        // WARNING: This method is NOT cryptographically secure for mainnet applications.
        // Attackers (e.g., validators) could potentially manipulate block properties to influence the outcome.
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao, // Changed from block.difficulty to block.prevrandao
            _player,
            block.number
        ))) % 3;

        Choice botChoice;
        if (randomNumber == 0) {
            botChoice = Choice.Rock;
        } else if (randomNumber == 1) {
            botChoice = Choice.Paper;
        } else {
            botChoice = Choice.Scissors;
        }

        Choice playerChoice = playerGames[_player].playerChoice;
        uint256 bet = playerGames[_player].betAmount;
        string memory result;
        uint256 payout = 0;

        if (playerChoice == botChoice) {
            playerGames[_player].playerChoice = Choice.None;
            result = "Draw";
            emit Draw(_player, playerChoice, botChoice);
        } else if (
            (playerChoice == Choice.Rock && botChoice == Choice.Scissors) ||
            (playerChoice == Choice.Paper && botChoice == Choice.Rock) ||
            (playerChoice == Choice.Scissors && botChoice == Choice.Paper)
        ) {
            result = "Win";
            payout = bet * 2;
            (bool success, ) = payable(_player).call{value: payout}("");
            require(success, "Failed to send ZTC to winner.");

            playerGames[_player].inGame = false;
            playerGames[_player].playerChoice = Choice.None;
            playerGames[_player].betAmount = 0;
        } else {
            result = "Lose";
            playerGames[_player].inGame = false;
            playerGames[_player].playerChoice = Choice.None;
            playerGames[_player].betAmount = 0;
        }

        emit GameResolved(_player, playerChoice, botChoice, result, payout);
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Failed to withdraw funds.");
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }
}
