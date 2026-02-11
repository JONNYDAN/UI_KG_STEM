export type EvaluationSubSubItem = {
  content: string;
  points: string;
  selfScore?: number;
  thamDinhScore?: number; // Dùng chung cho cả thamDinhScore và phoHieuTruongScore
  hieuTruongScore?: number;
  selectedOption?: string;
};

export type EvaluationSubItem = {
  content: string;
  points: string;
  selfScore?: number;
  thamDinhScore?: number;
  hieuTruongScore?: number;
  selectedOption?: string;
  hasType?: string;
  subItems?: EvaluationSubSubItem[];
};

export type EvaluationHasContentItem = {
  content: string;
  points: string;
  selfScore?: number;
  thamDinhScore?: number;
  hieuTruongScore?: number;
  selectedOption?: string;
  hasType?: string;
  hasEvidence?: boolean;
  evidenceFiles?: UploadedFileInfo[];
  justification?: string;
  subItems?: EvaluationSubSubItem[];
  hasRole?: []
};

export type UploadedFileInfo = {
  filename: string;
  originalname: string;
  path?: string;
  url: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  staffCode?: string;
};

export type Activity = {
  justification?: string;
  selfScore?: number;
  thamDinhScore?: number;
  hieuTruongScore?: number;
  evidenceFiles?: UploadedFileInfo[];
  hasRole?: [];
};

export type EvaluationItem = {
  id: string;
  title: string;
  content: string;
  points: string;
  selfScore: number;
  thamDinhScore?: number; // Dùng chung: thamDinhScore (12A) hoặc phoHieuTruongScore (12B)
  hieuTruongScore?: number;
  hasEvidence: boolean;
  hasType?: string;
  selectedOption?: string;
  justification?: string;
  evidenceFiles?: UploadedFileInfo[];
  subItems?: EvaluationSubItem[];
  hasContent?: EvaluationHasContentItem[];
  subItemScores?: { [key: string]: number };
  hasActivity?: Activity[];
  hasRole?: string[]; // Chỉ định vai trò được phép đánh giá mục này
};

export type EvaluationSection = {
  title: string;
  items: EvaluationItem[];
};

export type HeaderField = {
  title: string;
  answer: string;
};

export type FooterField = {
  title: string;
  answer: string;
  hasType?: string;
  options?: string[];
};

export type EvaluationFormData = {
  header: HeaderField[];
  body: EvaluationSection[];
  footer: FooterField[];
  submittedAt?: string;
  role?: string;
  isDraft?: boolean;
  savedAt?: string;
  fileName?: string;
  staffCode?: string;
  formType?: '12A' | '12B'; // Chỉ để biết loại form, không ảnh hưởng structure
};

export type EvidenceUploadProps = {
  files: UploadedFileInfo[];
  onFilesChange: (files: UploadedFileInfo[]) => void;
  onFileRemove: (index: number) => void;
  onUpload: (files: File[]) => Promise<UploadedFileInfo[]>;
  sectionIndex: number;
  itemId: string;
  onEvidenceDelete: (sectionIndex: number, itemId: string, fileIndex: number) => Promise<void>;
};

// Type cho service functions
export type ScoreUpdatePayload = {
  selfScore?: number;
  thamDinhScore?: number;
  hieuTruongScore?: number;
  subItemScores?: { [key: string]: number };
};

export type SingleChoiceUpdatePayload = {
  selectedOption: string;
  selfScore: number;
  thamDinhScore?: number;
  hieuTruongScore?: number;
};

export type HasContentScoreUpdatePayload = {
  selfScore: number;
  thamDinhScore?: number;
  hieuTruongScore?: number;
};

// Type cho component props
export type EvaluateFormBodyProps = {
  title: string;
  sections: EvaluationSection[];
  onScoreUpdate: (sectionIndex: number, itemId: string, scores: ScoreUpdatePayload) => Promise<any>;
  onSingleChoiceUpdate: (sectionIndex: number, itemId: string, selectedOption: string, scores: SingleChoiceUpdatePayload) => Promise<any>;
  onHasContentScoreUpdate: (sectionIndex: number, itemId: string, contentIndex: number, scores: HasContentScoreUpdatePayload) => Promise<any>;
  onEvidenceUpload: (sectionIndex: number, itemId: string, files: File[]) => Promise<UploadedFileInfo[]>;
  onEvidenceRemove?: (sectionIndex: number, itemId: string, fileIndex: number) => void;
  onJustificationUpdate: (sectionIndex: number, itemId: string, justification: string) => Promise<any>;
  readOnly?: boolean;
  formType?: '12A' | '12B'; // Chỉ để hiển thị UI
};

// Type cho user context
export type UserRole = 
  | 'Hieu_truong'
  | 'Pho_hieu_truong_1'
  | 'Pho_hieu_truong_2'
  | 'Pho_hieu_truong_3'
  | 'bot_khoi_giang_day'
  | 'bot_khoi_hanh_chinh';

export type UserData = {
  id: string;
  staffCode: string;
  name: string;
  role: UserRole;
  group: string[];
  username: string;
  password: string;
  photoURL: string;
};

// Type cho API responses
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  role?: string;
  isDraft?: boolean;
  draftSavedAt?: string;
  fileName?: string;
};

export type DraftCheckResponse = {
  success: boolean;
  hasDraft: boolean;
  draftData?: EvaluationFormData;
  fileName?: string;
};

export type SubmitResponse = {
  success: boolean;
  message: string;
  submittedAt?: string;
  movedFilesCount?: number;
  fileName?: string;
};

export type SaveDraftResponse = {
  success: boolean;
  message: string;
  fileName?: string;
  isDraft?: boolean;
  cleanedFilesCount?: number;
};

// Helper type để lấy label hiển thị
export type ScoreLabels = {
  principal: string;
  hieuTruong: string;
};

export const getScoreLabels = (formType?: '12A' | '12B'): ScoreLabels => {
  if (formType === '12A') {
    return {
      principal: 'Thẩm định',
      hieuTruong: 'Hiệu trưởng'
    };
  }
  return {
    principal: 'Phó hiệu trưởng',
    hieuTruong: 'Hiệu trưởng'
  };
};