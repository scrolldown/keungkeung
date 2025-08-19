/* ==========================================================================
   위치 기반 포토 업로더 - 메인 JavaScript
   ========================================================================== */

"use strict";

/* ==========================================================================
   전역 변수
   ========================================================================== */
let uploadedFiles = [];
let map = null;
let userLocation = null;
let markers = [];
let infoWindow = null;

/* ==========================================================================
   위치 관리자 (LocationManager)
   ========================================================================== */
const LocationManager = {
    // 현재 위치 가져오기
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showLocationError(MESSAGES.LOCATION.UNSUPPORTED);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            this.onLocationSuccess.bind(this),
            this.onLocationError.bind(this)
        );
    },

    // 위치 정보 성공 콜백
    onLocationSuccess(position) {
        userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        DEV_TOOLS.log('위치 정보 획득 성공', userLocation);
        this.updateLocationDisplay(userLocation);
        this.addUserLocationMarker(userLocation);
    },

    // 위치 정보 오류 콜백
    onLocationError(error) {
        DEV_TOOLS.error('위치 정보 오류', error);
        this.showLocationError(MESSAGES.LOCATION.ERROR);
    },

    // 위치 정보 화면에 표시
    updateLocationDisplay(location) {
        const locationInfo = document.getElementById('locationInfo');
        const currentLocationSpan = document.getElementById('currentLocation');
        
        currentLocationSpan.textContent = `위도: ${location.lat.toFixed(6)}, 경도: ${location.lng.toFixed(6)}`;
        locationInfo.classList.add('active');
    },

    // 위치 오류 메시지 표시
    showLocationError(message) {
        document.getElementById('currentLocation').textContent = message;
    },

    // 사용자 위치 마커 추가
    addUserLocationMarker(location) {
        if (!map) return;

        map.setCenter(location);
        
        new google.maps.Marker({
            position: location,
            map: map,
            icon: {
                url: 'data:image/svg+xml;base64,' + btoa(MARKER_ICONS.USER_LOCATION.svg),
                scaledSize: MARKER_ICONS.USER_LOCATION.size,
                anchor: MARKER_ICONS.USER_LOCATION.anchor
            },
            title: "내 현재 위치"
        });
    }
};

/* ==========================================================================
   탭 관리자 (TabManager)
   ========================================================================== */
const TabManager = {
    // 탭 전환
    showTab(tabName) {
        const tabs = document.querySelectorAll('.tab');
        const contents = document.querySelectorAll('.tab-content');
        
        // 모든 탭 비활성화
        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));
        
        // 선택된 탭 활성화
        document.querySelector(`[onclick="TabManager.showTab('${tabName}')"]`).classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        DEV_TOOLS.log(`탭 전환: ${tabName}`);
        
        // 지도 탭일 때 지도 초기화
        if (tabName === 'map' && !map) {
            setTimeout(() => {
                if (typeof google !== 'undefined' && google.maps) {
                    MapController.init();
                }
            }, 100);
        }
    }
};

/* ==========================================================================
   지도 컨트롤러 (MapController)
   ========================================================================== */
