// ===================== 애플리케이션 설정 =====================
const APP_CONFIG = {
    // 파일 업로드 관련 설정
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    
    // 지도 관련 설정
    DEFAULT_LOCATION: { 
        lat: 37.5665, 
        lng: 126.9780 
    }, // 서울시청
    
    RANDOM_OFFSET: 0.001, // 같은 위치에서 여러 사진 업로드 시 오프셋
    DEFAULT_ZOOM: 15,
    
    // Google Maps API 키
    GOOGLE_MAPS_API_KEY: 'AIzaSyBgn5XdaAN2yorZSRkGhIDdUq-Ie87NsaU',
    
    // UI 관련 설정
    ANIMATION_DURATION: 300, // ms
    SUCCESS_MESSAGE_DURATION: 3000, // ms
    BOUNCE_ANIMATION_DURATION: 700, // ms
    
    // 앱 정보
    APP_NAME: '위치 기반 포토 업로더',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: '사진을 업로드하고 지도에서 위치를 확인하세요',
    
    // 디버그 모드
    DEBUG_MODE: false // true로 설정하면 상세한 로그 출력
};

// ===================== 마커 아이콘 설정 =====================
const MARKER_ICONS = {
    // 사용자 위치 마커
    USER_LOCATION: {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4285F4">
                <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>`,
        size: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12)
    },
    
    // 사진 위치 마커
    PHOTO_LOCATION: {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#FF4757">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="3" fill="white"/>
                <text x="12" y="11" text-anchor="middle" font-size="8" fill="#FF4757">📷</text>
              </svg>`,
        size: new google.maps.Size(36, 36),
        anchor: new google.maps.Point(18, 36)
    }
};

// ===================== 지도 스타일 설정 =====================
const MAP_STYLES = [
    {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "transit",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
    }
];

// ===================== 메시지 텍스트 =====================
const MESSAGES = {
    LOCATION: {
        LOADING: '위치 정보를 가져오는 중...',
        ERROR: '위치 정보를 사용할 수 없습니다',
        UNSUPPORTED: '위치 정보를 지원하지 않는 브라우저입니다.'
    },
    
    UPLOAD: {
        SUCCESS: '✅ 사진이 성공적으로 업로드되었습니다!',
        INVALID_TYPE: '은(는) 이미지 파일이 아닙니다.',
        TOO_LARGE: '의 크기가 5MB를 초과합니다.',
        UPLOADING: '업로드 중...'
    },
    
    MAP: {
        LOADING: '🗺️ 지도를 로딩하는 중입니다...',
        HELP: `🗺️ 지도 사용법

📍 빨간 마커: 업로드된 사진 위치
🔵 파란 점: 내 현재 위치

📱 마커 조작법:
• 클릭: 사진 정보 보기
• 더블클릭: 사진 바로 보기
• 호버: 튕기는 애니메이션

🎛️ 컨트롤:
📍 내 위치로 이동
🖼️ 모든 사진이 보이도록 확대/축소
❓ 이 도움말 보기`
    },
    
    SHARE: {
        LOCATION_COPIED: '위치 링크가 클립보드에 복사되었습니다!',
        SHARE_TITLE: '사진 촬영 위치',
        SHARE_TEXT: '의 촬영 위치입니다.'
    }
};

// ===================== 개발자 도구 =====================
const DEV_TOOLS = {
    log: (message, data = null) => {
        if (APP_CONFIG.DEBUG_MODE) {
            console.log(`[${APP_CONFIG.APP_NAME}] ${message}`, data || '');
        }
    },
    
    error: (message, error = null) => {
        console.error(`[${APP_CONFIG.APP_NAME}] ERROR: ${message}`, error || '');
    },
    
    warn: (message, data = null) => {
        if (APP_CONFIG.DEBUG_MODE) {
            console.warn(`[${APP_CONFIG.APP_NAME}] WARNING: ${message}`, data || '');
        }
    }
};

// 전역으로 노출
window.APP_CONFIG = APP_CONFIG;
window.MARKER_ICONS = MARKER_ICONS;
window.MAP_STYLES = MAP_STYLES;
window.MESSAGES = MESSAGES;
window.DEV_TOOLS = DEV_TOOLS;
