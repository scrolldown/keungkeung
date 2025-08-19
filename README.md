# 📸 위치 기반 포토 업로더

GPS 위치 정보와 함께 사진을 업로드하고 구글 지도에서 확인할 수 있는 모바일 웹 앱입니다.

## 📁 프로젝트 구조

```
keungkeung/
├── index.html          # 메인 HTML 파일 (구조만)
├── styles.css          # CSS 스타일시트
├── config.js           # 설정 및 상수
├── app.js              # 메인 JavaScript 로직
├── README.md          # 프로젝트 문서
└── vercel.json        # Vercel 배포 설정
```

## ✨ 주요 기능

### 📱 사진 업로드
- 📷 카메라로 직접 촬영
- 🖼️ 갤러리에서 파일 선택
- 🖱️ 드래그 앤 드롭 업로드
- 📏 파일 크기 및 형식 검증 (5MB 이하, JPG/PNG/GIF/WebP)

### 🗺️ 지도 기능
- 📍 GPS 기반 자동 위치 감지
- 🔴 업로드된 사진 위치에 마커 표시
- 🔵 현재 사용자 위치 표시
- 🖼️ 마커 클릭으로 사진 정보 확인
- 📱 마커 더블클릭으로 사진 바로 보기

### 🖼️ 사진 관리
- 📋 업로드된 사진 미리보기
- 🔍 사진 상세 정보 (파일명, 크기, 위치, 시간)
- 📥 개별 사진 다운로드
- 📍 위치 정보 공유
- 🗑️ 사진 삭제 기능

## 🚀 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **API**: Google Maps JavaScript API, Geolocation API
- **배포**: Vercel
- **디자인**: 반응형 웹 디자인, 모바일 최적화

## 🛠️ 설정 방법

### 1️⃣ Google Maps API 키 설정
`config.js` 파일에서 API 키를 수정하세요:

```javascript
const APP_CONFIG = {
    // Google Maps API 키
    GOOGLE_MAPS_API_KEY: 'YOUR_API_KEY_HERE',
    // ...
};
```

### 2️⃣ 앱 설정 커스터마이징
`config.js`에서 다양한 설정을 변경할 수 있습니다:

```javascript
const APP_CONFIG = {
    MAX_FILE_SIZE: 5 * 1024 * 1024,     // 최대 파일 크기
    DEFAULT_LOCATION: { lat: 37.5665, lng: 126.9780 }, // 기본 위치
    DEFAULT_ZOOM: 15,                    // 기본 지도 줌 레벨
    DEBUG_MODE: false                    // 디버그 모드
};
```

## 🎨 스타일 커스터마이징

`styles.css` 파일을 수정해서 디자인을 변경할 수 있습니다:

```css
/* 주요 색상 변경 */
.header {
    background: linear-gradient(135deg, #your-color1, #your-color2);
}

/* 버튼 스타일 변경 */
.btn-primary {
    background: linear-gradient(135deg, #your-color1, #your-color2);
}
```

## 💻 JavaScript 로직 수정

`app.js` 파일에서 앱의 핵심 로직을 수정할 수 있습니다:

```javascript
// 새 기능 모듈 추가
const NewFeature = {
    init() {
        DEV_TOOLS.log('새 기능 초기화');
    },
    
    someMethod() {
        // 기능 구현
    }
};
```

## 🔧 개발 가이드

### 디버그 모드 활성화
브라우저 콘솔에서 다음 명령어를 실행하세요:

```javascript
// 디버그 모드 활성화
enableDebugMode();

// 업로드된 파일 정보 확인
debugUploadedFiles();

// 디버그 모드 비활성화
disableDebugMode();
```

### 새 기능 추가하기
1. **JavaScript 모듈 추가**: `app.js`에서 새 모듈 객체 생성
2. **CSS 스타일 추가**: `styles.css`에서 해당 섹션에 스타일 추가
3. **설정 추가**: `config.js`에서 새 설정값 정의
4. **HTML 구조 수정**: 필요시 `index.html`에서 마크업 추가

