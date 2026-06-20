export const QUIZ_CATEGORY_LIST = ['math', 'korean', 'english', 'random'];

export const QUIZ_CATEGORY_LABELS = {
  math: '수학',
  korean: '한글',
  english: '영어',
  random: '랜덤',
};

/** @typedef {{ prompt: string, answer: string, options: string[] }} QuizQuestion */

/** @type {QuizQuestion[]} */
export const MATH_QUESTIONS = [
  { prompt: '1 + 2 = ?', answer: '3', options: ['2', '3', '4', '5'] },
  { prompt: '2 + 3 = ?', answer: '5', options: ['4', '5', '6', '7'] },
  { prompt: '3 + 4 = ?', answer: '7', options: ['5', '6', '7', '8'] },
  { prompt: '4 + 5 = ?', answer: '9', options: ['7', '8', '9', '10'] },
  { prompt: '5 + 2 = ?', answer: '7', options: ['5', '6', '7', '8'] },
  { prompt: '6 + 1 = ?', answer: '7', options: ['6', '7', '8', '9'] },
  { prompt: '2 + 5 = ?', answer: '7', options: ['5', '6', '7', '8'] },
  { prompt: '3 + 3 = ?', answer: '6', options: ['4', '5', '6', '7'] },
  { prompt: '4 + 4 = ?', answer: '8', options: ['6', '7', '8', '9'] },
  { prompt: '5 + 5 = ?', answer: '10', options: ['8', '9', '10', '11'] },
  { prompt: '1 + 9 = ?', answer: '10', options: ['8', '9', '10', '11'] },
  { prompt: '2 + 8 = ?', answer: '10', options: ['8', '9', '10', '11'] },
  { prompt: '3 + 7 = ?', answer: '10', options: ['8', '9', '10', '11'] },
  { prompt: '4 + 6 = ?', answer: '10', options: ['8', '9', '10', '11'] },
  { prompt: '7 + 2 = ?', answer: '9', options: ['7', '8', '9', '10'] },
  { prompt: '8 + 1 = ?', answer: '9', options: ['7', '8', '9', '10'] },
  { prompt: '4 + 2 = ?', answer: '6', options: ['4', '5', '6', '7'] },
  { prompt: '3 + 5 = ?', answer: '8', options: ['6', '7', '8', '9'] },
  { prompt: '6 + 3 = ?', answer: '9', options: ['7', '8', '9', '10'] },
  { prompt: '7 + 3 = ?', answer: '10', options: ['8', '9', '10', '11'] },
  { prompt: '9 - 1 = ?', answer: '8', options: ['6', '7', '8', '9'] },
  { prompt: '8 - 2 = ?', answer: '6', options: ['4', '5', '6', '7'] },
  { prompt: '7 - 3 = ?', answer: '4', options: ['2', '3', '4', '5'] },
  { prompt: '6 - 2 = ?', answer: '4', options: ['2', '3', '4', '5'] },
  { prompt: '5 - 3 = ?', answer: '2', options: ['1', '2', '3', '4'] },
  { prompt: '9 - 4 = ?', answer: '5', options: ['3', '4', '5', '6'] },
  { prompt: '10 - 5 = ?', answer: '5', options: ['3', '4', '5', '6'] },
  { prompt: '10 - 3 = ?', answer: '7', options: ['5', '6', '7', '8'] },
  { prompt: '10 - 1 = ?', answer: '9', options: ['7', '8', '9', '10'] },
  { prompt: '8 - 5 = ?', answer: '3', options: ['1', '2', '3', '4'] },
  { prompt: '7 - 1 = ?', answer: '6', options: ['4', '5', '6', '7'] },
  { prompt: '6 - 4 = ?', answer: '2', options: ['1', '2', '3', '4'] },
  { prompt: '9 - 6 = ?', answer: '3', options: ['1', '2', '3', '4'] },
  { prompt: '10 - 7 = ?', answer: '3', options: ['1', '2', '3', '4'] },
  { prompt: '9 - 2 = ?', answer: '7', options: ['5', '6', '7', '8'] },
  { prompt: '10 - 4 = ?', answer: '6', options: ['4', '5', '6', '7'] },
  { prompt: '5 - 1 = ?', answer: '4', options: ['2', '3', '4', '5'] },
  { prompt: '8 - 3 = ?', answer: '5', options: ['3', '4', '5', '6'] },
];

