// 사이트 전체 설정 — 사이트 이름·설명·댓글(Giscus)을 여기서 관리합니다.
export const SITE = {
  name: 'junfourteen',
  description: '성준 일상',
  author: '준',

  // Giscus 댓글 설정
  // repo 에 공개(public) GitHub 저장소를 넣으면 댓글이 활성화됩니다.
  // 예: repo: 'jun/jun-blog'
  // 저장소 설정 방법: https://giscus.app (Korean, 저장소 이름 입력)
  giscus: {
    repo: '',
    category: 'Announcements',
  },
} as const;
