window.JJSTAR_MENU = [
  {
    title: "JJSTAR 이용 가이드", miniLabel: "메인 가이드", code: "L01INIT",
    path: "pages/L01INIT.html",
    enabled: true,
    children: [
      { title: "JJSTAR 메인화면", miniLabel: "메인 화면", code: "L02MAIN", path: "pages/L02MAIN.html", enabled: true, children: [] },
      { title: "제이제이랑 JJSTAR 여행하기", miniLabel: "JJSTAR 가이드북", code: "L02JEJE", path: "pages/L02JEJE.html", enabled: true, children: [] },
      { title: "One-Stop 서비스란?", miniLabel: "원스톱 서비스", code: "L02OSTP", path: "pages/L02OSTP.html", enabled: true, children: [] },
      { title: "RAG + AI 검색서비스", miniLabel: "JJ GPT", code: "L02SRCH", path: "pages/L02SRCH.html", enabled: true, children: [] }
    ]
  },
  {
    title: "star 학생지원", miniLabel: "학생 지원", code: "L02SUPP",
    path: "pages/L02SUPP.html",
    enabled: true,
    folder: "pages/",
    children: [
      {
        title: "star 관리", miniLabel: "STAR 관리", code: "L03STMG",
        path: "pages/L03STMG.html",
        enabled: true,
        children: [
          { title: "사제동행교수선택(신규)", miniLabel: "사제 동행", code: "L04SAJE", path: "pages/L04SAJE.html", enabled: true },
          { title: "희망학과 선택", miniLabel: "희망 학과", code: "L04HMJR", path: "pages/L04HMJR.html", enabled: true },
          { title: "교원 시간표 조회", miniLabel: "교원 시간표", code: "L04PRTS", path: "pages/L04PRTS.html", enabled: true },
          { title: "교육과정편람", miniLabel: "교과 편람", code: "L04EDCRB", path: "pages/L04EDCRB.html", enabled: true, hideInNav: true },
          { title: "교육과정", miniLabel: "교육 과정", code: "L04EDCR", path: "pages/L04EDCR.html", enabled: true, hideInNav: true },
          { title: "수강편람", miniLabel: "수강 편람", code: "L04SGGD", path: "pages/L04SGGD.html", enabled: true, hideInNav: true },
          { title: "학사일정", miniLabel: "학사 일정", code: "L04ACSC", path: "pages/L04ACSC.html", enabled: true }
        ]
      },
      {
        title: "장학관리", miniLabel: "장학 관리", code: "L03SCHL",
        path: "pages/L03SCHL.html",
        enabled: true,
        children: [
          { title: "장학 공지사항", miniLabel: "장학 공지", code: "L04SCHN", path: "pages/L04SCHN.html", enabled: true, hideInNav: true },
          { title: "우리대학 장학 안내", miniLabel: "장학 안내", code: "L04SCHI", path: "pages/L04SCHI.html", enabled: false },
          { title: "장학금 신청 절차", miniLabel: "신청 절차", code: "L04SCHP", path: "pages/L04SCHP.html", enabled: false },
          { title: "장학금 온라인신청", miniLabel: "온라인 신청", code: "L04SCHO", path: "pages/L04SCHO.html", enabled: true },
          { title: "장학금 지급계좌관리", miniLabel: "계좌 관리", code: "L04SCHA", path: "pages/L04SCHA.html", enabled: true },
          { title: "장학금 수혜현황", miniLabel: "수혜 현황", code: "L04SCHS", path: "pages/L04SCHS.html", enabled: true },
          { title: "장학금 환수", miniLabel: "장학금 환수", code: "L04SCHR", path: "pages/L04SCHR.html", enabled: true },
          { title: "My 수혜 가능 장학 현황", miniLabel: "MY 장학", code: "L04MSCH", path: "pages/L04MSCH.html", enabled: false }
        ]
      },
      {
        title: "등록관리", miniLabel: "등록 관리", code: "L03REGI",
        path: "pages/L03REGI.html",
        enabled: true,
        children: [
          { title: "등록금 고지서", miniLabel: "등록금 고지서", code: "L04TUIB", path: "pages/L04TUIB.html", enabled: true, hideInNav: true },
          { title: "분할납부 신청", miniLabel: "분할 납부", code: "L04INST", path: "pages/L04INST.html", enabled: true },
          { title: "등록금 납부 내역", miniLabel: "납부 내역", code: "L04TUHI", path: "pages/L04TUHI.html", enabled: true, hideInNav: true },
          { title: "교육비 납입 증명서 출력", miniLabel: "납입 증명서", code: "L04PAYC", path: "pages/L04PAYC.html", enabled: true, hideInNav: true },
          { title: "등록금 환불요청", miniLabel: "환불", code: "L04REFD", path: "pages/L04REFD.html", enabled: true }
        ]
      },
      {
        title: "진단검사", miniLabel: "진단 검사", code: "L03TEST",
        path: "pages/L03TEST.html",
        enabled: true,
        children: [
          { title: "우리대학 진단 검사 안내", miniLabel: "검사 안내", code: "L04TSTI", path: "pages/L04TSTI.html", enabled: true, hideInNav: true },
          { title: "성격검사 (MBTI)", miniLabel: "성격 MBTI", code: "L04MBTI", path: "pages/L04MBTI.html", enabled: true },
          { title: "학습유형검사 (U&I)", miniLabel: "학습유형 U&I", code: "L04UITY", path: "pages/L04UITY.html", enabled: true },
          { title: "직업흥미검사 (STRONG)", miniLabel: "직업흥미 STRONG", code: "L04STRG", path: "pages/L04STRG.html", enabled: true },
          { title: "기타 진단검사", miniLabel: "기타 검사", code: "L04ETCT", path: "pages/L04ETCT.html", enabled: true }
        ]
      },
      {
        title: "심리/학업/진로 상담", miniLabel: "상담", code: "L03COUN",
        path: "pages/L03COUN.html",
        enabled: true,
        children: [
          { title: "상담 안내", miniLabel: "상담 안내", code: "L04CNGD", path: "pages/L04CNGD.html", enabled: true, hideInNav: true },
          { title: "1:1 상담", miniLabel: "1:1 상담", code: "L04CN11", path: "pages/L04CN11.html", enabled: true },
          { title: "멘토링", miniLabel: "선후배 멘토링", code: "L04MENT", path: "pages/L04MENT.html", enabled: true },
          { title: "온라인 상담", miniLabel: "온라인 상담", code: "L04ONCN", path: "pages/L04ONCN.html", enabled: true },
          { title: "카운슬링센터 심리 검사", miniLabel: "카운슬링 진단", code: "L04PSYC", path: "pages/L04PSYC.html", enabled: true }
        ]
      },
      {
        title: "통학버스", miniLabel: "통학 버스", code: "L03BUSS",
        path: "pages/L03BUSS.html",
        enabled: true,
        children: [
          { title: "통학버스 안내", miniLabel: "버스 안내", code: "L04BUSI", path: "pages/L04BUSI.html", enabled: true, hideInNav: true },
          { title: "통학버스 노선도", miniLabel: "버스 노선도", code: "L04BUSM", path: "pages/L04BUSM.html", enabled: true, hideInNav: true },
          { title: "통학버스 신청", miniLabel: "탑승 신청", code: "L04BUSA", path: "pages/L04BUSA.html", enabled: true }
        ]
      },
      {
        title: "학생생활관", miniLabel: "기숙사 생활", code: "L03DORM",
        path: "pages/L03DORM.html",
        enabled: true,
        children: [
          { title: "학생생활관 공지사항", miniLabel: "기숙사 공지", code: "L04DMNT", path: "pages/L04DMNT.html", enabled: true, hideInNav: true },
          { title: "우리대학 학생생활관 안내", miniLabel: "기숙사 안내", code: "L04DMGD", path: "pages/L04DMGD.html", enabled: false },
          { title: "학생생활관 입사 절차", miniLabel: "입사 절차", code: "L04DMPC", path: "pages/L04DMPC.html", enabled: false },
          { title: "학생생활관 입사 신청", miniLabel: "입사", code: "L04DMAP", path: "pages/L04DMAP.html", enabled: true },
          { title: "입사서약서 작성", miniLabel: "서약서 작성", code: "L04DMPG", path: "pages/L04DMPG.html", enabled: true, hideInNav: true },
          { title: "관실신청", miniLabel: "관실 신청", code: "L04ROOM", path: "pages/L04ROOM.html", enabled: true },
          { title: "학생생활관비 납입고지서", miniLabel: "납입 고지서", code: "L04DMBI", path: "pages/L04DMBI.html", enabled: true, hideInNav: true },
          { title: "학생생활관비 납부확인서", miniLabel: "납부 확인서", code: "L04DMCF", path: "pages/L04DMCF.html", enabled: true, hideInNav: true },
          { title: "늦은귀사신청", miniLabel: "늦은 귀사", code: "L04LATR", path: "pages/L04LATR.html", enabled: true, hideInNav: true },
          { title: "상벌점조회", miniLabel: "상벌점 조회", code: "L04PNTS", path: "pages/L04PNTS.html", enabled: true, hideInNav: true },
          { title: "외박신청", miniLabel: "외박", code: "L04OUTS", path: "pages/L04OUTS.html", enabled: true },
          { title: "조기 취침 신청", miniLabel: "조기 취침", code: "L04SLEP", path: "pages/L04SLEP.html", enabled: true },
          { title: "불편사항 신청", miniLabel: "불편 사항", code: "L04INCV", path: "pages/L04INCV.html", enabled: true },
          { title: "퇴사 신청", miniLabel: "퇴사", code: "L04LEVD", path: "pages/L04LEVD.html", enabled: true }
        ]
      },
      {
        title: "학교홍보", miniLabel: "학교 홍보", code: "L03PROM",
        path: "pages/L03PROM.html",
        enabled: true,
        hideInNav: true,
        children: [
          { title: "학교 소개", miniLabel: "학교 소개", code: "L04SCHP", path: "pages/L04SCHP.html", enabled: true, hideInNav: true },
          { title: "학과 및 전공 소개", miniLabel: "학과 소개", code: "L04MAJR", path: "pages/L04MAJR.html", enabled: true },
          { title: "SNS 정보", miniLabel: "소셜 채널", code: "L04SNSI", path: "pages/L04SNSI.html", enabled: true }
        ]
      },
      {
        title: "JJSTAR 이용 매뉴얼", miniLabel: "JJSTAR 매뉴얼", code: "L03JJMN",
        path: "pages/L03JJMN.html",
        enabled: true,
        hideInNav: true,
        children: []
      }
    ]
  },

  {
    title: "학사정보", miniLabel: "학사 정보", code: "L02ACAD",
    path: "pages/L02ACAD.html",
    enabled: true,
    folder: "pages/",
    children: [
      {
        title: "학사관리", miniLabel: "학사 관리", code: "L03ADMN",
        path: "pages/L03ADMN.html",
        enabled: true,
        children: [
          { title: "학사관리 공지사항", miniLabel: "학사 공지", code: "L04ADNT", path: "pages/L04ADNT.html", enabled: true, hideInNav: true },
          { title: "학사관리 FAQ", miniLabel: "학사 FAQ", code: "L04ADFA", path: "pages/L04ADFA.html", enabled: true, hideInNav: true },
          { title: "학칙개정사항 안내", miniLabel: "학칙 개정", code: "L04RULE", path: "pages/L04RULE.html", enabled: true, hideInNav: true },
          { title: "심폐소생술 교과목 신청", miniLabel: "심폐교과 신청", code: "L04CPRA", path: "pages/L04CPRA.html", enabled: true },
          { title: "심폐소생술 교과목 신청내역 확인", miniLabel: "심폐교과 신청확인", code: "L04CPRH", path: "pages/L04CPRH.html", enabled: true },
          { title: "AHA 바로가기", miniLabel: "AHA 링크", code: "L04AHAL", path: "pages/L04AHAL.html", enabled: true, hideInNav: true },
          { title: "AHA 교육이수증", miniLabel: "AHA 이수증", code: "L04AHAC", path: "pages/L04AHAC.html", enabled: true }
        ]
      },
      {
        title: "교육과정", miniLabel: "교육 과정", code: "L03CURR",
        path: "pages/L03CURR.html",
        enabled: true,
        children: [
          { title: "교양 교육과정 조회", miniLabel: "교양 교과", code: "L04GECR", path: "pages/L04GECR.html", enabled: true },
          { title: "전공 교육과정 조회", miniLabel: "전공 교과", code: "L04MJCR", path: "pages/L04MJCR.html", enabled: true },
          { title: "교육과정 시뮬레이션", miniLabel: "교과 시뮬", code: "L04CRSM", path: "pages/L04CRSM.html", enabled: true },
          { title: "My 교육과정 조회", miniLabel: "MY 교과", code: "L04MCRR", path: "pages/L04MCRR.html", enabled: true }
        ]
      },
      {
        title: "수강관리", miniLabel: "수강 관리", code: "L03COUR",
        path: "pages/L03COUR.html",
        enabled: true,
        children: [
          { title: "수강바구니", miniLabel: "수강 바구니", code: "L04BASK", path: "pages/L04BASK.html", enabled: true, hideInNav: true },
          { title: "수강신청", miniLabel: "수강 신청", code: "L04ENRA", path: "pages/L04ENRA.html", enabled: true, hideInNav: true },
          { title: "수강취소", miniLabel: "수강 취소", code: "L04DROP", path: "pages/L04DROP.html", enabled: true, hideInNav: true },
          { title: "수강신청 내역조회", miniLabel: "수강 내역", code: "L04ENRV", path: "pages/L04ENRV.html", enabled: true, hideInNav: true },
          { title: "교육과정조회", miniLabel: "교육 과정", code: "L04CURV", path: "pages/L04CURV.html", enabled: true },
          { title: "강좌시간표/수업계획서 조회", miniLabel: "시간표 & 계획서", code: "L04CLPL", path: "pages/L04CLPL.html", enabled: true },
          { title: "졸업이수기준정보조회", miniLabel: "졸업기준 조회", code: "L04GRDV", path: "pages/L04GRDV.html", enabled: true },
          { title: "출결확인", miniLabel: "출결 확인", code: "L04ATTD", path: "pages/L04ATTD.html", enabled: true },
          { title: "출석인정신청", miniLabel: "출석 인정", code: "L04ATAP", path: "pages/L04ATAP.html", enabled: true, hideInNav: true }
        ]
      },
      {
        title: "성적관리", miniLabel: "성적 관리", code: "L03GRAD",
        path: "pages/L03GRAD.html",
        enabled: true,
        children: [
          { title: "학기별성적조회", miniLabel: "학기별 성적", code: "L04SEMG", path: "pages/L04SEMG.html", enabled: true },
          { title: "성적이의신청", miniLabel: "성적 이의", code: "L04GREJ", path: "pages/L04GREJ.html", enabled: true },
          { title: "성적정보분석 (AMC5)", miniLabel: "성적 분석", code: "L04AMC5", path: "pages/L04AMC5.html", enabled: true, hideInNav: true }
        ]
      },
      {
        title: "학적관리", miniLabel: "학적 관리", code: "L03RECD",
        path: "pages/L03RECD.html",
        enabled: true,
        children: [
          { title: "학적 기초", miniLabel: "학적 기초", code: "L04BASC", path: "pages/L04BASC.html", enabled: true },
          { title: "복수/부 전공 신청", miniLabel: "복수/부 전공", code: "L04DBMJ", path: "pages/L04DBMJ.html", enabled: true },
          { title: "복학 신청 및 확인", miniLabel: "복학", code: "L04RETN", path: "pages/L04RETN.html", enabled: true },
          { title: "전과전공 선택 신청 및 확인", miniLabel: "전공 선택", code: "L04CHMJ", path: "pages/L04CHMJ.html", enabled: true },
          { title: "학과 선택", miniLabel: "학과 선택", code: "L04DEPT", path: "pages/L04DEPT.html", enabled: true },
          { title: "휴학신청", miniLabel: "휴학", code: "L04LEAV", path: "pages/L04LEAV.html", enabled: true },
          { title: "자퇴신청", miniLabel: "자퇴", code: "L04WITH", path: "pages/L04WITH.html", enabled: true },
          { title: "재입학 신청", miniLabel: "재입학 신청", code: "L04READ", path: "pages/L04READ.html", enabled: true },
          { title: "학적 변동 정보 조회", miniLabel: "학적변동", code: "L04RCIV", path: "pages/L04RCIV.html", enabled: true },
          { title: "학부모 학사정보조회 승인", miniLabel: "학부모 조회승인", code: "L04PAPR", path: "pages/L04PAPR.html", enabled: true }
        ]
      },
      {
        title: "학점신청", miniLabel: "학점 신청", code: "L03CRED",
        path: "pages/L03CRED.html",
        enabled: true,
        children: [
          { title: "beSTAR 신청", miniLabel: "beSTAR 신청", code: "L04BEST", path: "pages/L04BEST.html", enabled: true },
          { title: "연계/융합 전공 신청", miniLabel: "연계/융합 전공", code: "L04LINK", path: "pages/L04LINK.html", enabled: true },
          { title: "Micro Degree 신청", miniLabel: "Micro Degree", code: "L04MCDE", path: "pages/L04MCDE.html", enabled: true },
          { title: "Micro 융합전공 신청", miniLabel: "Micro 융합전공", code: "L04MCMJ", path: "pages/L04MCMJ.html", enabled: true },
          { title: "자기설계전공 신청", miniLabel: "자기설계 전공", code: "L04SELF", path: "pages/L04SELF.html", enabled: true },
          { title: "특별학점", miniLabel: "특별 학점", code: "L04SPCR", path: "pages/L04SPCR.html", enabled: true },
          { title: "K-MOOC인정신청", miniLabel: "K-MOOC 인정", code: "L04KMOC", path: "pages/L04KMOC.html", enabled: true },
          { title: "학습경험인정신청", miniLabel: "학습경험 인정", code: "L04EXPR", path: "pages/L04EXPR.html", enabled: true }
        ]
      },
      {
        title: "채플관리", miniLabel: "채플 관리", code: "L03CHPL",
        path: "pages/L03CHPL.html",
        enabled: true,
        hideInNav: true,
        children: [
          { title: "채플/기독교 공지사항", miniLabel: "채플 공지", code: "L04CHNT", path: "pages/L04CHNT.html", enabled: true },
          { title: "채플/기독교 이수현황", miniLabel: "채플 이수현황", code: "L04CHST", path: "pages/L04CHST.html", enabled: true }
        ]
      },
      {
        title: "사회봉사", miniLabel: "사회 봉사", code: "L03SERV",
        path: "pages/L03SERV.html",
        enabled: true,
        children: [
          { title: "사회봉사 공지사항", miniLabel: "사봉 공지", code: "L04SVNT", path: "pages/L04SVNT.html", enabled: true, hideInNav: true },
          { title: "사회봉사 교과목신청", miniLabel: "사봉 교과목", code: "L04SVAP", path: "pages/L04SVAP.html", enabled: true },
          { title: "신청내역 및 인증 확인", miniLabel: "사봉 내역", code: "L04SVCK", path: "pages/L04SVCK.html", enabled: true },
          { title: "활동계획서 제출", miniLabel: "활동 계획서", code: "L04SVPL", path: "pages/L04SVPL.html", enabled: true },
          { title: "결과보고서 제출", miniLabel: "결과 보고서", code: "L04SVRP", path: "pages/L04SVRP.html", enabled: true }
        ]
      },
      {
        title: "인증관리", miniLabel: "인증 관리", code: "L03CERT",
        path: "pages/L03CERT.html",
        enabled: true,
        children: [
          { title: "마이크로 전공 인증서", miniLabel: "micro전공 인증서", code: "L04MCRT", path: "pages/L04MCRT.html", enabled: true },
          { title: "성적우수상 내역", miniLabel: "성적 우수상", code: "L04AWRD", path: "pages/L04AWRD.html", enabled: true }
        ]
      },
      {
        title: "강의평가", miniLabel: "강의 평가", code: "L03LEVL",
        path: "pages/L03LEVL.html",
        enabled: true,
        children: [
          { title: "강의평가", miniLabel: "최종 강의평가", code: "L04LEVL", path: "pages/L04LEVL.html", enabled: true },
          { title: "중간강의평가", miniLabel: "중간 강의평가", code: "L04MLEV", path: "pages/L04MLEV.html", enabled: true }
        ]
      },
      {
        title: "공학인증 및 인·적성", miniLabel: "공학인증 적성검사", code: "L03ABEK",
        path: "pages/L03ABEK.html",
        enabled: true,
        children: [
          { title: "ABEEK 설문조사", miniLabel: "ABEEK 설문", code: "L04ABEK", path: "pages/L04ABEK.html", enabled: true },
          { title: "교직 적/인성 검사", miniLabel: "교직 적/인성", code: "L04PERS", path: "pages/L04PERS.html", enabled: true }
        ]
      }
    ]
  },

  {
    title: "대학생활", miniLabel: "대학 생활", code: "L02LIFE",
    path: "pages/L02LIFE.html",
    enabled: true,
    folder: "pages/",
    children: [
      {
        title: "전공역량", miniLabel: "전공 역량", code: "L03MAJC",
        path: "pages/L03MAJC.html",
        enabled: true,
        children: [
          { title: "전공역량 자기평가 진단 검사", miniLabel: "역량 평가", code: "L04MJDG", path: "pages/L04MJDG.html", enabled: true },
          { title: "전공역량 자기평가 결과 분석", miniLabel: "결과 분석", code: "L04MJRS", path: "pages/L04MJRS.html", enabled: true }
        ]
      },
      {
        title: "공동체", miniLabel: "공동체 활동", code: "L03COMM",
        path: "pages/L03COMM.html",
        enabled: true,
        children: [
          { title: "My MAP", miniLabel: "MY MAP", code: "L04MYMP", path: "pages/L04MYMP.html", enabled: true },
          { title: "공동체구성 및 활동내역", miniLabel: "공동체 구성&활동", code: "L04CMAC", path: "pages/L04CMAC.html", enabled: true },
          { title: "공동체 활동 결과보고", miniLabel: "활동 결과보고", code: "L04CMRP", path: "pages/L04CMRP.html", enabled: true },
          { title: "공동체 멘토상담 입력", miniLabel: "멘토 상담", code: "L04CMMT", path: "pages/L04CMMT.html", enabled: true }
        ]
      },
      {
        title: "해외봉사", miniLabel: "해외 봉사", code: "L03OVSV",
        path: "pages/L03OVSV.html",
        enabled: true,
        children: [
          { title: "해외봉사 공지사항", miniLabel: "해봉 공지", code: "L04OVNT", path: "pages/L04OVNT.html", enabled: true },
          { title: "해외봉사 신청", miniLabel: "해봉 신청", code: "L04OVAP", path: "pages/L04OVAP.html", enabled: true },
          { title: "해외봉사 신청 내역 확인", miniLabel: "신청 내역", code: "L04OVCK", path: "pages/L04OVCK.html", enabled: true },
          { title: "해외봉사 결과보고서 제출", miniLabel: "결과 보고서", code: "L04OVRP", path: "pages/L04OVRP.html", enabled: true }
        ]
      },
      {
        title: "해외연수", miniLabel: "해외 연수", code: "L03OVTR",
        path: "pages/L03OVTR.html",
        enabled: true,
        children: [
          { title: "해외 연수 신청", miniLabel: "연수 신청", code: "L04TRAP", path: "pages/L04TRAP.html", enabled: true },
          { title: "해외 입·출국 신고", miniLabel: "입출국 신고", code: "L04TRDG", path: "pages/L04TRDG.html", enabled: true },
          { title: "해외 연수 내역", miniLabel: "연수 내역", code: "L04TRHI", path: "pages/L04TRHI.html", enabled: true }
        ]
      },
      {
        title: "기타 학사 관리", miniLabel: "기타 학사", code: "L03ETAC",
        path: "pages/L03ETAC.html",
        enabled: true,
        children: [
          { title: "강의실 잔류 신청", miniLabel: "잔류 신청", code: "L04ROOMS", path: "pages/L04ROOMS.html", enabled: true },
          { title: "강의실 잔류 신청 내역", miniLabel: "신청 내역", code: "L04ROOMH", path: "pages/L04ROOMH.html", enabled: true }
        ]
      },
      {
        title: "수상내역", miniLabel: "수상 내역", code: "L03AWAR",
        path: "pages/L03AWAR.html",
        enabled: true,
        children: [
          { title: "교내 수상내역", miniLabel: "교내 수상", code: "L04AWIN", path: "pages/L04AWIN.html", enabled: true }
        ]
      },
      {
        title: "학생증", miniLabel: "학생증 이용", code: "L03STID",
        path: "pages/L03STID.html",
        enabled: true,
        children: [
          { title: "학생증 안내", miniLabel: "발급 안내", code: "L04IDGD", path: "pages/L04IDGD.html", enabled: true },
          { title: "발급절차", miniLabel: "발급 절차", code: "L04IDPR", path: "pages/L04IDPR.html", enabled: true },
          { title: "분실신고", miniLabel: "분실 신고", code: "L04IDLS", path: "pages/L04IDLS.html", enabled: true },
          { title: "재발급 절차", miniLabel: "재발급 절차", code: "L04IDRE", path: "pages/L04IDRE.html", enabled: true }
        ]
      },
      {
        title: "증명발급", miniLabel: "증명 발급", code: "L03CERTI",
        path: "pages/L03CERTI.html",
        enabled: true,
        children: [
          { title: "인터넷 증명발금 안내", miniLabel: "인터넷 발급", code: "L04CEGD", path: "pages/L04CEGD.html", enabled: true },
          { title: "제증명 발급", miniLabel: "제증명 발급", code: "L04CEIS", path: "pages/L04CEIS.html", enabled: true },
          { title: "제증명 발급내역", miniLabel: "발급 내역", code: "L04CEHI", path: "pages/L04CEHI.html", enabled: true }
        ]
      },
      {
        title: "SUPER 핵심역량", miniLabel: "SUPER 핵심역량", code: "L03SUCP",
        path: "pages/L03SUCP.html",
        enabled: true,
        children: [
          { title: "SUPER 핵심역량", miniLabel: "역량 안내", code: "L04SUPE", path: "pages/L04SUPE.html", enabled: true },
          { title: "SUPER 핵심역량 인증 정보", miniLabel: "인증 정보", code: "L04SUCI", path: "pages/L04SUCI.html", enabled: true },
          { title: "SUPER 핵심역량 진단검사", miniLabel: "진단 검사", code: "L04SUDG", path: "pages/L04SUDG.html", enabled: true },
          { title: "SUPER 핵심역량 진단평가 결과 분석", miniLabel: "결과 분석", code: "L04SURS", path: "pages/L04SURS.html", enabled: true }
        ]
      },
      {
        title: "starT", miniLabel: "starT 프로그램", code: "L03STRT",
        path: "pages/L03STRT.html",
        enabled: true,
        children: [
          { title: "3C활동 안내", miniLabel: "3C 활동안내", code: "L043CAT", path: "pages/L043CAT.html", enabled: true },
          { title: "starT 트랙제도", miniLabel: "제도 안내", code: "L04TRCK", path: "pages/L04TRCK.html", enabled: true },
          { title: "starT 프로그램 소개", miniLabel: "소개", code: "L04STPG", path: "pages/L04STPG.html", enabled: true },
          { title: "starT 주요혜택", miniLabel: "주요 혜택", code: "L04STBF", path: "pages/L04STBF.html", enabled: true },
          { title: "starT 온라인 신청내역", miniLabel: "온라인 신청내역", code: "L04STOH", path: "pages/L04STOH.html", enabled: true },
          { title: "starT 신청 현황", miniLabel: "신청 현황", code: "L04STHS", path: "pages/L04STHS.html", enabled: true },
          { title: "starT 활동 인증", miniLabel: "활동 인증", code: "L04STCF", path: "pages/L04STCF.html", enabled: true }
        ]
      },
      {
        title: "원격교육 TA 운영", miniLabel: "TA", code: "L03TAOP",
        path: "pages/L03TAOP.html",
        enabled: true,
        children: [
          { title: "TA 근무일지 입력", miniLabel: "일지 입력", code: "L04TALG", path: "pages/L04TALG.html", enabled: true },
          { title: "TA 근무일지 내역", miniLabel: "일지 내역", code: "L04TAHI", path: "pages/L04TAHI.html", enabled: true }
        ]
      },
      {
        title: "학생회 활동", miniLabel: "학생회 활동", code: "L03STCN",
        path: "pages/L03STCN.html",
        enabled: true,
        children: [
          { title: "총학생회 선거", miniLabel: "선거", code: "L04ELCT", path: "pages/L04ELCT.html", enabled: true },
          { title: "학생회 활동 내역", miniLabel: "활동 내역", code: "L04STCH", path: "pages/L04STCH.html", enabled: true }
        ]
      },
      {
        title: "대학생활 상담", miniLabel: "상담", code: "L03LFCN",
        path: "pages/L03LFCN.html",
        enabled: true,
        children: [
          { title: "상담 안내", miniLabel: "상담 안내", code: "L04LFGD", path: "pages/L04LFGD.html", enabled: true },
          { title: "1:1 상담", miniLabel: "1:1 상담", code: "L04LF11", path: "pages/L04LF11.html", enabled: true },
          { title: "멘토링", miniLabel: "선후배 멘토링", code: "L04LFMT", path: "pages/L04LFMT.html", enabled: true },
          { title: "온라인 상담 신청", miniLabel: "온라인 상담 신청", code: "L04LFON", path: "pages/L04LFON.html", enabled: true },
          { title: "카운슬링센터 심리 검사", miniLabel: "카운슬링 진단", code: "L04LFPS", path: "pages/L04LFPS.html", enabled: true }
        ]
      }
    ]
  },

  {
    title: "진로개발", miniLabel: "진로 개발", code: "L02CARE",
    path: "pages/L02CARE.html",
    enabled: true,
    folder: "pages/",
    children: [
      {
        title: "비교과 프로그램", miniLabel: "비교과 프로그램", code: "L03NCUR",
        path: "pages/L03NCUR.html",
        enabled: true,
        children: [
          { title: "비교과 프로그램 추천", miniLabel: "비교과 추천", code: "L04NCRD", path: "pages/L04NCRD.html", enabled: true },
          { title: "비교과 참여 신청", miniLabel: "참여 신청", code: "L04NCAP", path: "pages/L04NCAP.html", enabled: true },
          { title: "비교과 활동 신청 및 이수 현황", miniLabel: "이수 현황", code: "L04NCHS", path: "pages/L04NCHS.html", enabled: true },
          { title: "비교과 만족도 조사", miniLabel: "만족도 조사", code: "L04NCSV", path: "pages/L04NCSV.html", enabled: true },
          { title: "비교과 활동 증명서", miniLabel: "활동 증명서", code: "L04NCCF", path: "pages/L04NCCF.html", enabled: true }
        ]
      },
      {
        title: "커리어로드맵", miniLabel: "커리어 로드맵", code: "L03CRMP",
        path: "pages/L03CRMP.html",
        enabled: true,
        children: [
          { title: "목표직무 탐색", miniLabel: "목표직무 탐색", code: "L04TGJB", path: "pages/L04TGJB.html", enabled: true },
          { title: "관심직무 자가진단", miniLabel: "관심직무 자가진단", code: "L04INJB", path: "pages/L04INJB.html", enabled: true },
          { title: "My 직무개발현황", miniLabel: "직무개발 현황", code: "L04MJDV", path: "pages/L04MJDV.html", enabled: true },
          { title: "학과별 커리어로드맵", miniLabel: "학과별 로드맵", code: "L04DCRM", path: "pages/L04DCRM.html", enabled: true },
          { title: "My 커리어로드맵", miniLabel: "MY 로드맵", code: "L04MCRM", path: "pages/L04MCRM.html", enabled: true },
          { title: "선도학생 커리어패스", miniLabel: "선도학생 커리어패스", code: "L04LEAD", path: "pages/L04LEAD.html", enabled: true }
        ]
      },
      {
        title: "직무탐색", miniLabel: "직무 탐색", code: "L03JOBE",
        path: "pages/L03JOBE.html",
        enabled: true,
        children: [
          { title: "직무역량 소개", miniLabel: "직무역량 소개", code: "L04JBCP", path: "pages/L04JBCP.html", enabled: true },
          { title: "NCS 직무탐색", miniLabel: "NCS 직무탐색", code: "L04NCSJ", path: "pages/L04NCSJ.html", enabled: true },
          { title: "워크넷 직무탐색", miniLabel: "워크넷 직무탐색", code: "L04WORK", path: "pages/L04WORK.html", enabled: true },
          { title: "직무역량 탐색", miniLabel: "직무역량 탐색", code: "L04JBEF", path: "pages/L04JBEF.html", enabled: true }
        ]
      },
      {
        title: "진로검사", miniLabel: "진로 검사", code: "L03CART",
        path: "pages/L03CART.html",
        enabled: true,
        children: [
          { title: "적성탐색 검사", miniLabel: "적성 탐색", code: "L04APTT", path: "pages/L04APTT.html", enabled: true },
          { title: "직업심리적성 검사", miniLabel: "직업심리 적성검사", code: "L04VOCA", path: "pages/L04VOCA.html", enabled: true },
          { title: "진로개발 역량검사", miniLabel: "진로개발 역량검사", code: "L04CDCT", path: "pages/L04CDCT.html", enabled: true },
          { title: "진로진단 검사", miniLabel: "진로 진단", code: "L04CRDT", path: "pages/L04CRDT.html", enabled: true }
        ]
      },
      {
        title: "캡스톤디자인", miniLabel: "캡스톤 디자인", code: "L03CAPS",
        path: "pages/L03CAPS.html",
        enabled: true,
        children: [
          { title: "공지사항", miniLabel: "공지", code: "L04CPNT", path: "pages/L04CPNT.html", enabled: true },
          { title: "캡스톤디자인 서약서 동의", miniLabel: "서약서 동의", code: "L04CPAG", path: "pages/L04CPAG.html", enabled: true },
          { title: "신청확인 및 관리", miniLabel: "신청 확인", code: "L04CPMG", path: "pages/L04CPMG.html", enabled: true },
          { title: "카드대여", miniLabel: "카드 대여", code: "L04CARD", path: "pages/L04CARD.html", enabled: true }
        ]
      },
      {
        title: "개인(팀) 프로젝트", miniLabel: "개인(팀) 프로젝트", code: "L03PJCT",
        path: "pages/L03PJCT.html",
        enabled: true,
        children: [
          { title: "공지사항", miniLabel: "공지", code: "L04PJNT", path: "pages/L04PJNT.html", enabled: true },
          { title: "개인(팀) 프로젝트", miniLabel: "개인/팀 프로젝트", code: "L04PRJT", path: "pages/L04PRJT.html", enabled: true },
          { title: "Together", miniLabel: "투게더 (P)", code: "L04TGTH", path: "pages/L04TGTH.html", enabled: true },
          { title: "리빙랩", miniLabel: "리빙랩 (P)", code: "L04LVLB", path: "pages/L04LVLB.html", enabled: true },
          { title: "로컬벤처", miniLabel: "로컬벤처 (P)", code: "L04LCVT", path: "pages/L04LCVT.html", enabled: true },
          { title: "오픈테이블", miniLabel: "오픈테이블 (P)", code: "L04OPTB", path: "pages/L04OPTB.html", enabled: true }
        ]
      }
    ]
  },

  {
    title: "취업지원", miniLabel: "취업 지원", code: "L02JOBS",
    path: "pages/L02JOBS.html",
    enabled: true,
    folder: "pages/",
    children: [
      {
        title: "창업", miniLabel: "창업", code: "L03STUP",
        path: "pages/L03STUP.html",
        enabled: true,
        children: [
          { title: "창업 공지사항", miniLabel: "공지", code: "L04STNT", path: "pages/L04STNT.html", enabled: true },
          { title: "사업참여이력", miniLabel: "사업 참여이력", code: "L04BIZH", path: "pages/L04BIZH.html", enabled: true },
          { title: "창업 장학금 신청", miniLabel: "창업 장학금", code: "L04STSC", path: "pages/L04STSC.html", enabled: true }
        ]
      },
      {
        title: "취업정보", miniLabel: "취업 정보", code: "L03EMPI",
        path: "pages/L03EMPI.html",
        enabled: true,
        children: [
          { title: "교내 채용 정보", miniLabel: "교내 채용", code: "L04INJP", path: "pages/L04INJP.html", enabled: true },
          { title: "기업 정보", miniLabel: "기업 정보", code: "L04COMP", path: "pages/L04COMP.html", enabled: true },
          { title: "맞춤형 채용정보", miniLabel: "맞춤형 채용", code: "L04MTJP", path: "pages/L04MTJP.html", enabled: true },
          { title: "기관요청 채용정보", miniLabel: "기관 채용", code: "L04REQJ", path: "pages/L04REQJ.html", enabled: true },
          { title: "채용포털 채용정보", miniLabel: "채용 포털", code: "L04PTJP", path: "pages/L04PTJP.html", enabled: true }
        ]
      },
      {
        title: "현장실습학기제", miniLabel: "현장실습 학기제", code: "L03INTR",
        path: "pages/L03INTR.html",
        enabled: true,
        children: [
          { title: "FAQ", miniLabel: "주요 질문", code: "L04INFA", path: "pages/L04INFA.html", enabled: true },
          { title: "공지사항", miniLabel: "공지", code: "L04INNT", path: "pages/L04INNT.html", enabled: true },
          { title: "현장실습학기제 서약서 작성", miniLabel: "서약서 작성", code: "L04INPG", path: "pages/L04INPG.html", enabled: true },
          { title: "현장실습학기제 개인정보 동의", miniLabel: "개인정보 동의", code: "L04INPR", path: "pages/L04INPR.html", enabled: true },
          { title: "헌장실습학기제 참여 신청", miniLabel: "참여 신청", code: "L04INAP", path: "pages/L04INAP.html", enabled: true },
          { title: "현장실습학기제 참여 내역", miniLabel: "참여 내역", code: "L04INHI", path: "pages/L04INHI.html", enabled: true },
          { title: "만족도 평가", miniLabel: "만족도 평가", code: "L04INSV", path: "pages/L04INSV.html", enabled: true },
          { title: "중도 포기 신청", miniLabel: "중도 포기", code: "L04INDR", path: "pages/L04INDR.html", enabled: true },
          { title: "연수비(교통비 지급)", miniLabel: "연수비 지급", code: "L04INPF", path: "pages/L04INPF.html", enabled: true }
        ]
      }
    ]
  },

  {
    title: "SUPER STAR", miniLabel: "슈퍼 스타", code: "L02STAR",
    path: "pages/L02STAR.html",
    enabled: true,
    folder: "pages/",
    children: [
      {
        title: "산학협력활동", miniLabel: "산학 협력", code: "L03INDS",
        path: "pages/L03INDS.html",
        enabled: true,
        children: [
          { title: "산학협력 연구 참여 확인서", miniLabel: "참여 확인서", code: "L04INDC", path: "pages/L04INDC.html", enabled: true }
        ]
      },
      {
        title: "졸업관리", miniLabel: "졸업 관리", code: "L03GRDM",
        path: "pages/L03GRDM.html",
        enabled: true,
        children: [
          { title: "졸업이수 기준 정보", miniLabel: "졸업기준 정보", code: "L04GRDI", path: "pages/L04GRDI.html", enabled: true },
          { title: "졸업예정자 졸업사정 확인", miniLabel: "졸업사정 확인", code: "L04GRDC", path: "pages/L04GRDC.html", enabled: true },
          { title: "조기졸업 신청", miniLabel: "조기졸업 신청", code: "L04EGRD", path: "pages/L04EGRD.html", enabled: true },
          { title: "학사학위 취득유예 신청", miniLabel: "학사학위 취득유예", code: "L04DEFR", path: "pages/L04DEFR.html", enabled: true }
        ]
      }
    ]
  },

  {
    title: "정보공유", miniLabel: "정보 공유", code: "L02INFO",
    path: "pages/L02INFO.html",
    enabled: true,
    folder: "pages/",
    children: [
      {
        title: "커뮤니티", miniLabel: "커뮤니티", code: "L03CMTY",
        path: "pages/L03CMTY.html",
        enabled: true,
        children: [
          { title: "Q&A", miniLabel: "주요 질문", code: "L04QNAA", path: "pages/L04QNAA.html", enabled: true },
          { title: "공지사항", miniLabel: "공지", code: "L04IFNT", path: "pages/L04IFNT.html", enabled: true },
          { title: "설문조사", miniLabel: "설문 조사", code: "L04SURV", path: "pages/L04SURV.html", enabled: true },
          { title: "시설 관련 요청", miniLabel: "시설 요청", code: "L04FARE", path: "pages/L04FARE.html", enabled: true }
        ]
      },
      {
        title: "기타", miniLabel: "", code: "L03ETCS",
        path: "pages/L03ETCS.html",
        enabled: true,
        children: [
          { title: "시설 관련 요청", miniLabel: "시설 요청", code: "L04ETFA", path: "pages/L04ETFA.html", enabled: true }
        ]
      }
    ]
  },

  {
    title: "My Page", miniLabel: "마이 페이지", code: "L02MYPG",
    path: "pages/L02MYPG.html",
    enabled: true,
    folder: "pages/",
    children: [
      {
        title: "나의정보", miniLabel: "나의 정보", code: "L03MYIN",
        path: "pages/L03MYIN.html",
        enabled: true,
        children: [
          { title: "My 정보", miniLabel: "MY 정보", code: "L04MYIF", path: "pages/L04MYIF.html", enabled: true },
          { title: "My 역량개발", miniLabel: "MY 역량개발", code: "L04MYCP", path: "pages/L04MYCP.html", enabled: true },
          { title: "My 직무역량", miniLabel: "MY 직무역량", code: "L04MYJB", path: "pages/L04MYJB.html", enabled: true },
          { title: "My 대학생활 로드맵", miniLabel: "MY 로드맵", code: "L04MYLF", path: "pages/L04MYLF.html", enabled: true },
          { title: "My 커리어", miniLabel: "MY 커리어", code: "L04MYCR", path: "pages/L04MYCR.html", enabled: true },
          { title: "입학 전 학습경험 등록", miniLabel: "입학전 경험등록", code: "L04PREX", path: "pages/L04PREX.html", enabled: true },
          { title: "학습경험 인증 현황", miniLabel: "학습경험 인증현황", code: "L04EXCH", path: "pages/L04EXCH.html", enabled: true }
        ]
      }
    ]
  }
];