/** @type {QuizQuestion[]} */
export const KOREAN_QUESTIONS = [
  { prompt: '다음 중 과일은?', answer: '사과', options: ['사과', '책상', '연필', '가방'] },
  { prompt: '다음 중 동물은?', answer: '고양이', options: ['고양이', '의자', '연필', '컵'] },
  { prompt: '다음 중 탈 것은?', answer: '버스', options: ['버스', '나무', '구름', '바위'] },
  { prompt: "'크다'의 반대말은?", answer: '작다', options: ['작다', '길다', '많다', '높다'] },
  { prompt: "'높다'의 반대말은?", answer: '낮다', options: ['낮다', '작다', '넓다', '무겁다'] },
  { prompt: "'밝다'의 반대말은?", answer: '어둡다', options: ['어둡다', '차갑다', '작다', '느리다'] },
  { prompt: "'덥다'의 반대말은?", answer: '춥다', options: ['춥다', '어둡다', '작다', '적다'] },
  { prompt: "'빠르다'의 반대말은?", answer: '느리다', options: ['느리다', '작다', '적다', '낮다'] },
  { prompt: "'많다'의 반대말은?", answer: '적다', options: ['적다', '작다', '낮다', '어둡다'] },
  { prompt: '하늘은 무슨 색?', answer: '파란색', options: ['파란색', '초록색', '보라색', '검은색'] },
  { prompt: '눈사람은 무슨 색?', answer: '하얀색', options: ['하얀색', '빨간색', '노란색', '파란색'] },
  { prompt: '바나나는 무슨 색?', answer: '노란색', options: ['노란색', '파란색', '검은색', '하얀색'] },
  { prompt: '장미는 무슨 색일까?', answer: '빨간색', options: ['빨간색', '초록색', '파란색', '검은색'] },
  { prompt: '풀은 무슨 색?', answer: '초록색', options: ['초록색', '빨간색', '노란색', '하얀색'] },
  { prompt: '아침에 먹는 밥은?', answer: '아침', options: ['아침', '점심', '저녁', '간식'] },
  { prompt: '학교에 가는 곳은?', answer: '학교', options: ['학교', '바다', '우주', '동굴'] },
  { prompt: '비가 올 때 쓰는 것은?', answer: '우산', options: ['우산', '모자', '신발', '장갑'] },
  { prompt: '손을 깨끗이 할 때 쓰는 것은?', answer: '비누', options: ['비누', '연필', '공', '책'] },
  { prompt: '글을 쓸 때 쓰는 것은?', answer: '연필', options: ['연필', '숟가락', '빗', '우산'] },
  { prompt: '책을 읽을 때 필요한 것은?', answer: '책', options: ['책', '프라이팬', '바구니', '망치'] },
  { prompt: '강아지가 하는 소리는?', answer: '멍멍', options: ['멍멍', '음메', '꿀꿀', '야옹'] },
  { prompt: '고양이가 하는 소리는?', answer: '야옹', options: ['야옹', '멍멍', '음메', '꿀꿀'] },
  { prompt: '소가 하는 소리는?', answer: '음메', options: ['음메', '멍멍', '야옹', '꿀꿀'] },
  { prompt: '돼지가 하는 소리는?', answer: '꿀꿀', options: ['꿀꿀', '멍멍', '야옹', '음메'] },
  { prompt: '1월 다음 달은?', answer: '2월', options: ['2월', '3월', '12월', '5월'] },
  { prompt: '일요일 다음 날은?', answer: '월요일', options: ['월요일', '토요일', '수요일', '금요일'] },
  { prompt: '봄 다음 계절은?', answer: '여름', options: ['여름', '가을', '겨울', '봄'] },
  { prompt: '겨울 다음 계절은?', answer: '봄', options: ['봄', '여름', '가을', '겨울'] },
  { prompt: '엄마의 남편은?', answer: '아빠', options: ['아빠', '삼촌', '할아버지', '형'] },
  { prompt: '아빠의 아내는?', answer: '엄마', options: ['엄마', '이모', '할머니', '누나'] },
  { prompt: '형제 중 남자 형은?', answer: '형', options: ['형', '누나', '할머니', '이모'] },
  { prompt: '형제 중 여자 언니는?', answer: '누나', options: ['누나', '형', '삼촌', '할아버지'] },
  { prompt: '바다에 사는 동물은?', answer: '물고기', options: ['물고기', '토끼', '닭', '소'] },
  { prompt: '날아다니는 동물은?', answer: '새', options: ['새', '물고기', '개', '고양이'] },
  { prompt: '다음 중 몸 부위는?', answer: '손', options: ['손', '책', '연필', '공'] },
  { prompt: '배가 고플 때 하는 말은?', answer: '배고파', options: ['배고파', '졸려', '추워', '더워'] },
  { prompt: '잠이 올 때 하는 말은?', answer: '졸려', options: ['졸려', '배고파', '더워', '배불러'] },
];

