# 개발·운영 안내

## 구조

```
src/parts/        앱 소스 조각 (src/manifest.json 순서대로 이어 붙여 하나의 HTML 로 만듦)
web/              PWA 정적 파일: manifest.webmanifest, sw.js(서비스 워커 템플릿), icons/
scripts/          build.mjs(빌드), serve.mjs(미리보기), release.mjs(배포 압축), make-icons.mjs(아이콘 생성)
tests/            자동 테스트
site/             빌드 결과물 (git 에 넣지 않음) = 호스팅에 올리는 폴더
docs/             문서
```

## 자주 쓰는 명령

```bash
npm install          # 처음 한 번 (테스트용 playwright)
npm run build        # site/ 생성 (index.html + PWA 파일)
npm run serve        # http://localhost:8080 에서 미리보기 (서비스 워커·설치 확인 가능)
npm test             # 빌드 + 전체 테스트
npm run release      # 테스트 → dist/pen-ink-lab-vX.Y.Z.zip (배포 압축파일)
npm run icons        # 아이콘 다시 만들기 (scripts/make-icons.mjs 를 고쳤을 때만)
```

- 버전은 `package.json` 의 `version`. 서비스 워커의 캐시 이름에는 앱 내용의 해시가 들어가서, 앱이 바뀌면 사용자 기기에서 자동으로 새 버전으로 교체돼요.
- 테스트를 직접 돌릴 때는 먼저 `npm run build` 를 하세요(오래된 빌드면 테스트가 알려 줍니다).

## 테스트가 보증하는 것

| 파일 | 내용 |
|---|---|
| `engine.test.cjs` | 추천 점수 규칙, 동점 처리, 전용 잉크 가점 + 통합 전후 동일성(골든) |
| `patches.test.cjs` | 화면 동작·계산된 스타일이 옛 버전(통합 전)과 같은지 |
| `ui.test.cjs` | 30초 시작, 검색 자동완성, 잉크 교체 3탭, 용어 풀이 |
| `local.test.cjs` | 저장 유지, 저장 불가 처리, 백업 알림, **백업→복원 라운드트립**, iPhone/Android 안내, 영구 저장, 외부 요청 없음 |
| `export.test.cjs` | **엑셀 파일을 openpyxl·LibreOffice 로 열어 값 대조**, 인쇄 화면·PDF 글자 |
| `pwa.test.cjs` | 매니페스트·아이콘, 서비스 워커, **오프라인 사용**, 새 버전 교체 |
| `photos.test.cjs` | 앨범·카메라 사진 저장·표시·정리, **사진 포함 zip 백업→복원**, 손상 zip 거절, 저장소 불가 안내 |
| `sources.test.cjs` | 외부 리뷰 출처·개인 흔적·외부 서버 주소가 빌드에 없는지 |

엑셀 검증에는 `python3 + openpyxl`, `soffice(LibreOffice)`, `pdftotext` 가 쓰입니다. 없으면 해당 검증만 건너뜁니다(개발 환경에서만 필요하고 배포물과 무관).

## 설계 원칙

- **서버 없음, 외부 접속 없음.** 데이터는 사용자 기기의 `localStorage` 에만 저장. 외부 요청이 생기면 `local.test.cjs`·`sources.test.cjs` 가 실패합니다.
- **백업이 곧 안전장치.** 서버 사본이 없으므로 백업 알림(14일)·영구 저장 요청·용량 경고·iPhone 안내(`64-script-local-care.js`)가 핵심 기능입니다. 약화시키지 마세요.
- 백업 JSON 형식은 복원 호환을 위해 바꾸지 않습니다(`db` 객체 그대로). 엑셀은 보기·정리용입니다.
- 저장 키(`pil_pen_ink_lab_v01`)와 백업 키(`pil_last_backup` 등)는 바꾸면 사용자 데이터가 보이지 않게 되니 유지하세요.

## 공개 전 점검표

실제 기기·서비스에서 확인해야 해서 자동 테스트가 대신하지 못하는 항목입니다. 자세한 확인 목록은 [DEPLOY.md](DEPLOY.md) 끝에 있습니다.

- [ ] GitHub Pages(또는 다른 호스팅)에 올려 **실제 https 주소**에서 동작 확인
- [ ] **iPhone 실기기**: 홈 화면 추가, Safari 탭과 홈 화면 앱의 저장 공간 분리, 영구 저장·7일 정책 동작
- [ ] Android 실기기 설치, 오프라인 동작
- [ ] 엑셀 파일을 **실제 Excel / Numbers / Google 스프레드시트**에서 열기 (자동 검증은 LibreOffice·openpyxl 기준)
- [ ] **내장 카탈로그(`src/parts/50-script-catalog-data.js`) 사실 확인** — 작성자의 지식 기준이며 공식 자료와 대조하지 않았습니다
- [x] 라이선스 MIT(`LICENSE`), 서드파티 고지, 출처·저작권 원칙([DATA-SOURCES.md](DATA-SOURCES.md))
- [x] 외부 접속 없음(자동 테스트), 개인 식별 값 없음(릴리스 스크립트가 검사)

## 알려진 한계

- **카드 사진은 IndexedDB(`pil-photos`: `thumbs`·`full` 저장소)에 있고, 카드 데이터에는 `photo:'local:<id>'` 참조만 들어갑니다**(`76-script-photos.js`). 백업 JSON 형식은 그대로이고, 사진이 있으면 `.zip`(`data.json`+`photos/<id>.jpg`·`.t.jpg`)이 됩니다. 복원 zip 은 이름 화이트리스트·크기 상한·CRC 검증을 거칩니다. 사진 판독은 사용자의 AI 앱에 복사·붙여넣기(`15-…ai-assist…`, `74`)이며 사진을 보관하지 않습니다. 시필 사진 보관·카드 공유는 서버 의존이던 코드(`11`·`16`·`20`·`22` 일부)가 비활성으로 남아 있고 서버 호출 자리는 `PIL.noServer()` 로 막혀 있습니다. 실기기(iOS 사진 선택기·HEIC 변환, 저장소 정책)는 자동 테스트가 대신하지 못합니다.
- AI 답변 형식(JSON)은 AI가 지침을 얼마나 잘 따르느냐에 달려 있습니다. 파서는 코드블록·잡담이 섞여도 읽지만, 형식을 어기면 안내 메시지와 함께 폼을 건드리지 않습니다.
- 기기 간 자동 동기화가 없습니다(백업 파일로 옮김). 필요해지면 로드맵 4차(서버형)와 함께 설계해야 합니다.
- 엑셀 **가져오기**(엑셀에서 고친 뒤 앱으로 되돌리기)는 아직 없습니다. 복원은 JSON·zip 만 됩니다.
- `calc` 가 화면의 `direction` 입력값을 직접 읽습니다(엔진·화면 결합).
- 코드 주석에는 개인 운영본 시절의 버전 표기(`v2.1` 등)가 남아 있습니다(화면에는 나타나지 않음).
- `04-style-v3.1…css` 는 주석뿐인 빈 파일입니다.
