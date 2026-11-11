# 서드파티 고지

이 프로젝트의 MIT 라이선스는 **이 저장소의 코드와 문서**에만 적용됩니다.

## 배포물에 포함·연결되는 외부 구성요소

**없습니다.** 앱은 외부 라이브러리, 글꼴, CDN, 분석 도구, 서버 API 를 쓰지 않습니다. 화면 글꼴은 사용자 기기에 설치된 기본 글꼴(Apple SD Gothic Neo, 맑은 고딕 등 — 기기의 시스템 글꼴)로 표시됩니다. 엑셀(.xlsx) 파일 생성과 서비스 워커도 이 저장소의 코드로 직접 구현되어 있습니다.

(이전 버전에서 쓰던 Pretendard 글꼴 CDN 연결, Google Apps Script/Sheets 연동, Anthropic API 사진 판독은 제거되었습니다.)

## 개발·검증에만 쓰는 것 (배포물에 포함되지 않음)

| 구성요소 | 용도 | 라이선스 |
|---|---|---|
| [Playwright](https://github.com/microsoft/playwright) | 자동 테스트(헤드리스 브라우저) | Apache-2.0 |
| Node.js 내장 테스트 러너 | 자동 테스트 | MIT |
| [openpyxl](https://openpyxl.readthedocs.io/) | 만들어진 엑셀 파일의 값을 읽어 대조 | MIT |
| [LibreOffice](https://www.libreoffice.org/) | 만들어진 엑셀 파일을 실제로 열어 보는 검증 | MPL-2.0 |
| poppler-utils(`pdftotext`) | 인쇄 PDF 의 글자 확인 | GPL-2.0 (실행 도구로만 사용) |

## 상표

언급된 브랜드·제품명(잉크, 만년필 등)은 각 소유자의 상표이며, 이 프로젝트는 어떤 브랜드와도 제휴·후원·보증 관계가 없습니다. 자세한 데이터 출처 원칙은 [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md) 를 참고하세요.
