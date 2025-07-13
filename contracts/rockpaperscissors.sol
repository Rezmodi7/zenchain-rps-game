// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RockPaperScissors {
    enum Choice { None, Rock, Paper, Scissors }

    struct GameState {
        Choice playerChoice;
        uint256 betAmount;
        bool inGame;
    }

    struct PlayerStats {
        uint256 wins;
        uint256 losses;
        uint256 draws;
        uint256 totalGames;
        uint256 lastPlayedDay;
        uint256 playsToday;
    }

    mapping(address => GameState) public playerGames;
    mapping(address => PlayerStats) public playerStats;

    uint256 public minBet = 5 ether;
    uint256 public maxBet = 100 ether;
    address public owner;

    event GameStarted(address indexed player, uint256 betAmount);
    event PlayerChose(address indexed player, Choice choice);
    event GameResolved(address indexed player, Choice playerChoice, Choice botChoice, string result, uint256 payout);
    event Draw(address indexed player, Choice playerChoice, Choice botChoice, uint256 refund);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyInGame() {
        require(playerGames[msg.sender].inGame == true, "Not in game");
        _;
    }

    modifier onlyNotInGame() {
        require(playerGames[msg.sender].inGame == false, "Already in game");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function startGame() public payable onlyNotInGame {
        require(msg.value >= minBet && msg.value <= maxBet, "Bet must be between min and max");

        uint256 offset = 3 hours + 30 minutes;
        uint256 todayTehran = (block.timestamp + offset) / 1 days;

        if (playerStats[msg.sender].lastPlayedDay < todayTehran) {
            playerStats[msg.sender].lastPlayedDay = todayTehran;
            playerStats[msg.sender].playsToday = 0;
        }

        require(playerStats[msg.sender].playsToday < 10, "Daily limit reached");

        playerGames[msg.sender] = GameState({
            playerChoice: Choice.None,
            betAmount: msg.value,
            inGame: true
        });

        emit GameStarted(msg.sender, msg.value);
    }

    function makeChoice(Choice _playerChoice) public payable onlyInGame {
        require(_playerChoice != Choice.None, "Invalid choice");
        require(playerGames[msg.sender].playerChoice == Choice.None, "Already chosen");
        require(msg.value == 0, "No additional funds required");

        playerGames[msg.sender].playerChoice = _playerChoice;
        emit PlayerChose(msg.sender, _playerChoice);

        _resolveGame(msg.sender);
    }

    function _resolveGame(address _player) internal {
        uint256 random = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _player, block.number))
        ) % 3;

        Choice botChoice = Choice(random + 1);
        Choice playerChoice = playerGames[_player].playerChoice;
        uint256 bet = playerGames[_player].betAmount;

        string memory result;
        uint256 payout = 0;

        uint256 offset = 3 hours + 30 minutes;
        uint256 todayTehran = (block.timestamp + offset) / 1 days;

        playerStats[_player].totalGames++;
        playerStats[_player].playsToday++;
        playerStats[_player].lastPlayedDay = todayTehran;

        if (playerChoice == botChoice) {
            result = "Draw";
            playerStats[_player].draws++;

            // Refund bet and reset state
            (bool refunded, ) = payable(_player).call{value: bet}("");
            require(refunded, "Refund failed");

            playerGames[_player].inGame = false;
            playerGames[_player].playerChoice = Choice.None;
            playerGames[_player].betAmount = 0;

            emit Draw(_player, playerChoice, botChoice, bet);
            return;
        }

        bool win = (
            (playerChoice == Choice.Rock && botChoice == Choice.Scissors) ||
            (playerChoice == Choice.Paper && botChoice == Choice.Rock) ||
            (playerChoice == Choice.Scissors && botChoice == Choice.Paper)
        );

        if (win) {
            result = "Win";
            payout = bet * 2;
            playerStats[_player].wins++;

            (bool success, ) = payable(_player).call{value: payout}("");
            require(success, "Failed to send winnings");
        } else {
            result = "Lose";
            playerStats[_player].losses++;
        }

        // Reset game state
        playerGames[_player].inGame = false;
        playerGames[_player].playerChoice = Choice.None;
        playerGames[_player].betAmount = 0;

        emit GameResolved(_player, playerChoice, botChoice, result, payout);
    }

    function fundContract() public payable {}
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
    fallback() external payable {}
}
