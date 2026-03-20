# 🏠 3D Interior App

Blueprint3D 기반의 웹 브라우저용 3D 복층 인테리어 가구 배치 앱입니다.
기존 2D 가구 배치 시뮬레이터의 방 구조를 그대로 3D로 변환했습니다.

## 데모

> 배포 후 링크 추가 예정

## 주요 기능

- **3D 복층 방 렌더링**: 1층(380×510cm) + 2층(380×480cm) 복층 구조
- **고정 구조물**: 화장실, 싱크대, 계단, 신발장 등이 3D로 렌더링
- **가구 배치**: Blueprint3D 기본 3D 모델로 방 꾸미기
- **가구 조작**: 배치된 가구를 드래그(이동), 회전, 삭제
- **색상 변경**: 벽과 바닥의 색상/텍스처를 변경
- **3D 네비게이션**: 마우스로 시점 회전, 줌인/줌아웃

## 방 구조

```
  2층 (380×480cm)          1층 (380×510cm)
┌──────────┬────┬──┐   ┌────────┬─────┬────┐
│ 막힌공간 │칸막│  │   │ 화장실 │     │신발│
│   (X)    │이  │계│   │────────┤     │장  │
│──────────┤    │단│   │싱크대  │     │계  │
│          │    │  │   │        │     │단  │
│  배치 가능 영역 │  │   │   배치 가능   │    │
│          │    │  │   │  영역  │     │뒷문│
└──────────┴────┴──┘   └────────┴─────┴────┘
```

## 기술스택

- [Three.js](https://threejs.org/) — 3D 렌더링
- [Blueprint3D](https://github.com/furnishup/blueprint3d) — 인테리어 앱 코어 엔진
- HTML / CSS / JavaScript / jQuery

## 설치 & 실행

### 사전 요구사항
- Node.js (v14 이상)
- Git

### 셋업

```bash
# 레포 클론
git clone <이 레포 URL>
cd <프로젝트 폴더>

# 의존성 설치
npm install

# Grunt 빌드 (처음 한 번)
npm install -g grunt-cli
grunt

# 로컬 서버 실행
cd example
npx serve .
```

브라우저에서 `http://localhost:3000` 접속

## 프로젝트 구조

```
├── src/              # 코어 라이브러리
│   ├── core/         # 유틸리티
│   ├── items/        # 가구 아이템 타입
│   ├── model/        # 데이터 모델
│   └── three/        # 3D 렌더링
├── example/          # 웹 앱
│   ├── index.html    # 진입점
│   ├── models/       # 3D 가구 모델 (OBJ)
│   └── textures/     # 텍스처
├── CLAUDE.md         # 프로젝트 상태 문서
└── README.md         # 이 파일
```

## 원본 프로젝트

이 프로젝트는 [furnishup/blueprint3d](https://github.com/furnishup/blueprint3d) (MIT License)를 기반으로 만들어졌습니다.

## 라이선스

MIT
