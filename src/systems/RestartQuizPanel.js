import Phaser from 'phaser';
import { GAME_AUDIO } from '../config/gameAudio.js';
import { getQuizQuestionType, pickRandomQuizQuestion } from '../config/quizQuestions.js';

const GAME_WIDTH = 844;
const GAME_HEIGHT = 390;
const QUIZ_COOLDOWN_SECONDS = 20;
const QUIZ_DRAW_CANVAS_WIDTH = 420;
const QUIZ_DRAW_CANVAS_HEIGHT = 128;
const QUIZ_DRAW_PANEL_Y = GAME_HEIGHT / 2 + 8;
const QUIZ_DRAW_CANVAS_CENTER_X = GAME_WIDTH / 2;
const QUIZ_DRAW_CANVAS_CENTER_Y = QUIZ_DRAW_PANEL_Y + 34;
const QUIZ_TEXT_Y = -58;
const QUIZ_DRAW_TEXT_RAISE = 15;

/** 게임 오버 후 재시작용 퀴즈 패널 (낚시 게임 1과 동일 흐름) */
export default class RestartQuizPanel {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.scenePlugin = scene.scene;
    this.sceneKey = scene.sys.settings.key;
    this.panelTitle = options.panelTitle ?? '다시 플레이하려면 문제를 풀어요!';
    this.successMessage = options.successMessage ?? '정답! 다시 시작해요';
    this.drawSuccessMessage = options.drawSuccessMessage ?? '완료! 다시 시작해요';
    this.onSuccess = options.onSuccess ?? (() => {
      this.scenePlugin.start(this.sceneKey);
    });
    this.depth = options.depth ?? 102;

