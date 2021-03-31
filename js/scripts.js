resetBtn = document.querySelector('#resetBtn');

resetBtn.addEventListener('click', () => {
    game.reset()
    config.position = 'start'
    board = Chessboard('myBoard', config)
  })