const MapController = {
    // 지도 초기화
    init() {
        DEV_TOOLS.log('지도 초기화 시작');
        
        document.getElementById('mapLoading').style.display = 'none';
        document.getElementById('mapControls').style.display = 'flex';

        map = new google.maps.Map(document.getElementById('map'), {
            zoom: APP_CONFIG.DEFAULT_ZOOM,
            center: APP_CONFIG.DEFAULT_LOCATION,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            styles: MAP_STYLES
        });

        infoWindow = new google.maps.InfoWindow();
        LocationManager.getCurrentLocation();
        
        DEV_TOOLS.log('지도 초기화 완료');
    },

    // 내 위치로 이동
    centerMap() {
        if (map && userLocation) {
            map.setCenter(userLocation);
            map.setZoom(APP_CONFIG.DEFAULT_ZOOM);
            DEV_TOOLS.log('지도 중심을 사용자 위치로 이동');
        }
    },

    // 모든 사진이 보이도록 지도 조정
    showAllPhotos() {
        if (map && markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(marker => bounds.extend(marker.getPosition()));
            map.fitBounds(bounds);
            DEV_TOOLS.log(`모든 사진 표시 (${markers.length}개 마커)`);
        } else {
            DEV_TOOLS.warn('표시할 사진이 없습니다');
        }
    },

    // 도움말 표시
    showHelp() {
        alert(MESSAGES.MAP.HELP);
    },

    // 사진 마커 추가
    addPhotoMarker(file, location) {
        DEV_TOOLS.log(`마커 추가: ${file.name}`, location);
        
        if (!map) {
            DEV_TOOLS.error('지도가 초기화되지 않음');
            return;
        }

        const marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: {
                url: 'data:image/svg+xml;base64,' + btoa(MARKER_ICONS.PHOTO_LOCATION.svg),
                scaledSize: MARKER_ICONS.PHOTO_LOCATION.size,
                anchor: MARKER_ICONS.PHOTO_LOCATION.anchor
            },
            title: file.name,
            animation: google.maps.Animation.DROP
        });

        // 마커 이벤트 등록
        this.addMarkerEvents(marker, file, location);
        markers.push(marker);
        
        DEV_TOOLS.log(`마커 배열에 추가. 총 마커 수: ${markers.length}`);
    },

    // 마커 이벤트 등록
    addMarkerEvents(marker, file, location) {
        // 클릭 - 정보창 표시
        marker.addListener('click', () => {
            const infoContent = `
                <div class="marker-info-window">
                    <div class="marker-info-title">${file.name}</div>
                    <div class="marker-info-location">📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
                    <button class="marker-info-btn" onclick="showPhotoFromMarker('${file.name}')">
                        🖼️ 사진 보기
                    </button>
                </div>
            `;
            
            infoWindow.setContent(infoContent);
            infoWindow.open(map, marker);
            DEV_TOOLS.log(`마커 클릭: ${file.name}`);
        });

        // 더블클릭 - 바로 사진 팝업
        marker.addListener('dblclick', () => {
            PhotoPopup.showByFileName(file.name);
            DEV_TOOLS.log(`마커 더블클릭: ${file.name}`);
        });

        // 호버 - 바운스 애니메이션
        marker.addListener('mouseover', () => {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), APP_CONFIG.BOUNCE_ANIMATION_DURATION);
        });
    }
};

/* ==========================================================================
   파일 업로더 (FileUploader)
   ========================================================================== */
