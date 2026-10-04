// 단어장: "단어 뜻 [이모지]" — tier 1(그림 단어), 2(기초), 3(교과서 확장)
const WORDS_T1 = `
ant 개미 🐜|arm 팔 💪|art 미술 🎨
bag 가방 👜|bat 박쥐 🦇|bed 침대 🛏️|bee 벌 🐝|bus 버스 🚌|box 상자 📦|boy 소년 👦|bird 새 🐦|book 책 📖|ball 공 ⚽|bear 곰 🐻|boat 보트 ⛵|bike 자전거 🚲|bell 종 🔔
cat 고양이 🐱|cap 모자 🧢|car 자동차 🚗|cow 소 🐄|cup 컵 ☕|cake 케이크 🎂|corn 옥수수 🌽|crab 게 🦀
dog 개 🐶|doll 인형 🪆|door 문 🚪|duck 오리 🦆|desk 책상 🪑|drum 북 🥁
egg 달걀 🥚|ear 귀 👂|eye 눈 👁️|earth 지구 🌍
fan 선풍기 🪭|fish 물고기 🐟|frog 개구리 🐸|fox 여우 🦊|foot 발 🦶|fire 불 🔥|fork 포크 🍴|flag 깃발 🚩
gift 선물 🎁|goat 염소 🐐|game 게임 🎮|girl 소녀 👧|grape 포도 🍇|ghost 유령 👻
hat 모자 🎩|hen 암탉 🐔|hand 손 ✋|home 집 🏠|horse 말 🐴|ham 햄 🍖
ice 얼음 🧊|ink 잉크 ✒️|igloo 이글루 🛖
jar 병 🫙|jet 제트기 ✈️|juice 주스 🧃|jeans 청바지 👖
key 열쇠 🔑|kid 아이 🧒|king 왕 👑|kite 연 🪁|koala 코알라 🐨
leg 다리 🦵|lion 사자 🦁|leaf 잎 🍃|lamp 램프 💡|lip 입술 👄|lock 자물쇠 🔒
map 지도 🗺️|man 남자 👨|milk 우유 🥛|moon 달 🌙|mouse 쥐 🐭|mask 가면 🎭
net 그물 🥅|nut 견과 🥜|nose 코 👃|nest 둥지 🪺|note 쪽지 📝
owl 부엉이 🦉|oil 기름 🛢️|ox 황소 🐂|onion 양파 🧅
pen 펜 🖊️|pig 돼지 🐷|pear 배 🍐|pizza 피자 🍕|panda 판다 🐼
queen 여왕 👸
rat 쥐 🐀|ring 반지 💍|road 도로 🛣️|rose 장미 🌹|rain 비 🌧️|robot 로봇 🤖
sun 해 ☀️|sea 바다 🌊|sock 양말 🧦|star 별 ⭐|ship 배 🚢|snow 눈 ❄️|seal 물개 🦭|shoe 신발 👟
tea 차 🍵|toy 장난감 🧸|tree 나무 🌳|taxi 택시 🚕|tent 텐트 ⛺|tiger 호랑이 🐯
uncle 삼촌 🧔
van 승합차 🚐|vase 꽃병 🏺
web 거미줄 🕸️|wolf 늑대 🐺|worm 벌레 🪱|wing 날개 🪽|whale 고래 🐋|watch 손목시계 ⌚
yak 야크 🐃|yarn 털실 🧶|yoyo 요요 🪀
zoo 동물원 🦁|zebra 얼룩말 🦓
`;
const WORDS_T2 = `
actor 배우|air 공기|angry 화난|animal 동물|answer 대답|apple 사과|arrive 도착하다|ask 묻다|aunt 이모·고모|autumn 가을
baby 아기|bake 굽다|banana 바나나|band 밴드|bank 은행|basket 바구니|beach 해변|big 큰|black 검은색|blue 파란색|body 몸|bottle 병|brave 용감한|bread 빵|bridge 다리|brother 남자 형제|brown 갈색|busy 바쁜|buy 사다
camera 카메라|camp 캠프|candy 사탕|carrot 당근|chair 의자|cheese 치즈|child 아이|city 도시|class 수업|clean 깨끗한|clock 시계|cloud 구름|coat 코트|cold 추운|color 색깔|cook 요리하다|cookie 쿠키|cute 귀여운
dance 춤추다|dark 어두운|daughter 딸|day 날|dinner 저녁 식사|doctor 의사|draw 그리다|dream 꿈|dress 드레스|drink 마시다|drive 운전하다
early 이른|east 동쪽|easy 쉬운|eat 먹다|eight 8|elephant 코끼리|empty 비어 있는|end 끝|enjoy 즐기다|evening 저녁|exam 시험|eraser 지우개
face 얼굴|fall 떨어지다|family 가족|farm 농장|fast 빠른|father 아버지|find 찾다|finger 손가락|first 첫 번째|five 5|flower 꽃|fly 날다|food 음식|friend 친구|fruit 과일|fun 재미|funny 웃긴
garden 정원|gate 대문|give 주다|glad 기쁜|glass 유리잔|glove 장갑|good 좋은|grass 풀|gray 회색|great 대단한|green 초록색|group 무리|guitar 기타
hair 머리카락|happy 행복한|hard 어려운|head 머리|heart 심장|help 돕다|hero 영웅|high 높은|hill 언덕|hobby 취미|holiday 휴일|honey 꿀|hope 희망|hospital 병원|hour 시간|house 집|hungry 배고픈
idea 생각|insect 곤충|inside 안에|invite 초대하다|iron 철|island 섬|item 물건
jacket 재킷|job 직업|join 함께하다|joke 농담|joy 기쁨|jump 뛰다|jungle 정글
kick 차다|kind 친절한|kitchen 부엌|knee 무릎|knife 칼|know 알다
ladder 사다리|large 큰|last 마지막의|late 늦은|laugh 웃다|learn 배우다|lemon 레몬|letter 편지|library 도서관|light 빛|like 좋아하다|line 선|listen 듣다|little 작은|long 긴|look 보다|love 사랑|lucky 운 좋은|lunch 점심
magic 마법|make 만들다|many 많은|market 시장|meat 고기|meet 만나다|melon 멜론|money 돈|monkey 원숭이|morning 아침|mother 어머니|mountain 산|mouth 입|movie 영화|music 음악
name 이름|near 가까운|neck 목|new 새로운|nice 좋은|night 밤|nine 9|noon 정오|north 북쪽|nurse 간호사
ocean 바다|office 사무실|old 오래된|open 열다|orange 오렌지|outside 밖에|oven 오븐
paint 칠하다|paper 종이|park 공원|party 파티|pencil 연필|people 사람들|piano 피아노|picture 그림|pink 분홍색|place 장소|plant 식물|play 놀다|police 경찰|potato 감자|pretty 예쁜|puppy 강아지|purple 보라색
question 질문|quick 빠른|quiet 조용한|quiz 퀴즈
rabbit 토끼|race 경주|radio 라디오|read 읽다|red 빨간색|rice 쌀|ride 타다|river 강|rock 바위|room 방|run 달리다
sad 슬픈|salad 샐러드|sand 모래|school 학교|science 과학|season 계절|seven 7|sheep 양|shop 가게|short 짧은|sing 노래하다|sister 여자 형제|sky 하늘|sleep 자다|small 작은|smile 미소|soccer 축구|song 노래|soup 수프|spring 봄|student 학생|study 공부하다|summer 여름|sweet 달콤한|swim 수영하다
table 탁자|tall 키가 큰|teacher 선생님|ten 10|test 시험|thank 감사하다|three 3|ticket 표|time 시간|today 오늘|tooth 이|town 마을|train 기차|travel 여행하다|two 2
ugly 못생긴|under 아래에|use 사용하다|usual 보통의
vacation 방학|very 매우|video 비디오|visit 방문하다|voice 목소리
wait 기다리다|walk 걷다|wall 벽|want 원하다|warm 따뜻한|wash 씻다|water 물|week 주|white 흰색|wind 바람|window 창문|winter 겨울|woman 여자|word 단어|work 일하다|write 쓰다
year 해, 년|yellow 노란색|yes 네|young 어린|yummy 맛있는|yard 마당|yesterday 어제
zero 0, 영|zone 구역
`;
const WORDS_T3 = `
accident 사고|active 활동적인|address 주소|adventure 모험|advice 조언|agree 동의하다|alone 혼자|amazing 놀라운|area 지역|artist 예술가|attention 주의|average 평균
balance 균형|believe 믿다|borrow 빌리다|breakfast 아침 식사|build 짓다|business 사업
calendar 달력|career 직업|celebrate 축하하다|challenge 도전|change 변화|character 등장인물|choose 고르다|climate 기후|collect 모으다|comfortable 편안한|culture 문화|curious 궁금한|create 창조하다|canvas 캔버스
danger 위험|decide 결정하다|delicious 맛있는|design 디자인|different 다른|difficult 어려운|discover 발견하다|donate 기부하다
energy 에너지|environment 환경|exercise 운동|experience 경험|explain 설명하다|excited 신이 난|enter 들어가다|example 예시
favorite 가장 좋아하는|festival 축제|forest 숲|future 미래|freedom 자유|feeling 감정
goal 목표|guess 추측하다|guide 안내자|gallery 미술관|graffiti 그라피티
habit 습관|health 건강|history 역사|honest 정직한|human 인간|humor 유머
imagine 상상하다|important 중요한|information 정보|interest 흥미|interview 인터뷰|invent 발명하다
journey 여행|judge 판단하다|junior 후배
keyboard 키보드|kindness 친절|knowledge 지식
language 언어|leader 지도자|lesson 수업|local 지역의|lonely 외로운
machine 기계|member 회원|memory 기억|message 메시지|mistake 실수|museum 박물관|mural 벽화
nature 자연|nervous 긴장한|neighbor 이웃|network 네트워크|novel 소설
object 물체|offer 제안하다|opinion 의견|order 주문하다|ordinary 평범한
patient 참을성 있는|peace 평화|perfect 완벽한|planet 행성|plastic 플라스틱|popular 인기 있는|practice 연습하다|present 선물|problem 문제|protect 보호하다
quarter 4분의 1|quality 품질
recycle 재활용하다|remember 기억하다|report 보고서|respect 존중하다|rule 규칙
safety 안전|schedule 일정|secret 비밀|share 나누다|simple 간단한|skill 기술|solve 해결하다|special 특별한|street 거리|success 성공|symbol 상징|smartphone 스마트폰
talent 재능|team 팀|technology 기술|tradition 전통|together 함께|trash 쓰레기|trip 여행|tourist 관광객
understand 이해하다|unique 독특한|universe 우주|useful 유용한
value 가치|village 마을|volunteer 자원봉사자|visitor 방문객
wonderful 멋진|world 세계|worry 걱정하다|wildlife 야생 동물
xylophone 실로폰
yogurt 요구르트|youth 젊음
zipper 지퍼
`;
