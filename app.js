/* ==========================================================================
   위치 기반 포토 업로더 - 메인 JavaScript (수정됨)
   ========================================================================== */

"use strict";

/* ==========================================================================
   안전한 개발자 도구 래퍼
   ========================================================================== */
const SafeDevTools = {
    log: function(message, data) {
        if (typeof DEV_TOOLS !== 'undefined' && DEV_TOOLS.log) {
            DEV_TOOLS.log(message, data);
        } else {
            console.log(`[LOG] ${message}`, data || '');
        }
    },
    
    error: function(message, error) {
        if (typeof DEV_TOOLS !== 'undefined' && DEV_TOOLS.error) {
            DEV_TOOLS.error(message, error);
        } else {
            console.error(`[ERROR] ${message}`, error || '');
        }
    },
    
    warn: function(message, data) {
        if (typeof DEV_TOOLS !== 'undefined' && DEV_TOOLS.warn) {
            DEV_TOOLS.warn(message, data);
        } else {
            console.warn(`[WARN] ${message}`, data || '');
        }
    }
};

/* ==========================================================================
   전역 변수
   ========================================================================== */
let uploadedFiles = [];
let map = null;
let userLocation = null;
let markers = [];
let infoWindow = null;
let pendingMarkers = []; // 지도 로드 전 대기 중인 마커들

/* ==========================================================================
   위치 관리자 (LocationManager)
   ========================================================================== */