const FileUploader = {
    // 초기화
    init() {
        this.setupEventListeners();
        DEV_TOOLS.log('파일 업로더 초기화 완료');
    },

    // 이벤트 리스너 설정
    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const cameraInput = document.getElementById('cameraInput');

        // 드래그 앤 드롭 이벤트
        uploadArea.addEventListener('dragover', this.onDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.onDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.onDrop.bind(this));
        uploadArea.addEventListener('click', this.onAreaClick.bind(this));

        // 파일 선택 이벤트
        fileInput.addEventListener('change', this.onFileSelect.bind(this));
        cameraInput.addEventListener('change', this.onFileSelect.bind(this));
    },

    // 드래그 오버 이벤트
    onDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    },

    // 드래그 리브 이벤트
    onDragLeave() {
        document.getElementById('uploadArea').classList.remove('dragover');
    },

    // 드롭 이벤트
    onDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
    },

    // 영역 클릭 이벤트
    onAreaClick(e) {
        if (!e.target.classList.contains('btn')) {
            document.getElementById('fileInput').click();
        }
    },

    // 파일 선택 이벤트
    onFileSelect(e) {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
    },

    // 카메라 열기
    openCamera() {
        document.getElementById('cameraInput').click();
        DEV_TOOLS.log('카메라 열기');
    },

    // 갤러리 열기
    openGallery() {
        document.getElementById('fileInput').click();
        DEV_TOOLS.log('갤러리 열기');
    },

    // 파일 처리
    handleFiles(files) {
        if (!userLocation) {
            LocationManager.getCurrentLocation();
            setTimeout(() => this.handleFiles(files), 1000);
            return;
        }

        const validFiles = this.validateFiles(files);
        if (validFiles.length > 0) {
            this.simulateUpload(validFiles);
        }
    },

    // 파일 유효성 검사
    validateFiles(files) {
        return files.filter(file => {
            if (!file.type.startsWith('image/')) {
                alert(`${file.name}${MESSAGES.UPLOAD.INVALID_TYPE}`);
                return false;
            }
            if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
                alert(`${file.name}${MESSAGES.UPLOAD.TOO_LARGE}`);
                return false;
            }
            return true;
        });
    },

    // 업로드 시뮬레이션
    simulateUpload(files) {
        const progressElement = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressElement.style.display = 'block';
        let progress = 0;
        
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                setTimeout(() => {
                    progressElement.style.display = 'none';
                    this.processFiles(files);
                    UIManager.showSuccessMessage();
                }, 500);
            }
            
            progressFill.style.width = progress + '%';
            progressText.textContent = `${MESSAGES.UPLOAD.UPLOADING} ${Math.round(progress)}%`;
        }, 200);
    },

    // 파일 처리 및 미리보기 생성
    processFiles(files) {
        DEV_TOOLS.log(`파일 처리 시작: ${files.length}개`, files);
        
        files.forEach(file => {
            const fileId = Date.now() + Math.random();
            const location = this.generateLocation();
            
            const fileData = { id: fileId, file, location };
            uploadedFiles.push(fileData);
            
            DEV_TOOLS.log(`파일 데이터 추가`, fileData);
            
            // 지도에 마커 추가
            MapController.addPhotoMarker(file, location);
            
            // 미리보기 생성
            this.createPreview(fileId, file, location);
        });
        
        DEV_TOOLS.log(`파일 처리 완료. 총 파일 수: ${uploadedFiles.length}`);
    },

    // 위치 생성 (약간의 오프셋 추가)
    generateLocation() {
        const location = userLocation ? {...userLocation} : APP_CONFIG.DEFAULT_LOCATION;
        location.lat += (Math.random() - 0.5) * APP_CONFIG.RANDOM_OFFSET;
        location.lng += (Math.random() - 0.5) * APP_CONFIG.RANDOM_OFFSET;
        return location;
    },

    // 미리보기 생성
    createPreview(fileId, file, location) {
        DEV_TOOLS.log(`미리보기 생성: ${file.name} (ID: ${fileId})`);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = UIManager.createPreviewItem(fileId, file, location, e.target.result);
            const previewArea = document.getElementById('previewArea');
            previewArea.appendChild(previewItem);
            DEV_TOOLS.log('미리보기 DOM에 추가 완료');
        };
        reader.onerror = (e) => {
            DEV_TOOLS.error('파일 읽기 오류', e);
        };
        reader.readAsDataURL(file);
    },

    // 파일 제거
    removeFile(fileId) {
        DEV_TOOLS.log(`파일 제거 시도: ID ${fileId}`);
        
        const fileIndex = uploadedFiles.findIndex(f => f.id === fileId);
        
        if (fileIndex !== -1) {
            // 마커 제거
            if (markers[fileIndex]) {
                markers[fileIndex].setMap(null);
                markers.splice(fileIndex, 1);
                DEV_TOOLS.log(`마커 제거 완료: 인덱스 ${fileIndex}`);
            }
            
            // 파일 데이터 제거
            const removedFile = uploadedFiles.splice(fileIndex, 1)[0];
            DEV_TOOLS.log('파일 데이터 제거 완료', removedFile);
        }
        
        // 미리보기 제거
        const previewItems = document.getElementById('previewArea').children;
        for (let i = 0; i < previewItems.length; i++) {
            const removeBtn = previewItems[i].querySelector('.remove-btn');
            if (removeBtn && removeBtn.getAttribute('onclick').includes(fileId)) {
                previewItems[i].remove();
                DEV_TOOLS.log(`미리보기 제거 완료: 인덱스 ${i}`);
                break;
            }
        }
    }
};

/* ==========================================================================
   사진 팝업 (PhotoPopup)
   ========================================================================== */
