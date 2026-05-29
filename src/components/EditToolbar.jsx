'use client';

import React from 'react';
import { Edit2, Save, RotateCcw, Eye, CheckCircle, Cloud } from 'lucide-react';

export default function EditToolbar({
  isEditMode,
  editModeType,
  onTypeChange,
  onToggleEdit,
  onReset,
  onSubmit,
  onPreview,
  onSaveDraft,
  isSavingDraft,
  draftStatusLabel,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center gap-2" data-guide-id="edit-basic-toolbar" data-guide-target="edit-ui">
        <button
          onClick={onToggleEdit}
          data-guide-id="start-edit-button"
          data-guide-target="edit-button"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isEditMode
              ? 'bg-[#004f91] text-white shadow-blue-100'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
        >
          {isEditMode ? <CheckCircle size={18} /> : <Edit2 size={18} />}
          {isEditMode ? '편집 완료' : '메뉴 편집하기'}
        </button>

        {isEditMode && (
          <div className="flex bg-slate-100 p-1 rounded-lg" data-guide-target="mode-switch">
            <button
              onClick={() => onTypeChange('list')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${editModeType === 'list' ? 'bg-white text-[#004f91] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              리스트 편집
            </button>
            <button
              onClick={() => onTypeChange('visual')}
              data-guide-id="visual-mode-tab"
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${editModeType === 'visual' ? 'bg-white text-[#004f91] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              화면에서 편집
            </button>
          </div>
        )}

        {isEditMode && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="초기 상태로 되돌리기"
          >
            <RotateCcw size={18} />
            <span>초기화</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2" data-guide-id="top-submit-actions" data-guide-target="top-actions">
        <div className="hidden md:block text-xs font-medium text-slate-400 mr-1">
          {draftStatusLabel}
        </div>

        <button
          onClick={onSaveDraft}
          disabled={isSavingDraft}
          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
        >
          <Cloud size={18} />
          <span>{isSavingDraft ? '저장 중...' : '임시저장'}</span>
        </button>

        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
        >
          <Eye size={18} />
          <span>미리보기</span>
        </button>

        <button
          onClick={onSubmit}
          data-guide-id="final-submit-button"
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl"
        >
          <Save size={18} />
          <span>최종 제출</span>
        </button>
      </div>
    </div>
  );
}
