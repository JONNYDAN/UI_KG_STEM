import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useAuth } from 'src/contexts/AuthContext';
import { DashboardContent } from 'src/layouts/dashboard';
import { evaluationService } from 'src/services/evaluationService';
import { EvaluationSection, UploadedFileInfo } from 'src/services/type';

import { EvaluateFormBody } from '../form-evalute-body';
import { EvaluateFormHeader } from '../form-evalute-header';
import { EvaluateFormFooter } from '../form-evalute-footer';

// ----------------------------------------------------------------------

interface EvaluationData {
  header: Array<{
    title: string;
    answer: string;
  }>;
  body: EvaluationSection[];
  footer: Array<{
    title: string;
    answer: string;
    hasType?: string;
    options?: string[];
  }>;
}

export function EvaluateView() {
  // const { user } = useAuth();
  const { user, token } = useAuth(); //truyền thêm token
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false); // trạng thái đã nộp form của user
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<EvaluationData | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);

  // Thêm useEffect để kiểm tra và tự động load bản nháp
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // KIỂM TRA VÀ LOAD DRAFT DATA TRƯỚC
        if (user) {
          try {
            const draftResult = await evaluationService.checkDraft();
            
            if (draftResult.success && draftResult.hasDraft) {
              setHasDraft(true);
              setDraftData(draftResult.draftData);
              setEvaluationData(draftResult.draftData);
              setLoading(false);
              return; 
            }
          } catch (draftError) {
            console.error('Error checking draft:', draftError);
          }
        }

        let response: any = null;

        if (user?.role) {
          response = await evaluationService.getEvaluationDataByRole(user.role);
        } else {
          response = await evaluationService.getAllEvaluationData();
        }

        // Lấy data từ response
        if (response?.success) {
          setEvaluationData(response.data);
        } else {
          throw new Error('Dữ liệu không hợp lệ');
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
  }, [user]);

  //check if user already submitted form
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      if (!user) return;

      try {
        const storedToken = localStorage.getItem('authToken');
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/evaluation/check-submitted`,
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
  }, [user]);

  // Hàm lưu nháp
  const handleSaveDraft = async () => {
    if (!evaluationData) {
      setError('Không có dữ liệu để lưu');
      return;
    }

    try {
      setSavingDraft(true);
      setError(null);

      // Tạo dữ liệu lưu nháp - ĐẢM BẢO LƯU TOÀN BỘ DỮ LIỆU
      const draftSubmissionData = {
        header: evaluationData.header,
        body: evaluationData.body,
        footer: evaluationData.footer,
        savedAt: new Date().toISOString(),
        role: user?.role,
        isDraft: true
      };

      // GỬI DỮ LIỆU LÊN SERVER ĐỂ LƯU NHÁP
      const result = await evaluationService.saveEvaluationAsDraft(draftSubmissionData);

      if (result.success) {
        setSuccessMessage(`Đã lưu nháp thành công!`);
        setHasDraft(true);
      }

    } catch (err) {
      const errorMessage = 'Không thể lưu nháp. Vui lòng thử lại.';
      setError(errorMessage);
      console.error('Error saving draft:', err);
    } finally {
      setSavingDraft(false);
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

  // 1. Hàm cập nhật điểm số thông thường
  const handleScoreUpdate = async (
    sectionIndex: number,
    itemId: string,
    scores: { selfScore?: number; principalScore?: number; subItemScores?: { [key: number]: number } }
  ) => {
    try {
      setUpdateError(null);
      
      const updatedItem = await evaluationService.updateEvaluationScores(
        sectionIndex,
        itemId,
        scores
      );

      // Cập nhật state DỰA TRÊN API RESPONSE - SỬA LẠI PHẦN NÀY
      if (evaluationData && updatedItem) {
        setEvaluationData(prev => {
          if (!prev) return prev;
          
          const updatedBody = [...prev.body];
          
          if (updatedBody[sectionIndex]?.items) {
            const itemIndex = updatedBody[sectionIndex].items.findIndex((item) => item.id === itemId);
            if (itemIndex !== -1) {
              // QUAN TRỌNG: Cập nhật TOÀN BỘ ITEM từ API response, bao gồm cả hasContent
              updatedBody[sectionIndex].items[itemIndex] = {
                ...updatedBody[sectionIndex].items[itemIndex],
                ...updatedItem, // Cập nhật tất cả properties từ server
              };
              
              console.log('✅ Updated state from API response - hasContent:', 
                updatedBody[sectionIndex].items[itemIndex].hasContent?.map((content, idx) => 
                  `${idx}: selfScore=${content.selfScore}`
                )
              );
            }
          }

          return {
            ...prev,
            body: updatedBody,
          };
        });
      }

      return updatedItem;
    } catch (err) {
      const errorMessage = 'Không thể cập nhật điểm. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('❌ Error updating scores:', err);
      throw err;
    }
  };

  // 2. Hàm xử lý single-choice selection
  const handleSingleChoiceUpdate = async (
    sectionIndex: number,
    itemId: string,
    selectedOption: string,
    scores: { selfScore: number; principalScore?: number }
  ) => {
    try {
      setUpdateError(null);
      
      // GỌI API ĐỂ CẬP NHẬT SINGLE CHOICE
      const updatedItem = await evaluationService.updateSingleChoiceSelection(
        sectionIndex,
        itemId,
        selectedOption,
        scores
      );

      // Cập nhật state sau khi API thành công
      if (evaluationData) {
        const updatedBody = [...evaluationData.body];
        if (updatedBody[sectionIndex]?.items) {
          const itemIndex = updatedBody[sectionIndex].items.findIndex((item) => item.id === itemId);
          if (itemIndex !== -1) {
            updatedBody[sectionIndex].items[itemIndex] = {
              ...updatedBody[sectionIndex].items[itemIndex],
              selectedOption: selectedOption,
              selfScore: scores.selfScore,
              // Cập nhật cả subItems nếu có
              ...(updatedBody[sectionIndex].items[itemIndex].subItems && {
                subItems: updatedBody[sectionIndex].items[itemIndex].subItems!.map((subItem, idx) => 
                  idx === 0 ? { ...subItem, selectedOption, selfScore: scores.selfScore } : subItem
                )
              })
            };
            
            setEvaluationData({
              ...evaluationData,
              body: updatedBody,
            });
          }
        }
      }

      return updatedItem;
    } catch (err) {
      const errorMessage = 'Không thể cập nhật lựa chọn. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error updating single choice:', err);
      throw err;
    }
  };

  // 3. Hàm xử lý hasContent scoring
  const handleHasContentScoreUpdate = async (
    sectionIndex: number,
    itemId: string,
    contentIndex: number,
    scores: { selfScore: number; principalScore?: number }
  ) => {
    try {
      setUpdateError(null);
      const updatedItem = await evaluationService.updateHasContentScores(
        sectionIndex,
        itemId,
        contentIndex,
        scores
      );

      // Cập nhật state
      if (evaluationData) {
        const updatedBody = [...evaluationData.body];
        if (updatedBody[sectionIndex]?.items) {
          const itemIndex = updatedBody[sectionIndex].items.findIndex((item) => item.id === itemId);
          if (itemIndex !== -1) {
            // Cập nhật điểm cho content item cụ thể
            const updatedItemData = { ...updatedBody[sectionIndex].items[itemIndex] };
            if (updatedItemData.hasContent && updatedItemData.hasContent[contentIndex]) {
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
      }

      return updatedItem;
    } catch (err) {
      const errorMessage = 'Không thể cập nhật điểm cho nội dung. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error updating hasContent scores:', err);
      throw err;
    }
  };

  // 4. Hàm upload evidence files
  const handleEvidenceUpload = async (
    sectionIndex: number,
    itemId: string,
    files: File[]
  ): Promise<UploadedFileInfo[]> => {
    try {
      const result = await evaluationService.uploadEvidence(
        sectionIndex,
        itemId,
        files,
        user?.role
      );

      // Lấy uploadedFiles từ result.data.uploadedFiles
      let uploadedFiles: UploadedFileInfo[] = [];

      if (result.success && result.data && result.data.uploadedFiles) {
        uploadedFiles = result.data.uploadedFiles;

        // CẬP NHẬT STATE SAU KHI UPLOAD THÀNH CÔNG
        if (evaluationData) {
          const updatedBody = [...evaluationData.body];
          if (updatedBody[sectionIndex]?.items) {
            const itemIndex = updatedBody[sectionIndex].items.findIndex(
              (item) => item.id === itemId
            );
            if (itemIndex !== -1) {
              const updatedItem = {
                ...updatedBody[sectionIndex].items[itemIndex],
                evidenceFiles: [
                  ...(updatedBody[sectionIndex].items[itemIndex].evidenceFiles || []),
                  ...uploadedFiles,
                ],
              };

              updatedBody[sectionIndex].items[itemIndex] = updatedItem;

              setEvaluationData({
                ...evaluationData,
                body: updatedBody,
              });
            }
          }
        }
      } else {
        console.error('Invalid response structure:', result);
      }

      return uploadedFiles;
    } catch (uploadError) {
      console.error('Error uploading evidence:', uploadError);
      throw uploadError;
    }
  };

  // 5. Hàm cập nhật justification
  const handleJustificationUpdate = async (
    sectionIndex: number,
    itemId: string,
    justification: string
  ) => {
    try {
      setUpdateError(null);

      // GỌI API ĐỂ CẬP NHẬT JUSTIFICATION
      const updatedItem = await evaluationService.updateJustification(
        sectionIndex,
        itemId,
        justification
      );

      // Cập nhật state sau khi API thành công
      if (evaluationData) {
        const updatedBody = [...evaluationData.body];
        if (updatedBody[sectionIndex]?.items) {
          const itemIndex = updatedBody[sectionIndex].items.findIndex((item) => item.id === itemId);
          if (itemIndex !== -1) {
            updatedBody[sectionIndex].items[itemIndex] = {
              ...updatedBody[sectionIndex].items[itemIndex],
              justification: justification,
            };
            setEvaluationData({
              ...evaluationData,
              body: updatedBody,
            });
          }
        }
      }

      return updatedItem;
    } catch (err) {
      const errorMessage = 'Không thể cập nhật biện minh. Vui lòng thử lại.';
      setUpdateError(errorMessage);
      console.error('Error updating justification:', err);
      throw err;
    }
  };

  // 6. Hàm xử lý xóa evidence (chỉ cập nhật state, không gọi API)
  const handleEvidenceRemove = (
    sectionIndex: number,
    itemId: string,
    fileIndex: number
  ) => {
    if (evaluationData) {
      setEvaluationData(prev => {
        if (!prev) return prev;
        
        const updatedBody = [...prev.body];
        
        if (updatedBody[sectionIndex]?.items) {
          const itemIndex = updatedBody[sectionIndex].items.findIndex(
            (item) => item.id === itemId
          );
          
          if (itemIndex !== -1) {
            const updatedItem = {
              ...updatedBody[sectionIndex].items[itemIndex],
              evidenceFiles: [
                ...(updatedBody[sectionIndex].items[itemIndex].evidenceFiles || [])
              ]
            };
            
            // Xóa file tại index chỉ định
            updatedItem.evidenceFiles.splice(fileIndex, 1);
            
            updatedBody[sectionIndex].items[itemIndex] = updatedItem;
            
            console.log('✅ Removed evidence file from state:', {
              sectionIndex,
              itemId,
              fileIndex,
              remainingFiles: updatedItem.evidenceFiles.length
            });
          }
        }

        return {
          ...prev,
          body: updatedBody,
        };
      });
    }
  };

  // Hàm xử lý nộp phiếu - SỬA LẠI ĐỂ LƯU TRÊN SERVER
  const handleSubmit = async () => {
    if (!evaluationData) {
      setError('Không có dữ liệu để nộp');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Tạo dữ liệu nộp
      const submissionData = {
        header: evaluationData.header,
        body: evaluationData.body,
        footer: evaluationData.footer,
        submittedAt: new Date().toISOString(),
        role: user?.role,
      };

      // GỬI DỮ LIỆU LÊN SERVER ĐỂ LƯU
      const result = await evaluationService.saveEvaluationAsJSON(
        submissionData,
      );

      if (result.success) {
        setSuccessMessage(`Đã lưu phiếu đánh giá thành công!`);
        setAlreadySubmitted(true);
        setHasDraft(false); // Đã nộp nên không còn bản nháp
      }
    } catch (err) {
      const errorMessage = 'Không thể lưu phiếu đánh giá. Vui lòng thử lại.';
      setError(errorMessage);
      console.error('Error submitting evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Thêm loading state cho draft
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
        <EvaluateFormHeader
          headerData={evaluationData.header}
          titleRole={`DÀNH CHO ${getRoleDisplayName(user?.role || '')}`}
          onHeaderDataChange={handleHeaderDataChange}
        />
      )}

      {/* Body */}
      {evaluationData?.body && (
        <EvaluateFormBody
          title={`PHIẾU ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG VIÊN CHỨC - ${getRoleDisplayName(user?.role || '')}`}
          sections={evaluationData.body}
          onScoreUpdate={handleScoreUpdate}
          onSingleChoiceUpdate={handleSingleChoiceUpdate}
          onHasContentScoreUpdate={handleHasContentScoreUpdate}
          onEvidenceUpload={handleEvidenceUpload}
          onEvidenceRemove={handleEvidenceRemove}
          onJustificationUpdate={handleJustificationUpdate}
        />
      )}

      {/* Footer */}
      {evaluationData?.footer && (
        <EvaluateFormFooter
          footerData={evaluationData.footer}
          onFooterDataChange={handleFooterDataChange}
        />
      )}

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
          disabled={savingDraft || !evaluationData || alreadySubmitted}
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
          disabled={submitting || !evaluationData || alreadySubmitted}
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
            opacity: alreadySubmitted ? 0.7 : 1,
            cursor: alreadySubmitted ? 'not-allowed' : 'pointer',
            transition: '0.3s ease',
          }}
        >
          {/* 🔁 Đang nộp */}
          {submitting ? (
            <>
              <CircularProgress
                size={22}
                thickness={5}
                sx={{
                  color: 'white',
                  animationDuration: '550ms',
                }}
              />
              <Box component="span" sx={{ ml: 1, fontSize: { xs: '0.9rem', sm: 'inherit' } }}>
                Đang nộp phiếu đánh giá...
              </Box>
            </>
          ) : alreadySubmitted ? (
            <>
              <CheckCircleIcon sx={{ color: 'white', fontSize: { xs: 24, sm: 26 } }} />
              <Box component="span" sx={{ fontSize: { xs: '0.9rem', sm: 'inherit' } }}>
                Đã nộp phiếu đánh giá
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

      {/* Thông báo thành công */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}

// Hàm helper để hiển thị tên role
function getRoleDisplayName(role: string): string {
  const roleNames: { [key: string]: string } = {
    truong_don_vi_hanh_chinh: 'TRƯỞNG ĐƠN VỊ KHỐI HÀNH CHÍNH',
    truong_don_vi_giang_day: 'TRƯỞNG ĐƠN VỊ KHỐI GIẢNG DẠY',
    pho_don_vi_hanh_chinh: 'PHÓ TRƯỞNG ĐƠN VỊ KHỐI HÀNH CHÍNH',
    pho_don_vi_giang_day: 'PHÓ TRƯỞNG ĐƠN VỊ KHỐI GIẢNG DẠY',
    vien_chuc_hanh_chinh: 'VIÊN CHỨC HÀNH CHÍNH',
    vien_chuc_giang_day: 'VIÊN CHỨC GIẢNG DẠY',
  };

  return roleNames[role] || 'ĐÁNH GIÁ';
}