const PhotoPopup = {
    // 파일명으로 팝업 표시
    showByFileName(fileName) {
        const fileData = uploadedFiles.find(f => f.file.name === fileName);
        if (fileData) {
            this.show(fileData.file, fileData.location);
        } else {
            DEV_TOOLS.error(`파일을 찾을 수 없음: ${fileName}`);
        }
    },

    // 팝업 표시
    show(file, location) {
        let fileData;
        
        // 파일 객체로 데이터 찾기
        if (typeof file === 'object') {
            fileData = uploadedFiles.find(f => f.file.name === file.name);
        } else {
            // 파일명으로 데이터 찾기
            fileData = uploadedFiles.find(f => f.file.name === file);
        }
        
        if (!fileData) {
            DEV_TOOLS.error('파일 데이터를 찾을 수 없음', file);
            return;
        }

        DEV_TOOLS.log(`사진 팝업 표시: ${fileData.file.name}`);

        // UI 요소 가져오기
        const popup = document.getElementById('photoPopup');
        const overlay = document.getElementById('photoPopupOverlay');
        const image = document.getElementById('popupImage');
        const title = document.getElementById('popupTitle');
        const size = document.getElementById('popupSize');
        const locationText = document.getElementById('popupLocation');
        const timeText = document.getElementById('popupTime');

        // 정보창 닫기
        if (infoWindow) infoWindow.close();

        // 이미지 읽기 및 표시
        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target.result;
            title.textContent = fileData.file.name;
            size.textContent = `크기: ${Utils.formatFileSize(fileData.file.size)}`;
            locationText.textContent = `위도: ${fileData.location.lat.toFixed(6)}, 경도: ${fileData.location.lng.toFixed(6)}`;
            timeText.textContent = `업로드: ${new Date().toLocaleString('ko-KR')}`;
            
            // 현재 데이터 저장
            window.currentPhotoData = {
                file: fileData.file,
                location: fileData.location,
                dataUrl: e.target.result
            };
            
            // 팝업 표시
            overlay.style.display = 'block';
            popup.style.display = 'block';
        };
        reader.readAsDataURL(fileData.file);
    },

    // 팝업 닫기
    close() {
        document.getElementById('photoPopup').style.display = 'none';
        document.getElementById('photoPopupOverlay').style.display = 'none';
        window.currentPhotoData = null;
        DEV_TOOLS.log('사진 팝업 닫기');
    },

    // 사진 다운로드
    downloadPhoto() {
        if (!window.currentPhotoData) return;
        
        const link = document.createElement('a');
        link.href = window.currentPhotoData.dataUrl;
        link.download = window.currentPhotoData.file.name;
        link.click();
        DEV_TOOLS.log(`사진 다운로드: ${window.currentPhotoData.file.name}`);
    },

    // 위치 공유
    shareLocation() {
        if (!window.currentPhotoData) return;
        
        const location = window.currentPhotoData.location;
        const googleMapsUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
        
        if (navigator.share) {
            navigator.share({
                title: MESSAGES.SHARE.SHARE_TITLE,
                text: `${window.currentPhotoData.file.name}${MESSAGES.SHARE.SHARE_TEXT}`,
                url: googleMapsUrl
            });
        } else {
            navigator.clipboard.writeText(googleMapsUrl).then(() => {
                alert(MESSAGES.SHARE.LOCATION_COPIED);
            });
        }
        DEV_TOOLS.log('위치 공유 실행');
    }
};

/* ==========================================================================
   UI 관리자 (UIManager)
   ========================================================================== */
