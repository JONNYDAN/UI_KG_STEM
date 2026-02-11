import React, { useState, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";

import {
  Box,
  Grid,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

import { Editor } from "src/utils/custom-editor";

export interface BonusCriterion {
  id: number;
  content: string;
  evidence: boolean;
  isEditing: boolean;
}

interface CriteriaBonusProps {
  onChange?: (criteria: BonusCriterion[]) => void;
  data?: BonusCriterion[];
  externalAdd?: boolean;
}

const CriteriaBonus: React.FC<CriteriaBonusProps> = ({
  onChange,
  data = [],
  externalAdd = false,
}) => {
  const [criteria, setCriteria] = useState<BonusCriterion[]>(data);

  useEffect(() => {
    setCriteria(data);
  }, [data]);

  const pushChange = (updated: BonusCriterion[]) => {
    setCriteria(updated);
    onChange?.(updated);
  };

  const handleAdd = () => {
    const newItem: BonusCriterion = {
      id: Date.now(),
      content: "",
      evidence: false,
      isEditing: true,
    };
    pushChange([...criteria, newItem]);
  };

  const handleChange = (id: number, updates: Partial<BonusCriterion>) => {
    const updated = criteria.map((c) => (c.id === id ? { ...c, ...updates } : c));
    pushChange(updated);
  };

  const handleDelete = (id: number) => {
    pushChange(criteria.filter((c) => c.id !== id));
  };

  return (
    <Box sx={{ mt: 2 }}>
      {criteria.map((item) => (
        <Box
          key={item.id}
          sx={{
            mt: 1.5,
            p: 1.5,
            borderColor: "lightgrey",
            borderRadius: 2,
            backgroundColor: "grey.50",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
          }}
        >
          {item.isEditing ? (
            <Grid container spacing={2} alignItems="center">
              {/* (1) Nội dung */}
              <Grid size={{ xs: 4 }}>
                <Box
                  sx={{
                    backgroundColor: "white",
                    borderRadius: 1,
                    "& .ck-editor__editable": { minHeight: "90px" },
                  }}
                >
                  <CKEditor
                    editor={Editor.ClassicEditor}
                    config={{
                      plugins: Editor.plugins,
                      toolbar: Editor.toolbar,
                      licenseKey: "GPL",
                      placeholder: "Nhập nội dung tiêu chí điểm thưởng...",
                    }}
                    data={item.content}
                    onChange={(_, editor) =>
                      handleChange(item.id, { content: editor.getData() })
                    }
                  />
                </Box>
              </Grid>

              {/* (2) Điểm - bỏ qua nhưng giữ layout */}
              <Grid size={{ xs: 1 }} />

              {/* (3) Tự đánh giá */}
              <Grid size={{ xs: 2 }} />

              {/* (4) Hiệu trưởng */}
              <Grid size={{ xs: 2 }} />

              {/* (5) Minh chứng */}
              <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.evidence}
                      onChange={(e) =>
                        handleChange(item.id, { evidence: e.target.checked })
                      }
                    />
                  }
                  label="Minh chứng"
                />
              </Grid>

              {/* (6) Hành động */}
              <Grid
                container
                size={{ xs: 2 }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Grid container size={{ xs: 12 }}>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{
                        width: "90%",
                        fontSize: 12,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                      onClick={() => handleChange(item.id, { isEditing: false })}
                    >
                      Lưu
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: "left" }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{
                        width: "90%",
                        fontSize: 12,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                      onClick={() => handleDelete(item.id)}
                    >
                      Xóa
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} alignItems="center">
              {/* (1) Nội dung hiển thị */}
              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: 15,
                    fontWeight: 500,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </Grid>

              {/* (2) Điểm - bỏ nhưng giữ layout */}
              <Grid size={{ xs: 1 }} />

              {/* (3) Tự đánh giá */}
              <Grid size={{ xs: 2 }} />

              {/* (4) Hiệu trưởng */}
              <Grid size={{ xs: 2 }} />

              {/* (5) Minh chứng */}
              <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                {item.evidence ? (
                  <Typography variant="body2" color="success.main">
                    ✔
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    —
                  </Typography>
                )}
              </Grid>

              {/* (6) Hành động */}
              <Grid
                container
                size={{ xs: 2 }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Grid container size={{ xs: 12 }}>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      sx={{
                        width: "90%",
                        fontSize: 12,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                      onClick={() => handleChange(item.id, { isEditing: true })}
                    >
                      Sửa
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: "left" }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{
                        width: "90%",
                        fontSize: 12,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                      onClick={() => handleDelete(item.id)}
                    >
                      Xóa
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Box>
      ))}

      {/* ✅ Nút thêm tiêu chí luôn hiển thị */}
      <Box textAlign="left" sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="success"
          onClick={handleAdd}
          sx={{
            borderRadius: 5,
            textTransform: "none",
            px: 2,
            py: 0.8,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          ➕ Thêm tiêu chí
        </Button>
      </Box>
    </Box>
  );
};

export default CriteriaBonus;