/** @type {QuizQuestion[]} */
export const ENGLISH_QUESTIONS = [
  { prompt: "'개'를 영어로 하면?", answer: 'dog', options: ['dog', 'cat', 'fish', 'bird'] },
  { prompt: "'고양이'를 영어로 하면?", answer: 'cat', options: ['cat', 'dog', 'cow', 'pig'] },
  { prompt: "'물고기'를 영어로 하면?", answer: 'fish', options: ['fish', 'bird', 'dog', 'cat'] },
  { prompt: "'새'를 영어로 하면?", answer: 'bird', options: ['bird', 'fish', 'dog', 'pig'] },
  { prompt: "'사과'를 영어로 하면?", answer: 'apple', options: ['apple', 'banana', 'grape', 'melon'] },
  { prompt: "'바나나'를 영어로 하면?", answer: 'banana', options: ['banana', 'apple', 'grape', 'melon'] },
  { prompt: "'포도'를 영어로 하면?", answer: 'grape', options: ['grape', 'apple', 'banana', 'melon'] },
  { prompt: "'수박'을 영어로 하면?", answer: 'melon', options: ['melon', 'apple', 'banana', 'grape'] },
  { prompt: "'빨간색'을 영어로 하면?", answer: 'red', options: ['red', 'blue', 'green', 'yellow'] },
  { prompt: "'파란색'을 영어로 하면?", answer: 'blue', options: ['blue', 'red', 'green', 'yellow'] },
  { prompt: "'초록색'을 영어로 하면?", answer: 'green', options: ['green', 'red', 'blue', 'yellow'] },
  { prompt: "'노란색'을 영어로 하면?", answer: 'yellow', options: ['yellow', 'red', 'blue', 'green'] },
  { prompt: "'하얀색'을 영어로 하면?", answer: 'white', options: ['white', 'black', 'red', 'blue'] },
  { prompt: "'검은색'을 영어로 하면?", answer: 'black', options: ['black', 'white', 'red', 'blue'] },
  { prompt: 'One + one = ?', answer: 'two', options: ['one', 'two', 'three', 'four'] },
  { prompt: 'Two + one = ?', answer: 'three', options: ['two', 'three', 'four', 'five'] },
  { prompt: 'Three + two = ?', answer: 'five', options: ['three', 'four', 'five', 'six'] },
  { prompt: 'Five - two = ?', answer: 'three', options: ['two', 'three', 'four', 'five'] },
  { prompt: 'Ten - five = ?', answer: 'five', options: ['three', 'four', 'five', 'six'] },
  { prompt: "'one'은 숫자로?", answer: '1', options: ['1', '2', '3', '4'] },
  { prompt: "'three'는 숫자로?", answer: '3', options: ['1', '2', '3', '4'] },
  { prompt: "'five'는 숫자로?", answer: '5', options: ['3', '4', '5', '6'] },
  { prompt: "'seven'은 숫자로?", answer: '7', options: ['5', '6', '7', '8'] },
  { prompt: "'ten'은 숫자로?", answer: '10', options: ['8', '9', '10', '11'] },
  { prompt: 'Hello means?', answer: '안녕', options: ['안녕', '고마워', '미안', '잘가'] },
  { prompt: 'Thank you means?', answer: '고마워', options: ['고마워', '안녕', '미안', '잘가'] },
  { prompt: 'Sorry means?', answer: '미안', options: ['미안', '안녕', '고마워', '잘가'] },
  { prompt: 'Goodbye means?', answer: '잘가', options: ['잘가', '안녕', '고마워', '미안'] },
  { prompt: "'엄마'를 영어로 하면?", answer: 'mom', options: ['mom', 'dad', 'sun', 'moon'] },
  { prompt: "'아빠'를 영어로 하면?", answer: 'dad', options: ['dad', 'mom', 'sun', 'moon'] },
  { prompt: "'해'를 영어로 하면?", answer: 'sun', options: ['sun', 'moon', 'star', 'cloud'] },
  { prompt: "'달'을 영어로 하면?", answer: 'moon', options: ['moon', 'sun', 'star', 'cloud'] },
  { prompt: "'별'을 영어로 하면?", answer: 'star', options: ['star', 'sun', 'moon', 'cloud'] },
  { prompt: "'구름'을 영어로 하면?", answer: 'cloud', options: ['cloud', 'sun', 'moon', 'star'] },
  { prompt: "'학교'를 영어로 하면?", answer: 'school', options: ['school', 'home', 'park', 'store'] },
  { prompt: "'집'을 영어로 하면?", answer: 'home', options: ['home', 'school', 'park', 'store'] },
  { prompt: "'공'을 영어로 하면?", answer: 'ball', options: ['ball', 'book', 'pen', 'cup'] },
  { prompt: "'책'을 영어로 하면?", answer: 'book', options: ['book', 'ball', 'pen', 'cup'] },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeNumericOptions(answer) {
  const value = Number(answer);
  const wrong = new Set();

  while (wrong.size < 3) {
    const delta = randomInt(-4, 4) || randomInt(1, 3);
    const candidate = value + delta;
    if (candidate < 0 || String(candidate) === answer) continue;
    wrong.add(String(candidate));
  }

  return shuffleOptions([answer, ...wrong]);
}

function buildRandomQuestions() {
  /** @type {QuizQuestion[]} */
  const questions = [];
  const used = new Set();

  const addQuestion = (question) => {
    if (used.has(question.prompt)) return;
    used.add(question.prompt);
    questions.push(question);
  };

  while (questions.length < 50) {
    const a = randomInt(1, 9);
    const b = randomInt(1, 9);
    const answer = String(a + b);
    addQuestion({
      prompt: `${a} + ${b} = ?`,
      answer,
      options: makeNumericOptions(answer),
    });
  }

  while (questions.length < 80) {
    const a = randomInt(5, 10);
    const b = randomInt(1, a - 1);
    const answer = String(a - b);
    addQuestion({
      prompt: `${a} - ${b} = ?`,
      answer,
      options: makeNumericOptions(answer),
    });
  }

  const wordTemplates = [
    { prompt: '하늘에 뜨는 것은?', answer: '해', options: ['해', '책', '연필', '신발'] },
    { prompt: '비 오는 날 쓰는 것은?', answer: '우산', options: ['우산', '모자', '양말', '장갑'] },
    { prompt: '밥 먹을 때 쓰는 것은?', answer: '숟가락', options: ['숟가락', '빗', '연필', '공'] },
    { prompt: '다음 중 과일은?', answer: '포도', options: ['포도', '의자', '연필', '시계'] },
    { prompt: '다음 중 동물은?', answer: '토끼', options: ['토끼', '책상', '컵', '연필'] },
    { prompt: '다음 중 색깔은?', answer: '주황색', options: ['주황색', '책', '연필', '가방'] },
    { prompt: '겨울에 내리는 것은?', answer: '눈', options: ['눈', '꽃', '나비', '잎사귀'] },
    { prompt: '밤하늘에 보이는 것은?', answer: '별', options: ['별', '연필', '공', '책'] },
    { prompt: '학교에서 듣는 것은?', answer: '수업', options: ['수업', '수영', '요리', '낚시'] },
    { prompt: '손가락은 몇 개?', answer: '10', options: ['8', '9', '10', '11'] },
    { prompt: "'개'를 영어로 하면?", answer: 'dog', options: ['dog', 'cat', 'fish', 'bird'] },
    { prompt: "'고양이'를 영어로 하면?", answer: 'cat', options: ['cat', 'dog', 'cow', 'pig'] },
    { prompt: "'사과'를 영어로 하면?", answer: 'apple', options: ['apple', 'banana', 'grape', 'melon'] },
    { prompt: "'학교'를 영어로 하면?", answer: 'school', options: ['school', 'home', 'park', 'store'] },
    { prompt: "'빨간색'을 영어로 하면?", answer: 'red', options: ['red', 'blue', 'green', 'yellow'] },
    { prompt: 'Four + three = ?', answer: '7', options: ['6', '7', '8', '9'] },
    { prompt: 'Six - two = ?', answer: '4', options: ['2', '3', '4', '5'] },
    { prompt: 'Nine - four = ?', answer: '5', options: ['3', '4', '5', '6'] },
    { prompt: 'Hello means?', answer: '안녕', options: ['안녕', '고마워', '미안', '잘가'] },
    { prompt: 'Thank you means?', answer: '고마워', options: ['고마워', '안녕', '미안', '잘가'] },
  ];

  for (const template of wordTemplates) {
    if (questions.length >= 100) break;
    addQuestion({
      prompt: template.prompt,
      answer: template.answer,
      options: shuffleOptions([...template.options]),
    });
  }

  while (questions.length < 100) {
    const a = randomInt(1, 10);
    const b = randomInt(1, 10);
    const answer = String(a + b);
    addQuestion({
      prompt: `${a} + ${b} = ?`,
      answer,
      options: makeNumericOptions(answer),
    });
  }

  return questions;
}

/** @type {QuizQuestion[]} */
export const RANDOM_QUESTIONS = buildRandomQuestions();

const QUESTION_POOLS = {
  math: MATH_QUESTIONS,
  korean: KOREAN_QUESTIONS,
  english: ENGLISH_QUESTIONS,
  random: RANDOM_QUESTIONS,
};

export function pickRandomQuizQuestion() {
  const category = QUIZ_CATEGORY_LIST[Math.floor(Math.random() * QUIZ_CATEGORY_LIST.length)];
  const pool = QUESTION_POOLS[category];
  const question = pool[Math.floor(Math.random() * pool.length)];

  return {
    category,
    ...question,
    options: shuffleOptions(question.options),
  };
}

function shuffleOptions(options) {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
