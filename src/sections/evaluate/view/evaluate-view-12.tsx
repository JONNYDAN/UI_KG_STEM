import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useAuth } from 'src/contexts/AuthContext';
import { DashboardContent } from 'src/layouts/dashboard';
import { evaluation12Service } from 'src/services/evaluation12Service';
import { EvaluationSection, UploadedFileInfo, EvaluationFormData } from 'src/services/type';

import { EvaluateFormBody12 } from '../form-evaluate-body-12';
import { EvaluateFormHeader12 } from '../form-evalute-header-12';
import { EvaluateFormFooter12 } from '../form-evalute-footer-12';

// ----------------------------------------------------------------------

interface Evaluate12ViewProps {
  formType?: '12A' | '12B';
  currentGroup?: string;
}

const ViewRoles = [
  'Hieu_truong',
  'Pho_hieu_truong_1',
  'Pho_hieu_truong_2', 
  'Pho_hieu_truong_3',
  'tham_dinh_ttdt',
  'tham_dinh_tchc',
  'tham_dinh_khcn',
  'tham_dinh_ktdbcl',
  'tham_dinh_ctct',
  'tham_dinh_dt'
];

export function Evaluate12View({ formType = '12A' }: Evaluate12ViewProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [evaluationData, setEvaluationData] = useState<EvaluationFormData | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<EvaluationFormData | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [currentGroup, setCurrentGroup] = useState<string>('');
  const [isViewingGroup, setIsViewingGroup] = useState(false);
  const [groupEvaluations, setGroupEvaluations] = useState<any[]>([]);
  const [selectedStaffCode, setSelectedStaffCode] = useState<string>('');
  const [reviewerData, setReviewerData] = useState<any>(null);
  const [savingReviewer, setSavingReviewer] = useState(false);

  // Hàm extract group từ URL - nhiều pattern khác nhau
  const extractGroupFromURL = (pathname: string): string | null => {
    // console.log('Extracting group from pathname:', pathname);
    
    // Pattern 1: /evaluate/hieu-truong/khoa_giao_duc_tieu_hoc
    if (pathname.includes('/evaluate/hieu-truong/')) {
      const parts = pathname.split('/');
      const hieuTruongIndex = parts.findIndex(part => part === 'hieu-truong');
      if (hieuTruongIndex > 0 && hieuTruongIndex + 1 < parts.length) {
        const group = parts[hieuTruongIndex + 1];
        // console.log('Found group (pattern 1):', group);
        return group;
      }
    }
    
    // Pattern 2: /evaluate/:role/:group
    const parts = pathname.split('/').filter(part => part);
    if (parts.length >= 3) {
      const group = parts[2];
      // console.log('Found group (pattern 2):', group);
      return group;
    }
    
    // console.log('No group found in URL');
    return null;
  };

  const checkUserPermissionForItem = (item: any, userRole: string, scoreType: 'thamDinhScore' | 'hieuTruongScore'): boolean => {
    if (!item || !userRole) return false;
    
    const isBot = userRole.includes('bot_');
    const isPrincipal = userRole === 'Hieu_truong';
    const isVicePrincipal = userRole.startsWith('Pho_hieu_truong');
    const isThamDinh = userRole.startsWith('tham_dinh_');
    const isViewer = isPrincipal || isVicePrincipal || isThamDinh;
    
    // Bot role không được chấm thamDinhScore và hieuTruongScore
    if (isBot) return false;
    
    // Kiểm tra quyền dựa trên hasRole
    if (item.hasRole) {
      // Nếu có hasRole, user phải có role trong danh sách
      const hasAccess = item.hasRole.includes(userRole);
      
      // Thêm điều kiện cho hieuTruongScore
      if (scoreType === 'hieuTruongScore') {
        return hasAccess && isPrincipal;
      }
      
      return hasAccess;
    }
    
    // Nếu không có hasRole, áp dụng quyền mặc định
    if (scoreType === 'thamDinhScore') {
      // Tất cả viewer đều có thể chấm thamDinhScore
      return isViewer;
    } else if (scoreType === 'hieuTruongScore') {
      // Chỉ hiệu trưởng có thể chấm hieuTruongScore
      return isPrincipal;
    }
    
    return false;
  };

  const isViewerRole = (role: string): boolean => 
    role.includes('Hieu_truong') || 
    role.includes('Pho_hieu_truong') || 
    role.includes('tham_dinh_');

  // Kiểm tra xem user có role trong ViewRoles không
  const isViewRole = user?.role && ViewRoles.includes(user.role);

  // console.log("isViewRole", isViewRole);
  
  // Thêm useEffect để kiểm tra và tự động load bản nháp
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsViewingGroup(false);
        setCurrentGroup('');

        // Lấy group từ URL nếu có
        const groupFromURL = extractGroupFromURL(location.pathname);
        if (groupFromURL) {
          setCurrentGroup(groupFromURL);
        }

        // Xác định phương thức fetch dữ liệu
        let fetchMethod: 'draft' | 'group' | 'role' | 'default' = 'default';
        
        // KIỂM TRA VÀ LOAD DRAFT DATA TRƯỚC (chỉ khi KHÔNG phải view group)
        if (user && !(isViewRole && groupFromURL)) {
          try {
            const draftResult = await evaluation12Service.checkDraft();

            if (draftResult.success && draftResult.hasDraft && draftResult.draftData) {
              setHasDraft(true);
              setDraftData(draftResult.draftData);
              setEvaluationData(draftResult.draftData);
              setLoading(false);
              setLoadingDraft(false);
              // console.log('Loaded draft data successfully');
              return;
            }
          } catch (draftError) {
            console.error('Error checking draft:', draftError);
          }
        }

        let response: any = null;

        // Nếu user có role trong ViewRoles và có group từ URL, fetch bằng getEvaluationByGroup
        if (isViewRole && groupFromURL) {
          // console.log(`User is view role (${user.role}) with group: ${groupFromURL}`);
          fetchMethod = 'group';
          setIsViewingGroup(true);
          
          // Gọi API lấy dữ liệu theo group
          response = await evaluation12Service.getEvaluationByGroup(groupFromURL);
          
          // console.log('Group fetch response:', response);
          
          if (response.success && response.reviewData && response.reviewData.length > 0) {
            // Lưu tất cả evaluations của group
            setGroupEvaluations(response.reviewData);
            
            // Lấy evaluation đầu tiên để hiển thị
            const firstEvaluation = response.reviewData[0];
            setEvaluationData(firstEvaluation);
            setSelectedStaffCode(firstEvaluation.staffCode);
            
            // Nếu có submitted data, set alreadySubmitted = true để chuyển sang chế độ read-only
            if (firstEvaluation.dataType === 'reviewData' || firstEvaluation.status === 'submitted') {
              setAlreadySubmitted(true);
            }
          } else {
            // Không có dữ liệu, dùng mock data
            if (user?.role) {
              response = await evaluation12Service.getEvaluationDataByRole(user.role);
            } else {
              response = await evaluation12Service.getAllEvaluationData();
            }
          }
        } 
        // Nếu user có role, fetch bằng getEvaluationDataByRole
        else if (user?.role) {
          fetchMethod = 'role';
          response = await evaluation12Service.getEvaluationDataByRole(user.role);
        }
        // Mặc định
        else {
          response = await evaluation12Service.getAllEvaluationData();
        }

        // Xử lý response
        if (response) {
          // Nếu là response từ group fetch, đã xử lý ở trên
          if (fetchMethod !== 'group') {
            // Lấy data từ response
            if (response?.data) {
              setEvaluationData(response.data);
            } else if (response) {
              // Nếu response không có data nhưng có dữ liệu trực tiếp
              setEvaluationData(response);
            } else {
              throw new Error('Dữ liệu không hợp lệ');
            }
          }
        } else {
          throw new Error('Không nhận được phản hồi từ server');
        }
      } catch (err) {
        const errorMessage = 'Không thể tải dữ liệu đánh giá. Vui lòng thử lại sau.';
        setError(errorMessage);
        console.error('Error fetching evaluation data:', err);
        setEvaluationData(null);
      } finally {
        setLoading(false);
        setLoadingDraft(false);
      }
    };

    fetchData();
  }, [user, location.pathname]); // Thêm location.pathname vào dependency


  //check if user already submitted form (chỉ cho user tự đánh giá)
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      if (!user || isViewingGroup) return; // Không check nếu đang xem group

      try {
        const storedToken = localStorage.getItem('authToken');
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/evaluation/12/check-submitted`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        const result = await response.json();
        if (result.success && result.alreadySubmitted) {
          setAlreadySubmitted(true);
        }
      } catch (fetchError) {
        console.error('Error checking submission status:', fetchError);
      }
    };

    checkSubmissionStatus();
  }, [user, isViewingGroup]);

  // Thêm hàm lưu điểm chấm của reviewer
  const handleSaveReviewerScore = async () => {
    if (!evaluationData) {
      setError('Không có dữ liệu để lưu');
      return;
    }

    try {
      setSavingReviewer(true);
      setError(null);
      setSuccessMessage(null);

      // Tạo dữ liệu lưu chấm điểm
      const reviewerSubmissionData = {
        ...evaluationData,
        savedAt: new Date().toISOString(),
        role: user?.role,
        reviewerId: user?.id,
        reviewerName: user?.name,
        group: currentGroup || user?.group,
        isReviewerDraft: true
      };

      // GỬI DỮ LIỆU LÊN SERVER ĐỂ LƯU CHẤM ĐIỂM
      const result = await evaluation12Service.saveReviewerEvaluation(reviewerSubmissionData);

      if (result.success) {
        setSuccessMessage(`Đã lưu chấm điểm thành công!`);

        setTimeout(() => {
          setSuccessMessage(null);
        }, 6000);
      }

    } catch (err) {
      const errorMessage = 'Không thể lưu chấm điểm. Vui lòng thử lại.';
      setError(errorMessage);
      console.error('Error saving reviewer score:', err);
    } finally {
      setSavingReviewer(false);
    }
  };

  // Hàm lưu nháp
  const handleSaveDraft = async () => {
    if (!evaluationData) {
      setError('Không có dữ liệu để lưu');
      return;
    }

    try {
      setSavingDraft(true);
      setError(null);
      setSuccessMessage(null);

      // Tạo dữ liệu lưu nháp
      const draftSubmissionData = {
        ...evaluationData,
        savedAt: new Date().toISOString(),
        role: user?.role,
        isDraft: true
      };

      // GỬI DỮ LIỆU LÊN SERVER ĐỂ LƯU NHÁP
      const result = await evaluation12Service.saveEvaluationAsDraft(draftSubmissionData);

      if (result.success) {
        setSuccessMessage(`Đã lưu nháp thành công!`);
        setHasDraft(true);

        setTimeout(() => {
          setSuccessMessage(null);
        }, 6000);
      }

    } catch (err) {
      const errorMessage = 'Không thể lưu nháp. Vui lòng thử lại.';
      setError(errorMessage);
      console.error('Error saving draft:', err);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleBodyDataChange = (updatedBody: EvaluationSection[]) => {
    if (evaluationData) {
      setEvaluationData({
        ...evaluationData,
        body: updatedBody,
      });
    }
  };

  const handleHeaderDataChange = (updatedHeaderData: any[]) => {
    if (evaluationData) {
      setEvaluationData({
        ...evaluationData,
        header: updatedHeaderData,
      });
    }
  };

  const handleFooterDataChange = (updatedFooterData: any[]) => {
    if (evaluationData) {
      setEvaluationData({
        ...evaluationData,
        footer: updatedFooterData,
      });
    }
  };

  // 1. Hàm cập nhật điểm số (chỉ cập nhật local state)
  // Cập nhật hàm xử lý score update để kiểm tra quyền
  const handleScoreUpdate = (
    sectionIndex: number,
    itemId: string,
    scores: {
      selfScore?: number;
      thamDinhScore?: number;
      hieuTruongScore?: number;
      subItemScores?: { [key: number]: number }
    }
  ) => {
    try {
      setUpdateError(null);

      if (!evaluationData || !user?.role) return;
      
      // Bot không được cập nhật thamDinhScore và hieuTruongScore
      if (user.role.includes('bot_')) {
        console.warn('Bot role không được chấm điểm tham định/hiệu trưởng');
        return;
      }

      // Tạo bản sao mới để cập nhật
      const updatedBody = [...evaluationData.body];

      // Tìm và cập nhật item
      if (updatedBody[sectionIndex]?.items) {
        const itemIndex = updatedBody[sectionIndex].items.findIndex((item) => item.id === itemId);
        
        if (itemIndex !== -1) {
          const item = updatedBody[sectionIndex].items[itemIndex];
          
          // Kiểm tra quyền cho từng loại điểm với item hiện tại
          if (scores.thamDinhScore !== undefined) {
            const canEditThamDinh = checkUserPermissionForItem(item, user.role, 'thamDinhScore');
            if (canEditThamDinh) {
              updatedBody[sectionIndex].items[itemIndex].thamDinhScore = scores.thamDinhScore;
            }
          }
          
          if (scores.hieuTruongScore !== undefined) {
            const canEditHieuTruong = checkUserPermissionForItem(item, user.role, 'hieuTruongScore');
            if (canEditHieuTruong) {
              updatedBody[sectionIndex].items[itemIndex].hieuTruongScore = scores.hieuTruongScore;
            }
          }

          // Cập nhật sub-item scores nếu có (cho hasContent)
          if (scores.subItemScores && updatedBody[sectionIndex].items[itemIndex].hasContent) {
            Object.entries(scores.subItemScores).forEach(([subIndex, score]) => {
              const subIdx = parseInt(subIndex);
              if (updatedBody[sectionIndex].items[itemIndex].hasContent?.[subIdx]) {
                const subItem = updatedBody[sectionIndex].items[itemIndex].hasContent![subIdx];
                
                // Xác định loại điểm cần kiểm tra
                const scoreType = scores.thamDinhScore !== undefined ? 'thamDinhScore' : 'hieuTruongScore';
                
                // Kiểm tra quyền cho sub-item
                const itemToCheck = subItem.hasRole ? subItem : item;
                const canEditSubItem = checkUserPermissionForItem(itemToCheck, user.role, scoreType);
                
                if (canEditSubItem) {
                  if (scoreType === 'thamDinhScore') {
                    updatedBody[sectionIndex].items[itemIndex].hasContent![subIdx].thamDinhScore = score;
                  } else {
                    updatedBody[sectionIndex].items[itemIndex].hasContent![subIdx].hieuTruongScore = score;
                  }
                }
              }
            });
          }
        }
      }

      // Cập nhật state
      setEvaluationData({
        ...evaluationData,
        body: updatedBody,
      });
    } catch (err) {
      const errorMessage = 'Không thể cập nhật điểm. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error updating scores:', err);
    }
  };

  // 2. Hàm xử lý single-choice selection (chỉ cập nhật local state)
  const handleSingleChoiceUpdate = (
    sectionIndex: number,
    itemId: string,
    selectedOption: string,
    scores: { selfScore: number; thamDinhScore?: number; hieuTruongScore?: number }
  ) => {
    try {
      setUpdateError(null);

      if (!evaluationData) return null;

      const updatedBody = [...evaluationData.body];
      
      if (updatedBody[sectionIndex]?.items) {
        const itemIndex = updatedBody[sectionIndex].items.findIndex((item) => item.id === itemId);
        
        if (itemIndex !== -1) {
          // Cập nhật thông tin
          updatedBody[sectionIndex].items[itemIndex] = {
            ...updatedBody[sectionIndex].items[itemIndex],
            selectedOption: selectedOption,
            selfScore: scores.selfScore,
            thamDinhScore: scores.thamDinhScore,
            hieuTruongScore: scores.hieuTruongScore,
          };

          setEvaluationData({
            ...evaluationData,
            body: updatedBody,
          });
        }
      }

      return updatedBody[sectionIndex].items.find((item) => item.id === itemId);
    } catch (err) {
      const errorMessage = 'Không thể cập nhật lựa chọn. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error updating single choice:', err);
      throw err;
    }
  };

  // 3. Hàm xử lý hasContent scoring (chỉ cập nhật local state)
  const handleHasContentScoreUpdate = (
    sectionIndex: number,
    itemId: string,
    contentIndex: number,
    scores: { selfScore: number; thamDinhScore?: number; hieuTruongScore?: number }
  ) => {
    try {
      setUpdateError(null);

      if (!evaluationData) return null;

      const updatedBody = [...evaluationData.body];
      
      if (updatedBody[sectionIndex]?.items) {
        const itemIndex = updatedBody[sectionIndex].items.findIndex((item) => item.id === itemId);
        
        if (itemIndex !== -1 && updatedBody[sectionIndex].items[itemIndex].hasContent) {
          const updatedItemData = { ...updatedBody[sectionIndex].items[itemIndex] };
          
          if (updatedItemData.hasContent && updatedItemData.hasContent[contentIndex]) {
            // Cập nhật điểm cho sub-content
            updatedItemData.hasContent[contentIndex] = {
              ...updatedItemData.hasContent[contentIndex],
              ...scores,
            };

            // Tính tổng điểm cho item chính
            const totalSelfScore = updatedItemData.hasContent.reduce(
              (sum, content) => sum + (content.selfScore || 0),
              0
            );
            updatedItemData.selfScore = totalSelfScore;

            updatedBody[sectionIndex].items[itemIndex] = updatedItemData;
            
            setEvaluationData({
              ...evaluationData,
              body: updatedBody,
            });
          }
        }
      }

      return updatedBody[sectionIndex].items.find((item) => item.id === itemId);
    } catch (err) {
      const errorMessage = 'Không thể cập nhật điểm cho nội dung. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error updating hasContent scores:', err);
      throw err;
    }
  };

  // 4. Hàm upload evidence files (chỉ cập nhật local state)
  const handleEvidenceUpload = async (
    sectionIndex: number,
    itemId: string,
    files: File[]
  ): Promise<UploadedFileInfo[]> => {
    try {
      // console.log('Uploading evidence:', { sectionIndex, itemId, files });
      
      // GỌI API THỰC TẾ
      const response = await evaluation12Service.uploadEvidence(
        sectionIndex,
        itemId,
        files,
      );

      // console.log('Upload response:', response);

      if (response.success && response.data && response.data.uploadedFiles) {
        const uploadedFiles = response.data.uploadedFiles.map((file: any) => ({
          originalname: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          url: file.url, // URL từ server (đã là filetmp)
          uploadedAt: file.uploadedAt || new Date().toISOString(),
          staffCode: file.staffCode,
        }));

        // CẬP NHẬT STATE SAU KHI UPLOAD THÀNH CÔNG
        if (evaluationData) {
          const updatedBody = [...evaluationData.body];
          
          if (updatedBody[sectionIndex]?.items) {
            // Check nếu itemId chứa _sub_ (là sub-item)
            const subItemMatch = itemId.match(/^(.+?)_sub_(\d+)$/);

            if (subItemMatch) {
              // Xử lý sub-item
              const parentItemId = subItemMatch[1];
              const subIndex = parseInt(subItemMatch[2], 10);
              const itemIndex = updatedBody[sectionIndex].items.findIndex(
                (item) => item.id === parentItemId
              );

              if (itemIndex !== -1 && updatedBody[sectionIndex].items[itemIndex].hasContent) {
                const hasContent = updatedBody[sectionIndex].items[itemIndex].hasContent;
                if (hasContent && hasContent[subIndex]) {
                  const currentFiles = hasContent[subIndex].evidenceFiles || [];
                  hasContent[subIndex].evidenceFiles = [
                    ...currentFiles,
                    ...uploadedFiles,
                  ];
                }
              }
            } else {
              // Xử lý regular item
              const itemIndex = updatedBody[sectionIndex].items.findIndex(
                (item) => item.id === itemId
              );
              
              if (itemIndex !== -1) {
                const currentFiles = updatedBody[sectionIndex].items[itemIndex].evidenceFiles || [];
                updatedBody[sectionIndex].items[itemIndex].evidenceFiles = [
                  ...currentFiles,
                  ...uploadedFiles,
                ];
              }
            }

            setEvaluationData({
              ...evaluationData,
              body: updatedBody,
            });
          }
        }

        return uploadedFiles;
      } else {
        throw new Error('Upload failed: ' + (response.error || 'Unknown error'));
      }
    } catch (uploadError) {
      console.error('Error uploading evidence:', uploadError);
      alert('Lỗi khi tải lên file. Vui lòng thử lại.');
      throw uploadError;
    }
  };

  const handleJustificationChange = (
    sectionIndex: number,
    itemId: string,
    justification: string
  ) => {
    console.log("justification", justification)
  };

  // Hàm xử lý khi người dùng rời focus (immediate update)
  const handleJustificationBlur = (
    sectionIndex: number,
    itemId: string,
    justification: string
  ) => {
    if (!evaluationData) return;

    try {
      setUpdateError(null);
      const updatedBody = [...evaluationData.body];
      
      if (updatedBody[sectionIndex]?.items) {
        const subItemMatch = itemId.match(/^(.+?)_sub_(\d+)$/);

        if (subItemMatch) {
          const parentItemId = subItemMatch[1];
          const subIndex = parseInt(subItemMatch[2], 10);
          const itemIndex = updatedBody[sectionIndex].items.findIndex(
            (item) => item.id === parentItemId
          );

          if (itemIndex !== -1 && updatedBody[sectionIndex].items[itemIndex].hasContent) {
            const hasContent = updatedBody[sectionIndex].items[itemIndex].hasContent;
            if (hasContent && hasContent[subIndex]) {
              hasContent[subIndex].justification = justification;
            }
          }
        } else {
          const itemIndex = updatedBody[sectionIndex].items.findIndex((item) => item.id === itemId);
          if (itemIndex !== -1) {
            updatedBody[sectionIndex].items[itemIndex].justification = justification;
          }
        }

        setEvaluationData({
          ...evaluationData,
          body: updatedBody,
        });
      }
    } catch (err) {
      const errorMessage = 'Không thể cập nhật biện minh. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error updating justification:', err);
    }
  };

  // 6. Hàm xử lý xóa evidence (chỉ cập nhật local state)
  const handleEvidenceRemove = (
    sectionIndex: number,
    itemId: string,
    fileIndex: number
  ) => {
    try {
      if (!evaluationData) return;

      // Cập nhật state sau khi xóa
      const updatedBody = [...evaluationData.body];

      if (updatedBody[sectionIndex]?.items) {
        // Check nếu itemId chứa _sub_ (là sub-item)
        const subItemMatch = itemId.match(/^(.+?)_sub_(\d+)$/);

        if (subItemMatch) {
          // Xử lý sub-item: "1.1_sub_0"
          const parentItemId = subItemMatch[1];
          const subIndex = parseInt(subItemMatch[2], 10);
          const itemIndex = updatedBody[sectionIndex].items.findIndex(
            (item) => item.id === parentItemId
          );

          if (itemIndex !== -1 && updatedBody[sectionIndex].items[itemIndex].hasContent) {
            const hasContent = updatedBody[sectionIndex].items[itemIndex].hasContent;
            if (hasContent && hasContent[subIndex] && hasContent[subIndex].evidenceFiles) {
              hasContent[subIndex].evidenceFiles.splice(fileIndex, 1);
            }
          }
        } else {
          // Xử lý regular item: "1.1", "2.1"
          const itemIndex = updatedBody[sectionIndex].items.findIndex(
            (item) => item.id === itemId
          );

          if (itemIndex !== -1 && updatedBody[sectionIndex].items[itemIndex].evidenceFiles) {
            updatedBody[sectionIndex].items[itemIndex].evidenceFiles.splice(fileIndex, 1);
          }
        }

        setEvaluationData({
          ...evaluationData,
          body: updatedBody,
        });
      }
    } catch (err) {
      console.error('Error deleting evidence:', err);
      throw err;
    }
  };

  // 7. Hàm thêm hoạt động mới cho điểm thưởng
  const handleAddActivity = (sectionIndex: number, itemIndex: number) => {
    if (alreadySubmitted || !evaluationData) return;

    setEvaluationData(prev => {
      if (!prev) return prev;

      const newData = JSON.parse(JSON.stringify(prev));
      const item = newData.body[sectionIndex].items[itemIndex];

      // Khởi tạo mảng hasActivity nếu chưa có
      if (!item.hasActivity) {
        item.hasActivity = [];
      }

      // Thêm activity mới với cấu trúc theo mock data
      const newActivity = {
        justification: '',
        selfScore: item.id === "3.1" ? 2 : 1,
        evidenceFiles: []
      };

      item.hasActivity.push(newActivity);

      // Cập nhật tổng điểm selfScore cho item dựa trên các activity
      item.selfScore = item.hasActivity.reduce((sum: number, activity: any) =>
        sum + (activity.selfScore || 0), 0
      );

      return newData;
    });
  };

  // 8. Hàm cập nhật justification cho activity (cho compatibility)
  const handleActivityJustificationUpdate = (
    sectionIndex: number,
    itemIndex: number,
    activityIndex: number,
    justification: string
  ) => {
    console.log("Activity justification changed locally:", justification);
  };

  // Hàm xử lý khi blur (immediate update) cho activity
  const handleActivityJustificationBlur = (
    sectionIndex: number,
    itemIndex: number,
    activityIndex: number,
    justification: string
  ) => {
    if (!evaluationData) return;

    try {
      setUpdateError(null);
      const updatedBody = [...evaluationData.body];

      if (updatedBody[sectionIndex]?.items[itemIndex]?.hasActivity?.[activityIndex]) {
        updatedBody[sectionIndex].items[itemIndex].hasActivity[activityIndex].justification = justification;

        setEvaluationData({
          ...evaluationData,
          body: updatedBody,
        });
      }
    } catch (err) {
      const errorMessage = 'Không thể cập nhật nội dung hoạt động. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error updating activity justification:', err);
    }
  };

  // 9. Hàm cập nhật điểm cho activity
  const handleActivityScoreUpdate = useCallback((
    sectionIndex: number,
    itemIndex: number,
    activityIndex: number,
    type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore',
    value: number
  ) => {
    try {
      setUpdateError(null);

      if (!evaluationData) {
        throw new Error('Không có dữ liệu đánh giá');
      }

      // Cập nhật state
      const updatedBody = [...evaluationData.body];

      if (updatedBody[sectionIndex]?.items[itemIndex]?.hasActivity?.[activityIndex]) {
        updatedBody[sectionIndex].items[itemIndex].hasActivity[activityIndex][type] = value;

        setEvaluationData({
          ...evaluationData,
          body: updatedBody,
        });
      }

      return { success: true };
    } catch (err) {
      const errorMessage = 'Không thể cập nhật điểm hoạt động. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error updating activity score:', err);
      throw err;
    }
  }, [evaluationData, setUpdateError]);

  // 10. Hàm upload evidence cho activity - Gọi API trực tiếp
  const handleActivityEvidenceUpload = async (
    sectionIndex: number,
    itemIndex: number,
    activityIndex: number,
    files: File[]
  ): Promise<UploadedFileInfo[]> => {
    try {
      if (!evaluationData) {
        throw new Error('Không có dữ liệu đánh giá');
      }

      // Tìm item bonus theo itemIndex
      const bonusItem = evaluationData.body[sectionIndex]?.items[itemIndex];
      if (!bonusItem || !bonusItem.id) {
        throw new Error('Không tìm thấy item bonus');
      }

      // Tạo itemId cho activity: "3.1_activity_0"
      const itemId = `${bonusItem.id}_activity_${activityIndex}`;

      // console.log('Uploading activity evidence:', { 
      //   sectionIndex, 
      //   itemIndex, 
      //   activityIndex, 
      //   itemId,
      //   filesCount: files.length 
      // });

      // GỌI API THỰC TẾ
      const response = await evaluation12Service.uploadEvidence(
        sectionIndex,
        itemId,
        files
      );

      // console.log('Activity upload response:', response);

      if (response.success && response.data && response.data.uploadedFiles) {
        const uploadedFiles = response.data.uploadedFiles.map((file: any) => ({
          originalname: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          url: file.url, // URL từ server (đã là filetmp)
          uploadedAt: file.uploadedAt || new Date().toISOString(),
          staffCode: file.staffCode,
        }));

        // Cập nhật state cho activity
        const updatedBody = [...evaluationData.body];

        if (updatedBody[sectionIndex]?.items[itemIndex]?.hasActivity?.[activityIndex]) {
          const currentFiles = updatedBody[sectionIndex].items[itemIndex].hasActivity[activityIndex].evidenceFiles || [];
          updatedBody[sectionIndex].items[itemIndex].hasActivity[activityIndex].evidenceFiles = [
            ...currentFiles,
            ...uploadedFiles,
          ];

          setEvaluationData({
            ...evaluationData,
            body: updatedBody,
          });
        }

        return uploadedFiles;
      } else {
        throw new Error('Upload failed: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error uploading activity evidence:', err);
      alert('Lỗi khi tải lên file. Vui lòng thử lại.');
      throw err;
    }
  };

  // 11. Hàm xóa evidence cho activity
  const handleActivityEvidenceRemove = (
    sectionIndex: number,
    itemIndex: number,
    activityIndex: number,
    fileIndex: number
  ) => {
    try {
      if (!evaluationData) return;

      const updatedBody = [...evaluationData.body];

      // Xóa file từ activity
      if (updatedBody[sectionIndex]?.items[itemIndex]?.hasActivity?.[activityIndex]?.evidenceFiles) {
        updatedBody[sectionIndex].items[itemIndex].hasActivity[activityIndex].evidenceFiles.splice(fileIndex, 1);
      }

      setEvaluationData({
        ...evaluationData,
        body: updatedBody,
      });
    } catch (err) {
      console.error('Error removing activity evidence:', err);
      throw err;
    }
  };

  // Thêm hàm xử lý xóa activity
  const handleRemoveActivity = (
    sectionIndex: number,
    itemIndex: number,
    activityIndex: number
  ) => {
    try {
      if (!evaluationData) {
        throw new Error('Không có dữ liệu đánh giá');
      }

      // Cập nhật state
      const updatedBody = [...evaluationData.body];
      
      if (updatedBody[sectionIndex]?.items[itemIndex]?.hasActivity) {
        // Xóa activity khỏi mảng
        updatedBody[sectionIndex].items[itemIndex].hasActivity!.splice(activityIndex, 1);
        
        // Tính lại tổng điểm selfScore cho item (nếu có activities)
        const item = updatedBody[sectionIndex].items[itemIndex];
        if (item.hasActivity && item.hasActivity.length > 0) {
          item.selfScore = item.hasActivity.reduce(
            (sum: number, activity: any) => sum + (activity.selfScore || 0), 
            0
          );
        } else {
          // Nếu không còn activity nào, set điểm về 0
          item.selfScore = 0;
        }

        setEvaluationData({
          ...evaluationData,
          body: updatedBody,
        });
      }

    } catch (err) {
      const errorMessage = 'Không thể xóa hoạt động. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error removing activity:', err);
      throw err;
    }
  };

  // Hàm xử lý blur cho điểm thẩm định (cho regular items) - CẬP NHẬT THÊM 'selfScore'
  const handleRegularScoreBlur = (
    sectionIndex: number,
    itemIndex: number,
    type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore',
    value: number
  ) => {
    if (!evaluationData || !user?.role) return;
    
    const item = evaluationData.body[sectionIndex]?.items[itemIndex];
    if (!item) return;
    
    // Chỉ xử lý thamDinhScore và hieuTruongScore
    if (type === 'selfScore') {
      return; // Không xử lý selfScore vì chỉ có bot mới được sửa
    }
    
    // Kiểm tra quyền
    const canEdit = checkUserPermissionForItem(item, user.role, type);
    
    if (canEdit) {
      if (type === 'thamDinhScore') {
        handleScoreUpdate(sectionIndex, item.id, { thamDinhScore: value });
      } else if (type === 'hieuTruongScore') {
        handleScoreUpdate(sectionIndex, item.id, { hieuTruongScore: value });
      }
    } else {
      console.warn(`User ${user.role} không có quyền chấm ${type} cho item ${item.id}`);
    }
  };

  // Hàm xử lý blur cho sub-items trong hasContent - CẬP NHẬT THÊM 'selfScore'
  const handleSubItemScoreBlur = (
    sectionIndex: number,
    itemIndex: number,
    subIndex: number,
    type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore',
    value: number
  ) => {
    if (!evaluationData || !user?.role) return;
    
    const item = evaluationData.body[sectionIndex]?.items[itemIndex];
    if (!item || !item.hasContent || !item.hasContent[subIndex]) return;
    
    const subItem = item.hasContent[subIndex];
    
    // Chỉ xử lý thamDinhScore và hieuTruongScore
    if (type === 'selfScore') {
      return; // Không xử lý selfScore
    }
    
    // Kiểm tra quyền: ưu tiên dùng hasRole của sub-item, nếu không có thì dùng của item cha
    const itemToCheck = subItem.hasRole ? subItem : item;
    const canEdit = checkUserPermissionForItem(itemToCheck, user.role, type);
    
    if (canEdit) {
      // Cập nhật điểm cho sub-item
      const updatedBody = [...evaluationData.body];
      
      if (type === 'thamDinhScore') {
        updatedBody[sectionIndex].items[itemIndex].hasContent![subIndex].thamDinhScore = value;
      } else {
        updatedBody[sectionIndex].items[itemIndex].hasContent![subIndex].hieuTruongScore = value;
      }
      
      setEvaluationData({
        ...evaluationData,
        body: updatedBody,
      });
      
      // Gọi handleScoreUpdate để đồng bộ với API nếu cần
      handleScoreUpdate(sectionIndex, item.id, { 
        thamDinhScore: type === 'thamDinhScore' ? value : undefined,
        hieuTruongScore: type === 'hieuTruongScore' ? value : undefined
      });
    } else {
      console.warn(`User ${user.role} không có quyền chấm ${type} cho sub-item ${subIndex} của item ${item.id}`);
    }
  };

  // Hàm xử lý blur cho activity scores - CẬP NHẬT THÊM 'selfScore'
  const handleActivityScoreBlur = useCallback((
    sectionIndex: number,
    itemIndex: number,
    activityIndex: number,
    type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore',
    value: number
  ) => {
    if (!evaluationData || !user?.role) return;
    
    const item = evaluationData.body[sectionIndex]?.items[itemIndex];
    if (!item || !item.hasActivity || !item.hasActivity[activityIndex]) return;
    
    const activity = item.hasActivity[activityIndex];
    
    // Chỉ xử lý thamDinhScore và hieuTruongScore
    if (type === 'selfScore') {
      return; // Không xử lý selfScore
    }
    
    // Kiểm tra quyền: ưu tiên dùng hasRole của activity, nếu không có thì dùng của item cha
    const itemToCheck = activity.hasRole ? activity : item;
    const canEdit = checkUserPermissionForItem(itemToCheck, user.role, type);
    
    if (canEdit) {
      // Gọi hàm handleActivityScoreUpdate đã có
      handleActivityScoreUpdate(sectionIndex, itemIndex, activityIndex, type, value);
    } else {
      console.warn(`User ${user.role} không có quyền chấm ${type} cho activity ${activityIndex} của item ${item.id}`);
    }
  }, [evaluationData, user?.role, handleActivityScoreUpdate]);

  // Hàm xử lý blur cho hasContent items (alias của handleSubItemScoreBlur)
  const handleHasContentScoreBlur = handleSubItemScoreBlur;

  // Hàm xử lý nộp phiếu
  const handleSubmit = async () => {
    if (!evaluationData) {
      setError('Không có dữ liệu để nộp');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submissionData = {
        ...evaluationData,
        submittedAt: new Date().toISOString(),
        role: user?.role,
      };

      const result = await evaluation12Service.saveEvaluationAsJSON(submissionData);

      if (result.success) {
        setSuccessMessage(`Đã lưu phiếu đánh giá thành công!`);
        setAlreadySubmitted(true);
        setHasDraft(false);

        // Xóa bản nháp sau khi nộp thành công
        try {
          await evaluation12Service.deleteDraft();
        } catch (draftError) {
          console.error('Error deleting draft after submission:', draftError);
        }
      }
    } catch (err) {
      const errorMessage = 'Không thể lưu phiếu đánh giá. Vui lòng thử lại.';
      setError(errorMessage);
      console.error('Error submitting evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Thêm loading state
  if (loading || loadingDraft) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Box component="span" sx={{ ml: 2 }}>
          {loadingDraft ? 'Đang kiểm tra bản nháp...' : 'Đang tải dữ liệu đánh giá...'}
        </Box>
      </Box>
    );
  }

  if (!user) {
    return (
      <DashboardContent maxWidth="xl">
        <Alert severity="warning" sx={{ mt: 2 }}>
          Vui lòng đăng nhập để sử dụng tính năng đánh giá.
        </Alert>
      </DashboardContent>
    );
  }

  if (!evaluationData) {
    return (
      <DashboardContent maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          Không thể tải dữ liệu đánh giá. Vui lòng thử lại.
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      {error && (
        <Box mb={3}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {updateError && (
        <Box mb={3}>
          <Alert severity="error" onClose={() => setUpdateError(null)}>
            {updateError}
          </Alert>
        </Box>
      )}

      {/* Header */}
      {evaluationData?.header && (
        <EvaluateFormHeader12
          headerData={evaluationData.header}
          titleRole={`Đối với các đơn vị ${getRoleDisplayName(user?.role || '')}`}
          onHeaderDataChange={handleHeaderDataChange}
          readOnly={alreadySubmitted}
          userGroup={user.group}
          isReviewData={isViewingGroup}
        />
      )}

      {/* Body */}
      {evaluationData?.body && (
        <EvaluateFormBody12
          title={`PHIẾU ĐÁNH GIÁ ${formType === '12A' ? 'ĐƠN VỊ GIẢNG DẠY' : 'ĐƠN VỊ HÀNH CHÍNH'}`}
          sections={evaluationData.body}
          onScoreUpdate={handleScoreUpdate}
          onSingleChoiceUpdate={handleSingleChoiceUpdate}
          onHasContentScoreUpdate={handleHasContentScoreUpdate}
          onEvidenceUpload={handleEvidenceUpload}
          onEvidenceRemove={handleEvidenceRemove}
          onJustificationUpdate={handleJustificationChange} 
          onJustificationBlur={handleJustificationBlur}
          onAddActivity={handleAddActivity}
          onActivityJustificationUpdate={handleActivityJustificationUpdate}
          onActivityJustificationBlur={handleActivityJustificationBlur}
          onActivityScoreUpdate={handleActivityScoreUpdate}
          onActivityEvidenceUpload={handleActivityEvidenceUpload}
          onActivityEvidenceRemove={handleActivityEvidenceRemove}
          onRemoveActivity={handleRemoveActivity}
          onDataChange={handleBodyDataChange}

          onScoreBlur={handleRegularScoreBlur}
          onSubItemScoreBlur={handleSubItemScoreBlur}
          onHasContentScoreBlur={handleHasContentScoreBlur}
          onActivityScoreBlur={handleActivityScoreBlur}

          formType={formType}
          readOnly={isViewRole ? false : alreadySubmitted}
          currentUserRole={user.role}
        />
      )}

      {/* Footer */}
      {evaluationData?.footer && (
        <EvaluateFormFooter12
          footerData={evaluationData.footer}
          onFooterDataChange={handleFooterDataChange}
        />
      )}

      {/* Cập nhật phần render action buttons để hiển thị nút "Lưu chấm điểm" */}
      {isViewRole && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 2, sm: 3 },
            mt: 4,
            mb: 4,
            width: '100%',
          }}
        >
          {/* Nút Lưu chấm điểm cho reviewer */}
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleSaveReviewerScore}
            disabled={savingReviewer}
            sx={{
              px: { xs: 3, sm: 4 },
              py: { xs: 1.25, sm: 1.5 },
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 'bold',
              minWidth: { xs: '100%', sm: '260px' },
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: 'none', sm: '260px' },
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 1, sm: 1.2 },
            }}
          >
            {savingReviewer ? (
              <>
                <CircularProgress size={22} thickness={5} sx={{ color: 'white' }} />
                <Box component="span" sx={{ ml: 1, fontSize: { xs: '0.9rem', sm: 'inherit' } }}>
                  Đang lưu...
                </Box>
              </>
            ) : (
              <>
                <SaveIcon sx={{ color: 'white', fontSize: { xs: 24, sm: 26 } }} />
                <Box component="span" sx={{ fontSize: { xs: '0.9rem', sm: 'inherit' } }}>
                  Lưu chấm điểm
                </Box>
              </>
            )}
          </Button>
        </Box>
      )}

      {/* Action Buttons */}
      {!isViewRole && !alreadySubmitted && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 2, sm: 3 },
            mt: 4,
            mb: 4,
            width: '100%',
          }}
        >
          {/* Nút Lưu nháp */}
          <Button
            variant="outlined"
            size="large"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            sx={{
              px: { xs: 3, sm: 4 },
              py: { xs: 1.25, sm: 1.5 },
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 'bold',
              minWidth: { xs: '100%', sm: '200px' },
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: 'none', sm: '200px' },
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            {savingDraft ? (
              <>
                <CircularProgress size={20} />
                <Box component="span">Đang lưu...</Box>
              </>
            ) : (
              <>
                <SaveIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                <Box component="span">Lưu nháp</Box>
              </>
            )}
          </Button>

          {/* Nút nộp */}
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              px: { xs: 3, sm: 4 },
              py: { xs: 1.25, sm: 1.5 },
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 'bold',
              minWidth: { xs: '100%', sm: '260px' },
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: 'none', sm: '260px' },
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 1, sm: 1.2 },
            }}
          >
            {submitting ? (
              <>
                <CircularProgress size={22} thickness={5} sx={{ color: 'white' }} />
                <Box component="span" sx={{ ml: 1, fontSize: { xs: '0.9rem', sm: 'inherit' } }}>
                  Đang nộp...
                </Box>
              </>
            ) : (
              <>
                <SendIcon sx={{ color: 'white', fontSize: { xs: 24, sm: 26 } }} />
                <Box component="span" sx={{ fontSize: { xs: '0.9rem', sm: 'inherit' } }}>
                  Nộp phiếu đánh giá
                </Box>
              </>
            )}
          </Button>
        </Box>
      )}

      {/* Thông báo đã nộp */}
      {!isViewRole && alreadySubmitted && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Bạn đã nộp phiếu đánh giá thành công!
        </Alert>
      )}

      {/* Thông báo thành công */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          // Responsive cho mobile
          '& .MuiAlert-root': {
            width: '90%', // Chiếm 90% chiều rộng trên mobile
            maxWidth: { xs: '90vw', sm: '500px' },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            padding: { xs: '8px 12px', sm: '12px 16px' },
          },
        }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage(null)}
          icon={<CheckCircleIcon fontSize="inherit" />}
          sx={{
            width: '100%',
            alignItems: 'center',
            '& .MuiAlert-message': {
              padding: { xs: '4px 0', sm: '8px 0' },
            }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}

// Hàm helper để hiển thị tên role
function getRoleDisplayName(role: string): string {
  const roleNames: { [key: string]: string } = {
    'Hieu_truong': 'HIỆU TRƯỞNG KHỐI GIẢNG DẠY',
    'Pho_hieu_truong_1': 'PHÓ HIỆU TRƯỞNG',
    'Pho_hieu_truong_2': 'PHÓ HIỆU TRƯỞNG',
    'Pho_hieu_truong_3': 'PHÓ HIỆU TRƯỞNG',
    'bot_khoi_giang_day': 'KHỐI GIẢNG DẠY',
    'bot_khoi_hanh_chinh': 'KHỐI HÀNH CHÍNH',
    'tham_dinh_ttdt': 'THẨM ĐỊNH PHÒNG THANH TRA ĐÀO TẠO',
    'tham_dinh_tchc': 'THẨM ĐỊNH PHÒNG TỔ CHỨC HÀNH CHÍNH',
    'tham_dinh_khcn': 'THẨM ĐỊNH PHÒNG KHOA HỌC CÔNG NGHỆ',
    'tham_dinh_ktdbcl': 'THẨM ĐỊNH PHÒNG KHẢO THÍ & ĐBCL',
    'tham_dinh_ctct': 'THẨM ĐỊNH PHÒNG CTCT & HSSV',
    'tham_dinh_dt': 'THẨM ĐỊNH PHÒNG ĐÀO TẠO',
  };

  return roleNames[role] || role.toUpperCase();
}