### 파일별 역할
- **`index.html`**: HTML 구조와 접근성 마크업
- **`styles.css`**: 모든 CSS 스타일과 애니메이션
- **`config.js`**: 앱 설정, 상수, 메시지 텍스트
- **`app.js`**: 핵심 JavaScript 로직과 이벤트 처리

### 코드 구조
```javascript
// app.js에서 모듈 패턴 예시
const NewFeature = {
    init() {
        // 초기화 코드
        DEV_TOOLS.log('새 기능 초기화');
    },
    
    someMethod() {
        // 기능 구현
        DEV_TOOLS.log('새 기능 실행');
    }
};

// 전역 노출 (필요시)
window.NewFeature = NewFeature;
```

## 🚀 배포하기

### Vercel 배포
1. GitHub에 모든 파일 업로드
2. Vercel에서 GitHub 저장소 연결
3. 자동 배포 완료

### 로컬 개발 서버
모든 파일을 한 폴더에 넣고 로컬 서버를 실행하세요:

```bash
# 프로젝트 폴더 구조 확인
ls -la
# index.html, styles.css, config.js, app.js가 있어야 함

# Python 사용
python -m http.server 8000

# Node.js 사용
npx serve

# PHP 사용
php -S localhost:8000

# Live Server (VSCode 확장)
# 우클릭 → "Open with Live Server"
```

**주의사항**: 파일 시스템에서 직접 열면(`file://`) Google Maps API와 Geolocation이 작동하지 않습니다. 반드시 HTTP 서버를 사용하세요.

## 📱 사용법

### 기본 사용법
1. **위치 권한 허용**: 브라우저에서 위치 정보 접근 허용
2. **사진 업로드**: 카메라 촬영 또는 갤러리에서 선택
3. **지도 확인**: 지도 탭에서 업로드된 사진 위치 확인
4. **사진 보기**: 마커 클릭 → "사진 보기" 또는 더블클릭

### 고급 기능
- **일괄 업로드**: 여러 사진을 한 번에 드래그 앤 드롭
- **위치 공유**: 사진 팝업에서 "위치 공유" 버튼 클릭
- **사진 다운로드**: 사진 팝업에서 "다운로드" 버튼 클릭

## 🔍 문제 해결

### 지도가 로딩되지 않을 때
- Google Maps API 키 확인
- API 키에 Maps JavaScript API 활성화 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 위치 정보가 작동하지 않을 때
- HTTPS 환경에서 실행 (Vercel 자동 제공)
- 브라우저 위치 권한 허용 확인
- 개발자 도구에서 위치 정보 시뮬레이션 사용

### 사진이 업로드되지 않을 때
- 파일 크기 확인 (5MB 이하)
- 지원되는 형식 확인 (JPG, PNG, GIF, WebP)
- 브라우저 콘솔에서 오류 확인

## 🐛 디버깅

### 콘솔 명령어
```javascript
// 전체 상태 확인
debugUploadedFiles();

// 특정 배열 확인
console.log('Files:', uploadedFiles);
console.log('Markers:', markers);
console.log('User Location:', userLocation);

// 디버그 모드 활성화
enableDebugMode();
```

### 로그 확인
디버그 모드가 활성화되면 상세한 로그를 확인할 수 있습니다:
- 파일 업로드 과정
- 마커 생성 과정
- 위치 정보 획득 과정
- 사용자 인터랙션

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

- **Issues**: GitHub Issues에서 버그 리포트 및 기능 요청
- **Wiki**: 자세한 사용법은 Wiki 페이지 참조
- **Discussions**: 질문 및 토론은 GitHub Discussions 활용

---

**만든이**: keungkeung 팀  
**버전**: 1.0.0  
**마지막 업데이트**: 2024년