    this.isActive = false;
    this.isLocked = false;
    this.cooldownLeft = 0;
    this.cooldownTimer = null;
    this.restartDelayTimer = null;
    this.question = null;
    this.buttons = [];
    this.drawButtons = [];
  }

  show() {
    this.isActive = true;
    this.scene.isQuizActive = true;
    this.clearCooldownTimer();
    this.clearInteraction();

    if (this.container) {
      this.container.destroy(true);
    }

    this.container = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    this.container.setDepth(this.depth);

    const panelBg = this.scene.add.rectangle(0, 0, 560, 312, 0x1c314a, 0.95);
    panelBg.setStrokeStyle(3, 0xffd43b);
    panelBg.setInteractive({ useHandCursor: false });
    this.panelBg = panelBg;

    const title = this.scene.add.text(0, -102, this.panelTitle, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.questionText = this.scene.add.text(0, QUIZ_TEXT_Y, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '28px',
      color: '#ffd43b',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 500 },
    }).setOrigin(0.5);

    this.buttonContainer = this.scene.add.container(0, 10);

    this.feedbackText = this.scene.add.text(0, 132, '정답을 골라 보세요', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ced4da',
    }).setOrigin(0.5);

    this.container.add([
      panelBg,
      title,
      this.questionText,
      this.buttonContainer,
      this.feedbackText,
    ]);

    this.buttons = [];
    this.drawButtons = [];
    this.presentQuestion();
  }

  playCorrectSound() {
    const sound = this.scene.sound;
    if (sound.locked) sound.unlock();
    this.scene.quizWrongSound?.stop();
    this.scene.quizCorrectSound?.stop();
    this.scene.quizCorrectSound?.play();
  }

  playWrongSound() {
    const sound = this.scene.sound;
    if (sound.locked) sound.unlock();
    this.scene.quizCorrectSound?.stop();
    this.scene.quizWrongSound?.stop();
    this.scene.quizWrongSound?.play();
  }

  presentQuestion() {
    this.question = pickRandomQuizQuestion();
    this.isLocked = false;
    this.cooldownLeft = 0;
    this.clearCooldownTimer();
    this.clearInteraction();

    const isDraw = getQuizQuestionType(this.question) === 'draw';

    this.questionText.setText(this.question.prompt);

    if (isDraw) {
      this.feedbackText.setText('그림을 그리고 확인을 눌러 주세요');
      this.feedbackText.setColor('#ced4da');
      this.buildDrawingQuiz();
      return;
    }

    if (this.panelBg) this.panelBg.setSize(560, 312);
    if (this.container) this.container.setY(GAME_HEIGHT / 2 + 20);
    if (this.feedbackText) this.feedbackText.setY(132);
    if (this.questionText) this.questionText.setY(QUIZ_TEXT_Y);

    this.feedbackText.setText('정답을 골라 보세요');
    this.feedbackText.setColor('#ced4da');
    this.buildChoiceButtons(this.question.options);
  }

  buildChoiceButtons(options) {
    const positions = [
      { x: -130, y: -18 },
      { x: 130, y: -18 },
      { x: -130, y: 52 },
      { x: 130, y: 52 },
    ];

    options.forEach((choice, index) => {
      const { x, y } = positions[index];
      const button = this.scene.add.container(x, y);
      const bg = this.scene.add.rectangle(0, 0, 240, 52, 0x339af0, 1);
      const text = this.scene.add.text(0, 0, choice, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
      }).setOrigin(0.5);

      button.add([bg, text]);
      button.setSize(240, 52);
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        if (!this.isLocked) bg.setFillStyle(0x228be6, 1);
      });
      button.on('pointerout', () => {
        if (!this.isLocked) bg.setFillStyle(0x339af0, 1);
      });
      button.on('pointerdown', () => this.checkAnswer(choice, bg));

      this.buttonContainer.add(button);
      this.buttons.push({ button, bg, choice });
    });
  }

  buildDrawingQuiz() {
    if (this.panelBg) this.panelBg.setSize(560, 360);
    if (this.container) this.container.setY(QUIZ_DRAW_PANEL_Y);
    if (this.feedbackText) this.feedbackText.setY(148);
    if (this.questionText) this.questionText.setY(QUIZ_TEXT_Y - QUIZ_DRAW_TEXT_RAISE);

    this.drawCanvasCenter = { x: QUIZ_DRAW_CANVAS_CENTER_X, y: QUIZ_DRAW_CANVAS_CENTER_Y };
    this.drawCanvasBounds = new Phaser.Geom.Rectangle(
      QUIZ_DRAW_CANVAS_CENTER_X - QUIZ_DRAW_CANVAS_WIDTH / 2,
      QUIZ_DRAW_CANVAS_CENTER_Y - QUIZ_DRAW_CANVAS_HEIGHT / 2,
      QUIZ_DRAW_CANVAS_WIDTH,
      QUIZ_DRAW_CANVAS_HEIGHT,
    );

    this.drawingLayer = this.scene.add.container(0, 0).setDepth(this.depth + 1);
    const canvasBg = this.scene.add.rectangle(
      QUIZ_DRAW_CANVAS_CENTER_X,
      QUIZ_DRAW_CANVAS_CENTER_Y,
      QUIZ_DRAW_CANVAS_WIDTH,
      QUIZ_DRAW_CANVAS_HEIGHT,
      0xffffff,
      1,
    );
    canvasBg.setStrokeStyle(2, 0x868e96);
    canvasBg.setInteractive({ useHandCursor: true });

    this.renderTexture = this.scene.add.renderTexture(
      QUIZ_DRAW_CANVAS_CENTER_X,
      QUIZ_DRAW_CANVAS_CENTER_Y,
      QUIZ_DRAW_CANVAS_WIDTH,
      QUIZ_DRAW_CANVAS_HEIGHT,
    );
    this.renderTexture.setOrigin(0.5, 0.5);

    this.drawHint = this.scene.add.text(
      QUIZ_DRAW_CANVAS_CENTER_X,
      QUIZ_DRAW_CANVAS_CENTER_Y,
      '여기에 그려 보세요',
      { fontFamily: 'Segoe UI, sans-serif', fontSize: '16px', color: '#adb5bd' },
    ).setOrigin(0.5);

    this.drawBrush = this.scene.make.graphics({ add: false });
    this.drawingLayer.add([canvasBg, this.renderTexture, this.drawHint]);
    canvasBg.on('pointerdown', (pointer) => this.handleDrawDown(pointer));

    this.drawUpHandler = () => this.handleDrawUp();
    this.scene.input.on('pointerup', this.drawUpHandler);
    this.scene.input.on('pointerupoutside', this.drawUpHandler);

    const clearBtn = this.createPanelButton(-95, 108, '지우기', 0x868e96, () => this.clearDrawing());
    const submitBtn = this.createPanelButton(95, 108, '확인', 0x40c057, () => this.submitDrawing());
    this.buttonContainer.add([clearBtn, submitBtn]);
    this.drawButtons = [
      { button: clearBtn, bg: clearBtn.list[0] },
      { button: submitBtn, bg: submitBtn.list[0] },
    ];
    this.buttons = [];
  }

  createPanelButton(x, y, label, color, onPress) {
    const button = this.scene.add.container(x, y);
    const bg = this.scene.add.rectangle(0, 0, 150, 42, color, 1);
    bg.setStrokeStyle(2, 0xffffff);
    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(150, 42);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      if (!this.isActive || this.isLocked) return;
      onPress();
    });
    return button;
  }

  clampDrawPoint(x, y) {
    const halfW = QUIZ_DRAW_CANVAS_WIDTH / 2;
    const halfH = QUIZ_DRAW_CANVAS_HEIGHT / 2;
    return {
      x: Phaser.Math.Clamp(x, -halfW, halfW),
      y: Phaser.Math.Clamp(y, -halfH, halfH),
    };
  }

  getDrawPoint(pointer) {
    return this.clampDrawPoint(
      pointer.x - this.drawCanvasCenter.x,
      pointer.y - this.drawCanvasCenter.y,
    );
  }

  toTexturePoint(x, y) {
    return {
      x: x + QUIZ_DRAW_CANVAS_WIDTH / 2,
      y: y + QUIZ_DRAW_CANVAS_HEIGHT / 2,
    };
  }

  drawStroke(fromX, fromY, toX, toY) {
    const start = this.toTexturePoint(fromX, fromY);
    const end = this.toTexturePoint(toX, toY);
    this.drawBrush.clear();
    this.drawBrush.lineStyle(3, 0x212529, 1);
    this.drawBrush.lineBetween(start.x, start.y, end.x, end.y);
    this.renderTexture.draw(this.drawBrush, 0, 0);
  }

  handleDrawDown(pointer) {
    if (!this.isActive || this.isLocked || !this.drawCanvasBounds) return;
    if (!Phaser.Geom.Rectangle.Contains(this.drawCanvasBounds, pointer.x, pointer.y)) return;
    if (this.drawHint?.visible) this.drawHint.setVisible(false);

    const point = this.getDrawPoint(pointer);
    this.drawState = { isDrawing: true, lastX: point.x, lastY: point.y };
    if (!this.drawMoveHandler) {
      this.drawMoveHandler = (p) => this.handleDrawMove(p);
      this.scene.input.on('pointermove', this.drawMoveHandler);
    }
  }

  handleDrawMove(pointer) {
    if (!this.drawState?.isDrawing || !this.renderTexture) return;
    const point = this.getDrawPoint(pointer);
    this.drawStroke(this.drawState.lastX, this.drawState.lastY, point.x, point.y);
    this.drawState.lastX = point.x;
    this.drawState.lastY = point.y;
  }

  handleDrawUp() {
    if (this.drawState) this.drawState.isDrawing = false;
    if (this.drawMoveHandler) {
      this.scene.input.off('pointermove', this.drawMoveHandler);
      this.drawMoveHandler = null;
    }
  }

  clearDrawing() {
    this.renderTexture?.clear();
    if (this.drawHint) this.drawHint.setVisible(true);
  }

  submitDrawing() {
    if (!this.isActive || this.isLocked) return;
    this.completeSuccess(this.drawSuccessMessage);
  }

  checkAnswer(selected, buttonBg) {
    if (!this.isActive || this.isLocked) return;

    if (selected === this.question.answer) {
      buttonBg.setFillStyle(0x40c057, 1);
      this.completeSuccess(this.successMessage);
      return;
    }

    buttonBg.setFillStyle(0xfa5252, 1);
    this.playWrongSound();
    this.startCooldown();

    this.scene.time.delayedCall(500, () => {
      if (!this.isActive || !this.isLocked) return;
      buttonBg.setFillStyle(0x339af0, 1);
      buttonBg.setAlpha(0.45);
    });
  }

  completeSuccess(message) {
    try {
      this.playCorrectSound();
    } catch (_) {
      // 사운드 실패해도 재시작은 진행
    }

    if (this.feedbackText?.active) {
      this.feedbackText.setText(message);
      this.feedbackText.setColor('#69db7c');
    }
    this.isActive = false;
    this.isLocked = true;
    this.scene.isQuizActive = false;
    this.clearCooldownTimer();
    this.clearInteraction();
    this.clearRestartDelayTimer();

    const restart = this.onSuccess;
    this.restartDelayTimer = window.setTimeout(() => {
      this.restartDelayTimer = null;
      try {
        this.destroy();
        restart();
      } catch (error) {
        console.error('[RestartQuizPanel] restart failed:', error);
        this.scenePlugin.start(this.sceneKey);
      }
    }, 600);
  }

  clearRestartDelayTimer() {
    if (this.restartDelayTimer != null) {
      clearTimeout(this.restartDelayTimer);
      this.restartDelayTimer = null;
    }
  }

  startCooldown() {
    this.isLocked = true;
    this.cooldownLeft = QUIZ_COOLDOWN_SECONDS;
    this.setButtonsEnabled(false);
    this.feedbackText.setText(`틀렸어요! ${this.cooldownLeft}초 후에 다시 풀 수 있어요`);
    this.feedbackText.setColor('#ff8787');

    this.clearCooldownTimer();
    this.cooldownTimer = this.scene.time.addEvent({
      delay: 1000,
      repeat: QUIZ_COOLDOWN_SECONDS - 1,
      callback: () => {
        this.cooldownLeft -= 1;
        if (this.cooldownLeft <= 0) {
          this.endCooldown();
          return;
        }
        this.feedbackText.setText(`틀렸어요! ${this.cooldownLeft}초 후에 다시 풀 수 있어요`);
      },
    });
  }

  endCooldown() {
    this.clearCooldownTimer();
    this.isLocked = false;
    this.cooldownLeft = 0;
    this.setButtonsEnabled(true);
    const isDraw = getQuizQuestionType(this.question) === 'draw';
    this.feedbackText.setText(isDraw ? '그림을 그리고 확인을 눌러 주세요' : '정답을 골라 보세요');
    this.feedbackText.setColor('#ced4da');
  }

  setButtonsEnabled(enabled) {
    this.buttons.forEach(({ button, bg }) => {
      if (enabled) {
        button.setInteractive({ useHandCursor: true });
        bg.setAlpha(1);
      } else {
        button.disableInteractive();
        bg.setAlpha(0.45);
      }
    });
    this.drawButtons.forEach(({ button, bg }) => {
      if (enabled) {
        button.setInteractive({ useHandCursor: true });
        bg.setAlpha(1);
      } else {
        button.disableInteractive();
        bg.setAlpha(0.45);
      }
    });
  }

  clearCooldownTimer() {
    if (this.cooldownTimer) {
      this.cooldownTimer.remove(false);
      this.cooldownTimer = null;
    }
  }

  teardownDrawInput() {
    if (this.drawMoveHandler) {
      this.scene.input.off('pointermove', this.drawMoveHandler);
      this.drawMoveHandler = null;
    }
    if (this.drawUpHandler) {
      this.scene.input.off('pointerup', this.drawUpHandler);
      this.scene.input.off('pointerupoutside', this.drawUpHandler);
      this.drawUpHandler = null;
    }
    this.drawState = null;
  }

  clearInteraction() {
    this.teardownDrawInput();
    this.buttons.forEach(({ button }) => button.destroy());
    this.buttons = [];
    if (this.buttonContainer) this.buttonContainer.removeAll(true);
    if (this.drawBrush) {
      this.drawBrush.destroy();
      this.drawBrush = null;
    }
    if (this.drawingLayer) {
      this.drawingLayer.destroy(true);
      this.drawingLayer = null;
    }
    this.renderTexture = null;
    this.drawCanvasCenter = null;
    this.drawCanvasBounds = null;
    this.drawHint = null;
    this.drawButtons = [];
  }

  destroy() {
    this.clearRestartDelayTimer();
    this.clearCooldownTimer();
    this.clearInteraction();
    if (this.container) {
      this.container.destroy(true);
      this.container = null;
    }
    this.isActive = false;
    this.scene.isQuizActive = false;
  }
}

export function setupQuizSounds(scene) {
  scene.quizCorrectSound = scene.sound.add(GAME_AUDIO.quizCorrect.key, {
    volume: GAME_AUDIO.quizCorrect.volume,
  });
  scene.quizWrongSound = scene.sound.add(GAME_AUDIO.quizWrong.key, {
    volume: GAME_AUDIO.quizWrong.volume,
  });
}
