import { CKEditor } from "@ckeditor/ckeditor5-react";
import React, { useState, useEffect, useRef } from "react";

import {
  Box,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
} from "@mui/material";

import { Editor } from "src/utils/custom-editor";

export interface RegularCriterion {
  id: number;
  content: string;
  score: string;
  evidence: boolean;
  isEditing: boolean;
}

interface CriteriaRegularProps {
  onChange?: (criteria: RegularCriterion[]) => void;
  data?: RegularCriterion[];
  externalAdd?: boolean;
}

const CriteriaRegular: React.FC<CriteriaRegularProps> = ({
  onChange,
  data = [],
  externalAdd = false,
}) => {
  const [criteria, setCriteria] = useState<RegularCriterion[]>(data);
  const firstRender = useRef(true); // ✅ tránh gọi onChange lần đầu

  useEffect(() => {
    setCriteria(data);
  }, [data]);

  // ✅ bắn dữ liệu lên cha khi criteria thay đổi
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    onChange?.(criteria);
  }, [criteria]); // ⚠️ không thêm onChange vào deps

  const handleAdd = () => {
    setCriteria((prev) => [
      ...prev,
      {
        id: Date.now(),
        content: "",
        score: "",
        evidence: false,
        isEditing: true,
      },
    ]);
  };

  const handleChange = (id: number, updates: Partial<RegularCriterion>) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDelete = (id: number) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Box sx={{ mt: 2 }}>
      {criteria.map((item) => (
        <Box
          key={item.id}
          sx={{
            mt: 1,
            p: 1.5,
            borderColor: "lightgrey",
            borderRadius: 2,
            backgroundColor: "grey.50",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
          }}
        >
          {item.isEditing ? (
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 4 }}>
                <Box
                  sx={{
                    backgroundColor: "white",
                    borderRadius: 1,
                    "& .ck-editor__editable": {
                      minHeight: "100px",
                      padding: "8px 10px",
                    },
                  }}
                >
                  <CKEditor
                    editor={Editor.ClassicEditor}
                    config={{
                      plugins: Editor.plugins,
                      toolbar: Editor.toolbar,
                      licenseKey: "GPL",
                    }}
                    data={item.content}
                    onChange={(_, editor) =>
                      handleChange(item.id, { content: editor.getData() })
                    }
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Điểm"
                  type="number"
                  value={item.score}
                  onChange={(e) => handleChange(item.id, { score: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 2 }} />
              <Grid size={{ xs: 2 }} />

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

              <Grid
                size={{ xs: 2 }}
                sx={{ display: "flex", gap: 1, justifyContent: "center" }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => handleChange(item.id, { isEditing: false })}
                >
                  💾 Lưu
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleDelete(item.id)}
                >
                  🗑 Xóa
                </Button>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 4 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 15 }}>
                  {item.content.replace(/<[^>]+>/g, "")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                <Typography sx={{ fontWeight: 600 }}>{item.score}</Typography>
              </Grid>
              <Grid size={{ xs: 2 }} />
              <Grid size={{ xs: 2 }} />
              <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                {item.evidence ? "✔" : "—"}
              </Grid>
              <Grid
                size={{ xs: 2 }}
                sx={{ display: "flex", gap: 1, justifyContent: "center" }}
              >
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => handleChange(item.id, { isEditing: true })}
                >
                  ✏️ Sửa
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleDelete(item.id)}
                >
                  🗑 Xóa
                </Button>
              </Grid>
            </Grid>
          )}
        </Box>
      ))}

      {!externalAdd && (
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
      )}
    </Box>
  );
};

export default CriteriaRegular;
