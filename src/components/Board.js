import React, { useState, useEffect } from "react";
import { LinkedListNode, SinglyLinkedList } from "./LinkedList";
import { randomIntFromInterval, reverseLinkedList } from "../lib/utils";
import "./Board.css";

const BOARD_SIZE = 10;
const PROBABILITY_OF_DIRECTION_REVERSAL_FOOD = 0.3;
const DIRECTION = {
  UP: "UP",
  RIGHT: "RIGHT",
  DOWN: "DOWN",
  LEFT: "LEFT",
};

const Board = () => {
  const [score, setScore] = useState(0);
  const [board] = useState(createBoard(BOARD_SIZE));
  const [snake, setSnake] = useState(
    new SinglyLinkedList(getStartingSnakeLLValue(board))
  );
  const [snakeCells, setSnakeCells] = useState(
    new Set([snake.head.value.cell])
  );

  // Set the food 5 cells away from the starting point of the snake
  const [foodCell, setFoodCell] = useState(snake.head.value.cell + 5);
  const [direction, setDirection] = useState(DIRECTION.RIGHT);
  const [foodShouldReverseDirection, setFoodShouldReverseDirection] = useState(
    false
  );

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      handleKeydown(e);
    });

    return () =>
      window.removeEventListener("keydown", (e) => {
        handleKeydown(e);
      });
  });

  useEffect(() => {
    const snakeSpeed = setTimeout(() => {
      moveSnake();
    }, 150);

    return () => clearTimeout(snakeSpeed);
  });

  const handleKeydown = (e) => {
    const newDirection = getDirectionFromKey(e.key);
    const isValidDirection = newDirection !== "";
    if (!isValidDirection) return;
    const snakeWillRunIntoItself =
      getOppositeDirection(newDirection) === direction && snakeCells.size > 1;
    // Note: this functionality is currently broken, for the same reason that
    // `useInterval` is needed. Specifically, the `direction` and `snakeCells`
    // will currently never reflect their "latest version" when `handleKeydown`
    // is called. I leave it as an exercise to the viewer to fix this :P
    if (snakeWillRunIntoItself) return;
    setDirection(newDirection);
  };

  const moveSnake = () => {
    const currentHeadCoords = {
      row: snake.head.value.row,
      col: snake.head.value.col,
    };

    const nextHeadCoords = getCoordsInDirection(currentHeadCoords, direction);

    // Game over conditions
    if (isOutOfBounds(nextHeadCoords, board)) {
      return handleGameOver();
    }

    const nextHeadCell = board[nextHeadCoords.row][nextHeadCoords.col];
    if (snakeCells.has(nextHeadCell)) {
      return handleGameOver();
    }

    const newHead = new LinkedListNode({
      row: nextHeadCoords.row,
      col: nextHeadCoords.col,
      cell: nextHeadCell,
    });

    const currentHead = snake.head;
    snake.head = newHead;
    currentHead.next = newHead;

    const newSnakeCells = new Set(snakeCells);
    newSnakeCells.delete(snake.tail.value.cell);
    newSnakeCells.add(nextHeadCell);

    snake.tail = snake.tail.next;
    if (snake.tail === null) snake.tail = snake.head;

    const foodConsumed = nextHeadCell === foodCell;
    if (foodConsumed) {
      // This function mutates the newSnakeCells
      growSnake(newSnakeCells);
      if (foodShouldReverseDirection) reverseSnake();
      handleFoodConsumption(newSnakeCells);
    }

    setSnakeCells(newSnakeCells);
  };

  const growSnake = (newSnakeCells) => {
    const growthNodeCoords = getGrowthNodeCoords(snake.tail, direction);
    if (isOutOfBounds(growthNodeCoords, board)) {
      // Snake will grow outside the boundaries of the board; don't do anything
      return;
    }

    const newTailCell = board[growthNodeCoords.row][growthNodeCoords.col];
    const newTail = new LinkedListNode({
      row: growthNodeCoords.row,
      col: growthNodeCoords.col,
      cell: newTailCell,
    });
    const currentTail = snake.tail;
    snake.tail = newTail;
    snake.tail.next = currentTail;

    newSnakeCells.add(newTailCell);
  };

  const reverseSnake = () => {
    const tailNextNodeDirection = getNextNodeDirection(snake.tail, direction);
    const newDirection = getOppositeDirection(tailNextNodeDirection);
    setDirection(newDirection);

    // The tail of the snake is really the head of the linked list, which
    // is why we have to pass the snake's tail to `reverseLinkedList`.
    reverseLinkedList(snake.tail);
    const snakeHead = snake.head;
    snake.head = snake.tail;
    snake.tail = snakeHead;
  };

  const handleFoodConsumption = (newSnakeCells) => {
    const maxPossibleCellValue = BOARD_SIZE * BOARD_SIZE;
    let nextFoodCell;
    // In practice, this will never be a time-consuming operation. Even
    // in the extreme scenario where a snake is so big that it takes up 90%
    // of the board (nearly impossible), there would be a 10% chance of generating
    // a valid new food cell--so an average of 10 operations: trivial.
    while (true) {
      nextFoodCell = randomIntFromInterval(1, maxPossibleCellValue);
      if (newSnakeCells.has(nextFoodCell) || foodCell === nextFoodCell)
        continue;
      break;
    }

    const nextFoodShouldReverseDirection =
      Math.random() < PROBABILITY_OF_DIRECTION_REVERSAL_FOOD;

    setFoodCell(nextFoodCell);
    setFoodShouldReverseDirection(nextFoodShouldReverseDirection);
    setScore(score + 1);
  };

  const handleGameOver = () => {
    setScore(0);
    const snakeLLStartingValue = getStartingSnakeLLValue(board);
    setSnake(new SinglyLinkedList(snakeLLStartingValue));
    setFoodCell(snakeLLStartingValue.cell + 5);
    setSnakeCells(new Set([snakeLLStartingValue.cell]));
    setDirection(DIRECTION.RIGHT);
  };

  return (
    <>
      <h2>Score: {score}</h2>
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cellValue, cellIndex) => {
              const className = getCellClassName(
                cellValue,
                foodCell,
                foodShouldReverseDirection,
                snakeCells
              );
              return <div key={cellIndex} className={className}></div>;
            })}
          </div>
        ))}
      </div>
    </>
  );
};

