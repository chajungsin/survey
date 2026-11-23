# 2026학년도 축제 만족도 설문조사

- Frontend: React + Vite
- Hosting: GitHub Pages (GitHub Actions 자동 배포)
- Database/Auth: Supabase
- Repository: https://github.com/chajungsin/survey

## 배포
`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드·배포합니다.
GitHub Pages 주소는 `https://chajungsin.github.io/survey/` 입니다.

## Supabase 보안
- 브라우저에는 공개용 publishable key만 사용합니다.
- 응답 테이블 RLS 활성화
- 익명 사용자는 INSERT만 가능하며 응답 SELECT는 불가
- 관리자 응답 조회는 Supabase Auth의 `app_metadata.role = admin`인 사용자만 가능
- 서비스 역할 키(service_role)는 프런트엔드에 포함하지 않습니다.

## 관리자 계정 준비
Supabase Dashboard > Authentication > Users에서 관리자 사용자를 생성한 뒤, 해당 사용자의 `app_metadata`에 다음 값을 설정해야 합니다.

```json
{ "role": "admin" }
```

관리자 로그인은 생성한 이메일과 비밀번호를 사용합니다. 비밀번호는 소스 코드에 저장하지 마세요.

## 중복 응답 제한
브라우저 localStorage에 임의 식별값을 저장하고 SHA-256 해시를 DB에 기록합니다. 같은 브라우저에서의 반복 제출을 막지만, 다른 브라우저·기기 사용 또는 브라우저 저장정보 삭제로 우회할 수 있습니다.

## 참고
공개 저장소에는 Supabase URL과 publishable key가 포함됩니다. 이는 브라우저 공개용 키이며, 데이터 접근은 RLS 정책으로 제한됩니다. 비밀 키를 커밋하지 마세요.