const LocationManager = {
    // 현재 위치 가져오기
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showLocationError(this.getLocationMessage('UNSUPPORTED'));
            return;
        }

        SafeDevTools.log('위치 정보 요청 시작');
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
        
        SafeDevTools.log('위치 정보 획득 성공', userLocation);
        this.updateLocationDisplay(userLocation);
        this.addUserLocationMarker(userLocation);
    },

    // 위치 정보 오류 콜백
    onLocationError(error) {
        SafeDevTools.error('위치 정보 오류', error);
        this.showLocationError(this.getLocationMessage('ERROR'));
    },

    // 안전한 메시지 가져오기
    getLocationMessage(key) {
        if (typeof MESSAGES !== 'undefined' && MESSAGES.LOCATION && MESSAGES.LOCATION[key]) {
            return MESSAGES.LOCATION[key];
        }
        // 기본 메시지 제공
        const defaultMessages = {
            'UNSUPPORTED': '위치 정보를 지원하지 않는 브라우저입니다.',
            'ERROR': '위치 정보를 사용할 수 없습니다',
            'LOADING': '위치 정보를 가져오는 중...'
        };
        return defaultMessages[key] || '위치 관련 오류가 발생했습니다.';
    },

    // 위치 정보 화면에 표시
    updateLocationDisplay(location) {
        const locationInfo = document.getElementById('locationInfo');
        const currentLocationSpan = document.getElementById('currentLocation');
        
        if (currentLocationSpan) {
            currentLocationSpan.textContent = `위도: ${location.lat.toFixed(6)}, 경도: ${location.lng.toFixed(6)}`;
        }
        if (locationInfo) {
            locationInfo.classList.add('active');
        }
        SafeDevTools.log('위치 정보 UI 업데이트 완료');
    },

    // 위치 오류 메시지 표시
    showLocationError(message) {
        const currentLocationSpan = document.getElementById('currentLocation');
        if (currentLocationSpan) {
            currentLocationSpan.textContent = message;
        }
        SafeDevTools.warn('위치 오류 메시지 표시', message);
    },

    // 사용자 위치 마커 추가
    addUserLocationMarker(location) {
        if (!map) {
            SafeDevTools.warn('지도가 아직 초기화되지 않음 - 사용자 위치 마커 대기');
            return;
        }

        map.setCenter(location);
        
        // 안전한 마커 아이콘 가져오기
        const userIcon = this.getSafeUserLocationIcon();
        
        const userMarker = new google.maps.Marker({
            position: location,
            map: map,
            icon: userIcon,
            title: "내 현재 위치",
            zIndex: 1000
        });
        
        SafeDevTools.log('사용자 위치 마커 생성 완료', location);
    },

    // 안전한 사용자 위치 아이콘 가져오기
    getSafeUserLocationIcon() {
        if (typeof MARKER_ICONS !== 'undefined' && MARKER_ICONS.USER_LOCATION) {
            return {
                url: MARKER_ICONS.USER_LOCATION,
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 12)
            };
        } else {
            // 기본 파란색 점 아이콘
            return {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
                scale: 8
            };
        }
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
        if (tabName === 'map') {
            if (!map && typeof google !== 'undefined' && google.maps) {
                DEV_TOOLS.log('지도 탭 활성화 - 지도 초기화 시작');
                MapController.init();
            } else if (map) {
                // 지도가 이미 있다면 대기 중인 마커들 확인
                MapController.processPendingMarkers();
            }
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
        
        DEV_TOOLS.log('지도 객체 생성 완료');
        
        // 사용자 위치 마커 추가 (위치 정보가 있다면)
        if (userLocation) {
            LocationManager.addUserLocationMarker(userLocation);
        } else {
            LocationManager.getCurrentLocation();
        }
        
        // 대기 중인 마커들 처리
        this.processPendingMarkers();
        
        DEV_TOOLS.log('지도 초기화 완료');
    },

    // 대기 중인 마커들 처리
    processPendingMarkers() {
        if (!map || pendingMarkers.length === 0) {
            DEV_TOOLS.log('처리할 대기 마커 없음', {map: !!map, pendingCount: pendingMarkers.length});
            return;
        }
        
        DEV_TOOLS.log(`대기 중인 마커 ${pendingMarkers.length}개 처리 시작`);
        
        pendingMarkers.forEach(markerData => {
            this.createMarkerOnMap(markerData.file, markerData.location);
        });
        
        // 처리 완료 후 대기 배열 초기화
        pendingMarkers = [];
        DEV_TOOLS.log('모든 대기 마커 처리 완료');
    },

    // 내 위치로 이동
    centerMap() {
        if (map && userLocation) {
            map.setCenter(userLocation);
            map.setZoom(APP_CONFIG.DEFAULT_ZOOM);
            DEV_TOOLS.log('지도 중심을 사용자 위치로 이동');
        } else {
            DEV_TOOLS.warn('지도 또는 사용자 위치 없음', {map: !!map, userLocation: !!userLocation});
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
            DEV_TOOLS.warn('표시할 사진이 없거나 지도가 없음', {map: !!map, markerCount: markers.length});
            alert('지도를 먼저 로드하거나 사진을 업로드해주세요.');
        }
    },

    // 도움말 표시
    showHelp() {
        alert(MESSAGES.MAP.HELP);
    },

    // 사진 마커 추가 (공용 인터페이스)
    addPhotoMarker(file, location) {
        DEV_TOOLS.log(`마커 추가 요청: ${file.name}`, location);
        
        if (!map) {
            // 지도가 없으면 대기 배열에 추가
            pendingMarkers.push({ file, location });
            DEV_TOOLS.log('지도 미초기화 - 마커를 대기 배열에 추가', {pendingCount: pendingMarkers.length});
            return;
        }
        
        // 지도가 있으면 즉시 생성
        this.createMarkerOnMap(file, location);
    },

    // 실제 지도에 마커 생성
    createMarkerOnMap(file, location) {
        if (!map) {
            DEV_TOOLS.error('지도 없음 - 마커 생성 불가');
            return;
        }

        DEV_TOOLS.log(`지도에 마커 생성: ${file.name}`, location);

        const marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: {
                url: MARKER_ICONS.PHOTO_LOCATION,
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            },
            title: file.name,
            animation: google.maps.Animation.DROP,
            zIndex: 100
        });

        // 마커 이벤트 등록
        this.addMarkerEvents(marker, file, location);
        markers.push(marker);
        
        DEV_TOOLS.log(`마커 생성 완료. 총 마커 수: ${markers.length}`);
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
        
        DEV_TOOLS.log('파일 업로더 이벤트 리스너 설정 완료');
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
        DEV_TOOLS.log(`드롭된 파일 수: ${files.length}`);
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
        DEV_TOOLS.log(`선택된 파일 수: ${files.length}`);
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
        DEV_TOOLS.log(`파일 처리 시작: ${files.length}개 파일`);
        
        if (!userLocation) {
            DEV_TOOLS.log('사용자 위치 없음 - 위치 정보 요청');
            LocationManager.getCurrentLocation();
            setTimeout(() => this.handleFiles(files), 1000);
            return;
        }

        const validFiles = this.validateFiles(files);
        if (validFiles.length > 0) {
            DEV_TOOLS.log(`유효한 파일 ${validFiles.length}개 - 업로드 시작`);
            this.simulateUpload(validFiles);
        }
    },

    // 파일 유효성 검사
    validateFiles(files) {
        return files.filter(file => {
            if (!file.type.startsWith('image/')) {
                alert(`${file.name}${MESSAGES.UPLOAD.INVALID_TYPE}`);
                DEV_TOOLS.warn(`잘못된 파일 형식: ${file.name} (${file.type})`);
                return false;
            }
            if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
                alert(`${file.name}${MESSAGES.UPLOAD.TOO_LARGE}`);
                DEV_TOOLS.warn(`파일 크기 초과: ${file.name} (${file.size} bytes)`);
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
        
        DEV_TOOLS.log('업로드 시뮬레이션 시작');
        
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                setTimeout(() => {
                    progressElement.style.display = 'none';
                    this.processFiles(files);
                    UIManager.showSuccessMessage();
                    DEV_TOOLS.log('업로드 시뮬레이션 완료');
                }, 500);
            }
            
            progressFill.style.width = progress + '%';
            progressText.textContent = `${MESSAGES.UPLOAD.UPLOADING} ${Math.round(progress)}%`;
        }, 200);
    },

    // 파일 처리 및 미리보기 생성
    processFiles(files) {
        DEV_TOOLS.log(`파일 처리 시작: ${files.length}개`, files.map(f => f.name));
        
        files.forEach(file => {
            const fileId = Date.now() + Math.random();
            const location = this.generateLocation();
            
            const fileData = { id: fileId, file, location };
            uploadedFiles.push(fileData);
            
            DEV_TOOLS.log(`파일 데이터 추가: ${file.name}`, {id: fileId, location});
            
            // 지도에 마커 추가 (지도가 없으면 대기 배열에 추가됨)
            MapController.addPhotoMarker(file, location);
            
            // 미리보기 생성
            this.createPreview(fileId, file, location);
        });
        
        DEV_TOOLS.log(`파일 처리 완료. 총 파일 수: ${uploadedFiles.length}, 총 마커 수: ${markers.length}, 대기 마커 수: ${pendingMarkers.length}`);
    },

    // 위치 생성 (약간의 오프셋 추가)
    generateLocation() {
        const location = userLocation ? {...userLocation} : {...APP_CONFIG.DEFAULT_LOCATION};
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
            const removedFile = uploadedFiles[fileIndex];
            
            // 마커 제거
            const markerIndex = markers.findIndex(marker => marker.getTitle() === removedFile.file.name);
            if (markerIndex !== -1) {
                markers[markerIndex].setMap(null);
                markers.splice(markerIndex, 1);
                DEV_TOOLS.log(`마커 제거 완료: ${removedFile.file.name}`);
            }
            
            // 대기 중인 마커에서도 제거
            const pendingIndex = pendingMarkers.findIndex(p => p.file.name === removedFile.file.name);
            if (pendingIndex !== -1) {
                pendingMarkers.splice(pendingIndex, 1);
                DEV_TOOLS.log(`대기 마커에서 제거: ${removedFile.file.name}`);
            }
            
            // 파일 데이터 제거
            uploadedFiles.splice(fileIndex, 1);
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
        
        DEV_TOOLS.log(`파일 제거 완료. 남은 파일: ${uploadedFiles.length}개, 마커: ${markers.length}개`);
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
            DEV_TOOLS.log(`파일명으로 팝업 표시: ${fileName}`);
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
            DEV_TOOLS.log('팝업 표시 완료');
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
   앱 초기화 및 이벤트 리스너 (수정됨)
   ========================================================================== */

// 안전한 설정 확인 함수
function checkAppConfig() {
    if (typeof APP_CONFIG === 'undefined') {
        console.error('❌ APP_CONFIG가 로드되지 않았습니다.');
        // 기본 설정 생성
        window.APP_CONFIG = {
            DEBUG_MODE: true,
            MAX_FILE_SIZE: 5 * 1024 * 1024,
            DEFAULT_LOCATION: { lat: 37.5665, lng: 126.9780 },
            DEFAULT_ZOOM: 15,
            APP_NAME: '위치 기반 포토 업로더',
            APP_VERSION: '1.0.1'
        };
        console.log('⚠️ 기본 APP_CONFIG 생성됨');
    }
    
    if (typeof DEV_TOOLS === 'undefined') {
        console.error('❌ DEV_TOOLS가 로드되지 않았습니다.');
        // 기본 DEV_TOOLS 생성
        window.DEV_TOOLS = {
            log: (msg, data) => console.log(`[LOG] ${msg}`, data || ''),
            error: (msg, error) => console.error(`[ERROR] ${msg}`, error || ''),
            warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
            isReady: () => true
        };
        console.log('⚠️ 기본 DEV_TOOLS 생성됨');
    }
    
    if (typeof MESSAGES === 'undefined') {
        console.error('❌ MESSAGES가 로드되지 않았습니다.');
        // 기본 메시지 생성
        window.MESSAGES = {
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
            }
        };
        console.log('⚠️ 기본 MESSAGES 생성됨');
    }
}