const createBoard = (BOARD_SIZE) => {
  let counter = 1;
  const board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const currentRow = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      currentRow.push(counter++);
    }
    board.push(currentRow);
  }
  return board;
};

const getStartingSnakeLLValue = (board) => {
  const rowSize = board.length;
  const colSize = board[0].length;
  const startingRow = Math.round(rowSize / 3);
  const startingCol = Math.round(colSize / 3);
  const startingCell = board[startingRow][startingCol];
  return {
    row: startingRow,
    col: startingCol,
    cell: startingCell,
  };
};

const getCoordsInDirection = (coords, direction) => {
  switch (direction) {
    case DIRECTION.UP:
      return {
        row: coords.row - 1,
        col: coords.col,
      };
    case DIRECTION.RIGHT:
      return {
        row: coords.row,
        col: coords.col + 1,
      };
    case DIRECTION.DOWN:
      return {
        row: coords.row + 1,
        col: coords.col,
      };
    case DIRECTION.LEFT:
      return {
        row: coords.row,
        col: coords.col - 1,
      };
    default:
      return {
        row: coords.row,
        col: coords.col,
      };
  }
};

const isOutOfBounds = (coords, board) => {
  const { row, col } = coords;
  if (row < 0 || col < 0) return true;
  if (row >= board.length || col >= board[0].length) return true;
  return false;
};

const getDirectionFromKey = (key) => {
  switch (key) {
    case "ArrowUp":
      return DIRECTION.UP;
    case "ArrowRight":
      return DIRECTION.RIGHT;
    case "ArrowLeft":
      return DIRECTION.LEFT;
    case "ArrowDown":
      return DIRECTION.DOWN;
    default:
      return "";
  }
};

const getNextNodeDirection = (node, currentDirection) => {
  if (node.next === null) return currentDirection;
  const { row: currentRow, col: currentCol } = node.value;
  const { row: nextRow, col: nextCol } = node.next.value;
  if (nextRow === currentRow && nextCol === currentCol + 1) {
    return DIRECTION.RIGHT;
  }
  if (nextRow === currentRow && nextCol === currentCol - 1) {
    return DIRECTION.LEFT;
  }
  if (nextCol === currentCol && nextRow === currentRow + 1) {
    return DIRECTION.DOWN;
  }
  if (nextCol === currentCol && nextRow === currentRow - 1) {
    return DIRECTION.UP;
  }
  return "";
};

const getGrowthNodeCoords = (snakeTail, currentDirection) => {
  const tailNextNodeDirection = getNextNodeDirection(
    snakeTail,
    currentDirection
  );
  const growthDirection = getOppositeDirection(tailNextNodeDirection);
  const currentTailCoords = {
    row: snakeTail.value.row,
    col: snakeTail.value.col,
  };
  const growthNodeCoords = getCoordsInDirection(
    currentTailCoords,
    growthDirection
  );
  return growthNodeCoords;
};

const getOppositeDirection = (direction) => {
  if (direction === DIRECTION.UP) return DIRECTION.DOWN;
  if (direction === DIRECTION.RIGHT) return DIRECTION.LEFT;
  if (direction === DIRECTION.DOWN) return DIRECTION.UP;
  if (direction === DIRECTION.LEFT) return DIRECTION.RIGHT;
};

const getCellClassName = (
  cellValue,
  foodCell,
  foodShouldReverseDirection,
  snakeCells
) => {
  let className = "cell";
  if (cellValue === foodCell) {
    if (foodShouldReverseDirection) {
      className = "cell cell-purple";
    } else {
      className = "cell cell-red";
    }
  }
  if (snakeCells.has(cellValue)) className = "cell cell-green";

  return className;
};

export default Board;
