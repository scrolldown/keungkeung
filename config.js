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
    APP_VERSION: '1.0.1',
    APP_DESCRIPTION: '사진을 업로드하고 지도에서 위치를 확인하세요',
    
    // 디버그 모드
    DEBUG_MODE: true // 임시로 true로 설정해서 디버깅
};

// ===================== 안전한 Base64 인코딩 함수 =====================
function safeBtoa(str) {
    try {
        // UTF-8 문자열을 안전하게 Base64로 인코딩
        return btoa(unescape(encodeURIComponent(str)));
    } catch (error) {
        console.error('Base64 encoding failed:', error);
        // 실패 시 URL 인코딩으로 대체
        return 'data:image/svg+xml,' + encodeURIComponent(str);
    }
}

// ===================== 마커 아이콘 설정 (수정됨) =====================
const MARKER_ICONS = {
    // 사용자 위치 마커 (이모지 제거, 안전한 SVG)
    USER_LOCATION: `data:image/svg+xml;base64,` + safeBtoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
    `),
    
    // 사진 위치 마커 (이모지를 도형으로 대체)
    PHOTO_LOCATION: `data:image/svg+xml;base64,` + safeBtoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#FF4757" stroke="white" stroke-width="2"/>
            <rect x="8" y="9" width="8" height="6" rx="1" fill="white"/>
            <circle cx="12" cy="12" r="1.5" fill="#FF4757"/>
        </svg>
    `)
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

// ===================== 개발자 도구 (수정됨) =====================
const DEV_TOOLS = {
    log: function(message, data) {
        if (APP_CONFIG && APP_CONFIG.DEBUG_MODE) {
            console.log(`[${APP_CONFIG.APP_NAME || 'APP'}] ${message}`, data || '');
        }
    },
    
    error: function(message, error) {
        console.error(`[${APP_CONFIG && APP_CONFIG.APP_NAME || 'APP'}] ERROR: ${message}`, error || '');
    },
    
    warn: function(message, data) {
        if (APP_CONFIG && APP_CONFIG.DEBUG_MODE) {
            console.warn(`[${APP_CONFIG.APP_NAME || 'APP'}] WARNING: ${message}`, data || '');
        }
    },
    
    // 안전한 초기화 확인
    isReady: function() {
        return typeof APP_CONFIG !== 'undefined' && typeof MESSAGES !== 'undefined';
    }
};

// 전역으로 노출
if (typeof window !== 'undefined') {
    // 기존 객체들 노출
    window.APP_CONFIG = APP_CONFIG;
    window.MARKER_ICONS = MARKER_ICONS;
    window.MAP_STYLES = MAP_STYLES;
    window.MESSAGES = MESSAGES;
    window.DEV_TOOLS = DEV_TOOLS;
    
    // 안전한 Base64 인코딩 함수도 전역으로 노출
    window.safeBtoa = safeBtoa;
    
    // 설정 로드 완료 알림
    console.log(`⚙️ ${APP_CONFIG.APP_NAME} v${APP_CONFIG.APP_VERSION} 설정 로드 완료`);
    
    // DEV_TOOLS 사용 가능 상태 확인
    if (DEV_TOOLS.isReady()) {
        DEV_TOOLS.log('DEV_TOOLS 초기화 완료');
    }
}