// 앱 초기화 함수 (수정됨 - 682번째 줄 근처)
function initializeApp() {
    // 설정 확인 및 기본값 생성
    checkAppConfig();
    
    SafeDevTools.log('앱 초기화 시작');
    
    try {
        // 전역 함수 노출 (HTML onclick 이벤트용)
        window.removeFileById = (fileId) => {
            if (typeof FileUploader !== 'undefined') {
                FileUploader.removeFile(fileId);
            } else {
                SafeDevTools.error('FileUploader가 로드되지 않음');
            }
        };

        window.showPhotoFromMarker = (fileName) => {
            if (typeof PhotoPopup !== 'undefined') {
                PhotoPopup.showByFileName(fileName);
            } else {
                SafeDevTools.error('PhotoPopup이 로드되지 않음');
            }
        };

        // 모듈들 전역 노출 (나중에 정의될 예정)
        if (typeof TabManager !== 'undefined') window.TabManager = TabManager;
        if (typeof MapController !== 'undefined') window.MapController = MapController;
        if (typeof FileUploader !== 'undefined') window.FileUploader = FileUploader;
        if (typeof PhotoPopup !== 'undefined') window.PhotoPopup = PhotoPopup;

        // 초기화 완료 후 LocationManager 시작
        LocationManager.getCurrentLocation();
        
        SafeDevTools.log(`${APP_CONFIG.APP_NAME} v${APP_CONFIG.APP_VERSION} 초기화 완료`);
        
    } catch (error) {
        SafeDevTools.error('앱 초기화 중 오류 발생', error);
    }
}

// DOM 로드 확인 및 초기화 (수정됨 - 817번째 줄 근처)
function startApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        // config.js 로드 확인
        let configCheckCount = 0;
        const maxConfigChecks = 50; // 5초 대기
        
        const configCheckInterval = setInterval(() => {
            configCheckCount++;
            
            if (typeof APP_CONFIG !== 'undefined' || configCheckCount >= maxConfigChecks) {
                clearInterval(configCheckInterval);
                
                if (configCheckCount >= maxConfigChecks) {
                    console.warn('⚠️ config.js 로드 대기 시간 초과 - 기본 설정으로 시작');
                }
                
                initializeApp();
            }
        }, 100);
    }
}

// 전역 에러 핸들러
window.addEventListener('error', function(event) {
    SafeDevTools.error('전역 에러 발생', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// 앱 시작
startApp();

// ESC 키로 팝업 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (typeof PhotoPopup !== 'undefined') {
            PhotoPopup.close();
        }
    }
});