const UIManager = {
    // 성공 메시지 표시
    showSuccessMessage() {
        const successMessage = document.getElementById('successMessage');
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, APP_CONFIG.SUCCESS_MESSAGE_DURATION);
    },

    // 미리보기 아이템 생성
    createPreviewItem(fileId, file, location, imageSrc) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${imageSrc}" alt="${file.name}" class="preview-img" onclick="PhotoPopup.showByFileName('${file.name}')">
            <div class="preview-info">
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${Utils.formatFileSize(file.size)}</div>
                    <div class="file-location">📍 위도: ${location.lat.toFixed(6)}, 경도: ${location.lng.toFixed(6)}</div>
                </div>
                <button class="remove-btn" onclick="removeFileById(${fileId})" title="삭제">×</button>
            </div>
        `;
        return item;
    }
};

/* ==========================================================================
   유틸리티 함수 (Utils)
   ========================================================================== */
const Utils = {
    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

/* ==========================================================================
   앱 초기화 및 이벤트 리스너
   ========================================================================== */

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // config.js가 로드되었는지 확인
    if (typeof APP_CONFIG === 'undefined') {
        console.error('config.js가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        return;
    }
    
    LocationManager.getCurrentLocation();
    FileUploader.init();
    DEV_TOOLS.log(`${APP_CONFIG.APP_NAME} v${APP_CONFIG.APP_VERSION} 초기화 완료`);
});

// ESC 키로 팝업 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        PhotoPopup.close();
    }
});

/* ==========================================================================
   전역 함수 노출 (HTML onclick 이벤트용)
   ========================================================================== */
window.removeFileById = (fileId) => {
    FileUploader.removeFile(fileId);
};

window.showPhotoFromMarker = (fileName) => {
    PhotoPopup.showByFileName(fileName);
};

// 탭 관리자 전역 노출
window.TabManager = TabManager;
window.MapController = MapController;
window.FileUploader = FileUploader;
window.PhotoPopup = PhotoPopup;

/* ==========================================================================
   디버깅 함수들
   ========================================================================== */
window.debugUploadedFiles = () => {
    console.log('=== 📊 디버그 정보 ===');
    console.log('📁 업로드된 파일:', uploadedFiles);
    console.log('📍 마커 배열:', markers);
    console.log('🌍 사용자 위치:', userLocation);
    console.log('🗺️ 지도 객체:', map);
    console.log('⚙️ 앱 설정:', APP_CONFIG);
    console.log('==================');
};

window.enableDebugMode = () => {
    APP_CONFIG.DEBUG_MODE = true;
    console.log('🔧 디버그 모드가 활성화되었습니다.');
    console.log('상세한 로그를 확인하려면 debugUploadedFiles()를 실행하세요.');
};

window.disableDebugMode = () => {
    APP_CONFIG.DEBUG_MODE = false;
    console.log('🔧 디버그 모드가 비활성화되었습니다.');
};

window.clearAllFiles = () => {
    if (confirm('모든 업로드된 파일을 삭제하시겠습니까?')) {
        // 모든 마커 제거
        markers.forEach(marker => marker.setMap(null));
        markers = [];
        
        // 파일 데이터 초기화
        uploadedFiles = [];
        
        // 미리보기 영역 초기화
        document.getElementById('previewArea').innerHTML = '';
        
        DEV_TOOLS.log('모든 파일이 삭제되었습니다');
        console.log('✅ 모든 파일이 삭제되었습니다.');
    }
};

// 개발자 콘솔 도우미 메시지
console.log(`
🚀 ${APP_CONFIG.APP_NAME} v${APP_CONFIG.APP_VERSION}

📋 사용 가능한 디버그 명령어:
• debugUploadedFiles() - 현재 상태 확인
• enableDebugMode() - 디버그 모드 활성화
• disableDebugMode() - 디버그 모드 비활성화
• clearAllFiles() - 모든 파일 삭제

🔧 개발자 정보:
• GitHub: keungkeung
• 배포: Vercel (https://keungkeung.vercel.app)
`);

/* ==========================================================================
   Google Maps API 콜백 함수
   ========================================================================== */
window.initGoogleMaps = () => {
    // Google Maps API가 로드된 후 호출되는 콜백
    if (typeof google !== 'undefined' && google.maps) {
        DEV_TOOLS.log('Google Maps API 로드 완료');
        // 지도 탭이 활성화되어 있다면 즉시 초기화
        if (document.getElementById('mapTab').classList.contains('active')) {
            MapController.init();
        }
    } else {
        DEV_TOOLS.error('Google Maps API 로드 실패');
    }
};
