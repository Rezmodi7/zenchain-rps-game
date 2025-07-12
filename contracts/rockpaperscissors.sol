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

    uint256 public minBet = 5 * 10**18;    // 5 ZTC
    uint256 public maxBet = 100 * 10**18;  // 100 ZTC

    address public owner;

    event GameStarted(address indexed player, uint256 betAmount);
    event PlayerChose(address indexed player, Choice choice);
    event GameResolved(address indexed player, Choice playerChoice, Choice botChoice, string result, uint256 payout);
    event Draw(address indexed player, Choice playerChoice, Choice botChoice);

    modifier onlyInGame() {
        require(playerGames[msg.sender].inGame == true, "You are not in an active game.");
        _;
    }

    modifier onlyNotInGame() {
        require(playerGames[msg.sender].inGame == false, "You are already in an active game.");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function startGame() public payable onlyNotInGame {
        require(msg.value >= minBet, "Bet must be at least 5 ZTC.");
        require(msg.value <= maxBet, "Bet must not exceed 100 ZTC.");

        playerGames[msg.sender] = GameState({
            playerChoice: Choice.None,
            betAmount: msg.value,
            inGame: true
        });

        emit GameStarted(msg.sender, msg.value);
    }

    function makeChoice(Choice _playerChoice) public payable onlyInGame {
        require(_playerChoice != Choice.None, "Invalid choice.");
        require(playerGames[msg.sender].playerChoice == Choice.None, "Choice already made.");
        require(msg.value == 0, "No additional ETH required.");

        playerGames[msg.sender].playerChoice = _playerChoice;

        emit PlayerChose(msg.sender, _playerChoice);

        _resolveGame(msg.sender);
    }

    function _resolveGame(address _player) internal {
        // Generate pseudo-random number for bot choice
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            _player,
            block.number
        ))) % 3;

        Choice botChoice = Choice(random + 1); // To match Rock/Paper/Scissors (1-3)
        Choice playerChoice = playerGames[_player].playerChoice;
        uint256 bet = playerGames[_player].betAmount;
        string memory result;
        uint256 payout = 0;

        if (playerChoice == botChoice) {
            result = "Draw";
            playerGames[_player].playerChoice = Choice.None;
            emit Draw(_player, playerChoice, botChoice);
        } else if (
            (playerChoice == Choice.Rock && botChoice == Choice.Scissors) ||
            (playerChoice == Choice.Paper && botChoice == Choice.Rock) ||
            (playerChoice == Choice.Scissors && botChoice == Choice.Paper)
        ) {
            result = "Win";
            payout = bet * 2;

            (bool success, ) = payable(_player).call{value: payout}("");
            require(success, "Failed to pay winner.");

            playerGames[_player] = GameState({
                playerChoice: Choice.None,
                betAmount: 0,
                inGame: false
            });
        } else {
            result = "Lose";
            playerGames[_player] = GameState({
                playerChoice: Choice.None,
                betAmount: 0,
                inGame: false
            });
        }

        emit GameResolved(_player, playerChoice, botChoice, result, payout);
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Withdraw failed.");
    }
}
